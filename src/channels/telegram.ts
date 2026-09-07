import type { AIChannel } from "../types.js";

export interface TelegramConfig {
  botToken: string;
}

export class TelegramAdapter {
  private botToken: string;

  constructor(config: TelegramConfig) {
    this.botToken = config.botToken;
  }

  /**
   * Parses an incoming Telegram webhook payload.
   * Returns the chat ID and the message text.
   */
  parseWebhook(payload: any): { chatId: number; text: string } | null {
    try {
      const message = payload.message;
      if (!message || !message.text) return null;

      return {
        chatId: message.chat.id,
        text: message.text,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Sends a message to a Telegram chat.
   */
  async sendMessage(chatId: number | string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API Error: ${response.status} - ${errorText}`);
    }
  }
}
