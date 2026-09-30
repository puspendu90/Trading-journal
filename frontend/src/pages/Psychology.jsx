import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  HeartPulse,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import api from "../services/api";
import { formatCurrency } from "../utils/currency";

function Psychology() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedCurrency, setSelectedCurrency] =
    useState("USD");

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [tradesResponse, accountsResponse] =
        await Promise.all([
          api.get("/trades"),
          api.get("/accounts"),
        ]);

      const tradeData = Array.isArray(tradesResponse.data)
        ? tradesResponse.data
        : tradesResponse.data.trades || [];

      const accountData = Array.isArray(accountsResponse.data)
        ? accountsResponse.data
        : accountsResponse.data.accounts || [];

      setTrades(tradeData);
      setAccounts(accountData);
    } catch (err) {
      console.error("Psychology error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load psychology data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /*
   * Get account ID from trade.
   */
  const getTradeAccountId = (trade) => {
    if (trade.tradingAccount?._id) {
      return trade.tradingAccount._id;
    }

    if (trade.tradingAccount?.id) {
      return trade.tradingAccount.id;
    }

    if (typeof trade.tradingAccount === "string") {
      return trade.tradingAccount;
    }

    if (trade.account?._id) {
      return trade.account._id;
    }

    if (trade.account?.id) {
      return trade.account.id;
    }

    if (typeof trade.account === "string") {
      return trade.account;
    }

    return null;
  };

  /*
   * Get currency belonging to a trade.
   */
  const getAccountCurrency = (trade) => {
    if (trade.tradingAccount?.currency) {
      return trade.tradingAccount.currency;
    }

    if (trade.account?.currency) {
      return trade.account.currency;
    }

    const accountId = getTradeAccountId(trade);

    const account = accounts.find(
      (item) => item._id === accountId
    );

    return account?.currency || "USD";
  };

  /*
   * Find all currencies used by the user's accounts/trades.
   */
  const availableCurrencies = useMemo(() => {
    const currencies = new Set();

    trades.forEach((trade) => {
      currencies.add(getAccountCurrency(trade));
    });

    accounts.forEach((account) => {
      if (account.currency) {
        currencies.add(account.currency);
      }
    });

    return Array.from(currencies).sort();
  }, [trades, accounts]);

  /*
   * Automatically switch to an available currency.
   */
  useEffect(() => {
    if (
      availableCurrencies.length > 0 &&
      !availableCurrencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

  /*
   * Currency-aware money formatter.
   */
  const formatMoney = (value) => {
    const number = Number(value || 0);

    return `${number >= 0 ? "+" : "-"}${formatCurrency(
      Math.abs(number),
      selectedCurrency
    )}`;
  };

  /*
   * Only closed trades belonging to selected currency.
   */
  const closedTrades = useMemo(() => {
    return trades.filter(
      (trade) =>
        getAccountCurrency(trade) === selectedCurrency &&
        ["WIN", "LOSS", "BREAKEVEN"].includes(
          trade.outcome
        )
    );
  }, [trades, accounts, selectedCurrency]);

  /*
   * Psychology statistics.
   */
  const psychologyStats = useMemo(() => {
    const total = closedTrades.length;

    const fomoTrades = closedTrades.filter(
      (trade) => trade.fomo === true
    );

    const revengeTrades = closedTrades.filter(
      (trade) => trade.revengeTrade === true
    );

    const planFollowed = closedTrades.filter(
      (trade) => trade.followedPlan === true
    );

    const planBroken = closedTrades.filter(
      (trade) => trade.followedPlan === false
    );

    const confidenceValues = closedTrades
      .map((trade) =>
        Number(trade.confidenceLevel)
      )
      .filter(
        (value) =>
          Number.isFinite(value) &&
          value >= 1 &&
          value <= 10
      );

    const averageConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce(
            (sum, value) => sum + value,
            0
          ) / confidenceValues.length
        : 0;

    const totalPL = closedTrades.reduce(
      (sum, trade) =>
        sum + Number(trade.profitLoss || 0),
      0
    );

    const fomoPL = fomoTrades.reduce(
      (sum, trade) =>
        sum + Number(trade.profitLoss || 0),
      0
    );

    const revengePL = revengeTrades.reduce(
      (sum, trade) =>
        sum + Number(trade.profitLoss || 0),
      0
    );

    const planFollowedPL = planFollowed.reduce(
      (sum, trade) =>
        sum + Number(trade.profitLoss || 0),
      0
    );

    const planBrokenPL = planBroken.reduce(
      (sum, trade) =>
        sum + Number(trade.profitLoss || 0),
      0
    );

    const fomoWinRate =
      fomoTrades.length > 0
        ? (fomoTrades.filter(
            (trade) =>
              Number(trade.profitLoss || 0) > 0
          ).length /
            fomoTrades.length) *
          100
        : 0;

    const revengeWinRate =
      revengeTrades.length > 0
        ? (revengeTrades.filter(
            (trade) =>
              Number(trade.profitLoss || 0) > 0
          ).length /
            revengeTrades.length) *
          100
        : 0;

    const planFollowedWinRate =
      planFollowed.length > 0
        ? (planFollowed.filter(
            (trade) =>
              Number(trade.profitLoss || 0) > 0
          ).length /
            planFollowed.length) *
          100
        : 0;

    const planBrokenWinRate =
      planBroken.length > 0
        ? (planBroken.filter(
            (trade) =>
              Number(trade.profitLoss || 0) > 0
          ).length /
            planBroken.length) *
          100
        : 0;

    return {
      total,
      fomoTrades,
      revengeTrades,
      planFollowed,
      planBroken,
      confidenceValues,
      averageConfidence,
      totalPL,
      fomoPL,
      revengePL,
      planFollowedPL,
      planBrokenPL,
      fomoWinRate,
      revengeWinRate,
      planFollowedWinRate,
      planBrokenWinRate,
    };
  }, [closedTrades]);

  /*
   * Emotional patterns.
   */
  const emotionData = useMemo(() => {
    const emotions = {};

    closedTrades.forEach((trade) => {
      const emotion =
        trade.emotionBefore?.trim() ||
        "Not recorded";

      if (!emotions[emotion]) {
        emotions[emotion] = {
          emotion,
          trades: 0,
          profitLoss: 0,
          wins: 0,
          losses: 0,
        };
      }

      emotions[emotion].trades += 1;

      emotions[emotion].profitLoss += Number(
        trade.profitLoss || 0
      );

      if (Number(trade.profitLoss || 0) > 0) {
        emotions[emotion].wins += 1;
      }

      if (Number(trade.profitLoss || 0) < 0) {
        emotions[emotion].losses += 1;
      }
    });

    return Object.values(emotions)
      .map((item) => ({
        ...item,
        profitLoss: Number(
          item.profitLoss.toFixed(2)
        ),
        winRate:
          item.trades > 0
            ? (item.wins / item.trades) * 100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.profitLoss - a.profitLoss
      );
  }, [closedTrades]);

  /*
   * Confidence analysis.
   */
  const confidenceData = useMemo(() => {
    const groups = {};

    closedTrades.forEach((trade) => {
      const confidence = Number(
        trade.confidenceLevel
      );

      if (
        !Number.isFinite(confidence) ||
        confidence < 1 ||
        confidence > 10
      ) {
        return;
      }

      if (!groups[confidence]) {
        groups[confidence] = {
          confidence,
          trades: 0,
          profitLoss: 0,
          wins: 0,
        };
      }

      groups[confidence].trades += 1;

      groups[confidence].profitLoss += Number(
        trade.profitLoss || 0
      );

      if (Number(trade.profitLoss || 0) > 0) {
        groups[confidence].wins += 1;
      }
    });

    return Object.values(groups)
      .map((item) => ({
        ...item,
        profitLoss: Number(
          item.profitLoss.toFixed(2)
        ),
        winRate:
          item.trades > 0
            ? (item.wins / item.trades) * 100
            : 0,
      }))
      .sort(
        (a, b) =>
          a.confidence - b.confidence
      );
  }, [closedTrades]);

  /*
   * Recent psychology trades.
   */
  const recentPsychologyTrades = useMemo(() => {
    return [...closedTrades]
      .sort(
        (a, b) =>
          new Date(
            b.closedAt ||
              b.openedAt ||
              b.createdAt
          ) -
          new Date(
            a.closedAt ||
              a.openedAt ||
              a.createdAt
          )
      )
      .slice(0, 10);
  }, [closedTrades]);

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-violet-400" />

            <p className="text-sm text-slate-400">
              Loading psychology journal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-3">
              <Brain className="h-6 w-6 text-violet-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Psychology Journal
              </h1>

              <p className="text-sm text-slate-400">
                Understand how your mindset affects your trading.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Currency Selector */}
            {availableCurrencies.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                <WalletCards className="h-4 w-4 text-violet-400" />

                <select
                  value={selectedCurrency}
                  onChange={(event) => {
                    setSelectedCurrency(
                      event.target.value
                    );
                  }}
                  className="bg-transparent text-sm font-medium text-slate-200 outline-none"
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

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
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

        {/* Currency Info */}
        {availableCurrencies.length > 1 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />

            <div>
              <p className="text-sm font-semibold text-violet-300">
                Psychology currency: {selectedCurrency}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Psychology results are calculated only
                from trades using the selected currency.
                Different currencies are never combined.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Psychology Overview */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

          <PsychologyCard
            icon={<Brain />}
            label="Avg Confidence"
            value={
              psychologyStats.averageConfidence > 0
                ? `${psychologyStats.averageConfidence.toFixed(
                    1
                  )}/10`
                : "N/A"
            }
            valueClass="text-violet-400"
          />

          <PsychologyCard
            icon={<AlertTriangle />}
            label="FOMO Trades"
            value={
              psychologyStats.fomoTrades.length
            }
            valueClass={
              psychologyStats.fomoTrades.length > 0
                ? "text-amber-400"
                : "text-emerald-400"
            }
          />

          <PsychologyCard
            icon={<TrendingDown />}
            label="Revenge Trades"
            value={
              psychologyStats.revengeTrades.length
            }
            valueClass={
              psychologyStats.revengeTrades.length > 0
                ? "text-red-400"
                : "text-emerald-400"
            }
          />

          <PsychologyCard
            icon={<ShieldCheck />}
            label="Plan Followed"
            value={
              psychologyStats.planFollowed.length
            }
            valueClass="text-emerald-400"
          />

          <PsychologyCard
            icon={<Target />}
            label="Plan Broken"
            value={
              psychologyStats.planBroken.length
            }
            valueClass={
              psychologyStats.planBroken.length > 0
                ? "text-red-400"
                : "text-slate-300"
            }
          />
        </div>

        {/* Behavior Analysis */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          <BehaviorCard
            title="FOMO Analysis"
            description="How fear of missing out affects your results."
            icon={<AlertTriangle />}
            trades={
              psychologyStats.fomoTrades.length
            }
            profitLoss={
              psychologyStats.fomoPL
            }
            winRate={
              psychologyStats.fomoWinRate
            }
            currency={selectedCurrency}
            warning={
              psychologyStats.fomoTrades.length > 0
            }
          />

          <BehaviorCard
            title="Revenge Trading Analysis"
            description="Track trades taken after emotional losses."
            icon={<TrendingDown />}
            trades={
              psychologyStats.revengeTrades.length
            }
            profitLoss={
              psychologyStats.revengePL
            }
            winRate={
              psychologyStats.revengeWinRate
            }
            currency={selectedCurrency}
            warning={
              psychologyStats.revengeTrades.length > 0
            }
          />
        </div>

        {/* Trading Plan */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                Trading Plan Discipline
              </h2>

              <p className="text-xs text-slate-500">
                Compare results when you follow your plan versus when you don't.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlanResult
              title="Plan Followed"
              trades={
                psychologyStats.planFollowed.length
              }
              profitLoss={
                psychologyStats.planFollowedPL
              }
              winRate={
                psychologyStats.planFollowedWinRate
              }
              currency={selectedCurrency}
              positive
            />

            <PlanResult
              title="Plan Broken"
              trades={
                psychologyStats.planBroken.length
              }
              profitLoss={
                psychologyStats.planBrokenPL
              }
              winRate={
                psychologyStats.planBrokenWinRate
              }
              currency={selectedCurrency}
            />
          </div>
        </section>

        {/* Emotional Patterns */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-pink-500/10 p-2.5">
              <HeartPulse className="h-5 w-5 text-pink-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold sm:text-xl">
                Emotional Patterns
              </h2>

              <p className="text-xs text-slate-500">
                Performance based on your emotional state before entering trades.
              </p>
            </div>
          </div>

          {emotionData.length === 0 ? (
            <EmptyState message="No emotional data recorded yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {emotionData.map((item) => (
                <div
                  key={item.emotion}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-200">
                      {item.emotion}
                    </p>

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-400">
                      {item.trades} trades
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">
                        P/L
                      </p>

                      <p
                        className={`mt-1 text-lg font-bold ${
                          item.profitLoss > 0
                            ? "text-emerald-400"
                            : item.profitLoss < 0
                            ? "text-red-400"
                            : "text-slate-300"
                        }`}
                      >
                        {formatMoney(
                          item.profitLoss
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-slate-600">
                        Win Rate
                      </p>

                      <p className="mt-1 text-sm font-semibold text-cyan-400">
                        {item.winRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Confidence Analysis */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold sm:text-xl">
              Confidence Analysis
            </h2>

            <p className="text-xs text-slate-500">
              Compare confidence levels with actual trading results.
            </p>
          </div>

          {confidenceData.length === 0 ? (
            <EmptyState message="No confidence levels recorded yet." />
          ) : (
            <div className="space-y-3">
              {confidenceData.map((item) => {
                const percentage =
                  item.confidence * 10;

                return (
                  <div
                    key={item.confidence}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-sm font-bold text-violet-400">
                          {item.confidence}
                        </span>

                        <div>
                          <p className="text-sm font-semibold">
                            Confidence {item.confidence}/10
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.trades}{" "}
                            {item.trades === 1
                              ? "trade"
                              : "trades"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            item.profitLoss > 0
                              ? "text-emerald-400"
                              : item.profitLoss < 0
                              ? "text-red-400"
                              : "text-slate-300"
                          }`}
                        >
                          {formatMoney(
                            item.profitLoss
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.winRate.toFixed(1)}% win
                        </p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Psychology Trades */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold sm:text-xl">
              Recent Psychology Records
            </h2>

            <p className="text-xs text-slate-500">
              Your latest trades and their psychological context.
            </p>
          </div>

          {recentPsychologyTrades.length === 0 ? (
            <EmptyState message="No closed trades available." />
          ) : (
            <div className="space-y-3">
              {recentPsychologyTrades.map(
                (trade) => {
                  const profitLoss = Number(
                    trade.profitLoss || 0
                  );

                  return (
                    <div
                      key={trade._id}
                      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-xl p-2.5 ${
                              trade.direction ===
                              "BUY"
                                ? "bg-emerald-500/10"
                                : "bg-red-500/10"
                            }`}
                          >
                            {trade.direction ===
                            "BUY" ? (
                              <TrendingUp className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-400" />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold">
                                {trade.symbol}
                              </p>

                              <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-400">
                                {trade.direction}
                              </span>

                              {trade.fomo && (
                                <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-400">
                                  FOMO
                                </span>
                              )}

                              {trade.revengeTrade && (
                                <span className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400">
                                  REVENGE
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(
                                trade.closedAt ||
                                  trade.openedAt
                              )}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`text-lg font-bold ${
                            profitLoss > 0
                              ? "text-emerald-400"
                              : profitLoss < 0
                              ? "text-red-400"
                              : "text-slate-300"
                          }`}
                        >
                          {formatMoney(
                            profitLoss
                          )}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-4">
                        <PsychologyDetail
                          label="Before"
                          value={
                            trade.emotionBefore ||
                            "Not recorded"
                          }
                        />

                        <PsychologyDetail
                          label="After"
                          value={
                            trade.emotionAfter ||
                            "Not recorded"
                          }
                        />

                        <PsychologyDetail
                          label="Confidence"
                          value={
                            trade.confidenceLevel
                              ? `${trade.confidenceLevel}/10`
                              : "N/A"
                          }
                        />

                        <PsychologyDetail
                          label="Plan"
                          value={
                            trade.followedPlan
                              ? "Followed"
                              : "Broken"
                          }
                        />
                      </div>

                      {trade.notes && (
                        <div className="mt-4 rounded-xl bg-slate-900 p-3">
                          <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-600">
                            Notes
                          </p>

                          <p className="text-xs leading-5 text-slate-400">
                            {trade.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function PsychologyCard({
  icon,
  label,
  value,
  valueClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-slate-400">
        <span className="h-5 w-5">
          {icon}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function BehaviorCard({
  title,
  description,
  icon,
  trades,
  profitLoss,
  winRate,
  currency,
  warning,
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`rounded-xl p-2.5 ${
            warning
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {icon}
        </div>

        <div>
          <h2 className="font-bold">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">
            Trades
          </p>

          <p className="mt-1 text-lg font-bold">
            {trades}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">
            P/L
          </p>

          <p
            className={`mt-1 text-lg font-bold ${
              profitLoss > 0
                ? "text-emerald-400"
                : profitLoss < 0
                ? "text-red-400"
                : "text-slate-300"
            }`}
          >
            {formatSignedCurrency(
              profitLoss,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-600">
            Win Rate
          </p>

          <p className="mt-1 text-lg font-bold text-cyan-400">
            {winRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </section>
  );
}

function PlanResult({
  title,
  trades,
  profitLoss,
  winRate,
  currency,
  positive = false,
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">
          {title}
        </p>

        {positive ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-400" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-slate-600">
            Trades
          </p>

          <p className="mt-1 font-bold">
            {trades}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-600">
            P/L
          </p>

          <p
            className={`mt-1 font-bold ${
              profitLoss > 0
                ? "text-emerald-400"
                : profitLoss < 0
                ? "text-red-400"
                : "text-slate-300"
            }`}
          >
            {formatSignedCurrency(
              profitLoss,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-600">
            Win Rate
          </p>

          <p className="mt-1 font-bold text-cyan-400">
            {winRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function PsychologyDetail({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
      <Brain className="mx-auto mb-3 h-8 w-8 text-slate-700" />

      <p className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}

/*
 * Signed currency formatter for child components.
 */
function formatSignedCurrency(value, currency) {
  const number = Number(value || 0);

  return `${number >= 0 ? "+" : "-"}${formatCurrency(
    Math.abs(number),
    currency
  )}`;
}

export default Psychology;