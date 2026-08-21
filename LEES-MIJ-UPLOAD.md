# Volledige stockbeheer-broncode

Dit is de volledige projectmap zoals ze nu draait op de laatste preview, inclusief alle wijzigingen van deze sessie.

## Wat zit erin

Alle bronbestanden. `node_modules/`, `.next/` en `.git/` zijn bewust NIET meegeleverd — die horen niet in GitHub (staan ook in `.gitignore`) en worden door Vercel zelf opgebouwd.

## Wijzigingen van deze sessie

**Dark/light theme**
- `src/app/globals.css` — kleuren omgezet naar `--theme-*` variabelen die wisselen via `data-theme` op de html-tag; lichte variant toegevoegd
- `src/app/layout.tsx` — inline script dat het thema instelt vóór de pagina rendert (voorkomt een flits van het verkeerde thema)
- `src/components/ThemeToggle.tsx` — nieuwe knop, onthoudt de keuze in localStorage en volgt bij eerste bezoek de systeeminstelling
- `src/app/page.tsx` — knop toegevoegd in de header naast de notificatieknop

**Labels-tab**
- `src/components/LabelsTab.tsx` — QR links / tekst rechts in de afdruklayout, vinkjes om meerdere labels tegelijk te printen (2 per rij, breken niet over pagina's), filterveld, selecteer-alles, en een knop "Exporteer voor Brother (CSV)"

## Uploaden naar GitHub

**Lokaal met git (aanbevolen):**
```bash
git clone https://github.com/GillesTechnics/Stockbeheer.git
cd Stockbeheer
# kopieer de inhoud van deze map hierover heen (behalve dit LEES-MIJ-bestand)
git add .
git commit -m "Dark/light theme toggle + labels: nieuwe layout, batch printen, Brother CSV-export"
git push
```

**Via de GitHub-website:**
Ga naar de repo → "Add file" → "Upload files" → sleep de bestanden erin. Let op dat de mapstructuur (`src/app/...`, `src/components/...`) behouden blijft; de website ondersteunt het slepen van hele mappen.

Zodra je naar `main` pusht, bouwt Vercel automatisch een nieuwe productieversie.

## Na het pushen

Controleer of het vaste domein `stockbeheer.vercel.app` terug aan de productie-deployment hangt. Het stond even niet meer in de domeinlijst van het project doordat er enkel preview-deploys gebeurd zijn. Als de link vanuit Notion niet werkt, kan je het domein in Vercel onder Settings → Domains terug aan het project koppelen.
