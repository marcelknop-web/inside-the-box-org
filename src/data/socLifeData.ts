// SOC-Life: rooms, NPCs, incidents, playbooks
// Style: realistic SOC playbooks aligned with NIST SP 800-61 phases.
// All wrong answers are plausible mistakes a real analyst could make under pressure
// (premature actions, scope errors, evidence handling slip-ups) — never cartoonish.

export type Lang = "de" | "en" | "fr";
export type LocaleStr = Record<Lang, string>;

export type RoomId =
  | "soc_floor"
  | "siem"
  | "forensics"
  | "noc"
  | "server_room"
  | "war_room"
  | "ciso_office"
  | "kitchen";

export interface Room {
  id: RoomId;
  // Grid position on a 4x2 floor plan
  col: 0 | 1 | 2 | 3;
  row: 0 | 1;
  /** i18n key path under socLife.rooms.<id>.name / .desc */
  i18n: string;
}

export const ROOMS: Room[] = [
  { id: "soc_floor",   col: 0, row: 0, i18n: "soc_floor" },
  { id: "siem",        col: 1, row: 0, i18n: "siem" },
  { id: "forensics",   col: 2, row: 0, i18n: "forensics" },
  { id: "noc",         col: 3, row: 0, i18n: "noc" },
  { id: "war_room",    col: 0, row: 1, i18n: "war_room" },
  { id: "ciso_office", col: 1, row: 1, i18n: "ciso_office" },
  { id: "server_room", col: 2, row: 1, i18n: "server_room" },
  { id: "kitchen",     col: 3, row: 1, i18n: "kitchen" },
];

export type NpcId = "junior" | "ir_lead" | "ciso" | "sysadmin";
export interface Npc {
  id: NpcId;
  homeRoom: RoomId;
  /** i18n key path under socLife.npcs.<id>.name */
  i18n: string;
}
export const NPCS: Npc[] = [
  { id: "junior",   homeRoom: "soc_floor",   i18n: "junior" },
  { id: "ir_lead",  homeRoom: "war_room",    i18n: "ir_lead" },
  { id: "ciso",     homeRoom: "ciso_office", i18n: "ciso" },
  { id: "sysadmin", homeRoom: "server_room", i18n: "sysadmin" },
];

// ---------------- Incident model (inline-localized) ----------------

export interface PlaybookOption {
  id: string;
  label: LocaleStr;
  correct: boolean;
  /** Reputation delta if chosen */
  delta: number;
  /** Optional: explicit per-option rationale shown in the consequence overlay.
   *  If omitted, a generic, tier+phase-based reason is generated automatically. */
  reason?: LocaleStr;
}

export interface PlaybookStep {
  id: string;
  title: LocaleStr;
  prompt: LocaleStr;
  requiredRoom: RoomId | null;
  options: PlaybookOption[];
  timeLimitMs: number;
}

/** Difficulty tier — drives the spawn curve in SocLife.tsx so the shift
 *  starts gentle and ramps up. `comic` = light-relief breather episodes. */
export type IncidentTier = "easy" | "medium" | "hard" | "comic";

/** Coarse subject category — used to avoid two thematically identical
 *  incidents back-to-back, which felt monotonous. */
export type IncidentCategory =
  | "email"      // phishing, BEC
  | "endpoint"   // ransomware, LSASS, lateral
  | "network"    // DDoS, C2, exfil
  | "identity"   // insider
  | "vuln"       // 0-day, supply chain
  | "governance" // auditor / DPO / compliance / fire drill
  ;

export interface Incident {
  id: string;
  title: LocaleStr;
  brief: LocaleStr;
  initialDelayMs: number;
  steps: PlaybookStep[];
  /** Difficulty tier. Defaults to "medium" if omitted. */
  tier?: IncidentTier;
  /** Subject category. Used to avoid topic repetition. */
  category?: IncidentCategory;
}

// Helper to keep entries terse
const L = (de: string, en: string, fr: string): LocaleStr => ({ de, en, fr });

// ---------------- 10 incidents (realistic, plausible distractors) ----------------

const PHISHING: Incident = {
  id: "phishing",
  tier: "easy",
  category: "email",
  title: L("Phishing-Welle", "Phishing wave", "Vague de phishing"),
  brief: L(
    "Mehrere Mitarbeiter melden eine Mail mit verdächtigem Anhang.",
    "Multiple staff report a mail with a suspicious attachment.",
    "Plusieurs collaborateurs signalent un mail avec pièce jointe suspecte."
  ),
  initialDelayMs: 12_000,
  steps: [
    {
      id: "detect", requiredRoom: "siem", timeLimitMs: 25_000,
      title: L("Triage", "Triage", "Triage"),
      prompt: L("Was zuerst?", "What first?", "Quelle première action ?"),
      options: [
        { id: "verify",     correct: true,  delta: +6, label: L("Header und Links prüfen, Anhang in der Sandbox testen", "Check headers and links, detonate the attachment in a sandbox", "Vérifier les en-têtes et les liens, tester la pièce jointe en sandbox") },
        { id: "block_now",  correct: false, delta: -3, label: L("Sender sofort blocken und Mails löschen, Indikatoren später nachziehen", "Block the sender and purge mails first, capture indicators later", "Bloquer l'expéditeur et purger les mails d'abord, indicateurs ensuite") },
        { id: "user_train", correct: false, delta: -4, label: L("Awareness-Mail an alle schicken, dann erst triagieren", "Blast an awareness mail to everyone, then start triage", "Envoyer une alerte sensibilisation à tous, puis triager") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 25_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "block_sender", correct: true,  delta: +6, label: L("Sender und URLs am Mail-Gateway blocken, ausgelieferte Mails aus den Postfächern zurückholen", "Block sender and URLs at the mail gateway, recall delivered mails from mailboxes", "Bloquer l'expéditeur et les URLs sur la passerelle, rappeler les mails déjà livrés") },
        { id: "delete_only",  correct: false, delta: -3, label: L("Nur die Mails aus den Postfächern löschen, Gateway-Regel weglassen", "Just delete the mails from mailboxes, skip the gateway rule", "Effacer seulement les mails des boîtes, sans règle gateway") },
        { id: "quarantine",   correct: false, delta: -2, label: L("Alle betroffenen Postfächer komplett sperren, bis die Analyse durch ist", "Lock down all affected mailboxes entirely until analysis is done", "Verrouiller toutes les boîtes concernées jusqu'à fin d'analyse") },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("CISO-Briefing?", "Brief the CISO?", "Briefer le CISO ?"),
      options: [
        { id: "brief_ciso", correct: true,  delta: +5, label: L("Knappes Briefing: Umfang, Auswirkung, Status der Eindämmung, nächste Schritte", "Tight brief: scope, impact, containment status, next steps", "Brief concis : portée, impact, état de containment, prochaines étapes") },
        { id: "wait_full",  correct: false, delta: -3, label: L("Erst den vollständigen Forensik-Bericht abwarten, dann briefen", "Wait for the full forensic report first, then brief", "Attendre le rapport forensique complet, puis briefer") },
        { id: "email_only", correct: false, delta: -2, label: L("Nur eine strukturierte Mail an CISO und IR-Lead, kein Sync-Termin", "Send a structured email to CISO and IR lead only, no sync meeting", "Mail structuré au CISO et IR lead seulement, sans réunion") },
      ],
    },
  ],
};

const RANSOMWARE: Incident = {
  id: "ransomware",
  tier: "hard",
  category: "endpoint",
  title: L("Ransomware-Verdacht", "Ransomware suspicion", "Suspicion de ransomware"),
  brief: L(
    "EDR meldet massenhafte Datei-Verschlüsselung auf einem File-Server.",
    "EDR reports mass file encryption on a file server.",
    "L'EDR signale un chiffrement massif sur un serveur de fichiers."
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Erste Reaktion?", "First reaction?", "Première réaction ?"),
      options: [
        { id: "confirm_edr",  correct: true,  delta: +6, label: L("EDR-Telemetrie und Datei-Hashes prüfen, Prozess-Stammbaum nachvollziehen", "Verify EDR telemetry and file hashes, walk the process tree", "Vérifier la télémétrie EDR et les hashes, suivre l'arbre de processus") },
        { id: "shutdown_srv", correct: false, delta: -3, label: L("Den Datei-Server sauber herunterfahren, dann ein Image ziehen", "Cleanly shut down the file server, then take an image", "Éteindre proprement le serveur de fichiers, puis prendre une image") },
        { id: "kill_share",   correct: false, delta: -2, label: L("Die Datei-Freigabe offline nehmen und auf Nur-Lesen stellen", "Take the file share offline and switch it to read-only", "Couper le partage et passer en lecture seule") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Isolation", "Isolate", "Isoler"),
      prompt: L("Wie isolieren?", "How to isolate?", "Comment isoler ?"),
      options: [
        { id: "segment_vlan",  correct: true,  delta: +8, label: L("Host vom Netz isolieren, EDR-Quarantäne aktivieren, Wege zu anderen Systemen kappen", "Isolate the host from the network, EDR-quarantine, sever paths to other systems", "Isoler l'hôte du réseau, mettre en quarantaine EDR, couper les chemins vers d'autres systèmes") },
        { id: "block_ad",      correct: false, delta: -3, label: L("Computerkonto im Verzeichnis deaktivieren und einen Vollscan auf dem Host anstoßen", "Disable the computer account in the directory and trigger a full scan on the host", "Désactiver le compte machine dans l'annuaire et lancer un scan complet sur l'hôte") },
        { id: "block_internet",correct: false, delta: -2, label: L("Nur den Internet-Zugang des Hosts an der Firewall sperren, Rest unverändert", "Only block the host's internet access at the firewall, leave the rest", "Bloquer uniquement l'accès internet de l'hôte au firewall, le reste inchangé") },
      ],
    },
    {
      id: "recover", requiredRoom: "server_room", timeLimitMs: 25_000,
      title: L("Wiederherstellung", "Recovery", "Restauration"),
      prompt: L("Recovery?", "Recovery?", "Recovery ?"),
      options: [
        { id: "restore_backup", correct: true,  delta: +8, label: L("Offline- bzw. unveränderliche Backups auf Integrität prüfen, dann sauber zurückspielen", "Verify offline / immutable backups for integrity, then restore cleanly", "Vérifier l'intégrité des sauvegardes hors-ligne ou immuables, puis restaurer proprement") },
        { id: "restore_latest", correct: false, delta: -4, label: L("Einfach das jüngste Online-Backup einspielen, ohne Integritätscheck", "Just restore the most recent online backup, no integrity check", "Restaurer simplement la sauvegarde en ligne la plus récente, sans vérification") },
        { id: "shadow_copies",  correct: false, delta: -3, label: L("Auf Schattenkopien zurückrollen und Datei-Versionen vergleichen", "Roll back via shadow copies and diff file versions", "Restaurer via les copies fantômes et comparer les versions") },
      ],
    },
  ],
};

const DDOS: Incident = {
  id: "ddos",
  tier: "easy",
  category: "network",
  title: L("DDoS auf Kunden-Portal", "DDoS on customer portal", "DDoS sur portail client"),
  brief: L(
    "Latenzanstieg + Traffic-Spike auf das öffentliche Login.",
    "Latency spike + traffic surge on the public login.",
    "Pic de latence + de trafic sur le login public."
  ),
  initialDelayMs: 8_000,
  steps: [
    {
      id: "verify", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "verify_traffic", correct: true,  delta: +5, label: L("Verkehrsmuster und Herkunftsländer prüfen, Netzwerk- vs. Anwendungslast trennen, Top-Quellen identifizieren", "Check traffic patterns and source geos, separate network vs. application load, identify top sources", "Analyser les flux et la géo, distinguer charge réseau et applicative, identifier les principales sources") },
        { id: "scale_up",       correct: false, delta: -3, label: L("Einfach mehr Web-Server hochfahren und die Health-Checks lockern", "Just spin up more web servers and loosen the health checks", "Faire monter plus de serveurs web et assouplir les health-checks") },
        { id: "rate_limit_all", correct: false, delta: -2, label: L("Pauschales Rate-Limit über die WAF auf alle Quellen anwenden, eng konfiguriert", "Apply a blanket WAF rate-limit on every source, tightly configured", "Limiter strictement le débit sur toutes les sources via la WAF") },
      ],
    },
    {
      id: "mitigate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Mitigation", "Mitigate", "Mitigation"),
      prompt: L("Wie reagieren?", "How do you respond?", "Comment réagir ?"),
      options: [
        { id: "scrubbing", correct: true,  delta: +8, label: L("Verkehr über einen DDoS-Schutzdienst leiten und gezielte WAF-Regeln nachschärfen", "Route traffic through a DDoS scrubbing provider and tighten targeted WAF rules", "Router le trafic via un service anti-DDoS et affiner les règles WAF ciblées") },
        { id: "geoblock",  correct: false, delta: -2, label: L("Ganze Regionen am Edge geo-blocken, ohne die Quellen zu prüfen", "Geo-block entire regions at the edge without checking the sources", "Géo-bloquer des régions entières au edge sans analyser les sources") },
        { id: "captcha_all",correct: false, delta: -3, label: L("Für jede Login-Sitzung verpflichtend ein CAPTCHA einblenden", "Force a mandatory CAPTCHA on every login session", "Imposer un CAPTCHA pour chaque session de login") },
      ],
    },
    {
      id: "comms", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Kommunikation", "Comms", "Communication"),
      prompt: L("Was kommunizieren?", "What do you communicate?", "Que communiquer ?"),
      options: [
        { id: "status_page",  correct: true,  delta: +5, label: L("Status-Page mit klar eingestuftem Vorfall aktualisieren und interne Stakeholder im War Room informieren", "Update the status page with a clearly classified incident and inform internal stakeholders in the war room", "Mettre à jour la status page avec un niveau d'incident clair et informer les parties prenantes internes en war room") },
        { id: "wait_resolved",correct: false, delta: -3, label: L("Erst warten, bis alles wieder läuft, dann ein Statement mit Ursache veröffentlichen", "Wait until everything is back up, then publish a statement with the root cause", "Attendre la stabilisation, puis publier un communiqué avec la cause") },
        { id: "internal_only",correct: false, delta: -2, label: L("Nur intern kommunizieren, die externe Status-Page bewusst nicht anfassen", "Only communicate internally, deliberately leave the public status page untouched", "Communiquer uniquement en interne, ne pas toucher à la status page publique") },
      ],
    },
  ],
};

