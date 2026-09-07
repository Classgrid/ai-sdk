import type { Embedder } from "./embeddings.js";
import type { RetrieveOptions, RetrievalResult, RetrievedChunk } from "../types.js";

/**
 * Interface for a Document/Vector store.
 */
export interface VectorStore {
  /**
   * Performs a vector search given the query embedding.
   */
  search(queryEmbedding: number[], options?: RetrieveOptions): Promise<RetrievedChunk[]>;
}

export interface RagPipelineConfig {
  embedder: Embedder;
  vectorStore: VectorStore;
}

/**
 * Main pipeline for Retrieval-Augmented Generation operations.
 */
export class RagPipeline {
  private embedder: Embedder;
  private vectorStore: VectorStore;

  constructor(config: RagPipelineConfig) {
    this.embedder = config.embedder;
    this.vectorStore = config.vectorStore;
  }

  /**
   * Retrieves relevant chunks for a given text query.
   */
  async retrieve(query: string, options?: RetrieveOptions): Promise<RetrievalResult> {
    const queryEmbedding = await this.embedder.embed(query);
    const chunks = await this.vectorStore.search(queryEmbedding, options);
    
    // Compile chunks into a single context text for LLM ingestion
    const contextText = chunks.map((chunk, index) => {
      let header = `[Document ${index + 1}]`;
      if (chunk.pageTitle) {
        header += ` Title: ${chunk.pageTitle}`;
      }
      if (chunk.section) {
        header += ` Section: ${chunk.section}`;
      }
      return `${header}\n${chunk.chunkText}`;
    }).join("\n\n");

    return {
      chunks,
      contextText,
      usedFallback: false,
    };
  }
}

/**
 * Example implementation of a MongoDB Atlas Vector Store using Mongoose.
 */
export class MongoVectorStore implements VectorStore {
  private model: any; // Mongoose Model
  private indexName: string;
  private path: string;

  /**
   * @param mongooseModel The mongoose model that contains the embeddings
   * @param indexName The name of the Atlas Vector Search index (default: "vector_index")
   * @param path The field path where the embedding is stored (default: "embedding")
   */
  constructor(mongooseModel: any, indexName: string = "vector_index", path: string = "embedding") {
    this.model = mongooseModel;
    this.indexName = indexName;
    this.path = path;
  }

  async search(queryEmbedding: number[], options?: RetrieveOptions): Promise<RetrievedChunk[]> {
    const topK = options?.topK || 5;
    const numCandidates = options?.numCandidates || topK * 10;
    
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: this.indexName,
          path: this.path,
          queryVector: queryEmbedding,
          numCandidates,
          limit: topK,
        }
      }
    ];

    // Build the filter
    const filter: any = {};
    if (options?.pageContext?.slug) {
      filter["pageSlug"] = options.pageContext.slug;
    }
    if (options?.contentTypes && options.contentTypes.length > 0) {
      filter["contentType"] = { $in: options.contentTypes };
    }
    
    if (Object.keys(filter).length > 0) {
      pipeline[0].$vectorSearch.filter = filter;
    }

    // Project the score
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

    // Optionally filter by minScore in memory if the DB query didn't handle it
    const minScore = options?.minScore || 0;
    
    const chunks: RetrievedChunk[] = results
      .filter((res: any) => res.score >= minScore)
      .map((res: any) => ({
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
        score: res.score,
      }));

    return chunks;
  }
}
