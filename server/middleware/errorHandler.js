const errorHandler = (err, req, res, next) => {
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "File too large",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files",
      });
    }
  }

  res.status(500).json({ error: err.toString() });
};

export default errorHandler;
