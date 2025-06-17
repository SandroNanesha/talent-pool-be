import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { router as uploadRoutes } from "./routes/uploadRoute";
import { initializeWeaviateSchema } from "./config/weaviate";
import teamBuilderRoute from "./routes/teamBuilderRoute";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/team-builder", teamBuilderRoute);

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
