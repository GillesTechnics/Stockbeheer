"use client";

import { type LogEntry } from "@/lib/supabase";

export function LogTab({ log }: { log: LogEntry[] }) {
  if (log.length === 0) {
    return <div className="py-12 text-center text-muted">Nog geen bewegingen geregistreerd.</div>;
  }
  return (
    <div>
      <h2 className="mb-3.5 font-display text-[15px] uppercase tracking-wide text-muted">
        Recente bewegingen
      </h2>
      {log.map((e) => {
        const d = new Date(e.created_at);
        const dateStr =
          d.toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit" }) +
          " " +
          d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
        return (
          <div
            key={e.id}
            className="flex items-center justify-between border-b border-border py-2.5 text-[13px] last:border-none"
          >
            <div>
              <div className="font-medium">{e.item_naam}</div>
              <div className="font-mono text-[11px] text-muted">
                {e.item_code} · {dateStr}
              </div>
            </div>
            <div className={`font-mono font-semibold ${e.delta > 0 ? "text-ok" : "text-warn"}`}>
              {e.delta > 0 ? "+" : ""}
              {e.delta} → {e.resultaat}
            </div>
          </div>
        );
      })}
    </div>
  );
}
