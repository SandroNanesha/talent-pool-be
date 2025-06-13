"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const utils_1 = require("../src/utils");
const fileProcessor_1 = require("../src/services/fileProcessor");
exports.router = express_1.default.Router();
// POST route for file upload
exports.router.post("/", utils_1.fileUpload, async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // Process the file and store in Weaviate
        const result = await (0, fileProcessor_1.processAndStoreFile)(req.file.path);
        res.status(200).json({
            message: "File processed and stored successfully",
            file: {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
            processingResult: result,
        });
    }
    catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ message: "Error processing file" });
    }
});