const INSIDER: Incident = {
  id: "insider",
  tier: "medium",
  category: "identity",
  title: L("Insider-Verdacht", "Insider threat", "Menace interne"),
  brief: L(
    "DLP meldet ungewöhnliche Datenabflüsse durch internen Account.",
    "DLP reports unusual data egress from an internal account.",
    "Le DLP signale une exfiltration inhabituelle depuis un compte interne."
  ),
  initialDelayMs: 14_000,
  steps: [
    {
      id: "triage", requiredRoom: "siem", timeLimitMs: 25_000,
      title: L("Triage", "Triage", "Triage"),
      prompt: L("Erste Aktion?", "First action?", "Première action ?"),
      options: [
        { id: "review_dlp", correct: true,  delta: +6, label: L("DLP-Logs und Verhaltensprofil prüfen, mit Baseline und Peer-Group vergleichen", "Review DLP logs and behavioural profile, compare with baseline and peer group", "Examiner les logs DLP et le profil comportemental, comparer avec la baseline et le groupe pair") },
        { id: "lock_acct",  correct: false, delta: -3, label: L("Konto sofort sperren und Sitzungen beenden, Kontext erst danach klären", "Lock the account immediately and kill sessions, clarify context afterwards", "Verrouiller le compte immédiatement et couper les sessions, contexte ensuite") },
        { id: "ask_mgr",    correct: false, delta: -3, label: L("Den direkten Vorgesetzten fragen, ob es einen Geschäftsgrund für die Datenabflüsse gibt", "Ask the direct manager if there's a business reason for the data egress", "Demander au manager direct s'il y a une raison métier pour ces flux") },
      ],
    },
    {
      id: "preserve", requiredRoom: "forensics", timeLimitMs: 25_000,
      title: L("Beweissicherung", "Preserve", "Préserver"),
      prompt: L("Forensik?", "Forensics?", "Forensique ?"),
      options: [
        { id: "image_endpoint", correct: true,  delta: +8, label: L("Endgerät forensisch sauber abbilden inkl. Arbeitsspeicher, Beweiskette dokumentieren", "Forensically image the endpoint incl. memory, document the chain of custody", "Image forensique de l'endpoint, mémoire incluse, documenter la chaîne de garde") },
        { id: "remote_collect", correct: false, delta: -3, label: L("Nur Remote-Triage-Daten sammeln, das volle Image erst im nächsten Wartungsfenster", "Collect only remote triage data, full image deferred to the next maintenance window", "Collecter seulement les données de triage à distance, image complète au prochain créneau") },
        { id: "snapshot_vm",    correct: false, delta: -2, label: L("Nur einen VM-Snapshot anstoßen und das Disk-Image später daraus exportieren", "Just take a VM snapshot and export the disk image from it later", "Faire seulement un snapshot VM et exporter l'image disque ensuite") },
      ],
    },
    {
      id: "hr_legal", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("HR & Legal", "HR & Legal", "RH & Juridique"),
      prompt: L("Wer wird einbezogen?", "Who do you involve?", "Qui impliquer ?"),
      options: [
        { id: "loop_hr_legal", correct: true,  delta: +7, label: L("HR, Legal und Datenschutz formell und dokumentiert über den Eskalationsprozess einbinden", "Involve HR, Legal and the DPO formally and documented via the escalation process", "Impliquer formellement RH, juridique et DPO via le processus d'escalade") },
        { id: "ciso_only",     correct: false, delta: -3, label: L("Nur den CISO briefen, HR und Legal erst nach der technischen Analyse einbinden", "Brief only the CISO, loop HR and Legal in after the technical analysis", "Briefer uniquement le CISO, impliquer RH et juridique après l'analyse technique") },
        { id: "shadow",        correct: false, delta: -4, label: L("Verdeckt weiter beobachten und niemanden eskalieren, um die Operation nicht zu gefährden", "Keep monitoring covertly and escalate to nobody, to protect the operation", "Continuer à surveiller en discrétion et n'escalader à personne, pour protéger l'opération") },
      ],
    },
  ],
};

const BEC: Incident = {
  id: "bec",
  tier: "medium",
  category: "email",
  title: L("CEO-Fraud / BEC", "CEO fraud / BEC", "Fraude CEO / BEC"),
  brief: L(
    "Buchhaltung meldet eine ungewöhnliche Zahlungsanweisung 'vom CEO'.",
    "Finance reports an unusual payment request 'from the CEO'.",
    "La comptabilité signale un ordre de paiement inhabituel 'du CEO'."
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie verifizieren?", "How do you verify?", "Comment vérifier ?"),
      options: [
        { id: "auth_logs",  correct: true,  delta: +6, label: L("Mail-Authentizität, Login-Geo und MFA-Status des CEO-Postfachs prüfen", "Check mail authenticity, login geo and MFA status of the CEO mailbox", "Vérifier l'authenticité du mail, la géo de login et le statut MFA de la boîte CEO") },
        { id: "call_ceo",   correct: false, delta: -2, label: L("Den CEO über die Nummer in der verdächtigen Mail zurückrufen und mündlich bestätigen lassen", "Call back the CEO using the number in the suspicious mail and confirm verbally", "Rappeler le CEO sur le numéro indiqué dans le mail suspect et confirmer oralement") },
        { id: "ask_finance",correct: false, delta: -3, label: L("Bei der Buchhaltung nachfragen, ob die Anweisung zum üblichen Muster passt", "Ask finance whether the instruction fits the usual pattern", "Demander à la comptabilité si l'instruction correspond au schéma habituel") },
      ],
    },
    {
      id: "stop_payment", requiredRoom: "war_room", timeLimitMs: 18_000,
      title: L("Zahlung stoppen", "Stop payment", "Stopper le paiement"),
      prompt: L("Wie stoppen?", "How do you stop it?", "Comment stopper ?"),
      options: [
        { id: "freeze_call", correct: true,  delta: +7, label: L("Buchhaltung und Bank-Hotline parallel anrufen, Überweisung sofort einfrieren lassen", "Call finance and the bank hotline in parallel, have the transfer frozen immediately", "Appeler en parallèle la comptabilité et la hotline banque, geler le virement tout de suite") },
        { id: "email_only",  correct: false, delta: -3, label: L("Nur eine strukturierte Stop-Mail an Buchhaltung und Treasury schicken", "Send only a structured stop email to finance and treasury", "Envoyer seulement un mail d'arrêt structuré à finance et trésorerie") },
        { id: "wait_legal",  correct: false, delta: -4, label: L("Erst die Freigabe von Legal abwarten, dann formell stoppen", "Wait for legal sign-off first, then stop formally", "Attendre l'aval juridique d'abord, puis stopper formellement") },
      ],
    },
    {
      id: "harden", requiredRoom: "ciso_office", timeLimitMs: 20_000,
      title: L("Härtung", "Harden", "Durcissement"),
      prompt: L("Was härten?", "What do you harden?", "Que durcir ?"),
      options: [
        { id: "policy_4eyes", correct: true,  delta: +6, label: L("Vier-Augen-Prinzip und verpflichtenden Rückruf auf einem zweiten Kanal für Zahlungen ab einer Schwelle einführen", "Four-eyes plus mandatory callback on a second channel for payments above a threshold", "Quatre yeux et rappel obligatoire sur un second canal pour les paiements au-dessus d'un seuil") },
        { id: "block_ext",    correct: false, delta: -3, label: L("Externe Mail-Domains pauschal am Gateway blocken, Ausnahmen nur per IT-Antrag", "Blanket-block external mail domains at the gateway, exceptions only via IT request", "Bloquer en bloc les domaines mail externes, exceptions sur demande IT") },
        { id: "rotate_ceo",   correct: false, delta: -2, label: L("Nur das CEO-Konto neu absichern: Passwort, MFA, strengere Zugriffsregeln", "Just re-secure the CEO account: password, MFA, stricter access rules", "Re-sécuriser uniquement le compte CEO : mot de passe, MFA, règles d'accès plus strictes") },
      ],
    },
  ],
};

