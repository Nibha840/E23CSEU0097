const VALID_STACKS = ["backend", "frontend"];

const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];

const BACKEND_PACKAGES = [
  "handler",
  "repository",
  "route",
  "service"
];

const FRONTEND_PACKAGES = [
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style"
];

const SHARED_PACKAGES = [
  "auth",
  "config",
  "middleware",
  "utils"
];

const ALL_PACKAGES = [...BACKEND_PACKAGES, ...FRONTEND_PACKAGES, ...SHARED_PACKAGES];

module.exports = {
  VALID_STACKS,
  VALID_LEVELS,
  BACKEND_PACKAGES,
  FRONTEND_PACKAGES,
  SHARED_PACKAGES,
  ALL_PACKAGES
};