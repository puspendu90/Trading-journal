const express = require("express");

const {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade
} = require("../controllers/tradeController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All trade routes require authentication
router.use(protect);

// Create trade
router.post("/", createTrade);

// Get all trades
router.get("/", getTrades);

// Get single trade
router.get("/:id", getTrade);

// Update trade
router.put("/:id", updateTrade);

// Delete trade
router.delete("/:id", deleteTrade);

module.exports = router;
