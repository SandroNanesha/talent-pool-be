import { ChatOpenAI } from "@langchain/openai";
import { teamBuilderPrompt } from "../prompts/teamBuilderPrompt";
import { getCandidateRetriever } from "../retrievers/candidateRetriever";
import { Document } from "@langchain/core/documents";
import { initializeWeaviateSchema } from "../config/weaviate";

export const teamBuilderAgent = async (
  project: string,
  requirements: string
) => {
  try {
    // Initialize Weaviate schema first
    await initializeWeaviateSchema();

    const retriever = await getCandidateRetriever();
    console.log("VectorStore debug:", retriever);

    // Get relevant documents
    const docs = await retriever.getRelevantDocuments(
      project + " " + requirements
    );

    if (!docs || docs.length === 0) {
      throw new Error("No relevant candidates found");
    }

    const candidates = docs
      .map((doc: Document) => doc.pageContent)
      .join("\n---\n");

    const prompt = teamBuilderPrompt
      .replace("{project}", project)
      .replace("{candidates}", candidates)
      .replace("{requirements}", requirements);

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    });

    const response = await llm.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error("Error in teamBuilderAgent:", error);
    throw error;
  }
};
