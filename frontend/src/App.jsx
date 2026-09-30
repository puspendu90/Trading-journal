import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  LineChart,
  WalletCards,
  CalendarDays,
  BarChart3,
  Brain,
  Settings as SettingsIcon,
  Menu,
  X,
  TrendingUp,
  Plus,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Trades from "./pages/Trades";
import Accounts from "./pages/Accounts";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Psychology from "./pages/Psychology";
import Settings from "./pages/Settings";

import { getDashboardData } from "./services/dashboardService";

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* DASHBOARD */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* TRADES */}

        <Route
          path="/trades"
          element={
            <ProtectedRoute>
              <Trades />
            </ProtectedRoute>
          }
        />

        {/* ACCOUNTS */}

        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          }
        />

        {/* CALENDAR */}

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        {/* ANALYTICS */}

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* PSYCHOLOGY */}

        <Route
          path="/psychology"
          element={
            <ProtectedRoute>
              <Psychology />
            </ProtectedRoute>
          }
        />

        {/* SETTINGS */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [dashboard, setDashboard] =
    useState({
      accounts: [],
      trades: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
    NEW:
    Selected account
  */

  const [selectedAccountId, setSelectedAccountId] =
    useState("");

  const navigate = useNavigate();
  const location = useLocation();

  /* =====================================================
     USER
  ===================================================== */

  const getStoredUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "user"
        ) || "{}"
      );
    } catch {
      return {};
    }
  };

  const user = getStoredUser();

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getDashboardData();

      const accounts =
        data?.accounts?.accounts ||
        data?.accounts ||
        [];

      const trades =
        data?.trades?.trades ||
        data?.trades ||
        [];

      setDashboard({
        accounts: Array.isArray(accounts)
          ? accounts
          : [],

        trades: Array.isArray(trades)
          ? trades
          : [],
      });

      /*
        If no account is selected,
        select first active account.
      */

      const firstActiveAccount =
        accounts.find(
          (account) =>
            account.status ===
            "ACTIVE"
        ) ||
        accounts[0];

      if (
        firstActiveAccount &&
        !selectedAccountId
      ) {
        setSelectedAccountId(
          firstActiveAccount._id ||
            firstActiveAccount.id
        );
      }

    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      if (
        err?.response?.status ===
        401
      ) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        navigate("/login");

        return;
      }

      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =====================================================
     KEEP SELECTED ACCOUNT VALID
  ===================================================== */

  useEffect(() => {
    if (
      dashboard.accounts.length ===
      0
    ) {
      setSelectedAccountId("");
      return;
    }

    const selectedExists =
      dashboard.accounts.some(
        (account) =>
          String(
            account._id ||
              account.id
          ) ===
          String(
            selectedAccountId
          )
      );

    if (!selectedExists) {
      const firstActive =
        dashboard.accounts.find(
          (account) =>
            account.status ===
            "ACTIVE"
        ) ||
        dashboard.accounts[0];

      if (firstActive) {
        setSelectedAccountId(
          firstActive._id ||
            firstActive.id
        );
      }
    }
  }, [
    dashboard.accounts,
    selectedAccountId,
  ]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navigation = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
    },

    {
      name: "Trades",
      icon: LineChart,
      path: "/trades",
    },

    {
      name: "Accounts",
      icon: WalletCards,
      path: "/accounts",
    },

    {
      name: "Calendar",
      icon: CalendarDays,
      path: "/calendar",
    },

    {
      name: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },

    {
      name: "Psychology",
      icon: Brain,
      path: "/psychology",
    },

    {
      name: "Settings",
      icon: SettingsIcon,
      path: "/settings",
    },
  ];

  const handleNavigation = (
    path
  ) => {
    navigate(path);
    setSidebarOpen(false);
  };

  /* =====================================================
     ACCOUNT HELPERS
  ===================================================== */

  const getAccountId = (
    account
  ) => {
    return (
      account?._id ||
      account?.id ||
      null
    );
  };

  const getTradeAccountId = (
    trade
  ) => {
    if (!trade) {
      return null;
    }

    if (
      typeof trade.tradingAccount ===
      "object"
    ) {
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

  const getTradeAccount = (
    trade
  ) => {
    const tradeAccountId =
      getTradeAccountId(trade);

    if (!tradeAccountId) {
      return null;
    }

    return (
      dashboard.accounts.find(
        (account) =>
          String(
            getAccountId(account)
          ) ===
          String(
            tradeAccountId
          )
      ) || null
    );
  };

  /* =====================================================
     ACTIVE / SELECTED ACCOUNT
  ===================================================== */

  const activeAccount = useMemo(() => {
    if (
      dashboard.accounts.length ===
      0
    ) {
      return null;
    }

    const selected =
      dashboard.accounts.find(
        (account) =>
          String(
            getAccountId(account)
          ) ===
          String(
            selectedAccountId
          )
      );

    if (selected) {
      return selected;
    }

    return (
      dashboard.accounts.find(
        (account) =>
          account.status ===
          "ACTIVE"
      ) ||
      dashboard.accounts[0]
    );
  }, [
    dashboard.accounts,
    selectedAccountId,
  ]);

  const activeAccountId =
    getAccountId(
      activeAccount
    );

  const activeCurrency =
    activeAccount?.currency ||
    "USD";

  /* =====================================================
     TRADE CURRENCY
  ===================================================== */

  const getTradeCurrency = (
    trade
  ) => {
    if (trade?.currency) {
      return trade.currency;
    }

    if (
      trade?.tradingAccount
        ?.currency
    ) {
      return (
        trade.tradingAccount
          .currency
      );
    }

    const account =
      getTradeAccount(trade);

    return (
      account?.currency ||
      "USD"
    );
  };

  /* =====================================================
     NUMBER HELPERS
  ===================================================== */

  const getNumber = (
    value
  ) => {
    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : 0;
  };

  const getTradeProfitLoss = (
    trade
  ) => {
    return getNumber(
      trade?.profitLoss ??
        trade?.profit ??
        trade?.pnl ??
        0
    );
  };

  /* =====================================================
     CURRENCY FORMATTER
  ===================================================== */

  const formatMoney = (
    value,
    currency = "USD"
  ) => {
    const amount =
      getNumber(value);

    const normalizedCurrency =
      String(
        currency || "USD"
      )
        .trim()
        .toUpperCase();

    try {
      return new Intl.NumberFormat(
        "en-IN",
        {
          style: "currency",
          currency:
            normalizedCurrency,

          minimumFractionDigits: 2,

          maximumFractionDigits: 2,
        }
      ).format(amount);
    } catch {
      return `${normalizedCurrency} ${amount.toFixed(
        2
      )}`;
    }
  };

  /* =====================================================
     ACTIVE ACCOUNT TRADES
     
     IMPORTANT:
     Only trades belonging to the
     selected account are used.
  ===================================================== */

  const activeAccountTrades =
    activeAccountId
      ? dashboard.trades.filter(
          (trade) => {
            const tradeAccountId =
              getTradeAccountId(
                trade
              );

            return (
              String(
                tradeAccountId
              ) ===
              String(
                activeAccountId
              )
            );
          }
        )
      : [];

  /* =====================================================
     OLD DATA FALLBACK
  ===================================================== */

  const tradesForStatistics =
    activeAccountTrades.length >
    0
      ? activeAccountTrades
      : dashboard.accounts.length ===
          1
      ? dashboard.trades
      : [];

  /* =====================================================
     TRADE STATISTICS
  ===================================================== */

  const totalProfitLoss =
    tradesForStatistics.reduce(
      (
        total,
        trade
      ) =>
        total +
        getTradeProfitLoss(
          trade
        ),
      0
    );

  const closedTrades =
    tradesForStatistics.filter(
      (trade) =>
        trade?.outcome !==
        "OPEN"
    );

  const winningTrades =
    closedTrades.filter(
      (trade) =>
        trade?.outcome ===
        "WIN"
    );

  const losingTrades =
    closedTrades.filter(
      (trade) =>
        trade?.outcome ===
        "LOSS"
    );

  const winRate =
    closedTrades.length > 0
      ? (winningTrades.length /
          closedTrades.length) *
        100
      : 0;

  const averageRR =
    closedTrades.length > 0
      ? closedTrades.reduce(
          (
            total,
            trade
          ) =>
            total +
            getNumber(
              trade?.rrRatio
            ),
          0
        ) /
        closedTrades.length
      : 0;

  /* =====================================================
     BALANCE
  ===================================================== */

  const currentBalance =
    activeAccount
      ? getNumber(
          activeAccount.currentBalance
        )
      : 0;

  const initialBalance =
    activeAccount
      ? getNumber(
          activeAccount.initialBalance
        )
      : 0;

  const balanceChange =
    initialBalance > 0
      ? ((currentBalance -
          initialBalance) /
          initialBalance) *
        100
      : 0;

  /* =====================================================
     RECENT TRADES
     
     IMPORTANT:
     Only selected-account trades.
  ===================================================== */

  const recentTrades =
    [...tradesForStatistics]
      .sort((a, b) => {
        const dateA =
          new Date(
            a?.date ||
              a?.tradeDate ||
              a?.createdAt ||
              0
          );

        const dateB =
          new Date(
            b?.date ||
              b?.tradeDate ||
              b?.createdAt ||
              0
          );

        return dateB - dateA;
      })
      .slice(0, 10);

  /* =====================================================
     OTHER ACCOUNT SUMMARY
     
     This does NOT combine currencies.
  ===================================================== */

  const otherAccounts =
    dashboard.accounts.filter(
      (account) =>
        String(
          getAccountId(account)
        ) !==
        String(
          activeAccountId
        )
    );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">

          {/* LOGO */}

          <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
                <TrendingUp
                  size={22}
                />
              </div>

              <div>
                <h1 className="text-lg font-bold">
                  TradeJournal
                </h1>

                <p className="text-xs text-slate-500">
                  Trading Intelligence
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setSidebarOpen(
                  false
                )
              }
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>

          </div>

          {/* NAVIGATION */}

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">

            {navigation.map(
              (item) => {
                const Icon =
                  item.icon;

                const isActive =
                  location.pathname ===
                  item.path;

                return (
                  <button
                    key={
                      item.name
                    }
                    onClick={() =>
                      handleNavigation(
                        item.path
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={20}
                    />

                    {item.name}
                  </button>
                );
              }
            )}

          </nav>

          {/* USER */}

          <div className="border-t border-slate-800 p-4">

            <div className="flex items-center gap-3 rounded-xl bg-slate-900 p-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 font-semibold">
                {user.name
                  ? user.name
                      .charAt(
                        0
                      )
                      .toUpperCase()
                  : "T"}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold">
                  {user.name ||
                    "Trader"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user.email ||
                    "trader@example.com"}
                </p>

              </div>

              <button
                onClick={
                  handleLogout
                }
                title="Logout"
                className="text-slate-500 transition hover:text-red-400"
              >
                <LogOut
                  size={18}
                />
              </button>

            </div>

          </div>

        </div>
      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="min-h-screen lg:pl-72">

        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">

          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            <button
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div className="hidden lg:block">

              <h2 className="text-xl font-bold">
                Dashboard
              </h2>

              <p className="text-sm text-slate-500">
                Track your trading
                performance
              </p>

            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={
                  loadDashboard
                }
                disabled={loading}
                title="Refresh dashboard"
                className="rounded-xl border border-slate-800 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/trades"
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                <Plus
                  size={18}
                />

                <span className="hidden sm:inline">
                  Add Trade
                </span>
              </button>

            </div>

          </div>
        </header>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="p-4 sm:p-6 lg:p-8">

          <div className="mx-auto w-full max-w-[1600px]">

            {/* WELCOME */}

            <div className="mb-8">

              <p className="mb-2 text-sm text-emerald-400">
                Welcome back 👋
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trading Dashboard
              </h1>

              <p className="mt-2 text-slate-500">
                Your trading performance
                at a glance.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* =================================================
                ACCOUNT SELECTOR
            ================================================= */}

            {dashboard.accounts.length >
              0 && (
              <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <WalletCards
                        size={20}
                        className="text-emerald-400"
                      />

                      <h2 className="text-lg font-semibold">
                        Trading Account
                      </h2>

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Select an account to
                      view its individual
                      performance.
                    </p>

                  </div>

                  <div className="relative w-full lg:w-96">

                    <select
                      value={
                        activeAccountId ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedAccountId(
                          event.target
                            .value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm font-medium text-white outline-none transition focus:border-emerald-500"
                    >

                      {dashboard.accounts.map(
                        (
                          account
                        ) => {
                          const accountId =
                            getAccountId(
                              account
                            );

                          const currency =
                            account.currency ||
                            "USD";

                          return (
                            <option
                              key={
                                accountId
                              }
                              value={
                                accountId
                              }
                            >
                              {account.name ||
                                "Trading Account"}{" "}
                              —{" "}
                              {currency}
                            </option>
                          );
                        }
                      )}

                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                  </div>

                </div>

                {/* SELECTED ACCOUNT INFO */}

                {activeAccount && (
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-sm font-semibold text-white">
                        {activeAccount.name ||
                          "Trading Account"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Currency:{" "}
                        <span className="font-semibold text-emerald-400">
                          {
                            activeCurrency
                          }
                        </span>
                      </p>

                    </div>

                    <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      {activeAccount.status ||
                        "ACTIVE"}
                    </span>

                  </div>
                )}

              </section>
            )}

            {/* =================================================
                NO ACCOUNT
            ================================================= */}

            {!loading &&
              dashboard.accounts.length ===
                0 && (
                <div className="mb-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-8 text-center">

                  <WalletCards
                    size={40}
                    className="mx-auto mb-4 text-slate-600"
                  />

                  <h2 className="text-lg font-semibold text-slate-300">
                    No Trading Account
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Create a trading account
                    to start tracking your
                    performance.
                  </p>

                  <button
                    onClick={() =>
                      navigate(
                        "/accounts"
                      )
                    }
                    className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Create Account
                  </button>

                </div>
              )}

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* BALANCE */}

              <StatCard
                title="Current Balance"
                value={
                  loading
                    ? "Loading..."
                    : formatMoney(
                        currentBalance,
                        activeCurrency
                      )
                }
                subtitle={
                  loading
                    ? "Please wait"
                    : `${
                        balanceChange >=
                        0
                          ? "+"
                          : ""
                      }${balanceChange.toFixed(
                        2
                      )}% overall`
                }
                positive={
                  balanceChange >=
                  0
                }
              />

              {/* P/L */}

              <StatCard
                title="Total P/L"
                value={
                  loading
                    ? "Loading..."
                    : `${
                        totalProfitLoss >=
                        0
                          ? "+"
                          : "-"
                      }${formatMoney(
                        Math.abs(
                          totalProfitLoss
                        ),
                        activeCurrency
                      )}`
                }
                subtitle={`In ${activeCurrency}`}
                positive={
                  totalProfitLoss >=
                  0
                }
              />

              {/* WIN RATE */}

              <StatCard
                title="Win Rate"
                value={
                  loading
                    ? "Loading..."
                    : `${winRate.toFixed(
                        1
                      )}%`
                }
                subtitle={`${winningTrades.length} win / ${losingTrades.length} losses`}
                positive={
                  winRate >= 50
                }
              />

              {/* RR */}

              <StatCard
                title="Average R:R"
                value={
                  loading
                    ? "Loading..."
                    : `1:${averageRR.toFixed(
                        2
                      )}`
                }
                subtitle="Closed trades"
                positive={
                  averageRR >= 1
                }
              />

            </div>

            {/* =================================================
                PERFORMANCE + ACCOUNT
            ================================================= */}

            <div className="mt-6 grid gap-6 xl:grid-cols-3">

              {/* PERFORMANCE */}

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 xl:col-span-2">

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h3 className="text-lg font-semibold">
                      Performance Overview
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {activeAccount?.name ||
                        "Select an account"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-emerald-400">
                    {activeCurrency}
                  </div>

                </div>

                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-800">

                  <div className="text-center">

                    <BarChart3
                      size={40}
                      className="mx-auto mb-3 text-slate-600"
                    />

                    <p className="font-medium text-slate-400">
                      Performance Chart
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {tradesForStatistics.length >
                      0
                        ? `${
                            tradesForStatistics.length
                          } trade${
                            tradesForStatistics.length ===
                            1
                              ? ""
                              : "s"
                          } in ${activeCurrency}`
                        : "No trade data available"}
                    </p>

                  </div>

                </div>

              </section>

              {/* ACCOUNT DETAILS */}

              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">

                <div className="mb-6 flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <h3 className="text-lg font-semibold">
                      Account Details
                    </h3>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {activeAccount?.name ||
                        "No account"}
                    </p>

                  </div>

                  {activeAccount && (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      {activeAccount.status ||
                        "ACTIVE"}
                    </span>
                  )}

                </div>

                {activeAccount ? (
                  <div className="space-y-5">

                    <div>

                      <p className="text-sm text-slate-500">
                        Current Balance
                      </p>

                      <p className="mt-1 break-words text-3xl font-bold">
                        {formatMoney(
                          currentBalance,
                          activeCurrency
                        )}
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          balanceChange >=
                          0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {balanceChange >=
                        0
                          ? "+"
                          : ""}
                        {balanceChange.toFixed(
                          2
                        )}
                        %
                      </p>

                    </div>

                    <div className="space-y-4">

                      <AccountRow
                        label="Initial Balance"
                        value={formatMoney(
                          initialBalance,
                          activeCurrency
                        )}
                      />

                      <AccountRow
                        label="Total P/L"
                        value={`${
                          totalProfitLoss >=
                          0
                            ? "+"
                            : "-"
                        }${formatMoney(
                          Math.abs(
                            totalProfitLoss
                          ),
                          activeCurrency
                        )}`}
                        positive={
                          totalProfitLoss >=
                          0
                        }
                      />

                      <AccountRow
                        label="Trades"
                        value={
                          tradesForStatistics.length
                        }
                      />

                      <AccountRow
                        label="Currency"
                        value={
                          activeCurrency
                        }
                      />

                    </div>

                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No account selected.
                  </p>
                )}

              </section>

            </div>

            {/* =================================================
                OTHER ACCOUNTS
            ================================================= */}

            {otherAccounts.length >
              0 && (
              <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">

                <div className="mb-5">

                  <h3 className="text-lg font-semibold">
                    Other Accounts
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Each account keeps its own
                    currency and performance.
                  </p>

                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {otherAccounts.map(
                    (
                      account
                    ) => {
                      const accountId =
                        getAccountId(
                          account
                        );

                      const currency =
                        account.currency ||
                        "USD";

                      const accountTrades =
                        dashboard.trades.filter(
                          (
                            trade
                          ) =>
                            String(
                              getTradeAccountId(
                                trade
                              )
                            ) ===
                            String(
                              accountId
                            )
                        );

                      const accountPL =
                        accountTrades.reduce(
                          (
                            total,
                            trade
                          ) =>
                            total +
                            getTradeProfitLoss(
                              trade
                            ),
                          0
                        );

                      const balance =
                        getNumber(
                          account.currentBalance
                        );

                      return (
                        <button
                          key={
                            accountId
                          }
                          onClick={() =>
                            setSelectedAccountId(
                              accountId
                            )
                          }
                          className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-emerald-500/40 hover:bg-slate-900"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="truncate font-semibold text-slate-200">
                                {account.name ||
                                  "Trading Account"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  currency
                                }
                              </p>

                            </div>

                            <ChevronDown
                              size={18}
                              className="-rotate-90 shrink-0 text-slate-600"
                            />

                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">

                            <div>

                              <p className="text-xs text-slate-600">
                                Balance
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-300">
                                {formatMoney(
                                  balance,
                                  currency
                                )}
                              </p>

                            </div>

                            <div>

                              <p className="text-xs text-slate-600">
                                P/L
                              </p>

                              <p
                                className={`mt-1 text-sm font-semibold ${
                                  accountPL >=
                                  0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {accountPL >=
                                0
                                  ? "+"
                                  : "-"}
                                {formatMoney(
                                  Math.abs(
                                    accountPL
                                  ),
                                  currency
                                )}
                              </p>

                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </section>
            )}

            {/* =================================================
                RECENT TRADES
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900">

              <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                <div>

                  <h3 className="text-lg font-semibold">
                    Recent Trades
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Trades from{" "}
                    {activeAccount?.name ||
                      "selected account"}
                  </p>

                </div>

                <button
                  onClick={() =>
                    navigate(
                      "/trades"
                    )
                  }
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  View all trades →
                </button>

              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Loading trades...
                </div>
              ) : recentTrades.length ===
                0 ? (
                <div className="p-10 text-center">

                  <LineChart
                    size={36}
                    className="mx-auto mb-3 text-slate-600"
                  />

                  <p className="font-medium text-slate-400">
                    No trades for this account
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Add a trade to start
                    tracking this account.
                  </p>

                  <button
                    onClick={() =>
                      navigate(
                        "/trades"
                      )
                    }
                    className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Add Trade
                  </button>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px] text-left">

                    <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">

                      <tr>

                        <th className="px-6 py-4">
                          Symbol
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
                          P/L
                        </th>

                        <th className="px-6 py-4">
                          R:R
                        </th>

                        <th className="px-6 py-4">
                          Result
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {recentTrades.map(
                        (
                          trade
                        ) => {
                          const pnl =
                            getTradeProfitLoss(
                              trade
                            );

                          const currency =
                            getTradeCurrency(
                              trade
                            );

                          return (
                            <tr
                              key={
                                trade?._id ||
                                `${trade?.symbol}-${trade?.createdAt}`
                              }
                              className="border-b border-slate-800/60 last:border-0 transition hover:bg-slate-800/30"
                            >

                              {/* SYMBOL */}

                              <td className="px-6 py-5 font-semibold">
                                {trade?.symbol ||
                                  "—"}
                              </td>

                              {/* DIRECTION */}

                              <td className="px-6 py-5">

                                <span
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                    String(
                                      trade?.direction
                                    ).toUpperCase() ===
                                    "BUY"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >

                                  {String(
                                    trade?.direction
                                  ).toUpperCase() ===
                                  "BUY" ? (
                                    <ArrowUpRight
                                      size={
                                        13
                                      }
                                    />
                                  ) : (
                                    <ArrowDownRight
                                      size={
                                        13
                                      }
                                    />
                                  )}

                                  {trade?.direction ||
                                    "—"}

                                </span>

                              </td>

                              {/* ENTRY */}

                              <td className="px-6 py-5 text-slate-300">
                                {trade?.entryPrice ??
                                  "—"}
                              </td>

                              {/* EXIT */}

                              <td className="px-6 py-5 text-slate-300">
                                {trade?.exitPrice ??
                                  "—"}
                              </td>

                              {/* P/L */}

                              <td
                                className={`px-6 py-5 font-semibold ${
                                  pnl >= 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {pnl >= 0
                                  ? "+"
                                  : "-"}

                                {formatMoney(
                                  Math.abs(
                                    pnl
                                  ),
                                  currency
                                )}
                              </td>

                              {/* RR */}

                              <td className="px-6 py-5 text-slate-300">
                                1:
                                {getNumber(
                                  trade?.rrRatio
                                ).toFixed(
                                  2
                                )}
                              </td>

                              {/* RESULT */}

                              <td className="px-6 py-5">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    trade?.outcome ===
                                    "WIN"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : trade?.outcome ===
                                        "LOSS"
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-slate-700 text-slate-300"
                                  }`}
                                >
                                  {trade?.outcome ||
                                    "OPEN"}
                                </span>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>

            {/* =================================================
                CURRENCY INFORMATION
            ================================================= */}

            {activeAccount && (
              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-sm font-semibold text-slate-300">
                      Currency Isolation
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Dashboard calculations are
                      based only on the selected
                      account. Different currencies
                      are never added together.
                    </p>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">
                      {
                        activeCurrency
                      }
                    </span>

                  </div>

                </div>

              </div>
            )}

            {/* FOOTER */}

            <div className="py-8 text-center text-xs text-slate-600">
              TradeJournal • Keep tracking.
              Keep improving.
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  positive,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-3 break-words text-2xl font-bold">
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

/* =========================================================
   ACCOUNT ROW
========================================================= */

function AccountRow({
  label,
  value,
  positive,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`text-right text-sm font-semibold ${
          positive
            ? "text-emerald-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default App;