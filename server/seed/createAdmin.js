import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Admin } from "../models/index.js";
dotenv.config();
try {
  if (
    !process.env.MONGO_URI ||
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD
  )
    throw new Error(
      "MONGO_URI, ADMIN_USERNAME and ADMIN_PASSWORD are required",
    );
  await mongoose.connect(process.env.MONGO_URI);
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await Admin.findOneAndUpdate(
    { username: process.env.ADMIN_USERNAME },
    { username: process.env.ADMIN_USERNAME, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  console.log("Admin seeded");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
