'use strict';

// src/memory/in-memory.ts
function createInMemoryAdapter(config = {}) {
  const maxMessages = config.maxMessages ?? 32;
  const ttlSeconds = config.ttlSeconds ?? 7200;
  const store = /* @__PURE__ */ new Map();
  function cleanup() {
    const now = Date.now();
    for (const [key, session] of store) {
      if (session.expiresAt < now) store.delete(key);
    }
  }
  const cleanupInterval = setInterval(cleanup, 5 * 60 * 1e3);
  if (cleanupInterval.unref) cleanupInterval.unref();
  return {
    async save(sessionId, message) {
      let session = store.get(sessionId);
      if (!session) {
        session = { messages: [], expiresAt: Date.now() + ttlSeconds * 1e3 };
        store.set(sessionId, session);
      }
      session.messages.push(message);
      if (session.messages.length > maxMessages) {
        session.messages = session.messages.slice(-maxMessages);
      }
      session.expiresAt = Date.now() + ttlSeconds * 1e3;
    },
    async getHistory(sessionId) {
      const session = store.get(sessionId);
      if (!session) return [];
      if (session.expiresAt < Date.now()) {
        store.delete(sessionId);
        return [];
      }
      return [...session.messages];
    },
    async clear(sessionId) {
      store.delete(sessionId);
    },
    async getTTL(sessionId) {
      const session = store.get(sessionId);
      if (!session) return -1;
      const remaining = Math.floor((session.expiresAt - Date.now()) / 1e3);
      return remaining > 0 ? remaining : -1;
    }
  };
}

// src/memory/redis-memory.ts
function createRedisMemoryAdapter(config) {
  const { redisClient: redis } = config;
  const maxMessages = config.maxMessages ?? 32;
  const ttlSeconds = config.ttlSeconds ?? 7200;
  const prefix = config.keyPrefix ?? "ai:chat:session:";
  function key(sessionId) {
    return `${prefix}${sessionId}`;
  }
  return {
    async save(sessionId, message) {
      try {
        const k = key(sessionId);
        await redis.rpush(k, JSON.stringify(message));
        await redis.ltrim(k, -maxMessages, -1);
        await redis.expire(k, ttlSeconds);
      } catch (err) {
        console.error("[ai:memory:redis] Failed to save:", err);
      }
    },
    async getHistory(sessionId) {
      try {
        const raw = await redis.lrange(key(sessionId), 0, -1);
        return raw.map((r) => {
          try {
            return JSON.parse(r);
          } catch {
            return null;
          }
        }).filter((msg) => msg !== null);
      } catch (err) {
        console.error("[ai:memory:redis] Failed to retrieve:", err);
        return [];
      }
    },
    async clear(sessionId) {
      try {
        await redis.del(key(sessionId));
      } catch (err) {
        console.error("[ai:memory:redis] Failed to clear:", err);
      }
    },
    async getTTL(sessionId) {
      try {
        return await redis.ttl(key(sessionId));
      } catch {
        return -1;
      }
    }
  };
}

exports.createInMemoryAdapter = createInMemoryAdapter;
exports.createRedisMemoryAdapter = createRedisMemoryAdapter;
//# sourceMappingURL=chunk-FGN2SJLZ.cjs.map
//# sourceMappingURL=chunk-FGN2SJLZ.cjs.map