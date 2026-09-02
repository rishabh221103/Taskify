import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Mail, Lock, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

export default function LoginPage() {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#05070a] text-[var(--text-primary)] px-4 py-12">
      {/* Centered Logo & Headers outside card */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--status-inprogress-text)] text-white shadow-lg shadow-[var(--status-inprogress-text)20] mb-4">
          <Check size={24} strokeWidth={3} />
        </div>
        <h1 className={`${display} text-3xl font-bold text-white tracking-tight`}>Welcome back</h1>
        <p className={`text-sm mt-2 ${muted}`}>Sign in to your Taskify account</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="mb-6">
          <h2 className={`${display} text-lg font-bold text-white`}>Sign In</h2>
          <p className={`text-xs mt-1 ${muted}`}>Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 rounded-xl border border-[var(--priority-high-text)33] bg-[var(--priority-high-text)10] text-[var(--priority-high-text)] text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Email</label>
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] focus-within:border-[var(--status-inprogress-text)] focus-within:ring-1 focus-within:ring-[var(--status-inprogress-text)]/30 transition-all">
              <Mail size={16} className="text-[var(--text-disabled)]" />
              <input
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-disabled)] text-white"
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
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] focus-within:border-[var(--status-inprogress-text)] focus-within:ring-1 focus-within:ring-[var(--status-inprogress-text)]/30 transition-all">
              <Lock size={16} className="text-[var(--text-disabled)]" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-disabled)] text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[var(--text-disabled)] hover:text-[var(--text-muted)] cursor-pointer transition-colors"
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
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[var(--status-inprogress-bg)]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
}
