"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink } from "lucide-react";
import { type Item } from "@/lib/supabase";

export function LabelsTab({ items }: { items: Item[] }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, string> = {};
      for (const item of items) {
        try {
          out[item.id] = await QRCode.toDataURL(item.code, {
            width: 400,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });
        } catch {
          /* skip */
        }
      }
      if (!cancelled) setQrs(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const openLabel = (item: Item) => {
    const dataUrl = qrs[item.id];
    if (!dataUrl) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(item.code)} - ${escapeHtml(item.naam)}</title>
        <style>
          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 12px;
            text-align: center;
          }
          img { width: 260px; height: 260px; }
          .naam { font-size: 16px; font-weight: 600; max-width: 300px; }
          .code { font-family: monospace; font-size: 13px; color: #555; }
          .btn {
            margin-top: 16px;
            padding: 10px 20px;
            font-size: 14px;
            border: 1px solid #333;
            border-radius: 8px;
            background: #fff;
            cursor: pointer;
          }
          @media print {
            .btn { display: none; }
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${escapeHtml(item.code)}" />
        <div class="naam">${escapeHtml(item.naam)}</div>
        <div class="code">${escapeHtml(item.code)}</div>
        <button class="btn" onclick="window.print()">Afdrukken</button>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (items.length === 0) {
    return <div className="py-12 text-center text-muted">Nog geen items om labels voor te maken.</div>;
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-muted">
        Tik op een label om de QR-code groot te openen en apart af te drukken.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => openLabel(item)}
            className="group relative rounded-lg border border-border bg-panel p-3 text-center cursor-pointer transition-colors hover:border-accent"
          >
            <div className="absolute right-2 top-2 text-muted group-hover:text-accent">
              <ExternalLink size={14} />
            </div>
            <div className="mb-1.5 flex justify-center">
              {qrs[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrs[item.id]} alt={item.code} width={90} height={90} />
              ) : (
                <div className="h-[90px] w-[90px]" />
              )}
            </div>
            <div className="text-[11.5px] font-semibold leading-tight">{item.naam}</div>
            <div className="mt-0.5 font-mono text-[10px] text-muted">{item.code}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