const LATERAL: Incident = {
  id: "lateral_movement",
  tier: "hard",
  category: "endpoint",
  title: L("Lateral Movement erkannt", "Lateral movement detected", "Mouvement latéral détecté"),
  brief: L(
    "EDR sieht PsExec/SMB-Anmeldungen von einer Workstation auf mehrere Server.",
    "EDR sees PsExec/SMB logins from one workstation onto multiple servers.",
    "L'EDR voit des connexions PsExec/SMB d'un poste vers plusieurs serveurs."
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "scope", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Scope", "Scope", "Périmètre"),
      prompt: L("Wie ermitteln?", "How do you scope?", "Comment cadrer ?"),
      options: [
        { id: "graph",        correct: true,  delta: +6, label: L("Authentifizierungs-Graph + 4624/4672-Events korrelieren, BloodHound-Pfade prüfen", "Correlate auth graph + 4624/4672 events, review BloodHound paths", "Corréler graphe d'authentification + events 4624/4672, examiner les chemins BloodHound") },
        { id: "endpoint_only",correct: false, delta: -3, label: L("Ursprungs-Endpoint per EDR-Deep-Dive analysieren, Sysmon-Logs + DLL-Loads aufrollen", "Deep-dive the origin endpoint via EDR, walk Sysmon logs + DLL loads", "Analyse approfondie EDR de l'endpoint d'origine, dérouler logs Sysmon + DLL loads") },
        { id: "ask_user",     correct: false, delta: -3, label: L("User per Teams kontaktieren und Login-Aktivität via Self-Service-Portal verifizieren lassen", "Contact user via Teams, have them verify login activity through self-service portal", "Contacter l'utilisateur via Teams, vérification des connexions via portail self-service") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "isolate_set", correct: true,  delta: +7, label: L("Alle betroffenen Hosts EDR-isolieren, Service-Konten + Tier-0-Sessions sperren", "EDR-isolate all affected hosts, disable service accounts + tier-0 sessions", "Isoler via EDR tous les hôtes affectés, désactiver comptes service + sessions tier-0") },
        { id: "isolate_one", correct: false, delta: -3, label: L("Nur den initialen Host isolieren, restliche Hosts mit verschärftem EDR-Monitoring beobachten", "Isolate only the initial host, monitor the rest under heightened EDR alerting", "Isoler uniquement l'hôte initial, observer les autres avec alertes EDR renforcées") },
        { id: "block_smb",   correct: false, delta: -2, label: L("SMB (Port 445) per Firewall im gesamten Server-Segment blocken, Kollateralschaden in Kauf nehmen", "Block SMB (port 445) at firewall across the server segment, accept collateral damage", "Bloquer SMB (port 445) au firewall sur tout le segment serveur, accepter les collatéraux") },
      ],
    },
    {
      id: "creds", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Credentials", "Credentials", "Identifiants"),
      prompt: L("Was tun mit Konten?", "What about accounts?", "Que faire des comptes ?"),
      options: [
        { id: "rotate_tier", correct: true,  delta: +7, label: L("Tier-0-Konten + Kerberos-krbtgt zwei Mal rotieren, Service-Acc-Passwörter erzwingen", "Rotate tier-0 accounts + Kerberos krbtgt twice, force service-account password reset", "Faire tourner comptes tier-0 + krbtgt 2x, forcer la rotation des comptes de service") },
        { id: "rotate_all",  correct: false, delta: -3, label: L("Unternehmensweiten Force-Password-Reset bei nächster AD-Anmeldung erzwingen, MFA-Re-Enrollment", "Force company-wide password reset at next AD logon, MFA re-enrollment", "Forcer la réinitialisation à la prochaine connexion AD, ré-enrôlement MFA") },
        { id: "rotate_one",  correct: false, delta: -3, label: L("Passwort des kompromittierten Users rotieren, MFA-Tokens revoken, Kerberos-TGT invalidieren", "Reset compromised user's password, revoke MFA tokens, invalidate Kerberos TGT", "Changer le mot de passe de l'utilisateur compromis, révoquer les tokens MFA, invalider le TGT") },
      ],
    },
  ],
};

const C2: Incident = {
  id: "c2_beacon",
  tier: "medium",
  category: "network",
  title: L("C2-Beaconing erkannt", "C2 beaconing detected", "Beaconing C2 détecté"),
  brief: L(
    "Proxy-Logs zeigen periodische Verbindungen zu einer unbekannten Domain.",
    "Proxy logs show periodic connections to an unknown domain.",
    "Les logs proxy montrent des connexions périodiques vers un domaine inconnu."
  ),
  initialDelayMs: 11_000,
  steps: [
    {
      id: "analyse", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Analyse", "Analyse", "Analyse"),
      prompt: L("Wie analysieren?", "How do you analyse?", "Comment analyser ?"),
      options: [
        { id: "ti_lookup",  correct: true,  delta: +6, label: L("TI-Lookup + JA3/Beacon-Intervall + betroffene Hosts identifizieren", "TI lookup + JA3/beacon interval + identify affected hosts", "Lookup TI + JA3/intervalle + identifier les hôtes affectés") },
        { id: "block_dns",  correct: false, delta: -3, label: L("Domain per DNS-Sinkhole umleiten und passdns-Snapshots für spätere Analyse archivieren", "Sinkhole the domain via DNS and archive passive-DNS snapshots for later analysis", "Sinkholer le domaine via DNS et archiver des snapshots passive-DNS") },
        { id: "wait",       correct: false, delta: -4, label: L("24h kontrolliertes Monitoring mit erweiterter Packet-Capture, dann Pattern-Validierung", "Run 24h controlled monitoring with extended packet capture, then validate the pattern", "Surveillance contrôlée 24h avec packet capture étendue, puis validation du pattern") },
      ],
    },
    {
      id: "block", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Blockieren", "Block", "Bloquer"),
      prompt: L("Wo blocken?", "Where do you block?", "Où bloquer ?"),
      options: [
        { id: "fw_proxy",   correct: true,  delta: +7, label: L("Domain + IPs auf Firewall und Proxy blocken, DNS-Sinkhole + EDR-IOC-Push", "Block domain + IPs at firewall and proxy, DNS sinkhole + EDR IOC push", "Bloquer domaine + IPs au firewall et proxy, sinkhole DNS + push IOC EDR") },
        { id: "edr_only",   correct: false, delta: -3, label: L("Hash-Signaturen + Datei-Pfade per EDR-Custom-Indicator zentral blacklisten, Netz unverändert", "Centrally blacklist hashes + file paths via EDR custom indicators, leave network as-is", "Blacklister hashes + chemins via indicateurs EDR custom, réseau inchangé") },
        { id: "block_outb", correct: false, delta: -2, label: L("Allen ausgehenden Traffic des Hosts per Firewall-Quarantänezone droppen, inkl. legitimer Flows", "Drop all outbound traffic from the host into a FW quarantine zone, incl. legitimate flows", "Couper tout le trafic sortant via zone de quarantaine FW, incl. flux légitimes") },
      ],
    },
    {
      id: "remediate", requiredRoom: "forensics", timeLimitMs: 22_000,
      title: L("Bereinigung", "Remediate", "Remédiation"),
      prompt: L("Wie bereinigen?", "How to remediate?", "Comment remédier ?"),
      options: [
        { id: "image_reimage", correct: true,  delta: +7, label: L("Host imagen, Persistenz (Run-Keys, Tasks, WMI) suchen, dann sauber neu aufsetzen", "Image host, hunt persistence (run keys, tasks, WMI), then reimage cleanly", "Imager l'hôte, chasser la persistance (run keys, tasks, WMI), puis réinstaller proprement") },
        { id: "av_scan",       correct: false, delta: -3, label: L("Tiefen-Scan mit AV + EDR + zwei Drittanbieter-Scannern offline durchführen, Quarantäne automatisiert", "Run deep AV + EDR + two third-party scanners offline, automated quarantine", "Scan approfondi AV + EDR + 2 scanners tiers hors-ligne, quarantaine automatisée") },
        { id: "kill_proc",     correct: false, delta: -3, label: L("Beacon-Prozess-Tree per EDR terminieren, Auto-Run-Einträge bereinigen, Host weiternutzen", "Kill the beacon process tree via EDR, clean auto-run entries, keep using host", "Terminer l'arbre de processus du beacon via EDR, nettoyer les auto-runs, garder l'hôte") },
      ],
    },
  ],
};

