import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { Request, Response } from "express";
import weaviate from "weaviate-ts-client";
import { OpenAIEmbeddings } from "@langchain/openai";

const client = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_HOST!,
  headers: {
    Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
  },
});

export const processAndStoreFile = async (filePath: string) => {
  try {
    // Read and parse PDF
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const content = pdfData.text;

    // Generate embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const [vector] = await embeddings.embedDocuments([content]);

    // Store in Weaviate
    const result = await client.data
      .creator()
      .withClassName("Candidate")
      .withProperties({
        fullName: "Unknown",
        skills: [],
        experienceYears: 0,
        content: content, // Store the original text content
      })
      .withVector(vector)
      .do();

    return result;
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
};

// Initialize Weaviate schema if needed
export const initializeWeaviateSchema = async () => {
  try {
    const schema = {
      class: "Candidate",
      vectorizer: "none", // We'll provide our own vectors
      properties: [
        {
          name: "fullName",
          dataType: ["string"],
        },
        {
          name: "skills",
          dataType: ["string[]"],
        },
        {
          name: "experienceYears",
          dataType: ["number"],
        },
        {
          name: "content",
          dataType: ["text"],
        },
      ],
    };

    // Check if class exists
    const exists = await client.schema.exists("Candidate");
    if (!exists) {
      await client.schema.classCreator().withClass(schema).do();
    }
  } catch (error) {
    console.error("Error initializing Weaviate schema:", error);
    throw error;
  }
};
