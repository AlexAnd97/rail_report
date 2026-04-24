# DATA_QUALITY.md — Valideringslager och Konfidensgradering

Valideringslagret är ett hårt arkitekturellt krav.
Ingen data får nå `ReportService` eller Claude utan att ha passerat `ValidationService`.

---

## 1. Principer

1. **Fail explicit** — validering kastar aldrig tyst. Varje avvisad post loggas med orsak.
2. **Bevara rådata** — validering muterar aldrig inkommande data. En ny `ValidatedRecord` skapas.
3. **Konfidenspoäng ackumuleras** — varje valideringsregel som triggar sänker totalpoängen.
4. **AI ser bara sanerad data** — fritext-fält rensas från potentiellt injicerbar text innan de
   når prompten. Se avsnitt 6.

---

## 2. Datastruktur — in och ut

### Input (rådata från TrafiklabClient)
```typescript
interface RawDeparture {
  departureId: string
  lineId: string
  scheduledTime: string        // ISO 8601
  actualTime: string | null    // null om ej rapporterad
  cancelled: boolean
  occupancyPercent: number | null
  stopId: string
  destination: string
}
```

### Output (validerad data)
```typescript
interface ValidatedDeparture {
  departureId: string
  lineId: string
  scheduledTime: Date
  actualTime: Date | null
  delayMinutes: number | null  // null om actualTime saknas
  cancelled: boolean
  occupancyPercent: number | null
  stopId: string
  destination: string          // sanerad (se avsnitt 6)
  validationFlags: ValidationFlag[]
  confidenceScore: number      // 0.0–1.0
}

interface ValidationFlag {
  code: ValidationCode
  severity: 'error' | 'warning' | 'info'
  message: string
}
```

---

## 3. Valideringsregler

Varje regel har ett ID, en trigger och en effekt på konfidenspoäng.

### VR-01: Saknad actualTime
**Trigger:** `actualTime === null` och `cancelled === false`  
**Severity:** warning  
**Konfidenseffekt:** −0.05 per post  
**Åtgärd:** `delayMinutes` sätts till `null`. Posten inkluderas men markeras.

### VR-02: Omöjlig tidsstämpel — ankomst före avgång
**Trigger:** `actualTime < scheduledTime − 10 minuter`  
**Kommentar:** Mer än 10 min tidig avgång är troligen ett dataproblem, inte tidig avgång.  
**Severity:** error  
**Konfidenseffekt:** −0.15 per post  
**Åtgärd:** Posten exkluderas från beräkningar. Räknas ej som avgång.

### VR-03: Framtida tidsstämpel
**Trigger:** `scheduledTime > now()`  
**Severity:** error  
**Konfidenseffekt:** −0.20 per post  
**Åtgärd:** Posten exkluderas helt.

### VR-04: Duplikat
**Trigger:** Samma `lineId` + `scheduledTime` + `stopId` förekommer mer än en gång  
**Severity:** warning  
**Konfidenseffekt:** −0.05 per duplikat-grupp  
**Åtgärd:** Behåll posten med lägst `departureId` (lexikografiskt). Övriga exkluderas.

### VR-05: Extrem försening
**Trigger:** `delayMinutes > 120`  
**Severity:** warning  
**Kommentar:** Förseningar >2h är troligen dataproblem (t.ex. fel dag på actualTime).  
**Konfidenseffekt:** −0.10 per post  
**Åtgärd:** Posten markeras. Inkluderas i beräkningar men flaggas i rapporten.

### VR-06: Ogiltig beläggning
**Trigger:** `occupancyPercent < 0` eller `occupancyPercent > 100`  
**Severity:** error  
**Konfidenseffekt:** −0.10 per post  
**Åtgärd:** `occupancyPercent` sätts till `null`. Posten inkluderas utan beläggningsdata.

### VR-07: Saknad beläggning
**Trigger:** `occupancyPercent === null`  
**Severity:** info  
**Konfidenseffekt:** −0.02 per post  
**Åtgärd:** Beläggning exkluderas från aggregat för den posten. Noteras i konfidensförklaring.

### VR-08: Datahål — saknad tidsperiod
**Trigger:** Inga poster finns för en timme (dagvy) eller dag (veckovis) under operationell tid (05:00–23:00)  
**Severity:** warning  
**Konfidenseffekt:** −0.15 per saknad tidsenhet  
**Åtgärd:** Hålet noteras i `ValidationSummary`. Rapporten ska nämna datahålet.