const CRED_DUMP: Incident = {
  id: "cred_dump",
  tier: "hard",
  category: "endpoint",
  title: L("LSASS-Dump erkannt", "LSASS dump detected", "Dump LSASS détecté"),
  brief: L(
    "EDR alarmiert: Zugriff auf LSASS-Speicher von einer Admin-Workstation.",
    "EDR alert: LSASS memory access from an admin workstation.",
    "Alerte EDR : accès mémoire LSASS depuis un poste admin."
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "validate", requiredRoom: "siem", timeLimitMs: 18_000,
      title: L("Validieren", "Validate", "Valider"),
      prompt: L("Wie validieren?", "How do you validate?", "Comment valider ?"),
      options: [
        { id: "process_tree", correct: true,  delta: +6, label: L("Prozess-Tree + Tool-Signatur (Mimikatz/comsvcs.dll/MiniDumpWriteDump) prüfen", "Check process tree + tool signature (Mimikatz/comsvcs.dll/MiniDumpWriteDump)", "Examiner l'arbre de processus + signature outil (Mimikatz/comsvcs.dll/MiniDumpWriteDump)") },
        { id: "ask_admin",    correct: false, delta: -3, label: L("Admin direkt kontaktieren und legitimen Diagnose-Use-Case (z. B. Procdump-Wartung) verifizieren", "Contact the admin directly and verify a legitimate diagnostic use case (e.g. procdump maintenance)", "Contacter l'admin et vérifier un usage diagnostique légitime (p. ex. procdump)") },
        { id: "trust_av",     correct: false, delta: -4, label: L("Defender ATP + EDR-Telemetrie quer-prüfen — bleibt beides still, als False Positive klassifizieren", "Cross-check Defender ATP + EDR telemetry — if both stay silent, classify as false positive", "Recouper Defender ATP + EDR — si les deux restent silencieux, classer en faux positif") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Isolieren", "Isolate", "Isoler"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "edr_isolate", correct: true,  delta: +7, label: L("Workstation EDR-isolieren, alle Admin-Sessions terminieren, Kerberos-Tickets purgen", "EDR-isolate the workstation, kill all admin sessions, purge Kerberos tickets", "Isoler le poste via EDR, terminer toutes les sessions admin, purger les tickets Kerberos") },
        { id: "shutdown",    correct: false, delta: -3, label: L("Workstation kontrolliert per ACPI-Shutdown herunterfahren, Disk-Image im nächsten Schritt", "Gracefully ACPI-shutdown the workstation, take a disk image in the next step", "Éteindre proprement via ACPI, image disque à l'étape suivante") },
        { id: "user_logoff", correct: false, delta: -3, label: L("Admin-Sitzung per quser/logoff terminieren, Maschine im Netz lassen für Live-Forensik", "Terminate admin session via quser/logoff, keep machine on network for live forensics", "Terminer la session admin via quser/logoff, garder la machine en ligne pour forensique live") },
      ],
    },
    {
      id: "rotate", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Rotieren", "Rotate", "Rotation"),
      prompt: L("Welche Konten?", "Which accounts?", "Quels comptes ?"),
      options: [
        { id: "all_admin",  correct: true,  delta: +7, label: L("Alle auf dem Host genutzten Privileged- + Service-Konten rotieren, gMSA-Passwort-Cycle erzwingen", "Rotate all privileged + service accounts used on host, force gMSA password cycle", "Faire tourner tous les comptes priv. + service utilisés, forcer le cycle gMSA") },
        { id: "owner_only", correct: false, delta: -3, label: L("Konto des betroffenen Admins rotieren, MFA neu enrollen, Sitzungen revoken", "Rotate the affected admin's account, re-enroll MFA, revoke sessions", "Faire tourner le compte de l'admin concerné, ré-enrôler MFA, révoquer les sessions") },
        { id: "schedule",   correct: false, delta: -3, label: L("Geplante Rotation in das nächste Wartungsfenster + JIT-Access-Workflow integrieren", "Integrate scheduled rotation into the next maintenance window + JIT-access workflow", "Intégrer la rotation prévue dans la prochaine fenêtre de maintenance + workflow JIT") },
      ],
    },
  ],
};

const SUPPLY: Incident = {
  id: "supply_chain",
  tier: "hard",
  category: "vuln",
  title: L("Supply-Chain-Alert", "Supply-chain alert", "Alerte supply chain"),
  brief: L(
    "Hersteller meldet kompromittiertes Update einer eingesetzten Software.",
    "Vendor reports a compromised update of software you deploy.",
    "Le fournisseur signale une mise à jour compromise d'un logiciel déployé."
  ),
  initialDelayMs: 12_000,
  steps: [
    {
      id: "exposure", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Exposition", "Exposure", "Exposition"),
      prompt: L("Wie ermitteln?", "How do you assess?", "Comment évaluer ?"),
      options: [
        { id: "cmdb_query",  correct: true,  delta: +6, label: L("CMDB + EDR nach Version & Hash der betroffenen Komponente abfragen, SBOM-Match prüfen", "Query CMDB + EDR for version & hash of affected component, check SBOM match", "Interroger CMDB + EDR pour version & hash, vérifier le match SBOM") },
        { id: "ask_owners",  correct: false, delta: -3, label: L("System-Owner per strukturiertem Service-Now-Ticket einzeln zur Versions-Bestätigung anfragen", "Request version confirmation from system owners individually via structured ServiceNow ticket", "Demander confirmation de version aux owners via tickets ServiceNow structurés") },
        { id: "wait_advisory",correct: false, delta: -4, label: L("Detailliertes Hersteller-Advisory mit IOC-Liste + KEV-Eintrag abwarten, dann fundiert handeln", "Wait for detailed vendor advisory with IOC list + KEV entry, then act on solid ground", "Attendre l'advisory détaillé avec liste d'IOCs + entrée KEV, puis agir") },
      ],
    },
    {
      id: "block", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Sofort-Mitigation", "Immediate mitigation", "Mitigation immédiate"),
      prompt: L("Was tun?", "What do you do?", "Que faire ?"),
      options: [
        { id: "isolate_block", correct: true,  delta: +7, label: L("Betroffene Hosts isolieren, Update-Server + IOCs auf Firewall + Proxy blocken", "Isolate affected hosts, block update server + IOCs at firewall + proxy", "Isoler les hôtes affectés, bloquer serveur d'update + IOCs au FW + proxy") },
        { id: "uninstall_all", correct: false, delta: -3, label: L("Komponente per orchestrierter Deployment-Pipeline überall deinstallieren, inkl. Produktion", "Uninstall the component everywhere via orchestrated deployment pipeline, incl. production", "Désinstaller le composant partout via pipeline de déploiement, incl. prod") },
        { id: "patch_now",     correct: false, delta: -3, label: L("Nächsten Hersteller-Patch sofort über alle Stages ausrollen, Rollback-Snapshot vorab erstellen", "Roll out the next vendor patch immediately across all stages, take rollback snapshot first", "Déployer le prochain patch éditeur sur toutes les stages, snapshot de rollback préalable") },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("An wen reporten?", "Who do you report to?", "À qui reporter ?"),
      options: [
        { id: "ciso_legal", correct: true,  delta: +6, label: L("CISO + Legal + DPO informieren, Meldepflichten (NIS-2/DORA) prüfen", "Inform CISO + Legal + DPO, check notification duties (NIS-2/DORA)", "Informer CISO + juridique + DPO, vérifier obligations (NIS-2/DORA)") },
        { id: "ciso_only",  correct: false, delta: -2, label: L("CISO als zentralen Eskalationspunkt briefen, Legal/DPO nach Impact-Bewertung einbinden", "Brief CISO as central escalation point, loop Legal/DPO after impact assessment", "Briefer le CISO comme point d'escalade central, juridique/DPO après évaluation d'impact") },
        { id: "wait_impact",correct: false, delta: -4, label: L("Konkrete Impact-Metriken (betroffene Hosts, Datenklassen) erheben, dann formell melden", "Gather concrete impact metrics (affected hosts, data classes), then notify formally", "Collecter les métriques d'impact concrètes (hôtes, classes de données), puis signaler formellement") },
      ],
    },
  ],
};

const EXFIL: Incident = {
  id: "data_exfil",
  tier: "medium",
  category: "network",
  title: L("Daten-Exfiltration", "Data exfiltration", "Exfiltration de données"),
  brief: L(
    "Großvolumige Uploads zu einem Cloud-Speicher außerhalb der genehmigten Liste.",
    "Large uploads to a cloud storage outside the approved list.",
    "Uploads volumineux vers un stockage cloud hors liste approuvée."
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "scope", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Scope", "Scope", "Périmètre"),
      prompt: L("Wie eingrenzen?", "How do you scope?", "Comment cadrer ?"),
      options: [
        { id: "proxy_dlp", correct: true,  delta: +6, label: L("Proxy- + DLP-Logs korrelieren, Datentyp + Volumen + Empfänger-Tenant klassifizieren", "Correlate proxy + DLP logs, classify data type + volume + recipient tenant", "Corréler logs proxy + DLP, classifier type, volume et tenant destinataire") },
        { id: "block_first",correct: false, delta: -3, label: L("Cloud-Domain per CASB-Policy + Proxy-Block sofort sperren, Forensik im Anschluss", "Block the cloud domain immediately via CASB policy + proxy block, forensics afterwards", "Bloquer le domaine cloud via politique CASB + proxy, forensique ensuite") },
        { id: "ask_user",  correct: false, delta: -3, label: L("User per gesichertem Voice-Channel kontaktieren und Geschäftskontext der Uploads erfragen", "Contact user via secure voice channel and request business context for the uploads", "Contacter l'utilisateur via canal vocal sécurisé pour le contexte métier des uploads") },
      ],
    },
    {
      id: "stop", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Stoppen", "Stop", "Stopper"),
      prompt: L("Wie stoppen?", "How to stop?", "Comment stopper ?"),
      options: [
        { id: "isolate_revoke", correct: true,  delta: +7, label: L("Endpoint EDR-isolieren, OAuth-/Cloud-Tokens des Users revoken, Refresh-Tokens invalidieren", "EDR-isolate endpoint, revoke user's OAuth/cloud tokens, invalidate refresh tokens", "Isoler l'endpoint via EDR, révoquer les tokens OAuth/cloud, invalider les refresh tokens") },
        { id: "block_cloud",    correct: false, delta: -3, label: L("Cloud-Anbieter unternehmensweit per CASB + DNS-Policy blocken, Ausnahmen via Approval-Workflow", "Block the cloud provider company-wide via CASB + DNS policy, exceptions via approval workflow", "Bloquer le provider cloud via CASB + politique DNS, exceptions via workflow d'approbation") },
        { id: "rate_limit",     correct: false, delta: -3, label: L("Upload-Bandbreite des Users via QoS-Policy auf 50 kbps drosseln, Session bleibt offen", "Rate-limit the user's upload bandwidth via QoS policy to 50 kbps, session stays open", "Limiter la bande passante upload via QoS à 50 kbps, session maintenue") },
      ],
    },
    {
      id: "notify", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Meldung", "Notification", "Notification"),
      prompt: L("Wer wird benachrichtigt?", "Who is notified?", "Qui est notifié ?"),
      options: [
        { id: "dpo_legal", correct: true,  delta: +6, label: L("DPO + Legal einbinden, DSGVO-72h-Frist und betroffene Datenkategorien bewerten", "Loop DPO + Legal, assess GDPR 72h deadline and affected data categories", "Impliquer DPO + juridique, évaluer le délai RGPD 72h et catégories de données") },
        { id: "ciso_only", correct: false, delta: -3, label: L("CISO als zentrale Eskalation briefen, DPO nach Abschluss der Forensik einbinden", "Brief CISO as central escalation, loop DPO after forensics completes", "Briefer le CISO comme escalade centrale, DPO après clôture de la forensique") },
        { id: "wait_proof",correct: false, delta: -4, label: L("Beweissichere Bestätigung der Datenklassifizierung abwarten, dann formell an Aufsichtsbehörde melden", "Wait for evidence-grade confirmation of data classification, then formally notify the regulator", "Attendre une confirmation probante de la classification, puis signaler formellement au régulateur") },
      ],
    },
  ],
};

