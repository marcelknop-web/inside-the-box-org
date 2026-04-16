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
}

export interface PlaybookStep {
  id: string;
  title: LocaleStr;
  prompt: LocaleStr;
  requiredRoom: RoomId | null;
  options: PlaybookOption[];
  timeLimitMs: number;
}

export interface Incident {
  id: string;
  title: LocaleStr;
  brief: LocaleStr;
  initialDelayMs: number;
  steps: PlaybookStep[];
}

// Helper to keep entries terse
const L = (de: string, en: string, fr: string): LocaleStr => ({ de, en, fr });

// ---------------- 10 incidents (realistic, plausible distractors) ----------------

const PHISHING: Incident = {
  id: "phishing",
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
        { id: "verify",     correct: true,  delta: +6, label: L("Header & URLs im SIEM verifizieren, Sandbox-Detonation", "Verify headers & URLs in SIEM, sandbox detonation", "Vérifier en-têtes/URLs dans le SIEM, détonation sandbox") },
        { id: "block_now",  correct: false, delta: -3, label: L("Sofort Sender blocken, ohne IOCs zu erfassen", "Block sender immediately without capturing IOCs", "Bloquer l'expéditeur tout de suite sans collecter les IOCs") },
        { id: "user_train", correct: false, delta: -4, label: L("Awareness-Mail an alle senden, dann auswerten", "Mass-mail awareness to all, then analyse", "Envoyer un rappel sensibilisation à tous, puis analyser") },
      ],
    },
    {
      id: "contain", requiredRoom: "soc_floor", timeLimitMs: 25_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "block_sender", correct: true,  delta: +6, label: L("Sender + URLs am Mail-Gateway blocken, Mails zurückziehen", "Block sender + URLs at gateway, recall mails", "Bloquer expéditeur + URLs sur la passerelle, rappeler les mails") },
        { id: "delete_only",  correct: false, delta: -3, label: L("Nur die Mails aus den Postfächern löschen", "Only delete the mails from mailboxes", "Supprimer uniquement les mails des boîtes") },
        { id: "quarantine",   correct: false, delta: -2, label: L("Empfänger-Postfächer komplett quarantänisieren", "Quarantine entire recipient mailboxes", "Mettre en quarantaine les boîtes destinataires entières") },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("CISO-Briefing?", "Brief the CISO?", "Briefer le CISO ?"),
      options: [
        { id: "brief_ciso", correct: true,  delta: +5, label: L("Knapp briefen: Scope, Impact, nächste Schritte", "Brief: scope, impact, next steps", "Briefer : portée, impact, prochaines étapes") },
        { id: "wait_full",  correct: false, delta: -3, label: L("Erst vollständigen Bericht abwarten, dann briefen", "Wait for the full report, then brief", "Attendre le rapport complet, puis briefer") },
        { id: "email_only", correct: false, delta: -2, label: L("Nur eine kurze E-Mail an CISO, kein Gespräch", "Send a short email to the CISO, no meeting", "Juste un email au CISO, sans entretien") },
      ],
    },
  ],
};

