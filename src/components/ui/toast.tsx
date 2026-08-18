"use client";

import * as React from "react";

type ToastCtx = { show: (msg: string) => void };
const ToastContext = React.createContext<ToastCtx>({ show: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className={`fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-lg border border-accent bg-panel-2 px-4 py-2.5 text-sm text-text transition-all duration-200 ${
          msg ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3"
        }`}
      >
        {msg}
      </div>
    </ToastContext.Provider>
  );
}
