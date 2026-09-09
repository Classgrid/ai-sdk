export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  provider?: "resend" | "sendgrid";
}

export class EmailAdapter {
  private apiKey: string;
  private fromEmail: string;
  private provider: "resend" | "sendgrid";

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.provider = config.provider || "resend";
  }

  /**
   * Parse an inbound email webhook payload (Resend format as default).
   */
  parseWebhook(payload: any): { from: string; subject: string; text: string } | null {
    try {
      if (this.provider === "resend") {
        // Resend inbound webhook format
        return {
          from: payload.from,
          subject: payload.subject,
          text: payload.text,
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
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (this.provider === "resend") {
      await this.sendViaResend(to, subject, text);
    } else {
      throw new Error(`Provider ${this.provider} not implemented yet for sending.`);
    }
  }

  private async sendViaResend(to: string, subject: string, text: string): Promise<void> {
    const url = "https://api.resend.com/emails";
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API Error: ${response.status} - ${errorText}`);
    }
  }
}
