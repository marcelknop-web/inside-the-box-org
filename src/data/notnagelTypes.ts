// Notnagel – Datenmodell, Ableitungslogik und Qualitätsprüfung
// Alle Kennzahlen werden regelbasiert aus den Nutzereingaben abgeleitet.
// Die KI formuliert ausschließlich Prosa, sie erfindet keine Zahlen.

export const HORIZONS = ["4 Std.", "24 Std.", "3 Tage", "1 Woche"] as const;
export type Horizon = (typeof HORIZONS)[number];

export const HORIZON_HOURS: Record<Horizon, number> = {
  "4 Std.": 4,
  "24 Std.": 24,
  "3 Tage": 72,
  "1 Woche": 168,
};

export const DAMAGE_CATEGORIES = [
  { key: "finanziell", label: "Finanziell (Umsatz, Vertragsstrafen, Folgekosten)" },
  { key: "kunden", label: "Vertraglich / Kunden (SLA, Liefer­zusagen)" },
  { key: "reputation", label: "Reputation (Öffentlichkeit, Vertrauen)" },
  { key: "regulatorisch", label: "Regulatorisch (Aufsicht, Meldepflichten)" },
  { key: "sicherheit", label: "Sicherheit von Personen und Anlagen" },
] as const;
export type DamageCategoryKey = (typeof DAMAGE_CATEGORIES)[number]["key"];

/**
 * Schadensstufen der BIA. Bewusst mit Code S1–S4 geführt, damit sie nie mit den
 * Aktivierungsstufen A1–A3 des Notfallplans verwechselt werden.
 */
export const SCALE = [
  { level: 1, code: "S1", name: "gering", hint: "Kaum spürbar, intern abfangbar, keine Außenwirkung." },
  { level: 2, code: "S2", name: "spürbar", hint: "Erste Beschwerden, einzelne SLA-Verletzungen, Zusatzaufwand." },
  { level: 3, code: "S3", name: "erheblich", hint: "Vertragsstrafen, Eskalation durch Kunden oder Aufsicht, Medienthema." },
  { level: 4, code: "S4", name: "existenzbedrohend", hint: "Kündigung von Rahmenverträgen, regulatorische Folgen, Gefahr für Personen." },
] as const;


export type Criticality = "hoch" | "mittel" | "niedrig";

export interface ResourceEntry {
  kind: "IT-Anwendungen" | "Daten" | "Personal" | "Standorte" | "Dienstleister" | "Sonstiges";
  description: string;
  criticality: Criticality;
  singlePointOfFailure: boolean;
}

export interface WorkaroundEntry {
  scenario: string;
  procedure: string;
  limitHours: string; // wie lange trägt der Notbehelf
}

export interface ProcessEntry {
  id: string;
  name: string;
  description: string;
  operatingHours: string;
  recipients: string;
  /** Schadensverlauf: category -> horizon -> 1..4 */
  matrix: Record<DamageCategoryKey, Record<Horizon, number>>;
  rtoHours: string;
  rpoHours: string;
  minimumService: string;
  resources: ResourceEntry[];
  workarounds: WorkaroundEntry[];
}

export interface TeamRole {
  role: string;
  primary: string;
  deputy: string;
}

export interface AreaProfile {
  organisation: string;
  area: string;
  owner: string; // Fachbereichsverantwortlicher
  ownerFunction: string;
  coordinator: string;
  sites: string;
  sector: string;
  regulatory: string[]; // ISO 22301, BSI 200-4, NIS-2, DORA, KRITIS, ISO 27001
  particularities: string;
  alarmChannel: string;
  crisisTeamRef: string;
}

export interface ExerciseParams {
  duration: "90 Min." | "2,5 Std." | "4 Std.";
  injectCount: number;
  scenario: string;
  participants: string;
  facilitator: string;
  level: "Einsteiger" | "Geübtes Team" | "Erfahrenes Team";
}

export interface NotnagelInput {
  profile: AreaProfile;
  processes: ProcessEntry[];
  team: TeamRole[];
  exercise: ExerciseParams;
}

