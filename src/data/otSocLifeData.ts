// OT-SOC Life: incidents tuned for industrial control system (ICS / OT) SOC training.
//
// Audience: SOC analysts with an IT background being cross-trained on OT
// specifics — Purdue model layering (L0-L3.5), conduits/zones (IEC 62443),
// and the SAIC priority order (Safety > Availability > Integrity > Confidentiality).
//
// All wrong answers are realistic IT-style mistakes a freshly-rotated analyst
// would make under pressure (e.g. powering a PLC during a live batch, scanning
// an OT segment with active probes, taking the historian offline mid-shift).
// The "correct" call always respects safety-of-life and process continuity.
//
// We deliberately re-use the IT room model (soc_floor / siem / forensics / noc /
// server_room / war_room / ciso_office / kitchen) because the existing pixel-
// art DollHouse renders only those rooms. The OT context comes from the i18n
// labels (room.<id>.name swaps to "Control Room", "OT-SIEM", "Engineering WS"…)
// and from the incident copy itself.
//
// Re-exports the shared types so OtSocLife.tsx can import everything from a
// single module — keeps the variant boundary clean.

import {
  Incident, IncidentTier, IncidentCategory, Lang, LocaleStr,
  PlaybookStep, PlaybookOption, RoomId,
  ROOMS, NPCS,
} from "./socLifeData";

export type {
  Incident, IncidentTier, IncidentCategory, Lang, LocaleStr,
  PlaybookStep, PlaybookOption, RoomId,
};
export { ROOMS, NPCS };

// Helper to keep entries terse — DE/EN/FR triple.
const L = (de: string, en: string, fr: string): LocaleStr => ({ de, en, fr });

