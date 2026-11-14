import multer from "multer";
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype) ||
      file.mimetype === "application/pdf";
    if (ok) return cb(null, true);
    const error = new Error("Only image or PDF files are allowed");
    error.status = 415;
    cb(error);
  },
});
export async function fileContentMatches(file) {
  const bytes = file.buffer;
  if (!bytes) return false;
  switch (file.mimetype) {
    case "image/jpeg":
      return (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
      );
    case "image/png":
      return (
        bytes.length >= 8 &&
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    case "image/webp":
      return (
        bytes.length >= 12 &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP"
      );
    case "image/gif":
      return (
        bytes.length >= 6 &&
        ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))
      );
    case "application/pdf":
      return bytes.length >= 5 && bytes.toString("ascii", 0, 5) === "%PDF-";
    default:
      return false;
  }
}
