import multer from "multer";

export const multerConfig = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const fileUpload = multerConfig.single("file");
