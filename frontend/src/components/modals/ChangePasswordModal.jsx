import React, { useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import { X, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

export default function ChangePasswordModal() {
  const { changePasswordOpen, setChangePasswordOpen, changePassword } = useContext(AppContext);
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!changePasswordOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!oldPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = changePassword(oldPassword, newPassword);
      setLoading(false);
      
      if (res.success) {
        setSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setChangePasswordOpen(false);
          setSuccess(false);
        }, 1500);
      } else {
        setError(res.error || "Failed to update password.");
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setChangePasswordOpen(false);
            setError("");
            setSuccess(false);
          }}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="mb-6">
          <h2 className={`${display} text-lg font-bold text-white`}>Change Password</h2>
          <p className={`text-xs mt-1 ${muted}`}>Update your account password below.</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl border border-[var(--priority-high-text)33] bg-[var(--priority-high-text)10] text-[var(--priority-high-text)] text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl border border-[var(--status-completed-text)33] bg-[var(--status-completed-text)10] text-[var(--status-completed-text)] text-xs">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Current Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl focus-within:border-[var(--status-inprogress-text)] transition-all">
              <Lock size={15} className="text-[var(--text-muted)]" />
              <input
                type={showOld ? "text" : "password"}
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setError("");
                }}
                className="bg-transparent outline-none text-xs w-full placeholder:text-[var(--text-disabled)] text-white"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">New Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl focus-within:border-[var(--status-inprogress-text)] transition-all">
              <Lock size={15} className="text-[var(--text-muted)]" />
              <input
                type={showNew ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                className="bg-transparent outline-none text-xs w-full placeholder:text-[var(--text-disabled)] text-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Confirm New Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl focus-within:border-[var(--status-inprogress-text)] transition-all">
              <Lock size={15} className="text-[var(--text-muted)]" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                className="bg-transparent outline-none text-xs w-full placeholder:text-[var(--text-disabled)] text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setChangePasswordOpen(false);
                setError("");
                setSuccess(false);
              }}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white font-semibold text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[var(--status-inprogress-bg)]"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
