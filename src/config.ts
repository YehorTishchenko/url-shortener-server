export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5001),
  host: process.env.HOST ?? '0.0.0.0',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD
};
