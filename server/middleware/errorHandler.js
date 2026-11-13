export default function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status =
    err.status ||
    (err.code === "LIMIT_FILE_SIZE"
      ? 413
      : err.name === "ValidationError" || err.name === "CastError"
        ? 400
        : err.code === 11000
          ? 409
          : 500);
  res
    .status(status)
    .json({ message: status < 500 ? err.message : "Something went wrong" });
}
