export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status ||
    (err.code === "LIMIT_FILE_SIZE" ? 413 :
      err.name === "ValidationError" || err.name === "CastError" ? 400 :
        err.code === 11000 ? 409 : 500);
  console.error(JSON.stringify({
    event: "api.error", status, name: err.name, code: err.code,
    method: req.method, path: req.path, at: new Date().toISOString(),
    ...(status >= 500 ? { stack: err.stack } : {}),
  }));
  const messages = {
    400: "Invalid request data", 401: "Authentication required",
    403: "Request not allowed", 404: "Not found", 409: "Conflict",
    413: "File or request is too large", 415: "Unsupported file type",
    429: "Too many requests. Try again later.",
  };
  res.status(status).json({ message: messages[status] || "Something went wrong" });
}
