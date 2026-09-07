/**
 * @classgrid/ai — Redis Session Memory
 *
 * Production-grade session memory backed by Redis with:
 *   - Sliding window TTL (session stays alive while user is active)
 *   - Automatic message trimming (prevents token explosion)
 *   - Graceful fallback if Redis is unavailable
 */

import type { ChatHistoryItem, MemoryAdapter } from "../types.js";

export type RedisMemoryConfig = {
  /** An ioredis client instance */
  redisClient: {
    rpush(key: string, value: string): Promise<number>;
    ltrim(key: string, start: number, stop: number): Promise<string>;
    expire(key: string, seconds: number): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    del(key: string): Promise<number>;
    ttl(key: string): Promise<number>;
  };
  /** Max messages per session (default: 32) */
  maxMessages?: number;
  /** TTL in seconds (default: 7200 = 2 hours) */
  ttlSeconds?: number;
  /** Key prefix (default: "ai:chat:session:") */
  keyPrefix?: string;
};

/**
 * Create a Redis-backed session memory adapter.
 *
 * @example
 * ```ts
 * import Redis from "ioredis";
 * import { createRedisMemoryAdapter } from "@classgrid/ai/memory";
 *
 * const redis = new Redis(process.env.REDIS_URL);
 * const memory = createRedisMemoryAdapter({ redisClient: redis });
 *
 * await memory.save("session-123", { role: "user", content: "Hello!" });
 * const history = await memory.getHistory("session-123");
 * ```
 */
export function createRedisMemoryAdapter(config: RedisMemoryConfig): MemoryAdapter {
  const { redisClient: redis } = config;
  const maxMessages = config.maxMessages ?? 32;
  const ttlSeconds = config.ttlSeconds ?? 7200;
  const prefix = config.keyPrefix ?? "ai:chat:session:";

  function key(sessionId: string): string {
    return `${prefix}${sessionId}`;
  }

  return {
    async save(sessionId: string, message: ChatHistoryItem): Promise<void> {
      try {
        const k = key(sessionId);
        await redis.rpush(k, JSON.stringify(message));
        await redis.ltrim(k, -maxMessages, -1);
        await redis.expire(k, ttlSeconds);
      } catch (err) {
        console.error("[ai:memory:redis] Failed to save:", err);
      }
    },

    async getHistory(sessionId: string): Promise<ChatHistoryItem[]> {
      try {
        const raw = await redis.lrange(key(sessionId), 0, -1);
        return raw
          .map((r) => {
            try {
              return JSON.parse(r) as ChatHistoryItem;
            } catch {
              return null;
            }
          })
          .filter((msg): msg is ChatHistoryItem => msg !== null);
      } catch (err) {
        console.error("[ai:memory:redis] Failed to retrieve:", err);
        return [];
      }
    },

    async clear(sessionId: string): Promise<void> {
      try {
        await redis.del(key(sessionId));
      } catch (err) {
        console.error("[ai:memory:redis] Failed to clear:", err);
      }
    },

    async getTTL(sessionId: string): Promise<number> {
      try {
        return await redis.ttl(key(sessionId));
      } catch {
        return -1;
      }
    },
  };
}
