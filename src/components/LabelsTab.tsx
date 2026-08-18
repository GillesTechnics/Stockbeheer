"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { type Item } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function LabelsTab({ items }: { items: Item[] }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, string> = {};
      for (const item of items) {
        try {
          out[item.id] = await QRCode.toDataURL(item.code, {
            width: 120,
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

  if (items.length === 0) {
    return <div className="py-12 text-center text-muted">Nog geen items om labels voor te maken.</div>;
  }

  return (
    <div>
      <div className="mb-4 print:hidden">
        <Button className="w-full" onClick={() => window.print()}>
          <Printer size={16} /> Alle labels afdrukken
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 print:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-panel p-3 text-center print:border-dashed print:bg-white"
          >
            <div className="mb-1.5 flex justify-center">
              {qrs[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrs[item.id]} alt={item.code} width={90} height={90} />
              ) : (
                <div className="h-[90px] w-[90px]" />
              )}
            </div>
            <div className="text-[11.5px] font-semibold leading-tight print:text-black">
              {item.naam}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted print:text-black">{item.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
