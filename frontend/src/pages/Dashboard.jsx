import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../services/api";
import { formatCurrency } from "../utils/currency";

function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [accountsResponse, tradesResponse] = await Promise.all([
        api.get("/accounts"),
        api.get("/trades"),
      ]);

      const accountData =
        accountsResponse?.data?.accounts ||
        accountsResponse?.data?.data ||
        [];

      const tradeData =
        tradesResponse?.data?.trades ||
        tradesResponse?.data?.data ||
        [];

      setAccounts(Array.isArray(accountData) ? accountData : []);
      setTrades(Array.isArray(tradeData) ? tradeData : []);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =========================================================
  // ACCOUNT HELPERS
  // =========================================================

  const getAccountId = (account) => {
    return account?._id || account?.id;
  };

  const getTradeAccountId = (trade) => {
    if (!trade) return null;

    if (typeof trade.tradingAccount === "object") {
      return (
        trade.tradingAccount?._id ||
        trade.tradingAccount?.id ||
        null
      );
    }

    return (
      trade.tradingAccount ||
      trade.accountId ||
      trade.account ||
      null
    );
  };

  const getAccountByTrade = (trade) => {
    const tradeAccountId = getTradeAccountId(trade);

    if (!tradeAccountId) return null;

    return (
      accounts.find(
        (account) =>
          String(getAccountId(account)) === String(tradeAccountId)
      ) || null
    );
  };

  const getCurrency = (tradeOrAccount) => {
    if (!tradeOrAccount) return "USD";

    if (tradeOrAccount.currency) {
      return tradeOrAccount.currency;
    }

    if (tradeOrAccount.tradingAccount?.currency) {
      return tradeOrAccount.tradingAccount.currency;
    }

    if (tradeOrAccount.account?.currency) {
      return tradeOrAccount.account.currency;
    }

    const account = getAccountByTrade(tradeOrAccount);

    return account?.currency || "USD";
  };

  const getAccountName = (trade) => {
    if (trade?.tradingAccount?.name) {
      return trade.tradingAccount.name;
    }

    const account = getAccountByTrade(trade);

    return (
      account?.name ||
      account?.accountName ||
      "Trading Account"
    );
  };

  // =========================================================
  // NUMBER HELPERS
  // =========================================================

  const getNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
  };

  const getTradeProfitLoss = (trade) => {
    return getNumber(
      trade?.profitLoss ??
        trade?.profit ??
        trade?.pnl ??
        trade?.PL ??
        trade?.netProfit
    );
  };

  const getAccountBalance = (account) => {
    return getNumber(
      account?.currentBalance ??
        account?.balance ??
        account?.accountBalance ??
        account?.initialBalance
    );
  };

  // =========================================================
  // TOTAL BALANCE BY CURRENCY
  // =========================================================

  const balanceByCurrency = useMemo(() => {
    const result = {};

    accounts.forEach((account) => {
      const currency = account?.currency || "USD";
      const balance = getAccountBalance(account);

      if (!result[currency]) {
        result[currency] = 0;
      }

      result[currency] += balance;
    });

    return result;
  }, [accounts]);

  // =========================================================
  // P/L BY CURRENCY
  // =========================================================

  const profitLossByCurrency = useMemo(() => {
    const result = {};

    trades.forEach((trade) => {
      const currency = getCurrency(trade);
      const pnl = getTradeProfitLoss(trade);

      if (!result[currency]) {
        result[currency] = 0;
      }

      result[currency] += pnl;
    });

    return result;
  }, [trades, accounts]);

  // =========================================================
  // GLOBAL TRADE STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const totalTrades = trades.length;

    const winningTrades = trades.filter(
      (trade) => getTradeProfitLoss(trade) > 0
    );

    const losingTrades = trades.filter(
      (trade) => getTradeProfitLoss(trade) < 0
    );

    const totalProfit = winningTrades.reduce(
      (sum, trade) => sum + getTradeProfitLoss(trade),
      0
    );

    const totalLoss = losingTrades.reduce(
      (sum, trade) => sum + getTradeProfitLoss(trade),
      0
    );

    const winRate =
      totalTrades > 0
        ? (winningTrades.length / totalTrades) * 100
        : 0;

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      totalLoss,
      winRate,
    };
  }, [trades]);

  // =========================================================
  // RECENT TRADES
  // =========================================================

  const recentTrades = useMemo(() => {
    return [...trades]
      .sort((a, b) => {
        const dateA = new Date(
          a?.date ||
            a?.tradeDate ||
            a?.createdAt ||
            0
        );

        const dateB = new Date(
          b?.date ||
            b?.tradeDate ||
            b?.createdAt ||
            0
        );

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [trades]);

  // =========================================================
  // CHART DATA
  // =========================================================

  const chartData = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = new Date(
        a?.date ||
          a?.tradeDate ||
          a?.createdAt ||
          0
      );

      const dateB = new Date(
        b?.date ||
          b?.tradeDate ||
          b?.createdAt ||
          0
      );

      return dateA - dateB;
    });

    const running = {};

    return sortedTrades.slice(-20).map((trade, index) => {
      const currency = getCurrency(trade);

      if (!running[currency]) {
        running[currency] = 0;
      }

      running[currency] += getTradeProfitLoss(trade);

      return {
        name: `Trade ${index + 1}`,
        value: Number(running[currency].toFixed(2)),
        currency,
      };
    });
  }, [trades, accounts]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />

          <h2 className="text-lg font-semibold">
            Loading Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Fetching your trading data...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Trading Dashboard
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Track your trading performance and account activity.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-500/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div>
                <p className="font-medium text-red-300">
                  Dashboard Error
                </p>

                <p className="mt-1 text-sm text-red-200/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            STAT CARDS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Accounts */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Trading Accounts
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {accounts.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-500/10 p-3">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Active accounts connected to your journal
            </p>
          </div>

          {/* Trades */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Total Trades
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {statistics.totalTrades}
                </p>
              </div>

              <div className="rounded-xl bg-purple-500/10 p-3">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs">
              <span className="text-emerald-400">
                {statistics.winningTrades} wins
              </span>

              <span className="text-red-400">
                {statistics.losingTrades} losses
              </span>
            </div>
          </div>

          {/* Win Rate */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Win Rate
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {statistics.winRate.toFixed(1)}%
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3">
                <Target className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    statistics.winRate,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* P/L */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Total P/L
                </p>

                <div className="mt-2 space-y-1">
                  {Object.keys(profitLossByCurrency).length > 0 ? (
                    Object.entries(profitLossByCurrency).map(
                      ([currency, value]) => (
                        <p
                          key={currency}
                          className={`text-xl font-bold ${
                            value >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatCurrency(value, currency)}
                        </p>
                      )
                    )
                  ) : (
                    <p className="text-2xl font-bold text-slate-300">
                      —
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3">
                {statistics.totalProfit +
                  statistics.totalLoss >=
                0 ? (
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-400" />
                )}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Profit and loss grouped by account currency
            </p>
          </div>
        </div>

        {/* =====================================================
            BALANCE SECTION
        ====================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Account Balances */}

          <div className="xl:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Account Balances
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Current balance by currency
                </p>
              </div>

              <CircleDollarSign className="h-5 w-5 text-emerald-400" />
            </div>

            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <Wallet className="mx-auto h-8 w-8 text-slate-600" />

                <p className="mt-3 text-sm text-slate-400">
                  No trading accounts found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => {
                  const currency =
                    account?.currency || "USD";

                  const balance =
                    getAccountBalance(account);

                  return (
                    <div
                      key={getAccountId(account)}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-200">
                            {account?.name ||
                              account?.accountName ||
                              "Trading Account"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {currency}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {currency}
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-bold text-white">
                        {formatCurrency(
                          balance,
                          currency
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chart */}

          <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Performance
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Recent cumulative trading performance
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Last 20 trades
              </div>
            </div>

            <div className="h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-slate-700" />

                    <p className="mt-3 text-sm text-slate-500">
                      Add trades to see your performance chart.
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="dashboardPerformance"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.35}
                        />

                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{
                        fill: "#64748b",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border:
                          "1px solid #334155",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      formatter={(value, name, props) => {
                        const currency =
                          props?.payload?.currency ||
                          "USD";

                        return [
                          formatCurrency(
                            value,
                            currency
                          ),
                          "P/L",
                        ];
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#dashboardPerformance)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            RECENT TRADES
        ====================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Recent Trades
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your latest trading activity
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Latest activity
            </div>
          </div>

          {recentTrades.length === 0 ? (
            <div className="p-10 text-center">
              <Activity className="mx-auto h-10 w-10 text-slate-700" />

              <p className="mt-3 text-sm text-slate-500">
                No trades available yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-medium">
                      Symbol
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Direction
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Account
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right font-medium">
                      P/L
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentTrades.map((trade) => {
                    const pnl =
                      getTradeProfitLoss(trade);

                    const currency =
                      getCurrency(trade);

                    const symbol =
                      trade?.symbol ||
                      trade?.instrument ||
                      trade?.pair ||
                      "—";

                    const side =
                      trade?.type ||
                      trade?.side ||
                      trade?.direction ||
                      "—";

                    const isBuy =
                      String(side).toLowerCase() ===
                        "buy" ||
                      String(side).toLowerCase() ===
                        "long";

                    return (
                      <tr
                        key={
                          trade?._id ||
                          trade?.id ||
                          Math.random()
                        }
                        className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-200">
                            {symbol}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                              isBuy
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {isBuy ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}

                            {side}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="max-w-[180px] truncate text-sm text-slate-300">
                              {getAccountName(trade)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {currency}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {formatDate(
                            trade?.date ||
                              trade?.tradeDate ||
                              trade?.createdAt
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className={`font-semibold ${
                              pnl > 0
                                ? "text-emerald-400"
                                : pnl < 0
                                ? "text-red-400"
                                : "text-slate-400"
                            }`}
                          >
                            {formatCurrency(
                              pnl,
                              currency
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================================
            CURRENCY SUMMARY
        ====================================================== */}

        {Object.keys(balanceByCurrency).length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(balanceByCurrency).map(
              ([currency, balance]) => (
                <div
                  key={currency}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Total Balance
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-300">
                        {currency} Accounts
                      </p>
                    </div>

                    <CircleDollarSign className="h-5 w-5 text-emerald-400" />
                  </div>

                  <p className="mt-4 text-2xl font-bold">
                    {formatCurrency(
                      balance,
                      currency
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="py-8 text-center text-xs text-slate-600">
          Trading Journal • Keep tracking. Keep improving.
        </div>
      </div>
    </div>
  );
}

export default Dashboard;