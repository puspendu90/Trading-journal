import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trophy,
  Target,
  Activity,
  WalletCards,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import api from "../services/api";
import { formatCurrency } from "../utils/currency";

function Analytics() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [selectedCurrency, setSelectedCurrency] =
    useState("USD");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // GET ACCOUNT CURRENCY
  // ============================================================

  const getAccountCurrency = (trade) => {
    const account = trade?.tradingAccount;

    if (account && typeof account === "object") {
      return account.currency || "USD";
    }

    const accountId = account;

    const matchedAccount = accounts.find(
      (item) => item._id === accountId
    );

    return matchedAccount?.currency || "USD";
  };

  // ============================================================
  // LOAD DATA
  // ============================================================

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        tradesResponse,
        accountsResponse,
      ] = await Promise.all([
        api.get("/trades"),
        api.get("/accounts"),
      ]);

      const tradeData = Array.isArray(
        tradesResponse.data
      )
        ? tradesResponse.data
        : tradesResponse.data?.trades || [];

      const accountData = Array.isArray(
        accountsResponse.data
      )
        ? accountsResponse.data
        : accountsResponse.data?.accounts || [];

      setTrades(
        Array.isArray(tradeData)
          ? tradeData
          : []
      );

      setAccounts(
        Array.isArray(accountData)
          ? accountData
          : []
      );
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load analytics data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // AVAILABLE CURRENCIES
  // ============================================================

  const availableCurrencies = useMemo(() => {
    const currencies = new Set();

    accounts.forEach((account) => {
      if (account.currency) {
        currencies.add(account.currency);
      }
    });

    trades.forEach((trade) => {
      currencies.add(
        getAccountCurrency(trade)
      );
    });

    return Array.from(currencies).sort();
  }, [accounts, trades]);

  // ============================================================
  // SET DEFAULT CURRENCY
  // ============================================================

  useEffect(() => {
    if (
      availableCurrencies.length > 0 &&
      !availableCurrencies.includes(
        selectedCurrency
      )
    ) {
      setSelectedCurrency(
        availableCurrencies[0]
      );
    }
  }, [
    availableCurrencies,
    selectedCurrency,
  ]);

  // ============================================================
  // FILTER CLOSED TRADES BY CURRENCY
  // ============================================================

  const closedTrades = useMemo(() => {
    return trades.filter((trade) => {
      const isClosed = [
        "WIN",
        "LOSS",
        "BREAKEVEN",
      ].includes(trade.outcome);

      const currency =
        getAccountCurrency(trade);

      return (
        isClosed &&
        currency === selectedCurrency
      );
    });
  }, [
    trades,
    accounts,
    selectedCurrency,
  ]);

  // ============================================================
  // ANALYTICS
  // ============================================================

  const analytics = useMemo(() => {
    const totalPL = closedTrades.reduce(
      (sum, trade) =>
        sum +
        Number(trade.profitLoss || 0),
      0
    );

    const winningTrades =
      closedTrades.filter(
        (trade) =>
          Number(
            trade.profitLoss || 0
          ) > 0
      );

    const losingTrades =
      closedTrades.filter(
        (trade) =>
          Number(
            trade.profitLoss || 0
          ) < 0
      );

    const breakevenTrades =
      closedTrades.filter(
        (trade) =>
          Number(
            trade.profitLoss || 0
          ) === 0
      );

    const grossProfit =
      winningTrades.reduce(
        (sum, trade) =>
          sum +
          Number(
            trade.profitLoss || 0
          ),
        0
      );

    const grossLoss = Math.abs(
      losingTrades.reduce(
        (sum, trade) =>
          sum +
          Number(
            trade.profitLoss || 0
          ),
        0
      )
    );

    const profitFactor =
      grossLoss > 0
        ? grossProfit / grossLoss
        : grossProfit > 0
        ? Infinity
        : 0;

    const winRate =
      closedTrades.length > 0
        ? (winningTrades.length /
            closedTrades.length) *
          100
        : 0;

    const averageWin =
      winningTrades.length > 0
        ? grossProfit /
          winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? grossLoss /
          losingTrades.length
        : 0;

    const bestTrade =
      closedTrades.length > 0
        ? Math.max(
            ...closedTrades.map(
              (trade) =>
                Number(
                  trade.profitLoss || 0
                )
            )
          )
        : 0;

    const worstTrade =
      closedTrades.length > 0
        ? Math.min(
            ...closedTrades.map(
              (trade) =>
                Number(
                  trade.profitLoss || 0
                )
            )
          )
        : 0;

    return {
      totalPL,
      winningTrades,
      losingTrades,
      breakevenTrades,
      grossProfit,
      grossLoss,
      profitFactor,
      winRate,
      averageWin,
      averageLoss,
      bestTrade,
      worstTrade,
    };
  }, [closedTrades]);

  // ============================================================
  // EQUITY CURVE
  // ============================================================

  const equityData = useMemo(() => {
    const sorted = [
      ...closedTrades,
    ].sort(
      (a, b) =>
        new Date(
          a.closedAt ||
            a.openedAt
        ) -
        new Date(
          b.closedAt ||
            b.openedAt
        )
    );

    let cumulative = 0;

    return sorted.map(
      (trade, index) => {
        cumulative += Number(
          trade.profitLoss || 0
        );

        return {
          trade: index + 1,
          equity: Number(
            cumulative.toFixed(2)
          ),
        };
      }
    );
  }, [closedTrades]);

  // ============================================================
  // SESSION DATA
  // ============================================================

  const sessionData = useMemo(() => {
    const sessions = {};

    closedTrades.forEach(
      (trade) => {
        const session =
          trade.session || "OTHER";

        if (!sessions[session]) {
          sessions[session] = {
            session,
            profitLoss: 0,
            trades: 0,
          };
        }

        sessions[
          session
        ].profitLoss += Number(
          trade.profitLoss || 0
        );

        sessions[
          session
        ].trades += 1;
      }
    );

    return Object.values(sessions)
      .map((item) => ({
        ...item,
        profitLoss: Number(
          item.profitLoss.toFixed(2)
        ),
      }))
      .sort(
        (a, b) =>
          b.profitLoss -
          a.profitLoss
      );
  }, [closedTrades]);

  // ============================================================
  // STRATEGY DATA
  // ============================================================

  const strategyData = useMemo(() => {
    const strategies = {};

    closedTrades.forEach(
      (trade) => {
        const strategy =
          trade.strategy?.trim() ||
          "No Strategy";

        if (!strategies[strategy]) {
          strategies[strategy] = {
            strategy,
            profitLoss: 0,
            trades: 0,
          };
        }

        strategies[
          strategy
        ].profitLoss += Number(
          trade.profitLoss || 0
        );

        strategies[
          strategy
        ].trades += 1;
      }
    );

    return Object.values(strategies)
      .map((item) => ({
        ...item,
        profitLoss: Number(
          item.profitLoss.toFixed(2)
        ),
      }))
      .sort(
        (a, b) =>
          b.profitLoss -
          a.profitLoss
      );
  }, [closedTrades]);

  // ============================================================
  // DAILY DATA
  // ============================================================

  const dailyData = useMemo(() => {
    const days = {};

    closedTrades.forEach(
      (trade) => {
        const dateValue =
          trade.closedAt ||
          trade.openedAt ||
          trade.createdAt;

        if (!dateValue) return;

        const date =
          new Date(dateValue);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }

        const key =
          date
            .toISOString()
            .slice(0, 10);

        if (!days[key]) {
          days[key] = {
            date: key,
            profitLoss: 0,
            trades: 0,
          };
        }

        days[
          key
        ].profitLoss += Number(
          trade.profitLoss || 0
        );

        days[key].trades += 1;
      }
    );

    return Object.values(days)
      .map((item) => ({
        ...item,

        profitLoss: Number(
          item.profitLoss.toFixed(2)
        ),

        label: new Date(
          `${item.date}T00:00:00`
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        ),
      }))
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [closedTrades]);

  // ============================================================
  // MONEY FORMATTER
  // ============================================================

  const formatMoney = (value) => {
    const number =
      Number(value || 0);

    return `${number >= 0 ? "+" : "-"}${formatCurrency(
      Math.abs(number),
      selectedCurrency
    )}`;
  };

  // ============================================================
  // PROFIT FACTOR FORMATTER
  // ============================================================

  const formatFactor = (value) => {
    if (value === Infinity) {
      return "∞";
    }

    return Number(
      value || 0
    ).toFixed(2);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />

            <p className="text-sm text-slate-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-cyan-500/10 p-3">
              <BarChart3 className="h-6 w-6 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Analytics
              </h1>

              <p className="text-sm text-slate-400">
                Understand your trading performance.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* CURRENCY SELECTOR */}

            {availableCurrencies.length >
              0 && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3">

                <WalletCards
                  size={17}
                  className="text-slate-500"
                />

                <select
                  value={
                    selectedCurrency
                  }
                  onChange={(event) =>
                    setSelectedCurrency(
                      event.target.value
                    )
                  }
                  className="bg-transparent py-2.5 text-sm font-semibold text-white outline-none"
                >
                  {availableCurrencies.map(
                    (currency) => (
                      <option
                        key={currency}
                        value={currency}
                        className="bg-slate-900"
                      >
                        {currency}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* REFRESH */}

            <button
              onClick={() =>
                fetchData(true)
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>
        </div>

        {/* ======================================================
            CURRENCY INFO
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-400">
              Analytics Currency
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Showing performance for{" "}
              <span className="font-bold text-white">
                {selectedCurrency}
              </span>{" "}
              accounts only.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {closedTrades.length} closed{" "}
            {closedTrades.length === 1
              ? "trade"
              : "trades"}
          </div>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ======================================================
            KPI CARDS
        ====================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

          <MetricCard
            icon={<WalletCards />}
            title="Total P/L"
            value={formatMoney(
              analytics.totalPL
            )}
            valueClass={
              analytics.totalPL >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }
          />

          <MetricCard
            icon={<Target />}
            title="Win Rate"
            value={`${analytics.winRate.toFixed(
              1
            )}%`}
            valueClass="text-cyan-400"
          />

          <MetricCard
            icon={<Activity />}
            title="Profit Factor"
            value={formatFactor(
              analytics.profitFactor
            )}
            valueClass="text-violet-400"
          />

          <MetricCard
            icon={<Trophy />}
            title="Best Trade"
            value={formatMoney(
              analytics.bestTrade
            )}
            valueClass="text-emerald-400"
          />
        </div>

        {/* ======================================================
            SECONDARY STATS
        ====================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          <SmallMetric
            label="Trades"
            value={
              closedTrades.length
            }
          />

          <SmallMetric
            label="Wins"
            value={
              analytics.winningTrades
                .length
            }
            valueClass="text-emerald-400"
          />

          <SmallMetric
            label="Losses"
            value={
              analytics.losingTrades
                .length
            }
            valueClass="text-red-400"
          />

          <SmallMetric
            label="Breakeven"
            value={
              analytics.breakevenTrades
                .length
            }
          />

          <SmallMetric
            label="Avg Win"
            value={formatMoney(
              analytics.averageWin
            )}
            valueClass="text-emerald-400"
          />

          <SmallMetric
            label="Avg Loss"
            value={formatMoney(
              -analytics.averageLoss
            )}
            valueClass="text-red-400"
          />
        </div>

        {/* ======================================================
            EQUITY CURVE
        ====================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">

          <div className="mb-5">
            <h2 className="text-lg font-bold sm:text-xl">
              Equity Curve
            </h2>

            <p className="text-xs text-slate-500">
              Cumulative profit/loss for{" "}
              {selectedCurrency} accounts.
            </p>
          </div>

          <div className="h-[300px] w-full sm:h-[380px]">

            {equityData.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={
                    equityData
                  }
                >
                  <defs>
                    <linearGradient
                      id="equityGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={
                          0.25
                        }
                      />

                      <stop
                        offset="95%"
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
                    dataKey="trade"
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        "#0f172a",
                      border:
                        "1px solid #1e293b",
                      borderRadius:
                        "12px",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                    }}
                    formatter={(
                      value
                    ) => [
                      formatCurrency(
                        Number(
                          value
                        ),
                        selectedCurrency
                      ),
                      "Equity",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#10b981"
                    fill="url(#equityGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No closed trades available for this currency." />
            )}
          </div>
        </section>

        {/* ======================================================
            DAILY PERFORMANCE
        ====================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">

          <div className="mb-5">
            <h2 className="text-lg font-bold sm:text-xl">
              Daily Performance
            </h2>

            <p className="text-xs text-slate-500">
              Profit and loss by trading day.
            </p>
          </div>

          <div className="h-[300px] w-full sm:h-[350px]">

            {dailyData.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    dailyData
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor:
                        "#0f172a",
                      border:
                        "1px solid #1e293b",
                      borderRadius:
                        "12px",
                    }}
                    formatter={(
                      value
                    ) => [
                      formatCurrency(
                        Number(
                          value
                        ),
                        selectedCurrency
                      ),
                      "P/L",
                    ]}
                  />

                  <Bar
                    dataKey="profitLoss"
                    fill="#06b6d4"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No daily performance data for this currency." />
            )}
          </div>
        </section>

        {/* ======================================================
            SESSION + STRATEGY
        ====================================================== */}

        <div className="mb-6 grid gap-6 xl:grid-cols-2">

          <PerformanceTable
            title="Performance by Session"
            subtitle="See which trading session performs best."
            data={
              sessionData
            }
            nameKey="session"
            currency={
              selectedCurrency
            }
          />

          <PerformanceTable
            title="Performance by Strategy"
            subtitle="Compare your trading strategies."
            data={
              strategyData
            }
            nameKey="strategy"
            currency={
              selectedCurrency
            }
          />
        </div>

        {/* ======================================================
            BEST / WORST
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          <TradeHighlight
            title="Best Trade"
            icon={<TrendingUp />}
            trade={
              analytics.winningTrades
                .length > 0
                ? [
                    ...analytics.winningTrades,
                  ].sort(
                    (a, b) =>
                      Number(
                        b.profitLoss ||
                          0
                      ) -
                      Number(
                        a.profitLoss ||
                          0
                      )
                  )[0]
                : null
            }
            positive
            currency={
              selectedCurrency
            }
          />

          <TradeHighlight
            title="Worst Trade"
            icon={<TrendingDown />}
            trade={
              analytics.losingTrades
                .length > 0
                ? [
                    ...analytics.losingTrades,
                  ].sort(
                    (a, b) =>
                      Number(
                        a.profitLoss ||
                          0
                      ) -
                      Number(
                        b.profitLoss ||
                          0
                      )
                  )[0]
                : null
            }
            currency={
              selectedCurrency
            }
          />
        </div>
      </main>
    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  icon,
  title,
  value,
  valueClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">

      <div className="mb-4 flex items-center justify-between">

        <div className="rounded-xl bg-slate-950 p-2 text-slate-400">
          <span className="block h-5 w-5">
            {icon}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p
        className={`mt-1 text-xl font-bold sm:text-2xl ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================
// SMALL METRIC
// ============================================================

function SmallMetric({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">

      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================
// PERFORMANCE TABLE
// ============================================================

function PerformanceTable({
  title,
  subtitle,
  data,
  nameKey,
  currency,
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">

      <div className="mb-5">
        <h2 className="text-lg font-bold">
          {title}
        </h2>

        <p className="text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
          No data available.
        </div>
      ) : (
        <div className="space-y-3">

          {data.map((item) => {
            const positive =
              item.profitLoss > 0;

            const negative =
              item.profitLoss < 0;

            return (
              <div
                key={item[nameKey]}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
              >

                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-slate-200">
                    {formatLabel(
                      item[nameKey]
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.trades}{" "}
                    {item.trades ===
                    1
                      ? "trade"
                      : "trades"}
                  </p>
                </div>

                <p
                  className={`shrink-0 text-sm font-bold ${
                    positive
                      ? "text-emerald-400"
                      : negative
                      ? "text-red-400"
                      : "text-slate-300"
                  }`}
                >
                  {item.profitLoss >=
                  0
                    ? "+"
                    : "-"}

                  {formatCurrency(
                    Math.abs(
                      item.profitLoss
                    ),
                    currency
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================
// TRADE HIGHLIGHT
// ============================================================

function TradeHighlight({
  title,
  icon,
  trade,
  positive = false,
  currency,
}) {
  if (!trade) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">

        <div className="mb-4 flex items-center gap-3">

          <div className="rounded-xl bg-slate-950 p-2 text-slate-500">
            {icon}
          </div>

          <h2 className="font-bold">
            {title}
          </h2>
        </div>

        <p className="text-sm text-slate-500">
          No trade available.
        </p>
      </section>
    );
  }

  const profit =
    Number(
      trade.profitLoss || 0
    );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">

      <div className="mb-5 flex items-center gap-3">

        <div
          className={`rounded-xl p-2 ${
            positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {icon}
        </div>

        <div>
          <h2 className="font-bold">
            {title}
          </h2>

          <p className="text-xs text-slate-500">
            {trade.symbol}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">

        <div>
          <p className="text-xs text-slate-500">
            Direction
          </p>

          <p className="mt-1 font-semibold">
            {trade.direction}
          </p>
        </div>

        <p
          className={`text-2xl font-bold ${
            positive
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {profit >= 0
            ? "+"
            : "-"}

          {formatCurrency(
            Math.abs(profit),
            currency
          )}
        </p>
      </div>
    </section>
  );
}

// ============================================================
// EMPTY CHART
// ============================================================

function EmptyChart({
  message,
}) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800">

      <p className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}

// ============================================================
// LABEL FORMATTER
// ============================================================

function formatLabel(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default Analytics;