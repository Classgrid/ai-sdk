import type { EmbedderConfig } from "../types.js";

/**
 * Interface for an Embedding provider.
 */
export interface Embedder {
  /**
   * Generates an embedding vector for the given text.
   */
  embed(text: string): Promise<number[]>;
  /**
   * Generates embedding vectors for a batch of texts.
   */
  embedBatch(texts: string[]): Promise<number[][]>;
}

export class VoyageEmbedder implements Embedder {
  private apiKey: string;
  private model: string;
  private apiUrl: string;

  constructor(config: EmbedderConfig) {
    if (!config.apiKey) throw new Error("Voyage AI requires an API key");
    this.apiKey = config.apiKey;
    this.model = config.model || "voyage-3-large";
    this.apiUrl = config.apiUrl || "https://api.voyageai.com/v1/embeddings";
  }

  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voyage AI Embedding Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    return data.data.map((item: any) => item.embedding);
  }
}

export class OpenAIEmbedder implements Embedder {
  private apiKey: string;
  private model: string;
  private apiUrl: string;

  constructor(config: EmbedderConfig) {
    if (!config.apiKey) throw new Error("OpenAI requires an API key");
    this.apiKey = config.apiKey;
    this.model = config.model || "text-embedding-3-small";
    this.apiUrl = config.apiUrl || "https://api.openai.com/v1/embeddings";
  }

  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Embedding Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    return data.data.map((item: any) => item.embedding);
  }
}

export class XenovaEmbedder implements Embedder {
  private model: string;
  private pipelinePromise: Promise<any>;

  constructor(config: EmbedderConfig) {
    this.model = config.model || "Xenova/all-MiniLM-L6-v2";
    const modelName = this.model;
    
    // Dynamically import to avoid breaking environments that don't have it installed
    this.pipelinePromise = (async () => {
      try {
        // @ts-ignore: optional peer dependency
        const { pipeline } = await import("@xenova/transformers");
        return await pipeline("feature-extraction", modelName);
      } catch (err) {
        throw new Error("Failed to load @xenova/transformers. Please install it using `npm install @xenova/transformers`.");
      }
    })();
  }

  async embed(text: string): Promise<number[]> {
    const extractor = await this.pipelinePromise;
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const extractor = await this.pipelinePromise;
    const embeddings = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      embeddings.push(Array.from(output.data) as number[]);
    }
    return embeddings;
  }
}

/**
 * Creates an Embedder instance based on the provided configuration.
 */
export function createEmbedder(config: EmbedderConfig): Embedder {
  switch (config.provider) {
    case "voyage":
      return new VoyageEmbedder(config);
    case "openai":
      return new OpenAIEmbedder(config);
    case "xenova":
      return new XenovaEmbedder(config);
    case "custom":
      throw new Error("Custom embedder should be implemented by the user and passed directly.");
    default:
      throw new Error(`Unsupported embedding provider: ${config.provider}`);
  }
}
