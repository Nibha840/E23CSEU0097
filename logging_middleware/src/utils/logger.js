const {
  VALID_STACKS,
  VALID_LEVELS
} = require("../config/constants")

function validateInputs(stack, level) {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error("Invalid stack")
  }

  if (!VALID_LEVELS.includes(level)) {
    throw new Error("Invalid level")
  }
}

module.exports = validateInputs