const PATCH: Incident = {
  id: "zero_day",
  tier: "hard",
  category: "vuln",
  title: L("0-Day im Edge-Gateway", "0-day in edge gateway", "0-day sur passerelle edge"),
  brief: L(
    "CISA / Hersteller meldet aktiv ausgenutzte Schwachstelle in eurem VPN-Gateway.",
    "CISA / vendor report an actively exploited flaw in your VPN gateway.",
    "CISA / fournisseur signalent une faille activement exploitée sur votre VPN."
  ),
  initialDelayMs: 8_000,
  steps: [
    {
      id: "compromise", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Kompromittierung prüfen", "Check compromise", "Vérifier compromission"),
      prompt: L("Wie prüfen?", "How do you check?", "Comment vérifier ?"),
      options: [
        { id: "ioc_hunt",  correct: true,  delta: +6, label: L("IOCs des Advisories über alle Logs jagen, Konfiguration auf Webshells + persistente Sessions prüfen", "Hunt advisory IOCs across logs, check config for webshells + persistent sessions", "Chasser les IOCs de l'advisory, vérifier la config pour webshells + sessions persistantes") },
        { id: "patch_now", correct: false, delta: -3, label: L("Hersteller-Patch sofort einspielen, Forensik-Snapshot für nachgelagerte Analyse archivieren", "Apply vendor patch immediately, archive a forensic snapshot for downstream analysis", "Appliquer le patch éditeur immédiatement, archiver un snapshot forensique pour analyse ultérieure") },
        { id: "trust_vendor",correct: false, delta: -3, label: L("Auf belastbare IOCs aus dem Hersteller-PSIRT warten, dann gezielt Hunting-Queries fahren", "Wait for solid IOCs from the vendor PSIRT, then run targeted hunting queries", "Attendre des IOCs solides du PSIRT éditeur, puis lancer des requêtes de hunting ciblées") },
      ],
    },
    {
      id: "mitigate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Mitigation", "Mitigate", "Mitigation"),
      prompt: L("Was tun?", "What do you do?", "Que faire ?"),
      options: [
        { id: "workaround", correct: true,  delta: +7, label: L("Hersteller-Workaround anwenden, Management-Interface auf Allowlist + MFA-Enforce", "Apply vendor workaround, allowlist management interface + enforce MFA", "Appliquer le workaround éditeur, allowlist du management + MFA imposé") },
        { id: "shut_vpn",   correct: false, delta: -3, label: L("VPN-Tunnel kontrolliert per Maintenance-Mode terminieren, alle aktiven Sessions invalidieren", "Gracefully terminate VPN tunnels via maintenance mode, invalidate all active sessions", "Terminer les tunnels VPN proprement via mode maintenance, invalider toutes les sessions") },
        { id: "block_external",correct: false, delta: -2, label: L("GeoIP-Filter aktivieren: nur Source-IPs aus DE/EU + bekannte Partner-ASNs erlauben", "Enable GeoIP filter: allow only source IPs from DE/EU + known partner ASNs", "Activer filtre GeoIP : autoriser uniquement IPs DE/UE + ASNs partenaires connus") },
      ],
    },
    {
      id: "patch", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Patchen", "Patch", "Patcher"),
      prompt: L("Wie patchen?", "How do you patch?", "Comment patcher ?"),
      options: [
        { id: "patch_verify", correct: true,  delta: +7, label: L("Patch in Wartungsfenster einspielen + IOC-Re-Hunt nach Patch zur Kompromittierungs-Verifikation", "Apply patch in maintenance window + re-hunt IOCs post-patch to verify no compromise", "Patcher dans la fenêtre de maintenance + re-hunt IOCs après patch pour vérification") },
        { id: "patch_blind",  correct: false, delta: -3, label: L("Patch als Hot-Fix produktiv per CI/CD-Pipeline ausrollen, Smoke-Tests parallel", "Roll out the patch as a hotfix to production via CI/CD pipeline, smoke tests in parallel", "Déployer le patch en hotfix via pipeline CI/CD, smoke tests en parallèle") },
        { id: "wait_window",  correct: false, delta: -4, label: L("Reguläres Patch-Fenster in 4 Wochen abwarten, Change-Management-Prozess vollständig durchlaufen", "Wait for the regular patch window in 4 weeks, complete the full change-management process", "Attendre la fenêtre régulière dans 4 semaines, processus complet de change management") },
      ],
    },
  ],
};

// ---------------- Comic-relief: the auditor visits ----------------
// These are intentionally light/funny but still teach a real point:
// the "correct" answer is the boring, professional one (have the doc ready).
// Music switches to "audit" mode (cheesy elevator) while one of these is active.

const AUDITOR: Incident = {
  id: "auditor_visit",
  tier: "comic",
  category: "governance",
  title: L("Der Prüfer kommt!", "The auditor is here!", "L'auditeur arrive !"),
  brief: L(
    "Externer ISO-Auditor steht unangekündigt im War-Room und will 'mal kurz reinschauen'.",
    "An external ISO auditor showed up unannounced and wants to 'just take a quick look'.",
    "Un auditeur ISO externe débarque sans prévenir et veut 'juste jeter un œil'."
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "greet", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Empfang", "Reception", "Accueil"),
      prompt: L("Wie reagieren?", "How do you react?", "Comment réagir ?"),
      options: [
        { id: "calm_pro",   correct: true,  delta: +6, label: L("Ruhig empfangen, Kaffee anbieten, Scope klären, Begleitperson stellen", "Welcome calmly, offer coffee, clarify scope, assign an escort", "Accueillir calmement, offrir un café, clarifier le périmètre, assigner un accompagnant") },
        { id: "hide_run",   correct: false, delta: -4, label: L("So tun, als wäre niemand da — Tür zu, Licht aus", "Pretend nobody is here — door shut, lights off", "Faire semblant qu'il n'y a personne — porte fermée, lumière éteinte") },
        { id: "blame_ciso", correct: false, delta: -3, label: L("Sofort dem CISO 'eskalieren', der soll das machen", "Immediately 'escalate' to the CISO, let them handle it", "Escalader tout de suite au CISO, qu'il s'en occupe") },
      ],
    },
    {
      id: "doc", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("Dokumentation", "Documentation", "Documentation"),
      prompt: L("Er will das ISMS-Dokument.", "They want the ISMS document.", "Il demande le document SMSI."),
      options: [
        { id: "show_doc",     correct: true,  delta: +7, label: L("Aktuelle, freigegebene Version aus dem ISMS-Tool zeigen", "Show the current, approved version from the ISMS tool", "Présenter la version actuelle approuvée depuis l'outil SMSI") },
        { id: "fake_pdf",     correct: false, delta: -5, label: L("Schnell ein PDF antedatieren — wer prüft schon das Datum?", "Quickly back-date a PDF — who really checks the date?", "Antidater vite un PDF — qui vérifie vraiment la date ?") },
        { id: "promise_send", correct: false, delta: -3, label: L("'Schicken wir per Mail nach' — und auf Wiedervorlage in 6 Monaten legen", "'We'll send it by email later' — and bury it for six months", "'On vous l'envoie par mail' — et l'oublier pendant six mois") },
      ],
    },
    {
      id: "finding", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Befund", "Finding", "Constat"),
      prompt: L("Er findet ein offenes Ticket seit 9 Monaten.", "They spot an open ticket from 9 months ago.", "Il repère un ticket ouvert depuis 9 mois."),
      options: [
        { id: "own_it",     correct: true,  delta: +6, label: L("Offen anerkennen, Risiko-Akzeptanz + Zieldatum vorlegen", "Acknowledge openly, present risk acceptance + target date", "Reconnaître ouvertement, présenter acceptation du risque + échéance") },
        { id: "blame_intern",correct: false, delta: -4, label: L("Auf den Praktikanten schieben, der nicht mehr da ist", "Blame the intern who isn't around anymore", "Mettre ça sur le stagiaire qui n'est plus là") },
        { id: "ticket_close",correct: false, delta: -5, label: L("Das Ticket schnell schließen, bevor er es notiert", "Quickly close the ticket before they write it down", "Fermer vite le ticket avant qu'il ne le note") },
      ],
    },
  ],
};

const FIRE_DRILL: Incident = {
  id: "fire_drill",
  tier: "comic",
  category: "governance",
  title: L("Brandschutzübung — jetzt?!", "Fire drill — right now?!", "Exercice incendie — maintenant ?!"),
  brief: L(
    "Lautsprecher: 'Alle Mitarbeiter bitte das Gebäude verlassen.' Mitten in der Schicht.",
    "PA system: 'All staff please leave the building.' Mid-shift.",
    "Haut-parleur : 'Tout le personnel évacue le bâtiment.' En pleine garde."
  ),
  initialDelayMs: 8_000,
  steps: [
    {
      id: "act", requiredRoom: "soc_floor", timeLimitMs: 18_000,
      title: L("Reaktion", "Reaction", "Réaction"),
      prompt: L("Was machst du?", "What do you do?", "Que fais-tu ?"),
      options: [
        { id: "handover",   correct: true,  delta: +6, label: L("On-Call-Übergabe an Backup-SOC dokumentieren, dann raus", "Document on-call handover to backup SOC, then leave", "Documenter le passage de relais au SOC de secours, puis sortir") },
        { id: "stay",       correct: false, delta: -5, label: L("Drinbleiben — 'der SIEM darf nicht unbeobachtet sein'", "Stay inside — 'the SIEM mustn't be unattended'", "Rester — 'on ne peut pas laisser le SIEM sans surveillance'") },
        { id: "panic_run",  correct: false, delta: -3, label: L("Sofort raus, alle Sessions offen lassen", "Run out immediately, leave all sessions open", "Sortir tout de suite, laisser toutes les sessions ouvertes") },
      ],
    },
  ],
};

