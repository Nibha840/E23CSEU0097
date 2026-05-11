let authToken = null

async function getAuthToken() {
  try {
    if (!authToken) {
      authToken = "default-token"
    }
    return authToken
  } catch (error) {
    throw new Error("Failed to get auth token: " + error.message)
  }
}

module.exports = getAuthToken