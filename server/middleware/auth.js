import jwt from "jsonwebtoken";
export function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token)
      return res.status(401).json({ message: "Authentication required" });
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired. Please sign in again." });
  }
}
