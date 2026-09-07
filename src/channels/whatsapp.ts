import type { AIChannel, ChatMessage } from "../types.js";

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
}

export class WhatsAppAdapter {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config: WhatsAppConfig) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || "v18.0";
  }

  /**
   * Parses an incoming WhatsApp webhook payload.
   * Returns the extracted text message and the sender's phone number.
   */
  parseWebhook(payload: any): { from: string; text: string } | null {
    try {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      
      if (!message || message.type !== "text") return null;

      return {
        from: message.from,
        text: message.text.body,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Sends a text message to a WhatsApp user via the Cloud API.
   */
  async sendMessage(to: string, text: string): Promise<void> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: text },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API Error: ${response.status} - ${errorText}`);
    }
  }
}