/** KI-Ergebnis: ausschließlich Prosa und Strukturtexte, keine neuen Kennzahlen. */
export interface GeneratedContent {
  leitlinie: {
    zweck: string;
    zielsetzung: string[];
    geltungsbereich: string;
    rahmen: { rahmenwerk: string; relevanz: string }[];
    grundsaetze: { titel: string; text: string }[];
    rollen: { rolle: string; verantwortung: string }[];
    lebenszyklus: { schritt: string; mindestanforderung: string }[];
    kennzahlen: string[];
  };
  bia: {
    processId: string;
    interpretation: string;
    mtpdBegruendung: string;
    rtoBegruendung: string;
    rpoBegruendung: string;
    ergebnis: string;
    handlungsbedarf: string[];
  }[];
  bcp: {
    zweck: string;
    aktivierung: { stufe: string; kriterium: string; reaktion: string }[];
    alarmierung: string;
    sofortmassnahmen: string[];
    notbetriebHinweis: string;
    wiederanlauf: string[];
    schnittstellen: string[];
  };
  tabletop: {
    lernziele: string[];
    spielregeln: string[];
    ausgangslage: string;
    injects: { zeit: string; inject: string; erwarteteReaktion: string }[];
    hotwashFragen: string[];
    beobachtungskriterien: string[];
    nachbereitung: string[];
  };
  managementSummary: string;
}

// ─── Defaults / Demo ───

export function emptyMatrix(): Record<DamageCategoryKey, Record<Horizon, number>> {
  const m = {} as Record<DamageCategoryKey, Record<Horizon, number>>;
  for (const c of DAMAGE_CATEGORIES) {
    m[c.key] = { "4 Std.": 1, "24 Std.": 1, "3 Tage": 1, "1 Woche": 1 };
  }
  return m;
}

let seq = 0;
export function newProcess(name = ""): ProcessEntry {
  seq += 1;
  return {
    id: `P-${String(seq).padStart(2, "0")}`,
    name,
    description: "",
    operatingHours: "Mo–Fr 08:00–18:00",
    recipients: "",
    matrix: emptyMatrix(),
    rtoHours: "",
    rpoHours: "",
    minimumService: "",
    resources: [],
    workarounds: [],
  };
}

export const DEFAULT_PROFILE: AreaProfile = {
  organisation: "",
  area: "",
  owner: "",
  ownerFunction: "",
  coordinator: "",
  sites: "",
  sector: "",
  regulatory: ["ISO 22301", "BSI-Standard 200-4"],
  particularities: "",
  alarmChannel: "Telefonische Rufkette, Rückmeldung innerhalb 15 Minuten",
  crisisTeamRef: "Krisenstab gemäß Krisenmanagement-Handbuch",
};

export const DEFAULT_TEAM: TeamRole[] = [
  { role: "Notfallleiter", primary: "", deputy: "" },
  { role: "Koordinator Betrieb", primary: "", deputy: "" },
  { role: "Koordinator IT", primary: "", deputy: "" },
  { role: "Kommunikation", primary: "", deputy: "" },
  { role: "Protokollführung", primary: "", deputy: "" },
];

export const DEFAULT_EXERCISE: ExerciseParams = {
  duration: "2,5 Std.",
  injectCount: 6,
  scenario: "Ransomware: Kernanwendung des Bereichs nicht verfügbar, Wiederanlauf unklar",
  participants: "Notfallteam des Bereichs, BC-Koordinator, Vertretung IT-Security",
  facilitator: "",
  level: "Einsteiger",
};

