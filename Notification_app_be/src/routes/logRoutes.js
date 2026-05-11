const express = require("express");
const router = express.Router();
const { Log } = require("../../../logging_middleware/src");

// POST /api/log - proxy endpoint for frontend logging
router.post("/", async (req, res) => {
  try {
    const { stack, level, package: pkg, message } = req.body;
    const result = await Log(stack, level, pkg, message);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
