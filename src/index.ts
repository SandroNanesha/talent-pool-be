import express from "express";
import dotenv from "dotenv";
import { router as uploadRoutes } from "../uploads";
import { initializeWeaviateSchema } from "./config/weaviate";

dotenv.config();

const app = express();
app.use("/api/v1/upload", uploadRoutes);

const PORT = process.env.PORT || 3000;

// Initialize Weaviate schema before starting the server
const startServer = async () => {
  try {
    await initializeWeaviateSchema();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize Weaviate schema:", error);
    process.exit(1);
  }
};

startServer();

export default app;
