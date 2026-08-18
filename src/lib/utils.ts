import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  "Smart Home",
  "Netwerk",
  "Ventilatie",
  "Elektriciteit",
  "Sanitair",
  "Airco & Warmtepomp",
  "Overig",
] as const;

export const SUBCATS: Record<string, string[]> = {
  "Smart Home": ["Loxone", "KNX", "Niko Home", "Overig"],
  Netwerk: ["UniFi", "Overig"],
  "Airco & Warmtepomp": ["Airzone", "Daikin", "LG", "Installatiemateriaal", "Overig"],
  Elektriciteit: [
    "Bekabeling",
    "Schakelmateriaal",
    "Verlichting",
    "Afwerkingen",
    "Verdeelborden & zekeringen",
    "Aarding & bliksem",
    "Overig",
  ],
  Overig: ["Kabels", "Overig"],
};
