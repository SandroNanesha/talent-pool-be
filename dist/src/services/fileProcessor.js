"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAndStoreFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const openai_1 = require("@langchain/openai");
const weaviate_1 = require("../config/weaviate");
const text_splitter_1 = require("langchain/text_splitter");
const processAndStoreFile = async (filePath) => {
    try {
        // Read and parse PDF
        const dataBuffer = await promises_1.default.readFile(filePath);
        const pdfData = await (0, pdf_parse_1.default)(dataBuffer);
        const content = pdfData.text;
        // Split text into chunks
        const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await textSplitter.createDocuments([content]);
        // Generate embeddings
        const embeddings = new openai_1.OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-ada-002",
        });
        const vectors = await embeddings.embedDocuments(chunks.map((chunk) => chunk.pageContent));
        // Store chunks in Weaviate
        const results = await Promise.all(chunks.map((chunk, index) => weaviate_1.weaviateClient.data
            .creator()
            .withClassName(weaviate_1.CANDIDATE_CLASS)
            .withProperties({
            rawText: chunk.pageContent,
        })
            .withVector(vectors[index])
            .do()));
        return {
            totalChunks: chunks.length,
            results,
        };
    }
    catch (error) {
        console.error("Error processing file:", error);
        throw error;
    }
};
exports.processAndStoreFile = processAndStoreFile;