const DPO_VISIT: Incident = {
  id: "dpo_visit",
  tier: "comic",
  category: "governance",
  title: L("Datenschutzbeauftragte vor der Tür", "Data Protection Officer at the door", "Le DPO frappe à la porte"),
  brief: L(
    "Die DPO will wissen, warum SIEM-Logs personenbezogene Daten enthalten — und wie lange ihr die aufhebt.",
    "The DPO wants to know why SIEM logs contain personal data — and how long you keep them.",
    "La DPO veut savoir pourquoi les logs SIEM contiennent des données personnelles — et combien de temps vous les gardez."
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "lawful_basis", requiredRoom: "ciso_office", timeLimitMs: 24_000,
      title: L("Rechtsgrundlage", "Lawful basis", "Base légale"),
      prompt: L("Wie begründest du die Verarbeitung?", "How do you justify the processing?", "Comment justifier le traitement ?"),
      options: [
        { id: "legit_interest", correct: true,  delta: +7, label: L("Berechtigtes Interesse (Art. 6(1)(f)) + dokumentierte Interessenabwägung zeigen", "Legitimate interest (Art. 6(1)(f)) + documented balancing test", "Intérêt légitime (Art. 6(1)(f)) + test de mise en balance documenté") },
        { id: "consent",        correct: false, delta: -4, label: L("Mit 'Einwilligung im Arbeitsvertrag' argumentieren", "Argue with 'consent in the employment contract'", "Argumenter avec 'consentement dans le contrat de travail'") },
        { id: "vague",          correct: false, delta: -3, label: L("'Wir machen das halt für die Sicherheit' — sie wird das verstehen", "'We just do it for security' — they'll understand", "'On le fait pour la sécurité' — elle comprendra") },
      ],
    },
    {
      id: "retention", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Aufbewahrung", "Retention", "Conservation"),
      prompt: L("Sie fragt nach der Löschfrist.", "She asks for the retention period.", "Elle demande la durée de conservation."),
      options: [
        { id: "policy_pointer", correct: true,  delta: +6, label: L("Auf das Log-Retention-Konzept verweisen: 90 Tage Hot, 12 Monate Cold, dann anonymisiert", "Point to the log retention policy: 90 days hot, 12 months cold, then anonymised", "Renvoyer à la politique : 90j chaud, 12 mois froid, puis anonymisé") },
        { id: "forever",        correct: false, delta: -5, label: L("'Wir behalten alles für immer — man weiß ja nie'", "'We keep everything forever — you never know'", "'On garde tout pour toujours — on ne sait jamais'") },
        { id: "delete_now",     correct: false, delta: -4, label: L("Schnell alle Logs der letzten 6 Monate löschen, bevor sie nachfragt", "Quickly delete the last 6 months of logs before she asks again", "Effacer vite les logs des 6 derniers mois avant qu'elle ne redemande") },
      ],
    },
    {
      id: "incident_log", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Vorfallregister", "Incident register", "Registre d'incidents"),
      prompt: L("Sie will einen Auszug aus dem Vorfallregister.", "She wants an excerpt from the incident register.", "Elle veut un extrait du registre d'incidents."),
      options: [
        { id: "show_register", correct: true,  delta: +6, label: L("Aktuelles Register zeigen, mit Bewertung 'meldepflichtig ja/nein' pro Vorfall", "Show the live register, with 'reportable yes/no' assessment per incident", "Présenter le registre vivant, avec évaluation 'à signaler oui/non'") },
        { id: "verbal_only",   correct: false, delta: -3, label: L("Mündlich zusammenfassen — 'wir haben das alles im Kopf'", "Summarise verbally — 'we keep all of it in our heads'", "Résumer à l'oral — 'on a tout ça en tête'") },
        { id: "filter_out",    correct: false, delta: -5, label: L("Nur die unkritischen Vorfälle exportieren, der Rest 'ist noch in Prüfung'", "Export only the harmless incidents, the rest is 'still under review'", "N'exporter que les incidents bénins, le reste est 'en cours d'examen'") },
      ],
    },
  ],
};

const COMPLIANCE_VISIT: Incident = {
  id: "compliance_visit",
  tier: "comic",
  category: "governance",
  title: L("Compliance schaut vorbei", "Compliance drops by", "La conformité passe vous voir"),
  brief: L(
    "Die interne Revision will spontan euren NIS-2-Reifegrad sehen. Mit Beweisen.",
    "Internal audit wants an unscheduled look at your NIS-2 maturity. With evidence.",
    "L'audit interne veut voir à l'improviste votre maturité NIS-2. Avec des preuves."
  ),
  initialDelayMs: 11_000,
  steps: [
    {
      id: "scope_meeting", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Scope-Meeting", "Scope meeting", "Cadrage"),
      prompt: L("Was bietest du an?", "What do you offer?", "Que proposes-tu ?"),
      options: [
        { id: "agenda",       correct: true,  delta: +6, label: L("Kurze Agenda + Themenliste vorschlagen, Termine pro Domain abstimmen", "Propose a short agenda + topic list, schedule slots per domain", "Proposer une agenda + liste de thèmes, créneaux par domaine") },
        { id: "open_bar",     correct: false, delta: -3, label: L("'Schaut euch alles an, was ihr wollt' — keine Struktur", "'Look at whatever you want' — no structure", "'Regardez tout ce que vous voulez' — sans structure") },
        { id: "delay_weeks",  correct: false, delta: -4, label: L("Auf 'in drei Wochen, da haben wir mehr Zeit' vertrösten", "Push it to 'three weeks from now, we'll have more time'", "Reporter à 'dans trois semaines, on aura plus de temps'") },
      ],
    },
    {
      id: "evidence", requiredRoom: "ciso_office", timeLimitMs: 24_000,
      title: L("Nachweise", "Evidence", "Preuves"),
      prompt: L("Sie wollen drei Stichproben.", "They want three samples.", "Ils veulent trois échantillons."),
      options: [
        { id: "live_export",  correct: true,  delta: +7, label: L("Live aus dem Compliance-Tool exportieren: Findings, Maßnahmen, Zieldaten", "Export live from the compliance tool: findings, actions, target dates", "Exporter en direct depuis l'outil : findings, actions, échéances") },
        { id: "screenshot",   correct: false, delta: -3, label: L("Screenshots aus alten Slides zusammensuchen — sieht ähnlich aus", "Cobble together screenshots from old slides — looks similar", "Bricoler des captures d'anciennes slides — ça se ressemble") },
        { id: "rewrite",      correct: false, delta: -5, label: L("Über Nacht ein paar Maßnahmen 'rückwirkend dokumentieren'", "Overnight, 'retroactively document' a few actions", "Documenter 'rétroactivement' quelques actions du jour au lendemain") },
      ],
    },
    {
      id: "gap", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Lücke", "Gap", "Écart"),
      prompt: L("Sie finden eine offene NIS-2-Pflicht.", "They find an open NIS-2 obligation.", "Ils trouvent une obligation NIS-2 ouverte."),
      options: [
        { id: "own_plan",   correct: true,  delta: +6, label: L("Lücke anerkennen, Maßnahme + verantwortliche Person + Zieldatum nennen", "Acknowledge the gap, name action + owner + target date", "Reconnaître l'écart, nommer action + responsable + échéance") },
        { id: "wordsmith", correct: false, delta: -4, label: L("Die Pflicht 'kreativ uminterpretieren' — vielleicht trifft sie uns gar nicht", "'Creatively reinterpret' the obligation — maybe it doesn't apply", "'Réinterpréter' l'obligation — peut-être qu'elle ne s'applique pas") },
        { id: "blame_it",   correct: false, delta: -5, label: L("Auf die IT zeigen — 'das ist nicht unser Bereich'", "Point at IT — 'that's not our area'", "Pointer vers l'IT — 'ce n'est pas notre domaine'") },
      ],
    },
  ],
};

// ---------------- Additional incidents — keep variety high ----------------

const MFA_BOMB: Incident = {
  id: "mfa_bombing",
  tier: "medium",
  category: "identity",
  title: L("MFA-Push-Bombing", "MFA push bombing", "MFA push bombing"),
  brief: L(
    "Ein User meldet 30 Push-Anfragen in 5 Minuten — eine davon hat er versehentlich akzeptiert.",
    "A user reports 30 push requests in 5 minutes — they accidentally accepted one.",
    "Un utilisateur signale 30 demandes push en 5 min — il en a accepté une par erreur."
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "validate", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Validieren", "Validate", "Valider"),
      prompt: L("Wie verifizieren?", "How do you verify?", "Comment vérifier ?"),
      options: [
        { id: "auth_review", correct: true,  delta: +6, label: L("Sign-in-Logs + IdP-Telemetrie prüfen, Source-IP/ASN/UA des erfolgreichen Logins korrelieren", "Review sign-in logs + IdP telemetry, correlate source IP/ASN/UA of the successful sign-in", "Examiner les sign-in logs + télémétrie IdP, corréler IP/ASN/UA du login réussi") },
        { id: "ask_user_only", correct: false, delta: -3, label: L("User per Telefon zur Beschreibung des Klicks befragen, Logs erst danach ziehen", "Phone the user to describe the tap, pull logs only afterwards", "Appeler l'utilisateur pour décrire le tap, logs ensuite") },
        { id: "trust_idp",  correct: false, delta: -4, label: L("Da MFA bestätigt wurde, als legitime Anmeldung klassifizieren und Ticket schließen", "Since MFA was confirmed, classify as legitimate sign-in and close the ticket", "MFA confirmé : classer comme login légitime et clôturer le ticket") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "revoke_sessions", correct: true,  delta: +7, label: L("Alle Sessions/Refresh-Tokens des Users revoken, Conditional-Access auf Re-Auth + bekannte Geräte zwingen", "Revoke all sessions/refresh tokens, force conditional access to re-auth + known devices", "Révoquer toutes sessions/refresh tokens, accès conditionnel forcé en ré-auth + appareils connus") },
        { id: "disable_user",    correct: false, delta: -3, label: L("Account komplett deaktivieren, User wartet auf Reset im IT-Service-Desk", "Disable the account entirely, user waits for reset at the service desk", "Désactiver le compte, l'utilisateur attend un reset au service desk") },
        { id: "wait_more",       correct: false, delta: -4, label: L("Erst die Forensik-Analyse abwarten, bevor man den User in seiner Arbeit stört", "Wait for forensic analysis before disrupting the user's work", "Attendre l'analyse forensique avant de perturber l'utilisateur") },
      ],
    },
    {
      id: "harden", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Härtung", "Harden", "Durcissement"),
      prompt: L("Was ändern?", "What do you change?", "Que changer ?"),
      options: [
        { id: "number_match",  correct: true,  delta: +6, label: L("Number-Matching + Geo/App-Kontext im IdP erzwingen, Push-Fatigue-Pattern alarmieren", "Enforce number-matching + geo/app context in IdP, alert on push-fatigue patterns", "Forcer number-matching + contexte géo/app dans l'IdP, alerter sur push-fatigue") },
        { id: "more_training", correct: false, delta: -2, label: L("Awareness-Mail an alle User schicken: 'bitte keine fremden Pushs akzeptieren'", "Send awareness mail to all users: 'please don't accept unknown pushes'", "Envoyer un mail de sensibilisation : 'ne pas accepter de pushs inconnus'") },
        { id: "remove_mfa",    correct: false, delta: -5, label: L("Push-MFA für den User auf SMS-OTP zurückstellen, da Push 'nicht zuverlässig' sei", "Downgrade user's push MFA to SMS OTP because push is 'unreliable'", "Rétrograder le MFA push en SMS OTP car le push est 'peu fiable'") },
      ],
    },
  ],
};

