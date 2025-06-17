import { OpenAIEmbeddings } from "@langchain/openai";
import { getWeaviateClient } from "../config/weaviate";
import { Document } from "@langchain/core/documents";

export const getCandidateRetriever = async () => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-ada-002",
  });

  return {
    getRelevantDocuments: async (query: string) => {
      try {
        // Get Weaviate client
        const weaviateClient = await getWeaviateClient();

        // Generate embedding for the query
        const queryEmbedding = await embeddings.embedQuery(query);

        // Perform similarity search using Weaviate's native API
        const result = await weaviateClient.graphql
          .get()
          .withClassName("Candidate")
          .withFields(
            "content fullName email skills experienceYears seniorityLevel location projects"
          )
          .withNearVector({
            vector: queryEmbedding,
          })
          .withLimit(10)
          .do();

        // Check if we have results
        if (!result.data?.Get?.Candidate) {
          console.log("No results found in Weaviate");
          return [];
        }

        // Convert Weaviate results to LangChain documents
        const documents = result.data.Get.Candidate.filter(
          (item: any) => item && item.content
        ) // Filter out null items and items without content
          .map((item: any) => {
            return new Document({
              pageContent: item.content || "",
              metadata: {
                fullName: item.fullName || "",
                email: item.email || "",
                skills: item.skills || [],
                experienceYears: item.experienceYears || 0,
                seniorityLevel: item.seniorityLevel || "",
                location: item.location || "",
                projects: item.projects || [],
              },
            });
          });

        return documents;
      } catch (error) {
        console.error("Error in getRelevantDocuments:", error);
        throw error;
      }
    },
  };
};
