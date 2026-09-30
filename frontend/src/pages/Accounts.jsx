import { useEffect, useState, useMemo } from "react";

import {
  WalletCards,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Building2,
  BriefcaseBusiness,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* =========================================================
   CURRENCY FORMATTER
========================================================= */

const formatMoney = (value, currency = "USD") => {
  const numericValue = Number(value || 0);
  const safeCurrency = currency || "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${safeCurrency} ${numericValue.toFixed(2)}`;
  }
};

/* =========================================================
   CURRENCY LABEL
========================================================= */

function getCurrencyLabel(currency) {
  const currencies = {
    USD: "USD — US Dollar ($)",
    INR: "INR — Indian Rupee (₹)",
    EUR: "EUR — Euro (€)",
    GBP: "GBP — British Pound (£)",
    JPY: "JPY — Japanese Yen (¥)",
    AUD: "AUD — Australian Dollar (A$)",
    CAD: "CAD — Canadian Dollar (C$)",
    CHF: "CHF — Swiss Franc",
  };

  return (
    currencies[currency] ||
    `${currency || "USD"}`
  );
}

/* =========================================================
   ACCOUNT TYPE
========================================================= */

function getAccountTypeLabel(accountType) {
  if (accountType === "PROP_FIRM") {
    return "Prop Firm";
  }

  if (accountType === "LIVE") {
    return "Live";
  }

  return "Demo";
}

/* =========================================================
   ACCOUNTS
========================================================= */

