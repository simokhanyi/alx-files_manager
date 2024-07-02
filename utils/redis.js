import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
  constructor() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  isAlive() {
    return this.client.isReady;
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Failed to get key from Redis:', error);
      return null; // Return null if there is an error
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, {
        EX: duration
      });
    } catch (error) {
      console.error('Failed to set key in Redis:', error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Failed to delete key from Redis:', error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
