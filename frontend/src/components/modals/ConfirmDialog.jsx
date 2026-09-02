import React, { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  type = "confirm", // "confirm" | "alert"
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel
}) {
  // ESC key listener to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel && onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-sm shadow-2xl p-5 relative flex flex-col gap-4 animate-fadeInScale">
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          {isDestructive && <AlertTriangle size={16} className="text-red-500 shrink-0" />}
          <h3 className="font-['Space_Grotesk'] font-bold text-sm text-[var(--text-primary)]">
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-2 border-t border-[var(--border-default)]/30 pt-3.5">
          {type === "confirm" ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-[11px] font-semibold cursor-pointer transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 py-2 rounded-xl text-white text-[11px] font-semibold cursor-pointer transition-colors ${
                  isDestructive 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-[var(--status-inprogress-text)] hover:bg-[#2563eb]"
                }`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-2 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-[11px] font-semibold cursor-pointer transition-colors"
            >
              OK
            </button>
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeInScale {
          animation: fadeInScale 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
