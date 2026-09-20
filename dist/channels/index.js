// src/channels/whatsapp.ts
var WhatsAppAdapter = class {
  phoneNumberId;
  accessToken;
  apiVersion;
  constructor(config) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || "v18.0";
  }
  /**
   * Parses an incoming WhatsApp webhook payload.
   * Returns the extracted text message and the sender's phone number.
   */
  parseWebhook(payload) {
    try {
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (!message || message.type !== "text") return null;
      return {
        from: message.from,
        text: message.text.body
      };
    } catch (e) {
      return null;
    }
  }
  /**
   * Sends a text message to a WhatsApp user via the Cloud API.
   */
  async sendMessage(to, text) {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: text }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API Error: ${response.status} - ${errorText}`);
    }
  }
};

// src/channels/telegram.ts
var TelegramAdapter = class {
  botToken;
  constructor(config) {
    this.botToken = config.botToken;
  }
  /**
   * Parses an incoming Telegram webhook payload.
   * Returns the chat ID and the message text.
   */
  parseWebhook(payload) {
    try {
      const message = payload.message;
      if (!message || !message.text) return null;
      return {
        chatId: message.chat.id,
        text: message.text
      };
    } catch (e) {
      return null;
    }
  }
  /**
   * Sends a message to a Telegram chat.
   */
  async sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API Error: ${response.status} - ${errorText}`);
    }
  }
};

// src/channels/email.ts
var EmailAdapter = class {
  apiKey;
  fromEmail;
  provider;
  constructor(config) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.provider = config.provider || "resend";
  }
  /**
   * Parse an inbound email webhook payload (Resend format as default).
   */
  parseWebhook(payload) {
    try {
      if (this.provider === "resend") {
        return {
          from: payload.from,
          subject: payload.subject,
          text: payload.text
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  /**
   * Sends an email response.
   */
  async sendEmail(to, subject, text) {
    if (this.provider === "resend") {
      await this.sendViaResend(to, subject, text);
    } else {
      throw new Error(`Provider ${this.provider} not implemented yet for sending.`);
    }
  }
  async sendViaResend(to, subject, text) {
    const url = "https://api.resend.com/emails";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        text
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API Error: ${response.status} - ${errorText}`);
    }
  }
};

export { EmailAdapter, TelegramAdapter, WhatsAppAdapter };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map