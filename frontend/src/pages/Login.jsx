import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LogIn,
  TrendingUp,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  UserPlus,
  User,
  Mail,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  // ===============================
  // LOGIN FORM
  // ===============================
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // ===============================
  // REGISTER FORM
  // ===============================
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    timezone: "Asia/Kolkata",
    currency: "USD",
  });

  // ===============================
  // FORGOT PASSWORD FORM
  // ===============================
  const [forgotForm, setForgotForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ===============================
  // PASSWORD VISIBILITY
  // ===============================
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ===============================
  // PASSWORD RESET STATE
  // ===============================
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");

  // ===============================
  // COMMON STATE
  // ===============================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOGIN FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // REGISTER FORM CHANGE
  // =====================================================

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // FORGOT PASSWORD FORM CHANGE
  // =====================================================

  const handleForgotChange = (event) => {
    const { name, value } = event.target;

    let newValue = value;

    // OTP: numbers only, maximum 6 digits
    if (name === "otp") {
      newValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setForgotForm((previous) => ({
      ...previous,
      [name]: newValue,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error(
          "Login response did not contain a token or user."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setSuccess("Login successful. Opening dashboard...");

      setTimeout(() => {
        navigate("/");
      }, 300);
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            `Login failed. Server returned ${err.response.status}.`
        );
      } else if (err.request) {
        setError(
          "Cannot connect to the backend server. Make sure the backend is running on port 5000."
        );
      } else {
        setError(
          err.message || "Something went wrong during login."
        );
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = registerForm.name.trim();
    const email = registerForm.email.trim().toLowerCase();

    if (!name || !email || !registerForm.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (name.length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (registerForm.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (
      registerForm.password !==
      registerForm.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name,
        email,
        password: registerForm.password,
        timezone: registerForm.timezone,
        currency: registerForm.currency,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error(
          "Registration response did not contain a token or user."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setSuccess(
        "Account created successfully. Opening dashboard..."
      );

      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            `Registration failed. Server returned ${err.response.status}.`
        );
      } else if (err.request) {
        setError(
          "Cannot connect to the backend server. Make sure the backend is running on port 5000."
        );
      } else {
        setError(
          err.message || "Something went wrong during registration."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const email = forgotForm.email.trim().toLowerCase();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", {
        email,
      });

      setForgotForm((previous) => ({
        ...previous,
        email,
        otp: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setOtpSent(true);
      setOtpVerified(false);
      setResetToken("");

      setSuccess(
        "Verification code sent. Please check your email."
      );
    } catch (err) {
      console.error("SEND OTP ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to send verification code. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const email = forgotForm.email.trim().toLowerCase();
    const otp = forgotForm.otp.trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/verify-reset-otp",
        {
          email,
          otp,
        }
      );

      const token = response.data?.resetToken;

      if (!token) {
        throw new Error(
          "OTP was verified, but no reset token was returned."
        );
      }

      setResetToken(token);
      setOtpVerified(true);

      setSuccess(
        "OTP verified successfully. You can now create a new password."
      );
    } catch (err) {
      console.error("VERIFY OTP ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid or expired verification code."
      );

      setOtpVerified(false);
      setResetToken("");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!otpVerified || !resetToken) {
      setError("Please verify the OTP first.");
      return;
    }

    if (!forgotForm.newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (forgotForm.newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (
      forgotForm.newPassword !==
      forgotForm.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/reset-password",
        {
          resetToken,
          newPassword: forgotForm.newPassword,
        }
      );

      setSuccess(
        response.data?.message ||
          "Password reset successfully. You can now login."
      );

      // Clear reset credentials from React state
      setResetToken("");
      setOtpVerified(false);
      setOtpSent(false);

      // Clear password reset form
      setForgotForm({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Return to login after a short delay
      setTimeout(() => {
        setMode("login");

        setForm({
          email: "",
          password: "",
        });

        setSuccess(
          "Password reset successfully. Please login with your new password."
        );
      }, 1200);
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please verify the OTP again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // OPEN FORGOT PASSWORD
  // =====================================================

  const openForgotPassword = () => {
    setMode("forgot");

    setError("");
    setSuccess("");

    setOtpSent(false);
    setOtpVerified(false);
    setResetToken("");

    setForgotForm({
      email: form.email || "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // =====================================================
  // OPEN REGISTER
  // =====================================================

  const openRegister = () => {
    setMode("register");

    setError("");
    setSuccess("");

    setRegisterForm({
      name: "",
      email: form.email || "",
      password: "",
      confirmPassword: "",
      timezone: "Asia/Kolkata",
      currency: "USD",
    });
  };

  // =====================================================
  // BACK TO LOGIN
  // =====================================================

  const backToLogin = () => {
    setMode("login");

    setError("");
    setSuccess("");

    setOtpSent(false);
    setOtpVerified(false);
    setResetToken("");

    setForgotForm({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // =====================================================
  // CHANGE EMAIL
  // =====================================================

  const changeForgotEmail = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setResetToken("");

    setForgotForm((previous) => ({
      ...previous,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // COMMON INPUT CLASS
  // =====================================================

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* =================================================
            LEFT SECTION
        ================================================= */}

        <div className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />

          <div className="relative flex w-full flex-col justify-center px-10 xl:px-20">

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
                <TrendingUp className="h-7 w-7 text-slate-950" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Trading Journal
                </h1>

                <p className="text-sm text-slate-400">
                  Trade smarter. Analyze better.
                </p>
              </div>
            </div>

            <h2 className="max-w-xl text-4xl font-bold leading-tight xl:text-5xl">
              Your trading performance,
              <span className="text-emerald-400">
                {" "}organized in one place.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
              Track your trades, analyze your performance,
              understand your psychology, and improve your
              trading discipline.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-2xl font-bold text-emerald-400">
                  24/7
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Trade Tracking
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-2xl font-bold text-blue-400">
                  Smart
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Analytics
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-2xl font-bold text-purple-400">
                  AI
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Future Ready
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT SECTION
        ================================================= */}

        <div className="flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}

            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500">
                  <TrendingUp className="h-6 w-6 text-slate-950" />
                </div>

                <div>
                  <h1 className="text-xl font-bold">
                    Trading Journal
                  </h1>

                  <p className="text-xs text-slate-400">
                    Trade smarter. Analyze better.
                  </p>
                </div>

              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl sm:p-8">

              {/* =================================================
                  REGISTER
              ================================================= */}

              {mode === "register" ? (
                <>
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </button>

                  <div className="mb-7">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <UserPlus className="h-6 w-6" />
                    </div>

                    <h2 className="text-3xl font-bold">
                      Create Account
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Create your Trading Journal account and
                      start tracking your performance.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  <form
                    onSubmit={handleRegister}
                    className="space-y-5"
                  >

                    {/* NAME */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Full Name
                      </label>

                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                        <input
                          type="text"
                          name="name"
                          value={registerForm.name}
                          onChange={handleRegisterChange}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>

                    {/* EMAIL */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                        <input
                          type="email"
                          name="email"
                          value={registerForm.email}
                          onChange={handleRegisterChange}
                          placeholder="Enter your email"
                          autoComplete="email"
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>

                    {/* PASSWORD */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Password
                      </label>

                      <div className="relative">
                        <input
                          type={
                            showRegisterPassword
                              ? "text"
                              : "password"
                          }
                          name="password"
                          value={registerForm.password}
                          onChange={handleRegisterChange}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                          className={`${inputClass} pr-12`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(
                              (previous) => !previous
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Confirm Password
                      </label>

                      <div className="relative">
                        <input
                          type={
                            showRegisterConfirmPassword
                              ? "text"
                              : "password"
                          }
                          name="confirmPassword"
                          value={registerForm.confirmPassword}
                          onChange={handleRegisterChange}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          className={`${inputClass} pr-12`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterConfirmPassword(
                              (previous) => !previous
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                        >
                          {showRegisterConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* TIMEZONE + CURRENCY */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Timezone
                        </label>

                        <select
                          name="timezone"
                          value={registerForm.timezone}
                          onChange={handleRegisterChange}
                          className={inputClass}
                        >
                          <option value="Asia/Kolkata">
                            India (IST)
                          </option>

                          <option value="UTC">
                            UTC
                          </option>

                          <option value="America/New_York">
                            New York
                          </option>

                          <option value="Europe/London">
                            London
                          </option>

                          <option value="Asia/Dubai">
                            Dubai
                          </option>

                          <option value="Asia/Singapore">
                            Singapore
                          </option>

                          <option value="Asia/Tokyo">
                            Tokyo
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Currency
                        </label>

                        <select
                          name="currency"
                          value={registerForm.currency}
                          onChange={handleRegisterChange}
                          className={inputClass}
                        >
                          <option value="USD">
                            USD ($)
                          </option>

                          <option value="INR">
                            INR (₹)
                          </option>

                          <option value="EUR">
                            EUR (€)
                          </option>

                          <option value="GBP">
                            GBP (£)
                          </option>

                          <option value="JPY">
                            JPY (¥)
                          </option>

                          <option value="AUD">
                            AUD ($)
                          </option>

                          <option value="CAD">
                            CAD ($)
                          </option>

                          <option value="CHF">
                            CHF
                          </option>
                        </select>
                      </div>

                    </div>

                    {/* REGISTER BUTTON */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        "Creating account..."
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          Create Account
                        </>
                      )}
                    </button>

                  </form>
                </>

              ) : mode === "forgot" ? (

                /* =================================================
                   FORGOT PASSWORD
                ================================================= */

                <>
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </button>

                  <div className="mb-7">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <KeyRound className="h-6 w-6" />
                    </div>

                    <h2 className="text-3xl font-bold">
                      {otpVerified
                        ? "Create New Password"
                        : "Forgot Password?"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {otpVerified
                        ? "Your email has been verified. Create a new secure password."
                        : "Enter your email address and we'll send you a 6-digit verification code."}
                    </p>
                  </div>

                  {/* ALERTS */}

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  {/* EMAIL */}

                  {!otpVerified && (
                    <div className="mb-5">
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={forgotForm.email}
                        onChange={handleForgotChange}
                        placeholder="Enter your email"
                        autoComplete="email"
                        disabled={otpSent}
                        className={`${inputClass} ${
                          otpSent
                            ? "cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      />
                    </div>
                  )}

                  {/* STEP 1: SEND OTP */}

                  {!otpSent ? (
                    <form onSubmit={handleSendOtp}>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          "Sending..."
                        ) : (
                          <>
                            <ShieldCheck className="h-5 w-5" />
                            Send Verification Code
                          </>
                        )}
                      </button>
                    </form>
                  ) : !otpVerified ? (

                    /* STEP 2: VERIFY OTP */

                    <form
                      onSubmit={handleVerifyOtp}
                      className="space-y-5"
                    >
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          6-Digit Verification Code
                        </label>

                        <input
                          type="text"
                          name="otp"
                          value={forgotForm.otp}
                          onChange={handleForgotChange}
                          placeholder="000000"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          autoFocus
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-white outline-none transition placeholder:text-slate-700 focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || forgotForm.otp.length !== 6}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          "Verifying..."
                        ) : (
                          <>
                            <ShieldCheck className="h-5 w-5" />
                            Verify Code
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={changeForgotEmail}
                        className="w-full text-sm text-slate-500 transition hover:text-emerald-400"
                      >
                        Change email / resend code
                      </button>
                    </form>

                  ) : (

                    /* STEP 3: NEW PASSWORD */

                    <form
                      onSubmit={handleResetPassword}
                      className="space-y-5"
                    >

                      {/* VERIFIED STATUS */}

                      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-emerald-400">
                            Email verified
                          </p>

                          <p className="text-xs text-slate-400">
                            Create your new password below.
                          </p>
                        </div>
                      </div>

                      {/* NEW PASSWORD */}

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          New Password
                        </label>

                        <div className="relative">
                          <input
                            type={
                              showNewPassword
                                ? "text"
                                : "password"
                            }
                            name="newPassword"
                            value={forgotForm.newPassword}
                            onChange={handleForgotChange}
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                            autoFocus
                            className={`${inputClass} pr-12`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowNewPassword(
                                (previous) => !previous
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          Use at least 8 characters.
                        </p>
                      </div>

                      {/* CONFIRM PASSWORD */}

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                          Confirm New Password
                        </label>

                        <div className="relative">
                          <input
                            type={
                              showConfirmPassword
                                ? "text"
                                : "password"
                            }
                            name="confirmPassword"
                            value={forgotForm.confirmPassword}
                            onChange={handleForgotChange}
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                            className={`${inputClass} pr-12`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(
                                (previous) => !previous
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* RESET */}

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          "Resetting Password..."
                        ) : (
                          <>
                            <KeyRound className="h-5 w-5" />
                            Reset Password
                          </>
                        )}
                      </button>

                    </form>
                  )}
                </>

              ) : (

                /* =================================================
                   NORMAL LOGIN
                ================================================= */

                <>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold">
                      Welcome back
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Sign in to continue to your trading dashboard.
                    </p>
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* SUCCESS */}

                  {success && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >

                    {/* EMAIL */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        autoComplete="email"
                        className={inputClass}
                      />
                    </div>

                    {/* PASSWORD */}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-300">
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={openForgotPassword}
                          className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className={`${inputClass} pr-12`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (previous) => !previous
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* LOGIN */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        "Signing in..."
                      ) : (
                        <>
                          <LogIn className="h-5 w-5" />
                          Sign In
                        </>
                      )}
                    </button>

                  </form>

                  {/* REGISTER */}

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-800" />

                    <span className="text-xs text-slate-600">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-slate-800" />
                  </div>

                  <button
                    type="button"
                    onClick={openRegister}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 py-3.5 font-semibold text-white transition hover:border-emerald-500 hover:bg-slate-800"
                  >
                    <UserPlus className="h-5 w-5 text-emerald-400" />
                    Create New Account
                  </button>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;