export const DEMO_SCENARIOS: { label: string; hint: string; build: () => NotnagelInput }[] = [
  {
    label: "Kundenservice / Auftragsannahme",
    hint: "Dienstleister, Mo–Fr, telefonische Auftragsannahme",
    build: () => {
      const p = newProcess("Auftragsannahme und Kundenservice");
      p.description =
        "Annahme, Prüfung und Einsteuerung von Kundenaufträgen über Telefon, E-Mail und Kundenportal. Zugesagte Rückmeldung innerhalb eines Arbeitstages.";
      p.recipients = "Externe Kunden (Industrie), interner Vertrieb, Logistik";
      p.operatingHours = "Mo–Fr 07:00–19:00";
      p.matrix.finanziell = { "4 Std.": 1, "24 Std.": 2, "3 Tage": 3, "1 Woche": 4 };
      p.matrix.kunden = { "4 Std.": 1, "24 Std.": 3, "3 Tage": 3, "1 Woche": 4 };
      p.matrix.reputation = { "4 Std.": 1, "24 Std.": 2, "3 Tage": 3, "1 Woche": 4 };
      p.matrix.regulatorisch = { "4 Std.": 1, "24 Std.": 1, "3 Tage": 2, "1 Woche": 2 };
      p.matrix.sicherheit = { "4 Std.": 1, "24 Std.": 1, "3 Tage": 1, "1 Woche": 2 };
      p.rtoHours = "8";
      p.rpoHours = "4";
      p.minimumService =
        "Annahme der Aufträge der 20 wichtigsten Kunden über Papierformular und Sammelpostfach, Einsteuerung nachgelagert";
      p.resources = [
        { kind: "IT-Anwendungen", description: "CRM und Auftragssystem, Telefonanlage, Kundenportal", criticality: "hoch", singlePointOfFailure: false },
        { kind: "Daten", description: "Kundenstammdaten, offene Auftragsliste des Vortags", criticality: "hoch", singlePointOfFailure: false },
        { kind: "Personal", description: "Mindestens 4 Sachbearbeiter je Schicht, Sonderfreigaben nur bei 2 Personen", criticality: "hoch", singlePointOfFailure: true },
        { kind: "Standorte", description: "Büro Standort A, Ausweichfähigkeit über mobiles Arbeiten", criticality: "mittel", singlePointOfFailure: false },
        { kind: "Dienstleister", description: "Telefonie-Provider, Hoster des Kundenportals", criticality: "hoch", singlePointOfFailure: false },
      ];
      p.workarounds = [
        { scenario: "Auftragssystem nicht verfügbar", procedure: "Erfassung auf Papierformular, Priorisierung nach Kundenliste, Nacherfassung nach Wiederanlauf", limitHours: "24" },
        { scenario: "Telefonanlage ausgefallen", procedure: "Umleitung auf Mobiltelefone der Teamleitung, Hinweis auf Website und im Kundenportal", limitHours: "48" },
        { scenario: "Personalausfall über 50 Prozent", procedure: "Rückgriff auf geschulte Vertretungen aus dem Innendienst, Beschränkung auf A-Kunden", limitHours: "72" },
      ];
      return {
        profile: {
          ...DEFAULT_PROFILE,
          organisation: "Muster Industrieservice GmbH",
          area: "Customer Operations",
          owner: "[Name]",
          ownerFunction: "Leitung Customer Operations",
          coordinator: "[Name], BC-Koordinator",
          sites: "Standort A (Hauptsitz), Standort B (Backoffice)",
          sector: "Industrieservice / B2B-Dienstleistung",
          regulatory: ["ISO 22301", "BSI-Standard 200-4", "ISO/IEC 27001"],
          particularities: "Ein Teil der Kunden sind KRITIS-Betreiber und geben Resilienzanforderungen vertraglich weiter.",
        },
        processes: [p],
        team: DEFAULT_TEAM.map((t) => ({ ...t, primary: "[Name]", deputy: "[Name]" })),
        exercise: { ...DEFAULT_EXERCISE, facilitator: "[Name] (Moderation), [Name] (Protokoll)" },
      };
    },
  },
  {
    label: "Produktion / Werk",
    hint: "Zweischichtbetrieb, Fertigung mit Liefertermin­zusagen",
    build: () => {
      const p = newProcess("Fertigung und Versand Baugruppen");
      p.description =
        "Montage und Versand von Baugruppen im Zweischichtbetrieb. Feste Liefertermine mit Vertragsstrafen bei Verzug.";
      p.recipients = "OEM-Kunden, Ersatzteilgeschäft";
      p.operatingHours = "Mo–Sa, 2 Schichten (06:00–22:00)";
      p.matrix.finanziell = { "4 Std.": 2, "24 Std.": 3, "3 Tage": 4, "1 Woche": 4 };
      p.matrix.kunden = { "4 Std.": 1, "24 Std.": 3, "3 Tage": 4, "1 Woche": 4 };
      p.matrix.reputation = { "4 Std.": 1, "24 Std.": 2, "3 Tage": 3, "1 Woche": 4 };
      p.matrix.regulatorisch = { "4 Std.": 1, "24 Std.": 1, "3 Tage": 2, "1 Woche": 2 };
      p.matrix.sicherheit = { "4 Std.": 2, "24 Std.": 2, "3 Tage": 2, "1 Woche": 3 };
      p.rtoHours = "8";
      p.rpoHours = "8";
      p.minimumService = "Fertigung der zwei termincheckkritischen Linien mit manueller Auftragssteuerung und Papierlaufkarten";
      p.resources = [
        { kind: "IT-Anwendungen", description: "ERP (Fertigungsaufträge), MES-Linienserver, Versandetikettierung", criticality: "hoch", singlePointOfFailure: false },
        { kind: "Daten", description: "Arbeitspläne, Chargen- und Rückverfolgbarkeitsdaten", criticality: "hoch", singlePointOfFailure: false },
        { kind: "Personal", description: "Schichtführer mit Freigabeberechtigung, Rüsten Linie 3 nur durch 2 Personen", criticality: "hoch", singlePointOfFailure: true },
        { kind: "Standorte", description: "Werk 1, Hallen A und B; keine Ausweichfertigung im Konzern", criticality: "hoch", singlePointOfFailure: true },
        { kind: "Dienstleister", description: "Spedition, Instandhaltung Automatisierungstechnik", criticality: "mittel", singlePointOfFailure: false },
      ];
      p.workarounds = [
        { scenario: "ERP nicht verfügbar", procedure: "Fertigung nach ausgedruckter Tagesliste und Papierlaufkarten, Rückmeldung nachgelagert", limitHours: "24" },
        { scenario: "MES-Linienserver ausgefallen", procedure: "Manuelle Linienfahrt mit reduzierter Taktzahl, Qualitätsdaten auf Formblatt", limitHours: "48" },
        { scenario: "Halle A nicht nutzbar", procedure: "Verlagerung der Linien 1 und 2 in Halle B mit halber Kapazität", limitHours: "168" },
      ];
      return {
        profile: {
          ...DEFAULT_PROFILE,
          organisation: "Muster Antriebstechnik AG",
          area: "Operations Werk 1",
          owner: "[Name]",
          ownerFunction: "Werkleitung",
          coordinator: "[Name], BC-Koordinator Operations",
          sites: "Werk 1 (Hallen A, B), Außenlager C",
          sector: "Fertigende Industrie",
          regulatory: ["ISO 22301", "BSI-Standard 200-4", "NIS-2 / nationale Umsetzung"],
          particularities: "Just-in-Sequence-Lieferungen an zwei OEM, Vertragsstrafen ab 24 Stunden Verzug.",
        },
        processes: [p],
        team: DEFAULT_TEAM.map((t) => ({ ...t, primary: "[Name]", deputy: "[Name]" })),
        exercise: {
          ...DEFAULT_EXERCISE,
          scenario: "Ausfall der Leitsysteme im Werk nach Cyberangriff, Netzsegmente vorsorglich getrennt",
          facilitator: "[Name] (Moderation), [Name] (Protokoll)",
        },
      };
    },
  },
];

