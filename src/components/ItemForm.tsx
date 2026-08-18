"use client";

import { useEffect, useState } from "react";
import { type Item } from "@/lib/supabase";
import { CATEGORIES, SUBCATS } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type ItemFormValues = Omit<Item, "id" | "created_at" | "updated_at">;

const empty: ItemFormValues = {
  code: "",
  naam: "",
  categorie: "Smart Home",
  subcategorie: "",
  merk: "",
  artikelnr: "",
  hoeveelheid: 0,
  eenheid: "stuks",
  min_voorraad: 0,
  locatie: "",
};

export function ItemForm({
  value,
  onChange,
  suggestedCode,
}: {
  value?: Partial<ItemFormValues>;
  onChange: (v: ItemFormValues) => void;
  suggestedCode?: string;
}) {
  const [form, setForm] = useState<ItemFormValues>({ ...empty, ...value });

  useEffect(() => {
    onChange(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const set = (patch: Partial<ItemFormValues>) => setForm((f) => ({ ...f, ...patch }));
  const subs = SUBCATS[form.categorie];

  return (
    <div>
      <Label>Naam</Label>
      <Input
        value={form.naam}
        onChange={(e) => set({ naam: e.target.value })}
        placeholder="bv. Loxone Miniserver Go"
      />

      <Label>Categorie</Label>
      <Select
        value={form.categorie}
        onChange={(e) => {
          const cat = e.target.value;
          const newSubs = SUBCATS[cat];
          set({ categorie: cat, subcategorie: newSubs ? newSubs[0] : "" });
        }}
      >
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>

      {subs && (
        <div className="mt-3.5 border-l-2 border-accent/40 pl-3">
          <Label className="mt-0">Subgroep</Label>
          <Select
            value={form.subcategorie || subs[0]}
            onChange={(e) => set({ subcategorie: e.target.value })}
          >
            {subs.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Hoeveelheid</Label>
          <Input
            type="number"
            min={0}
            value={form.hoeveelheid}
            onChange={(e) => set({ hoeveelheid: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="flex-1">
          <Label>Eenheid</Label>
          <Input
            value={form.eenheid}
            onChange={(e) => set({ eenheid: e.target.value })}
            placeholder="stuks / m / doos"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Minimum voorraad</Label>
          <Input
            type="number"
            min={0}
            value={form.min_voorraad}
            onChange={(e) => set({ min_voorraad: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="flex-1">
          <Label>Locatie</Label>
          <Input
            value={form.locatie}
            onChange={(e) => set({ locatie: e.target.value })}
            placeholder="bv. Rek B3"
          />
        </div>
      </div>

      <Label>Merk</Label>
      <Input
        value={form.merk}
        onChange={(e) => set({ merk: e.target.value })}
        placeholder="bv. Niko, Legrand, Hager..."
      />

      <Label>Artikelnummer fabrikant</Label>
      <Input
        value={form.artikelnr}
        onChange={(e) => set({ artikelnr: e.target.value })}
        placeholder="bv. 100213 (voor snel bestellen)"
      />

      <Label>Code</Label>
      <Input
        value={form.code}
        onChange={(e) => set({ code: e.target.value })}
        placeholder={suggestedCode || "GT-0001"}
      />
    </div>
  );
}
