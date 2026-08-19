"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { ScanLine, Minus, Plus, Copy, CameraOff } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [found, setFound] = useState<Item | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  const handleCode = useCallback(
    (code: string) => {
      const item = items.find((i) => i.code.toLowerCase() === code.toLowerCase());
      if (item) {
        setFound(item);
        setNotFoundCode(null);
        show("Code gevonden: " + item.code);
      } else {
        setFound(null);
        setNotFoundCode(code);
      }
    },
    [items, show]
  );

  const stopCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    // stop ook eventuele losse tracks op het video-element
    const v = videoRef.current;
    if (v && v.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    setFound(null);
    setNotFoundCode(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Camera niet ondersteund in deze browser.");
      return;
    }

    setScanning(true);

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 100,
        });
      }
      const reader = readerRef.current;

      // Forceer expliciet de achtercamera via facingMode.
      // We openen zelf de stream (achtercamera afgedwongen) en geven die aan zxing.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Sommige toestellen ondersteunen 'exact' niet -> zachtere voorkeur
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }

      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      await video.play();

      // Laat zxing scannen op de reeds lopende videostream
      const controls = await reader.decodeFromVideoElement(video, (result) => {
        if (result) {
          handleCode(result.getText().trim());
          stopCamera();
        }
      });
      controlsRef.current = controls;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err.name === "NotAllowedError") {
        setCamError(
          "Cameratoegang geweigerd. Tik op het slot-icoon in de adresbalk en zet Camera op 'Toestaan'."
        );
      } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
        setCamError("Geen achtercamera gevonden op dit toestel.");
      } else if (err.name === "NotReadableError") {
        setCamError("De camera is in gebruik door een andere app. Sluit die en probeer opnieuw.");
      } else {
        setCamError("Kon de camera niet starten (" + (err.name || err.message || "onbekend") + ").");
      }
      setScanning(false);
    }
  }, [handleCode, stopCamera]);

  useEffect(() => {
    return () => {
      if (controlsRef.current) controlsRef.current.stop();
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const liveFound = found ? items.find((i) => i.id === found.id) || found : null;

  return (
    <div>
      {!scanning ? (
        <div className="mb-4 rounded-xl border border-dashed border-border p-8 text-center">
          <ScanLine className="mx-auto mb-2.5 text-accent" size={34} />
          <div className="font-semibold">Scan een QR-label</div>
          <p className="my-2.5 text-[13px] text-muted">
            Richt je camera op het label — de code wordt vanzelf herkend
          </p>
          <Button onClick={startCamera}>Camera starten</Button>
          {camError && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[12.5px] text-warn">
              <CameraOff size={14} /> {camError}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 overflow-hidden rounded-xl border border-accent">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              className="w-full max-h-[60vh] object-cover"
              playsInline
              muted
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-lg border-2 border-accent/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-panel p-3">
            <span className="animate-pulse font-mono text-[12px] text-accent">● Scannen…</span>
            <Button variant="outline" size="sm" onClick={stopCamera}>
              Stoppen
            </Button>
          </div>
        </div>
      )}

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