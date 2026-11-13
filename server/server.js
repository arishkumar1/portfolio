import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import connectDB from "./config/db.js";
import api from "./routes/api.js";
import errorHandler from "./middleware/errorHandler.js";
const app = express();
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads");
app.get("/uploads/download/:filename", (req, res, next) => {
  const filename = path.basename(req.params.filename);
  if (!filename || filename !== req.params.filename)
    return res.status(400).json({ message: "Invalid file name" });
  res.download(path.join(uploadDirectory, filename), filename, (error) => {
    if (error && !res.headersSent) next(error);
  });
});
app.use("/uploads", express.static(uploadDirectory));
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", api);
app.use(errorHandler);
const port = process.env.PORT || 5000;
connectDB()
  .then(() =>
    app.listen(port, () => console.log(`Server listening on ${port}`)),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
