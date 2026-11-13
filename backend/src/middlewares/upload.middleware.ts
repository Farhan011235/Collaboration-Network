import fs from "fs";
import path from "path";
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

// Where uploaded document files are stored on disk. This folder is
// gitignored - the files themselves never go into the repo.
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Create the folder once, on startup, if it doesn't exist yet.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// The document types we accept.
const allowedMime = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "application/zip",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // A collision-proof stored name; the original name is kept in the DB.
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest("Unsupported file type"));
  },
});

// Wraps multer so its errors become clean ApiErrors instead of a raw 500.
export const uploadSingle =
  (field: string) => (req: Request, res: Response, next: NextFunction) => {
    multerUpload.single(field)(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(ApiError.badRequest("File is too large (max 10 MB)"));
        }
        return next(ApiError.badRequest(err.message));
      }
      if (err) return next(err); // ApiError from the fileFilter, etc.
      return next();
    });
  };
