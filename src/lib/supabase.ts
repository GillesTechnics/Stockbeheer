import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 5 } },
});

export type Item = {
  id: string;
  code: string;
  naam: string;
  categorie: string;
  subcategorie: string;
  merk: string;
  artikelnr: string;
  hoeveelheid: number;
  eenheid: string;
  min_voorraad: number;
  locatie: string;
  created_at?: string;
  updated_at?: string;
};

export type LogEntry = {
  id: string;
  item_id: string | null;
  item_naam: string;
  item_code: string;
  delta: number;
  resultaat: number;
  created_at: string;
};
