import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getWeaviateClient, CANDIDATE_CLASS } from "../config/weaviate";
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
    const client = await getWeaviateClient();
    const results = await Promise.all(
      chunks.map(async (chunk, index) => {
        // Extract information from the chunk using regex or other methods
        const content = chunk.pageContent;

        // Extract email
        const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);
        const email = emailMatch ? emailMatch[0] : "";

        // Extract name (assuming it's at the beginning of the content)
        const nameMatch = content.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
        const fullName = nameMatch ? nameMatch[0] : "";

        // Extract skills (assuming they're listed after "Skills:" or similar)
        const skillsMatch = content.match(/Skills:?\s*([^.\n]+)/i);
        const skills = skillsMatch
          ? skillsMatch[1]
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        // Extract experience years
        const expMatch = content.match(
          /(\d+)\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i
        );
        const experienceYears = expMatch ? parseInt(expMatch[1]) : 0;

        // Extract seniority level
        const seniorityMatch = content.match(
          /(?:Senior|Junior|Mid-level|Lead|Principal)\s+(?:Developer|Engineer|Architect)/i
        );
        const seniorityLevel = seniorityMatch ? seniorityMatch[0] : "";

        // Extract location
        const locationMatch = content.match(
          /(?:Location|Based in|From):?\s*([^.\n]+)/i
        );
        const location = locationMatch ? locationMatch[1].trim() : "";

        // Extract projects
        const projectsMatch = content.match(/Projects:?\s*([^.\n]+)/i);
        const projects = projectsMatch
          ? projectsMatch[1]
              .split(/[,;]/)
              .map((p) => p.trim())
              .filter(Boolean)
          : [];

        return client.data
          .creator()
          .withClassName(CANDIDATE_CLASS)
          .withProperties({
            content: content,
            fullName: fullName,
            email: email,
            skills: skills,
            experienceYears: experienceYears,
            seniorityLevel: seniorityLevel,
            location: location,
            projects: projects,
          })
          .withVector(vectors[index])
          .do();
      })
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
