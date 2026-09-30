const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const TradingAccount = require("../models/TradingAccount");

// ==========================================
// CALCULATE TRADE METRICS
// ==========================================
const calculateMetrics = (data) => {
  const {
    direction,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    lotSize
  } = data;

  const entry = Number(entryPrice);
  const exit = Number(exitPrice);
  const sl =
    stopLoss !== undefined && stopLoss !== null
      ? Number(stopLoss)
      : null;
  const tp =
    takeProfit !== undefined && takeProfit !== null
      ? Number(takeProfit)
      : null;
  const lots = Number(lotSize);

  let profitLoss = 0;
  let riskAmount = 0;
  let rrRatio = 0;
  let outcome = "OPEN";

  // P/L
  if (direction === "BUY") {
    profitLoss = (exit - entry) * lots;
  } else if (direction === "SELL") {
    profitLoss = (entry - exit) * lots;
  }

  // Outcome
  if (profitLoss > 0) {
    outcome = "WIN";
  } else if (profitLoss < 0) {
    outcome = "LOSS";
  } else {
    outcome = "BREAKEVEN";
  }

  // Risk
  if (sl !== null && Number.isFinite(sl)) {
    if (direction === "BUY") {
      riskAmount = Math.abs(entry - sl) * lots;
    } else {
      riskAmount = Math.abs(sl - entry) * lots;
    }
  }

  // R:R
  if (tp !== null && Number.isFinite(tp) && riskAmount > 0) {
    let reward = 0;

    if (direction === "BUY") {
      reward = Math.abs(tp - entry) * lots;
    } else {
      reward = Math.abs(entry - tp) * lots;
    }

    rrRatio = reward / riskAmount;
  }

  return {
    profitLoss: Number(profitLoss.toFixed(2)),
    riskAmount: Number(riskAmount.toFixed(2)),
    rrRatio: Number(rrRatio.toFixed(2)),
    outcome
  };
};

// ==========================================
// RECALCULATE ACCOUNT BALANCE
// ==========================================
const recalculateAccountBalance = async (accountId, userId) => {
  const account = await TradingAccount.findOne({
    _id: accountId,
    user: userId
  });

  if (!account) {
    throw new Error("Trading account not found");
  }

  const result = await Trade.aggregate([
    {
      $match: {
        tradingAccount: new mongoose.Types.ObjectId(accountId),
        user: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalProfitLoss: {
          $sum: "$profitLoss"
        }
      }
    }
  ]);

  const totalProfitLoss =
    result.length > 0
      ? Number(result[0].totalProfitLoss || 0)
      : 0;

  account.currentBalance = Number(
    (account.initialBalance + totalProfitLoss).toFixed(2)
  );

  await account.save();

  return account;
};

// ==========================================
// CREATE TRADE
// ==========================================
const createTrade = async (req, res) => {
  try {
    const {
      tradingAccount,
      symbol,
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      lotSize,
      strategy,
      session,
      marketCondition,
      entryReason,
      exitReason,
      notes,
      emotionBefore,
      emotionAfter,
      confidenceLevel,
      followedPlan,
      fomo,
      revengeTrade,
      beforeScreenshot,
      afterScreenshot,
      openedAt,
      closedAt
    } = req.body;

    // Required fields
    if (
      !tradingAccount ||
      !symbol ||
      !direction ||
      entryPrice === undefined ||
      exitPrice === undefined ||
      lotSize === undefined ||
      !openedAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Trading account, symbol, direction, entry price, exit price, lot size and open time are required"
      });
    }

    // Validate account ID
    if (!mongoose.Types.ObjectId.isValid(tradingAccount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trading account ID"
      });
    }

    // Verify ownership
    const account = await TradingAccount.findOne({
      _id: tradingAccount,
      user: req.user.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Trading account not found"
      });
    }

    // Validate direction
    if (!["BUY", "SELL"].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: "Direction must be BUY or SELL"
      });
    }

    // Validate numeric values
    const numericValues = [
      entryPrice,
      exitPrice,
      lotSize
    ];

    if (
      numericValues.some(
        (value) =>
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trade price or lot size"
      });
    }

    // Calculate metrics
    const metrics = calculateMetrics({
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      lotSize
    });

    // Risk percentage
    const riskPercentage =
      account.initialBalance > 0
        ? (metrics.riskAmount / account.initialBalance) * 100
        : 0;

    // Create trade
    const trade = await Trade.create({
      user: req.user.userId,
      tradingAccount,

      symbol: symbol.trim().toUpperCase(),
      direction,

      entryPrice: Number(entryPrice),
      exitPrice: Number(exitPrice),

      stopLoss:
        stopLoss !== undefined
          ? Number(stopLoss)
          : undefined,

      takeProfit:
        takeProfit !== undefined
          ? Number(takeProfit)
          : undefined,

      lotSize: Number(lotSize),

      ...metrics,

      riskPercentage: Number(
        riskPercentage.toFixed(2)
      ),

      strategy: strategy?.trim() || "",
      session: session || "OTHER",
      marketCondition: marketCondition || "OTHER",

      entryReason: entryReason?.trim() || "",
      exitReason: exitReason?.trim() || "",

      notes: notes?.trim() || "",

      emotionBefore:
        emotionBefore?.trim() || "",

      emotionAfter:
        emotionAfter?.trim() || "",

      confidenceLevel:
        confidenceLevel !== undefined
          ? Number(confidenceLevel)
          : undefined,

      followedPlan:
        followedPlan !== undefined
          ? Boolean(followedPlan)
          : true,

      fomo:
        fomo !== undefined
          ? Boolean(fomo)
          : false,

      revengeTrade:
        revengeTrade !== undefined
          ? Boolean(revengeTrade)
          : false,

      beforeScreenshot:
        beforeScreenshot || "",

      afterScreenshot:
        afterScreenshot || "",

      openedAt: new Date(openedAt),

      closedAt:
        closedAt
          ? new Date(closedAt)
          : undefined
    });

    // Recalculate complete account balance
    await recalculateAccountBalance(
      tradingAccount,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Trade created successfully",
      trade
    });
  } catch (error) {
    console.error("Create trade error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create trade"
    });
  }
};