const OT_ANOMALY: Incident = {
  id: "ot_anomaly",
  tier: "hard",
  category: "network",
  title: L("OT-Anomalie an SPS", "OT anomaly on PLC", "Anomalie OT sur API"),
  brief: L(
    "Engineering meldet ungewöhnliche Schreibzugriffe auf eine SPS in der Produktion (IEC 62443 Zone 2).",
    "Engineering reports unusual write commands on a production PLC (IEC 62443 zone 2).",
    "L'ingénierie signale des écritures inhabituelles sur un API en production (zone IEC 62443 2)."
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie validieren — ohne Anlage zu stören?", "How do you validate — without disturbing the plant?", "Comment valider sans perturber l'usine ?"),
      options: [
        { id: "passive_capture", correct: true,  delta: +7, label: L("Passive PCAP via SPAN-Port der OT-Firewall, Modbus/S7-Funktionscodes mit Engineering abgleichen", "Passive PCAP via OT firewall SPAN port, cross-check Modbus/S7 function codes with engineering", "PCAP passive via port SPAN du firewall OT, croiser les codes fonction Modbus/S7 avec l'ingénierie") },
        { id: "active_scan",     correct: false, delta: -5, label: L("Schnellen aktiven Nmap-Scan auf das OT-Segment fahren, um den Host zu fingerprinten", "Run a quick active Nmap scan on the OT segment to fingerprint the host", "Lancer un scan Nmap actif sur le segment OT pour fingerprinter l'hôte") },
        { id: "ask_vendor",      correct: false, delta: -3, label: L("Erst auf Rückmeldung des SPS-Herstellers warten, bevor irgendetwas getan wird", "Wait for the PLC vendor's response before doing anything", "Attendre la réponse du fournisseur API avant d'agir") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "fw_acl",      correct: true,  delta: +7, label: L("OT-Firewall-Regel: nur Engineering-Workstation auf SPS, gemeinsam mit Schichtleitung freigeben", "OT firewall rule: only the engineering workstation onto the PLC, sign-off with shift lead", "Règle FW OT : seul le poste ingénierie vers l'API, validé avec le chef de quart") },
        { id: "shutdown_plc",correct: false, delta: -5, label: L("SPS umgehend stromlos schalten, um jeden weiteren Schreibzugriff zu verhindern", "Power off the PLC immediately to prevent any further writes", "Couper l'alimentation de l'API pour empêcher toute nouvelle écriture") },
        { id: "block_all_ot",correct: false, delta: -4, label: L("Komplettes OT-Segment vom IT-Netz trennen, inklusive Visualisierungs- und Historian-Verbindungen", "Cut the entire OT segment from IT, including HMI and historian links", "Couper tout le segment OT du réseau IT, y compris HMI et historian") },
      ],
    },
    {
      id: "coord", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Koordination", "Coordination", "Coordination"),
      prompt: L("Wer wird einbezogen?", "Who do you involve?", "Qui impliquer ?"),
      options: [
        { id: "ot_safety",  correct: true,  delta: +6, label: L("Schichtleitung + OT-Engineering + Safety informieren, Production-Impact gemeinsam bewerten", "Inform shift lead + OT engineering + safety, jointly assess production impact", "Informer chef de quart + ingénierie OT + safety, évaluer ensemble l'impact production") },
        { id: "it_only",    correct: false, delta: -3, label: L("Im IT-SOC bleiben — die OT-Welt 'kümmert sich selbst' um Produktionsthemen", "Keep it inside IT-SOC — OT 'handles its own' production topics", "Rester dans le SOC IT — l'OT 'gère' ses sujets de production") },
        { id: "press_first",correct: false, delta: -5, label: L("Frühzeitig die Pressestelle vorwarnen, bevor Engineering-Befund vorliegt", "Pre-warn the press office before engineering findings are in", "Prévenir le service presse avant les conclusions ingénierie") },
      ],
    },
  ],
};

const ROGUE_WIFI: Incident = {
  id: "rogue_wifi",
  tier: "easy",
  category: "network",
  title: L("Rogue Wi-Fi im Office", "Rogue Wi-Fi in the office", "Wi-Fi pirate au bureau"),
  brief: L(
    "WIDS meldet einen SSID-Klon eures Corporate-WLAN auf Etage 3.",
    "WIDS reports an SSID clone of your corporate Wi-Fi on floor 3.",
    "Le WIDS signale un clone du SSID corporate à l'étage 3."
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "locate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Lokalisieren", "Locate", "Localiser"),
      prompt: L("Wie lokalisieren?", "How do you locate?", "Comment localiser ?"),
      options: [
        { id: "triangulate", correct: true,  delta: +6, label: L("RSSI-Triangulation über die nächstgelegenen Corporate-APs, BSSID + Channel notieren", "RSSI-triangulate via the nearest corporate APs, note BSSID + channel", "Trianguler via RSSI sur les APs corporate proches, noter BSSID + canal") },
        { id: "deauth_now",  correct: false, delta: -3, label: L("Sofort gezielte Deauth-Frames gegen den Rogue-AP senden, ohne Standort zu kennen", "Immediately send targeted deauth frames against the rogue AP without knowing its location", "Envoyer immédiatement des deauth ciblés sans connaître l'emplacement") },
        { id: "ignore",      correct: false, delta: -4, label: L("Als bekannten False-Positive der WIDS-Engine schließen — die Heuristik lärmt oft", "Close as a known false positive of the WIDS engine — the heuristic often noises", "Clôturer en faux positif connu — l'heuristique fait du bruit") },
      ],
    },
    {
      id: "remove", requiredRoom: "soc_floor", timeLimitMs: 18_000,
      title: L("Entfernen", "Remove", "Retirer"),
      prompt: L("Was tun, wenn lokalisiert?", "What once located?", "Que faire une fois localisé ?"),
      options: [
        { id: "facilities", correct: true,  delta: +6, label: L("Mit Facility-Security gemeinsam abholen, Gerät als Beweismittel sichern, Etage informieren", "Pick it up with facility security, preserve as evidence, inform the floor", "Récupérer avec la sécurité des locaux, conserver comme preuve, informer l'étage") },
        { id: "smash",      correct: false, delta: -5, label: L("Gerät vor Ort sofort 'außer Gefecht setzen' — drauftreten, fertig", "On-site, just 'put it out of action' — step on it, done", "Sur place, le 'mettre hors-service' tout de suite — l'écraser, voilà") },
        { id: "leave_run",  correct: false, delta: -3, label: L("Stehen lassen und 24h Honeypot-Auswertung im Hintergrund laufen lassen", "Leave it running and run a 24h background honeypot analysis", "Le laisser tourner et faire 24h d'analyse honeypot en arrière-plan") },
      ],
    },
    {
      id: "users", requiredRoom: "ciso_office", timeLimitMs: 20_000,
      title: L("Userseite", "User side", "Côté utilisateurs"),
      prompt: L("Was kommunizieren?", "What do you communicate?", "Que communiquer ?"),
      options: [
        { id: "etage_brief", correct: true,  delta: +5, label: L("Kurze Etagen-Info: Geräte mit dem geklonten SSID prüfen, Zertifikat-Pin-Hinweis", "Brief floor note: check devices for the cloned SSID, mention cert-pinning", "Note d'étage : vérifier les appareils sur le SSID cloné, rappel du cert-pinning") },
        { id: "company_wide",correct: false, delta: -3, label: L("Unternehmensweite Panik-Mail mit Foto des Geräts an alle 4 000 Mitarbeiter ausspielen", "Company-wide panic mail with photo of the device to all 4,000 staff", "Mail panique à toute l'entreprise avec photo du dispositif à 4 000 personnes") },
        { id: "silent",      correct: false, delta: -2, label: L("Bewusst nichts kommunizieren — der Vorfall bleibt intern, fertig", "Deliberately communicate nothing — incident stays internal, done", "Volontairement ne rien communiquer — l'incident reste interne") },
      ],
    },
  ],
};

