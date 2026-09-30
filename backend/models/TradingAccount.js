const mongoose = require("mongoose");

const tradingAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      maxlength: [100, "Account name cannot exceed 100 characters"]
    },

    accountType: {
      type: String,
      enum: ["DEMO", "LIVE", "PROP_FIRM"],
      default: "DEMO"
    },

    broker: {
      type: String,
      trim: true,
      maxlength: [100, "Broker name cannot exceed 100 characters"]
    },

    propFirm: {
      type: String,
      trim: true,
      maxlength: [100, "Prop firm name cannot exceed 100 characters"]
    },

    accountNumber: {
      type: String,
      trim: true,
      maxlength: [100, "Account number cannot exceed 100 characters"]
    },

    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true
    },

    initialBalance: {
      type: Number,
      required: [true, "Initial balance is required"],
      min: [0, "Initial balance cannot be negative"]
    },

    currentBalance: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "COMPLETED"],
      default: "ACTIVE"
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "TradingAccount",
  tradingAccountSchema
);
