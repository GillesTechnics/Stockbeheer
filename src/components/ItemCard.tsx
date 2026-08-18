"use client";

import { Minus, Plus, Copy, Pencil } from "lucide-react";
import { type Item } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export function ItemCard({
  item,
  onAdjust,
  onEdit,
}: {
  item: Item;
  onAdjust: (delta: number) => void;
  onEdit: () => void;
}) {
  const { show } = useToast();
  const low = Number(item.min_voorraad) > 0 && Number(item.hoeveelheid) < Number(item.min_voorraad);

  const copyArt = () => {
    navigator.clipboard
      .writeText(item.artikelnr)
      .then(() => show("Artikelnummer gekopieerd"))
      .catch(() => show("Kopiëren mislukt"));
  };

  return (
    <div className="mb-2.5 rounded-[var(--radius)] border border-border bg-panel p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[10.5px] tracking-wide text-accent">{item.code}</div>
          <div className="mt-0.5 text-[15px] font-semibold">{item.naam}</div>
          <div className="mt-0.5 text-xs text-muted">{item.locatie || "geen locatie"}</div>
          {(item.merk || item.artikelnr) && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11.5px] text-muted">
                {item.merk}
                {item.merk && item.artikelnr ? " · " : ""}
                {item.artikelnr ? "Art.nr " + item.artikelnr : ""}
              </span>
              {item.artikelnr && (
                <button
                  onClick={copyArt}
                  className="flex items-center gap-1 text-[11px] text-accent underline cursor-pointer"
                >
                  <Copy size={11} /> kopieer
                </button>
              )}
            </div>
          )}
        </div>
        <Badge>
          {item.categorie}
          {item.subcategorie ? " · " + item.subcategorie : ""}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className={`font-mono text-[22px] font-semibold ${low ? "text-warn" : ""}`}>
            {item.hoeveelheid}
          </span>
          <span className="ml-1 text-xs text-muted">{item.eenheid}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-panel-2 text-lg cursor-pointer hover:border-accent/60"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => onAdjust(1)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-panel-2 text-lg cursor-pointer hover:border-accent/60"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {low && (
        <div className="mt-1.5 text-[11px] text-warn">Onder minimum ({item.min_voorraad})</div>
      )}

      <div className="mt-2 flex justify-end">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 font-mono text-[11.5px] text-muted underline cursor-pointer hover:text-text"
        >
          <Pencil size={11} /> Bewerken
        </button>
      </div>
    </div>
  );
}
