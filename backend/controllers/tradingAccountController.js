const TradingAccount = require("../models/TradingAccount");
const Trade = require("../models/Trade");

// ===============================
// CREATE ACCOUNT
// ===============================
const createAccount = async (req, res) => {
  try {
    const {
      name,
      accountType,
      broker,
      propFirm,
      accountNumber,
      currency,
      initialBalance,
      description
    } = req.body;

    if (!name || initialBalance === undefined) {
      return res.status(400).json({
        success: false,
        message: "Account name and initial balance are required"
      });
    }

    const balance = Number(initialBalance);

    if (!Number.isFinite(balance) || balance < 0) {
      return res.status(400).json({
        success: false,
        message: "Initial balance must be a valid non-negative number"
      });
    }

    const account = await TradingAccount.create({
      user: req.user.userId,
      name: name.trim(),
      accountType: accountType || "DEMO",
      broker: broker?.trim() || "",
      propFirm: propFirm?.trim() || "",
      accountNumber: accountNumber?.trim() || "",
      currency: currency || "USD",
      initialBalance: balance,
      currentBalance: balance,
      description: description?.trim() || ""
    });

    return res.status(201).json({
      success: true,
      message: "Trading account created successfully",
      account
    });
  } catch (error) {
    console.error("Create account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create trading account"
    });
  }
};

// ===============================
// GET ALL ACCOUNTS
// ===============================
const getAccounts = async (req, res) => {
  try {
    const accounts = await TradingAccount.find({
      user: req.user.userId
    }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      count: accounts.length,
      accounts
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trading accounts"
    });
  }
};

// ===============================
// GET SINGLE ACCOUNT
// ===============================
const getAccount = async (req, res) => {
  try {
    const account = await TradingAccount.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Trading account not found"
      });
    }

    return res.status(200).json({
      success: true,
      account
    });
  } catch (error) {
    console.error("Get account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trading account"
    });
  }
};

// ===============================
// UPDATE ACCOUNT
// ===============================
const updateAccount = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "accountType",
      "broker",
      "propFirm",
      "accountNumber",
      "currency",
      "status",
      "description"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.name) {
      updates.name = updates.name.trim();
    }

    const account = await TradingAccount.findOneAndUpdate(
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

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Trading account not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trading account updated successfully",
      account
    });
  } catch (error) {
    console.error("Update account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update trading account"
    });
  }
};

// ===============================
// DELETE ACCOUNT
// ===============================
const deleteAccount = async (req, res) => {
  try {
    const account = await TradingAccount.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Trading account not found"
      });
    }

    const tradeCount = await Trade.countDocuments({
      tradingAccount: account._id,
      user: req.user.userId
    });

    if (tradeCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This account contains trades. Delete the trades first before deleting the account."
      });
    }

    await TradingAccount.deleteOne({
      _id: account._id
    });

    return res.status(200).json({
      success: true,
      message: "Trading account deleted successfully"
    });
  } catch (error) {
    console.error("Delete account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete trading account"
    });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount
};