const CLOUD_BUCKET: Incident = {
  id: "open_bucket",
  tier: "medium",
  category: "vuln",
  title: L("Offener S3-Bucket", "Open S3 bucket", "Bucket S3 ouvert"),
  brief: L(
    "Ein Sicherheitsforscher meldet öffentlich lesbaren S3-Bucket mit Kunden-Exporten.",
    "A security researcher reports a publicly readable S3 bucket with customer exports.",
    "Un chercheur signale un bucket S3 lisible publiquement avec des exports clients."
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "cloudtrail", correct: true,  delta: +6, label: L("CloudTrail/Access-Logs prüfen: Wer hat gelesen, ab wann, welche Objekte, IP-/UA-Pattern", "Review CloudTrail/access logs: who read what, since when, which objects, IP/UA patterns", "Examiner CloudTrail/access logs : qui a lu quoi, depuis quand, quels objets, patterns IP/UA") },
        { id: "close_now",  correct: false, delta: -3, label: L("Bucket sofort komplett auf Private setzen, Logs später zur Aufarbeitung ziehen", "Immediately flip the bucket to private, pull logs for cleanup later", "Mettre le bucket en privé immédiatement, examiner les logs après") },
        { id: "ask_dev",    correct: false, delta: -4, label: L("Dev-Team über Slack fragen, ob der Bucket 'eigentlich öffentlich sein sollte'", "Ask the dev team on Slack whether the bucket 'should be public anyway'", "Demander à l'équipe dev sur Slack si le bucket 'devait être public'") },
      ],
    },
    {
      id: "remediate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Bereinigung", "Remediate", "Remédier"),
      prompt: L("Wie schließen?", "How do you close it?", "Comment fermer ?"),
      options: [
        { id: "block_public", correct: true,  delta: +7, label: L("Block-Public-Access auf Account-Ebene aktivieren, IAM/Bucket-Policy korrigieren, SCP nachziehen", "Enable Block-Public-Access at account level, fix IAM/bucket policy, tighten SCP", "Activer Block-Public-Access au niveau compte, corriger IAM/policy bucket, durcir SCP") },
        { id: "rename_only",  correct: false, delta: -3, label: L("Bucket umbenennen und an gleiche Stelle einen 'sauberen' anlegen, Daten umkopieren", "Rename the bucket and create a 'clean' one at the same path, copy data over", "Renommer le bucket et en créer un 'propre' au même chemin, copier les données") },
        { id: "url_obfuscate",correct: false, delta: -4, label: L("Den Bucket-Namen 'unauffindbar' machen (Random-Suffix), Zugriff über kurzem Pre-Signed-Link", "Make the bucket name 'unguessable' (random suffix), access via short pre-signed URL", "Rendre le nom 'introuvable' (suffixe aléatoire), accès via URL pré-signée courte") },
      ],
    },
    {
      id: "notify", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Meldung", "Notify", "Notifier"),
      prompt: L("Wer wird informiert?", "Who is informed?", "Qui informer ?"),
      options: [
        { id: "dpo_legal", correct: true,  delta: +6, label: L("DPO + Legal einbinden, DSGVO-72h-Frist prüfen, betroffene Datenkategorien klassifizieren", "Loop DPO + Legal, check GDPR 72h deadline, classify affected data categories", "Impliquer DPO + juridique, vérifier le délai RGPD 72h, classifier les données") },
        { id: "ciso_only", correct: false, delta: -3, label: L("Nur den CISO briefen, alles weitere nach finaler Forensik klären", "Brief only the CISO, everything else after final forensics", "Briefer uniquement le CISO, le reste après forensique finale") },
        { id: "no_proof",  correct: false, delta: -4, label: L("Da 'kein Beweis für Massendownload' vorliegt, vorerst gar nicht melden", "Since 'no proof of mass download' exists, do not notify for now", "Aucune preuve de téléchargement massif : ne pas notifier pour l'instant") },
      ],
    },
  ],
};

const POWER_OUTAGE: Incident = {
  id: "power_outage",
  tier: "comic",
  category: "governance",
  title: L("Stromausfall im RZ", "Power outage in the DC", "Coupure électrique au DC"),
  brief: L(
    "Facility ruft an: 'Kurze Wartung am USV-System geplant — sollten wir euch das vorher sagen?'",
    "Facilities calls: 'Quick UPS maintenance planned — should we tell you in advance?'",
    "Facilities appelle : 'Petite maintenance UPS — on aurait dû vous prévenir ?'"
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "react", requiredRoom: "war_room", timeLimitMs: 20_000,
      title: L("Reaktion", "Reaction", "Réaction"),
      prompt: L("Was machst du?", "What do you do?", "Que fais-tu ?"),
      options: [
        { id: "stop_freeze", correct: true,  delta: +7, label: L("Wartung sofort stoppen lassen, Change-Freeze + DR-Plan aktivieren, Auswirkungen prüfen", "Have maintenance halted now, activate change-freeze + DR plan, assess impact", "Faire stopper la maintenance, activer gel des changements + plan DR, évaluer l'impact") },
        { id: "let_it_run",  correct: false, delta: -5, label: L("'Macht mal' — Logs danach kontrollieren, Risiko ist überschaubar", "'Just do it' — review logs afterwards, risk is manageable", "'Allez-y' — vérifier les logs après, risque maîtrisable") },
        { id: "blame_loud",  correct: false, delta: -3, label: L("Lautstark in Teams beschweren, dass Facility 'wieder mal' nicht informiert", "Loudly vent in Teams that facilities 'as usual' didn't inform anyone", "Râler dans Teams contre facilities qui 'comme d'hab' n'a rien dit") },
      ],
    },
    {
      id: "comms", requiredRoom: "ciso_office", timeLimitMs: 18_000,
      title: L("Kommunikation", "Comms", "Communication"),
      prompt: L("Wer wird informiert?", "Who do you inform?", "Qui informer ?"),
      options: [
        { id: "noc_business", correct: true,  delta: +6, label: L("NOC + Business-Kontinuität + Service-Owner kurz und faktenbasiert informieren, Status-Page bereitstellen", "Brief NOC + business continuity + service owners briefly and factually, prepare status page", "Briefer NOC + continuité métier + owners de service brièvement, préparer la status page") },
        { id: "everyone",     correct: false, delta: -4, label: L("Mail an die gesamte Firma 'wir hatten beinahe einen Totalausfall'", "All-hands email 'we nearly had a total outage'", "Mail à toute l'entreprise 'on a failli avoir une panne totale'") },
        { id: "silent",       correct: false, delta: -3, label: L("Nichts sagen — wenn nichts passiert ist, hat es nie stattgefunden", "Say nothing — if nothing happened, it never happened", "Ne rien dire — s'il ne s'est rien passé, ça n'a jamais existé") },
      ],
    },
  ],
};

const DEEPFAKE_VOICE: Incident = {
  id: "deepfake_voice",
  tier: "comic",
  category: "email",
  title: L("Deepfake-Voicemail vom CFO", "Deepfake voicemail from the CFO", "Messagerie deepfake du CFO"),
  brief: L(
    "Der Treasurer bekommt eine Sprachnachricht: 'Hier CFO, bitte 480 k€ auf neue IBAN überweisen — dringend.'",
    "The treasurer gets a voice note: 'CFO here, please wire €480k to a new IBAN — urgent.'",
    "Le trésorier reçoit un vocal : 'Le CFO, virez 480 k€ sur ce nouvel IBAN — urgent.'"
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "verify", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie verifizieren?", "How do you verify?", "Comment vérifier ?"),
      options: [
        { id: "callback_known", correct: true,  delta: +7, label: L("Out-of-Band-Callback an die im Identitätsverzeichnis hinterlegte Nummer des CFO, 4-Augen-Bestätigung", "Out-of-band callback on the CFO's number from the identity directory, four-eyes confirmation", "Rappel out-of-band sur le numéro CFO de l'annuaire, confirmation à quatre yeux") },
        { id: "reply_voice",    correct: false, delta: -5, label: L("Per Sprachnachricht zurückantworten und die IBAN noch einmal vorlesen lassen", "Reply by voice note and have the IBAN read out again", "Répondre en vocal et faire relire l'IBAN") },
        { id: "trust_voice",    correct: false, delta: -5, label: L("Stimme klingt sehr echt — also Anweisung umsetzen, Compliance hinterher informieren", "Voice sounds very real — execute the instruction, inform compliance afterwards", "La voix paraît vraie — exécuter et informer la conformité après") },
      ],
    },
    {
      id: "stop", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Zahlung sichern", "Secure payment", "Sécuriser le paiement"),
      prompt: L("Falls schon initiiert?", "If already initiated?", "Si déjà lancé ?"),
      options: [
        { id: "bank_freeze", correct: true,  delta: +6, label: L("Sofort den Fraud-Desk der Bank kontaktieren, Treasury parallel den Auftrag stornieren lassen", "Call the bank fraud desk immediately, treasury cancels the order in parallel", "Contacter le fraud desk de la banque, le treasury annule en parallèle") },
        { id: "wait_swift",  correct: false, delta: -4, label: L("Auf SWIFT-Tracking warten und schauen, ob das Geld 'wiederkommt'", "Wait for SWIFT tracking to see if the money 'comes back'", "Attendre le tracking SWIFT pour voir si l'argent 'revient'") },
        { id: "send_again",  correct: false, delta: -5, label: L("Zur Sicherheit eine zweite Korrektur-Überweisung auf die 'echte' IBAN nachschicken", "For safety, send a second corrective wire to the 'real' IBAN", "Par sécurité, envoyer un second virement correctif vers le 'vrai' IBAN") },
      ],
    },
    {
      id: "policy", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Lehre & Policy", "Lesson & policy", "Leçon & politique"),
      prompt: L("Was härtest du?", "What do you harden?", "Que renforcer ?"),
      options: [
        { id: "voice_policy", correct: true,  delta: +6, label: L("Sprach-/Video-Anweisungen für Zahlungen verbieten, Out-of-Band-Callback-Pflicht in Zahlungspolicy verankern", "Ban voice/video-only payment instructions, codify out-of-band callback in the payment policy", "Interdire les instructions de paiement vocales/vidéo, inscrire le rappel out-of-band dans la policy") },
        { id: "ai_detector",  correct: false, delta: -3, label: L("Einen 'Deepfake-Detektor' einkaufen und damit alle Sprachnachrichten automatisch prüfen lassen", "Buy a 'deepfake detector' and auto-screen all voice notes through it", "Acheter un 'détecteur de deepfake' et filtrer tous les vocaux automatiquement") },
        { id: "no_change",    correct: false, delta: -4, label: L("Keine Policy-Änderung — der Fall war ja zum Glück verhindert worden", "No policy change — luckily the case was avoided", "Pas de changement de policy — le cas a été évité, c'est bon") },
      ],
    },
  ],
};

export const INCIDENTS: Incident[] = [
  PHISHING, RANSOMWARE, DDOS, INSIDER, BEC,
  LATERAL, C2, CRED_DUMP, SUPPLY, EXFIL, PATCH,
  MFA_BOMB, OT_ANOMALY, ROGUE_WIFI, CLOUD_BUCKET,
  AUDITOR, FIRE_DRILL, DPO_VISIT, COMPLIANCE_VISIT,
  POWER_OUTAGE, DEEPFAKE_VOICE,
];

/** Comic-relief incidents trigger the cheesy "audit" music mode. */
export const COMIC_INCIDENT_IDS = new Set<string>([
  "auditor_visit", "fire_drill", "dpo_visit", "compliance_visit",
  "power_outage", "deepfake_voice",
]);
