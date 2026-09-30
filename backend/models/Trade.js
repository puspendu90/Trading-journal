const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    tradingAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
      index: true
    },

    symbol: {
      type: String,
      required: [true, "Trading symbol is required"],
      trim: true,
      uppercase: true,
      maxlength: [30, "Symbol cannot exceed 30 characters"]
    },

    direction: {
      type: String,
      enum: ["BUY", "SELL"],
      required: [true, "Trade direction is required"]
    },

    entryPrice: {
      type: Number,
      required: [true, "Entry price is required"],
      min: [0, "Entry price cannot be negative"]
    },

    exitPrice: {
      type: Number,
      required: [true, "Exit price is required"],
      min: [0, "Exit price cannot be negative"]
    },

    stopLoss: {
      type: Number,
      min: [0, "Stop loss cannot be negative"]
    },

    takeProfit: {
      type: Number,
      min: [0, "Take profit cannot be negative"]
    },

    lotSize: {
      type: Number,
      required: [true, "Lot size is required"],
      min: [0, "Lot size cannot be negative"]
    },

    profitLoss: {
      type: Number,
      default: 0
    },

    riskAmount: {
      type: Number,
      default: 0,
      min: [0, "Risk amount cannot be negative"]
    },

    riskPercentage: {
      type: Number,
      default: 0,
      min: [0, "Risk percentage cannot be negative"]
    },

    rrRatio: {
      type: Number,
      default: 0
    },

    outcome: {
      type: String,
      enum: ["WIN", "LOSS", "BREAKEVEN", "OPEN"],
      default: "OPEN"
    },

    strategy: {
      type: String,
      trim: true,
      maxlength: [100, "Strategy name cannot exceed 100 characters"]
    },

    session: {
      type: String,
      enum: ["ASIA", "LONDON", "NEW_YORK", "OTHER"],
      default: "OTHER"
    },

    marketCondition: {
      type: String,
      enum: [
        "TRENDING",
        "RANGING",
        "VOLATILE",
        "BREAKOUT",
        "OTHER"
      ],
      default: "OTHER"
    },

    entryReason: {
      type: String,
      trim: true,
      maxlength: [2000, "Entry reason cannot exceed 2000 characters"]
    },

    exitReason: {
      type: String,
      trim: true,
      maxlength: [2000, "Exit reason cannot exceed 2000 characters"]
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [5000, "Notes cannot exceed 5000 characters"]
    },

    emotionBefore: {
      type: String,
      trim: true,
      maxlength: [100, "Emotion cannot exceed 100 characters"]
    },

    emotionAfter: {
      type: String,
      trim: true,
      maxlength: [100, "Emotion cannot exceed 100 characters"]
    },

    confidenceLevel: {
      type: Number,
      min: 1,
      max: 10
    },

    followedPlan: {
      type: Boolean,
      default: true
    },

    fomo: {
      type: Boolean,
      default: false
    },

    revengeTrade: {
      type: Boolean,
      default: false
    },

    beforeScreenshot: {
      type: String,
      default: ""
    },

    afterScreenshot: {
      type: String,
      default: ""
    },

    openedAt: {
      type: Date,
      required: [true, "Trade open time is required"]
    },

    closedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Trade", tradeSchema);
