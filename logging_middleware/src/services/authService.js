const axios = require("axios");

const AUTH_URL = "http://4.224.186.213/evaluation-service/auth";

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Authenticates with the evaluation service and returns a Bearer token.
 * Caches the token until it expires.
 */
async function getAuthToken() {
  try {
    const now = Math.floor(Date.now() / 1000);

    if (cachedToken && tokenExpiry > now) {
      return cachedToken;
    }

    const response = await axios.post(AUTH_URL, {
      email: process.env.AUTH_EMAIL,
      name: process.env.AUTH_NAME,
      rollNo: process.env.AUTH_ROLL_NO,
      accessCode: process.env.AUTH_ACCESS_CODE,
      clientID: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET
    });

    cachedToken = response.data.access_token;
    tokenExpiry = response.data.expires_in || (now + 3600);

    return cachedToken;
  } catch (error) {
    throw new Error("Auth failed: " + (error.response?.data?.message || error.message));
  }
}

module.exports = getAuthToken;