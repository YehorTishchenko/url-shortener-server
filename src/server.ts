import { app } from './app.ts';
import { config } from './config.ts';
import { connectRedis, redisClient } from './redis/redis.ts';
import { db, pgClient } from './db/client.ts';

async function start(): Promise<void> {
  await Promise.all([
    connectRedis((err) => app.log.error(err, 'Redis connection error')),
    db.execute('select 1')
  ]);
  app.log.info('Successfully connected to Redis and Postgres');

  await app.listen({ port: config.port, host: config.host });
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  app.log.info(`Received ${signal}, shutting down`);
  try {
    await app.close();
  } catch (err) {
    app.log.error(err, 'Error closing Fastify');
  }

  const results = await Promise.allSettled([
    redisClient.quit(),
    pgClient.end({ timeout: 5 })
  ]);

  let failed = false;
  for (const result of results) {
    if (result.status === 'rejected') {
      failed = true;
      app.log.error(result.reason);
    }
  }

  process.exit(failed ? 1 : 0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
