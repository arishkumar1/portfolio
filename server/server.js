import dotenv from "dotenv";
dotenv.config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters");
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "node:path";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import api from "./routes/api.js";
import errorHandler from "./middleware/errorHandler.js";
const app = express();
app.set("trust proxy", 1);
const allowedOrigins = new Set(
  (process.env.CLIENT_URLS || process.env.CLIENT_URL || "https://arish-portfolio-web.onrender.com")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], baseUri: ["'self'"], objectSrc: ["'none'"],
    frameAncestors: ["'none'"], formAction: ["'self'"],
    scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", "https:"],
    imgSrc: ["'self'", "data:", "https:"], connectSrc: ["'self'", "https:"],
  } },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true, preload: false }
    : false,
}));
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production" && !req.secure)
    return res.redirect(308, `${process.env.PUBLIC_API_ORIGIN || "https://arishportfolio.onrender.com"}${req.originalUrl}`);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin")?.replace(/\/$/, "");
    if (!origin || !allowedOrigins.has(origin)) {
      console.warn(JSON.stringify({ event: "security.origin_rejected", ip: req.ip, method: req.method, path: req.path, at: new Date().toISOString() }));
      return res.status(403).json({ message: "Request origin not allowed" });
    }
  }
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, "")))
      return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again later." },
}));
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
app.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "unavailable" });
});
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