// ─── Regelbasierte Ableitungen ───

/** Höchster Schadenswert je Zeithorizont über alle Kategorien. */
export function maxByHorizon(p: ProcessEntry): Record<Horizon, number> {
  const out = {} as Record<Horizon, number>;
  for (const h of HORIZONS) {
    out[h] = Math.max(...DAMAGE_CATEGORIES.map((c) => p.matrix[c.key][h] || 1));
  }
  return out;
}

/**
 * MTPD = erster Zeithorizont, an dem eine Schadenskategorie die Schadensstufe S3
 * (erheblich) erreicht. Dieser Horizont ist die Obergrenze: ab hier ist der Ausfall
 * nicht mehr tolerierbar. Es gibt genau eine MTPD je Prozess.
 */
export function deriveMtpd(p: ProcessEntry): { horizon: Horizon | null; hours: number | null } {
  const m = maxByHorizon(p);
  for (const h of HORIZONS) {
    if (m[h] >= 3) return { horizon: h, hours: HORIZON_HOURS[h] };
  }
  return { horizon: null, hours: null };
}

/** Vollständige Bewertungsmatrix als Text – eine Zeile je Kategorie, damit die KI nichts nachrechnet. */
export function curveDetail(p: ProcessEntry): string {
  return DAMAGE_CATEGORIES.map(
    (c) => `${c.label}: ${HORIZONS.map((h) => `${h}=S${p.matrix[c.key][h] || 1}`).join(", ")}`,
  ).join(" | ");
}

