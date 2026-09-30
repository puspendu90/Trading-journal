const express = require("express");

const {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount
} = require("../controllers/tradingAccountController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createAccount);

router.get("/", getAccounts);

router.get("/:id", getAccount);

router.put("/:id", updateAccount);

router.delete("/:id", deleteAccount);

module.exports = router;
