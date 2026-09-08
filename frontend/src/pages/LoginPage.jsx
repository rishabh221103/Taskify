import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Mail, Lock, Check, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

export default function LoginPage() {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loginStatus, setLoginStatus] = useState("idle"); // 'idle' | 'submitting' | 'redirecting'
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const isProcessing = loginStatus !== "idle";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return; // Prevent duplicate submissions from rapid clicks
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoginStatus("submitting");
    const res = await login(email.trim(), password);

    if (!res.success) {
      setLoginStatus("idle");
      setError(res.error || "Login failed. Please check your credentials.");
    } else {
      // Login succeeded; transition to redirecting state while route loaders execute
      setLoggedInUser(res.user);
      setLoginStatus("redirecting");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#05070a] text-[var(--text-primary)] px-4 py-12 relative overflow-hidden">
      {/* Centered Logo & Headers outside card */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--status-inprogress-text)] text-white shadow-lg shadow-[var(--status-inprogress-text)20] mb-4">
          <Check size={24} strokeWidth={3} />
        </div>
        <h1 className={`${display} text-3xl font-bold text-white tracking-tight`}>Welcome back</h1>
        <p className={`text-sm mt-2 ${muted}`}>Sign in to your Taskify account</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 w-full max-w-md shadow-2xl relative z-10">
        <div className="mb-6">
          <h2 className={`${display} text-lg font-bold text-white`}>Sign In</h2>
          <p className={`text-xs mt-1 ${muted}`}>Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl border border-[var(--priority-high-text)33] bg-[var(--priority-high-text)10] text-[var(--priority-high-text)] text-xs animate-in fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Email</label>
            <div
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all ${
                isProcessing
                  ? "opacity-60 cursor-not-allowed"
                  : "focus-within:border-[var(--status-inprogress-text)] focus-within:ring-1 focus-within:ring-[var(--status-inprogress-text)]/30"
              }`}
            >
              <Mail size={16} className="text-[var(--text-disabled)]" />
              <input
                type="email"
                placeholder="name@gmail.com"
                value={email}
                disabled={isProcessing}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-disabled)] text-white disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">Password</label>
              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-[var(--status-inprogress-text)] hover:underline">
                Forgot password?
              </a>
            </div>
            <div
              className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] transition-all ${
                isProcessing
                  ? "opacity-60 cursor-not-allowed"
                  : "focus-within:border-[var(--status-inprogress-text)] focus-within:ring-1 focus-within:ring-[var(--status-inprogress-text)]/30"
              }`}
            >
              <Lock size={16} className="text-[var(--text-disabled)]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                disabled={isProcessing}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-disabled)] text-white disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowPassword((v) => !v)}
                className="text-[var(--text-disabled)] hover:text-[var(--text-muted)] cursor-pointer transition-colors disabled:cursor-not-allowed"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center gap-2.5 my-1">
            <label className="relative flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                disabled={isProcessing}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] peer-checked:bg-[var(--status-inprogress-text)] peer-checked:border-[var(--status-inprogress-text)] flex items-center justify-center transition-colors">
                {rememberMe && <Check size={10} strokeWidth={4} className="text-white" />}
              </div>
              <span className="ml-2.5 text-xs text-[var(--text-primary)]">Remember me for 30 days</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isProcessing}
            className={`mt-2 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[var(--status-inprogress-bg)] ${
              isProcessing
                ? "bg-[var(--status-inprogress-text)]/85 text-white/90 cursor-not-allowed"
                : "bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white cursor-pointer active:scale-[0.99]"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin text-white shrink-0" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Signup redirection footer */}
        <p className="text-xs text-[var(--text-muted)] text-center mt-6">
          Don't have an account?{" "}
          <a href="#signup" onClick={(e) => e.preventDefault()} className="text-[var(--status-inprogress-text)] hover:underline font-semibold">
            Sign up
          </a>
        </p>
      </div>

      {/* Branded full-page loading transition screen */}
      {loginStatus === "redirecting" && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070a]/95 backdrop-blur-md text-[var(--text-primary)] animate-in fade-in duration-300"
        >
          <div className="flex flex-col items-center text-center p-8 max-w-sm">
            {/* Animated Taskify Icon Badge */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--status-inprogress-text)] text-white shadow-2xl shadow-[var(--status-inprogress-text)]/40 animate-pulse">
                <Check size={32} strokeWidth={3} />
              </div>
              <div className="absolute -inset-2.5 rounded-3xl border-2 border-[var(--status-inprogress-text)]/30 border-t-[var(--status-inprogress-text)] animate-spin" />
            </div>

            <h2 className={`${display} text-2xl font-bold text-white tracking-tight`}>
              {loggedInUser?.name ? `Welcome, ${loggedInUser.name.split(" ")[0]}!` : "Welcome back!"}
            </h2>
            <p className="text-xs mt-2 text-[var(--text-muted)]">
              {loggedInUser?.isOwner
                ? "Setting up your workspace & metrics..."
                : "Setting up your workspace & tasks..."}
            </p>

            {/* Sub-status badge with spinner */}
            <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-muted)] shadow-inner">
              <Loader2 size={13} className="animate-spin text-[var(--status-inprogress-text)]" />
              <span>Opening dashboard...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
