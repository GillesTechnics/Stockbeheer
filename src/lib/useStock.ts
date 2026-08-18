"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, type Item, type LogEntry } from "./supabase";

export function useStock() {
  const [items, setItems] = useState<Item[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnce = useRef(false);

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("naam", { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setItems(data as Item[]);
    setError(null);
  }, []);

  const loadLog = useCallback(async () => {
    const { data, error } = await supabase
      .from("stock_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);
    if (!error && data) setLog(data as LogEntry[]);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadItems(), loadLog()]);
      setLoading(false);
      loadedOnce.current = true;
    })();

    const channel = supabase
      .channel("stock-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        loadItems();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_log" }, () => {
        loadLog();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems, loadLog]);

  // ---- actions ----
  const nextCode = useCallback(() => {
    let n = items.length + 1;
    let code: string;
    do {
      code = "GT-" + String(n).padStart(4, "0");
      n++;
    } while (items.some((i) => i.code === code));
    return code;
  }, [items]);

  const addItem = useCallback(
    async (item: Omit<Item, "id">) => {
      const { data, error } = await supabase.from("items").insert(item).select().single();
      if (error) throw error;
      await loadItems();
      return data as Item;
    },
    [loadItems]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<Item>) => {
      const { error } = await supabase
        .from("items")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await loadItems();
    },
    [loadItems]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      await loadItems();
    },
    [loadItems]
  );

  const adjustStock = useCallback(
    async (item: Item, delta: number) => {
      const newQty = Math.max(0, Number(item.hoeveelheid) + delta);
      const { error } = await supabase
        .from("items")
        .update({ hoeveelheid: newQty, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
      await supabase.from("stock_log").insert({
        item_id: item.id,
        item_naam: item.naam,
        item_code: item.code,
        delta,
        resultaat: newQty,
      });
      await Promise.all([loadItems(), loadLog()]);
      const wasLow = Number(item.min_voorraad) > 0 && Number(item.hoeveelheid) < Number(item.min_voorraad);
      const isLowNow = Number(item.min_voorraad) > 0 && newQty < Number(item.min_voorraad);
      return { newQty, becameLow: isLowNow && !wasLow };
    },
    [loadItems, loadLog]
  );

  return {
    items,
    log,
    loading,
    error,
    nextCode,
    addItem,
    updateItem,
    deleteItem,
    adjustStock,
    reload: loadItems,
  };
}
