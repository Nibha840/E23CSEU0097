import axios from "axios";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];

/**
 * Frontend logging function - sends logs through the backend proxy
 * which forwards them to the evaluation test server.
 */
export async function Log(stack, level, pkg, message) {
  try {
    if (!VALID_STACKS.includes(stack)) return;
    if (!VALID_LEVELS.includes(level)) return;

    await axios.post("/api/log", {
      stack,
      level,
      package: pkg,
      message
    });
  } catch (error) {
    // Silent fail - don't break the app if logging fails
    console.error("[Log]", error.message);
  }
}