// ==========================================
// GET ALL TRADES
// ==========================================
const getTrades = async (req, res) => {
  try {
    const filter = {
      user: req.user.userId
    };

    // Filter by account
    if (req.query.tradingAccount) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.query.tradingAccount
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid trading account ID"
        });
      }

      filter.tradingAccount =
        req.query.tradingAccount;
    }

    // Filter by outcome
    if (req.query.outcome) {
      filter.outcome = req.query.outcome;
    }

    // Filter by symbol
    if (req.query.symbol) {
      filter.symbol =
        req.query.symbol.toUpperCase();
    }

    const trades = await Trade.find(filter)
      .populate(
        "tradingAccount",
        "name accountType currency"
      )
      .sort({
        openedAt: -1
      });

    return res.status(200).json({
      success: true,
      count: trades.length,
      trades
    });
  } catch (error) {
    console.error("Get trades error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trades"
    });
  }
};

// ==========================================
// GET SINGLE TRADE
// ==========================================
const getTrade = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trade ID"
      });
    }

    const trade = await Trade.findOne({
      _id: req.params.id,
      user: req.user.userId
    }).populate(
      "tradingAccount",
      "name accountType currency initialBalance currentBalance"
    );

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found"
      });
    }

    return res.status(200).json({
      success: true,
      trade
    });
  } catch (error) {
    console.error("Get trade error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trade"
    });
  }
};

// ==========================================
// UPDATE TRADE
// ==========================================
const updateTrade = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trade ID"
      });
    }

    // Find existing trade
    const existingTrade = await Trade.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!existingTrade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found"
      });
    }

    // Find account
    const account = await TradingAccount.findOne({
      _id: existingTrade.tradingAccount,
      user: req.user.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Trading account not found"
      });
    }

    const allowedFields = [
      "symbol",
      "direction",
      "entryPrice",
      "exitPrice",
      "stopLoss",
      "takeProfit",
      "lotSize",
      "strategy",
      "session",
      "marketCondition",
      "entryReason",
      "exitReason",
      "notes",
      "emotionBefore",
      "emotionAfter",
      "confidenceLevel",
      "followedPlan",
      "fomo",
      "revengeTrade",
      "beforeScreenshot",
      "afterScreenshot",
      "openedAt",
      "closedAt"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Format values
    if (updates.symbol) {
      updates.symbol =
        updates.symbol.trim().toUpperCase();
    }

    if (updates.direction) {
      if (
        !["BUY", "SELL"].includes(
          updates.direction
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Direction must be BUY or SELL"
        });
      }
    }

    const numericFields = [
      "entryPrice",
      "exitPrice",
      "lotSize",
      "stopLoss",
      "takeProfit"
    ];

    numericFields.forEach((field) => {
      if (updates[field] !== undefined) {
        updates[field] = Number(
          updates[field]
        );
      }
    });

    // Calculate using new + existing data
    const calculatedData = {
      direction:
        updates.direction ||
        existingTrade.direction,

      entryPrice:
        updates.entryPrice !== undefined
          ? updates.entryPrice
          : existingTrade.entryPrice,

      exitPrice:
        updates.exitPrice !== undefined
          ? updates.exitPrice
          : existingTrade.exitPrice,

      stopLoss:
        updates.stopLoss !== undefined
          ? updates.stopLoss
          : existingTrade.stopLoss,

      takeProfit:
        updates.takeProfit !== undefined
          ? updates.takeProfit
          : existingTrade.takeProfit,

      lotSize:
        updates.lotSize !== undefined
          ? updates.lotSize
          : existingTrade.lotSize
    };

    const metrics =
      calculateMetrics(calculatedData);

    const riskPercentage =
      account.initialBalance > 0
        ? (metrics.riskAmount /
            account.initialBalance) *
          100
        : 0;

    Object.assign(updates, {
      ...metrics,

      riskPercentage: Number(
        riskPercentage.toFixed(2)
      )
    });

    // Update trade
    const trade =
      await Trade.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.userId
        },
        updates,
        {
          new: true,
          runValidators: true
        }
      );

    // Recalculate complete account balance
    await recalculateAccountBalance(
      existingTrade.tradingAccount,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Trade updated successfully",
      trade
    });
  } catch (error) {
    console.error("Update trade error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update trade"
    });
  }
};

// ==========================================
// DELETE TRADE
// ==========================================
const deleteTrade = async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trade ID"
      });
    }

    const trade = await Trade.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found"
      });
    }

    const accountId =
      trade.tradingAccount;

    await Trade.deleteOne({
      _id: trade._id
    });

    // Recalculate balance after deletion
    await recalculateAccountBalance(
      accountId,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Trade deleted successfully"
    });
  } catch (error) {
    console.error("Delete trade error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete trade"
    });
  }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade
};