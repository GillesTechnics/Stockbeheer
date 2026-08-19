# Stockbeheer — Gilles Technics

Full-stack voorraadbeheer met QR-codes. Gebouwd met **Next.js 15**, **React 19**, **Tailwind 4**, **shadcn-stijl componenten** en **Supabase** als databank (met live updates tussen gebruikers).

## Wat het doet

- Voorraad beheren per hoofdcategorie en subgroep (Smart Home, Netwerk, Ventilatie, Elektriciteit, Sanitair, Airco & Warmtepomp, Overig)
- Merk en fabrikant-artikelnummer per item (met kopieerknop om snel te bestellen)
- QR-labels genereren en afdrukken; scannen via foto om voorraad bij te werken
- Melding bij lage voorraad (pop-up, systeemmelding, en "Bijna op"-filter)
- Excel-export van voorraad + bewegingslog
- Live gedeeld tussen jou en je partner (Supabase Realtime)

## Lokaal draaien

```bash
npm install
npm run dev
```

De app draait dan op http://localhost:3000

## Databank

De Supabase-databank is al aangemaakt en gevuld met de tabellen `items` en `stock_log`.
De verbindingsgegevens staan in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

De gebruikte sleutel is de **publishable** (publieke) sleutel — die hoort thuis in
frontend-code. Deel de app-link niet publiek, want iedereen met de link kan de
voorraad zien en bewerken (dit is een intern tool zonder login).

## Op Vercel zetten

1. Zet deze map in een GitHub-repository.
2. Ga naar vercel.com → **Add New… → Project** → importeer de repository.
3. Bij **Environment Variables** voeg je toe (zelfde waarden als in `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Je krijgt een vaste link zoals `gilles-stockbeheer.vercel.app`.

## Later beveiligen (optioneel)

Wil je een login of wachtwoord toevoegen zodat niet iedereen met de link erin kan?
Dat kan met Supabase Auth — vraag het en het wordt erbij gebouwd.
Test