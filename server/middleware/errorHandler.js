const errorHandler = (err, req, res, next) => {
  res.status(500).json({ error: err.toString() });
};

export default errorHandler;
