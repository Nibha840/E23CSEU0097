const axios = require("axios");

const LOG_URL = "http://4.224.186.213/evaluation-service/log";

/**
 * Sends a log entry to the evaluation service test server.
 */
async function sendLog(payload, token) {
  try {
    const response = await axios.post(LOG_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    throw new Error("Log send failed: " + (error.response?.data?.message || error.message));
  }
}

module.exports = sendLog;
