import express, { Request, Response } from "express";
import { fileUpload } from "../src/utils";
import { processAndStoreFile } from "../src/services/fileProcessor";

export const router = express.Router();

// POST route for file upload
router.post(
  "/",
  fileUpload,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      // Process the file and store in Weaviate
      const result = await processAndStoreFile(req.file);

      res.status(200).json({
        message: "File processed and stored successfully",
        file: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        processingResult: result,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ message: "Error processing file" });
    }
  }
);