/** Kategorien, die genau am MTPD-Horizont S3 oder S4 erreichen (nicht irgendwann später). */
export function driversAtMtpd(p: ProcessEntry): string {
  const { horizon } = deriveMtpd(p);
  if (!horizon) return "keine Kategorie erreicht S3 im Betrachtungszeitraum";
  return (
    DAMAGE_CATEGORIES.filter((c) => (p.matrix[c.key][horizon] || 1) >= 3)
      .map((c) => `${c.label} (S${p.matrix[c.key][horizon]})`)
      .join("; ") || "keine"
  );
}

export interface ActivationLevel {
  code: "A1" | "A2" | "A3";
  stufe: string;
  kriterium: string;
  reaktion: string;
}

/**
 * Aktivierungsstufen des Notfallplans – regelbasiert aus RTO und MTPD der zeitkritischen
 * Prozesse abgeleitet, damit Notfallplan und BIA nie unterschiedliche Zahlen nennen.
 * Bewusst dreistufig (A1–A3) und getrennt von den vierstufigen Schadensstufen S1–S4.
 */
export function deriveActivation(processes: ProcessEntry[]): ActivationLevel[] {
  const rtos = processes.map((p) => Number(p.rtoHours)).filter((n) => Number.isFinite(n) && n > 0);
  const mtpds = processes.map((p) => deriveMtpd(p).hours).filter((n): n is number => n !== null);
  const minRto = rtos.length ? Math.min(...rtos) : null;
  const minMtpd = mtpds.length ? Math.min(...mtpds) : null;
  const rtoTxt = minRto !== null ? `${minRto} Std.` : "der kürzesten RTO";
  const mtpdTxt = minMtpd !== null ? `${minMtpd} Std.` : "der kürzesten MTPD";
  const halfMtpd = minMtpd !== null ? Math.max(1, Math.round(minMtpd / 2)) : null;
  const halfTxt = halfMtpd !== null ? `${halfMtpd} Std.` : "der Hälfte der kürzesten MTPD";

  return [
    {
      code: "A1",
      stufe: "A1 – Störung",
      kriterium: `Ausfall unter ${rtoTxt} absehbar behoben, kein zeitkritischer Prozess dauerhaft betroffen, kein Notbetrieb nötig.`,
      reaktion: "Bearbeitung in der Linie, Information an den Bereichsverantwortlichen, Dokumentation im Störungsprotokoll.",
    },
    {
      code: "A2",
      stufe: "A2 – Notfall",
      kriterium: `Ausfall erreicht ${rtoTxt} (kürzeste RTO) oder ein vorgesehenes Notbetriebsverfahren greift nicht.`,
      reaktion: "Notfallteam des Bereichs wird alarmiert, Notbetrieb wird angeordnet, Lagebild und Entscheidungen werden protokolliert.",
    },
    {
      code: "A3",
      stufe: "A3 – Krise",
      kriterium: `Ausfall erreicht ${halfTxt} (Hälfte der kürzesten MTPD von ${mtpdTxt}) und ein Wiederanlauf innerhalb der MTPD ist nicht belastbar zugesagt, oder Personen bzw. Anlagen sind gefährdet.`,
      reaktion: "Übergabe an den Krisenstab, externe Kommunikation und Meldepflichten werden dort entschieden, Bereich liefert Lagebild im festen Takt.",
    },
  ];
}


/** RTO-Vorschlag: klarer Sicherheitsabstand zur MTPD, an Schichtlogik gerundet. */
export function suggestRto(mtpdHours: number | null): number | null {
  if (!mtpdHours) return null;
  const raw = mtpdHours / 3;
  const grid = [1, 2, 4, 8, 12, 24, 48, 72];
  for (const g of grid) if (raw <= g) return g;
  return 72;
}

