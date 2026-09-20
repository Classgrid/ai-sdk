'use strict';

// src/rag/embeddings.ts
var VoyageEmbedder = class {
  apiKey;
  model;
  apiUrl;
  constructor(config) {
    if (!config.apiKey) throw new Error("Voyage AI requires an API key");
    this.apiKey = config.apiKey;
    this.model = config.model || "voyage-3-large";
    this.apiUrl = config.apiUrl || "https://api.voyageai.com/v1/embeddings";
  }
  async embed(text) {
    const results = await this.embedBatch([text]);
    return results[0];
  }
  async embedBatch(texts) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: this.model
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voyage AI Embedding Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.data.map((item) => item.embedding);
  }
};
var OpenAIEmbedder = class {
  apiKey;
  model;
  apiUrl;
  constructor(config) {
    if (!config.apiKey) throw new Error("OpenAI requires an API key");
    this.apiKey = config.apiKey;
    this.model = config.model || "text-embedding-3-small";
    this.apiUrl = config.apiUrl || "https://api.openai.com/v1/embeddings";
  }
  async embed(text) {
    const results = await this.embedBatch([text]);
    return results[0];
  }
  async embedBatch(texts) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: this.model
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Embedding Error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.data.map((item) => item.embedding);
  }
};
var XenovaEmbedder = class {
  model;
  pipelinePromise;
  constructor(config) {
    this.model = config.model || "Xenova/all-MiniLM-L6-v2";
    const modelName = this.model;
    this.pipelinePromise = (async () => {
      try {
        const { pipeline } = await import('@xenova/transformers');
        return await pipeline("feature-extraction", modelName);
      } catch (err) {
        throw new Error("Failed to load @xenova/transformers. Please install it using `npm install @xenova/transformers`.");
      }
    })();
  }
  async embed(text) {
    const extractor = await this.pipelinePromise;
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }
  async embedBatch(texts) {
    const extractor = await this.pipelinePromise;
    const embeddings = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      embeddings.push(Array.from(output.data));
    }
    return embeddings;
  }
};
function createEmbedder(config) {
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

// src/rag/retrieval.ts
var RagPipeline = class {
  embedder;
  vectorStore;
  constructor(config) {
    this.embedder = config.embedder;
    this.vectorStore = config.vectorStore;
  }
  /**
   * Retrieves relevant chunks for a given text query.
   */
  async retrieve(query, options) {
    const queryEmbedding = await this.embedder.embed(query);
    const chunks = await this.vectorStore.search(queryEmbedding, options);
    const contextText = chunks.map((chunk, index) => {
      let header = `[Document ${index + 1}]`;
      if (chunk.pageTitle) {
        header += ` Title: ${chunk.pageTitle}`;
      }
      if (chunk.section) {
        header += ` Section: ${chunk.section}`;
      }
      return `${header}
${chunk.chunkText}`;
    }).join("\n\n");
    return {
      chunks,
      contextText,
      usedFallback: false
    };
  }
};
var MongoVectorStore = class {
  model;
  // Mongoose Model
  indexName;
  path;
  /**
   * @param mongooseModel The mongoose model that contains the embeddings
   * @param indexName The name of the Atlas Vector Search index (default: "vector_index")
   * @param path The field path where the embedding is stored (default: "embedding")
   */
  constructor(mongooseModel, indexName = "vector_index", path = "embedding") {
    this.model = mongooseModel;
    this.indexName = indexName;
    this.path = path;
  }
  async search(queryEmbedding, options) {
    const topK = options?.topK || 5;
    const numCandidates = options?.numCandidates || topK * 10;
    const pipeline = [
      {
        $vectorSearch: {
          index: this.indexName,
          path: this.path,
          queryVector: queryEmbedding,
          numCandidates,
          limit: topK
        }
      }
    ];
    const filter = {};
    if (options?.pageContext?.slug) {
      filter["pageSlug"] = options.pageContext.slug;
    }
    if (options?.contentTypes && options.contentTypes.length > 0) {
      filter["contentType"] = { $in: options.contentTypes };
    }
    if (Object.keys(filter).length > 0) {
      pipeline[0].$vectorSearch.filter = filter;
    }
    pipeline.push({
      $project: {
        score: { $meta: "vectorSearchScore" },
        documentId: 1,
        documentType: 1,
        chunkIndex: 1,
        chunkText: 1,
        pageSlug: 1,
        pageTitle: 1,
        section: 1,
        contentType: 1,
        sourceUrl: 1
      }
    });
    const results = await this.model.aggregate(pipeline).exec();
    const minScore = options?.minScore || 0;
    const chunks = results.filter((res) => res.score >= minScore).map((res) => ({
      id: res._id.toString(),
      documentId: res.documentId,
      documentType: res.documentType,
      chunkIndex: res.chunkIndex,
      chunkText: res.chunkText,
      pageSlug: res.pageSlug,
      pageTitle: res.pageTitle,
      section: res.section,
      contentType: res.contentType,
      sourceUrl: res.sourceUrl,
      score: res.score
    }));
    return chunks;
  }
};

exports.MongoVectorStore = MongoVectorStore;
exports.OpenAIEmbedder = OpenAIEmbedder;
exports.RagPipeline = RagPipeline;
exports.VoyageEmbedder = VoyageEmbedder;
exports.XenovaEmbedder = XenovaEmbedder;
exports.createEmbedder = createEmbedder;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map