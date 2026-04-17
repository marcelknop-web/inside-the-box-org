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
        { id: "graph",        correct: true,  delta: +6, label: L("Anmeldeverläufe quer über die Konten korrelieren und Angriffspfade durch das Netz nachzeichnen", "Correlate sign-in trails across accounts and map attack paths through the network", "Corréler les traces d'authentification sur tous les comptes et cartographier les chemins d'attaque dans le réseau") },
        { id: "endpoint_only",correct: false, delta: -3, label: L("Nur den ursprünglichen Endpoint tief analysieren, das Umfeld später anschauen", "Deep-dive only the origin endpoint, look at the surroundings later", "Analyser à fond uniquement l'endpoint d'origine, examiner l'environnement plus tard") },
        { id: "ask_user",     correct: false, delta: -3, label: L("Den User direkt fragen, ob er sich an ungewöhnliche Anmeldungen erinnert", "Just ask the user if they remember any unusual sign-ins", "Demander à l'utilisateur s'il se souvient de connexions inhabituelles") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "isolate_set", correct: true,  delta: +7, label: L("Alle betroffenen Hosts isolieren, Service-Konten und privilegierte Sitzungen sperren", "Isolate all affected hosts, disable service accounts and privileged sessions", "Isoler tous les hôtes affectés, désactiver les comptes de service et les sessions privilégiées") },
        { id: "isolate_one", correct: false, delta: -3, label: L("Nur den ersten Host isolieren, die anderen nur enger überwachen", "Isolate only the first host, just monitor the others more tightly", "Isoler uniquement le premier hôte, surveiller les autres de plus près") },
        { id: "block_smb",   correct: false, delta: -2, label: L("Datei-Freigaben im gesamten Server-Segment pauschal blocken, Kollateralschaden in Kauf nehmen", "Blanket-block file sharing across the whole server segment, accept collateral damage", "Bloquer en bloc le partage de fichiers sur tout le segment serveur, accepter les collatéraux") },
      ],
    },
    {
      id: "creds", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Credentials", "Credentials", "Identifiants"),
      prompt: L("Was tun mit Konten?", "What about accounts?", "Que faire des comptes ?"),
      options: [
        { id: "rotate_tier", correct: true,  delta: +7, label: L("Die hochprivilegierten Konten und zentralen Verzeichnis-Geheimnisse zweifach rotieren, Service-Konten zwingend zurücksetzen", "Rotate the highly privileged accounts and the directory's core secrets twice, force a reset of service accounts", "Faire tourner deux fois les comptes très privilégiés et les secrets centraux de l'annuaire, réinitialiser les comptes de service") },
        { id: "rotate_all",  correct: false, delta: -3, label: L("Unternehmensweit alle User zum Passwortwechsel bei der nächsten Anmeldung zwingen", "Force every user company-wide to change their password at next sign-in", "Forcer tous les utilisateurs à changer leur mot de passe à la prochaine connexion") },
        { id: "rotate_one",  correct: false, delta: -3, label: L("Nur den kompromittierten User zurücksetzen, MFA neu einrichten, Sitzungen beenden", "Reset only the compromised user, re-enroll MFA, end the sessions", "Réinitialiser uniquement l'utilisateur compromis, ré-enrôler le MFA, couper les sessions") },
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
        { id: "ti_lookup",  correct: true,  delta: +6, label: L("Threat-Intel zur Domain abfragen, Beacon-Takt prüfen und betroffene Hosts auflisten", "Look up threat intel on the domain, check the beacon cadence and list the affected hosts", "Interroger la threat intel sur le domaine, vérifier le rythme du beacon et lister les hôtes affectés") },
        { id: "block_dns",  correct: false, delta: -3, label: L("Die Domain per DNS umleiten und für später Verkehrsdaten archivieren", "Redirect the domain via DNS and archive traffic data for later analysis", "Rediriger le domaine via DNS et archiver les données de trafic pour plus tard") },
        { id: "wait",       correct: false, delta: -4, label: L("24 Stunden nur beobachten, dann auf Basis der Aufzeichnungen entscheiden", "Just observe for 24 hours, then decide based on the recordings", "Observer 24h, puis décider sur la base des enregistrements") },
      ],
    },
    {
      id: "block", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Blockieren", "Block", "Bloquer"),
      prompt: L("Wo blocken?", "Where do you block?", "Où bloquer ?"),
      options: [
        { id: "fw_proxy",   correct: true,  delta: +7, label: L("Domain und IPs an Firewall, Proxy und DNS blocken, Indikatoren ans EDR ausspielen", "Block domain and IPs at firewall, proxy and DNS, push the indicators to EDR", "Bloquer le domaine et les IPs au firewall, proxy et DNS, pousser les indicateurs à l'EDR") },
        { id: "edr_only",   correct: false, delta: -3, label: L("Nur datei-bezogene Indikatoren im EDR sperren, das Netz unverändert lassen", "Only blacklist file-related indicators in EDR, leave the network as-is", "Bloquer seulement les indicateurs fichiers dans l'EDR, laisser le réseau inchangé") },
        { id: "block_outb", correct: false, delta: -2, label: L("Den gesamten ausgehenden Verkehr des Hosts kappen, auch legitime Verbindungen", "Cut all outbound traffic from the host, including legitimate connections", "Couper tout le trafic sortant de l'hôte, y compris les connexions légitimes") },
      ],
    },
    {
      id: "remediate", requiredRoom: "forensics", timeLimitMs: 22_000,
      title: L("Bereinigung", "Remediate", "Remédiation"),
      prompt: L("Wie bereinigen?", "How to remediate?", "Comment remédier ?"),
      options: [
        { id: "image_reimage", correct: true,  delta: +7, label: L("Host abbilden, gezielt nach Persistenz suchen und anschließend sauber neu aufsetzen", "Image the host, hunt persistence systematically, then reimage cleanly", "Imager l'hôte, chercher la persistance méthodiquement, puis réinstaller proprement") },
        { id: "av_scan",       correct: false, delta: -3, label: L("Mehrere Virenscanner offline drüber laufen lassen und auf das Ergebnis vertrauen", "Run several AV scanners offline and trust the result", "Lancer plusieurs antivirus hors-ligne et faire confiance au résultat") },
        { id: "kill_proc",     correct: false, delta: -3, label: L("Nur den Beacon-Prozess beenden und Auto-Start-Einträge bereinigen, Host weiternutzen", "Just kill the beacon process and clean up auto-start entries, keep using the host", "Terminer juste le processus du beacon et nettoyer les auto-runs, garder l'hôte") },
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
        { id: "process_tree", correct: true,  delta: +6, label: L("Prozess-Stammbaum und Werkzeug-Signaturen prüfen, typische Credential-Dump-Muster suchen", "Check the process tree and tool signatures, look for typical credential-dump patterns", "Examiner l'arbre de processus et les signatures d'outils, chercher des patterns typiques de dump") },
        { id: "ask_admin",    correct: false, delta: -3, label: L("Den Admin direkt anrufen und einen legitimen Wartungsgrund bestätigen lassen", "Call the admin directly and have them confirm a legitimate maintenance reason", "Appeler l'admin et lui faire confirmer un motif de maintenance légitime") },
        { id: "trust_av",     correct: false, delta: -4, label: L("Wenn EDR und Antivirus still bleiben, als Fehlalarm einstufen", "If EDR and antivirus stay silent, classify as false positive", "Si EDR et antivirus restent silencieux, classer en faux positif") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Isolieren", "Isolate", "Isoler"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "edr_isolate", correct: true,  delta: +7, label: L("Workstation isolieren, alle Admin-Sitzungen beenden, vergebene Tickets/Token verfallen lassen", "Isolate the workstation, end all admin sessions, expire any issued tickets/tokens", "Isoler le poste, terminer toutes les sessions admin, faire expirer les tickets/tokens émis") },
        { id: "shutdown",    correct: false, delta: -3, label: L("Workstation sauber herunterfahren, das Image im nächsten Schritt ziehen", "Cleanly shut down the workstation, take the image in the next step", "Éteindre proprement le poste, image disque à l'étape suivante") },
        { id: "user_logoff", correct: false, delta: -3, label: L("Nur die Admin-Sitzung beenden, das Gerät bleibt im Netz für Live-Forensik", "Just end the admin session, keep the machine on the network for live forensics", "Terminer juste la session admin, laisser la machine en ligne pour forensique live") },
      ],
    },
    {
      id: "rotate", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Rotieren", "Rotate", "Rotation"),
      prompt: L("Welche Konten?", "Which accounts?", "Quels comptes ?"),
      options: [
        { id: "all_admin",  correct: true,  delta: +7, label: L("Alle auf dem Host genutzten privilegierten und Service-Konten rotieren, gemanagte Passwörter erneuern", "Rotate every privileged and service account used on the host, renew managed passwords", "Faire tourner tous les comptes privilégiés et de service utilisés sur l'hôte, renouveler les mots de passe gérés") },
        { id: "owner_only", correct: false, delta: -3, label: L("Nur das Konto des betroffenen Admins rotieren, MFA neu einrichten, Sitzungen beenden", "Rotate only the affected admin's account, re-enroll MFA, end sessions", "Faire tourner uniquement le compte de l'admin concerné, ré-enrôler MFA, couper les sessions") },
        { id: "schedule",   correct: false, delta: -3, label: L("Die Rotation in das nächste reguläre Wartungsfenster verschieben", "Defer the rotation to the next regular maintenance window", "Reporter la rotation à la prochaine fenêtre de maintenance régulière") },
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
        { id: "cmdb_query",  correct: true,  delta: +6, label: L("Asset-Inventar und EDR nach Version und Hash der betroffenen Komponente abfragen, Software-Stückliste abgleichen", "Query the asset inventory and EDR for version and hash of the affected component, cross-check the software bill of materials", "Interroger l'inventaire et l'EDR pour version et hash du composant, croiser avec la nomenclature logicielle") },
        { id: "ask_owners",  correct: false, delta: -3, label: L("Jeden System-Owner einzeln per Ticket nach der laufenden Version fragen", "Ticket every system owner individually for the deployed version", "Demander à chaque propriétaire système la version déployée via ticket") },
        { id: "wait_advisory",correct: false, delta: -4, label: L("Auf das ausführliche Hersteller-Advisory mit Indikatoren-Liste warten, dann handeln", "Wait for the detailed vendor advisory with the indicator list, then act", "Attendre l'advisory détaillé du fournisseur avec la liste d'indicateurs, puis agir") },
      ],
    },
    {
      id: "block", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Sofort-Mitigation", "Immediate mitigation", "Mitigation immédiate"),
      prompt: L("Was tun?", "What do you do?", "Que faire ?"),
      options: [
        { id: "isolate_block", correct: true,  delta: +7, label: L("Betroffene Hosts isolieren, Update-Server und Indikatoren an Firewall und Proxy blocken", "Isolate affected hosts, block the update server and indicators at firewall and proxy", "Isoler les hôtes affectés, bloquer le serveur d'update et les indicateurs au firewall et proxy") },
        { id: "uninstall_all", correct: false, delta: -3, label: L("Die Komponente überall sofort deinstallieren, einschließlich Produktion", "Uninstall the component everywhere immediately, including production", "Désinstaller le composant partout immédiatement, y compris en production") },
        { id: "patch_now",     correct: false, delta: -3, label: L("Den nächsten Hersteller-Patch sofort über alle Stages ausrollen, ohne IOC-Hunt", "Roll out the next vendor patch across all stages immediately, with no indicator hunt", "Déployer le prochain patch du fournisseur sur toutes les stages, sans recherche d'indicateurs") },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("An wen reporten?", "Who do you report to?", "À qui reporter ?"),
      options: [
        { id: "ciso_legal", correct: true,  delta: +6, label: L("CISO, Legal und Datenschutz informieren, Meldepflichten nach NIS-2/DORA prüfen", "Inform CISO, Legal and the DPO, check notification duties under NIS-2/DORA", "Informer CISO, juridique et DPO, vérifier les obligations NIS-2/DORA") },
        { id: "ciso_only",  correct: false, delta: -2, label: L("Nur den CISO briefen, Legal und Datenschutz erst nach der Impact-Bewertung einbinden", "Brief only the CISO, loop in Legal and the DPO after the impact assessment", "Briefer uniquement le CISO, impliquer juridique et DPO après l'évaluation d'impact") },
        { id: "wait_impact",correct: false, delta: -4, label: L("Erst harte Impact-Zahlen sammeln, dann formell melden", "Gather hard impact numbers first, then notify formally", "Collecter d'abord des chiffres d'impact concrets, puis notifier formellement") },
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
        { id: "proxy_dlp", correct: true,  delta: +6, label: L("Proxy- und DLP-Logs zusammenführen, Datentyp, Volumen und Empfänger klar bestimmen", "Combine proxy and DLP logs, clearly determine data type, volume and recipient", "Croiser logs proxy et DLP, déterminer clairement type, volume et destinataire") },
        { id: "block_first",correct: false, delta: -3, label: L("Den Cloud-Dienst sofort sperren und die Forensik erst danach machen", "Block the cloud service immediately and do the forensics later", "Bloquer le service cloud immédiatement, forensique ensuite") },
        { id: "ask_user",  correct: false, delta: -3, label: L("Den User direkt fragen, ob es einen Geschäftsgrund für die Uploads gibt", "Just ask the user if there's a business reason for the uploads", "Demander à l'utilisateur s'il y a une raison métier pour ces uploads") },
      ],
    },
    {
      id: "stop", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Stoppen", "Stop", "Stopper"),
      prompt: L("Wie stoppen?", "How to stop?", "Comment stopper ?"),
      options: [
        { id: "isolate_revoke", correct: true,  delta: +7, label: L("Endgerät isolieren, Cloud-Token des Users widerrufen, Sitzungen verfallen lassen", "Isolate the endpoint, revoke the user's cloud tokens, expire sessions", "Isoler l'endpoint, révoquer les tokens cloud de l'utilisateur, faire expirer les sessions") },
        { id: "block_cloud",    correct: false, delta: -3, label: L("Den ganzen Cloud-Anbieter unternehmensweit sperren, Ausnahmen über einen Antrag", "Block the entire cloud provider company-wide, exceptions via request workflow", "Bloquer tout le provider cloud à l'échelle de l'entreprise, exceptions sur demande") },
        { id: "rate_limit",     correct: false, delta: -3, label: L("Nur die Upload-Bandbreite des Users drosseln, die Sitzung läuft weiter", "Just throttle the user's upload bandwidth, leave the session running", "Limiter seulement la bande passante de l'utilisateur, laisser la session ouverte") },
      ],
    },
    {
      id: "notify", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Meldung", "Notification", "Notification"),
      prompt: L("Wer wird benachrichtigt?", "Who is notified?", "Qui est notifié ?"),
      options: [
        { id: "dpo_legal", correct: true,  delta: +6, label: L("Datenschutz und Legal einbinden, 72-Stunden-Frist und betroffene Datenkategorien bewerten", "Loop the DPO and Legal, assess the 72h deadline and affected data categories", "Impliquer DPO et juridique, évaluer le délai de 72h et les catégories de données") },
        { id: "ciso_only", correct: false, delta: -3, label: L("Nur den CISO briefen, Datenschutz erst nach der Forensik einbinden", "Brief only the CISO, loop in the DPO after forensics is done", "Briefer uniquement le CISO, impliquer le DPO après la forensique") },
        { id: "wait_proof",correct: false, delta: -4, label: L("Auf einen vollständigen Beweis der Datenkategorie warten, dann formell melden", "Wait for full evidence of the data category, then notify formally", "Attendre une preuve complète de la catégorie de données, puis notifier formellement") },
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
        { id: "ioc_hunt",  correct: true,  delta: +6, label: L("Mit den Indikatoren des Advisories durch alle Logs jagen und die Konfiguration auf hinterlegte Hintertüren prüfen", "Hunt the advisory's indicators across all logs and check the configuration for backdoors that may have been planted", "Chasser les indicateurs de l'advisory dans tous les logs et examiner la configuration à la recherche de portes dérobées") },
        { id: "patch_now", correct: false, delta: -3, label: L("Den Hersteller-Patch sofort einspielen und Beweise erst danach sichern", "Apply the vendor patch immediately and preserve evidence afterwards", "Appliquer le patch immédiatement et préserver les preuves après") },
        { id: "trust_vendor",correct: false, delta: -3, label: L("Auf belastbare Indikatoren vom Hersteller warten und bis dahin nichts tun", "Wait for solid indicators from the vendor and do nothing in the meantime", "Attendre des indicateurs solides du fournisseur et ne rien faire entre-temps") },
      ],
    },
    {
      id: "mitigate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Mitigation", "Mitigate", "Mitigation"),
      prompt: L("Was tun?", "What do you do?", "Que faire ?"),
      options: [
        { id: "workaround", correct: true,  delta: +7, label: L("Empfohlenen Workaround anwenden, das Management-Interface auf eine Allowlist setzen und MFA erzwingen", "Apply the recommended workaround, restrict the management interface to an allowlist and enforce MFA", "Appliquer le workaround recommandé, restreindre l'interface d'administration à une allowlist et imposer le MFA") },
        { id: "shut_vpn",   correct: false, delta: -3, label: L("Die VPN-Tunnel kontrolliert beenden und alle aktiven Sitzungen verfallen lassen", "Cleanly terminate the VPN tunnels and expire all active sessions", "Terminer proprement les tunnels VPN et faire expirer toutes les sessions actives") },
        { id: "block_external",correct: false, delta: -2, label: L("Nur ausgewählte Länder am Edge zulassen, alle anderen Quellen blocken", "Only allow selected countries at the edge, block everything else", "N'autoriser que certains pays au edge, bloquer tout le reste") },
      ],
    },
    {
      id: "patch", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Patchen", "Patch", "Patcher"),
      prompt: L("Wie patchen?", "How do you patch?", "Comment patcher ?"),
      options: [
        { id: "patch_verify", correct: true,  delta: +7, label: L("Im Wartungsfenster patchen und danach nochmals mit den Indikatoren prüfen, ob etwas hängengeblieben ist", "Patch in the maintenance window and re-hunt the indicators afterwards to verify nothing remained", "Patcher dans la fenêtre de maintenance et relancer la chasse d'indicateurs après pour vérifier qu'il ne reste rien") },
        { id: "patch_blind",  correct: false, delta: -3, label: L("Den Patch direkt als Hot-Fix in die Produktion ausrollen, Tests parallel", "Roll out the patch as a hotfix straight to production, tests in parallel", "Déployer le patch en hotfix directement en production, tests en parallèle") },
        { id: "wait_window",  correct: false, delta: -4, label: L("Auf das reguläre Patch-Fenster in vier Wochen warten und den vollen Change-Prozess durchlaufen", "Wait for the regular patch window in four weeks and run the full change process", "Attendre la fenêtre régulière dans quatre semaines et faire tourner le processus de change complet") },
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
        { id: "auth_review", correct: true,  delta: +6, label: L("Anmeldeprotokolle und Identitäts-Telemetrie prüfen, Quelle und Geräte-Kontext der erfolgreichen Anmeldung abgleichen", "Review sign-in logs and identity telemetry, correlate source and device context of the successful sign-in", "Examiner les sign-in logs et la télémétrie d'identité, corréler la source et le contexte d'appareil de la connexion réussie") },
        { id: "ask_user_only", correct: false, delta: -3, label: L("Den User anrufen und sich den Klick beschreiben lassen, Logs erst danach", "Call the user and have them describe the tap, pull logs afterwards", "Appeler l'utilisateur et lui faire décrire le tap, logs ensuite") },
        { id: "trust_idp",  correct: false, delta: -4, label: L("Da MFA bestätigt wurde, als legitime Anmeldung einstufen und das Ticket schließen", "Since MFA was confirmed, classify as legitimate sign-in and close the ticket", "MFA confirmé : classer comme login légitime et clôturer le ticket") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "revoke_sessions", correct: true,  delta: +7, label: L("Alle Sitzungen des Users beenden und Re-Anmeldung nur von bekannten Geräten erzwingen", "End all of the user's sessions and force re-authentication only from known devices", "Couper toutes les sessions de l'utilisateur et forcer la ré-authentification uniquement depuis les appareils connus") },
        { id: "disable_user",    correct: false, delta: -3, label: L("Den Account komplett deaktivieren, der User wartet beim Service-Desk auf einen Reset", "Disable the account entirely, the user waits at the service desk for a reset", "Désactiver complètement le compte, l'utilisateur attend un reset au service desk") },
        { id: "wait_more",       correct: false, delta: -4, label: L("Erst die Forensik abwarten, bevor man dem User irgendetwas aufzwingt", "Wait for the forensic analysis before forcing anything on the user", "Attendre l'analyse forensique avant d'imposer quoi que ce soit à l'utilisateur") },
      ],
    },
    {
      id: "harden", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Härtung", "Harden", "Durcissement"),
      prompt: L("Was ändern?", "What do you change?", "Que changer ?"),
      options: [
        { id: "number_match",  correct: true,  delta: +6, label: L("MFA so umstellen, dass der User eine Zahl bestätigen muss, und Standort plus App-Kontext einfließen lassen", "Switch MFA to require a number match and factor in location and app context", "Passer le MFA en mode 'number-matching' et intégrer le contexte de localisation et d'application") },
        { id: "more_training", correct: false, delta: -2, label: L("Eine Awareness-Mail an alle schicken: 'bitte keine fremden Pushs akzeptieren'", "Blast an awareness mail to everyone: 'please don't accept unknown pushes'", "Envoyer un mail de sensibilisation à tous : 'ne pas accepter de pushs inconnus'") },
        { id: "remove_mfa",    correct: false, delta: -5, label: L("Den User von Push auf SMS umstellen, weil Push 'unzuverlässig' sei", "Downgrade the user from push to SMS because push is 'unreliable'", "Rétrograder l'utilisateur du push au SMS parce que le push est 'peu fiable'") },
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
        { id: "passive_capture", correct: true,  delta: +7, label: L("Verkehr passiv mitschneiden und die beobachteten Steuerbefehle gemeinsam mit dem Engineering bewerten", "Capture traffic passively and assess the observed control commands together with engineering", "Capturer le trafic en passif et évaluer les commandes observées avec l'ingénierie") },
        { id: "active_scan",     correct: false, delta: -5, label: L("Schnell aktiv durch das OT-Netz scannen, um den Host zu identifizieren", "Run a quick active scan through the OT network to identify the host", "Lancer un scan actif rapide sur le réseau OT pour identifier l'hôte") },
        { id: "ask_vendor",      correct: false, delta: -3, label: L("Erst auf eine Rückmeldung des SPS-Herstellers warten, bevor irgendetwas passiert", "Wait for the PLC vendor's response before doing anything at all", "Attendre la réponse du fournisseur API avant la moindre action") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "fw_acl",      correct: true,  delta: +7, label: L("Firewall-Regel im OT-Netz so anpassen, dass nur die Engineering-Workstation zur SPS spricht — gemeinsam mit der Schichtleitung freigegeben", "Tighten the OT firewall so only the engineering workstation can talk to the PLC — signed off with the shift lead", "Restreindre la règle FW OT pour que seul le poste d'ingénierie puisse parler à l'API — validé avec le chef de quart") },
        { id: "shutdown_plc",correct: false, delta: -5, label: L("Die SPS sofort stromlos schalten, um jede weitere Schreibaktion zu verhindern", "Power off the PLC immediately to prevent any further write actions", "Couper l'alimentation de l'API pour empêcher toute écriture supplémentaire") },
        { id: "block_all_ot",correct: false, delta: -4, label: L("Das gesamte OT-Netz von der IT trennen, einschließlich Visualisierung und Datenarchiv", "Cut the entire OT network from IT, including HMI and historian", "Couper tout le réseau OT de l'IT, y compris HMI et historian") },
      ],
    },
    {
      id: "coord", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Koordination", "Coordination", "Coordination"),
      prompt: L("Wer wird einbezogen?", "Who do you involve?", "Qui impliquer ?"),
      options: [
        { id: "ot_safety",  correct: true,  delta: +6, label: L("Schichtleitung, OT-Engineering und Arbeitssicherheit informieren und die Auswirkungen auf die Produktion gemeinsam bewerten", "Inform shift lead, OT engineering and safety, and jointly assess the production impact", "Informer le chef de quart, l'ingénierie OT et la safety, évaluer ensemble l'impact production") },
        { id: "it_only",    correct: false, delta: -3, label: L("Im IT-SOC bleiben — die Produktion regelt das schon selbst", "Keep it inside the IT-SOC — production will sort it out themselves", "Rester dans le SOC IT — la production s'en occupera elle-même") },
        { id: "press_first",correct: false, delta: -5, label: L("Frühzeitig die Pressestelle vorwarnen, bevor das Engineering überhaupt einen Befund hat", "Pre-warn the press office before engineering even has a finding", "Prévenir le service presse avant même que l'ingénierie n'ait un constat") },
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
        { id: "triangulate", correct: true,  delta: +6, label: L("Über die Signalstärke an den nächstgelegenen Access-Points triangulieren und die Geräte-Identität festhalten", "Triangulate via signal strength on the nearest corporate access points and record the device identity", "Trianguler via la puissance du signal sur les bornes Wi-Fi corporate proches et noter l'identité du dispositif") },
        { id: "deauth_now",  correct: false, delta: -3, label: L("Sofort gezielt den fremden Access-Point stören, ohne den Standort zu kennen", "Immediately jam the rogue access point without knowing where it is", "Brouiller immédiatement le point d'accès pirate sans connaître son emplacement") },
        { id: "ignore",      correct: false, delta: -4, label: L("Als bekannten Fehlalarm der WIDS-Engine schließen — die meldet öfter solche Muster", "Close as a known WIDS false positive — the engine often noises like this", "Clôturer en faux positif connu — l'engine WIDS bruite souvent ainsi") },
      ],
    },
    {
      id: "remove", requiredRoom: "soc_floor", timeLimitMs: 18_000,
      title: L("Entfernen", "Remove", "Retirer"),
      prompt: L("Was tun, wenn lokalisiert?", "What once located?", "Que faire une fois localisé ?"),
      options: [
        { id: "facilities", correct: true,  delta: +6, label: L("Gemeinsam mit dem Werkschutz abholen, das Gerät als Beweis sichern und die Etage informieren", "Pick it up together with site security, preserve the device as evidence and inform the floor", "Récupérer avec la sécurité du site, conserver le dispositif comme preuve et informer l'étage") },
        { id: "smash",      correct: false, delta: -5, label: L("Vor Ort einfach drauftreten und das Gerät unbrauchbar machen", "Just step on it on the spot and render the device unusable", "Sur place, l'écraser tout de suite pour le rendre inutilisable") },
        { id: "leave_run",  correct: false, delta: -3, label: L("Stehen lassen und 24 Stunden im Hintergrund als Honeypot beobachten", "Leave it running and observe it as a honeypot in the background for 24 hours", "Le laisser tourner et l'observer en arrière-plan comme honeypot pendant 24h") },
      ],
    },
    {
      id: "users", requiredRoom: "ciso_office", timeLimitMs: 20_000,
      title: L("Userseite", "User side", "Côté utilisateurs"),
      prompt: L("Was kommunizieren?", "What do you communicate?", "Que communiquer ?"),
      options: [
        { id: "etage_brief", correct: true,  delta: +5, label: L("Kurze, sachliche Info an die betroffene Etage: Geräte prüfen und Hinweis auf das geprüfte Zertifikat", "Brief, factual note to the affected floor: check devices and remind people about the verified certificate", "Note brève et factuelle à l'étage concerné : vérifier les appareils et rappeler le certificat vérifié") },
        { id: "company_wide",correct: false, delta: -3, label: L("Eine unternehmensweite Panik-Mail mit Foto an alle Mitarbeitenden ausspielen", "Send a company-wide panic mail with a photo to every employee", "Envoyer un mail panique à toute l'entreprise avec photo") },
        { id: "silent",      correct: false, delta: -2, label: L("Bewusst nichts kommunizieren, der Vorfall bleibt komplett intern", "Deliberately communicate nothing, the incident stays purely internal", "Volontairement ne rien communiquer, l'incident reste purement interne") },
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
        { id: "cloudtrail", correct: true,  delta: +6, label: L("Zugriffsprotokolle der Cloud prüfen: wer hat seit wann was gelesen, welche Muster auf der Quelle", "Review cloud access logs: who has read what since when, and what patterns the source shows", "Examiner les logs d'accès cloud : qui a lu quoi et depuis quand, quels patterns sur la source") },
        { id: "close_now",  correct: false, delta: -3, label: L("Den Bucket sofort auf privat schalten und die Logs erst später aufarbeiten", "Flip the bucket to private straight away and process the logs later", "Mettre le bucket en privé tout de suite et traiter les logs plus tard") },
        { id: "ask_dev",    correct: false, delta: -4, label: L("Im Entwickler-Chat nachfragen, ob der Bucket vielleicht 'eigentlich öffentlich sein sollte'", "Ask in the developer chat whether the bucket 'should be public anyway'", "Demander dans le chat dev si le bucket 'devait être public'") },
      ],
    },
    {
      id: "remediate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Bereinigung", "Remediate", "Remédier"),
      prompt: L("Wie schließen?", "How do you close it?", "Comment fermer ?"),
      options: [
        { id: "block_public", correct: true,  delta: +7, label: L("Den öffentlichen Zugriff auf Account-Ebene unterbinden, die Berechtigungen sauber korrigieren und die Leitplanken nachziehen", "Disable public access at the account level, correct the permissions cleanly and tighten the guardrails", "Désactiver l'accès public au niveau du compte, corriger proprement les permissions et durcir les garde-fous") },
        { id: "rename_only",  correct: false, delta: -3, label: L("Den Bucket umbenennen und einen 'sauberen' an gleicher Stelle anlegen, Daten umkopieren", "Rename the bucket and create a 'clean' one at the same path, copy the data over", "Renommer le bucket et en créer un 'propre' au même chemin, copier les données") },
        { id: "url_obfuscate",correct: false, delta: -4, label: L("Den Namen unauffällig machen und den Zugriff über kurze, signierte Links absichern", "Obscure the name and secure access through short signed links", "Rendre le nom discret et sécuriser l'accès par des liens signés courts") },
      ],
    },
    {
      id: "notify", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Meldung", "Notify", "Notifier"),
      prompt: L("Wer wird informiert?", "Who is informed?", "Qui informer ?"),
      options: [
        { id: "dpo_legal", correct: true,  delta: +6, label: L("Datenschutz und Legal einbinden, 72-Stunden-Frist prüfen und die betroffenen Datenkategorien einordnen", "Loop the DPO and Legal, check the 72h deadline and classify the affected data categories", "Impliquer DPO et juridique, vérifier le délai de 72h et classifier les données concernées") },
        { id: "ciso_only", correct: false, delta: -3, label: L("Nur den CISO briefen, alles weitere nach der finalen Forensik klären", "Brief only the CISO, clarify everything else after final forensics", "Briefer uniquement le CISO, le reste après forensique finale") },
        { id: "no_proof",  correct: false, delta: -4, label: L("Da es 'keinen Beweis für massenhaftes Herunterladen' gibt, vorerst gar nicht melden", "Since there's 'no proof of mass download', don't notify for now", "Pas de 'preuve de téléchargement massif' : ne pas notifier pour l'instant") },
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
