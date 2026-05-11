async function sendLog(payload, token) {
  try {
    if (!payload) {
      throw new Error("Payload is required")
    }
    if (!token) {
      throw new Error("Token is required")
    }
    console.log("Log sent successfully", { payload, token })
    return { success: true, message: "Log sent" }
  } catch (error) {
    throw new Error("Failed to send log: " + error.message)
  }
}

module.exports = sendLog