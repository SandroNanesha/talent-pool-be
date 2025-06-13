import weaviate from "weaviate-ts-client";
import "dotenv/config";

if (!process.env.WEAVIATE_HOST) {
  throw new Error("WEAVIATE_HOST environment variable is required");
}

if (!process.env.WEAVIATE_API_KEY) {
  throw new Error("WEAVIATE_API_KEY environment variable is required");
}

//Connect to Weaviate
export const weaviateClient = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_HOST!,
  headers: {
    Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
  },
});

export const CANDIDATE_CLASS = "Candidate";

export const initializeWeaviateSchema = async () => {
  try {
    const schema = {
      class: CANDIDATE_CLASS,
      vectorizer: "none", // We'll provide our own vectors
      properties: [
        {
          name: "fullName",
          dataType: ["text"],
        },
        {
          name: "email",
          dataType: ["text"],
        },
        {
          name: "skills",
          dataType: ["text[]"],
        },
        {
          name: "experienceYears",
          dataType: ["number"],
        },
        {
          name: "seniorityLevel",
          dataType: ["text"],
        },
        {
          name: "location",
          dataType: ["text"],
        },
        {
          name: "projects",
          dataType: ["text[]"],
        },
        {
          name: "rawText",
          dataType: ["text"],
        },
      ],
    };

    // Check if class exists
    const exists = await weaviateClient.schema.exists(CANDIDATE_CLASS);
    if (!exists) {
      try {
        await weaviateClient.schema.classCreator().withClass(schema).do();
        console.log("Successfully created Candidate class in Weaviate");
      } catch (error: any) {
        // If error is about class already existing, we can ignore it
        if (error.message?.includes("already exists")) {
          console.log("Candidate class already exists in Weaviate");
        } else {
          throw error;
        }
      }
    } else {
      console.log("Candidate class already exists in Weaviate");
    }
  } catch (error) {
    console.error("Error initializing Weaviate schema:", error);
    throw error;
  }
};
