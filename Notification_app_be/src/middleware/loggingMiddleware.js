const { Log } = require("../../../logging_middleware/src");

/**
 * Express middleware that logs every incoming HTTP request
 * using the reusable Log function from logging_middleware.
 */
function loggingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    Log(
      "backend",
      level,
      "middleware",
      `${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`
    ).catch(() => {});
  });

  next();
}

module.exports = { loggingMiddleware };
