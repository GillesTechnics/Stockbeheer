"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import { ScanLine, Minus, Plus, Copy } from "lucide-react";
import { type Item } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function ScanTab({
  items,
  onAdjust,
  onCreateWithCode,
}: {
  items: Item[];
  onAdjust: (item: Item, delta: number) => Promise<{ newQty: number }>;
  onCreateWithCode: (code: string) => void;
}) {
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [found, setFound] = useState<Item | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const handleCode = (code: string) => {
    const item = items.find((i) => i.code.toLowerCase() === code.toLowerCase());
    if (item) {
      setFound(item);
      setNotFoundCode(null);
    } else {
      setFound(null);
      setNotFoundCode(code);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const maxDim = 1000;
      let w = img.width,
        h = img.height;
      if (w > maxDim) {
        h = h * (maxDim / w);
        w = maxDim;
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const result = jsQR(data.data, data.width, data.height);
      if (result?.data) handleCode(result.data.trim());
      else show("Geen QR-code herkend. Probeer opnieuw of zoek manueel.");
    };
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  };

  // keep found item in sync with latest data
  const liveFound = found ? items.find((i) => i.id === found.id) || found : null;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-dashed border-border p-8 text-center">
        <ScanLine className="mx-auto mb-2.5 text-accent" size={34} />
        <div className="font-semibold">Scan een QR-label</div>
        <p className="my-2.5 text-[13px] text-muted">
          Maak een foto van het label op het rek of de doos
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFile}
        />
        <Button onClick={() => fileRef.current?.click()}>Foto nemen / kiezen</Button>
      </div>

      <div className="my-4 flex items-center gap-2.5 font-mono text-[11px] text-muted">
        <span className="h-px flex-1 bg-border" /> OF ZOEK MANUEEL{" "}
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && manual.trim() && handleCode(manual.trim())}
          placeholder="Code, bv. GT-0004"
        />
        <Button variant="outline" size="sm" onClick={() => manual.trim() && handleCode(manual.trim())}>
          Zoek
        </Button>
      </div>

      {liveFound && <ScanResult item={liveFound} onAdjust={onAdjust} />}

      {notFoundCode && (
        <div className="rounded-[var(--radius)] border border-warn bg-panel p-4 text-center">
          <div className="mb-2.5">
            Code &quot;<strong>{notFoundCode}</strong>&quot; niet gevonden.
          </div>
          <Button size="sm" onClick={() => onCreateWithCode(notFoundCode)}>
            Nieuw item aanmaken met deze code
          </Button>
        </div>
      )}
    </div>
  );
}

function ScanResult({
  item,
  onAdjust,
}: {
  item: Item;
  onAdjust: (item: Item, delta: number) => Promise<{ newQty: number }>;
}) {
  const { show } = useToast();
  const low = Number(item.min_voorraad) > 0 && Number(item.hoeveelheid) < Number(item.min_voorraad);
  return (
    <div className="rounded-[var(--radius)] border border-accent bg-panel p-4">
      <div className="font-mono text-[10.5px] text-accent">{item.code}</div>
      <div className="text-[15px] font-semibold">{item.naam}</div>
      <div className="mb-3 text-xs text-muted">
        {item.locatie || "geen locatie"} · {item.categorie}
        {item.subcategorie ? " · " + item.subcategorie : ""}
      </div>
      {(item.merk || item.artikelnr) && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11.5px] text-muted">
            {item.merk}
            {item.merk && item.artikelnr ? " · " : ""}
            {item.artikelnr ? "Art.nr " + item.artikelnr : ""}
          </span>
          {item.artikelnr && (
            <button
              onClick={() =>
                navigator.clipboard.writeText(item.artikelnr).then(() => show("Gekopieerd"))
              }
              className="flex items-center gap-1 text-[11px] text-accent underline cursor-pointer"
            >
              <Copy size={11} /> kopieer
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <span className={`font-mono text-[22px] font-semibold ${low ? "text-warn" : ""}`}>
            {item.hoeveelheid}
          </span>
          <span className="ml-1 text-xs text-muted">{item.eenheid}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(item, -1)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-panel-2 cursor-pointer hover:border-accent/60"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => onAdjust(item, 1)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-panel-2 cursor-pointer hover:border-accent/60"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      {low && <div className="mt-1.5 text-[11px] text-warn">Onder minimum ({item.min_voorraad})</div>}
    </div>
  );
}
