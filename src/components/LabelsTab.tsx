"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Printer, CheckSquare, Square, FileDown } from "lucide-react";
import { type Item } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LabelsTab({ items }: { items: Item[] }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, string> = {};
      for (const item of items) {
        try {
          out[item.id] = await QRCode.toDataURL(item.code, {
            width: 400,
            margin: 1,
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.naam.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        (i.merk || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((i) => next.delete(i.id));
      else filtered.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const exportBrotherCsv = (list: Item[]) => {
    if (list.length === 0) return;
    const headers = ["Code", "Naam", "Merk", "Artikelnr", "Locatie", "Categorie"];
    const rows = list.map((i) => [
      i.code,
      i.naam,
      i.merk || "",
      i.artikelnr || "",
      i.locatie || "",
      [i.categorie, i.subcategorie].filter(Boolean).join(" - "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(csvCell).join(","))
      .join("\r\n");
    // BOM zodat accenten correct openen in de Brother-app en Excel
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `labels-brother-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const printItems = (list: Item[]) => {
    const ready = list.filter((i) => qrs[i.id]);
    if (ready.length === 0) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const labelHtml = ready
      .map(
        (item) => `
        <div class="label">
          <img src="${qrs[item.id]}" alt="${escapeHtml(item.code)}" />
          <div class="info">
            <div class="naam">${escapeHtml(item.naam)}</div>
            <div class="code">${escapeHtml(item.code)}</div>
            ${
              item.merk || item.artikelnr
                ? `<div class="meta">${escapeHtml(item.merk || "")}${
                    item.merk && item.artikelnr ? " &middot; " : ""
                  }${item.artikelnr ? "Art.nr " + escapeHtml(item.artikelnr) : ""}</div>`
                : ""
            }
            ${item.locatie ? `<div class="meta">${escapeHtml(item.locatie)}</div>` : ""}
          </div>
        </div>`
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html lang="nl">
      <head>
        <meta charset="utf-8" />
        <title>Labels (${ready.length})</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 10mm;
            font-family: system-ui, -apple-system, sans-serif;
            background: #fff;
            color: #000;
          }
          .toolbar {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 10mm;
          }
          .btn {
            padding: 9px 18px;
            font-size: 14px;
            border: 1px solid #333;
            border-radius: 8px;
            background: #fff;
            cursor: pointer;
          }
          .count { font-size: 13px; color: #555; }
          .sheet {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 4mm;
          }
          .label {
            display: flex;
            align-items: center;
            gap: 4mm;
            border: 1px solid #bbb;
            border-radius: 3mm;
            padding: 3mm;
            page-break-inside: avoid;
            break-inside: avoid;
            min-height: 26mm;
          }
          .label img {
            width: 22mm;
            height: 22mm;
            flex-shrink: 0;
          }
          .info { min-width: 0; }
          .naam {
            font-size: 11pt;
            font-weight: 700;
            line-height: 1.25;
            word-break: break-word;
          }
          .code {
            font-family: ui-monospace, monospace;
            font-size: 9pt;
            color: #333;
            margin-top: 1mm;
          }
          .meta {
            font-size: 8pt;
            color: #666;
            margin-top: 0.8mm;
          }
          @page { margin: 10mm; }
          @media print {
            body { padding: 0; }
            .toolbar { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="btn" onclick="window.print()">Afdrukken</button>
          <span class="count">${ready.length} label${ready.length > 1 ? "s" : ""}</span>
        </div>
        <div class="sheet">${labelHtml}</div>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        Nog geen items om labels voor te maken.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-muted">
        Vink labels aan en druk ze samen af, of tik op een label om er één te openen.
      </p>

      <Input
        className="mb-3"
        placeholder="Filter op naam, code of merk..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mb-3.5 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={toggleAll}>
          {allFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
          {allFilteredSelected ? "Deselecteer alles" : "Selecteer alles"}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={selected.size === 0}
          onClick={() => printItems(items.filter((i) => selected.has(i.id)))}
        >
          <Printer size={14} /> Druk af ({selected.size})
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mb-3.5 w-full"
        disabled={selected.size === 0}
        onClick={() => exportBrotherCsv(items.filter((i) => selected.has(i.id)))}
      >
        <FileDown size={14} /> Exporteer voor Brother ({selected.size})
      </Button>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-muted">Niets gevonden.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isSel = selected.has(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-lg border bg-panel p-3 transition-colors ${
                  isSel ? "border-accent" : "border-border"
                }`}
              >
                <button
                  onClick={() => toggle(item.id)}
                  className="shrink-0 cursor-pointer text-muted hover:text-accent"
                  aria-label={isSel ? "Deselecteer" : "Selecteer"}
                >
                  {isSel ? (
                    <CheckSquare size={18} className="text-accent" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>

                <button
                  onClick={() => printItems([item])}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                >
                  {qrs[item.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrs[item.id]}
                      alt={item.code}
                      width={56}
                      height={56}
                      className="shrink-0 rounded bg-white p-0.5"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded bg-panel-2" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{item.naam}</div>
                    <div className="font-mono text-[10.5px] text-accent">{item.code}</div>
                    {(item.merk || item.locatie) && (
                      <div className="truncate text-[11px] text-muted">
                        {item.merk}
                        {item.merk && item.locatie ? " · " : ""}
                        {item.locatie}
                      </div>
                    )}
                  </div>
                  <ExternalLink size={14} className="ml-auto shrink-0 text-muted" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function csvCell(v: string) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
