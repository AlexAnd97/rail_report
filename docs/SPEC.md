# SPEC.md — AI-driven Operativ Dagrapport för Kollektivtrafik

**Projekt:** Travel Report PoC  
**Måloperatörer:** UL (Upplandstrafiken), MTB (Mälardalstrafik)  
**Syfte:** Generera naturliga, beslutsstödande operatörsrapporter från trafikdata via Claude API

---

## 1. Problembeskrivning

Kollektivtrafikoperatörer hanterar dagligen stora mängder driftdata men saknar verktyg
som automatiskt omvandlar rådata till beslutsunderlag på naturlig svenska.
Nuvarande process kräver manuell analys och rapportskrivning — tidskrävande och inkonsekvent.

---

## 2. Produktvision

Systemet ska automatiskt hämta, validera och analysera trafikdata för valfri linje och
tidsperiod, och leverera en läsbar operatörsrapport med KPI:er, insikter och konfidensgrad.

**Exempel på förväntad AI-output:**
> "Linje 801 hade en utmanande tisdag med 23% fler förseningar än genomsnittet för veckan.
> De flesta avvikelserna koncentrerades till morgonrusningen 07:00–09:00, troligen relaterat
> till ökad beläggning (74%). Tre avgångar ställdes in mellan 08:15–09:00."

---

## 3. Icke-mål (v1)

- Ingen realtidsövervakning — systemet analyserar historisk/mock-data
- Ingen autentisering eller användarhantering
- Ingen push-notifiering eller schemalagd rapportgenerering
- Ingen GTFS-integration (se avsnitt 10 för roadmap)
- Inget stöd för flera operatörer parallellt i samma session

---

## 4. User Stories med Acceptanskriterier

### US-01: Välj linje och tidsperiod
**Som** operatör  
**Vill jag** välja en specifik linje och tidsperiod (dag/vecka/anpassad)  
**För att** få en rapport för exakt den driftdata jag är intresserad av

**Acceptanskriterier:**
- Dropdown med tillgängliga linjer (minst 5 Uppsala-linjer i mock-data)
- Tre förinställda perioder: Igår, Föregående vecka (default), Anpassad
- Anpassad period: datumväljare för start och slut, max 31 dagar
- Rapport genereras inom 10 sekunder från anrop

### US-02: KPI-kort med delta
**Som** operatör  
**Vill jag** se nyckeltal med jämförelse mot föregående period  
**För att** snabbt förstå om driften försämrats eller förbättrats

**Acceptanskriterier:**
- Fyra kort visas alltid: Avgångar, Förseningar (%), Inställda, Beläggning (%)
- Varje kort visar delta mot föregående period med pil (↑ röd / ↓ grön för negativa KPI:er)
- Delta visas som procentenheter, ej relativ förändring
- Kort med otillräcklig data visas med grå färg och texten "Otillräcklig data"

### US-03: AI-genererad narrativ rapport
**Som** operatör  
**Vill jag** läsa en kortfattad professionell rapport på svenska  
**För att** snabbt förstå vad som hände utan att tolka siffror själv

**Acceptanskriterier:**
- Rapporten är 100–300 ord
- Språket är neutralt, professionellt och på svenska
- Rapporten nämner konkreta tidpunkter och linjenummer
- Rapporten reflekterar konfidensgraden om den är Medium eller Låg
- Rapporten innehåller aldrig information som inte finns i den validerade datan

### US-04: Automatiska insikter med badge
**Som** operatör  
**Vill jag** se flaggade insikter med allvarlighetsnivå  
**För att** direkt se vad som kräver åtgärd

**Acceptanskriterier:**
- Insikter genereras av systemet (ej av AI) baserat på regler i valideringslagret
- Tre badge-typer: `Varning` (röd), `Info` (blå), `OK` (grön)
- `Varning` triggas av: förseningar >20% av avgångarna, inställda >5%, beläggning >85%
- `Info` triggas av: förseningar 10–20%, beläggning 70–85%, datakvalitet Medium
- `OK` visas när inga Varning eller Info-regler triggas
- Max 5 insikter visas, sorterade efter allvarlighetsgrad

### US-05: Rådata-tabell
**Som** operatör  
**Vill jag** se den underliggande datan som rapporten baseras på  
**För att** kunna verifiera AI:ns påståenden

**Acceptanskriterier:**
- Tabell visar aggregerad data per timme (dagvy) eller per dag (veckovis/månadsvis)
- Kolumner: Period, Planerade avgångar, Faktiska avgångar, Försenade (%), Inställda, Beläggning (%), Konfidensgrad
- Rader med låg konfidensgrad markeras visuellt (gul bakgrund)
- Tabellen är sorterad kronologiskt

