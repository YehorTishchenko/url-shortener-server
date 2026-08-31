import Fastify from 'fastify';
import { config } from './config.ts';
import { connectRedis, redisClient } from './redis/redis.ts';
import { db, pgClient } from './db/client.ts';

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
  await Promise.all([
    connectRedis((err) => fastify.log.error(err, 'Redis connection error')),
    db.execute('select 1')
  ]);
  fastify.log.info('Successfully connected to Redis and Postgres');

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
  } catch (err) {
    fastify.log.error(err, 'Error closing Fastify');
  }

  const results = await Promise.allSettled([
    redisClient.quit(),
    pgClient.end({ timeout: 5 })
  ]);

  let failed = false;
  for (const result of results) {
    if (result.status === 'rejected') {
      failed = true;
      fastify.log.error(result.reason);
    }
  }

  process.exit(failed ? 1 : 0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
