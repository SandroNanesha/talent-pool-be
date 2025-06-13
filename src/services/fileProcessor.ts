import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { OpenAIEmbeddings } from "@langchain/openai";
import { weaviateClient, CANDIDATE_CLASS } from "../config/weaviate";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const processAndStoreFile = async (file: Express.Multer.File) => {
  try {
    // Parse PDF directly from buffer
    const pdfData = await pdfParse(file.buffer);
    const content = pdfData.text;

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([content]);

    // Generate embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });
    const vectors = await embeddings.embedDocuments(
      chunks.map((chunk) => chunk.pageContent)
    );

    // Store chunks in Weaviate
    const results = await Promise.all(
      chunks.map((chunk, index) =>
        weaviateClient.data
          .creator()
          .withClassName(CANDIDATE_CLASS)
          .withProperties({
            rawText: chunk.pageContent,
          })
          .withVector(vectors[index])
          .do()
      )
    );

    return {
      totalChunks: chunks.length,
      results,
    };
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
};
