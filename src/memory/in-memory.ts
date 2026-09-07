/**
 * @classgrid/ai — In-Memory Session Store
 *
 * A simple, zero-dependency session memory for development and testing.
 * For production, use the Redis adapter instead.
 */

import type { ChatHistoryItem, MemoryAdapter } from "../types.js";

type Session = {
  messages: ChatHistoryItem[];
  expiresAt: number;
};

export type InMemoryConfig = {
  maxMessages?: number;
  ttlSeconds?: number;
};

/**
 * Create an in-memory session memory adapter.
 *
 * @example
 * ```ts
 * import { createInMemoryAdapter } from "@classgrid/ai/memory";
 *
 * const memory = createInMemoryAdapter({ maxMessages: 32, ttlSeconds: 7200 });
 *
 * await memory.save("session-123", { role: "user", content: "Hello!" });
 * const history = await memory.getHistory("session-123");
 * ```
 */
export function createInMemoryAdapter(config: InMemoryConfig = {}): MemoryAdapter {
  const maxMessages = config.maxMessages ?? 32;
  const ttlSeconds = config.ttlSeconds ?? 7200;
  const store = new Map<string, Session>();

  function cleanup() {
    const now = Date.now();
    for (const [key, session] of store) {
      if (session.expiresAt < now) store.delete(key);
    }
  }

  // Cleanup expired sessions every 5 minutes
  const cleanupInterval = setInterval(cleanup, 5 * 60 * 1000);
  if (cleanupInterval.unref) cleanupInterval.unref();

  return {
    async save(sessionId: string, message: ChatHistoryItem): Promise<void> {
      let session = store.get(sessionId);
      if (!session) {
        session = { messages: [], expiresAt: Date.now() + ttlSeconds * 1000 };
        store.set(sessionId, session);
      }

      session.messages.push(message);

      // Trim to max messages
      if (session.messages.length > maxMessages) {
        session.messages = session.messages.slice(-maxMessages);
      }

      // Reset TTL (sliding window)
      session.expiresAt = Date.now() + ttlSeconds * 1000;
    },

    async getHistory(sessionId: string): Promise<ChatHistoryItem[]> {
      const session = store.get(sessionId);
      if (!session) return [];
      if (session.expiresAt < Date.now()) {
        store.delete(sessionId);
        return [];
      }
      return [...session.messages];
    },

    async clear(sessionId: string): Promise<void> {
      store.delete(sessionId);
    },

    async getTTL(sessionId: string): Promise<number> {
      const session = store.get(sessionId);
      if (!session) return -1;
      const remaining = Math.floor((session.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : -1;
    },
  };
}