### VR-09: Ogiltig destination (fritext)
**Trigger:** `destination` innehåller tecken utanför `[a-zA-ZåäöÅÄÖ0-9\s\-\(\)]` eller är längre än 100 tecken  
**Severity:** info  
**Konfidenseffekt:** 0 (säkerhetsregel, inte datakvalitet)  
**Åtgärd:** `destination` saneras enligt regler i avsnitt 6.

---

## 4. Konfidenspoäng — beräkning

### Algoritm

```
baseScore = 1.0
for each departure in raw_data:
    for each VR-rule triggered:
        baseScore += rule.confidenceEffect   // effekterna är negativa
        
// Justera för täckning (andel tidsenheter med data)
coverageRatio = timsenheter_med_data / förväntade_timsenheter
baseScore *= coverageRatio

finalScore = clamp(baseScore, 0.0, 1.0)
```

### Kategoritröskar

| Poäng | Kategori | Visas för användaren |
|---|---|---|
| 0.80 – 1.00 | Hög | "Hög — data är komplett och konsistent" |
| 0.50 – 0.79 | Medium | "Medium — [specifik orsak]" |
| 0.00 – 0.49 | Låg | "Låg — [specifik orsak]" |

### Konfidensförklaring — regler för specifik orsak

Förklaringen ska alltid vara specifik. Generera den enligt prioritetsordning:

1. Om datahål finns (VR-08): `"data saknas för X av Y dagar/timmar"`
2. Annars om VR-02/VR-03 triggas många: `"X poster hade omöjliga tidsstämplar"`
3. Annars om VR-07 täcker >30% av poster: `"beläggningsdata saknas för X% av avgångarna"`
4. Annars om VR-01 täcker >20%: `"faktisk avgångstid saknas för X% av posterna"`

---

## 5. ValidationSummary — vad ReportService tar emot

`ReportService` tar aldrig emot rådata direkt. Den tar emot ett `ValidatedDataset`:

```typescript
interface ValidatedDataset {
  lineId: string
  period: { start: Date; end: Date }
  granularity: 'hourly' | 'daily' | 'weekly'
  records: ValidatedDeparture[]
  summary: {
    totalScheduled: number
    totalActual: number
    totalCancelled: number
    avgDelayMinutes: number | null
    avgOccupancyPercent: number | null
    confidenceScore: number
    confidenceCategory: 'Hög' | 'Medium' | 'Låg'
    confidenceExplanation: string
    dataGaps: DataGap[]           // saknade tidsperioder
    flaggedAnomalies: number      // antal poster med severity 'error' eller 'warning'
  }
  aggregatedByPeriod: AggregatedPeriod[]  // per timme/dag/vecka beroende på granularitet
}

interface AggregatedPeriod {
  periodStart: Date
  periodEnd: Date
  scheduled: number
  actual: number
  cancelled: number
  delayedPercent: number | null
  avgOccupancyPercent: number | null
  confidenceScore: number         // för denna specifika period
}
```

---

## 6. Datasanering för AI-input

Dessa regler tillämpas på alla fält som kan innehålla fritext och som inkluderas i prompten.

### SR-01: Destination-fält
- Ta bort alla tecken utanför `[a-zA-ZåäöÅÄÖ0-9\s\-\(\)]`
- Trunkera till max 100 tecken
- Konvertera till Title Case

### SR-02: Numeriska fält
- Avrunda till max 1 decimal i prompten
- Procent visas utan decimaler (23%, inte 23.4%)

### SR-03: Inga råa felmeddelanden i prompt
- Felmeddelanden från Trafiklab-klienten får aldrig inkluderas ordagrant i prompten
- Systemet ska istället beskriva felet generiskt: "data saknas för denna period"

### SR-04: Maxlängd på aggregerad data i prompt
- Om `aggregatedByPeriod` innehåller fler än 30 perioder, inkludera bara de 10 perioder
  med flest avvikelser samt ett aggregerat medelvärde för resten
- Detta förhindrar att prompten växer okontrollerat för långa perioder

---

## 7. Fallback-beteende

| Scenario | Beteende |
|---|---|
| Alla poster för en period exkluderas | Returnera `ValidatedDataset` med tomma `records`, konfidensgrad Låg, förklaring "Ingen giltig data hittades för perioden" |
| <10 poster för vald period | Generera rapport men flagga: "Baseras på begränsat dataunderlag (X avgångar)" |
| Konfidensgrad Låg | Lägg till disclaimer i rapporten: "Rapporten baseras på ofullständig data. Tolka med försiktighet." |
| Alla beläggningsvärden saknas | Exkludera beläggning helt från rapport och KPI-kort — visa inte "0%" |
