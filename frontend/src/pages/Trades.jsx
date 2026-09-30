import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  LineChart,
  ShieldAlert,
  Target,
  Calculator,
} from "lucide-react";

import api from "../services/api";
import { formatCurrency } from "../utils/currency";

function Trades() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  const emptyForm = {
    tradingAccount: "",
    symbol: "XAUUSD",
    direction: "BUY",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "1",
    strategy: "",
    session: "OTHER",
    marketCondition: "OTHER",
    entryReason: "",
    exitReason: "",
    notes: "",
    emotionBefore: "",
    emotionAfter: "",
    confidenceLevel: "",
    followedPlan: true,
    fomo: false,
    revengeTrade: false,
    openedAt: "",
    closedAt: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ============================================================
  // GET TRADE ACCOUNT ID
  // ============================================================

  const getTradeAccountId = (trade) => {
    if (trade?.tradingAccount?._id) {
      return trade.tradingAccount._id;
    }

    if (trade?.tradingAccount?.id) {
      return trade.tradingAccount.id;
    }

    if (typeof trade?.tradingAccount === "string") {
      return trade.tradingAccount;
    }

    if (trade?.account?._id) {
      return trade.account._id;
    }

    if (trade?.account?.id) {
      return trade.account.id;
    }

    if (typeof trade?.account === "string") {
      return trade.account;
    }

    return null;
  };

  // ============================================================
  // GET ACCOUNT
  // ============================================================

  const getTradeAccount = (trade) => {
    const accountId = getTradeAccountId(trade);

    if (!accountId) {
      return null;
    }

    return (
      accounts.find(
        (account) =>
          account._id === accountId ||
          account.id === accountId
      ) || null
    );
  };

  // ============================================================
  // GET ACCOUNT CURRENCY
  // ============================================================

  const getAccountCurrency = (trade) => {
    if (trade?.tradingAccount?.currency) {
      return trade.tradingAccount.currency;
    }

    if (trade?.account?.currency) {
      return trade.account.currency;
    }

    const account = getTradeAccount(trade);

    return account?.currency || "USD";
  };

  // ============================================================
  // LOAD TRADES + ACCOUNTS
  // ============================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [tradesResponse, accountsResponse] =
        await Promise.all([
          api.get("/trades"),
          api.get("/accounts"),
        ]);

      const loadedTrades =
        tradesResponse.data?.trades ||
        tradesResponse.data ||
        [];

      const loadedAccounts =
        accountsResponse.data?.accounts ||
        accountsResponse.data ||
        [];

      setTrades(
        Array.isArray(loadedTrades)
          ? loadedTrades
          : []
      );

      setAccounts(
        Array.isArray(loadedAccounts)
          ? loadedAccounts
          : []
      );
    } catch (err) {
      console.error("Trades load error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load trades."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // DATE FORMATTER
  // ============================================================

  const formatDateForInput = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    const year = parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    const hours = String(
      parsedDate.getHours()
    ).padStart(2, "0");

    const minutes = String(
      parsedDate.getMinutes()
    ).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ============================================================
  // ADD TRADE
  // ============================================================

  const openAddModal = () => {
    setEditingTrade(null);

    setForm({
      ...emptyForm,
      tradingAccount:
        accounts.length > 0
          ? accounts[0]._id || accounts[0].id
          : "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ============================================================
  // EDIT TRADE
  // ============================================================

  const openEditModal = (trade) => {
    setEditingTrade(trade);

    setForm({
      tradingAccount:
        trade.tradingAccount?._id ||
        trade.tradingAccount?.id ||
        trade.tradingAccount ||
        trade.account?._id ||
        trade.account?.id ||
        trade.account ||
        "",

      symbol:
        trade.symbol || "XAUUSD",

      direction:
        trade.direction || "BUY",

      entryPrice:
        trade.entryPrice ?? "",

      exitPrice:
        trade.exitPrice ?? "",

      stopLoss:
        trade.stopLoss ?? "",

      takeProfit:
        trade.takeProfit ?? "",

      lotSize:
        trade.lotSize ?? "1",

      strategy:
        trade.strategy || "",

      session:
        trade.session || "OTHER",

      marketCondition:
        trade.marketCondition || "OTHER",

      entryReason:
        trade.entryReason || "",

      exitReason:
        trade.exitReason || "",

      notes:
        trade.notes || "",

      emotionBefore:
        trade.emotionBefore || "",

      emotionAfter:
        trade.emotionAfter || "",

      confidenceLevel:
        trade.confidenceLevel ?? "",

      followedPlan:
        trade.followedPlan ?? true,

      fomo:
        trade.fomo ?? false,

      revengeTrade:
        trade.revengeTrade ?? false,

      openedAt:
        formatDateForInput(
          trade.openedAt
        ),

      closedAt:
        trade.closedAt
          ? formatDateForInput(
              trade.closedAt
            )
          : "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (error) {
      setError("");
    }
  };

  // ============================================================
  // TRADE CALCULATIONS
  // ============================================================

  const tradeCalculations = useMemo(() => {
    const entry = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const takeProfit = Number(form.takeProfit);
    const lotSize = Number(form.lotSize);

    const hasEntry =
      form.entryPrice !== "" &&
      Number.isFinite(entry) &&
      entry > 0;

    const hasStopLoss =
      form.stopLoss !== "" &&
      Number.isFinite(stopLoss) &&
      stopLoss > 0;

    const hasTakeProfit =
      form.takeProfit !== "" &&
      Number.isFinite(takeProfit) &&
      takeProfit > 0;

    const hasLotSize =
      form.lotSize !== "" &&
      Number.isFinite(lotSize) &&
      lotSize > 0;

    let riskDistance = 0;
    let rewardDistance = 0;

    if (hasEntry && hasStopLoss) {
      if (form.direction === "BUY") {
        riskDistance =
          entry - stopLoss;
      } else {
        riskDistance =
          stopLoss - entry;
      }
    }

    if (hasEntry && hasTakeProfit) {
      if (form.direction === "BUY") {
        rewardDistance =
          takeProfit - entry;
      } else {
        rewardDistance =
          entry - takeProfit;
      }
    }

    const riskAmount =
      riskDistance > 0 && hasLotSize
        ? riskDistance * lotSize
        : 0;

    const rewardAmount =
      rewardDistance > 0 && hasLotSize
        ? rewardDistance * lotSize
        : 0;

    const rrRatio =
      riskDistance > 0 &&
      rewardDistance > 0
        ? rewardDistance /
          riskDistance
        : 0;

    return {
      entry,
      stopLoss,
      takeProfit,
      lotSize,
      riskDistance,
      rewardDistance,
      riskAmount,
      rewardAmount,
      rrRatio,
      hasEntry,
      hasStopLoss,
      hasTakeProfit,
      hasLotSize,
    };
  }, [
    form.entryPrice,
    form.stopLoss,
    form.takeProfit,
    form.lotSize,
    form.direction,
  ]);

  // ============================================================
  // PRICE VALIDATION
  // ============================================================

  const validateTradePrices = () => {
    const {
      entry,
      stopLoss,
      takeProfit,
      hasEntry,
      hasStopLoss,
      hasTakeProfit,
      hasLotSize,
    } = tradeCalculations;

    if (!hasEntry) {
      return "Entry price must be greater than 0.";
    }

    if (!hasLotSize) {
      return "Lot size must be greater than 0.";
    }

    if (form.stopLoss !== "") {
      if (!hasStopLoss) {
        return "Stop Loss must be greater than 0.";
      }

      if (form.direction === "BUY") {
        if (stopLoss >= entry) {
          return "For a BUY trade, Stop Loss must be below Entry Price.";
        }
      } else {
        if (stopLoss <= entry) {
          return "For a SELL trade, Stop Loss must be above Entry Price.";
        }
      }
    }

    if (form.takeProfit !== "") {
      if (!hasTakeProfit) {
        return "Take Profit must be greater than 0.";
      }

      if (form.direction === "BUY") {
        if (takeProfit <= entry) {
          return "For a BUY trade, Take Profit must be above Entry Price.";
        }
      } else {
        if (takeProfit >= entry) {
          return "For a SELL trade, Take Profit must be below Entry Price.";
        }
      }
    }

    if (
      hasStopLoss &&
      hasTakeProfit &&
      tradeCalculations.rrRatio <= 0
    ) {
      return "Invalid risk/reward setup. Please check your Entry, Stop Loss and Take Profit.";
    }

    if (
      form.confidenceLevel !== ""
    ) {
      const confidence =
        Number(form.confidenceLevel);

      if (
        !Number.isFinite(
          confidence
        ) ||
        confidence < 1 ||
        confidence > 10
      ) {
        return "Confidence Level must be between 1 and 10.";
      }
    }

    return "";
  };

  // ============================================================
  // SUBMIT TRADE
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.tradingAccount) {
        setError(
          "Please select a trading account."
        );

        setSaving(false);
        return;
      }

      if (!form.symbol.trim()) {
        setError(
          "Trading symbol is required."
        );

        setSaving(false);
        return;
      }

      if (!form.entryPrice) {
        setError(
          "Entry price is required."
        );

        setSaving(false);
        return;
      }

      if (!form.lotSize) {
        setError(
          "Lot size is required."
        );

        setSaving(false);
        return;
      }

      const validationError =
        validateTradePrices();

      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      if (
        form.openedAt &&
        form.closedAt
      ) {
        const opened =
          new Date(form.openedAt);

        const closed =
          new Date(form.closedAt);

        if (
          Number.isNaN(
            opened.getTime()
          ) ||
          Number.isNaN(
            closed.getTime()
          )
        ) {
          setError(
            "Please enter valid trade dates."
          );

          setSaving(false);
          return;
        }

        if (closed < opened) {
          setError(
            "Closed At cannot be earlier than Opened At."
          );

          setSaving(false);
          return;
        }
      }

      const payload = {
        tradingAccount:
          form.tradingAccount,

        symbol:
          form.symbol
            .trim()
            .toUpperCase(),

        direction:
          form.direction,

        entryPrice:
          Number(form.entryPrice),

        exitPrice:
          form.exitPrice === ""
            ? undefined
            : Number(form.exitPrice),

        stopLoss:
          form.stopLoss === ""
            ? undefined
            : Number(form.stopLoss),

        takeProfit:
          form.takeProfit === ""
            ? undefined
            : Number(form.takeProfit),

        lotSize:
          Number(form.lotSize),

        strategy:
          form.strategy.trim(),

        session:
          form.session,

        marketCondition:
          form.marketCondition,

        entryReason:
          form.entryReason.trim(),

        exitReason:
          form.exitReason.trim(),

        notes:
          form.notes.trim(),

        emotionBefore:
          form.emotionBefore.trim(),

        emotionAfter:
          form.emotionAfter.trim(),

        confidenceLevel:
          form.confidenceLevel === ""
            ? undefined
            : Number(
                form.confidenceLevel
              ),

        followedPlan:
          form.followedPlan,

        fomo:
          form.fomo,

        revengeTrade:
          form.revengeTrade,

        openedAt:
          form.openedAt
            ? new Date(
                form.openedAt
              ).toISOString()
            : new Date().toISOString(),

        closedAt:
          form.closedAt
            ? new Date(
                form.closedAt
              ).toISOString()
            : undefined,
      };

      if (editingTrade) {
        await api.put(
          `/trades/${editingTrade._id}`,
          payload
        );

        setSuccess(
          "Trade updated successfully."
        );
      } else {
        await api.post(
          "/trades",
          payload
        );

        setSuccess(
          "Trade added successfully."
        );
      }

      setShowModal(false);
      setEditingTrade(null);
      setForm({
        ...emptyForm,
        tradingAccount:
          accounts.length > 0
            ? accounts[0]._id ||
              accounts[0].id
            : "",
      });

      await loadData();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Save trade error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save trade."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE TRADE
  // ============================================================

  const handleDelete = async (tradeId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this trade?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/trades/${tradeId}`
      );

      setTrades((previous) =>
        previous.filter(
          (trade) =>
            trade._id !== tradeId
        )
      );

      setSuccess(
        "Trade deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error(
        "Delete trade error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete trade."
      );
    }
  };

  // ============================================================
  // FILTERED TRADES
  // ============================================================

  const filteredTrades = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    if (!searchText) {
      return trades;
    }

    return trades.filter((trade) => {
      const account =
        getTradeAccount(trade);

      const accountName =
        trade.tradingAccount
          ?.name ||
        trade.account?.name ||
        account?.name ||
        "";

      return (
        trade.symbol
          ?.toLowerCase()
          .includes(searchText) ||
        trade.direction
          ?.toLowerCase()
          .includes(searchText) ||
        trade.outcome
          ?.toLowerCase()
          .includes(searchText) ||
        trade.strategy
          ?.toLowerCase()
          .includes(searchText) ||
        accountName
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [trades, search, accounts]);

  // ============================================================
  // GENERAL STATS
  // ============================================================

  const wins = trades.filter(
    (trade) =>
      trade.outcome === "WIN"
  ).length;

  const losses = trades.filter(
    (trade) =>
      trade.outcome === "LOSS"
  ).length;

  const closedTrades =
    wins + losses;

  const winRate =
    closedTrades > 0
      ? (wins / closedTrades) * 100
      : 0;

  const openTrades =
    trades.filter(
      (trade) =>
        trade.outcome === "OPEN"
    ).length;

  // ============================================================
  // CURRENCY-SPECIFIC TOTALS
  // ============================================================

  const currencyTotals = useMemo(() => {
    const totals = {};

    trades.forEach((trade) => {
      const currency =
        getAccountCurrency(trade);

      const profit =
        Number(
          trade.profitLoss || 0
        );

      if (!totals[currency]) {
        totals[currency] = 0;
      }

      totals[currency] += profit;
    });

    return totals;
  }, [trades, accounts]);

  const currencyEntries =
    Object.entries(
      currencyTotals
    ).sort(([a], [b]) =>
      a.localeCompare(b)
    );

  // ============================================================
  // SELECTED FORM ACCOUNT
  // ============================================================

  const selectedAccount = useMemo(() => {
    return (
      accounts.find(
        (account) =>
          account._id ===
            form.tradingAccount ||
          account.id ===
            form.tradingAccount
      ) || null
    );
  }, [
    accounts,
    form.tradingAccount,
  ]);

  const selectedCurrency =
    selectedAccount?.currency ||
    "USD";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
                <LineChart size={22} />
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trades
              </h1>

            </div>

            <p className="text-sm text-slate-500 sm:text-base">
              Manage and analyze your trading activity.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              onClick={openAddModal}
              disabled={
                accounts.length === 0
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={19} />

              Add Trade
            </button>

          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* NO ACCOUNT WARNING */}

        {!loading &&
          accounts.length === 0 && (
            <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
              <p className="font-semibold text-yellow-400">
                No trading account found.
              </p>

              <p className="mt-1 text-sm text-yellow-400/70">
                Create a trading account before adding a trade.
              </p>
            </div>
          )}

        {/* STATS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Trades"
            value={trades.length}
            subtitle={`${closedTrades} closed`}
          />

          {/* CURRENCY-AWARE P/L */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <p className="text-sm text-slate-500">
              Total P/L
            </p>

            {currencyEntries.length ===
            0 ? (
              <p className="mt-3 text-2xl font-bold text-slate-300">
                {formatCurrency(
                  0,
                  "USD"
                )}
              </p>
            ) : (
              <div className="mt-3 space-y-1">

                {currencyEntries.map(
                  ([
                    currency,
                    total,
                  ]) => (
                    <p
                      key={currency}
                      className={`text-xl font-bold ${
                        total >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {total >= 0
                        ? "+"
                        : "-"}

                      {formatCurrency(
                        Math.abs(total),
                        currency
                      )}
                    </p>
                  )
                )}

              </div>
            )}

            <p className="mt-2 text-sm text-slate-500">
              By account currency
            </p>

          </div>

          <StatCard
            title="Win Rate"
            value={`${winRate.toFixed(
              1
            )}%`}
            subtitle={`${wins} wins / ${losses} losses`}
            positive={
              winRate >= 50
            }
          />

          <StatCard
            title="Open Trades"
            value={openTrades}
            subtitle="Currently open"
          />

        </div>

        {/* SEARCH */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">

          <div className="relative">

            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search symbol, direction, result or strategy..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
            />

          </div>
        </div>

        {/* TRADE HISTORY */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 px-5 py-5 sm:px-6">

            <h2 className="text-lg font-semibold">
              Trade History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredTrades.length} trade
              {filteredTrades.length ===
              1
                ? ""
                : "s"}{" "}
              found
            </p>

          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading trades...
            </div>
          ) : filteredTrades.length ===
            0 ? (
            <div className="p-12 text-center">

              <LineChart
                size={42}
                className="mx-auto mb-4 text-slate-700"
              />

              <h3 className="font-semibold text-slate-400">
                No trades found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Add your first trade to start building your journal.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px] text-left">

                <thead className="border-b border-slate-800 bg-slate-950/40">

                  <tr className="text-xs uppercase tracking-wide text-slate-500">

                    <th className="px-6 py-4">
                      Symbol
                    </th>

                    <th className="px-6 py-4">
                      Account
                    </th>

                    <th className="px-6 py-4">
                      Direction
                    </th>

                    <th className="px-6 py-4">
                      Entry
                    </th>

                    <th className="px-6 py-4">
                      Exit
                    </th>

                    <th className="px-6 py-4">
                      Lot
                    </th>

                    <th className="px-6 py-4">
                      P/L
                    </th>

                    <th className="px-6 py-4">
                      R:R
                    </th>

                    <th className="px-6 py-4">
                      Result
                    </th>

                    <th className="px-6 py-4">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredTrades.map(
                    (trade) => {
                      const currency =
                        getAccountCurrency(
                          trade
                        );

                      const profit =
                        Number(
                          trade.profitLoss ||
                            0
                        );

                      const account =
                        getTradeAccount(
                          trade
                        );

                      const accountName =
                        trade.tradingAccount
                          ?.name ||
                        trade.account
                          ?.name ||
                        account?.name ||
                        "Unknown";

                      return (
                        <tr
                          key={
                            trade._id
                          }
                          className="border-b border-slate-800/60 transition hover:bg-slate-800/30"
                        >

                          {/* SYMBOL */}

                          <td className="px-6 py-5">

                            <div className="font-bold">
                              {
                                trade.symbol
                              }
                            </div>

                            {trade.strategy && (
                              <div className="mt-1 text-xs text-slate-600">
                                {
                                  trade.strategy
                                }
                              </div>
                            )}

                          </td>

                          {/* ACCOUNT */}

                          <td className="px-6 py-5">

                            <div className="max-w-[180px]">

                              <div className="truncate text-sm font-semibold text-slate-300">
                                {
                                  accountName
                                }
                              </div>

                              <div className="mt-1 text-xs font-medium text-emerald-400">
                                {
                                  currency
                                }
                              </div>

                            </div>

                          </td>

                          {/* DIRECTION */}

                          <td className="px-6 py-5">

                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                                trade.direction ===
                                "BUY"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {trade.direction ===
                              "BUY" ? (
                                <ArrowUpRight
                                  size={14}
                                />
                              ) : (
                                <ArrowDownRight
                                  size={14}
                                />
                              )}

                              {
                                trade.direction
                              }
                            </span>

                          </td>

                          {/* ENTRY */}

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {
                              trade.entryPrice
                            }
                          </td>

                          {/* EXIT */}

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {trade.exitPrice ??
                              "—"}
                          </td>

                          {/* LOT */}

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {
                              trade.lotSize
                            }
                          </td>

                          {/* P/L */}

                          <td
                            className={`px-6 py-5 text-sm font-bold ${
                              profit >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {profit >=
                            0
                              ? "+"
                              : "-"}

                            {formatCurrency(
                              Math.abs(
                                profit
                              ),
                              currency
                            )}
                          </td>

                          {/* R:R */}

                          <td className="px-6 py-5 text-sm text-slate-300">
                            {trade.rrRatio
                              ? `1:${Number(
                                  trade.rrRatio
                                ).toFixed(2)}`
                              : tradeCalculations
                                  .rrRatio > 0
                              ? `1:${tradeCalculations.rrRatio.toFixed(
                                  2
                                )}`
                              : "—"}
                          </td>

                          {/* RESULT */}

                          <td className="px-6 py-5">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                trade.outcome ===
                                "WIN"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : trade.outcome ===
                                    "LOSS"
                                  ? "bg-red-500/10 text-red-400"
                                  : trade.outcome ===
                                    "OPEN"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {
                                trade.outcome
                              }
                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2">

                              <button
                                onClick={() =>
                                  openEditModal(
                                    trade
                                  )
                                }
                                className="rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                                title="Edit trade"
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>

                              <button
                                onClick={() =>
                                  handleDelete(
                                    trade._id
                                  )
                                }
                                className="rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete trade"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
      ======================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5 sm:px-6">

              <div>

                <h2 className="text-xl font-bold">
                  {editingTrade
                    ? "Edit Trade"
                    : "Add New Trade"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record your trading activity.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={21} />
              </button>

            </div>

            {/* MODAL BODY */}

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-5 sm:p-6"
            >

              {/* ACCOUNT / CURRENCY INFO */}

              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Calculator size={19} />
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-slate-200">
                        Selected Account
                      </p>

                      <p className="text-xs text-slate-500">
                        {selectedAccount?.name ||
                          "Select a trading account"}
                      </p>

                    </div>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2">

                    <span className="text-xs text-slate-500">
                      Currency
                    </span>

                    <span className="ml-2 text-sm font-bold text-emerald-400">
                      {selectedCurrency}
                    </span>

                  </div>

                </div>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                {/* ACCOUNT */}

                <FormField label="Trading Account">

                  <select
                    name="tradingAccount"
                    value={
                      form.tradingAccount
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    required
                  >

                    <option value="">
                      Select account
                    </option>

                    {accounts.map(
                      (account) => (
                        <option
                          key={
                            account._id ||
                            account.id
                          }
                          value={
                            account._id ||
                            account.id
                          }
                        >
                          {account.name}{" "}
                          (
                          {
                            account.currency ||
                              "USD"
                          }
                          )
                        </option>
                      )
                    )}

                  </select>

                </FormField>

                {/* SYMBOL */}

                <FormField label="Symbol">

                  <input
                    name="symbol"
                    value={
                      form.symbol
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="XAUUSD"
                    required
                  />

                </FormField>

                {/* DIRECTION */}

                <FormField label="Direction">

                  <select
                    name="direction"
                    value={
                      form.direction
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                  >

                    <option value="BUY">
                      BUY
                    </option>

                    <option value="SELL">
                      SELL
                    </option>

                  </select>

                </FormField>

                {/* LOT SIZE */}

                <FormField label="Lot Size">

                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="lotSize"
                    value={
                      form.lotSize
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="1"
                    required
                  />

                </FormField>

                {/* ENTRY */}

                <FormField label="Entry Price">

                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="entryPrice"
                    value={
                      form.entryPrice
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="3400"
                    required
                  />

                </FormField>

                {/* EXIT */}

                <FormField label="Exit Price">

                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="exitPrice"
                    value={
                      form.exitPrice
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="3410"
                  />

                </FormField>

                {/* STOP LOSS */}

                <FormField label="Stop Loss">

                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="stopLoss"
                    value={
                      form.stopLoss
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="3395"
                  />

                </FormField>

                {/* TAKE PROFIT */}

                <FormField label="Take Profit">

                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="takeProfit"
                    value={
                      form.takeProfit
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="3415"
                  />

                </FormField>

                {/* STRATEGY */}

                <FormField label="Strategy">

                  <input
                    name="strategy"
                    value={
                      form.strategy
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="Breakout"
                  />

                </FormField>

                {/* SESSION */}

                <FormField label="Trading Session">

                  <select
                    name="session"
                    value={
                      form.session
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                  >

                    <option value="ASIA">
                      Asia
                    </option>

                    <option value="LONDON">
                      London
                    </option>

                    <option value="NEW_YORK">
                      New York
                    </option>

                    <option value="OTHER">
                      Other
                    </option>

                  </select>

                </FormField>

                {/* MARKET CONDITION */}

                <FormField label="Market Condition">

                  <select
                    name="marketCondition"
                    value={
                      form.marketCondition
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                  >

                    <option value="TRENDING">
                      Trending
                    </option>

                    <option value="RANGING">
                      Ranging
                    </option>

                    <option value="VOLATILE">
                      Volatile
                    </option>

                    <option value="BREAKOUT">
                      Breakout
                    </option>

                    <option value="OTHER">
                      Other
                    </option>

                  </select>

                </FormField>

                {/* OPENED */}

                <FormField label="Opened At">

                  <input
                    type="datetime-local"
                    name="openedAt"
                    value={
                      form.openedAt
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    required
                  />

                </FormField>

                {/* CLOSED */}

                <FormField label="Closed At">

                  <input
                    type="datetime-local"
                    name="closedAt"
                    value={
                      form.closedAt
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                  />

                </FormField>

                {/* EMOTION BEFORE */}

                <FormField label="Emotion Before">

                  <input
                    name="emotionBefore"
                    value={
                      form.emotionBefore
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="Confident"
                  />

                </FormField>

                {/* EMOTION AFTER */}

                <FormField label="Emotion After">

                  <input
                    name="emotionAfter"
                    value={
                      form.emotionAfter
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="Satisfied"
                  />

                </FormField>

                {/* CONFIDENCE */}

                <FormField label="Confidence Level">

                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="confidenceLevel"
                    value={
                      form.confidenceLevel
                    }
                    onChange={
                      handleChange
                    }
                    className="input"
                    placeholder="1 - 10"
                  />

                </FormField>

              </div>

              {/* ==================================================
                  LIVE RISK / REWARD CALCULATOR
              ================================================== */}

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                    <Calculator size={19} />
                  </div>

                  <div>

                    <h3 className="font-semibold text-slate-200">
                      Risk & Reward
                    </h3>

                    <p className="text-xs text-slate-500">
                      Calculated automatically from your Entry, SL, TP and Lot Size.
                    </p>

                  </div>

                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  <CalculationCard
                    icon={
                      <ShieldAlert
                        size={17}
                      />
                    }
                    label="Risk Distance"
                    value={
                      tradeCalculations.riskDistance >
                      0
                        ? tradeCalculations.riskDistance.toFixed(
                            2
                          )
                        : "—"
                    }
                    tone="red"
                  />

                  <CalculationCard
                    icon={
                      <Target
                        size={17}
                      />
                    }
                    label="Reward Distance"
                    value={
                      tradeCalculations.rewardDistance >
                      0
                        ? tradeCalculations.rewardDistance.toFixed(
                            2
                          )
                        : "—"
                    }
                    tone="emerald"
                  />

                  <CalculationCard
                    label="Risk × Lot"
                    value={
                      tradeCalculations.riskAmount >
                      0
                        ? formatCurrency(
                            tradeCalculations.riskAmount,
                            selectedCurrency
                          )
                        : "—"
                    }
                    tone="red"
                  />

                  <CalculationCard
                    label="R:R"
                    value={
                      tradeCalculations.rrRatio >
                      0
                        ? `1:${tradeCalculations.rrRatio.toFixed(
                            2
                          )}`
                        : "—"
                    }
                    tone="emerald"
                  />

                </div>

                {tradeCalculations.rrRatio >
                  0 && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      tradeCalculations.rrRatio >=
                      2
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : tradeCalculations.rrRatio >=
                          1
                        ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {tradeCalculations.rrRatio >=
                    2
                      ? "Good risk/reward setup."
                      : tradeCalculations.rrRatio >=
                        1
                      ? "Acceptable risk/reward, but consider a better setup."
                      : "Low risk/reward. Consider reviewing the trade setup."}
                  </div>
                )}

              </div>

              {/* TEXT AREAS */}

              <div className="mt-5 grid gap-5">

                <FormField label="Entry Reason">

                  <textarea
                    name="entryReason"
                    value={
                      form.entryReason
                    }
                    onChange={
                      handleChange
                    }
                    className="input min-h-24 resize-y"
                    placeholder="Why did you enter this trade?"
                  />

                </FormField>

                <FormField label="Exit Reason">

                  <textarea
                    name="exitReason"
                    value={
                      form.exitReason
                    }
                    onChange={
                      handleChange
                    }
                    className="input min-h-24 resize-y"
                    placeholder="Why did you exit this trade?"
                  />

                </FormField>

                <FormField label="Notes">

                  <textarea
                    name="notes"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    className="input min-h-28 resize-y"
                    placeholder="Additional trade notes..."
                  />

                </FormField>

              </div>

              {/* CHECKBOXES */}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <Checkbox
                  name="followedPlan"
                  checked={
                    form.followedPlan
                  }
                  onChange={
                    handleChange
                  }
                  label="Followed trading plan"
                />

                <Checkbox
                  name="fomo"
                  checked={
                    form.fomo
                  }
                  onChange={
                    handleChange
                  }
                  label="FOMO trade"
                />

                <Checkbox
                  name="revengeTrade"
                  checked={
                    form.revengeTrade
                  }
                  onChange={
                    handleChange
                  }
                  label="Revenge trade"
                />

              </div>

              {/* FORM ERROR */}

              {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* FOOTER */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingTrade
                    ? "Update Trade"
                    : "Add Trade"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  subtitle,
  positive,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>

      <p
        className={`mt-2 text-sm ${
          positive
            ? "text-emerald-400"
            : "text-slate-500"
        }`}
      >
        {subtitle}
      </p>

    </div>
  );
}

// ============================================================
// CALCULATION CARD
// ============================================================

function CalculationCard({
  icon,
  label,
  value,
  tone,
}) {
  const toneClasses =
    tone === "red"
      ? "text-red-400 bg-red-500/10"
      : "text-emerald-400 bg-emerald-500/10";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

      <div className="flex items-center gap-2">

        {icon && (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}
          >
            {icon}
          </div>
        )}

        <span className="text-xs text-slate-500">
          {label}
        </span>

      </div>

      <p
        className={`mt-3 text-lg font-bold ${
          tone === "red"
            ? "text-red-400"
            : "text-emerald-400"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  children,
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      {children}

    </label>
  );
}

// ============================================================
// CHECKBOX
// ============================================================

function Checkbox({
  name,
  checked,
  onChange,
  label,
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700">

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-emerald-500"
      />

      <span className="text-sm text-slate-300">
        {label}
      </span>

    </label>
  );
}

export default Trades;