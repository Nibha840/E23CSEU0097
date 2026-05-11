const { VALID_STACKS, VALID_LEVELS, ALL_PACKAGES } = require("../config/constants");
const getAuthToken = require("../services/authService");
const sendLog = require("../services/logService");

/**
 * Reusable logging function that validates inputs and sends logs
 * to the evaluation test server.
 *
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug" | "info" | "warn" | "error" | "fatal"
 * @param {string} pkg - The package/module name (e.g. "handler", "component")
 * @param {string} message - Descriptive log message
 * @returns {Promise<object>} - Response from the test server
 */
async function Log(stack, level, pkg, message) {
  // Validate stack
  if (!stack || !VALID_STACKS.includes(stack)) {
    throw new Error(`Invalid stack: "${stack}". Must be one of: ${VALID_STACKS.join(", ")}`);
  }

  // Validate level
  if (!level || !VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid level: "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
  }

  // Validate package
  if (!pkg || typeof pkg !== "string" || pkg.trim() === "") {
    throw new Error("Package name is required and must be a non-empty string");
  }

  // Validate message
  if (!message || typeof message !== "string" || message.trim() === "") {
    throw new Error("Message is required and must be a non-empty string");
  }

  try {
    // Get auth token (cached)
    const token = await getAuthToken();

    // Send log to test server
    const result = await sendLog(
      { stack, level, package: pkg, message },
      token
    );

    return result;
  } catch (error) {
    // Fallback: log to console if server call fails
    console.error(`[LOG FAILED] [${stack}] [${level}] [${pkg}] ${message}`);
    console.error("Error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { Log };
