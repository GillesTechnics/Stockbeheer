import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

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
  afbeelding_url: string;
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
