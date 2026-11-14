import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import {
  Admin,
  Asset,
  Profile,
  About,
  Skill,
  Project,
  Experience,
  Education,
  Certificate,
  Message,
} from "../models/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { validatePasswordChange, validateResourceBody } from "../middleware/validate.js";
const r = Router();
const models = {
  profile: Profile,
  about: About,
  skills: Skill,
  projects: Project,
  experience: Experience,
  education: Education,
  certificates: Certificate,
  messages: Message,
};
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
});
const contactLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again later." },
});
const uploadLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many upload attempts. Try again later." },
});
const sessionDurationMs = 30 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" && process.env.COOKIE_SAME_SITE === "none" ? "none" : "lax",
  ...(process.env.NODE_ENV === "production" && process.env.COOKIE_SAME_SITE === "none" ? { partitioned: true } : {}),
};
async function sendAsset(req, res, next, asDownload = false) {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(404).json({ message: "File not found" });
    const asset = await Asset.findById(req.params.id).lean();
    if (!asset) return res.status(404).json({ message: "File not found" });
    res.set({
      "Content-Type": asset.contentType,
      "Content-Length": asset.data.length,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    if (asDownload) res.attachment(asset.filename);
    else res.set("Content-Disposition", "inline");
    res.send(asset.data);
  } catch (error) {
    next(error);
  }
}
r.get("/media/download/:id", (req, res, next) =>
  sendAsset(req, res, next, true),
);
r.get("/media/:id", (req, res, next) => sendAsset(req, res, next));
r.post("/auth/login", loginLimit, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || username.length > 100 ||
        typeof password !== "string" || password.length > 128)
      return res.status(401).json({ message: "Invalid username or password" });
    const a = await Admin.findOne({ username: username.trim() });
    const locked = a?.lockUntil && a.lockUntil > new Date();
    const passwordMatches = a && !locked && await bcrypt.compare(password, a.passwordHash);
    if (!passwordMatches) {
      if (a && !locked) {
        a.failedLoginAttempts = (a.failedLoginAttempts || 0) + 1;
        if (a.failedLoginAttempts >= 5) {
          a.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          a.failedLoginAttempts = 0;
        }
        await a.save();
      }
      console.warn(JSON.stringify({ event: "auth.login_failed", ip: req.ip, at: new Date().toISOString() }));
      return res.status(401).json({ message: "Invalid username or password" });
    }
    a.failedLoginAttempts = 0;
    a.lockUntil = null;
    await a.save();
    const token = jwt.sign(
      { id: a._id.toString(), ver: a.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "30m" },
    );
    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: sessionDurationMs,
    });
    res.json({ username: a.username });
  } catch (e) {
    next(e);
  }
});
r.get("/auth/me", authMiddleware, (req, res) =>
  res.json({ username: req.admin.username }),
);
r.post("/auth/logout", (req, res) =>
  res.clearCookie("token", cookieOptions).json({ message: "Logged out" }),
);
r.put("/auth/password", authMiddleware, validatePasswordChange, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 12)
      return res
        .status(400)
        .json({ message: "New password must be at least 12 characters" });
    const a = await Admin.findById(req.admin.id);
    if (!a || !(await bcrypt.compare(currentPassword, a.passwordHash)))
      return res.status(400).json({ message: "Current password is incorrect" });
    a.passwordHash = await bcrypt.hash(newPassword, 12);
    a.tokenVersion += 1;
    await a.save();
    res
      .clearCookie("token", cookieOptions)
      .json({ message: "Password updated" });
  } catch (e) {
    next(e);
  }
});
for (const key of ["profile", "about"]) {
  const Model = models[key];
  r.get("/" + key, async (req, res, next) => {
    try {
      const value = await Model.findOne().sort({ createdAt: -1 });
      res.json(value || null);
    } catch (e) {
      next(e);
    }
  });
}
for (const key of [
  "skills",
  "projects",
  "experience",
  "education",
  "certificates",
]) {
  const Model = models[key];
  r.get("/" + key, async (req, res, next) => {
    try {
      res.json(await Model.find().sort({ createdAt: -1 }));
    } catch (e) {
      next(e);
    }
  });
}
r.post("/messages", contactLimit, validateResourceBody("messages"), async (req, res, next) => {
  try {
    const m = await Message.create(req.body);
    res.status(201).json({ message: "Message received", id: m._id });
  } catch (e) {
    next(e);
  }
});
r.use("/admin", authMiddleware);
for (const key of ["profile", "about"]) {
  const Model = models[key];
  r.get("/admin/" + key, async (req, res, next) => {
    try {
      const value = await Model.findOne().sort({ createdAt: -1 });
      res.json(value || null);
    } catch (e) {
      next(e);
    }
  });
}
for (const [key, Model] of Object.entries(models)) {
  if (key !== "profile" && key !== "about")
    r.get("/admin/" + key, async (req, res, next) => {
      try {
        res.json(await Model.find().sort({ createdAt: -1 }));
      } catch (e) {
        next(e);
      }
    });
  if (key === "messages") {
    r.patch("/admin/messages/:id", async (req, res, next) => {
      try {
        if (!mongoose.isValidObjectId(req.params.id) ||
            Object.keys(req.body || {}).length !== 1 ||
            typeof req.body.read !== "boolean")
          return res.status(400).json({ message: "Invalid request data" });
        const d = await Model.findByIdAndUpdate(
          req.params.id,
          { read: Boolean(req.body.read) },
          { new: true, runValidators: true },
        );
        if (!d) return res.status(404).json({ message: "Not found" });
        res.json(d);
      } catch (e) {
        next(e);
      }
    });
    r.delete("/admin/messages/:id", async (req, res, next) => {
      try {
        if (!mongoose.isValidObjectId(req.params.id))
          return res.status(404).json({ message: "Not found" });
        const d = await Model.findByIdAndDelete(req.params.id);
        if (!d) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted" });
      } catch (e) {
        next(e);
      }
    });
    continue;
  }
  r.post("/admin/" + key, validateResourceBody(key), async (req, res, next) => {
    try {
      res.status(201).json(await Model.create(req.body));
    } catch (e) {
      next(e);
    }
  });
  r.put("/admin/" + key + "/:id", validateResourceBody(key), async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id))
        return res.status(404).json({ message: "Not found" });
      const d = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!d) return res.status(404).json({ message: "Not found" });
      res.json(d);
    } catch (e) {
      next(e);
    }
  });
  r.delete("/admin/" + key + "/:id", async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id))
        return res.status(404).json({ message: "Not found" });
      const d = await Model.findByIdAndDelete(req.params.id);
      if (!d) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (e) {
      next(e);
    }
  });
}
r.post("/admin/upload", authMiddleware, uploadLimit, async (req, res, next) => {
  try {
    const { upload, fileContentMatches } =
      await import("../middleware/upload.js");
    upload.single("file")(req, res, async (e) => {
      if (e) return next(e);
      if (!req.file) return res.status(400).json({ message: "Select a file" });
      try {
        if (!(await fileContentMatches(req.file)))
          return res
            .status(415)
            .json({
              message:
                "File contents do not match an allowed image or PDF type",
            });
        const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const asset = await Asset.create({
          filename,
          contentType: req.file.mimetype,
          data: req.file.buffer,
        });
        res.status(201).json({ url: "/api/media/" + asset._id });
      } catch (error) {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
});
export default r;
