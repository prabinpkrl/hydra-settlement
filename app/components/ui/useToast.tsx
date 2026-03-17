"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastItem = {
  id: number;
  text: string;
  ok: boolean;
  /** true = sliding in, false = fading out */
  visible: boolean;
};

type ToastContextValue = {
  toast: (text: string, ok: boolean) => void;
};

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((text: string, ok: boolean) => {
    const id = ++idRef.current;

    // Add toast (visible = true → slides in)
    setToasts((prev) => {
      // Keep at most 3 at a time
      const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
      return [...trimmed, { id, text, ok, visible: true }];
    });

    // After 3 s, start fade-out
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );
      // Remove from DOM after animation finishes (400 ms)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 400);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — top-right corner */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: "22rem" }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              transition: "opacity 400ms ease, transform 400ms ease",
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? "translateX(0)" : "translateX(2rem)",
            }}
            className={`
              pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold
              ${
                t.ok
                  ? "bg-white border-green-200 text-green-700 shadow-green-100"
                  : "bg-white border-red-200 text-red-600 shadow-red-100"
              }
            `}
          >
            {/* Icon */}
            <span
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold
                ${t.ok ? "bg-green-500" : "bg-red-500"}`}
            >
              {t.ok ? "✓" : "✕"}
            </span>

            <span className="leading-snug">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx.toast;
}
