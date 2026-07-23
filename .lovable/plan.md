# Content-Review — Findings & Fix-Plan

Ergebnis eines Cross-Reads über `ChatView.tsx`, `Overview.tsx`, `i18n/{de,en,fr}.ts`, `consultantProfiles.ts` und `SiteChrome.tsx`. Die Site-Journey (Menü → Sections → AI Lab) ist strukturell stimmig, aber es gibt konkrete Inkonsistenzen — sichtbar vor allem für DE/FR-Besucher.

## Must-fix (echte Brüche in der Nutzererfahrung)

1. **Toter i18n-Block `byWhom`** — `src/i18n/de.ts:5,107-113`, `en.ts:5,107-113`, `fr.ts:5,107-113`. Die `/by-whom`-Seite wurde entfernt, aber `nav.byWhom` und der komplette `byWhom: {...}`-Content-Block existieren in allen drei Sprachdateien ohne einen einzigen Verweis im restlichen Code.
   → **Fix:** Beide Blöcke in DE/EN/FR löschen.

2. **AI-Lab-Kacheltitel sind hartkodiertes Englisch** — `ChatView.tsx:963,970,977,993,1000,1052,1055`. "DORA Incident Check", "TISAX Assessment Check", "PCI-DSS SAQ Navigator", "NIS-2 Awareness Quiz", "CISO Budget Simulator" sind Literals, während alle Nachbar-Kacheln (`agentTtxTitle`, `agentSocLifeTitle` …) durch `t()` gehen. DE/FR-Besucher sehen ein sprachlich gemischtes Grid.
   → **Fix:** i18n-Keys ergänzen (`agentDoraTitle`, `agentTisaxTitle`, `agentPciTitle`, `agentNis2Title`, `agentCisoTitle`) und in `ChatView.tsx` einsetzen. Produktnamen "Auren" / "DJ Robo never sleeps" bleiben bewusst unübersetzt.

3. **`otSocLife`-Namespace verwaist** — `en.ts:1451+` hat vollen Content, `de.ts:1531` und `fr.ts:1449` sind `otSocLife: {} as never`. `OtSocLife.tsx` ruft diesen Namespace nirgends via `t()` auf (Content läuft dort englisch-fixiert über `useVariantT`).
   → **Fix:** Kompletten `otSocLife`-Block aus allen drei Locales entfernen (dead code).

4. **Fehlende Akzente im französischen DORA-Block** — `fr.ts:1061,1064,1067,1075,1078,1082`: "Conformite DORA", "Evaluation de conformite", "Priorite", "entites financieres". Der NIS-2-Block direkt daneben (`fr.ts:1140-1164`) schreibt korrekt "Conformité", "Évaluation", "Priorité".
   → **Fix:** Akzente konsistent nachziehen.

## Polish (Feinschliff, kein Bruch)

5. **Consultant-Sektionslabels hartkodiert Deutsch** — `consultantProfiles.ts:12-15,19,26,33,43,58-61`: "Schwerpunkte / Erfahrung / Zertifizierungen / Sprachen" haben keine `{de,en,fr}`-Variante. Auf EN/FR-UI erscheinen die Überschriften weiterhin deutsch. Bios sind zusätzlich englisch-only.
   → **Fix (klein):** Labels über i18n-Keys ziehen. Bios: entweder trilingual pflegen oder bewusst als EN-Signature-Line dokumentieren. Empfehlung: nur Labels lokalisieren, Bios bleiben EN (kürzer, konsistenter Feinschliff).

6. **Dead import in `ChatView.tsx:10`** — `consultantProfiles` wird importiert, aber im 2484-Zeilen-File nie verwendet (Anzeige läuft über `SiteChrome.tsx:150-151`).
   → **Fix:** Import entfernen.

7. **Kontakt-Sektion zeigt nur Marcel** — `ChatView.tsx:1253-1266` listet Telefon/E-Mail nur für Marcel. Hero-Byline (`en.ts:724-725`) präsentiert aber "Marcel Knop and Andreas Funder" als Team.
   → **Entscheidung nötig:** Absicht (single point of contact) oder Lücke (Andreas ergänzen)? Siehe Frage unten.

8. **Kennzahlen-Divergenz "270+ Kunden" vs. "400+ Projekte"** — `ChatView.tsx:1247` vs. `Overview.tsx:334,337,856,859`. Beide Zahlen können stimmen, aber ohne Cross-Reference wirkt es widersprüchlich.
   → **Fix (Vorschlag):** Vereinheitlichen zu "270+ Kunden · 400+ Projekte" (oder umgekehrt) auf beiden Seiten.

## Reihenfolge der Umsetzung

1. i18n-Aufräumen: `byWhom` + `otSocLife`-Blöcke löschen (DE/EN/FR).
2. Neue i18n-Keys für AI-Lab-Titel anlegen (DE/EN/FR) und in `ChatView.tsx` einsetzen.
3. Französische DORA-Akzente korrigieren.
4. `consultantProfiles`-Import in `ChatView.tsx` entfernen.
5. Consultant-Sektionslabels über i18n ziehen.
6. Kennzahlen vereinheitlichen ("270+ Kunden · 400+ Projekte").
7. Nur nach Freigabe: Kontakt-Sektion um Andreas ergänzen.

## Offene Frage vor Umsetzung

- **Kontakt-Sektion (Finding #7):** Andreas Funder als zweiter Kontakt sichtbar machen (Telefon/E-Mail), oder Marcel als Single-Point-of-Contact belassen und die Hero-Byline entsprechend abschwächen?
- **Kennzahlen (Finding #8):** Welche Zahl ist die "führende" (270 Kunden oder 400 Projekte), oder beide kombiniert ausweisen?