// ============================================================================
// 1 — Modbus / write-command anomaly on a production PLC
// ============================================================================
const PLC_WRITE: Incident = {
  id: "plc_write_anomaly",
  tier: "medium",
  category: "network",
  title: L(
    "Schreibbefehle auf SPS-Logik",
    "Write commands on PLC logic",
    "Écritures sur la logique API",
  ),
  brief: L(
    "OT-IDS meldet Modbus-WriteRegister-Befehle auf eine Misch-SPS während laufender Charge.",
    "OT-IDS reports Modbus WriteRegister commands on a mixer PLC during a live batch.",
    "L'IDS OT signale des Modbus WriteRegister sur un API mélangeur en pleine charge.",
  ),
  initialDelayMs: 12_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 26_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L(
        "Wie validieren — ohne in den laufenden Prozess zu greifen?",
        "How do you validate — without touching the running process?",
        "Comment valider sans toucher au procédé en cours ?",
      ),
      options: [
        { id: "passive_pcap", correct: true, delta: +7, label: L(
          "Passiven SPAN-Mitschnitt am OT-IDS auswerten und die WriteRegister-Sequenz mit dem Engineering abgleichen",
          "Inspect the passive SPAN capture from the OT-IDS and reconcile the WriteRegister sequence with engineering",
          "Examiner la capture SPAN passive de l'IDS OT et confronter la séquence WriteRegister à l'ingénierie",
        ) },
        { id: "active_scan", correct: false, delta: -5, label: L(
          "Schnell aktiv per Nmap im OT-Segment scannen, um die Quell-IP zu finden",
          "Quickly run an active Nmap scan inside the OT segment to find the source IP",
          "Lancer un scan Nmap actif dans le segment OT pour trouver l'IP source",
        ) },
        { id: "ping_plc", correct: false, delta: -4, label: L(
          "Die SPS direkt anpingen und einen Read-Coils-Probe schicken, um Reaktion zu prüfen",
          "Ping the PLC directly and send a Read-Coils probe to check responsiveness",
          "Pinger directement l'API et envoyer un Read-Coils pour vérifier la réactivité",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 22_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L(
        "Wie eindämmen, ohne die Charge zu verlieren?",
        "How do you contain without losing the batch?",
        "Comment confiner sans perdre la charge ?",
      ),
      options: [
        { id: "conduit_acl", correct: true, delta: +8, label: L(
          "Conduit-Regel zwischen L3 und L2 enger fassen — nur die freigegebene Engineering-Workstation darf zur SPS schreiben, mit Schichtleitung abgestimmt",
          "Tighten the conduit rule between L3 and L2 — only the approved engineering workstation may write to the PLC, signed off with the shift lead",
          "Resserrer la règle de conduit entre L3 et L2 — seul le poste d'ingénierie agréé peut écrire vers l'API, validé avec le chef de quart",
        ) },
        { id: "power_off_plc", correct: false, delta: -10, label: L(
          "SPS sofort stromlos schalten, damit keine weiteren Schreibbefehle ankommen",
          "Power off the PLC immediately so no more write commands can land",
          "Couper l'alimentation de l'API pour qu'aucune écriture supplémentaire n'aboutisse",
        ) },
        { id: "block_all_l2", correct: false, delta: -6, label: L(
          "Den gesamten L2/L3-Übergang trennen, inklusive Historian und HMI",
          "Sever the entire L2/L3 boundary, historian and HMI included",
          "Couper l'ensemble du passage L2/L3, historian et HMI compris",
        ) },
      ],
    },
    {
      id: "coord", requiredRoom: "war_room", timeLimitMs: 24_000,
      title: L("Koordination", "Coordination", "Coordination"),
      prompt: L(
        "Wer entscheidet — und in welcher Reihenfolge?",
        "Who decides — and in what order?",
        "Qui décide — et dans quel ordre ?",
      ),
      options: [
        { id: "safety_first", correct: true, delta: +7, label: L(
          "Schichtleitung, Safety-Officer und OT-Engineering zuerst informieren, gemeinsam Prozess- und Personenrisiko bewerten, dann erst IT-Eskalation",
          "Brief the shift lead, safety officer and OT engineering first, jointly assess process and life-safety risk, then escalate to IT",
          "Informer d'abord le chef de quart, le responsable safety et l'ingénierie OT, évaluer ensemble le risque procédé et personnes, puis escalader vers l'IT",
        ) },
        { id: "it_only", correct: false, delta: -5, label: L(
          "Nur den IT-CISO eskalieren — die Anlage soll erst informiert werden, wenn alles klar ist",
          "Escalate only to the IT CISO — production gets briefed once everything is clear",
          "Escalader uniquement au CISO IT — la production sera informée une fois que tout sera clair",
        ) },
        { id: "press_now", correct: false, delta: -6, label: L(
          "Frühzeitig Pressestelle und Vorstand vorwarnen, bevor das Engineering überhaupt einen Befund hat",
          "Pre-warn comms and the board before engineering has any finding at all",
          "Prévenir la presse et le board avant même que l'ingénierie n'ait un constat",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 2 — Engineering Workstation compromise (jump host into L2)
// ============================================================================
const EWS_COMPROMISE: Incident = {
  id: "ews_compromise",
  tier: "hard",
  category: "endpoint",
  title: L(
    "Engineering-Workstation kompromittiert",
    "Engineering workstation compromised",
    "Poste d'ingénierie compromis",
  ),
  brief: L(
    "EDR meldet Cobalt-Strike-artiges Beaconing auf der EWS, die direkten Schreib-Zugriff auf zwei SPS hat.",
    "EDR reports Cobalt-Strike-style beaconing on the EWS, which has direct write access to two PLCs.",
    "L'EDR signale un beaconing type Cobalt Strike sur le poste d'ingénierie, qui a un accès écriture direct à deux API.",
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "scope", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Scope", "Scope", "Périmètre"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "ot_telemetry", correct: true, delta: +7, label: L(
          "OT-Telemetrie und EDR-Prozessbaum prüfen, beobachten ob die EWS bereits Schreibbefehle an die SPS gesendet hat",
          "Inspect OT telemetry and the EDR process tree, check whether the EWS has already issued writes to the PLCs",
          "Examiner la télémétrie OT et l'arbre de processus EDR, vérifier si le poste a déjà émis des écritures vers les API",
        ) },
        { id: "wipe_now", correct: false, delta: -5, label: L(
          "Die EWS sofort plattmachen und neu installieren — dann ist die Bedrohung weg",
          "Wipe the EWS immediately and reinstall — threat gone",
          "Repaver le poste tout de suite et réinstaller — la menace est neutralisée",
        ) },
        { id: "ask_engineer", correct: false, delta: -4, label: L(
          "Den zuständigen Engineer anrufen und fragen, ob er gerade etwas Ungewöhnliches getan hat",
          "Call the responsible engineer and ask whether they just did something unusual",
          "Appeler l'ingénieur en charge et lui demander s'il vient de faire quelque chose d'inhabituel",
        ) },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Isolation", "Isolate", "Isoler"),
      prompt: L(
        "Wie isolieren — ohne die Anlage zu stoppen?",
        "How do you isolate — without stopping the plant?",
        "Comment isoler sans arrêter l'usine ?",
      ),
      options: [
        { id: "conduit_block", correct: true, delta: +8, label: L(
          "EWS aus dem L2-Conduit aussperren und Engineering-Konten an der OT-Firewall sperren, parallel mit Schichtleitung den Backup-EWS klären",
          "Block the EWS at the L2 conduit and disable engineering accounts at the OT firewall, in parallel align a backup EWS with the shift lead",
          "Bloquer le poste au niveau du conduit L2 et désactiver les comptes d'ingénierie sur le firewall OT, en parallèle valider un poste de secours avec le chef de quart",
        ) },
        { id: "shutdown_plant", correct: false, delta: -10, label: L(
          "Sicherheitshalber die gesamte Linie stoppen, bis die EWS sauber ist",
          "Stop the entire production line as a precaution, until the EWS is clean",
          "Arrêter toute la ligne par précaution, jusqu'à ce que le poste soit propre",
        ) },
        { id: "ad_disable", correct: false, delta: -4, label: L(
          "Nur das AD-Konto des Users deaktivieren und einen vollen Antiviren-Scan starten",
          "Just disable the user's AD account and start a full antivirus scan",
          "Désactiver uniquement le compte AD de l'utilisateur et lancer un scan antivirus complet",
        ) },
      ],
    },
    {
      id: "preserve", requiredRoom: "forensics", timeLimitMs: 24_000,
      title: L("Beweissicherung", "Preserve", "Préserver"),
      prompt: L(
        "Wie sichern — Hardware ist unter Garantie und in Produktion?",
        "How do you preserve — hardware is under warranty and in production?",
        "Comment préserver — matériel sous garantie et en production ?",
      ),
      options: [
        { id: "memory_then_disk", correct: true, delta: +7, label: L(
          "Erst flüchtigen Speicher und Netzwerk-Stand sichern, dann offline Disk-Image, Chain-of-Custody mit Seriennummer und Schichtleiter dokumentieren",
          "Capture volatile memory and live network state first, then take an offline disk image, document chain-of-custody with serial number and shift lead",
          "Capturer d'abord la mémoire volatile et l'état réseau, puis image disque hors ligne, documenter la chaîne de garde avec numéro de série et chef de quart",
        ) },
        { id: "snapshot_only", correct: false, delta: -4, label: L(
          "Einen Hypervisor-Snapshot ziehen — die EWS läuft auf einer VM",
          "Just take a hypervisor snapshot — the EWS runs in a VM",
          "Faire seulement un snapshot d'hyperviseur — le poste tourne sur une VM",
        ) },
        { id: "send_back", correct: false, delta: -7, label: L(
          "Das Gerät direkt an den Hersteller schicken, der hat bessere Forensik-Tools",
          "Ship the device straight to the vendor — they have better forensic tools",
          "Renvoyer la machine au fournisseur — il a de meilleurs outils forensiques",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 3 — Safety Instrumented System (SIS) bypass attempt
// ============================================================================
const SIS_BYPASS: Incident = {
  id: "sis_bypass",
  tier: "hard",
  category: "endpoint",
  title: L(
    "Bypass-Versuch am Safety-System",
    "Bypass attempt on the safety system",
    "Tentative de bypass sur le système safety",
  ),
  brief: L(
    "Das SIS-HMI meldet einen Schreibversuch auf eine Trip-Setpoint-Tabelle (SIL-2 Brenner-Schutz).",
    "The SIS HMI reports a write attempt on a trip setpoint table (SIL-2 burner protection).",
    "Le HMI SIS signale une tentative d'écriture sur une table de seuils de déclenchement (protection brûleur SIL-2).",
  ),
  initialDelayMs: 8_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Erste Reaktion?", "First reaction?", "Première réaction ?"),
      options: [
        { id: "lock_safety_first", correct: true, delta: +8, label: L(
          "Safety-Officer sofort einbinden, SIS-Schreibverriegelung physisch aktivieren, Quelle des Versuchs in den Engineering-Logs identifizieren",
          "Loop in the safety officer immediately, physically engage the SIS write-lock, identify the source of the attempt in engineering logs",
          "Impliquer immédiatement le responsable safety, engager physiquement le verrou d'écriture SIS, identifier la source dans les logs d'ingénierie",
        ) },
        { id: "wait_log", correct: false, delta: -8, label: L(
          "Erst die Korrelation mit anderen Alerts abwarten — vielleicht Fehlalarm der HMI",
          "Wait for correlation with other alerts first — could be an HMI false positive",
          "Attendre la corrélation avec d'autres alertes — peut-être faux positif du HMI",
        ) },
        { id: "ask_vendor", correct: false, delta: -5, label: L(
          "Nur den SIS-Hersteller per E-Mail informieren und auf Rückmeldung warten",
          "Just email the SIS vendor and wait for a response",
          "Envoyer un mail au fournisseur SIS et attendre la réponse",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "isolate_sis_zone", correct: true, delta: +8, label: L(
          "Die SIS-Zone strikt vom BPCS-Conduit trennen, jede Schreib-Session aus dem Engineering nur noch nach physischem Schlüssel-Schalter freigeben",
          "Hard-segregate the SIS zone from the BPCS conduit, allow engineering writes only via the physical key switch",
          "Séparer strictement la zone SIS du conduit BPCS, n'autoriser les écritures d'ingénierie que via la clé physique",
        ) },
        { id: "stop_process", correct: false, delta: -7, label: L(
          "Den Brenner-Prozess sofort herunterfahren, das ist die sicherste Option",
          "Shut down the burner process immediately — that's the safest option",
          "Arrêter immédiatement le procédé brûleur — c'est l'option la plus sûre",
        ) },
        { id: "block_engineering", correct: false, delta: -5, label: L(
          "Alle Engineering-Konten unternehmensweit deaktivieren",
          "Disable every engineering account company-wide",
          "Désactiver tous les comptes d'ingénierie à l'échelle de l'entreprise",
        ) },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("Wer wird informiert?", "Who is informed?", "Qui informer ?"),
      options: [
        { id: "regulator_loop", correct: true, delta: +7, label: L(
          "Werkleitung, Safety-Komitee und Aufsichtsbehörde (Seveso/NIS-2) gemäß Eskalationsmatrix informieren, Vorfallregister aktualisieren",
          "Inform plant management, safety committee and the regulator (Seveso/NIS-2) per the escalation matrix, update the incident register",
          "Informer d'abord la direction site, le comité safety et l'autorité (Seveso/NIS-2) selon la matrice d'escalade, mettre à jour le registre d'incidents",
        ) },
        { id: "internal_only", correct: false, delta: -6, label: L(
          "Strikt intern halten — Aufsichtsbehörde erst informieren, wenn nachweislich etwas passiert ist",
          "Keep it strictly internal — only inform the regulator if something demonstrably happened",
          "Garder en interne — n'informer l'autorité que si quelque chose s'est réellement passé",
        ) },
        { id: "vendor_first", correct: false, delta: -4, label: L(
          "Nur den SIS-Hersteller einbinden, der soll das mit der Behörde klären",
          "Only loop the SIS vendor — let them deal with the regulator",
          "Impliquer uniquement le fournisseur SIS — qu'il s'occupe de l'autorité",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 4 — Vendor remote-access (RDP/Jump-Host) misuse
// ============================================================================
const VENDOR_REMOTE: Incident = {
  id: "vendor_remote_access",
  tier: "medium",
  category: "identity",
  title: L(
    "Vendor-Fernzugriff zur Unzeit",
    "Vendor remote access at an odd hour",
    "Accès distant fournisseur à une heure suspecte",
  ),
  brief: L(
    "Der Jump-Host meldet eine RDP-Sitzung des SPS-Herstellers um 03:14 Uhr — ohne Wartungsfenster.",
    "The jump host logs an RDP session from the PLC vendor at 03:14 — outside any maintenance window.",
    "Le jump host enregistre une session RDP du fournisseur API à 03h14 — hors fenêtre de maintenance.",
  ),
  initialDelayMs: 11_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie verifizieren?", "How do you verify?", "Comment vérifier ?"),
      options: [
        { id: "callback_known", correct: true, delta: +7, label: L(
          "Out-of-Band-Rückruf an die im Vendor-Vertrag hinterlegte Service-Hotline, parallel die Sitzungsaufzeichnung des Jump-Hosts prüfen",
          "Out-of-band callback to the vendor's service hotline as recorded in the contract, in parallel review the jump-host session recording",
          "Rappel out-of-band sur la hotline du fournisseur listée au contrat, en parallèle examiner l'enregistrement de session du jump host",
        ) },
        { id: "trust_session", correct: false, delta: -5, label: L(
          "Da MFA bestanden wurde, als legitim einstufen und das Ticket schließen",
          "MFA passed — classify as legitimate and close the ticket",
          "MFA validé — classer comme légitime et clôturer le ticket",
        ) },
        { id: "kill_now", correct: false, delta: -4, label: L(
          "Die RDP-Sitzung sofort hart abreißen und alle Vendor-Konten sperren",
          "Hard-kill the RDP session and lock every vendor account immediately",
          "Couper sèchement la session RDP et bloquer tous les comptes fournisseur",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "supervised_session", correct: true, delta: +7, label: L(
          "Sitzung in einen begleiteten Modus überführen, OT-Engineering schaut live mit, Schreibrechte werden einzeln freigegeben",
          "Convert the session to supervised mode, OT engineering watches live, write rights are released one by one",
          "Passer la session en mode supervisé, l'ingénierie OT regarde en direct, les droits d'écriture sont libérés un par un",
        ) },
        { id: "block_vendor_lan", correct: false, delta: -5, label: L(
          "Den Vendor-VLAN komplett vom OT-Netz trennen, Wartungstickets nachträglich klären",
          "Sever the vendor VLAN entirely from the OT network, sort out maintenance tickets later",
          "Couper le VLAN fournisseur du réseau OT, traiter les tickets de maintenance ensuite",
        ) },
        { id: "snmp_trap", correct: false, delta: -4, label: L(
          "Nur einen SNMP-Trap an den Vendor schicken und auf Rückmeldung warten",
          "Just send an SNMP trap to the vendor and wait for a response",
          "Envoyer juste un trap SNMP au fournisseur et attendre",
        ) },
      ],
    },
    {
      id: "harden", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Härtung", "Harden", "Durcissement"),
      prompt: L("Was härten?", "What do you harden?", "Que durcir ?"),
      options: [
        { id: "policy_window", correct: true, delta: +6, label: L(
          "Vendor-Zugriff auf benannte Wartungsfenster, ticket-basierte Just-In-Time-Konten und verpflichtende Sitzungs-Aufzeichnung umstellen",
          "Restrict vendor access to named maintenance windows, ticket-based just-in-time accounts, mandatory session recording",
          "Restreindre l'accès fournisseur à des fenêtres nommées, comptes JIT basés sur ticket, enregistrement de session obligatoire",
        ) },
        { id: "vpn_only", correct: false, delta: -3, label: L(
          "Nur 'noch ein zusätzliches VPN' verlangen — der Rest bleibt wie er ist",
          "Just demand 'one more VPN layer' — leave the rest as-is",
          "Exiger 'juste un VPN de plus' — laisser le reste tel quel",
        ) },
        { id: "trust_contract", correct: false, delta: -4, label: L(
          "Sich auf die Klauseln im Vendor-Vertrag verlassen, technisch nichts ändern",
          "Rely on the vendor contract clauses, change nothing technically",
          "Se reposer sur les clauses du contrat, ne rien changer techniquement",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 5 — ICS-aware ransomware in DMZ (IDMZ / L3.5)
// ============================================================================
const ICS_RANSOMWARE: Incident = {
  id: "ics_ransomware_dmz",
  tier: "hard",
  category: "endpoint",
  title: L(
    "Ransomware in der OT-DMZ",
    "Ransomware in the OT DMZ",
    "Ransomware dans la DMZ OT",
  ),
  brief: L(
    "EDR meldet Massen-Verschlüsselung auf einem Patch-Server in der IDMZ (L3.5) zwischen IT und OT.",
    "EDR reports mass encryption on a patch server in the IDMZ (L3.5) between IT and OT.",
    "L'EDR signale un chiffrement massif sur un serveur de patches dans l'IDMZ (L3.5) entre IT et OT.",
  ),
  initialDelayMs: 8_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 18_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Erste Reaktion?", "First reaction?", "Première réaction ?"),
      options: [
        { id: "edr_then_path", correct: true, delta: +7, label: L(
          "EDR-Telemetrie verifizieren und prüfen, ob die Ransomware bereits Pfade in Richtung L3 oder L2 sondiert hat",
          "Verify EDR telemetry and check whether the ransomware has already probed paths toward L3 or L2",
          "Vérifier la télémétrie EDR et contrôler si le ransomware a déjà sondé des chemins vers L3 ou L2",
        ) },
        { id: "shutdown_dmz", correct: false, delta: -4, label: L(
          "Den IDMZ-Server sauber herunterfahren, dann ein Image ziehen",
          "Cleanly shut down the IDMZ server, then take an image",
          "Éteindre proprement le serveur IDMZ, puis prendre une image",
        ) },
        { id: "wait_av", correct: false, delta: -5, label: L(
          "Warten, bis der Antivirus die Familie eindeutig identifiziert hat",
          "Wait until antivirus has clearly identified the malware family",
          "Attendre que l'antivirus ait clairement identifié la famille",
        ) },
      ],
    },
    {
      id: "isolate", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Isolation", "Isolate", "Isoler"),
      prompt: L(
        "Wie isolieren — ohne die Anlage abzuschneiden?",
        "How do you isolate — without cutting the plant off?",
        "Comment isoler sans isoler l'usine ?",
      ),
      options: [
        { id: "close_l3_l2", correct: true, delta: +9, label: L(
          "L3.5/L3-Conduit auf 'deny by default' setzen, nur dokumentierte OT-Datenflüsse explizit erlauben, Schichtleitung mit eingebunden",
          "Switch the L3.5/L3 conduit to deny-by-default, allow only documented OT data flows explicitly, with the shift lead in the loop",
          "Passer le conduit L3.5/L3 en deny-by-default, n'autoriser explicitement que les flux OT documentés, chef de quart impliqué",
        ) },
        { id: "kill_all_ot", correct: false, delta: -8, label: L(
          "Sofort alle Verbindungen zwischen IT und OT trennen, einschließlich Historian und Visualisierung",
          "Immediately sever every link between IT and OT, including historian and HMI",
          "Couper immédiatement toutes les liaisons IT-OT, y compris historian et HMI",
        ) },
        { id: "leave_running", correct: false, delta: -5, label: L(
          "Den Server unter Beobachtung weiterlaufen lassen, in der Hoffnung mehr IOCs zu sammeln",
          "Leave the server running under observation, hoping to gather more IOCs",
          "Laisser le serveur tourner sous observation pour récolter plus d'IOCs",
        ) },
      ],
    },
    {
      id: "recover", requiredRoom: "server_room", timeLimitMs: 24_000,
      title: L("Wiederherstellung", "Recovery", "Restauration"),
      prompt: L("Recovery?", "Recovery?", "Recovery ?"),
      options: [
        { id: "verified_offline", correct: true, delta: +8, label: L(
          "Offline-Backup auf Integrität prüfen, sauber zurückspielen, Patch-Workflow danach mit signierten Updates und Allowlist neu aufsetzen",
          "Verify the offline backup for integrity, restore cleanly, then rebuild the patch workflow with signed updates and an allowlist",
          "Vérifier l'intégrité du backup hors ligne, restaurer proprement, puis reconstruire le workflow de patches avec signatures et allowlist",
        ) },
        { id: "latest_online", correct: false, delta: -5, label: L(
          "Einfach das jüngste Online-Backup zurückspielen, ohne Integritätscheck",
          "Just restore the most recent online backup, no integrity check",
          "Restaurer simplement le backup en ligne le plus récent, sans vérification",
        ) },
        { id: "rebuild_blind", correct: false, delta: -4, label: L(
          "Server neu aufsetzen ohne Ursachen-Analyse, der Vendor liefert ja morgen einen neuen",
          "Rebuild the server without root cause analysis — the vendor ships a new one tomorrow",
          "Reconstruire sans analyse de cause — le fournisseur en livre un nouveau demain",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 6 — Historian data manipulation (integrity attack on time-series DB)
// ============================================================================
const HISTORIAN_TAMPER: Incident = {
  id: "historian_tampering",
  tier: "medium",
  category: "vuln",
  title: L(
    "Manipulation am Historian",
    "Tampering with the historian",
    "Altération de l'historian",
  ),
  brief: L(
    "Compliance meldet, dass Chargenwerte im Historian rückwirkend abweichen — relevant für die GMP-Freigabe.",
    "Compliance reports that batch values in the historian deviate retroactively — relevant for GMP release.",
    "La conformité signale que des valeurs de charge dans l'historian divergent rétroactivement — critique pour la libération GMP.",
  ),
  initialDelayMs: 12_000,
  steps: [
    {
      id: "verify", requiredRoom: "forensics", timeLimitMs: 24_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie absichern?", "How do you confirm?", "Comment confirmer ?"),
      options: [
        { id: "compare_replica", correct: true, delta: +7, label: L(
          "Werte gegen die Edge-Replikate und Papier-Schichtberichte abgleichen, Audit-Log und Dateisystem-Zeitstempel des Historian sichern",
          "Compare values against edge replicas and paper shift reports, preserve historian audit log and filesystem timestamps",
          "Comparer les valeurs avec les répliques edge et les rapports de quart papier, préserver l'audit log et les timestamps du système de fichiers",
        ) },
        { id: "ask_operator", correct: false, delta: -4, label: L(
          "Den Anlagenfahrer fragen, ob er sich an die Werte erinnert",
          "Ask the operator if they remember the values",
          "Demander à l'opérateur s'il se souvient des valeurs",
        ) },
        { id: "delete_diff", correct: false, delta: -8, label: L(
          "Die abweichenden Datensätze direkt löschen und neu aus den SPS importieren",
          "Just delete the deviating records and re-import from the PLCs",
          "Supprimer directement les enregistrements divergents et ré-importer depuis les API",
        ) },
      ],
    },
    {
      id: "preserve", requiredRoom: "forensics", timeLimitMs: 22_000,
      title: L("Beweissicherung", "Preserve", "Préserver"),
      prompt: L("Was sichern?", "What do you preserve?", "Que préserver ?"),
      options: [
        { id: "snapshot_chain", correct: true, delta: +7, label: L(
          "Sofortigen Read-only-Snapshot des Historian, Chain-of-Custody mit Zeitstempel und Schichtleitung dokumentieren, Replikate einfrieren",
          "Take an immediate read-only historian snapshot, document chain-of-custody with timestamps and shift lead, freeze the replicas",
          "Snapshot read-only immédiat de l'historian, documenter la chaîne de garde avec timestamps et chef de quart, geler les répliques",
        ) },
        { id: "live_query", correct: false, delta: -4, label: L(
          "Live im Produktiv-Historian queryen, um die Abweichungen zu lokalisieren",
          "Run live queries against the production historian to locate the deviations",
          "Faire des requêtes live sur l'historian de production pour localiser les écarts",
        ) },
        { id: "wait_qa", correct: false, delta: -5, label: L(
          "Warten, bis die Qualitätsabteilung morgen ihre eigene Analyse fährt",
          "Wait until QA runs their own analysis tomorrow",
          "Attendre que la qualité fasse sa propre analyse demain",
        ) },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L(
        "Wer wird informiert — Daten-Integritätsthema mit GMP-Bezug?",
        "Who is informed — a data-integrity issue with GMP impact?",
        "Qui informer — sujet d'intégrité des données avec impact GMP ?",
      ),
      options: [
        { id: "qa_compliance", correct: true, delta: +7, label: L(
          "Qualität, Compliance, Werkleitung und ggf. Aufsichtsbehörde formal einbinden, betroffene Chargen sperren bis Klärung",
          "Formally loop QA, compliance, plant management and possibly the regulator, block affected batches until clarified",
          "Impliquer formellement la qualité, la conformité, la direction et éventuellement l'autorité, bloquer les charges concernées jusqu'à clarification",
        ) },
        { id: "it_only", correct: false, delta: -6, label: L(
          "Nur den IT-CISO informieren, Qualität wird das schon selber merken",
          "Only inform the IT CISO — QA will notice on their own",
          "N'informer que le CISO IT — la qualité s'en apercevra toute seule",
        ) },
        { id: "release_anyway", correct: false, delta: -8, label: L(
          "Die Chargen vorerst freigeben, parallel die Untersuchung laufen lassen",
          "Release the batches anyway and let the investigation run in parallel",
          "Libérer les charges malgré tout et laisser l'enquête tourner en parallèle",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 7 — Asset-discovery storm (active scan launched into L2)
// ============================================================================
const SCAN_STORM: Incident = {
  id: "asset_scan_storm",
  tier: "easy",
  category: "network",
  title: L(
    "Asset-Scan im OT-Netz",
    "Asset scan in the OT network",
    "Scan d'inventaire dans le réseau OT",
  ),
  brief: L(
    "Mehrere alte SPS gehen kurz auf Fault — ein Praktikant hat einen Nmap-Scan im L2-Segment gestartet.",
    "Several legacy PLCs briefly trip into fault — an intern launched an Nmap scan in the L2 segment.",
    "Plusieurs API anciens passent brièvement en défaut — un stagiaire a lancé un Nmap dans le segment L2.",
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "verify", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "stop_scan", correct: true, delta: +6, label: L(
          "Den Scan sofort abbrechen lassen, Schichtleitung anrufen und gemeinsam den Anlagenstatus prüfen",
          "Have the scan aborted immediately, call the shift lead and jointly check plant status",
          "Faire interrompre le scan tout de suite, appeler le chef de quart et vérifier l'état de l'usine ensemble",
        ) },
        { id: "let_finish", correct: false, delta: -7, label: L(
          "Den Scan zu Ende laufen lassen — wir wollen den vollständigen Asset-Bericht",
          "Let the scan finish — we want the complete asset report",
          "Laisser le scan finir — on veut le rapport d'inventaire complet",
        ) },
        { id: "restart_plc", correct: false, delta: -5, label: L(
          "Die SPS in Fault einfach neu starten, das löst sich von selbst",
          "Just restart the PLCs in fault — that resolves itself",
          "Redémarrer les API en défaut — ça se résout tout seul",
        ) },
      ],
    },
    {
      id: "remediate", requiredRoom: "war_room", timeLimitMs: 20_000,
      title: L("Bereinigung", "Remediate", "Remédier"),
      prompt: L("Wie absichern?", "How do you harden?", "Comment durcir ?"),
      options: [
        { id: "passive_only", correct: true, delta: +7, label: L(
          "Aktive Scans im OT verbieten, einen passiven Discovery-Sensor (z. B. via SPAN-Port) etablieren und dokumentieren",
          "Forbid active scans in OT, deploy and document a passive discovery sensor (e.g. via SPAN)",
          "Interdire les scans actifs en OT, déployer et documenter un capteur de découverte passif (via SPAN)",
        ) },
        { id: "ban_intern", correct: false, delta: -3, label: L(
          "Den Praktikanten formell entlassen — Lehre für alle anderen",
          "Formally dismiss the intern — a lesson for everyone else",
          "Licencier formellement le stagiaire — leçon pour les autres",
        ) },
        { id: "no_change", correct: false, delta: -5, label: L(
          "Nichts ändern — beim nächsten Mal wird er aufpassen",
          "Change nothing — next time they'll be careful",
          "Ne rien changer — la prochaine fois il fera attention",
        ) },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 18_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("Wem berichten?", "Who do you brief?", "Qui briefer ?"),
      options: [
        { id: "lessons_learned", correct: true, delta: +5, label: L(
          "Lessons-Learned an OT-Engineering und IT-SOC, Eintrag in das Vorfallregister mit Maßnahme und Zieldatum",
          "Lessons-learned to OT engineering and the IT SOC, entry in the incident register with action and target date",
          "Lessons-learned à l'ingénierie OT et au SOC IT, entrée au registre avec action et échéance",
        ) },
        { id: "hush", correct: false, delta: -3, label: L(
          "Intern still halten — war ja kein 'echter' Vorfall",
          "Keep it internal and quiet — wasn't a 'real' incident",
          "Garder ça discret en interne — pas un 'vrai' incident",
        ) },
        { id: "blame_only", correct: false, delta: -2, label: L(
          "Den Praktikanten in der All-Hands-Mail namentlich nennen",
          "Name the intern in the all-hands email",
          "Citer le stagiaire dans le mail à toute l'entreprise",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 8 — Stuxnet-style worm in Level 2 (USB / engineering laptop vector)
// ============================================================================
const L2_WORM: Incident = {
  id: "l2_worm_outbreak",
  tier: "hard",
  category: "endpoint",
  title: L(
    "Wurm-Ausbreitung auf L2",
    "Worm outbreak on L2",
    "Propagation d'un ver sur L2",
  ),
  brief: L(
    "OT-IDS sieht SMB- und Step7-Verkehr quer über mehrere SPS-Subnetze — Eintragung vermutlich via USB an einer EWS.",
    "OT-IDS sees SMB and Step7 traffic across multiple PLC subnets — likely entry via USB on an EWS.",
    "L'IDS OT voit du SMB et du Step7 entre plusieurs sous-réseaux API — entrée probable via USB sur un poste d'ingénierie.",
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "scope", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Scope", "Scope", "Périmètre"),
      prompt: L("Wie umreißen?", "How do you scope?", "Comment cadrer ?"),
      options: [
        { id: "graph_lateral", correct: true, delta: +7, label: L(
          "Lateral-Movement-Graph aus den OT-IDS- und EDR-Daten zeichnen, betroffene Zellen identifizieren, Anlagenfahrer pro Zelle einbinden",
          "Build a lateral-movement graph from OT-IDS and EDR data, identify affected cells, loop in the operator per cell",
          "Construire un graphe de mouvement latéral à partir de l'IDS OT et de l'EDR, identifier les cellules touchées, impliquer l'opérateur par cellule",
        ) },
        { id: "endpoint_only", correct: false, delta: -5, label: L(
          "Nur die ursprüngliche EWS tief analysieren, der Rest klärt sich",
          "Only deep-dive the origin EWS — the rest will sort itself out",
          "Analyser uniquement le poste d'origine — le reste se résoudra",
        ) },
        { id: "ask_intern", correct: false, delta: -4, label: L(
          "Im Engineering nachfragen, ob jemand von einem USB-Stick weiß",
          "Ask around in engineering if anyone knows about a USB stick",
          "Demander à l'ingénierie si quelqu'un connaît une clé USB",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "cell_quarantine", correct: true, delta: +9, label: L(
          "Einzelne Produktionszellen am OT-Switch in Quarantäne setzen, EWS-Konten je Zelle einzeln deaktivieren, gemeinsam mit Schichtleitung priorisieren",
          "Quarantine individual production cells at the OT switch, disable EWS accounts cell-by-cell, prioritise with the shift lead",
          "Mettre en quarantaine cellule par cellule sur le switch OT, désactiver les comptes EWS cellule par cellule, prioriser avec le chef de quart",
        ) },
        { id: "kill_all_smb", correct: false, delta: -6, label: L(
          "Den gesamten SMB-Verkehr im OT pauschal blocken, auch zwischen Engineering und Historian",
          "Blanket-block all SMB traffic in OT, including between engineering and historian",
          "Bloquer en bloc tout le SMB en OT, y compris entre ingénierie et historian",
        ) },
        { id: "shutdown_plant", correct: false, delta: -8, label: L(
          "Vorsorglich die gesamte Linie stoppen, bis alle EWS sauber sind",
          "Stop the whole line as a precaution, until every EWS is clean",
          "Arrêter toute la ligne par précaution, jusqu'à ce que chaque poste soit propre",
        ) },
      ],
    },
    {
      id: "recover", requiredRoom: "server_room", timeLimitMs: 24_000,
      title: L("Wiederherstellung", "Recovery", "Restauration"),
      prompt: L("Wie wiederherstellen?", "How do you recover?", "Comment restaurer ?"),
      options: [
        { id: "golden_image_ews", correct: true, delta: +8, label: L(
          "Engineering-Workstations aus Golden-Images neu aufsetzen, USB-Ports per Policy hart sperren, signierte Engineering-Tools erzwingen",
          "Reimage engineering workstations from golden images, hard-disable USB ports via policy, enforce signed engineering tools",
          "Réinstaller les postes d'ingénierie depuis des golden images, désactiver durement les ports USB via policy, imposer des outils d'ingénierie signés",
        ) },
        { id: "av_scan_only", correct: false, delta: -5, label: L(
          "Auf jeder EWS einen vollen Antiviren-Scan laufen lassen und Ergebnis vertrauen",
          "Run a full antivirus scan on every EWS and trust the result",
          "Lancer un scan antivirus complet sur chaque poste et faire confiance au résultat",
        ) },
        { id: "reflash_plc", correct: false, delta: -6, label: L(
          "Vorsorglich alle SPS mit dem letzten Firmware-Image neu flashen",
          "As a precaution, re-flash every PLC with the latest firmware image",
          "Par précaution, re-flasher chaque API avec le dernier firmware",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 9 — HMI takeover via default credentials (web HMI)
// ============================================================================
const HMI_TAKEOVER: Incident = {
  id: "hmi_default_creds",
  tier: "medium",
  category: "identity",
  title: L(
    "HMI mit Default-Credentials übernommen",
    "HMI taken over via default credentials",
    "HMI compromis par identifiants par défaut",
  ),
  brief: L(
    "Threat-Intel-Feed listet eure Web-HMI auf einer Shodan-Scan-Liste — Login mit 'admin/admin' funktioniert.",
    "A threat-intel feed lists your web HMI on a Shodan scan list — 'admin/admin' login works.",
    "Un flux threat intel liste votre HMI web sur Shodan — le login 'admin/admin' fonctionne.",
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 20_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie verifizieren?", "How do you verify?", "Comment vérifier ?"),
      options: [
        { id: "internal_check", correct: true, delta: +7, label: L(
          "Aus einem getrennten Test-Netz die Erreichbarkeit prüfen, HMI-Audit-Log und Edge-Firewall-Logs auf Logins von außen abgleichen",
          "Check reachability from a segregated test network, correlate HMI audit log with edge firewall logs for external logins",
          "Vérifier l'accessibilité depuis un réseau de test isolé, corréler l'audit HMI avec les logs du firewall edge pour les logins externes",
        ) },
        { id: "live_login", correct: false, delta: -5, label: L(
          "Sich kurz live mit 'admin/admin' einloggen, um die Lücke selbst zu bestätigen",
          "Briefly log in as 'admin/admin' yourself to confirm the hole",
          "Se connecter brièvement en 'admin/admin' soi-même pour confirmer la faille",
        ) },
        { id: "trust_intel", correct: false, delta: -3, label: L(
          "Dem Feed direkt vertrauen und ohne eigene Prüfung sofort handeln",
          "Trust the feed directly and act without verifying yourself",
          "Faire confiance au flux et agir sans vérification interne",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 18_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "edge_acl", correct: true, delta: +8, label: L(
          "HMI am Edge auf eine Allowlist beschränken, Default-Konto deaktivieren und individuelle Konten mit MFA für Bedienpersonal einrichten",
          "Restrict the HMI at the edge to an allowlist, disable the default account and provision individual accounts with MFA for operators",
          "Restreindre le HMI au edge à une allowlist, désactiver le compte par défaut et créer des comptes individuels avec MFA pour les opérateurs",
        ) },
        { id: "shutdown_hmi", correct: false, delta: -6, label: L(
          "Das HMI sofort komplett vom Netz nehmen, die Schicht muss kurz blind fahren",
          "Take the HMI fully offline immediately — the shift will run blind for a bit",
          "Couper complètement le HMI — la garde tournera à l'aveugle un moment",
        ) },
        { id: "rename_user", correct: false, delta: -4, label: L(
          "Nur den Benutzer 'admin' in 'admin1' umbenennen, Passwort behalten",
          "Just rename 'admin' to 'admin1' and keep the password",
          "Renommer juste 'admin' en 'admin1' et garder le mot de passe",
        ) },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Reporting", "Report", "Reporting"),
      prompt: L("Was härten und melden?", "What do you harden and report?", "Que durcir et signaler ?"),
      options: [
        { id: "policy_audit", correct: true, delta: +7, label: L(
          "Asset-Inventar nach 'extern erreichbar + Default-Creds' durchsuchen, Ergebnisse an Werkleitung und CISO melden, Maßnahmenplan mit Eigentümer und Zieldatum",
          "Scan the asset inventory for 'externally reachable + default creds', report to plant management and CISO, action plan with owner and target date",
          "Inventorier les actifs 'exposés externe + creds par défaut', signaler à la direction site et au CISO, plan d'action avec responsable et échéance",
        ) },
        { id: "blame_vendor", correct: false, delta: -3, label: L(
          "Nur den HMI-Hersteller verantwortlich machen, intern keine Maßnahme",
          "Just blame the HMI vendor — no internal action",
          "Ne mettre en cause que le fournisseur HMI — aucune action interne",
        ) },
        { id: "no_report", correct: false, delta: -6, label: L(
          "Nichts melden — solange keiner draußen drauf war, ist es kein Vorfall",
          "Don't report — as long as nobody outside used it, it's not an incident",
          "Ne rien signaler — tant que personne d'extérieur n'a utilisé, ce n'est pas un incident",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 10 — UPS / power supply tampering on a substation (comic-relief but real risk)
// ============================================================================
const UPS_TAMPER: Incident = {
  id: "ups_tampering",
  tier: "comic",
  category: "governance",
  title: L(
    "USV in der Schaltanlage manipuliert?",
    "UPS tampering in the substation?",
    "USV trafiquée dans la sous-station ?",
  ),
  brief: L(
    "Werkschutz meldet eine Tür der Schaltanlage halb offen — die USV-Anzeige flackert, ein Servicekoffer steht da.",
    "Site security reports a substation door half open — the UPS display flickers, a service case is sitting nearby.",
    "La sécurité du site signale une porte de sous-station entrouverte — l'écran de l'USV scintille, une mallette de service traîne.",
  ),
  initialDelayMs: 9_000,
  steps: [
    {
      id: "react", requiredRoom: "war_room", timeLimitMs: 20_000,
      title: L("Reaktion", "Reaction", "Réaction"),
      prompt: L("Was zuerst?", "What first?", "Première action ?"),
      options: [
        { id: "secure_then_ot", correct: true, delta: +7, label: L(
          "Werkschutz übernimmt die physische Sicherung, OT-Engineering geht parallel die DR-Checkliste durch und prüft, ob die Anlage auf USV läuft",
          "Site security secures the location physically, OT engineering walks the DR checklist in parallel and checks whether the plant is on UPS",
          "La sécurité du site sécurise physiquement, l'ingénierie OT déroule la checklist DR en parallèle et vérifie si l'usine est sur USV",
        ) },
        { id: "go_alone", correct: false, delta: -5, label: L(
          "Selbst zur Schaltanlage gehen und kurz nachschauen — geht ja schneller",
          "Walk over to the substation yourself for a quick look — faster that way",
          "Aller soi-même jeter un œil — plus rapide ainsi",
        ) },
        { id: "panic_shutdown", correct: false, delta: -7, label: L(
          "Vorsorglich die gesamte Anlage runterfahren, bevor die USV fällt",
          "As a precaution, shut down the whole plant before the UPS drops",
          "Par précaution, arrêter toute l'usine avant que l'USV ne lâche",
        ) },
      ],
    },
    {
      id: "comms", requiredRoom: "ciso_office", timeLimitMs: 18_000,
      title: L("Kommunikation", "Comms", "Communication"),
      prompt: L("Wer wird informiert?", "Who is informed?", "Qui informer ?"),
      options: [
        { id: "shift_security_ciso", correct: true, delta: +6, label: L(
          "Schichtleitung, Werkschutz, OT-Engineering und CISO knapp und faktenbasiert informieren, parallel das Vorfallregister anlegen",
          "Brief shift lead, site security, OT engineering and the CISO briefly and factually, open an incident register entry in parallel",
          "Briefer brièvement et factuellement chef de quart, sécurité site, ingénierie OT et CISO, ouvrir une entrée au registre en parallèle",
        ) },
        { id: "all_hands", correct: false, delta: -4, label: L(
          "Sofort eine Mail an alle Mitarbeitenden mit Foto der offenen Tür schicken",
          "Send an immediate all-hands email with a photo of the open door",
          "Envoyer immédiatement un mail à tous avec photo de la porte ouverte",
        ) },
        { id: "silent", correct: false, delta: -3, label: L(
          "Nichts kommunizieren, vielleicht war es ja nur der Reinigungsdienst",
          "Communicate nothing — maybe it was just cleaning",
          "Ne rien communiquer — c'était peut-être juste le ménage",
        ) },
      ],
    },
  ],
};

// ----------------- Catalogue + comic flagging -----------------
export const INCIDENTS: Incident[] = [
  PLC_WRITE,
  EWS_COMPROMISE,
  SIS_BYPASS,
  VENDOR_REMOTE,
  ICS_RANSOMWARE,
  HISTORIAN_TAMPER,
  SCAN_STORM,
  L2_WORM,
  HMI_TAKEOVER,
  UPS_TAMPER,
];

/** Comic-relief incidents trigger the cheesy "audit" music mode. */
export const COMIC_INCIDENT_IDS = new Set<string>([
  "ups_tampering",
]);
