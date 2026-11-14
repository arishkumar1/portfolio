import jwt from "jsonwebtoken";
import { Admin } from "../models/index.js";

export async function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload.id !== "string" || !Number.isInteger(payload.ver))
      return res.status(401).json({ message: "Authentication required" });
    const admin = await Admin.findById(payload.id).select("username tokenVersion");
    if (!admin || payload.ver !== admin.tokenVersion)
      return res.status(401).json({ message: "Authentication required" });
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
      return res.status(401).json({ message: "Authentication required" });
    next(error);
  }
}
export default authMiddleware;
