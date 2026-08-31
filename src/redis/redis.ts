import { createClient, type RedisClientType } from 'redis';
import { config } from '../config.ts';

export const redisClient: RedisClientType = createClient({
  url: config.redisUrl,
  password: config.redisPassword
});

export async function connectRedis(onError: (err: Error) => void): Promise<void> {
  redisClient.on('error', onError);
  await redisClient.connect();
}
