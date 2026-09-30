import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  X,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import api from "../services/api";
import { formatCurrency } from "../utils/currency";

function Calendar() {
  const [trades, setTrades] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // IMPORTANT:
  // Do not default to USD.
  // The currency will be selected after accounts/trades are loaded.
  const [selectedCurrency, setSelectedCurrency] = useState("");

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
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
        : tradesResponse.data?.trades || [];

      const accountData = Array.isArray(accountsResponse.data)
        ? accountsResponse.data
        : accountsResponse.data?.accounts || [];

      setTrades(tradeData);
      setAccounts(accountData);
    } catch (err) {
      console.error("Calendar data error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load trading calendar data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // GET TRADE ACCOUNT ID
  // ==========================================
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

  // ==========================================
  // GET ACCOUNT CURRENCY
  // ==========================================
  const getAccountCurrency = (trade) => {
    // First preference:
    // populated tradingAccount currency
    if (trade?.tradingAccount?.currency) {
      return trade.tradingAccount.currency;
    }

    // Second preference:
    // populated account currency
    if (trade?.account?.currency) {
      return trade.account.currency;
    }

    const accountId = getTradeAccountId(trade);

    if (!accountId) {
      return null;
    }

    // Match both MongoDB _id and possible id
    const account = accounts.find(
      (item) =>
        item?._id === accountId ||
        item?.id === accountId
    );

    // IMPORTANT:
    // Do NOT fallback to USD here.
    // Returning null prevents incorrect USD values.
    return account?.currency || null;
  };

  // ==========================================
  // AVAILABLE CURRENCIES
  // ==========================================
  const availableCurrencies = useMemo(() => {
    const currencies = new Set();

    accounts.forEach((account) => {
      if (account?.currency) {
        currencies.add(account.currency);
      }
    });

    trades.forEach((trade) => {
      const currency = getAccountCurrency(trade);

      if (currency) {
        currencies.add(currency);
      }
    });

    return Array.from(currencies).sort();
  }, [trades, accounts]);

  // ==========================================
  // AUTO SELECT CURRENCY
  // ==========================================
  useEffect(() => {
    if (availableCurrencies.length === 0) {
      return;
    }

    // First Calendar load:
    // select the first REAL currency available.
    if (!selectedCurrency) {
      setSelectedCurrency(availableCurrencies[0]);
      return;
    }

    // If selected currency no longer exists,
    // select another available currency.
    if (!availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [
    availableCurrencies,
    selectedCurrency,
  ]);

  // ==========================================
  // FORMAT MONEY
  // ==========================================
  const formatMoney = (value) => {
    const number = Number(value || 0);

    if (!selectedCurrency) {
      return number >= 0
        ? `+${number.toFixed(2)}`
        : `${number.toFixed(2)}`;
    }

    return `${number >= 0 ? "+" : "-"}${formatCurrency(
      Math.abs(number),
      selectedCurrency
    )}`;
  };

  // ==========================================
  // MONTH INFORMATION
  // ==========================================
  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const daysInMonth = lastDay.getDate();

    // Convert:
    // Sunday = 0 -> 6
    // Monday = 1 -> 0
    const startingDay =
      firstDay.getDay() === 0
        ? 6
        : firstDay.getDay() - 1;

    return {
      year,
      month,
      daysInMonth,
      startingDay,
    };
  }, [currentDate]);

  // ==========================================
  // DATE KEY
  // ==========================================
  const getDateKey = (date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================
  // GET TRADE DATE
  // ==========================================
  const getTradeDate = (trade) => {
    const dateValue =
      trade?.closedAt ||
      trade?.openedAt ||
      trade?.createdAt;

    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return getDateKey(date);
  };

  // ==========================================
  // FILTER TRADES BY SELECTED CURRENCY
  // ==========================================
  const currencyTrades = useMemo(() => {
    if (!selectedCurrency) {
      return [];
    }

    return trades.filter(
      (trade) =>
        getAccountCurrency(trade) ===
        selectedCurrency
    );
  }, [
    trades,
    accounts,
    selectedCurrency,
  ]);

  // ==========================================
  // DAILY DATA
  // ==========================================
  const dailyData = useMemo(() => {
    const result = {};

    currencyTrades.forEach((trade) => {
      const dateKey = getTradeDate(trade);

      if (!dateKey) {
        return;
      }

      if (!result[dateKey]) {
        result[dateKey] = {
          trades: [],
          profitLoss: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
        };
      }

      const profitLoss = Number(
        trade?.profitLoss || 0
      );

      result[dateKey].trades.push(trade);

      result[dateKey].profitLoss +=
        profitLoss;

      if (trade?.outcome === "WIN") {
        result[dateKey].wins += 1;
      } else if (
        trade?.outcome === "LOSS"
      ) {
        result[dateKey].losses += 1;
      } else if (
        trade?.outcome === "BREAKEVEN"
      ) {
        result[dateKey].breakeven += 1;
      }
    });

    return result;
  }, [currencyTrades]);

  // ==========================================
  // CURRENT MONTH TRADES
  // ==========================================
  const monthTrades = useMemo(() => {
    return currencyTrades.filter((trade) => {
      const dateKey = getTradeDate(trade);

      if (!dateKey) {
        return false;
      }

      const date = new Date(
        `${dateKey}T00:00:00`
      );

      return (
        date.getFullYear() ===
          monthInfo.year &&
        date.getMonth() ===
          monthInfo.month
      );
    });
  }, [
    currencyTrades,
    monthInfo,
  ]);

  // ==========================================
  // MONTHLY STATISTICS
  // ==========================================
  const monthStats = useMemo(() => {
    let profitLoss = 0;
    let wins = 0;
    let losses = 0;
    let breakeven = 0;

    monthTrades.forEach((trade) => {
      profitLoss += Number(
        trade?.profitLoss || 0
      );

      if (trade?.outcome === "WIN") {
        wins++;
      } else if (
        trade?.outcome === "LOSS"
      ) {
        losses++;
      } else if (
        trade?.outcome === "BREAKEVEN"
      ) {
        breakeven++;
      }
    });

    const closedTrades =
      wins + losses + breakeven;

    const winRate =
      closedTrades > 0
        ? (
            (wins / closedTrades) *
            100
          ).toFixed(1)
        : "0.0";

    return {
      profitLoss,
      wins,
      losses,
      breakeven,
      trades: monthTrades.length,
      winRate,
    };
  }, [monthTrades]);

  // ==========================================
  // MONTH NAME
  // ==========================================
  const monthName = new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  ).format(currentDate);

  // ==========================================
  // PREVIOUS MONTH
  // ==========================================
  const goToPreviousMonth = () => {
    setSelectedDate(null);

    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  // ==========================================
  // NEXT MONTH
  // ==========================================
  const goToNextMonth = () => {
    setSelectedDate(null);

    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  // ==========================================
  // TODAY
  // ==========================================
  const goToToday = () => {
    setSelectedDate(null);
    setCurrentDate(new Date());
  };

  // ==========================================
  // IS TODAY
  // ==========================================
  const isToday = (day) => {
    const today = new Date();

    return (
      today.getFullYear() ===
        monthInfo.year &&
      today.getMonth() ===
        monthInfo.month &&
      today.getDate() === day
    );
  };

  // ==========================================
  // FORMAT TRADE DATE
  // ==========================================
  const formatTradeDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // SELECTED DAY DATA
  // ==========================================
  const selectedDayData = selectedDate
    ? dailyData[selectedDate] || {
        trades: [],
        profitLoss: 0,
        wins: 0,
        losses: 0,
        breakeven: 0,
      }
    : null;

  // ==========================================
  // CALENDAR CELLS
  // ==========================================
  const calendarCells = [];

  for (
    let i = 0;
    i < monthInfo.startingDay;
    i++
  ) {
    calendarCells.push({
      empty: true,
      id: `empty-${i}`,
    });
  }

  for (
    let day = 1;
    day <= monthInfo.daysInMonth;
    day++
  ) {
    const date = new Date(
      monthInfo.year,
      monthInfo.month,
      day
    );

    const dateKey = getDateKey(date);

    calendarCells.push({
      day,
      dateKey,
      data: dailyData[dateKey],
    });
  }

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />

            <p className="text-sm text-slate-400">
              Loading trading calendar...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">

        {/* ========================================
            HEADER
        ======================================== */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <CalendarDays className="h-6 w-6 text-emerald-400" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Trading Calendar
                </h1>

                <p className="text-sm text-slate-400">
                  Track your daily trading performance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Currency Selector */}
            {availableCurrencies.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                <WalletCards className="h-4 w-4 text-emerald-400" />

                <select
                  value={selectedCurrency}
                  onChange={(event) => {
                    setSelectedCurrency(
                      event.target.value
                    );

                    setSelectedDate(null);
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

            {/* Refresh */}
            <button
              onClick={() =>
                fetchData(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* ========================================
            CURRENCY INFO
        ======================================== */}
        {availableCurrencies.length > 1 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />

            <div>
              <p className="text-sm font-semibold text-cyan-300">
                Calendar currency:{" "}
                {selectedCurrency}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Calendar performance is shown
                only for the selected currency.
                Different currencies are never
                combined.
              </p>
            </div>
          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ========================================
            MONTHLY STATS
        ======================================== */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">

          <StatCard
            label="Total Trades"
            value={monthStats.trades}
          />

          <StatCard
            label="Monthly P/L"
            value={formatMoney(
              monthStats.profitLoss
            )}
            valueClass={
              monthStats.profitLoss > 0
                ? "text-emerald-400"
                : monthStats.profitLoss < 0
                ? "text-red-400"
                : "text-slate-200"
            }
          />

          <StatCard
            label="Wins"
            value={monthStats.wins}
            valueClass="text-emerald-400"
          />

          <StatCard
            label="Losses"
            value={monthStats.losses}
            valueClass="text-red-400"
          />

          <StatCard
            label="Win Rate"
            value={`${monthStats.winRate}%`}
            valueClass="text-cyan-400"
          />
        </div>

        {/* ========================================
            CALENDAR CARD
        ======================================== */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">

          {/* Calendar Header */}
          <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center justify-between gap-3 md:justify-start">

              <button
                onClick={
                  goToPreviousMonth
                }
                className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <h2 className="min-w-[170px] text-center text-xl font-bold sm:text-2xl">
                {monthName}
              </h2>

              <button
                onClick={goToNextMonth}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={goToToday}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
            >
              Today
            </button>
          </div>

          {/* ======================================
              LEGEND
          ====================================== */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-800 px-4 py-3 text-xs text-slate-400 sm:px-5">

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Winning day
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              Losing day
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Breakeven
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Trading day
            </div>
          </div>

          {/* ======================================
              CALENDAR
          ====================================== */}
          <div className="p-2 sm:p-4">

            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b border-slate-800">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <div
                  key={day}
                  className="px-1 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs"
                >
                  <span className="hidden sm:inline">
                    {day}
                  </span>

                  <span className="sm:hidden">
                    {day.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {calendarCells.map(
                (cell) => {
                  if (cell.empty) {
                    return (
                      <div
                        key={cell.id}
                        className="min-h-[90px] border-b border-r border-slate-800/60 bg-slate-950/30 sm:min-h-[130px] lg:min-h-[155px]"
                      />
                    );
                  }

                  const data =
                    cell.data;

                  const positive =
                    data &&
                    data.profitLoss > 0;

                  const negative =
                    data &&
                    data.profitLoss < 0;

                  return (
                    <button
                      key={
                        cell.dateKey
                      }
                      onClick={() =>
                        setSelectedDate(
                          cell.dateKey
                        )
                      }
                      className={`group relative min-h-[90px] border-b border-r border-slate-800/60 p-1.5 text-left transition hover:bg-slate-800/60 sm:min-h-[130px] sm:p-3 lg:min-h-[155px] ${
                        isToday(
                          cell.day
                        )
                          ? "bg-emerald-500/[0.04]"
                          : "bg-slate-950/20"
                      }`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
                            isToday(
                              cell.day
                            )
                              ? "bg-emerald-500 text-slate-950"
                              : "text-slate-300 group-hover:bg-slate-800"
                          }`}
                        >
                          {
                            cell.day
                          }
                        </span>

                        {data && (
                          <span
                            className={`hidden h-2.5 w-2.5 rounded-full sm:block ${
                              positive
                                ? "bg-emerald-400"
                                : negative
                                ? "bg-red-400"
                                : "bg-slate-400"
                            }`}
                          />
                        )}
                      </div>

                      {/* Daily Data */}
                      {data && (
                        <div className="mt-2 space-y-1 sm:mt-4 sm:space-y-2">

                          <div
                            className={`text-xs font-bold sm:text-sm lg:text-base ${
                              positive
                                ? "text-emerald-400"
                                : negative
                                ? "text-red-400"
                                : "text-slate-300"
                            }`}
                          >
                            {formatMoney(
                              data.profitLoss
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 sm:text-xs">
                            {
                              data
                                .trades
                                .length
                            }{" "}
                            {data
                              .trades
                              .length ===
                            1
                              ? "trade"
                              : "trades"}
                          </div>

                          <div className="hidden items-center gap-1.5 text-[10px] sm:flex lg:text-xs">

                            {data.wins >
                              0 && (
                              <span className="rounded-md bg-emerald-500/10 px-1.5 py-1 text-emerald-400">
                                W{" "}
                                {
                                  data.wins
                                }
                              </span>
                            )}

                            {data.losses >
                              0 && (
                              <span className="rounded-md bg-red-500/10 px-1.5 py-1 text-red-400">
                                L{" "}
                                {
                                  data.losses
                                }
                              </span>
                            )}

                            {data.breakeven >
                              0 && (
                              <span className="rounded-md bg-slate-500/10 px-1.5 py-1 text-slate-400">
                                BE{" "}
                                {
                                  data.breakeven
                                }
                              </span>
                            )}
                          </div>

                          {/* Mobile indicators */}
                          <div className="flex gap-1 sm:hidden">

                            {data.wins >
                              0 && (
                              <span className="text-[9px] font-semibold text-emerald-400">
                                W
                                {
                                  data.wins
                                }
                              </span>
                            )}

                            {data.losses >
                              0 && (
                              <span className="text-[9px] font-semibold text-red-400">
                                L
                                {
                                  data.losses
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {!data && (
                        <div className="mt-4 hidden text-xs text-slate-700 sm:block">
                          No trades
                        </div>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================
          SELECTED DAY MODAL
      ========================================== */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() =>
            setSelectedDate(null)
          }
        >
          <div
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 shadow-2xl sm:max-w-4xl sm:rounded-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-800 bg-slate-900 p-5 sm:p-6">

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Trading Day
                </p>

                <h3 className="text-xl font-bold sm:text-2xl">
                  {new Date(
                    `${selectedDate}T00:00:00`
                  ).toLocaleDateString(
                    "en-US",
                    {
                      weekday:
                        "long",
                      month:
                        "long",
                      day: "numeric",
                      year:
                        "numeric",
                    }
                  )}
                </h3>

                {/* Currency */}
                <p className="mt-1 text-xs text-slate-500">
                  Currency:{" "}
                  <span className="font-semibold text-emerald-400">
                    {
                      selectedCurrency
                    }
                  </span>
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedDate(
                    null
                  )
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ======================================
                DAY SUMMARY
            ====================================== */}
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6">

              <MiniStat
                label="Daily P/L"
                value={formatMoney(
                  selectedDayData.profitLoss
                )}
                valueClass={
                  selectedDayData.profitLoss >
                  0
                    ? "text-emerald-400"
                    : selectedDayData.profitLoss <
                      0
                    ? "text-red-400"
                    : "text-slate-200"
                }
              />

              <MiniStat
                label="Trades"
                value={
                  selectedDayData
                    .trades.length
                }
              />

              <MiniStat
                label="Wins"
                value={
                  selectedDayData.wins
                }
                valueClass="text-emerald-400"
              />

              <MiniStat
                label="Losses"
                value={
                  selectedDayData.losses
                }
                valueClass="text-red-400"
              />
            </div>

            {/* ======================================
                TRADES
            ====================================== */}
            <div className="px-5 pb-6 sm:px-6">

              {selectedDayData
                .trades.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center">

                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-600" />

                  <p className="font-medium text-slate-300">
                    No trades on
                    this day
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Select another
                    date to view
                    trades.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">

                  {selectedDayData.trades.map(
                    (trade) => {
                      const profitLoss =
                        Number(
                          trade?.profitLoss ||
                            0
                        );

                      return (
                        <div
                          key={
                            trade._id
                          }
                          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            {/* Trade Identity */}
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

                                  <h4 className="font-bold text-white">
                                    {
                                      trade.symbol
                                    }
                                  </h4>

                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                      trade.direction ===
                                      "BUY"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-red-500/10 text-red-400"
                                    }`}
                                  >
                                    {
                                      trade.direction
                                    }
                                  </span>

                                  {trade.outcome && (
                                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                      {
                                        trade.outcome
                                      }
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatTradeDate(
                                    trade.closedAt ||
                                      trade.openedAt
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* P/L */}
                            <div className="text-left lg:text-right">

                              <p
                                className={`text-lg font-bold ${
                                  profitLoss >
                                  0
                                    ? "text-emerald-400"
                                    : profitLoss <
                                      0
                                    ? "text-red-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {formatMoney(
                                  profitLoss
                                )}
                              </p>

                              {trade.rrRatio !==
                                undefined && (
                                <p className="text-xs text-slate-500">
                                  R:R{" "}
                                  {Number(
                                    trade.rrRatio ||
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Trade Details */}
                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-4">

                            <TradeDetail
                              label="Entry"
                              value={
                                trade.entryPrice
                              }
                            />

                            <TradeDetail
                              label="Exit"
                              value={
                                trade.exitPrice
                              }
                            />

                            <TradeDetail
                              label="Lot Size"
                              value={
                                trade.lotSize
                              }
                            />

                            <TradeDetail
                              label="Strategy"
                              value={
                                trade.strategy ||
                                "-"
                              }
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================
function StatCard({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold sm:text-2xl ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

// ==========================================
// MINI STAT
// ==========================================
function MiniStat({
  label,
  value,
  valueClass = "text-white",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
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

// ==========================================
// TRADE DETAIL
// ==========================================
function TradeDetail({
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

export default Calendar;