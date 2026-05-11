const VALID_STACKS = [
  "backend",
  "frontend"
]

const VALID_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "fatal"
]

const SHARED_PACKAGES = [
  "auth",
  "config",
  "middleware",
  "utils"
]

const BACKEND_PACKAGES = [
  "controller",
  "service",
  "route",
  "repository",
  "db"
]

const FRONTEND_PACKAGES = [
  "component",
  "page",
  "hook",
  "api",
  "state"
]

module.exports = {
  VALID_STACKS,
  VALID_LEVELS,
  SHARED_PACKAGES,
  BACKEND_PACKAGES,
  FRONTEND_PACKAGES
}