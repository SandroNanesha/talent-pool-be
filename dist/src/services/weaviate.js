"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWeaviateSchema = exports.processAndStoreFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const weaviate_ts_client_1 = __importDefault(require("weaviate-ts-client"));
const openai_1 = require("@langchain/openai");
const client = weaviate_ts_client_1.default.client({
    scheme: "https",
    host: process.env.WEAVIATE_HOST,
    headers: {
        Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
    },
});
const processAndStoreFile = async (filePath) => {
    try {
        // Read and parse PDF
        const dataBuffer = await promises_1.default.readFile(filePath);
        const pdfData = await (0, pdf_parse_1.default)(dataBuffer);
        const content = pdfData.text;
        // Generate embeddings
        const embeddings = new openai_1.OpenAIEmbeddings({
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
    }
    catch (error) {
        console.error("Error processing PDF:", error);
        throw error;
    }
};
exports.processAndStoreFile = processAndStoreFile;
// Initialize Weaviate schema if needed
const initializeWeaviateSchema = async () => {
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
    }
    catch (error) {
        console.error("Error initializing Weaviate schema:", error);
        throw error;
    }
};
exports.initializeWeaviateSchema = initializeWeaviateSchema;
