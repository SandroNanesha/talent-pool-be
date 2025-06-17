import weaviate from "weaviate-ts-client";
import "dotenv/config";

if (!process.env.WEAVIATE_HOST) {
  throw new Error("WEAVIATE_HOST environment variable is required");
}

if (!process.env.WEAVIATE_API_KEY) {
  throw new Error("WEAVIATE_API_KEY environment variable is required");
}

//Connect to Weaviate with retry logic
const createWeaviateClient = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = weaviate.client({
        scheme: "https",
        host: process.env.WEAVIATE_HOST!,
        headers: {
          Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
        },
      });

      // Test the connection by checking schema
      await client.schema.exists("Candidate");
      console.log("Successfully connected to Weaviate");
      return client;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed to connect to Weaviate:`, error);
      if (i === retries - 1) {
        throw new Error(
          `Failed to connect to Weaviate after ${retries} attempts: ${error}`
        );
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed to create Weaviate client");
};

let weaviateClient: any = null;

export const getWeaviateClient = async () => {
  if (!weaviateClient) {
    weaviateClient = await createWeaviateClient();
  }
  return weaviateClient;
};

export const CANDIDATE_CLASS = "Candidate";

export const initializeWeaviateSchema = async () => {
  try {
    const client = await getWeaviateClient();

    const schema = {
      class: CANDIDATE_CLASS,
      vectorizer: "none", // We'll provide our own vectors
      properties: [
        {
          name: "content",
          dataType: ["text"],
          description: "The main content of the candidate profile",
        },
        {
          name: "fullName",
          dataType: ["text"],
          description: "Full name of the candidate",
        },
        {
          name: "email",
          dataType: ["text"],
          description: "Email address of the candidate",
        },
        {
          name: "skills",
          dataType: ["text[]"],
          description: "List of skills",
        },
        {
          name: "experienceYears",
          dataType: ["number"],
          description: "Years of experience",
        },
        {
          name: "seniorityLevel",
          dataType: ["text"],
          description: "Seniority level of the candidate",
        },
        {
          name: "location",
          dataType: ["text"],
          description: "Location of the candidate",
        },
        {
          name: "projects",
          dataType: ["text[]"],
          description: "List of projects",
        },
      ],
    };

    // Check if class exists
    const exists = await client.schema.exists(CANDIDATE_CLASS);
    if (!exists) {
      try {
        await client.schema.classCreator().withClass(schema).do();
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
