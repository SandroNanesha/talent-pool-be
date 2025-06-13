"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWeaviateSchema = exports.CANDIDATE_CLASS = exports.weaviateClient = void 0;
const weaviate_ts_client_1 = __importDefault(require("weaviate-ts-client"));
if (!process.env.WEAVIATE_HOST) {
    throw new Error("WEAVIATE_HOST environment variable is required");
}
if (!process.env.WEAVIATE_API_KEY) {
    throw new Error("WEAVIATE_API_KEY environment variable is required");
}
exports.weaviateClient = weaviate_ts_client_1.default.client({
    scheme: "https",
    host: process.env.WEAVIATE_HOST,
    headers: {
        Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
    },
});
exports.CANDIDATE_CLASS = "Candidate";
const initializeWeaviateSchema = async () => {
    try {
        const schema = {
            class: exports.CANDIDATE_CLASS,
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
        const exists = await exports.weaviateClient.schema.exists(exports.CANDIDATE_CLASS);
        if (!exists) {
            await exports.weaviateClient.schema.classCreator().withClass(schema).do();
        }
    }
    catch (error) {
        console.error("Error initializing Weaviate schema:", error);
        throw error;
    }
};
exports.initializeWeaviateSchema = initializeWeaviateSchema;
