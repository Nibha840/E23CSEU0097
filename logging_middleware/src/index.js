const validateInputs = require("./utils/logger")

try {
  validateInputs("backend", "info")
  console.log("Validation successful")
} catch (error) {
  console.log(error.message)
}