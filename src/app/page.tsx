"use client";

import { useMemo, useState } from "react";
import { Bell, Download, TriangleAlert } from "lucide-react";
import * as XLSX from "xlsx";
import { useStock } from "@/lib/useStock";
import { CATEGORIES, SUBCATS } from "@/lib/utils";
import { type Item } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ItemCard } from "@/components/ItemCard";
import { ItemForm, type ItemFormValues } from "@/components/ItemForm";
import { ScanTab } from "@/components/ScanTab";
import { LabelsTab } from "@/components/LabelsTab";
import { LogTab } from "@/components/LogTab";

type Tab = "voorraad" | "scannen" | "toevoegen" | "labels" | "log";

export default function Home() {
  const stock = useStock();
  const { show } = useToast();

  const [tab, setTab] = useState<Tab>("voorraad");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Alle");
  const [activeSub, setActiveSub] = useState("Alle");
  const [lowOnly, setLowOnly] = useState(false);

  const [editing, setEditing] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<ItemFormValues | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [addForm, setAddForm] = useState<ItemFormValues | null>(null);
  const [addKey, setAddKey] = useState(0);
  const [notifOn, setNotifOn] = useState(false);

  const lowItems = useMemo(
    () =>
      stock.items.filter(
        (i) => Number(i.min_voorraad) > 0 && Number(i.hoeveelheid) < Number(i.min_voorraad)
      ),
    [stock.items]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return stock.items.filter((i) => {
      const cat = activeCat === "Alle" || i.categorie === activeCat;
      const sub =
        !(SUBCATS[activeCat] && activeSub !== "Alle") || i.subcategorie === activeSub;
      const matchQ =
        !q ||
        i.naam.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        (i.artikelnr || "").toLowerCase().includes(q) ||
        (i.merk || "").toLowerCase().includes(q);
      const low =
        !lowOnly || (Number(i.min_voorraad) > 0 && Number(i.hoeveelheid) < Number(i.min_voorraad));
      return cat && sub && matchQ && low;
    });
  }, [stock.items, search, activeCat, activeSub, lowOnly]);

  const fireNotification = (title: string, body: string) => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    } catch {
      /* ignore */
    }
  };

  const requestNotif = () => {
    if (typeof Notification === "undefined") {
      show("Systeemmeldingen niet ondersteund in deze browser");
      return;
    }
    if (Notification.permission === "granted") {
      setNotifOn(true);
      show("Systeemmeldingen staan al aan");
      return;
    }
    Notification.requestPermission().then((p) => {
      setNotifOn(p === "granted");
      show(p === "granted" ? "Systeemmeldingen ingeschakeld" : "Meldingen geblokkeerd");
    });
  };

  const handleAdjust = async (item: Item, delta: number) => {
    try {
      const res = await stock.adjustStock(item, delta);
      if (res.becameLow) {
        fireNotification(
          "Voorraad laag",
          `${item.naam} — nog ${res.newQty} ${item.eenheid} (min. ${item.min_voorraad})`
        );
      }
      return res;
    } catch {
      show("Bijwerken mislukt");
      return { newQty: item.hoeveelheid, becameLow: false };
    }
  };

  const saveNew = async () => {
    if (!addForm) return;
    if (!addForm.naam.trim()) return show("Geef een naam op");
    const code = addForm.code.trim() || stock.nextCode();
    if (stock.items.some((i) => i.code === code)) return show("Deze code bestaat al");
    try {
      await stock.addItem({ ...addForm, code });
      show("Item toegevoegd");
      setAddKey((k) => k + 1);
      setTab("voorraad");
    } catch {
      show("Toevoegen mislukt");
    }
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    if (!editForm.naam.trim()) return show("Geef een naam op");
    if (!editForm.code.trim()) return show("Geef een code op");
    if (stock.items.some((i) => i.id !== editing.id && i.code === editForm.code.trim()))
      return show("Deze code bestaat al bij een ander item");
    try {
      await stock.updateItem(editing.id, editForm);
      show("Item bijgewerkt");
      setEditing(null);
      setConfirmDelete(false);
    } catch {
      show("Opslaan mislukt");
    }
  };

  const doDelete = async () => {
    if (!editing) return;
    try {
      await stock.deleteItem(editing.id);
      show("Item verwijderd");
      setEditing(null);
      setConfirmDelete(false);
    } catch {
      show("Verwijderen mislukt");
    }
  };

  const exportExcel = () => {
    if (stock.items.length === 0) return show("Nog geen items om te exporteren");
    const rows = stock.items.map((i) => ({
      Code: i.code,
      Naam: i.naam,
      Categorie: i.categorie,
      Subgroep: i.subcategorie || "",
      Aantal: i.hoeveelheid,
      Eenheid: i.eenheid,
      Minimum: i.min_voorraad,
      Locatie: i.locatie,
      Merk: i.merk || "",
      "Artikelnr. fabrikant": i.artikelnr || "",
    }));
    const logRows = stock.log.map((l) => ({
      Datum: new Date(l.created_at).toLocaleString("nl-BE"),
      Code: l.item_code,
      Item: l.item_naam,
      Wijziging: l.delta,
      Resultaat: l.resultaat,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Voorraad");
    if (logRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), "Log");
    XLSX.writeFile(wb, `stockbeheer-${new Date().toISOString().slice(0, 10)}.xlsx`);
    show("Excel-bestand gedownload");
  };

  const openCreateWithCode = (code: string) => {
    setAddForm(null);
    setAddKey((k) => k + 1);
    setTab("toevoegen");
    // seed the code via a one-off default
    setTimeout(() => setAddForm((f) => (f ? { ...f, code } : f)), 0);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "voorraad", label: "Voorraad" },
    { id: "scannen", label: "Scannen" },
    { id: "toevoegen", label: "Toevoegen" },
    { id: "labels", label: "Labels" },
    { id: "log", label: "Log" },
  ];

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* header */}
      <header className="border-b border-border bg-panel px-4 pt-5 pb-4 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold tracking-tight text-accent">GT</span>
            <div>
              <h1 className="font-display text-xl font-bold uppercase tracking-wide">Stockbeheer</h1>
              <div className="font-mono text-[11px] text-muted">GILLES TECHNICS — MAGAZIJN</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={requestNotif}
              title="Systeemmeldingen"
              className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border cursor-pointer ${
                notifOn ? "border-ok bg-ok/10 opacity-100" : "border-border opacity-60"
              }`}
            >
              <Bell size={15} />
            </button>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_6px_var(--color-ok)]" />
              LIVE
            </div>
          </div>
        </div>

        {lowItems.length > 0 && (
          <button
            onClick={() => {
              setLowOnly(true);
              setTab("voorraad");
            }}
            className="mt-3.5 flex w-full items-center gap-2 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-[12.5px] text-warn cursor-pointer"
          >
            <TriangleAlert size={14} />
            {lowItems.length} item{lowItems.length > 1 ? "s" : ""} onder minimum voorraad
            <span className="ml-auto font-mono">bekijk →</span>
          </button>
        )}
      </header>

      {/* nav */}
      <nav className="sticky top-0 z-10 flex overflow-x-auto border-b border-border bg-panel print:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative min-w-[78px] flex-1 px-1.5 py-3 font-mono text-[11px] uppercase tracking-wide cursor-pointer ${
              tab === t.id ? "text-accent" : "text-muted"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-[14%] right-[14%] h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </nav>

      <main className="p-4">
        {stock.loading ? (
          <div className="py-16 text-center text-muted">Laden…</div>
        ) : stock.error ? (
          <div className="py-16 text-center text-warn">
            Databankfout: {stock.error}
          </div>
        ) : (
          <>
            {/* VOORRAAD */}
            {tab === "voorraad" && (
              <section>
                <div className="mb-3 flex gap-2 print:hidden">
                  <Button
                    variant={lowOnly ? "dangerOutline" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setLowOnly((v) => !v)}
                  >
                    <TriangleAlert size={14} /> Bijna op
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={exportExcel}>
                    <Download size={14} /> Excel
                  </Button>
                </div>

                <Input
                  className="mb-3"
                  placeholder="Zoek op naam, code, merk of artikelnr..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  {["Alle", ...CATEGORIES].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setActiveCat(c);
                        setActiveSub("Alle");
                      }}
                      className={`rounded-full border px-2.5 py-1.5 font-mono text-xs cursor-pointer ${
                        c === activeCat ? "border-accent text-accent" : "border-border text-muted"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {SUBCATS[activeCat] && (
                  <div className="mb-3.5 flex flex-wrap gap-1.5 border-l-2 border-accent/40 pl-2.5">
                    {["Alle", ...SUBCATS[activeCat]].map((s) => (
                      <button
                        key={s}
                        onClick={() => setActiveSub(s)}
                        className={`rounded-full border px-2.5 py-1 font-mono text-[11px] cursor-pointer ${
                          s === activeSub ? "border-accent text-accent" : "border-border text-muted"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {stock.items.length === 0 ? (
                  <div className="py-12 text-center text-muted">
                    Nog geen items. Voeg je eerste item toe via de tab &quot;Toevoegen&quot;.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted">Niets gevonden.</div>
                ) : (
                  filtered.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onAdjust={(d) => handleAdjust(item, d)}
                      onEdit={() => {
                        setEditing(item);
                        setConfirmDelete(false);
                      }}
                    />
                  ))
                )}
              </section>
            )}

            {/* SCANNEN */}
            {tab === "scannen" && (
              <ScanTab
                items={stock.items}
                onAdjust={handleAdjust}
                onCreateWithCode={openCreateWithCode}
              />
            )}

            {/* TOEVOEGEN */}
            {tab === "toevoegen" && (
              <section>
                <h2 className="mb-3.5 font-display text-[15px] uppercase tracking-wide text-muted">
                  Nieuw item
                </h2>
                <ItemForm key={addKey} onChange={setAddForm} suggestedCode={stock.nextCode()} />
                <Button className="mt-5 w-full" onClick={saveNew}>
                  Item toevoegen
                </Button>
              </section>
            )}

            {/* LABELS */}
            {tab === "labels" && <LabelsTab items={stock.items} />}

            {/* LOG */}
            {tab === "log" && <LogTab log={stock.log} />}
          </>
        )}
      </main>

      {/* EDIT DIALOG */}
      <Dialog open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <DialogHeader title="Item bewerken" onClose={() => setEditing(null)} />
            <ItemForm value={editing} onChange={setEditForm} />
            {!confirmDelete ? (
              <div className="mt-5 flex gap-2">
                <Button variant="dangerOutline" onClick={() => setConfirmDelete(true)}>
                  Verwijderen
                </Button>
                <Button className="flex-1" onClick={saveEdit}>
                  Wijzigingen opslaan
                </Button>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Annuleer
                </Button>
                <Button variant="danger" className="flex-1" onClick={doDelete}>
                  Ja, definitief verwijderen
                </Button>
              </div>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}
