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
        { id: "verify",     correct: true,  delta: +6, label: L("Header & URLs im SIEM verifizieren, Sandbox-Detonation des Anhangs", "Verify headers & URLs in SIEM, sandbox-detonate the attachment", "Vérifier en-têtes/URLs dans le SIEM, détonation sandbox de la pièce jointe") },
        { id: "block_now",  correct: false, delta: -3, label: L("Sender im Mail-Gateway blocken und Mails löschen, IOCs später nachziehen", "Block sender at mail gateway and purge mails, capture IOCs later", "Bloquer l'expéditeur au gateway et purger les mails, IOCs plus tard") },
        { id: "user_train", correct: false, delta: -4, label: L("Awareness-Broadcast an alle Postfächer mit Indikatoren ausspielen, dann triagieren", "Broadcast awareness with indicators to all mailboxes, then triage", "Diffuser une alerte sensibilisation avec indicateurs à toutes les boîtes, puis triagir") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 25_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "block_sender", correct: true,  delta: +6, label: L("Sender + URLs am Mail-Gateway blocken, ZAP/Recall der Mails aus den Postfächern", "Block sender + URLs at gateway, ZAP/recall mails from mailboxes", "Bloquer expéditeur + URLs sur la passerelle, ZAP/rappel des mails") },
        { id: "delete_only",  correct: false, delta: -3, label: L("Mails per eDiscovery-Search aus allen Postfächern hard-deleten, Gateway-Regel bleibt offen", "Hard-delete mails via eDiscovery search across mailboxes, leave gateway rule open", "Supprimer définitivement via eDiscovery, sans règle gateway") },
        { id: "quarantine",   correct: false, delta: -2, label: L("Empfänger-Postfächer per Litigation-Hold + Forwarding-Block komplett quarantänisieren", "Quarantine recipient mailboxes via litigation-hold + forwarding-block", "Mettre en quarantaine via litigation-hold + blocage forwarding") },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("CISO-Briefing?", "Brief the CISO?", "Briefer le CISO ?"),
      options: [
        { id: "brief_ciso", correct: true,  delta: +5, label: L("Knappes Briefing: Scope, Impact, Containment-Status, nächste Schritte", "Tight brief: scope, impact, containment status, next steps", "Brief concis : portée, impact, état de containment, prochaines étapes") },
        { id: "wait_full",  correct: false, delta: -3, label: L("Vollständigen Forensik-Bericht inkl. Root-Cause abwarten, dann strukturiert briefen", "Wait for the full forensic report incl. root cause, then brief structured", "Attendre le rapport forensique complet incl. cause racine, puis briefer") },
        { id: "email_only", correct: false, delta: -2, label: L("Strukturierte E-Mail mit Executive-Summary an CISO + IR-Lead, kein Sync-Termin", "Structured email with executive summary to CISO + IR lead, no sync meeting", "Mail structuré avec résumé exécutif au CISO + IR lead, sans sync") },
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
        { id: "confirm_edr",  correct: true,  delta: +6, label: L("EDR-Telemetrie + Datei-Hashes verifizieren, Prozess-Tree und Parent-PID prüfen", "Verify EDR telemetry + file hashes, check process tree and parent PID", "Vérifier télémétrie EDR + hashes, examiner l'arbre de processus et le parent") },
        { id: "shutdown_srv", correct: false, delta: -3, label: L("File-Server kontrolliert per ACPI-Shutdown herunterfahren, Volume-Snapshot ziehen", "Gracefully ACPI-shutdown the file server, then take a volume snapshot", "Éteindre proprement via ACPI, puis snapshot volume") },
        { id: "kill_share",   correct: false, delta: -2, label: L("SMB-Share via PowerShell offline nehmen und ACLs auf Read-Only setzen", "Take SMB share offline via PowerShell, set ACLs to read-only", "Couper le partage SMB via PowerShell, ACLs en lecture seule") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Isolation", "Isolate", "Isoler"),
      prompt: L("Wie isolieren?", "How to isolate?", "Comment isoler ?"),
      options: [
        { id: "segment_vlan",  correct: true,  delta: +8, label: L("Host-VLAN segmentieren, EDR-Quarantäne, Lateral-Movement-Pfade kappen", "Segment host VLAN, EDR-isolate, sever lateral-movement paths", "Segmenter le VLAN, isoler via EDR, couper les chemins de mouvement latéral") },
        { id: "block_ad",      correct: false, delta: -3, label: L("Computer-Konto im AD deaktivieren + GPO-Push für Defender-Vollscan auf dem Host", "Disable AD computer account + GPO-push Defender full-scan on host", "Désactiver le compte machine AD + GPO push scan complet Defender") },
        { id: "block_internet",correct: false, delta: -2, label: L("Internet-Uplink des Hosts auf Firewall droppen + Proxy-Bypass-Regel entfernen", "Drop the host's internet uplink at FW + remove proxy-bypass rule", "Couper l'uplink internet au firewall + retirer la règle proxy-bypass") },
      ],
    },
    {
      id: "recover", requiredRoom: "server_room", timeLimitMs: 25_000,
      title: L("Wiederherstellung", "Recovery", "Restauration"),
      prompt: L("Recovery?", "Recovery?", "Recovery ?"),
      options: [
        { id: "restore_backup", correct: true,  delta: +8, label: L("Backups aus Offline-/Immutable-Vault auf Integrität prüfen, dann sauber restoren", "Verify offline/immutable-vault backups for integrity, then restore cleanly", "Vérifier l'intégrité des sauvegardes hors-ligne/immuables, puis restaurer") },
        { id: "restore_latest", correct: false, delta: -4, label: L("Letztes Online-Backup aus dem Backup-Repository per One-Click-Restore einspielen", "Restore the latest online backup from the repo via one-click-restore", "Restaurer la dernière sauvegarde en ligne via restauration en un clic") },
        { id: "shadow_copies",  correct: false, delta: -3, label: L("Volume Shadow Copies per vssadmin revertieren und Datei-Versionen vergleichen", "Revert via vssadmin volume-shadow-copies and diff file versions", "Restaurer via vssadmin shadow-copies et comparer les versions") },
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
        { id: "verify_traffic", correct: true,  delta: +5, label: L("NetFlow + Geo-Verteilung prüfen, Layer 3/4 vs. 7 abgrenzen, Top-Talker identifizieren", "Check NetFlow + geo, classify L3/4 vs L7, identify top talkers", "Analyser NetFlow + géo, distinguer L3/4 vs L7, identifier top talkers") },
        { id: "scale_up",       correct: false, delta: -3, label: L("Web-Tier per Auto-Scaling-Group hochskalieren und Load-Balancer-Health-Checks lockern", "Scale the web tier via auto-scaling group + relax LB health checks", "Scaler le tier web via auto-scaling + assouplir les health-checks LB") },
        { id: "rate_limit_all", correct: false, delta: -2, label: L("Globales Rate-Limit per WAF-Regel auf alle Source-IPs setzen, Token-Bucket eng konfigurieren", "Apply WAF-based global rate-limit on all source IPs, tight token bucket", "Rate-limit global via WAF sur toutes les IPs sources, token bucket strict") },
      ],
    },
    {
      id: "mitigate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Mitigation", "Mitigate", "Mitigation"),
      prompt: L("Wie reagieren?", "How do you respond?", "Comment réagir ?"),
      options: [
        { id: "scrubbing", correct: true,  delta: +8, label: L("Traffic über Scrubbing-Provider routen (BGP-Anycast), gezielte WAF-Regeln nachschärfen", "Route via scrubbing provider (BGP anycast), tighten targeted WAF rules", "Router via provider de scrubbing (BGP anycast), affiner les règles WAF") },
        { id: "geoblock",  correct: false, delta: -2, label: L("Geo-Blocking per ASN-/Country-Liste auf verdächtige Regionen am Edge ausrollen", "Roll out geo-blocking via ASN/country list on suspect regions at the edge", "Géo-blocage via liste ASN/pays sur régions suspectes au edge") },
        { id: "captcha_all",correct: false, delta: -3, label: L("Adaptiven Bot-Mitigation-Modus mit verpflichtendem CAPTCHA für alle Login-Sessions aktivieren", "Enable adaptive bot-mitigation with mandatory CAPTCHA for all login sessions", "Activer la mitigation bot adaptative avec CAPTCHA obligatoire pour toutes les sessions") },
      ],
    },
    {
      id: "comms", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Kommunikation", "Comms", "Communication"),
      prompt: L("Was kommunizieren?", "What do you communicate?", "Que communiquer ?"),
      options: [
        { id: "status_page",  correct: true,  delta: +5, label: L("Status-Page mit klassifiziertem Incident-Level aktualisieren + interne Stakeholder via War-Room-Kanal informieren", "Update status page with classified incident level + inform internal stakeholders via war-room channel", "Mettre à jour la status page avec niveau d'incident + informer les stakeholders via canal war-room") },
        { id: "wait_resolved",correct: false, delta: -3, label: L("Erst bis Stabilisierung warten, dann strukturiertes Statement mit Root-Cause veröffentlichen", "Wait until stabilised, then publish a structured statement with root cause", "Attendre la stabilisation, puis publier un communiqué structuré avec la cause racine") },
        { id: "internal_only",correct: false, delta: -2, label: L("Nur interne Comms via Teams + Mail-Verteiler, externe Status-Page bewusst unverändert lassen", "Internal comms via Teams + mail list only, deliberately leave external status page unchanged", "Communication interne via Teams + mailing list, status page externe volontairement inchangée") },
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
        { id: "review_dlp", correct: true,  delta: +6, label: L("DLP-Logs + UEBA-Profil prüfen, Baseline + Peer-Group des Users vergleichen", "Review DLP logs + UEBA profile, compare baseline + user peer group", "Examiner logs DLP + profil UEBA, comparer baseline + groupe pair") },
        { id: "lock_acct",  correct: false, delta: -3, label: L("Account in Azure AD per Conditional-Access-Block sofort sperren, Token revoken, Kontext nachreichen", "Lock account immediately via Azure-AD conditional-access block, revoke tokens, gather context after", "Verrouiller via accès conditionnel Azure-AD, révoquer les tokens, contexte après") },
        { id: "ask_mgr",    correct: false, delta: -3, label: L("Direkten Vorgesetzten kontaktieren und Geschäftskontext der Datenabflüsse erfragen", "Contact line manager and request business context for the egress events", "Contacter le manager pour le contexte métier des flux sortants") },
      ],
    },
    {
      id: "preserve", requiredRoom: "forensics", timeLimitMs: 25_000,
      title: L("Beweissicherung", "Preserve", "Préserver"),
      prompt: L("Forensik?", "Forensics?", "Forensique ?"),
      options: [
        { id: "image_endpoint", correct: true,  delta: +8, label: L("Endpoint per Write-Blocker forensisch imagen, Memory-Dump, Chain-of-Custody dokumentieren", "Forensically image endpoint via write-blocker, memory dump, document chain of custody", "Imager l'endpoint via write-blocker, dump mémoire, documenter la chaîne de garde") },
        { id: "remote_collect", correct: false, delta: -3, label: L("Remote-Triage-Pakete (KAPE/Velociraptor) sammeln, Disk-Image im nächsten Wartungsfenster", "Collect remote triage packs (KAPE/Velociraptor), disk image in next maintenance window", "Collecter triage à distance (KAPE/Velociraptor), image disque à la prochaine fenêtre") },
        { id: "snapshot_vm",    correct: false, delta: -2, label: L("VM-Snapshot mit Memory-State über Hypervisor-API ziehen, Disk-Image später aus Snapshot exportieren", "Take a hypervisor-API VM snapshot incl. memory state, export disk image from it later", "Snapshot VM via API hyperviseur incl. mémoire, image disque exportée du snapshot plus tard") },
      ],
    },
    {
      id: "hr_legal", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("HR & Legal", "HR & Legal", "RH & Juridique"),
      prompt: L("Wer wird einbezogen?", "Who do you involve?", "Qui impliquer ?"),
      options: [
        { id: "loop_hr_legal", correct: true,  delta: +7, label: L("HR + Legal + Datenschutz formell + dokumentiert via Eskalationsprozess einbinden", "Loop HR + Legal + DPO formally and documented via escalation process", "Impliquer formellement RH + Juridique + DPO via le processus d'escalade") },
        { id: "ciso_only",     correct: false, delta: -3, label: L("CISO als Single-Point-of-Contact briefen, HR/Legal nach Abschluss der technischen Analyse einbinden", "Brief CISO as single point of contact, loop HR/Legal after technical analysis completes", "Briefer le CISO comme SPOC, RH/juridique après l'analyse technique") },
        { id: "shadow",        correct: false, delta: -4, label: L("Verdeckte Überwachung (Endpoint + Mail) ausweiten, keine Eskalation, um Operations-Security zu wahren", "Expand covert monitoring (endpoint + mail), no escalation, preserve OPSEC", "Étendre la surveillance discrète (endpoint + mail), pas d'escalade, préserver l'OPSEC") },
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
        { id: "auth_logs",  correct: true,  delta: +6, label: L("Mail-Auth (SPF/DKIM/DMARC) + Login-Geo des Postfachs prüfen", "Check mail auth (SPF/DKIM/DMARC) + login geo of mailbox", "Vérifier l'auth mail (SPF/DKIM/DMARC) + géo des connexions") },
        { id: "call_ceo",   correct: false, delta: -2, label: L("CEO direkt anrufen — auf der Nummer aus der Mail-Signatur", "Call the CEO — on the number from the mail signature", "Appeler le CEO — sur le numéro de la signature mail") },
        { id: "ask_finance",correct: false, delta: -3, label: L("Buchhaltung fragen, ob die Anweisung 'plausibel' wirkt", "Ask finance if the request 'looks plausible'", "Demander à la finance si la demande 'semble plausible'") },
      ],
    },
    {
      id: "stop_payment", requiredRoom: "war_room", timeLimitMs: 18_000,
      title: L("Zahlung stoppen", "Stop payment", "Stopper le paiement"),
      prompt: L("Wie stoppen?", "How do you stop it?", "Comment stopper ?"),
      options: [
        { id: "freeze_call", correct: true,  delta: +7, label: L("Buchhaltung + Bank-Hotline parallel kontaktieren, Transfer einfrieren", "Contact finance + bank hotline in parallel, freeze transfer", "Contacter finance + hotline banque en parallèle, geler le virement") },
        { id: "email_only",  correct: false, delta: -3, label: L("Nur eine Stop-Mail an die Buchhaltung senden", "Send a stop email to finance only", "Envoyer juste un mail d'arrêt à la finance") },
        { id: "wait_legal",  correct: false, delta: -4, label: L("Erst auf Freigabe von Legal warten, dann handeln", "Wait for legal sign-off first, then act", "Attendre l'aval du juridique d'abord, puis agir") },
      ],
    },
    {
      id: "harden", requiredRoom: "ciso_office", timeLimitMs: 20_000,
      title: L("Härtung", "Harden", "Durcissement"),
      prompt: L("Was härten?", "What do you harden?", "Que durcir ?"),
      options: [
        { id: "policy_4eyes", correct: true,  delta: +6, label: L("4-Augen-Prinzip + Rückruf-Pflicht für Zahlungen >X€ einführen", "Four-eyes + callback rule for payments above €X", "Quatre yeux + rappel obligatoire pour paiements > X€") },
        { id: "block_ext",    correct: false, delta: -3, label: L("Alle externen E-Mails grundsätzlich blocken", "Block all external emails by default", "Bloquer tous les mails externes par défaut") },
        { id: "rotate_ceo",   correct: false, delta: -2, label: L("Nur das CEO-Passwort rotieren, fertig", "Just rotate the CEO password, done", "Faire juste tourner le mot de passe du CEO") },
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
        { id: "graph",        correct: true,  delta: +6, label: L("Authentifizierungs-Graph + 4624/4672-Events korrelieren", "Correlate auth graph + 4624/4672 events", "Corréler graphe d'authentification + events 4624/4672") },
        { id: "endpoint_only",correct: false, delta: -3, label: L("Nur den ursprünglichen Endpoint analysieren", "Analyse only the originating endpoint", "Analyser uniquement l'endpoint d'origine") },
        { id: "ask_user",     correct: false, delta: -3, label: L("User fragen, ob er sich überall angemeldet hat", "Ask the user if they logged in everywhere", "Demander à l'utilisateur s'il s'est connecté partout") },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How to contain?", "Comment confiner ?"),
      options: [
        { id: "isolate_set", correct: true,  delta: +7, label: L("Alle betroffenen Hosts EDR-isolieren, Service-Konten sperren", "EDR-isolate all affected hosts, disable service accounts", "Isoler via EDR tous les hôtes affectés, désactiver les comptes service") },
        { id: "isolate_one", correct: false, delta: -3, label: L("Nur den ersten Host isolieren, Rest beobachten", "Isolate only the first host, watch the rest", "Isoler seulement le premier hôte, observer le reste") },
        { id: "block_smb",   correct: false, delta: -2, label: L("SMB im ganzen Netz blocken — Kollateralschaden in Kauf nehmen", "Block SMB across the entire network — accept collateral", "Bloquer SMB sur tout le réseau — accepter les collatéraux") },
      ],
    },
    {
      id: "creds", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Credentials", "Credentials", "Identifiants"),
      prompt: L("Was tun mit Konten?", "What about accounts?", "Que faire des comptes ?"),
      options: [
        { id: "rotate_tier", correct: true,  delta: +7, label: L("Tier-0-Konten + Kerberos-Tickets (krbtgt 2x) rotieren", "Rotate tier-0 accounts + Kerberos tickets (krbtgt 2x)", "Faire tourner comptes tier-0 + tickets Kerberos (krbtgt x2)") },
        { id: "rotate_all",  correct: false, delta: -3, label: L("Alle User-Passwörter im Unternehmen sofort zurücksetzen", "Reset every user password company-wide", "Réinitialiser tous les mots de passe utilisateurs") },
        { id: "rotate_one",  correct: false, delta: -3, label: L("Nur das Passwort des kompromittierten Users ändern", "Reset only the compromised user's password", "Changer uniquement le mot de passe de l'utilisateur compromis") },
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
        { id: "block_dns",  correct: false, delta: -3, label: L("Domain einfach im DNS sinkholen, ohne Analyse", "Sinkhole the domain in DNS without analysis", "Sinkholer le domaine sans analyse") },
        { id: "wait",       correct: false, delta: -4, label: L("24h beobachten, ob das Muster stabil bleibt", "Observe 24h whether the pattern persists", "Observer 24h si le pattern persiste") },
      ],
    },
    {
      id: "block", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Blockieren", "Block", "Bloquer"),
      prompt: L("Wo blocken?", "Where do you block?", "Où bloquer ?"),
      options: [
        { id: "fw_proxy",   correct: true,  delta: +7, label: L("Domain + IPs auf Firewall und Proxy blocken, DNS-Sinkhole setzen", "Block domain + IPs at firewall and proxy, DNS sinkhole", "Bloquer domaine + IPs sur firewall et proxy, sinkhole DNS") },
        { id: "edr_only",   correct: false, delta: -3, label: L("Nur die Hash-Signatur im EDR blacklisten", "Only blacklist the hash in EDR", "Uniquement blacklister le hash dans l'EDR") },
        { id: "block_outb", correct: false, delta: -2, label: L("Allen ausgehenden Traffic des Hosts blocken — auch legitimen", "Block all outbound traffic from the host — including legit", "Bloquer tout le trafic sortant de l'hôte — même légitime") },
      ],
    },
    {
      id: "remediate", requiredRoom: "forensics", timeLimitMs: 22_000,
      title: L("Bereinigung", "Remediate", "Remédiation"),
      prompt: L("Wie bereinigen?", "How to remediate?", "Comment remédier ?"),
      options: [
        { id: "image_reimage", correct: true,  delta: +7, label: L("Host imagen, Persistenz suchen, dann sauber neu aufsetzen", "Image host, hunt persistence, then reimage cleanly", "Imager l'hôte, chasser la persistance, puis réinstaller") },
        { id: "av_scan",       correct: false, delta: -3, label: L("Nur einen AV-Vollscan laufen lassen", "Run a full AV scan only", "Lancer juste un scan AV complet") },
        { id: "kill_proc",     correct: false, delta: -3, label: L("Nur den Beacon-Prozess killen, Host weiternutzen", "Kill the beacon process only, keep using host", "Tuer juste le processus beacon, continuer à utiliser l'hôte") },
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
        { id: "process_tree", correct: true,  delta: +6, label: L("Prozess-Tree + Tool-Signatur (Mimikatz/comsvcs) prüfen", "Check process tree + tool signature (Mimikatz/comsvcs)", "Examiner l'arbre de processus + signature outil (Mimikatz/comsvcs)") },
        { id: "ask_admin",    correct: false, delta: -3, label: L("Den Admin fragen, ob er gerade ein Diagnose-Tool nutzt", "Ask the admin if they're running a diagnostic tool", "Demander à l'admin s'il lance un outil de diagnostic") },
        { id: "trust_av",     correct: false, delta: -4, label: L("Wenn AV nichts sagt, als False Positive schließen", "If AV stays silent, close as false positive", "Si l'AV ne dit rien, fermer comme faux positif") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Isolieren", "Isolate", "Isoler"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "edr_isolate", correct: true,  delta: +7, label: L("Workstation EDR-isolieren, Admin-Sessions terminieren", "EDR-isolate the workstation, kill admin sessions", "Isoler le poste via EDR, terminer les sessions admin") },
        { id: "shutdown",    correct: false, delta: -3, label: L("Workstation hart ausschalten, Memory verlieren", "Hard-power-off the workstation, lose memory", "Éteindre brutalement le poste, perdre la mémoire") },
        { id: "user_logoff", correct: false, delta: -3, label: L("Nur User abmelden, Maschine im Netz lassen", "Just log the user off, keep machine on network", "Juste déconnecter l'utilisateur, laisser la machine sur le réseau") },
      ],
    },
    {
      id: "rotate", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Rotieren", "Rotate", "Rotation"),
      prompt: L("Welche Konten?", "Which accounts?", "Quels comptes ?"),
      options: [
        { id: "all_admin",  correct: true,  delta: +7, label: L("Alle auf dem Host genutzten Privileged-Konten + Service-Acc rotieren", "Rotate all privileged + service accounts used on host", "Faire tourner tous les comptes priv. + service utilisés sur l'hôte") },
        { id: "owner_only", correct: false, delta: -3, label: L("Nur das Konto des betroffenen Admins rotieren", "Rotate only the affected admin's account", "Faire tourner uniquement le compte de l'admin concerné") },
        { id: "schedule",   correct: false, delta: -3, label: L("Rotation auf das nächste Wartungsfenster legen", "Schedule rotation for the next maintenance window", "Programmer la rotation pour la prochaine fenêtre de maintenance") },
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
        { id: "cmdb_query",  correct: true,  delta: +6, label: L("CMDB + EDR nach Version & Hash der betroffenen Komponente abfragen", "Query CMDB + EDR for version & hash of affected component", "Interroger CMDB + EDR pour version & hash du composant") },
        { id: "ask_owners",  correct: false, delta: -3, label: L("System-Owner einzeln per E-Mail anfragen", "Ask system owners individually by email", "Demander aux owners par mail un par un") },
        { id: "wait_advisory",correct: false, delta: -4, label: L("Auf detailliertes Hersteller-Advisory warten", "Wait for the detailed vendor advisory", "Attendre l'advisory détaillé du fournisseur") },
      ],
    },
    {
      id: "block", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Sofort-Mitigation", "Immediate mitigation", "Mitigation immédiate"),
      prompt: L("Was tun?", "What do you do?", "Que faire ?"),
      options: [
        { id: "isolate_block", correct: true,  delta: +7, label: L("Betroffene Hosts isolieren, Update-Server + IOCs auf FW blocken", "Isolate affected hosts, block update server + IOCs at FW", "Isoler les hôtes, bloquer serveur d'update + IOCs au FW") },
        { id: "uninstall_all", correct: false, delta: -3, label: L("Komponente sofort überall deinstallieren — auch Produktion", "Uninstall the component everywhere — including production", "Désinstaller le composant partout — même en prod") },
        { id: "patch_now",     correct: false, delta: -3, label: L("Sofort den nächsten Patch ausrollen, ungetestet", "Roll out the next patch immediately, untested", "Déployer le prochain patch immédiatement, non testé") },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("An wen reporten?", "Who do you report to?", "À qui reporter ?"),
      options: [
        { id: "ciso_legal", correct: true,  delta: +6, label: L("CISO + Legal + DPO informieren, Meldepflichten (NIS-2/DORA) prüfen", "Inform CISO + Legal + DPO, check notification duties (NIS-2/DORA)", "Informer CISO + juridique + DPO, vérifier obligations (NIS-2/DORA)") },
        { id: "ciso_only",  correct: false, delta: -2, label: L("Nur CISO informieren, Rest später", "Inform CISO only, the rest later", "Informer uniquement le CISO, le reste plus tard") },
        { id: "wait_impact",correct: false, delta: -4, label: L("Erst auf konkrete Auswirkungen warten, dann melden", "Wait for actual impact, then report", "Attendre un impact concret, puis signaler") },
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
        { id: "proxy_dlp", correct: true,  delta: +6, label: L("Proxy- + DLP-Logs korrelieren, Datentyp + Volumen klassifizieren", "Correlate proxy + DLP logs, classify data type + volume", "Corréler logs proxy + DLP, classifier type & volume") },
        { id: "block_first",correct: false, delta: -3, label: L("Erst Cloud-Domain blocken, dann analysieren", "Block the cloud domain first, then analyse", "Bloquer le domaine cloud d'abord, puis analyser") },
        { id: "ask_user",  correct: false, delta: -3, label: L("Den User direkt anrufen und fragen", "Call the user directly and ask", "Appeler directement l'utilisateur") },
      ],
    },
    {
      id: "stop", requiredRoom: "noc", timeLimitMs: 16_000,
      title: L("Stoppen", "Stop", "Stopper"),
      prompt: L("Wie stoppen?", "How to stop?", "Comment stopper ?"),
      options: [
        { id: "isolate_revoke", correct: true,  delta: +7, label: L("Endpoint isolieren, Cloud-Tokens des Users revoken", "Isolate endpoint, revoke user's cloud tokens", "Isoler l'endpoint, révoquer les tokens cloud de l'utilisateur") },
        { id: "block_cloud",    correct: false, delta: -3, label: L("Den Cloud-Anbieter im ganzen Unternehmen blocken", "Block the cloud provider company-wide", "Bloquer le provider cloud sur toute l'entreprise") },
        { id: "rate_limit",     correct: false, delta: -3, label: L("Upload-Bandbreite des Users limitieren", "Rate-limit the user's upload bandwidth", "Limiter la bande passante d'upload de l'utilisateur") },
      ],
    },
    {
      id: "notify", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Meldung", "Notification", "Notification"),
      prompt: L("Wer wird benachrichtigt?", "Who is notified?", "Qui est notifié ?"),
      options: [
        { id: "dpo_legal", correct: true,  delta: +6, label: L("DPO + Legal einbinden, DSGVO-72h-Frist bewerten", "Loop DPO + Legal, assess GDPR 72h deadline", "Impliquer DPO + juridique, évaluer le délai RGPD 72h") },
        { id: "ciso_only", correct: false, delta: -3, label: L("Nur CISO informieren, DPO erst nach Forensik", "Inform CISO only, DPO after forensics", "Informer uniquement le CISO, DPO après forensique") },
        { id: "wait_proof",correct: false, delta: -4, label: L("Erst eindeutigen Beweis abwarten, dann melden", "Wait for hard proof, then notify", "Attendre une preuve dure, puis signaler") },
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
        { id: "ioc_hunt",  correct: true,  delta: +6, label: L("IOCs des Advisories über alle Logs jagen, Konfiguration auf Webshells prüfen", "Hunt advisory IOCs across logs, check config for webshells", "Chasser les IOCs de l'advisory, vérifier la conf pour webshells") },
        { id: "patch_now", correct: false, delta: -3, label: L("Sofort patchen, Forensik überspringen", "Patch immediately, skip forensics", "Patcher tout de suite, sauter la forensique") },
        { id: "trust_vendor",correct: false, delta: -3, label: L("Wenn Hersteller noch keine konkreten IOCs hat, abwarten", "If vendor has no concrete IOCs yet, wait", "Si le fournisseur n'a pas d'IOC concret, attendre") },
      ],
    },
    {
      id: "mitigate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Mitigation", "Mitigate", "Mitigation"),
      prompt: L("Was tun?", "What do you do?", "Que faire ?"),
      options: [
        { id: "workaround", correct: true,  delta: +7, label: L("Hersteller-Workaround anwenden, Management-Interface auf Allowlist", "Apply vendor workaround, allowlist management interface", "Appliquer le workaround éditeur, allowlist sur le management") },
        { id: "shut_vpn",   correct: false, delta: -3, label: L("VPN komplett abschalten — alle User trennen", "Shut down the VPN entirely — disconnect all users", "Couper le VPN entièrement — déconnecter tous les utilisateurs") },
        { id: "block_external",correct: false, delta: -2, label: L("Nur externe IPs außerhalb DE/EU blocken", "Only block external IPs outside DE/EU", "Bloquer uniquement les IPs hors DE/UE") },
      ],
    },
    {
      id: "patch", requiredRoom: "server_room", timeLimitMs: 22_000,
      title: L("Patchen", "Patch", "Patcher"),
      prompt: L("Wie patchen?", "How do you patch?", "Comment patcher ?"),
      options: [
        { id: "patch_verify", correct: true,  delta: +7, label: L("Patch in Wartungsfenster einspielen + IOC-Re-Hunt nach Patch", "Apply patch in maintenance window + re-hunt IOCs post-patch", "Patcher dans la fenêtre de maintenance + re-hunt IOCs après") },
        { id: "patch_blind",  correct: false, delta: -3, label: L("Patch sofort live einspielen, ohne Re-Hunt", "Push patch live immediately, no re-hunt", "Pousser le patch en live immédiatement, sans re-hunt") },
        { id: "wait_window",  correct: false, delta: -4, label: L("Auf das nächste reguläre Patch-Fenster in 4 Wochen warten", "Wait for the next regular patch window in 4 weeks", "Attendre la prochaine fenêtre régulière dans 4 semaines") },
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

export const INCIDENTS: Incident[] = [
  PHISHING, RANSOMWARE, DDOS, INSIDER, BEC,
  LATERAL, C2, CRED_DUMP, SUPPLY, EXFIL, PATCH,
  AUDITOR, FIRE_DRILL, DPO_VISIT, COMPLIANCE_VISIT,
];

/** Comic-relief incidents trigger the cheesy "audit" music mode. */
export const COMIC_INCIDENT_IDS = new Set<string>([
  "auditor_visit", "fire_drill", "dpo_visit", "compliance_visit",
]);