export function priorityOf(p: ProcessEntry): { label: string; level: 1 | 2 | 3; timeCritical: boolean } {
  const { hours } = deriveMtpd(p);
  if (hours !== null && hours <= 24) return { label: "zeitkritisch – Priorität 1", level: 1, timeCritical: true };
  if (hours !== null && hours <= 72) return { label: "zeitkritisch – Priorität 2", level: 2, timeCritical: true };
  return { label: "nicht zeitkritisch – Priorität 3", level: 3, timeCritical: false };
}

// ─── Qualitätsprüfung (läuft vor der Generierung, ohne Nutzerinteraktion) ───

export type Finding = { severity: "blocker" | "warnung" | "hinweis"; text: string; where: string };

export function runQualityCheck(input: NotnagelInput): Finding[] {
  const f: Finding[] = [];
  const { profile, processes, team, exercise } = input;

  if (!profile.organisation.trim()) f.push({ severity: "blocker", text: "Organisation fehlt – ohne Absender ist kein Dokument freigabefähig.", where: "Bereichsprofil" });
  if (!profile.area.trim()) f.push({ severity: "blocker", text: "Fachbereich fehlt.", where: "Bereichsprofil" });
  if (!profile.owner.trim()) f.push({ severity: "warnung", text: "Verantwortlicher nicht benannt – BIA und Notfallplan brauchen einen namentlichen Eigentümer.", where: "Bereichsprofil" });
  if (processes.length === 0) f.push({ severity: "blocker", text: "Kein Prozess erfasst – die BIA ist der Kern des Ergebnisses.", where: "Prozesse" });

  processes.forEach((p) => {
    const where = `Prozess ${p.id}${p.name ? ` – ${p.name}` : ""}`;
    if (!p.name.trim()) f.push({ severity: "blocker", text: "Prozessname fehlt.", where });
    if (!p.description.trim()) f.push({ severity: "warnung", text: "Kurzbeschreibung fehlt – der Prozesssteckbrief bleibt sonst unverständlich für Dritte.", where });
    if (!p.recipients.trim()) f.push({ severity: "hinweis", text: "Leistungsempfänger nicht benannt.", where });

    const flat = DAMAGE_CATEGORIES.flatMap((c) => HORIZONS.map((h) => p.matrix[c.key][h]));
    if (flat.every((v) => v === 1)) f.push({ severity: "blocker", text: "Schadensverlauf nicht bewertet – alle Werte stehen auf Stufe 1.", where });

    DAMAGE_CATEGORIES.forEach((c) => {
      for (let i = 1; i < HORIZONS.length; i++) {
        if (p.matrix[c.key][HORIZONS[i]] < p.matrix[c.key][HORIZONS[i - 1]]) {
          f.push({ severity: "warnung", text: `„${c.label}“ sinkt von ${HORIZONS[i - 1]} auf ${HORIZONS[i]}. Schäden werden im Zeitverlauf normalerweise nicht kleiner.`, where });
          break;
        }
      }
    });

    const { hours, horizon } = deriveMtpd(p);
    const rto = Number(p.rtoHours);
    const rpo = Number(p.rpoHours);
    if (!p.rtoHours.trim()) f.push({ severity: "blocker", text: "RTO fehlt.", where });
    else if (!Number.isFinite(rto) || rto <= 0) f.push({ severity: "blocker", text: "RTO ist keine gültige Stundenangabe.", where });
    else if (hours !== null && rto >= hours) {
      f.push({ severity: "blocker", text: `RTO (${rto} Std.) liegt nicht unter der abgeleiteten MTPD (${hours} Std., erreicht bei ${horizon}). Die Wiederanlaufzeit muss einen Sicherheitsabstand haben.`, where });
    }
    if (!p.rpoHours.trim()) f.push({ severity: "warnung", text: "RPO fehlt – ohne maximal tolerierbaren Datenverlust kann die IT die Sicherung nicht auslegen.", where });
    else if (Number.isFinite(rpo) && Number.isFinite(rto) && rpo > rto * 3) {
      f.push({ severity: "hinweis", text: `RPO (${rpo} Std.) ist deutlich größer als die RTO (${rto} Std.) – bitte prüfen, ob dieser Datenverlust fachlich tragbar ist.`, where });
    }
    if (!p.minimumService.trim()) f.push({ severity: "warnung", text: "Mindest-Notbetrieb nicht beschrieben – der Notfallplan bleibt sonst unkonkret.", where });
    if (p.resources.length < 3) f.push({ severity: "warnung", text: "Weniger als drei vitale Ressourcen erfasst. IT, Daten, Personal, Standort und Dienstleister sollten geprüft sein.", where });
    if (p.workarounds.length === 0) f.push({ severity: "blocker", text: "Kein Notbetriebsverfahren erfasst – ein Notfallplan ohne Workaround ist wertlos.", where });

    p.workarounds.forEach((w, i) => {
      if (!w.procedure.trim()) f.push({ severity: "warnung", text: `Notbetrieb ${i + 1} ohne Verfahrensbeschreibung.`, where });
      const limit = Number(w.limitHours);
      if (Number.isFinite(limit) && hours !== null && limit > 0 && limit < hours && Number.isFinite(rto) && limit < rto) {
        f.push({ severity: "hinweis", text: `Notbehelf „${w.scenario || `#${i + 1}`}“ trägt nur ${limit} Std., die RTO liegt bei ${rto} Std. – Anschlusslösung nötig.`, where });
      }
    });

    const spofs = p.resources.filter((r) => r.singlePointOfFailure);
    if (spofs.length > 0) f.push({ severity: "hinweis", text: `${spofs.length} Single Point of Failure markiert – das gehört als Handlungsbedarf in die BIA-Freigabe.`, where });
    const hasIt = p.resources.some((r) => r.kind === "IT-Anwendungen");
    if (Number.isFinite(rto) && hasIt) {
      f.push({ severity: "hinweis", text: `RTO von ${rto} Std. muss der IT schriftlich bekannt sein, sonst bleibt sie eine unverbindliche Erwartung.`, where });
    }
  });

  const unfilled = team.filter((t) => !t.primary.trim());
  if (unfilled.length > 0) f.push({ severity: "warnung", text: `${unfilled.length} Notfallrolle(n) ohne Besetzung.`, where: "Notfallteam" });
  const noDeputy = team.filter((t) => t.primary.trim() && !t.deputy.trim());
  if (noDeputy.length > 0) f.push({ severity: "warnung", text: `${noDeputy.length} Rolle(n) ohne Vertretung – im Ernstfall ist immer jemand im Urlaub.`, where: "Notfallteam" });
  if (!exercise.facilitator.trim()) f.push({ severity: "hinweis", text: "Übungsleitung nicht benannt.", where: "Übung" });
  if (!profile.regulatory.length) f.push({ severity: "hinweis", text: "Kein Rahmenwerk gewählt – die Leitlinie bleibt ohne normativen Bezug.", where: "Bereichsprofil" });

  // Konsistenz zwischen BIA-Zeitwerten und den abgeleiteten Aktivierungsstufen
  const rtoList = processes.map((p) => Number(p.rtoHours)).filter((n) => Number.isFinite(n) && n > 0);
  const mtpdList = processes.map((p) => deriveMtpd(p).hours).filter((n): n is number => n !== null);
  if (rtoList.length && mtpdList.length) {
    const minRto = Math.min(...rtoList);
    const minMtpd = Math.min(...mtpdList);
    if (minRto >= minMtpd / 2) {
      f.push({
        severity: "hinweis",
        text: `Kürzeste RTO (${minRto} Std.) und halbe kürzeste MTPD (${Math.round(minMtpd / 2)} Std.) liegen zusammen – die Aktivierungsstufen A2 (Notfall) und A3 (Krise) greifen fast gleichzeitig. Entweder RTO senken oder die Krisenschwelle im Notfallplan bewusst so bestätigen.`,
        where: "Notfallplan",
      });
    }
  }

  return f;
}

export function qualityScore(findings: Finding[]): { blockers: number; warnings: number; hints: number; ready: boolean } {
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const warnings = findings.filter((f) => f.severity === "warnung").length;
  const hints = findings.filter((f) => f.severity === "hinweis").length;
  return { blockers, warnings, hints, ready: blockers === 0 };
}