### US-06: Konfidensgrad
**Som** operatör  
**Vill jag** se hur tillförlitlig rapporten är  
**För att** veta hur mycket jag kan lita på slutsatserna

**Acceptanskriterier:**
- Konfidensgrad visas som `Hög`, `Medium` eller `Låg` med förklaring
- Exempel: "Medium — data saknas för 2 av 7 dagar"
- Om konfidensgrad är `Låg` visas en banner: "Rapporten baseras på ofullständig data. Tolka med försiktighet."
- Konfidensgrad beräknas enligt regler i DATA_QUALITY.md

---

## 5. Systemarkitektur

```
[React Frontend]
      │
      │ HTTP/REST
      ▼
[Express API]
      │
      ├──► [TrafiklabClient interface]
      │         │
      │         └──► [MockTrafiklabClient] (PoC)
      │         └──► [ResRobotClient]      (produktion, samma interface)
      │
      ├──► [ValidationService]  ← all data passerar här
      │
      ├──► [ReportService]      ← bygger prompt, anropar Claude
      │
      └──► [SQLite logger]      ← sparar audit trail
```

Valideringslagret är ett hårt krav — data når aldrig `ReportService` utan att ha
passerat `ValidationService`. Se DATA_QUALITY.md för regler.

---

## 6. Tech Stack

| Lager | Val | Motivering |
|---|---|---|
| Backend runtime | Node.js + TypeScript | Typsäkerhet, stort ekosystem |
| API-ramverk | Express | Minimal overhead för PoC |
| Frontend | React + TypeScript + Vite | Standard för dataintensiva dashboards |
| AI | Claude API (`claude-sonnet-4-20250514`) | Lång kontext, svenska, temperature: 0 |
| Datakälla | ResRobot v2.1 (mock i PoC) | REST, enkel integration, dokumenterat |
| Loggning | SQLite via `better-sqlite3` | Enkel setup, audit trail, ingen server |
| Testning | Vitest | Native TypeScript-stöd, snabb |

**temperature: 0 på alla Claude-anrop** — reproducerbarhet och konsistenta rapporter.

---

## 7. Rapportens granularitet

Rapporten anpassar sin tidsgranularitet efter vald period:

| Vald period | Granularitet i data | Granularitet i rapport |
|---|---|---|
| 1 dag | Timvis | Timblock (morgon/dag/kväll) |
| 2–7 dagar | Dagvis | Per dag |
| 8–31 dagar | Veckovis | Per vecka |

---

## 8. Mock-data — Uppsala-linjer

Mock-klienten ska innehålla realistisk data för följande linjer:

| Linje | Sträcka | Typ |
|---|---|---|
| 1 | Uppsala C – Gottsunda | Stadsbuss |
| 2 | Uppsala C – Eriksberg | Stadsbuss |
| 3 | Uppsala C – Stenhagen | Stadsbuss |
| 801 | Uppsala – Enköping | Regionbuss |
| 802 | Uppsala – Tierp | Regionbuss |
| 870 | Uppsala – Arlanda | Flygbussliknande |

Mock-data ska täcka **14 dagars historik** med realistisk variation:
- Vardagar: fler avgångar, högre beläggning under rusningstid (07–09, 16–18)
- Helger: färre avgångar, jämnare beläggning
- Slumpmässiga men realistiska avvikelser (förseningar, inställda)
- Minst ett scenario med låg datakvalitet (saknade värden för en dag)
- Minst ett scenario med hög beläggning som triggar Varning

---

## 9. API-endpoints (översikt)

Fullständiga in/ut-format definieras i `API_CONTRACTS.md`.

| Metod | Endpoint | Beskrivning |
|---|---|---|
| GET | `/api/lines` | Lista tillgängliga linjer |
| GET | `/api/raw-data` | Hämta validerad rådata för linje + period |
| POST | `/api/report` | Generera AI-rapport för linje + period |
| GET | `/api/health` | Health check |

---

## 10. Roadmap — Nästa steg efter PoC

- **GTFS-integration:** Ersätt ResRobot med GTFS-RT för historisk djupdata.
  GTFS ger resedata på stoppnivå vilket möjliggör mer granulära rapporter.
  `TrafiklabClient`-interfacet är designat för att göra bytet enkelt.
- **Autentisering:** Operatörsspecifika vyer via JWT
- **Schemalagda rapporter:** Cronjob som genererar och e-postar dagrapport
- **Fler operatörer:** MTB-specifika linjer och regional konfiguration
