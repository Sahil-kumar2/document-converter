import { index } from "../config/pinecone.js";
import { createEmbedding } from "./embedService.js";

export const getRelevantChunks = async (query, topK = 3) => {
  try {
    const embedding = await createEmbedding(query);

    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    return results.matches.map((match) => match.metadata);
  } catch (error) {
    console.error("RAG retrieval error:", error);
    return [];
  }
};