const RANSOMWARE: Incident = {
  id: "ransomware",
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
        { id: "confirm_edr",  correct: true,  delta: +6, label: L("EDR-Telemetrie + Datei-Hashes verifizieren, Prozess-Tree prüfen", "Verify EDR telemetry + file hashes, check process tree", "Vérifier télémétrie EDR + hashes, examiner l'arbre de processus") },
        { id: "shutdown_srv", correct: false, delta: -3, label: L("Den File-Server hart herunterfahren, dann analysieren", "Hard-shutdown the file server, then analyse", "Éteindre brutalement le serveur, puis analyser") },
        { id: "kill_share",   correct: false, delta: -2, label: L("SMB-Share offline nehmen, ohne Forensik zu sichern", "Take SMB share offline without preserving forensics", "Couper le partage SMB sans préserver la forensique") },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Isolation", "Isolate", "Isoler"),
      prompt: L("Wie isolieren?", "How to isolate?", "Comment isoler ?"),
      options: [
        { id: "segment_vlan",  correct: true,  delta: +8, label: L("Host-VLAN segmentieren, EDR-Quarantäne, Lateral-Movement stoppen", "Segment host VLAN, EDR-isolate, stop lateral movement", "Segmenter le VLAN, isoler via EDR, stopper mouvement latéral") },
        { id: "block_ad",      correct: false, delta: -3, label: L("AD-Konto sperren, aber Host im Netz lassen", "Disable AD account but leave host on network", "Désactiver le compte AD mais laisser l'hôte sur le réseau") },
        { id: "block_internet",correct: false, delta: -2, label: L("Nur Internet-Uplink des Hosts kappen", "Only cut the host's internet uplink", "Couper uniquement le lien internet de l'hôte") },
      ],
    },
    {
      id: "recover", requiredRoom: "server_room", timeLimitMs: 25_000,
      title: L("Wiederherstellung", "Recovery", "Restauration"),
      prompt: L("Recovery?", "Recovery?", "Recovery ?"),
      options: [
        { id: "restore_backup", correct: true,  delta: +8, label: L("Backups aus Offline-Vault prüfen, dann sauber restoren", "Verify offline-vault backups, then restore cleanly", "Vérifier sauvegardes hors-ligne, puis restaurer proprement") },
        { id: "restore_latest", correct: false, delta: -4, label: L("Letztes Online-Backup sofort einspielen", "Restore latest online backup immediately", "Restaurer immédiatement la dernière sauvegarde en ligne") },
        { id: "shadow_copies",  correct: false, delta: -3, label: L("Volume Shadow Copies nutzen, ohne Integrität zu prüfen", "Use volume shadow copies without integrity check", "Utiliser les shadow copies sans vérifier l'intégrité") },
      ],
    },
  ],
};

const DDOS: Incident = {
  id: "ddos",
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
        { id: "verify_traffic", correct: true,  delta: +5, label: L("Flow-Daten + Geo-Verteilung prüfen, Layer 3/4 vs 7 abgrenzen", "Check flow data + geo, classify L3/4 vs L7", "Analyser flow data + géo, distinguer L3/4 vs L7") },
        { id: "scale_up",       correct: false, delta: -3, label: L("Sofort Web-Tier hochskalieren, dann analysieren", "Scale up the web tier first, then analyse", "Scaler la couche web d'abord, puis analyser") },
        { id: "rate_limit_all", correct: false, delta: -2, label: L("Globales Rate-Limit auf alle Clients setzen", "Global rate-limit on all clients", "Rate-limit global sur tous les clients") },
      ],
    },
    {
      id: "mitigate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Mitigation", "Mitigate", "Mitigation"),
      prompt: L("Wie reagieren?", "How do you respond?", "Comment réagir ?"),
      options: [
        { id: "scrubbing", correct: true,  delta: +8, label: L("Traffic über Scrubbing-Provider routen, gezielte WAF-Regeln", "Route via scrubbing provider, targeted WAF rules", "Router via provider de scrubbing, règles WAF ciblées") },
        { id: "geoblock",  correct: false, delta: -2, label: L("Pauschalen Geoblock auf verdächtige Regionen ausrollen", "Blanket geo-block on suspect regions", "Géo-blocage massif sur régions suspectes") },
        { id: "captcha_all",correct: false, delta: -3, label: L("CAPTCHA für alle Logins zwingend aktivieren", "Force CAPTCHA on all logins", "Imposer CAPTCHA sur tous les logins") },
      ],
    },
    {
      id: "comms", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Kommunikation", "Comms", "Communication"),
      prompt: L("Was kommunizieren?", "What do you communicate?", "Que communiquer ?"),
      options: [
        { id: "status_page",  correct: true,  delta: +5, label: L("Status-Page aktualisieren + interne Stakeholder informieren", "Update status page + inform internal stakeholders", "Mettre à jour la status page + informer parties prenantes") },
        { id: "wait_resolved",correct: false, delta: -3, label: L("Erst warten, bis stabil — dann ein Statement rausgeben", "Wait until stable, then put out a statement", "Attendre que ce soit stable, puis publier") },
        { id: "internal_only",correct: false, delta: -2, label: L("Nur intern kommunizieren, Kunden nicht beunruhigen", "Internal comms only, don't alarm customers", "Communiquer en interne seulement, ne pas alarmer les clients") },
      ],
    },
  ],
};

