import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Globe,
  DollarSign,
  Lock,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../services/api";

function Settings() {
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    timezone: "UTC",
    currency: "USD",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/me");

      const currentUser = response.data.user;

      setUser(currentUser);

      setProfile({
        name: currentUser.name || "",
        email: currentUser.email || "",
        timezone: currentUser.timezone || "UTC",
        currency: currentUser.currency || "USD",
      });

      localStorage.setItem(
        "user",
        JSON.stringify(currentUser)
      );
    } catch (err) {
      console.error("Profile error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");
      setError("");

      if (profile.name.trim().length < 2) {
        setError(
          "Name must contain at least 2 characters."
        );
        return;
      }

      const response = await api.put(
        "/auth/profile",
        {
          name: profile.name,
          timezone: profile.timezone,
          currency: profile.currency,
        }
      );

      const updatedUser = response.data.user;

      setUser(updatedUser);

      setProfile({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        timezone: updatedUser.timezone || "UTC",
        currency: updatedUser.currency || "USD",
      });

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setMessage(
        "Your profile has been updated successfully."
      );
    } catch (err) {
      console.error("Save profile error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    try {
      setChangingPassword(true);
      setMessage("");
      setError("");

      if (
        !passwords.currentPassword ||
        !passwords.newPassword
      ) {
        setError(
          "Please enter your current and new password."
        );
        return;
      }

      if (passwords.newPassword.length < 8) {
        setError(
          "New password must contain at least 8 characters."
        );
        return;
      }

      if (
        passwords.newPassword !==
        passwords.confirmPassword
      ) {
        setError("New passwords do not match.");
        return;
      }

      await api.put(
        "/auth/change-password",
        {
          currentPassword:
            passwords.currentPassword,
          newPassword: passwords.newPassword,
        }
      );

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage(
        "Password changed successfully."
      );
    } catch (err) {
      console.error("Password change error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />

            <p className="text-sm text-slate-400">
              Loading settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-800 p-3">
              <SettingsIcon className="h-6 w-6 text-slate-300" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Settings
              </h1>

              <p className="text-sm text-slate-400">
                Manage your profile and account security.
              </p>
            </div>
          </div>

          <button
            onClick={fetchProfile}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(350px,1fr)]">

          {/* Profile */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5">
                <User className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Profile
                </h2>

                <p className="text-xs text-slate-500">
                  Update your personal trading-journal preferences.
                </p>
              </div>
            </div>

            {/* Avatar */}
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xl font-bold text-slate-950">
                {profile.name
                  ? profile.name
                      .charAt(0)
                      .toUpperCase()
                  : "T"}
              </div>

              <div>
                <p className="font-semibold">
                  {profile.name || "Trader"}
                </p>

                <p className="text-sm text-slate-500">
                  {profile.email}
                </p>
              </div>
            </div>

            <form
              onSubmit={saveProfile}
              className="space-y-5"
            >
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="input"
                  placeholder="Your name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="input cursor-not-allowed opacity-60"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Email changes are disabled for now.
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Globe className="h-4 w-4 text-slate-500" />
                  Timezone
                </label>

                <select
                  name="timezone"
                  value={profile.timezone}
                  onChange={handleProfileChange}
                  className="input"
                >
                  <option value="UTC">
                    UTC
                  </option>

                  <option value="Asia/Kolkata">
                    India — Kolkata
                  </option>

                  <option value="America/New_York">
                    New York
                  </option>

                  <option value="America/Chicago">
                    Chicago
                  </option>

                  <option value="America/Los_Angeles">
                    Los Angeles
                  </option>

                  <option value="Europe/London">
                    London
                  </option>

                  <option value="Europe/Berlin">
                    Berlin
                  </option>

                  <option value="Asia/Tokyo">
                    Tokyo
                  </option>

                  <option value="Asia/Singapore">
                    Singapore
                  </option>

                  <option value="Australia/Sydney">
                    Sydney
                  </option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  Default Currency
                </label>

                <select
                  name="currency"
                  value={profile.currency}
                  onChange={handleProfileChange}
                  className="input"
                >
                  <option value="USD">
                    USD — US Dollar
                  </option>

                  <option value="EUR">
                    EUR — Euro
                  </option>

                  <option value="GBP">
                    GBP — British Pound
                  </option>

                  <option value="INR">
                    INR — Indian Rupee
                  </option>

                  <option value="AUD">
                    AUD — Australian Dollar
                  </option>

                  <option value="CAD">
                    CAD — Canadian Dollar
                  </option>

                  <option value="JPY">
                    JPY — Japanese Yen
                  </option>

                  <option value="SGD">
                    SGD — Singapore Dollar
                  </option>
                </select>
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Profile
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Security */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5">
                <Lock className="h-5 w-5 text-red-400" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Security
                </h2>

                <p className="text-xs text-slate-500">
                  Keep your trading journal account secure.
                </p>
              </div>
            </div>

            <form
              onSubmit={changePassword}
              className="space-y-5"
            >
              {/* Current Password */}
              <PasswordInput
                label="Current Password"
                name="currentPassword"
                value={
                  passwords.currentPassword
                }
                onChange={handlePasswordChange}
                visible={showCurrentPassword}
                setVisible={
                  setShowCurrentPassword
                }
              />

              {/* New Password */}
              <PasswordInput
                label="New Password"
                name="newPassword"
                value={
                  passwords.newPassword
                }
                onChange={handlePasswordChange}
                visible={showNewPassword}
                setVisible={setShowNewPassword}
              />

              {/* Confirm Password */}
              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={
                  passwords.confirmPassword
                }
                onChange={handlePasswordChange}
                visible={showConfirmPassword}
                setVisible={
                  setShowConfirmPassword
                }
              />

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold text-slate-300">
                  Password requirements
                </p>

                <ul className="mt-2 space-y-1 text-xs text-slate-500">
                  <li>• Minimum 8 characters</li>
                  <li>• Use a strong password</li>
                  <li>• Do not reuse old passwords</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Account Information */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-bold">
            Account Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Account Status"
              value={
                user?.isActive
                  ? "Active"
                  : "Inactive"
              }
              valueClass={
                user?.isActive
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            />

            <InfoItem
              label="Currency"
              value={profile.currency}
            />

            <InfoItem
              label="Timezone"
              value={profile.timezone}
            />

            <InfoItem
              label="Member Since"
              value={
                user?.createdAt
                  ? new Date(
                      user.createdAt
                    ).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "-"
              }
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  visible,
  setVisible,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="input pr-12"
          placeholder="••••••••"
          autoComplete="off"
        />

        <button
          type="button"
          onClick={() =>
            setVisible((previous) => !previous)
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  valueClass = "text-slate-200",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-[10px] uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

export default Settings;