function Accounts() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [form, setForm] = useState({
    name: "",
    accountType: "DEMO",
    broker: "",
    propFirm: "",
    accountNumber: "",
    currency: "USD",
    initialBalance: "",
    status: "ACTIVE",
    description: "",
  });

  /* =====================================================
     LOAD ACCOUNTS
  ===================================================== */

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/accounts");

      const data =
        response.data?.accounts ||
        response.data ||
        [];

      setAccounts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Accounts error:",
        err
      );

      if (
        err.response?.status === 401
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
        err.response?.data?.message ||
          "Unable to load trading accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadAccounts();
  }, []);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setForm({
      name: "",
      accountType: "DEMO",
      broker: "",
      propFirm: "",
      accountNumber: "",
      currency: "USD",
      initialBalance: "",
      status: "ACTIVE",
      description: "",
    });

    setEditingAccount(null);
  };

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  const openAddModal = () => {
    resetForm();

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  const openEditModal = (account) => {
    setEditingAccount(account);

    setForm({
      name: account.name || "",
      accountType:
        account.accountType ||
        "DEMO",
      broker: account.broker || "",
      propFirm:
        account.propFirm || "",
      accountNumber:
        account.accountNumber ||
        "",
      currency:
        account.currency ||
        "USD",
      initialBalance:
        account.initialBalance ??
        "",
      status:
        account.status ||
        "ACTIVE",
      description:
        account.description ||
        "",
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);

    resetForm();
  };

  /* =====================================================
     SAVE ACCOUNT
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      /* -----------------------------------------------
         VALIDATION
      ------------------------------------------------ */

      if (!form.name.trim()) {
        setError(
          "Account name is required."
        );

        return;
      }

      if (
        form.initialBalance === "" ||
        Number(form.initialBalance) < 0
      ) {
        setError(
          "Please enter a valid initial balance."
        );

        return;
      }

      /* -----------------------------------------------
         PAYLOAD
      ------------------------------------------------ */

      const payload = {
        name: form.name.trim(),

        accountType:
          form.accountType,

        broker:
          form.broker.trim(),

        propFirm:
          form.propFirm.trim(),

        accountNumber:
          form.accountNumber.trim(),

        currency:
          form.currency
            .trim()
            .toUpperCase(),

        initialBalance:
          Number(
            form.initialBalance
          ),

        status:
          form.status,

        description:
          form.description.trim(),
      };

      /* -----------------------------------------------
         UPDATE
      ------------------------------------------------ */

      if (editingAccount) {
        await api.put(
          `/accounts/${editingAccount._id}`,
          payload
        );

        setSuccess(
          "Trading account updated successfully."
        );
      }

      /* -----------------------------------------------
         CREATE
      ------------------------------------------------ */

      else {
        await api.post(
          "/accounts",
          payload
        );

        setSuccess(
          "Trading account created successfully."
        );
      }

      setModalOpen(false);

      resetForm();

      await loadAccounts();
    } catch (err) {
      console.error(
        "Save account error:",
        err
      );

      if (
        err.response?.status === 401
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
        err.response?.data?.message ||
          "Unable to save trading account."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE ACCOUNT
  ===================================================== */

  const handleDelete = async (
    account
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${account.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/accounts/${account._id}`
      );

      setSuccess(
        "Trading account deleted successfully."
      );

      await loadAccounts();
    } catch (err) {
      console.error(
        "Delete account error:",
        err
      );

      if (
        err.response?.status === 401
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
        err.response?.data?.message ||
          "Unable to delete trading account."
      );
    }
  };

  /* =====================================================
     ACCOUNT STATISTICS
  ===================================================== */

  const activeAccounts =
    accounts.filter(
      (account) =>
        account.status ===
        "ACTIVE"
    ).length;

  /* =====================================================
     GROUP BY CURRENCY
     
     Important:
     Do NOT add INR + USD + EUR together.
  ===================================================== */

  const currencySummary = useMemo(() => {
    const grouped = {};

    accounts.forEach(
      (account) => {
        const currency =
          (
            account.currency ||
            "USD"
          )
            .trim()
            .toUpperCase();

        if (!grouped[currency]) {
          grouped[currency] = {
            currency,
            initial: 0,
            current: 0,
            profitLoss: 0,
            accounts: 0,
          };
        }

        const initial =
          Number(
            account.initialBalance ||
              0
          );

        const current =
          Number(
            account.currentBalance ||
              0
          );

        grouped[currency].initial +=
          initial;

        grouped[currency].current +=
          current;

        grouped[currency].profitLoss +=
          current - initial;

        grouped[currency].accounts +=
          1;
      }
    );

    return Object.values(
      grouped
    ).sort((a, b) =>
      a.currency.localeCompare(
        b.currency
      )
    );
  }, [accounts]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">

        <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* TITLE */}

          <div className="min-w-0">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">

                <WalletCards
                  size={22}
                />

              </div>

              <div className="min-w-0">

                <h1 className="truncate text-xl font-bold sm:text-2xl">
                  Trading Accounts
                </h1>

                <p className="hidden text-sm text-slate-500 sm:block">
                  Manage all your trading accounts
                </p>

              </div>

            </div>

          </div>

          {/* ACTIONS */}

          <div className="flex shrink-0 items-center gap-2">

            <button
              onClick={
                loadAccounts
              }
              disabled={loading}
              title="Refresh accounts"
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
              onClick={
                openAddModal
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 sm:px-4"
            >

              <Plus size={18} />

              <span className="hidden sm:inline">
                Add Account
              </span>

            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="p-4 sm:p-6 lg:p-8">

        <div className="mx-auto w-full max-w-[1600px]">

          {/* =================================================
              ALERTS
          ================================================= */}

          {error && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">

              <p>
                {error}
              </p>

              <button
                onClick={() =>
                  setError("")
                }
                className="shrink-0"
              >
                <X size={18} />
              </button>

            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">

              <p>
                {success}
              </p>

              <button
                onClick={() =>
                  setSuccess("")
                }
                className="shrink-0"
              >
                <X size={18} />
              </button>

            </div>
          )}

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* TOTAL ACCOUNTS */}

            <SummaryCard
              icon={WalletCards}
              title="Total Accounts"
              value={
                accounts.length
              }
              subtitle={`${activeAccounts} active`}
            />

            {/* CURRENCY SUMMARY */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

              <div className="flex items-start justify-between">

                <div className="min-w-0">

                  <p className="text-sm text-slate-500">
                    Total Capital
                  </p>

                  <div className="mt-3 space-y-1">

                    {currencySummary.length >
                    0 ? (
                      currencySummary.map(
                        (item) => (
                          <p
                            key={
                              item.currency
                            }
                            className="text-lg font-bold"
                          >
                            {formatMoney(
                              item.initial,
                              item.currency
                            )}
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-2xl font-bold">
                        —
                      </p>
                    )}

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    By account currency
                  </p>

                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">

                  <DollarSign
                    size={19}
                  />

                </div>

              </div>

            </div>

            {/* TOTAL P/L */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

              <div className="flex items-start justify-between">

                <div className="min-w-0">

                  <p className="text-sm text-slate-500">
                    Total P/L
                  </p>

                  <div className="mt-3 space-y-1">

                    {currencySummary.length >
                    0 ? (
                      currencySummary.map(
                        (item) => (
                          <p
                            key={
                              item.currency
                            }
                            className={`text-lg font-bold ${
                              item.profitLoss >=
                              0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {item.profitLoss >=
                            0
                              ? "+"
                              : "-"}
                            {formatMoney(
                              Math.abs(
                                item.profitLoss
                              ),
                              item.currency
                            )}
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-2xl font-bold">
                        —
                      </p>
                    )}

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    By account currency
                  </p>

                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">

                  {currencySummary.some(
                    (item) =>
                      item.profitLoss < 0
                  ) ? (
                    <TrendingDown
                      size={19}
                    />
                  ) : (
                    <TrendingUp
                      size={19}
                    />
                  )}

                </div>

              </div>

            </div>

            {/* CURRENT BALANCE */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

              <div className="flex items-start justify-between">

                <div className="min-w-0">

                  <p className="text-sm text-slate-500">
                    Current Balance
                  </p>

                  <div className="mt-3 space-y-1">

                    {currencySummary.length >
                    0 ? (
                      currencySummary.map(
                        (item) => (
                          <p
                            key={
                              item.currency
                            }
                            className="text-lg font-bold"
                          >
                            {formatMoney(
                              item.current,
                              item.currency
                            )}
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-2xl font-bold">
                        —
                      </p>
                    )}

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    By account currency
                  </p>

                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">

                  <Activity
                    size={19}
                  />

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              CURRENCY BREAKDOWN
          ================================================= */}

          {currencySummary.length >
            1 && (
            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">

              <div className="mb-5">

                <h2 className="text-lg font-semibold">
                  Currency Breakdown
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Balances are kept separate because
                  different currencies should not be added
                  together without exchange-rate conversion.
                </p>

              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {currencySummary.map(
                  (item) => {

                    const percentage =
                      item.initial >
                      0
                        ? ((item.current -
                            item.initial) /
                            item.initial) *
                          100
                        : 0;

                    return (
                      <div
                        key={
                          item.currency
                        }
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >

                        <div className="flex items-center justify-between">

                          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                            {
                              item.currency
                            }
                          </span>

                          <span
                            className={`text-xs font-semibold ${
                              percentage >=
                              0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {percentage >=
                            0
                              ? "+"
                              : ""}
                            {percentage.toFixed(
                              2
                            )}
                            %
                          </span>

                        </div>

                        <p className="mt-4 text-xs text-slate-500">
                          Current Balance
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {formatMoney(
                            item.current,
                            item.currency
                          )}
                        </p>

                        <div className="mt-4 flex items-center justify-between text-xs">

                          <span className="text-slate-500">
                            Initial
                          </span>

                          <span className="font-medium text-slate-300">
                            {formatMoney(
                              item.initial,
                              item.currency
                            )}
                          </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">

                          <span className="text-slate-500">
                            P/L
                          </span>

                          <span
                            className={`font-semibold ${
                              item.profitLoss >=
                              0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {item.profitLoss >=
                            0
                              ? "+"
                              : "-"}
                            {formatMoney(
                              Math.abs(
                                item.profitLoss
                              ),
                              item.currency
                            )}
                          </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">

                          <span className="text-slate-500">
                            Accounts
                          </span>

                          <span className="font-medium text-slate-300">
                            {
                              item.accounts
                            }
                          </span>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </section>
          )}

          {/* =================================================
              ACCOUNTS
          ================================================= */}

          <div className="mt-8">

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Your Accounts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Keep track of your capital and account
                  performance.
                </p>

              </div>

              <p className="text-sm text-slate-600">
                {accounts.length} account
                {accounts.length ===
                1
                  ? ""
                  : "s"}
              </p>

            </div>

            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-80 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
                    />
                  )
                )}

              </div>

            ) : accounts.length ===
              0 ? (

              /* =================================================
                  EMPTY
              ================================================= */

              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">

                  <WalletCards
                    size={30}
                  />

                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  No trading accounts
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Add your first demo, live,
                  or prop-firm account to
                  start tracking your trading
                  performance.
                </p>

                <button
                  onClick={
                    openAddModal
                  }
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >

                  <Plus size={18} />

                  Add Your First Account

                </button>

              </div>

            ) : (

              /* =================================================
                  ACCOUNT CARDS
              ================================================= */

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {accounts.map(
                  (account) => {

                    const initial =
                      Number(
                        account.initialBalance ||
                          0
                      );

                    const current =
                      Number(
                        account.currentBalance ||
                          0
                      );

                    const profit =
                      current -
                      initial;

                    const percentage =
                      initial > 0
                        ? (profit /
                            initial) *
                          100
                        : 0;

                    return (
                      <article
                        key={
                          account._id
                        }
                        className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/90 sm:p-6"
                      >

                        {/* CARD HEADER */}

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">

                              <WalletCards
                                size={21}
                              />

                            </div>

                            <div className="min-w-0">

                              <h3 className="truncate font-semibold">
                                {
                                  account.name
                                }
                              </h3>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {getAccountTypeLabel(
                                  account.accountType
                                )}
                              </p>

                            </div>

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              account.status ===
                              "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : account.status ===
                                  "PAUSED"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {
                              account.status
                            }
                          </span>

                        </div>

                        {/* BALANCE */}

                        <div className="mt-7">

                          <p className="text-xs text-slate-500">
                            Current Balance
                          </p>

                          <div className="mt-1 flex flex-wrap items-baseline gap-2">

                            <p className="text-3xl font-bold tracking-tight">

                              {formatMoney(
                                current,
                                account.currency
                              )}

                            </p>

                            <span
                              className={`text-sm font-semibold ${
                                profit >=
                                0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >

                              {profit >=
                              0
                                ? "+"
                                : ""}

                              {percentage.toFixed(
                                2
                              )}
                              %

                            </span>

                          </div>

                        </div>

                        {/* P/L */}

                        <div className="mt-5 grid grid-cols-2 gap-3">

                          <div className="rounded-xl bg-slate-950 p-3">

                            <p className="text-xs text-slate-500">
                              Initial
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-200">

                              {formatMoney(
                                initial,
                                account.currency
                              )}

                            </p>

                          </div>

                          <div className="rounded-xl bg-slate-950 p-3">

                            <p className="text-xs text-slate-500">
                              P/L
                            </p>

                            <p
                              className={`mt-1 text-sm font-semibold ${
                                profit >=
                                0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >

                              {profit >=
                              0
                                ? "+"
                                : "-"}

                              {formatMoney(
                                Math.abs(
                                  profit
                                ),
                                account.currency
                              )}

                            </p>

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="mt-5 space-y-3 border-t border-slate-800 pt-5">

                          {account.broker && (
                            <DetailRow
                              icon={
                                Building2
                              }
                              label="Broker"
                              value={
                                account.broker
                              }
                            />
                          )}

                          {account.propFirm && (
                            <DetailRow
                              icon={
                                BriefcaseBusiness
                              }
                              label="Prop Firm"
                              value={
                                account.propFirm
                              }
                            />
                          )}

                          {account.accountNumber && (
                            <DetailRow
                              icon={
                                WalletCards
                              }
                              label="Account"
                              value={
                                account.accountNumber
                              }
                            />
                          )}

                          <DetailRow
                            icon={
                              DollarSign
                            }
                            label="Currency"
                            value={getCurrencyLabel(
                              account.currency
                            )}
                          />

                        </div>

                        {/* ACTIONS */}

                        <div className="mt-6 flex gap-2">

                          <button
                            onClick={() =>
                              openEditModal(
                                account
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >

                            <Pencil
                              size={16}
                            />

                            Edit

                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                account
                              )
                            }
                            className="rounded-xl border border-red-500/20 px-4 py-2.5 text-red-400 transition hover:bg-red-500/10"
                            title="Delete account"
                          >

                            <Trash2
                              size={17}
                            />

                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </main>

      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">

              <div>

                <h2 className="text-lg font-bold">
                  {editingAccount
                    ? "Edit Trading Account"
                    : "Add Trading Account"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingAccount
                    ? "Update your account details."
                    : "Add a new account to your journal."}
                </p>

              </div>

              <button
                onClick={
                  closeModal
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              >

                <X size={20} />

              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="overflow-y-auto p-5 sm:p-6"
            >

              <div className="grid gap-5 sm:grid-cols-2">

                {/* ACCOUNT NAME */}

                <InputField
                  label="Account Name"
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  placeholder="My ₹10K Account"
                  required
                />

                {/* ACCOUNT TYPE */}

                <SelectField
                  label="Account Type"
                  name="accountType"
                  value={
                    form.accountType
                  }
                  onChange={
                    handleChange
                  }
                  options={[
                    {
                      value: "DEMO",
                      label: "Demo",
                    },
                    {
                      value: "LIVE",
                      label: "Live",
                    },
                    {
                      value: "PROP_FIRM",
                      label: "Prop Firm",
                    },
                  ]}
                />

                {/* BROKER */}

                <InputField
                  label="Broker"
                  name="broker"
                  value={
                    form.broker
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="MetaTrader"
                />

                {/* PROP FIRM */}

                <InputField
                  label="Prop Firm"
                  name="propFirm"
                  value={
                    form.propFirm
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="FTMO"
                />

                {/* ACCOUNT NUMBER */}

                <InputField
                  label="Account Number"
                  name="accountNumber"
                  value={
                    form.accountNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                />

                {/* CURRENCY */}

                <SelectField
                  label="Currency"
                  name="currency"
                  value={
                    form.currency
                  }
                  onChange={
                    handleChange
                  }
                  options={[
                    {
                      value: "USD",
                      label:
                        "USD — US Dollar ($)",
                    },
                    {
                      value: "INR",
                      label:
                        "INR — Indian Rupee (₹)",
                    },
                    {
                      value: "EUR",
                      label:
                        "EUR — Euro (€)",
                    },
                    {
                      value: "GBP",
                      label:
                        "GBP — British Pound (£)",
                    },
                    {
                      value: "JPY",
                      label:
                        "JPY — Japanese Yen (¥)",
                    },
                    {
                      value: "AUD",
                      label:
                        "AUD — Australian Dollar (A$)",
                    },
                    {
                      value: "CAD",
                      label:
                        "CAD — Canadian Dollar (C$)",
                    },
                    {
                      value: "CHF",
                      label:
                        "CHF — Swiss Franc",
                    },
                  ]}
                />

                {/* INITIAL BALANCE */}

                <InputField
                  label="Initial Balance"
                  name="initialBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.initialBalance
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="10000"
                  required
                />

                {/* STATUS */}

                <SelectField
                  label="Status"
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
                  options={[
                    {
                      value: "ACTIVE",
                      label: "Active",
                    },
                    {
                      value: "PAUSED",
                      label: "Paused",
                    },
                    {
                      value: "COMPLETED",
                      label: "Completed",
                    },
                  ]}
                />

              </div>

              {/* DESCRIPTION */}

              <div className="mt-5">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={4}
                  placeholder="Optional notes about this trading account..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                />

              </div>

              {/* FORM ERROR */}

              {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {
                    error
                  }
                </div>
              )}

              {/* BUTTONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingAccount
                    ? "Update Account"
                    : "Create Account"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  positive,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>

          <p
            className={`mt-1 text-xs ${
              positive === false
                ? "text-red-400"
                : positive
                ? "text-emerald-400"
                : "text-slate-500"
            }`}
          >
            {subtitle}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">

          <Icon size={19} />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3">

      <Icon
        size={15}
        className="shrink-0 text-slate-600"
      />

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="ml-auto max-w-[55%] truncate text-xs font-medium text-slate-300">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-300">

        {label}

        {required && (
          <span className="ml-1 text-emerald-400">
            *
          </span>
        )}

      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
      />

    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
      >

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}

      </select>

    </div>
  );
}

export default Accounts;