const INSIDER: Incident = {
  id: "insider",
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
        { id: "review_dlp", correct: true,  delta: +6, label: L("DLP-Logs + UEBA-Profil prüfen, Baseline vergleichen", "Review DLP logs + UEBA profile, compare baseline", "Examiner logs DLP + profil UEBA, comparer la baseline") },
        { id: "lock_acct",  correct: false, delta: -3, label: L("Account sofort sperren, bevor man Kontext hat", "Lock account immediately before you have context", "Verrouiller le compte avant d'avoir le contexte") },
        { id: "ask_mgr",    correct: false, delta: -3, label: L("Direkt den Vorgesetzten fragen, ob das normal ist", "Ask the line manager directly if this is normal", "Demander au manager si c'est normal") },
      ],
    },
    {
      id: "preserve", requiredRoom: "forensics", timeLimitMs: 25_000,
      title: L("Beweissicherung", "Preserve", "Préserver"),
      prompt: L("Forensik?", "Forensics?", "Forensique ?"),
      options: [
        { id: "image_endpoint", correct: true,  delta: +8, label: L("Endpoint forensisch imagen, Chain-of-Custody dokumentieren", "Forensically image endpoint, document chain of custody", "Imager l'endpoint, documenter la chaîne de garde") },
        { id: "remote_collect", correct: false, delta: -3, label: L("Nur Remote-Triage-Pakete sammeln, kein Image", "Only collect remote triage packs, no image", "Collecter uniquement triage à distance, sans image") },
        { id: "snapshot_vm",    correct: false, delta: -2, label: L("Nur einen VM-Snapshot ziehen, ohne Memory-Dump", "Take a VM snapshot only, no memory dump", "Snapshot VM uniquement, sans dump mémoire") },
      ],
    },
    {
      id: "hr_legal", requiredRoom: "ciso_office", timeLimitMs: 25_000,
      title: L("HR & Legal", "HR & Legal", "RH & Juridique"),
      prompt: L("Wer wird einbezogen?", "Who do you involve?", "Qui impliquer ?"),
      options: [
        { id: "loop_hr_legal", correct: true,  delta: +7, label: L("HR + Legal + Datenschutz formell einbeziehen", "Loop HR + Legal + DPO formally", "Impliquer formellement RH + Juridique + DPO") },
        { id: "ciso_only",     correct: false, delta: -3, label: L("Nur CISO informieren, HR später", "Inform CISO only, HR later", "Informer uniquement le CISO, RH plus tard") },
        { id: "shadow",        correct: false, delta: -4, label: L("Weiter beobachten und keine Eskalation auslösen", "Keep monitoring without escalating", "Continuer à observer sans escalader") },
      ],
    },
  ],
};

const BEC: Incident = {
  id: "bec",
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
      id: "stop_payment", requiredRoom: "soc_floor", timeLimitMs: 18_000,
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
      prompt: L("Wie cadrieren?", "How do you scope?", "Comment cadrer ?"),
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

export const INCIDENTS: Incident[] = [
  PHISHING, RANSOMWARE, DDOS, INSIDER, BEC,
  LATERAL, C2, CRED_DUMP, SUPPLY, EXFIL, PATCH,
  AUDITOR, FIRE_DRILL,
];

/** Comic-relief incidents trigger the cheesy "audit" music mode. */
export const COMIC_INCIDENT_IDS = new Set<string>(["auditor_visit", "fire_drill"]);
