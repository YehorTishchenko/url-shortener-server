import Fastify from 'fastify';
import { config } from './config.ts';
import { connectRedis, redisClient } from './redis/redis.ts';

const fastify = Fastify({
  logger: true
});

// Declare a route
fastify.get('/', function (request, reply) {
  reply.send({ hello: 'world' });
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok' };
});

async function start(): Promise<void> {
  await connectRedis((err) => fastify.log.error(err, 'Redis connection error'));
  fastify.log.info('Successfully connected to Redis');

  await fastify.listen({ port: config.port, host: config.host });
}

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  fastify.log.info(`Received ${signal}, shutting down`);
  try {
    await fastify.close();
    await redisClient.quit();
    process.exit(0);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
