// OT-SOC Life: incidents tuned for industrial control system (ICS / OT) SOC training.
//
// Audience: SOC analysts with an IT background being cross-trained on OT
// specifics — Purdue model layering (L0-L3.5), conduits/zones (IEC 62443),
// and the SAIC priority order (Safety > Availability > Integrity > Confidentiality).
//
// DESIGN PRINCIPLE FOR OPTION COPY (read this before editing!):
//   • All three options per step are written with comparable length, register
//     and apparent professionalism. The "wrong" picks are NOT cartoonish
//     blunders — they are realistic IT-style reflexes a freshly-rotated
//     analyst would defend in a debrief ("we contained immediately", "we
//     followed AV process", "we shipped to vendor for forensics").
//   • Most incorrect options are *less-optimal*, not catastrophic: they
//     skip a coordination step, move too fast for OT cadence, or apply an
//     IT pattern (wipe & reimage, blanket block, AV scan) where SAIC-aware
//     judgement is required. Only one option per step is the "best" call.
//   • Avoid absolutism in the option text ("never", "always", "the only").
//     The rationale tier in `otSocLifeReasonOverrides.ts` does the
//     teaching — the option itself reads as something a real analyst would
//     actually type into a ticket.
//
// We deliberately re-use the IT room model (soc_floor / siem / forensics / noc /
// server_room / war_room / ciso_office / kitchen) because the existing pixel-
// art DollHouse renders only those rooms. The OT context comes from the i18n
// labels (room.<id>.name swaps to "Control Room", "OT-SIEM", "Engineering WS"…)
// and from the incident copy itself.

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
          "Per Nmap im OT-Segment aktiv scannen, um die Quell-IP und offene Ports der schreibenden Station zu identifizieren",
          "Run an active Nmap scan inside the OT segment to identify the source IP and open ports of the writing station",
          "Lancer un scan Nmap actif dans le segment OT pour identifier l'IP source et les ports ouverts de la station qui écrit",
        ) },
        { id: "ping_plc", correct: false, delta: -4, label: L(
          "Die SPS direkt anpingen und einen Read-Coils-Probe schicken, um Erreichbarkeit und Funktionscode zu verifizieren",
          "Ping the PLC directly and send a Read-Coils probe to verify reachability and function-code response",
          "Pinger directement l'API et envoyer un Read-Coils pour vérifier l'accessibilité et la réponse du code fonction",
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
        { id: "power_off_plc", correct: false, delta: -8, label: L(
          "Die SPS kontrolliert stromlos schalten, damit keine weiteren Schreibbefehle durchkommen, und parallel die Linienleitung informieren",
          "Power down the PLC in a controlled manner so no further write commands can land, and inform the line lead in parallel",
          "Couper l'alimentation de l'API de manière contrôlée pour qu'aucune écriture supplémentaire n'aboutisse, et informer le responsable de ligne en parallèle",
        ) },
        { id: "block_all_l2", correct: false, delta: -6, label: L(
          "Den gesamten L2/L3-Übergang trennen, inklusive Historian und HMI, bis das Engineering den Vorfall freigibt",
          "Sever the entire L2/L3 boundary, historian and HMI included, until engineering clears the incident",
          "Couper l'ensemble du passage L2/L3, historian et HMI compris, jusqu'à ce que l'ingénierie lève l'incident",
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
          "Direkt zum IT-CISO eskalieren, parallel im SOC-Ticket dokumentieren und die Anlage erst informieren, wenn das Bild belastbar ist",
          "Escalate straight to the IT CISO, document in parallel in the SOC ticket and brief production once the picture is solid",
          "Escalader directement au CISO IT, documenter en parallèle dans le ticket SOC et informer la production une fois l'image consolidée",
        ) },
        { id: "press_now", correct: false, delta: -6, label: L(
          "Pressestelle und Vorstand frühzeitig vorwarnen, damit die Kommunikation steht, bevor irgendetwas nach außen dringt",
          "Pre-warn comms and the board early so messaging is ready before anything leaks externally",
          "Prévenir la presse et le board tôt afin que la communication soit prête avant toute fuite externe",
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
          "Die EWS sofort plattmachen und aus dem Golden Image neu installieren, um den Beaconing-Prozess sicher zu beenden",
          "Wipe the EWS immediately and reinstall from the golden image to terminate the beaconing process for sure",
          "Repaver le poste tout de suite et réinstaller depuis l'image golden pour stopper le beaconing à coup sûr",
        ) },
        { id: "ask_engineer", correct: false, delta: -4, label: L(
          "Den zuständigen Engineer per Telefon kontaktieren und fragen, ob er gerade ein Tool oder Update auf der Workstation laufen hat",
          "Phone the responsible engineer and ask whether they are currently running a tool or update on the workstation",
          "Appeler l'ingénieur en charge et lui demander s'il exécute actuellement un outil ou une mise à jour sur le poste",
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
        { id: "shutdown_plant", correct: false, delta: -8, label: L(
          "Sicherheitshalber die gesamte Linie kontrolliert stoppen, bis die EWS sauber wiederhergestellt und freigegeben ist",
          "Stop the entire production line in a controlled way as a precaution, until the EWS is cleanly restored and signed off",
          "Arrêter toute la ligne de manière contrôlée par précaution, jusqu'à ce que le poste soit restauré proprement et validé",
        ) },
        { id: "ad_disable", correct: false, delta: -4, label: L(
          "Das AD-Konto des Users deaktivieren und einen vollen Antiviren-Scan auf der EWS starten, parallel ein neues Ticket im SOC öffnen",
          "Disable the user's AD account and start a full antivirus scan on the EWS, opening a new SOC ticket in parallel",
          "Désactiver le compte AD de l'utilisateur et lancer un scan antivirus complet sur le poste, ouvrir un nouveau ticket SOC en parallèle",
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
          "Einen Hypervisor-Snapshot ziehen und das Ticket damit schließen — die EWS läuft auf einer VM, das Image reicht für die Forensik",
          "Take a hypervisor snapshot and close the ticket with it — the EWS runs in a VM, the image is sufficient for forensics",
          "Faire un snapshot d'hyperviseur et clôturer le ticket avec — le poste tourne sur VM, l'image suffit pour la forensique",
        ) },
        { id: "send_back", correct: false, delta: -7, label: L(
          "Das Gerät direkt an den Hersteller schicken — der hat spezialisierte Forensik-Tools und kann den Vorfall im RMA-Prozess bearbeiten",
          "Ship the device straight to the vendor — they have specialised forensic tools and can handle the case under RMA",
          "Renvoyer la machine au fournisseur — il a des outils forensiques spécialisés et peut traiter le cas en RMA",
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
        { id: "wait_log", correct: false, delta: -7, label: L(
          "Erst die Korrelation mit anderen SIEM-Alerts abwarten, um einen möglichen Fehlalarm der HMI auszuschließen, bevor das Werk involviert wird",
          "Wait for correlation with other SIEM alerts first to rule out an HMI false positive before involving the plant",
          "Attendre la corrélation avec d'autres alertes SIEM pour écarter un faux positif HMI avant d'impliquer l'usine",
        ) },
        { id: "ask_vendor", correct: false, delta: -5, label: L(
          "Den SIS-Hersteller per E-Mail informieren und auf eine offizielle Stellungnahme warten, bevor lokale Maßnahmen ergriffen werden",
          "Email the SIS vendor and wait for an official statement before taking any local action",
          "Envoyer un mail au fournisseur SIS et attendre une prise de position officielle avant toute action locale",
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
        { id: "stop_process", correct: false, delta: -6, label: L(
          "Den Brenner-Prozess vorsorglich nach Standard-Shutdown-Procedure herunterfahren, bis die SIS-Integrität extern bestätigt ist",
          "Shut down the burner process per the standard shutdown procedure as a precaution, until SIS integrity is externally confirmed",
          "Arrêter le procédé brûleur selon la procédure d'arrêt standard par précaution, jusqu'à confirmation externe de l'intégrité SIS",
        ) },
        { id: "block_engineering", correct: false, delta: -5, label: L(
          "Alle Engineering-Konten unternehmensweit deaktivieren, bis die Quelle des Schreibversuchs eindeutig identifiziert ist",
          "Disable every engineering account company-wide until the source of the write attempt has been identified beyond doubt",
          "Désactiver tous les comptes d'ingénierie dans l'entreprise jusqu'à identification certaine de l'origine de la tentative",
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
          "Strikt intern halten und die Aufsichtsbehörde erst informieren, wenn ein nachweisbarer Schaden oder Datenabfluss vorliegt",
          "Keep it strictly internal and only inform the regulator once there is demonstrable damage or data exfiltration",
          "Garder strictement en interne et n'informer l'autorité qu'en cas de dommage avéré ou d'exfiltration de données",
        ) },
        { id: "vendor_first", correct: false, delta: -4, label: L(
          "Zunächst nur den SIS-Hersteller einbinden und die Klärung mit der Aufsichtsbehörde im Rahmen des Vendor-Supportvertrags abwickeln",
          "Loop only the SIS vendor first and run the regulator clarification through the vendor support contract",
          "Impliquer d'abord uniquement le fournisseur SIS et traiter la clarification avec l'autorité dans le cadre du contrat de support",
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
          "Da MFA und Konto-Validierung sauber bestanden wurden, die Sitzung als legitimen Notfall-Zugriff einstufen und das Ticket schließen",
          "Since MFA and account validation passed cleanly, classify the session as a legitimate emergency access and close the ticket",
          "Comme la MFA et la validation du compte sont passées proprement, classer la session comme accès d'urgence légitime et clôturer le ticket",
        ) },
        { id: "kill_now", correct: false, delta: -4, label: L(
          "Die RDP-Sitzung sofort beenden und alle Vendor-Konten am Jump-Host vorsorglich sperren, bis die Ursache geklärt ist",
          "Terminate the RDP session immediately and lock every vendor account at the jump host as a precaution, until the cause is clarified",
          "Couper la session RDP immédiatement et verrouiller tous les comptes fournisseur sur le jump host par précaution, jusqu'à clarification",
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
          "Den Vendor-VLAN komplett vom OT-Netz trennen und offene Wartungstickets im Anschluss über den Service-Manager nachträglich klären",
          "Sever the vendor VLAN entirely from the OT network and sort out open maintenance tickets afterwards through the service manager",
          "Couper le VLAN fournisseur du réseau OT et traiter ensuite les tickets de maintenance ouverts via le service manager",
        ) },
        { id: "snmp_trap", correct: false, delta: -4, label: L(
          "Einen SNMP-Trap und eine E-Mail-Benachrichtigung an den Vendor schicken und auf eine offizielle Rückmeldung warten",
          "Send an SNMP trap and an email notification to the vendor and wait for an official response",
          "Envoyer un trap SNMP et une notification e-mail au fournisseur et attendre une réponse officielle",
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
          "Eine zusätzliche VPN-Schicht vor dem Jump-Host anfordern und die bestehenden Vendor-Prozesse ansonsten unverändert lassen",
          "Demand an additional VPN layer in front of the jump host and otherwise leave the existing vendor processes unchanged",
          "Exiger une couche VPN supplémentaire devant le jump host et laisser le reste des processus fournisseur inchangé",
        ) },
        { id: "trust_contract", correct: false, delta: -4, label: L(
          "Sich auf die Vertraulichkeits- und Sicherheitsklauseln im Vendor-Vertrag verlassen und technisch keine zusätzliche Maßnahme einführen",
          "Rely on the confidentiality and security clauses in the vendor contract and introduce no additional technical measure",
          "Se reposer sur les clauses de confidentialité et sécurité du contrat fournisseur et n'introduire aucune mesure technique supplémentaire",
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
          "Den IDMZ-Server kontrolliert herunterfahren, anschließend ein Forensik-Image ziehen und das System aus dem Backup neu aufsetzen",
          "Cleanly shut down the IDMZ server, then take a forensic image and rebuild the system from backup",
          "Éteindre proprement le serveur IDMZ, prendre ensuite une image forensique et reconstruire le système à partir du backup",
        ) },
        { id: "wait_av", correct: false, delta: -5, label: L(
          "Warten, bis die Antiviren-Signaturen die Ransomware-Familie eindeutig identifiziert haben, bevor weitere Maßnahmen ergriffen werden",
          "Wait until antivirus signatures have clearly identified the ransomware family before taking further action",
          "Attendre que les signatures antivirus aient clairement identifié la famille avant toute action supplémentaire",
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
        { id: "kill_all_ot", correct: false, delta: -7, label: L(
          "Alle Verbindungen zwischen IT und OT pauschal trennen, einschließlich Historian und HMI-Visualisierung, bis das Bild klar ist",
          "Severe every link between IT and OT in one sweep, including historian and HMI visualisation, until the picture is clear",
          "Couper en bloc toutes les liaisons IT-OT, y compris historian et visualisation HMI, jusqu'à ce que l'image soit claire",
        ) },
        { id: "leave_running", correct: false, delta: -6, label: L(
          "Den Server unter Beobachtung weiterlaufen lassen, um zusätzliche IOCs und Lateral-Movement-Muster für die Analyse zu sammeln",
          "Leave the server running under observation to collect additional IOCs and lateral-movement patterns for analysis",
          "Laisser le serveur tourner sous observation pour récolter davantage d'IOCs et de schémas de mouvement latéral",
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
          "Das jüngste Online-Backup direkt zurückspielen, um den Service so schnell wie möglich wieder verfügbar zu machen",
          "Restore the most recent online backup directly to bring the service back online as fast as possible",
          "Restaurer directement le backup en ligne le plus récent pour rétablir le service au plus vite",
        ) },
        { id: "rebuild_blind", correct: false, delta: -5, label: L(
          "Den Server vom Vendor-Image neu aufsetzen und die Ursachen-Analyse parallel zur Wiederinbetriebnahme laufen lassen",
          "Rebuild the server from the vendor image and run the root-cause analysis in parallel to bringing the system back online",
          "Reconstruire le serveur depuis l'image fournisseur et mener l'analyse de cause en parallèle de la remise en service",
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
          "Den Anlagenfahrer der betroffenen Schicht befragen, um aus seinem Gedächtnis eine Vergleichsbasis für die Werte zu rekonstruieren",
          "Interview the operator of the affected shift to reconstruct a comparison baseline for the values from memory",
          "Interroger l'opérateur de la garde concernée pour reconstruire une base de comparaison des valeurs à partir de sa mémoire",
        ) },
        { id: "delete_diff", correct: false, delta: -7, label: L(
          "Die abweichenden Datensätze direkt löschen und den Historian sauber aus den SPS-Buffern neu importieren, um den Konflikt zu beheben",
          "Delete the deviating records directly and cleanly re-import the historian from the PLC buffers to resolve the conflict",
          "Supprimer directement les enregistrements divergents et ré-importer proprement l'historian depuis les buffers API pour lever le conflit",
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
          "Live-Queries im Produktiv-Historian fahren, um die abweichenden Datensätze zu lokalisieren, bevor irgendetwas eingefroren wird",
          "Run live queries against the production historian to locate the deviating records before anything is frozen",
          "Faire des requêtes live sur l'historian de production pour localiser les enregistrements divergents avant tout gel",
        ) },
        { id: "wait_qa", correct: false, delta: -5, label: L(
          "Warten, bis die Qualitätsabteilung am nächsten Werktag ihre eigene formale Analyse fährt, und bis dahin keine zusätzlichen Daten ziehen",
          "Wait until QA runs their own formal analysis on the next business day, and pull no additional data until then",
          "Attendre que la qualité fasse sa propre analyse formelle le prochain jour ouvré, sans extraire de données supplémentaires d'ici là",
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
          "Zunächst nur den IT-CISO informieren und auf den nächsten regulären QA-Review warten, der die Abweichung ohnehin erkennen würde",
          "Inform only the IT CISO first and wait for the next regular QA review, which would detect the deviation anyway",
          "N'informer d'abord que le CISO IT et attendre la prochaine revue qualité, qui détecterait de toute façon l'écart",
        ) },
        { id: "release_anyway", correct: false, delta: -8, label: L(
          "Die betroffenen Chargen vorerst freigeben und die Untersuchung parallel laufen lassen, um Lieferverpflichtungen einzuhalten",
          "Release the affected batches for now and run the investigation in parallel to keep delivery commitments",
          "Libérer les charges concernées dans un premier temps et mener l'enquête en parallèle pour tenir les engagements de livraison",
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
        { id: "let_finish", correct: false, delta: -6, label: L(
          "Den Scan kontrolliert zu Ende laufen lassen, um einen vollständigen Asset-Bericht zu erhalten und die Doppelarbeit zu vermeiden",
          "Let the scan finish in a controlled manner to obtain a complete asset report and avoid having to repeat the work",
          "Laisser le scan se terminer de façon contrôlée pour obtenir un rapport d'inventaire complet et éviter de refaire le travail",
        ) },
        { id: "restart_plc", correct: false, delta: -5, label: L(
          "Die SPS in Fault per Standardprozedur neu starten, um die Anlage zügig wieder in den Normalbetrieb zu bringen",
          "Restart the PLCs in fault per standard procedure to swiftly bring the plant back to normal operation",
          "Redémarrer les API en défaut selon la procédure standard pour ramener rapidement l'usine en fonctionnement normal",
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
        { id: "ban_intern", correct: false, delta: -4, label: L(
          "Den Praktikanten formell entlassen und den Vorfall als personelles Versagen im HR-System dokumentieren",
          "Formally dismiss the intern and document the incident as a personnel failure in the HR system",
          "Licencier formellement le stagiaire et documenter l'incident comme défaillance personnelle dans le système RH",
        ) },
        { id: "no_change", correct: false, delta: -5, label: L(
          "Keine technischen Änderungen einführen und stattdessen das Engineering um eine zusätzliche Awareness-Session bitten",
          "Introduce no technical changes and instead ask engineering to run an additional awareness session",
          "N'introduire aucun changement technique et demander plutôt à l'ingénierie une session de sensibilisation supplémentaire",
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
        { id: "hush", correct: false, delta: -4, label: L(
          "Den Vorfall intern still halten, um den Praktikanten zu schützen, da kein produktionsrelevanter Schaden entstanden ist",
          "Keep the incident internal and quiet to protect the intern, as no production-relevant damage occurred",
          "Garder l'incident discret en interne pour protéger le stagiaire, aucun dommage pertinent pour la production n'étant survenu",
        ) },
        { id: "blame_only", correct: false, delta: -3, label: L(
          "Den Praktikanten in der All-Hands-Mail namentlich nennen, damit alle anderen aus dem Vorfall lernen können",
          "Name the intern in the all-hands email so everyone else can learn from the incident",
          "Citer le stagiaire dans le mail à toute l'entreprise pour que les autres apprennent de l'incident",
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
          "Zunächst nur die ursprüngliche EWS tief analysieren und davon ausgehen, dass die Ausbreitung von dort aus rekonstruierbar ist",
          "Deep-dive the origin EWS first and assume the spread can be reconstructed from there",
          "Analyser d'abord en profondeur le poste d'origine et partir du principe que la propagation peut être reconstituée à partir de là",
        ) },
        { id: "ask_intern", correct: false, delta: -4, label: L(
          "Im Engineering und beim Werkschutz nachfragen, ob jemandem ein USB-Stick aus den letzten Tagen aufgefallen ist",
          "Ask around in engineering and site security whether anyone noticed a USB stick over the last few days",
          "Demander à l'ingénierie et à la sécurité du site si quelqu'un a remarqué une clé USB ces derniers jours",
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
          "Den gesamten SMB-Verkehr im OT pauschal blocken, einschließlich der Verbindung zwischen Engineering und Historian",
          "Blanket-block all SMB traffic in OT, including the connection between engineering and the historian",
          "Bloquer en bloc tout le SMB en OT, y compris la liaison entre ingénierie et historian",
        ) },
        { id: "shutdown_plant", correct: false, delta: -7, label: L(
          "Vorsorglich die gesamte Linie kontrolliert stoppen, bis jede EWS sauber überprüft und wieder freigegeben ist",
          "Stop the whole line in a controlled way as a precaution, until every EWS has been cleanly checked and re-cleared",
          "Arrêter toute la ligne de manière contrôlée par précaution, jusqu'à ce que chaque poste soit vérifié proprement et libéré",
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
          "Auf jeder EWS einen vollen Antiviren-Scan laufen lassen und das Ergebnis als Freigabekriterium für die Wiederinbetriebnahme nutzen",
          "Run a full antivirus scan on every EWS and use the result as the release criterion for bringing the systems back online",
          "Lancer un scan antivirus complet sur chaque poste et utiliser le résultat comme critère de validation pour la remise en service",
        ) },
        { id: "reflash_plc", correct: false, delta: -6, label: L(
          "Vorsorglich alle SPS mit dem letzten signierten Firmware-Image neu flashen, um eine mögliche Persistenz im Step7-Code auszuschließen",
          "As a precaution, re-flash every PLC with the latest signed firmware image to rule out possible persistence in the Step7 code",
          "Par précaution, re-flasher chaque API avec le dernier firmware signé pour écarter une éventuelle persistance dans le code Step7",
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
          "Sich kurz live mit 'admin/admin' am HMI einloggen, um die Lücke selbst zu bestätigen, bevor der Vendor informiert wird",
          "Briefly log in to the HMI as 'admin/admin' yourself to confirm the hole before the vendor is informed",
          "Se connecter brièvement en 'admin/admin' sur le HMI pour confirmer la faille avant d'informer le fournisseur",
        ) },
        { id: "trust_intel", correct: false, delta: -4, label: L(
          "Dem Threat-Intel-Feed direkt vertrauen und ohne eigene technische Verifikation sofort die Eindämmungsmaßnahmen einleiten",
          "Trust the threat-intel feed directly and start the containment measures immediately without own technical verification",
          "Faire confiance au flux threat intel et lancer immédiatement les mesures de confinement sans vérification technique propre",
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
          "Das HMI sofort komplett vom Netz nehmen und die Schicht in Abstimmung mit dem Anlagenfahrer kurz blind weiterfahren lassen",
          "Take the HMI fully offline immediately and let the shift run blind for a short while in coordination with the operator",
          "Couper complètement le HMI immédiatement et laisser la garde tourner brièvement à l'aveugle en accord avec l'opérateur",
        ) },
        { id: "rename_user", correct: false, delta: -5, label: L(
          "Nur den Benutzer 'admin' in 'admin1' umbenennen und das vorhandene Passwort beibehalten, um die Skripte nicht zu brechen",
          "Just rename user 'admin' to 'admin1' and keep the existing password so as not to break the scripts",
          "Renommer juste l'utilisateur 'admin' en 'admin1' et conserver le mot de passe existant pour ne pas casser les scripts",
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
        { id: "blame_vendor", correct: false, delta: -4, label: L(
          "Den HMI-Hersteller im Ticket als Hauptverantwortlichen führen und intern auf den nächsten regulären Patch-Zyklus warten",
          "Record the HMI vendor as the main responsible party in the ticket and internally wait for the next regular patch cycle",
          "Désigner le fournisseur HMI comme principal responsable dans le ticket et attendre en interne le prochain cycle de patch",
        ) },
        { id: "no_report", correct: false, delta: -6, label: L(
          "Auf eine offizielle Meldung verzichten, solange keine externe Anmeldung im Audit-Log nachweisbar ist und der Vorfall intern bleibt",
          "Skip the formal report as long as no external login is provable in the audit log and the incident remains internal",
          "Renoncer au signalement officiel tant qu'aucun login externe n'est prouvable dans l'audit log et que l'incident reste interne",
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
        { id: "go_alone", correct: false, delta: -6, label: L(
          "Selbst zur Schaltanlage gehen und die Lage kurz vor Ort prüfen, das spart die Wartezeit auf den Werkschutz",
          "Walk over to the substation yourself and check the situation on site briefly — saves waiting for site security",
          "Aller soi-même à la sous-station et évaluer rapidement sur place — cela évite l'attente de la sécurité du site",
        ) },
        { id: "panic_shutdown", correct: false, delta: -7, label: L(
          "Vorsorglich die gesamte Anlage kontrolliert herunterfahren, bevor die USV ausfällt und die Produktion ungeplant verliert",
          "As a precaution, shut down the whole plant in a controlled way before the UPS drops and production is lost unplanned",
          "Par précaution, arrêter l'ensemble de l'usine de manière contrôlée avant que l'USV ne lâche et que la production ne soit perdue",
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
        { id: "all_hands", correct: false, delta: -5, label: L(
          "Sofort eine All-Hands-Mail mit Foto der offenen Tür schicken, damit alle Mitarbeitenden auf der Hut sind",
          "Send an immediate all-hands email with a photo of the open door so every employee is on alert",
          "Envoyer immédiatement un mail à tous avec photo de la porte ouverte pour que chacun reste vigilant",
        ) },
        { id: "silent", correct: false, delta: -4, label: L(
          "Vorerst nichts kommunizieren, bis geklärt ist, ob es sich nicht doch nur um den Reinigungsdienst oder eine geplante Wartung handelt",
          "Communicate nothing for now until it is clarified that this isn't simply the cleaning service or a planned maintenance task",
          "Ne rien communiquer pour l'instant jusqu'à ce qu'il soit clair qu'il ne s'agit pas simplement du ménage ou d'une maintenance planifiée",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 11 — Surprise auditor on the floor (comic relief)
// ============================================================================
const SURPRISE_AUDITOR: Incident = {
  id: "surprise_auditor",
  tier: "comic",
  category: "process",
  title: L(
    "Auditor steht plötzlich im SOC",
    "Surprise auditor on the SOC floor",
    "Un auditeur débarque dans le SOC",
  ),
  brief: L(
    "Ein externer NIS-2-Auditor steht unangekündigt vor der Tür, mit Klemmbrett, Lanyard und drei Fragen, die er „nur kurz“ klären will.",
    "An external NIS-2 auditor turns up unannounced at the door, clipboard in hand, lanyard swinging, and three questions he just wants to clear up quickly.",
    "Un auditeur NIS-2 externe se présente à l'improviste, planchette en main, badge au cou, et trois questions qu'il veut juste tirer au clair.",
  ),
  initialDelayMs: 11_000,
  steps: [
    {
      id: "greet", requiredRoom: "war_room", timeLimitMs: 22_000,
      title: L("Empfang", "Greet", "Accueil"),
      prompt: L("Wie reagieren?", "How do you react?", "Comment réagir ?"),
      options: [
        { id: "verify_then_room", correct: true, delta: +6, label: L(
          "Identität am Empfang verifizieren lassen, Begleitperson aus Compliance dazuholen und in den War Room mit Whiteboard führen, Telefone vorher leise stellen",
          "Have reception verify the auditor's identity, pull a chaperone from compliance, walk him to the war room with a whiteboard, silence the phones first",
          "Faire vérifier l'identité à l'accueil, demander un accompagnant compliance, l'amener en war room avec tableau, mettre les téléphones en silencieux",
        ) },
        { id: "show_everything", correct: false, delta: -4, label: L(
          "Den Auditor direkt im SOC herumführen, ihm spontan über die Schulter Live-Tickets und SIEM-Dashboards zeigen, damit er sieht, dass „nichts zu verbergen“ ist",
          "Walk the auditor straight into the SOC, show him live tickets and SIEM dashboards over your shoulder so he sees there is nothing to hide",
          "Faire entrer l'auditeur directement dans le SOC, lui montrer tickets live et tableaux SIEM par-dessus l'épaule pour montrer que rien n'est caché",
        ) },
        { id: "stall_him", correct: false, delta: -3, label: L(
          "Sagen, dass leider gerade niemand Zeit hat, ihn auf nächste Woche vertrösten und ihm einen Kaffee aus dem Automaten anbieten",
          "Tell him nobody has time right now, ask him to come back next week, and offer him a vending-machine coffee on the way out",
          "Lui dire que personne n'a le temps maintenant, le renvoyer à la semaine prochaine et lui offrir un café du distributeur en partant",
        ) },
      ],
    },
    {
      id: "evidence", requiredRoom: "ciso_office", timeLimitMs: 24_000,
      title: L("Evidenz", "Evidence", "Preuves"),
      prompt: L(
        "Er fragt nach dem letzten OT-Incident-Bericht. Was zeigen?",
        "He asks for the last OT incident report. What do you show?",
        "Il demande le dernier rapport d'incident OT. Que montrer ?",
      ),
      options: [
        { id: "redacted_pack", correct: true, delta: +7, label: L(
          "Den freigegebenen, redigierten Vorfallbericht aus dem Document-Repo zeigen, mit Zeitstempeln, Owner und Maßnahmenstatus, alles unter Aufsicht der Compliance",
          "Hand over the approved, redacted incident report from the document repo — timestamps, owners, action status, with compliance present",
          "Présenter le rapport d'incident approuvé et expurgé du dépôt documentaire — horodatages, responsables, statut des actions, en présence de compliance",
        ) },
        { id: "open_ticket_system", correct: false, delta: -5, label: L(
          "Ihm direkten Lesezugriff auf das laufende Ticketsystem geben, damit er „sich selbst überzeugen“ kann, wie transparent das Team arbeitet",
          "Give him direct read access to the live ticketing system so he can see for himself how transparent the team works",
          "Lui donner un accès lecture direct au système de tickets en cours pour qu'il « se rende compte par lui-même » de la transparence",
        ) },
        { id: "make_it_up", correct: false, delta: -7, label: L(
          "Schnell ein „Beispielreport“-Dokument neu zusammenklicken, das so aussieht, als wäre es schon immer da gewesen, und ihm das aushändigen",
          "Quickly assemble a fresh ‘example report’ document that looks like it has always been there and hand him that one",
          "Bricoler vite un « rapport-exemple » qui a l'air d'avoir toujours existé et le lui remettre",
        ) },
      ],
    },
    {
      id: "trick_q", requiredRoom: "war_room", timeLimitMs: 20_000,
      title: L("Fangfrage", "Trick question", "Question piège"),
      prompt: L(
        "„Wie oft testen Sie Ihren Notfallplan?“ — Antwort?",
        "\"How often do you test your incident response plan?\" — answer?",
        "« À quelle fréquence testez-vous votre plan d'urgence ? » — réponse ?",
      ),
      options: [
        { id: "honest_with_plan", correct: true, delta: +6, label: L(
          "Ehrlich antworten: zuletzt vor X Monaten als Tabletop, nächster Termin steht im Plan, und das Protokoll des letzten TTX liegt im selben Repo",
          "Answer honestly: last tabletop X months ago, the next slot is on the plan, and the protocol of the last TTX is in the same repo",
          "Répondre honnêtement : dernier tabletop il y a X mois, le prochain est planifié, et le compte rendu du dernier TTX est dans le même dépôt",
        ) },
        { id: "exaggerate", correct: false, delta: -6, label: L(
          "Souverän behaupten „quartalsweise, vollständig durchgespielt mit allen Stakeholdern“ und hoffen, dass er nicht nach Beleg fragt",
          "Confidently claim ‘quarterly, fully exercised with all stakeholders’ and hope he doesn't ask for evidence",
          "Affirmer avec aplomb « trimestriellement, joué intégralement avec tous les acteurs » et espérer qu'il ne demande pas de preuve",
        ) },
        { id: "deflect_to_ciso", correct: false, delta: -3, label: L(
          "Erklären, das sei eine Frage für den CISO, ihn bitten, das Thema später schriftlich nachzureichen, und das Gespräch elegant umlenken",
          "Explain that this is a CISO question, ask him to submit it in writing later, and steer the conversation elsewhere",
          "Expliquer que c'est une question pour le CISO, lui demander de la soumettre par écrit, et rediriger la discussion",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 12 — DNS exfiltration from a historian replica
// ============================================================================
const HISTORIAN_DNS_EXFIL: Incident = {
  id: "historian_dns_exfil",
  tier: "hard",
  category: "network",
  title: L(
    "DNS-Exfil aus Historian-Replica",
    "DNS exfil from historian replica",
    "Exfiltration DNS depuis la réplique historian",
  ),
  brief: L(
    "Im DMZ-Resolver fallen lange Base32-Subdomains auf — Quelle ist der Read-only-Historian-Spiegel in der L3.5-Zone.",
    "DMZ resolver shows long base32 subdomains — source is the read-only historian replica in the L3.5 zone.",
    "Le résolveur DMZ remonte de longs sous-domaines en base32 — la source est la réplique historian en lecture seule en L3.5.",
  ),
  initialDelayMs: 10_000,
  steps: [
    {
      id: "verify", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L("Wie validieren?", "How do you validate?", "Comment valider ?"),
      options: [
        { id: "passive_dns", correct: true, delta: +7, label: L(
          "Passive-DNS und NetFlow korrelieren, Subdomain-Entropie und Anfragefrequenz mit dem Baseline-Profil des Historians abgleichen",
          "Correlate passive DNS with NetFlow, compare subdomain entropy and query rate against the historian's baseline profile",
          "Corréler le DNS passif et le NetFlow, comparer l'entropie des sous-domaines et la fréquence à la baseline de l'historian",
        ) },
        { id: "block_dns", correct: false, delta: -5, label: L(
          "Sofort den DNS-Resolver in der DMZ blocken, damit kein weiterer Datenabfluss möglich ist, und parallel das Engineering informieren",
          "Block the DMZ DNS resolver immediately to stop further exfil, then inform engineering in parallel",
          "Bloquer immédiatement le résolveur DNS DMZ pour stopper toute fuite, puis informer l'ingénierie en parallèle",
        ) },
        { id: "reboot_historian", correct: false, delta: -6, label: L(
          "Den Historian-Spiegel neu starten und beobachten, ob das Verhalten nach dem Reboot verschwindet — schneller als jede Korrelation",
          "Reboot the historian replica and watch whether the behaviour disappears after restart — faster than any correlation work",
          "Redémarrer la réplique historian et observer si le comportement disparaît après reboot — plus rapide qu'une corrélation",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 22_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "sinkhole_egress", correct: true, delta: +8, label: L(
          "Den verdächtigen Domain-Suffix in einen internen Sinkhole umlenken, Egress aus L3.5 auf den freigegebenen Resolver einschränken, Snapshot vor jeder Änderung",
          "Sinkhole the suspicious domain suffix internally, restrict L3.5 egress to the approved resolver only, snapshot before any change",
          "Détourner le suffixe suspect vers un sinkhole interne, restreindre la sortie L3.5 au résolveur approuvé, snapshot avant chaque modification",
        ) },
        { id: "cut_internet", correct: false, delta: -5, label: L(
          "Die gesamte Internet-Anbindung der OT-DMZ pauschal kappen, bis die Quelle eindeutig identifiziert ist",
          "Sever the entire OT DMZ internet uplink wholesale until the source is unambiguously identified",
          "Couper l'ensemble de la liaison Internet de la DMZ OT jusqu'à identification claire de la source",
        ) },
        { id: "leave_running", correct: false, delta: -7, label: L(
          "Den Datenstrom weiterlaufen lassen, um „mehr Telemetrie für die Analyse zu sammeln“, bevor man eingreift",
          "Let the data stream keep running to „gather more telemetry for analysis" before intervening",
          "Laisser le flux continuer pour « collecter plus de télémétrie pour l'analyse » avant d'intervenir",
        ) },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 22_000,
      title: L("Meldung", "Report", "Signalement"),
      prompt: L("Wer wird informiert?", "Who is informed?", "Qui informer ?"),
      options: [
        { id: "ciso_legal_dpo", correct: true, delta: +6, label: L(
          "CISO, Legal und DPO einbinden, NIS-2-Frühwarnung vorbereiten, parallel den vermuteten Datenumfang aus dem Historian-Schema ableiten",
          "Loop in CISO, legal and DPO, prepare the NIS-2 early warning, derive the likely data scope from the historian schema in parallel",
          "Impliquer CISO, juridique et DPO, préparer l'alerte précoce NIS-2, déduire en parallèle l'étendue probable des données depuis le schéma historian",
        ) },
        { id: "wait_proof", correct: false, delta: -6, label: L(
          "Erstmal abwarten, bis ein „handfester Beweis“ für tatsächlichen Datenabfluss vorliegt, bevor irgendjemand außerhalb des SOC informiert wird",
          "Wait until there is „hard proof" of actual data loss before informing anyone outside the SOC",
          "Attendre une « preuve solide » d'une exfiltration effective avant d'informer qui que ce soit hors du SOC",
        ) },
        { id: "vendor_first", correct: false, delta: -4, label: L(
          "Zuerst den Historian-Hersteller kontaktieren und ihn bitten, das Verhalten remote zu analysieren, bevor man intern eskaliert",
          "Contact the historian vendor first and ask them to analyse the behaviour remotely before escalating internally",
          "Contacter d'abord l'éditeur de l'historian et lui demander d'analyser le comportement à distance avant toute escalade interne",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 13 — Rogue wireless AP on the plant floor
// ============================================================================
const ROGUE_WIFI: Incident = {
  id: "rogue_wifi_ap",
  tier: "medium",
  category: "network",
  title: L(
    "Unbekannter WLAN-AP in der Halle",
    "Unknown wireless AP in the plant",
    "Point d'accès Wi-Fi inconnu en atelier",
  ),
  brief: L(
    "WIDS meldet eine fremde SSID „PLC-Service“ aus der Verpackungshalle, mit Signal stark genug, um zwei HMIs zu erreichen.",
    "WIDS reports a foreign SSID „PLC-Service" from the packaging hall, signal strong enough to reach two HMIs.",
    "Le WIDS signale une SSID inconnue « PLC-Service » dans le hall de conditionnement, signal assez fort pour atteindre deux IHM.",
  ),
  initialDelayMs: 11_000,
  steps: [
    {
      id: "locate", requiredRoom: "siem", timeLimitMs: 22_000,
      title: L("Lokalisieren", "Locate", "Localiser"),
      prompt: L("Wie aufspüren?", "How do you locate it?", "Comment le localiser ?"),
      options: [
        { id: "triangulate_with_facility", correct: true, delta: +7, label: L(
          "Mit Facility und Werkschutz koordiniert die WIDS-Trianguation laufen lassen und vor Ort prüfen, idealerweise mit dem zuständigen Schichtführer",
          "Run WIDS triangulation in coordination with facility and site security and verify on site, ideally with the responsible shift lead present",
          "Lancer la triangulation WIDS en coordination avec facility et la sécurité du site et vérifier sur place, idéalement avec le chef de quart",
        ) },
        { id: "deauth_blind", correct: false, delta: -5, label: L(
          "Sofort eine Deauth-Welle gegen den AP fahren, damit potenzielle Clients nicht weiter verbinden können, bevor die Quelle bekannt ist",
          "Fire an immediate deauth wave at the AP so potential clients can't keep connecting before the source is known",
          "Déclencher tout de suite une vague de déauth contre l'AP pour empêcher les clients de se reconnecter avant identification",
        ) },
        { id: "ignore_wlan", correct: false, delta: -6, label: L(
          "Ignorieren, weil das produktive OT-Netz kabelgebunden ist und ein WLAN-AP „technisch nicht stören kann“",
          "Ignore it, because the production OT network is wired and a wireless AP „can't technically interfere"",
          "Ignorer, parce que le réseau OT productif est filaire et qu'un AP Wi-Fi « ne peut techniquement pas gêner »",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 22_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "physical_then_wids", correct: true, delta: +8, label: L(
          "Werkschutz lokalisiert und sichert das Gerät physisch, WIDS-Containment bleibt auf den verdächtigen MAC-Bereich begrenzt, Beweiskette gewahrt",
          "Site security physically locates and secures the device, WIDS containment stays scoped to the suspect MAC range, chain of custody preserved",
          "La sécurité site localise et sécurise physiquement l'appareil, le confinement WIDS reste limité à la plage MAC suspecte, chaîne de garde préservée",
        ) },
        { id: "block_all_wireless", correct: false, delta: -5, label: L(
          "Pauschal jeden 2.4-GHz-Funk im Werk blocken, bis das Thema geklärt ist — auch das Wartungstablet der Facility",
          "Blanket-block every 2.4 GHz signal in the plant until this is sorted — including the facility maintenance tablet",
          "Bloquer en bloc toute émission 2,4 GHz dans l'usine jusqu'à clarification — y compris la tablette maintenance facility",
        ) },
        { id: "destroy_on_sight", correct: false, delta: -7, label: L(
          "Selbst in die Halle gehen, das Gerät abziehen und entsorgen — schneller als auf Werkschutz und Beweissicherung zu warten",
          "Walk into the hall yourself, unplug the device and dispose of it — faster than waiting for site security and evidence handling",
          "Aller soi-même dans le hall, débrancher l'appareil et le jeter — plus rapide qu'attendre la sécurité site et la mise sous scellés",
        ) },
      ],
    },
  ],
};

// ============================================================================
// 14 — Spoofed safety alarm flood from a fieldbus
// ============================================================================
const ALARM_FLOOD: Incident = {
  id: "alarm_flood_spoof",
  tier: "hard",
  category: "endpoint",
  title: L(
    "Alarm-Flut auf dem HMI",
    "Alarm flood on the HMI",
    "Inondation d'alarmes sur l'IHM",
  ),
  brief: L(
    "Innerhalb von 90 Sekunden feuern die HMIs der Linie 3 über 400 Alarme — viele identisch, einige fingieren Safety-Trips ohne Sensor-Korrelation.",
    "Within 90 seconds, line 3 HMIs fire 400+ alarms — many identical, some fake safety trips with no sensor correlation.",
    "En 90 secondes, les IHM de la ligne 3 émettent plus de 400 alarmes — beaucoup identiques, certaines fausses signalisations safety sans corrélation capteur.",
  ),
  initialDelayMs: 8_000,
  steps: [
    {
      id: "verify", requiredRoom: "war_room", timeLimitMs: 18_000,
      title: L("Verifizieren", "Verify", "Vérifier"),
      prompt: L(
        "Echte Trips oder Spoofing — wie zuerst klären?",
        "Real trips or spoofing — how do you decide first?",
        "Vraies coupures ou spoofing — comment trancher d'abord ?",
      ),
      options: [
        { id: "cross_check_field", correct: true, delta: +7, label: L(
          "Schichtleitung und Bediener nach Sicht-Status fragen, Sensorwerte aus dem Historian gegen die HMI-Alarme cross-checken, Safety-Officer informieren",
          "Ask shift lead and operators for visual status, cross-check sensor values from the historian against HMI alarms, inform the safety officer",
          "Demander le statut visuel au chef de quart et aux opérateurs, croiser les valeurs capteurs de l'historian avec les alarmes IHM, informer le responsable safety",
        ) },
        { id: "ack_all", correct: false, delta: -7, label: L(
          "Alle Alarme zentral acknowledgen, damit die Operatoren wieder klare Sicht haben und der Lärmpegel auf der Linie sinkt",
          "Acknowledge all alarms centrally so the operators get a clear view again and the noise level on the line drops",
          "Acquitter toutes les alarmes en central pour que les opérateurs retrouvent une vue claire et que le bruit baisse sur la ligne",
        ) },
        { id: "blame_hmi", correct: false, delta: -5, label: L(
          "Sofort von einem HMI-Software-Bug ausgehen, den Hersteller anrufen und auf einen Patch warten, bevor man weiter eskaliert",
          "Assume an HMI software bug straight away, call the vendor, and wait for a patch before escalating further",
          "Conclure tout de suite à un bug logiciel IHM, appeler l'éditeur et attendre un patch avant d'escalader davantage",
        ) },
      ],
    },
    {
      id: "contain", requiredRoom: "noc", timeLimitMs: 20_000,
      title: L("Eindämmung", "Contain", "Confinement"),
      prompt: L("Wie eindämmen?", "How do you contain?", "Comment confiner ?"),
      options: [
        { id: "filter_at_gateway", correct: true, delta: +7, label: L(
          "Am OT-Gateway temporär einen Rate-Limiter und Duplikat-Filter für die betroffene Alarmklasse setzen, gemeinsam mit Engineering, ohne echte Safety-Alarme zu unterdrücken",
          "Apply a temporary rate limiter and duplicate filter at the OT gateway for the affected alarm class, jointly with engineering, without suppressing real safety alarms",
          "Appliquer temporairement un rate-limiter et un filtre de doublons sur la passerelle OT pour la classe d'alarme concernée, conjointement avec l'ingénierie, sans étouffer les vraies alarmes safety",
        ) },
        { id: "kill_alarm_service", correct: false, delta: -8, label: L(
          "Den Alarm-Service auf den HMIs schlicht abschalten, damit der Bediener wieder ungestört arbeiten kann",
          "Simply shut off the alarm service on the HMIs so the operator can work undisturbed again",
          "Tout simplement arrêter le service d'alarmes sur les IHM pour que l'opérateur puisse retravailler sans gêne",
        ) },
        { id: "reboot_hmis", correct: false, delta: -5, label: L(
          "Alle HMIs der Linie 3 nacheinander durchstarten, in der Hoffnung, dass der Spuk nach dem Reboot vorbei ist",
          "Reboot all line 3 HMIs one by one, hoping the noise is gone after restart",
          "Redémarrer toutes les IHM de la ligne 3 une par une, en espérant que le bruit disparaisse après reboot",
        ) },
      ],
    },
    {
      id: "report", requiredRoom: "ciso_office", timeLimitMs: 20_000,
      title: L("Meldung", "Report", "Signalement"),
      prompt: L("Was dokumentieren?", "What do you document?", "Que documenter ?"),
      options: [
        { id: "timeline_evidence", correct: true, delta: +6, label: L(
          "Zeitleiste, betroffene Tags, Filterregel und Beteiligte sauber dokumentieren, Safety-Officer mitzeichnen lassen, Ticket mit Anhang an Engineering und CISO",
          "Document timeline, affected tags, the filter rule and the people involved cleanly, have the safety officer co-sign, ticket with attachment to engineering and CISO",
          "Documenter proprement la chronologie, les tags touchés, la règle de filtrage et les intervenants, faire co-signer le responsable safety, ticket avec pièce jointe à l'ingénierie et au CISO",
        ) },
        { id: "verbal_only", correct: false, delta: -5, label: L(
          "Nur mündlich an die Schichtleitung übergeben, weil die Anlage „läuft ja wieder“ und niemand zusätzliche Bürokratie braucht",
          "Hand over verbally to the shift lead only, because the plant „is running again" and nobody needs extra paperwork",
          "Transmettre uniquement à l'oral au chef de quart, parce que l'usine « tourne à nouveau » et que personne n'a besoin de paperasse en plus",
        ) },
        { id: "blame_operator", correct: false, delta: -7, label: L(
          "Im Bericht festhalten, dass die Bediener falsch quittiert hätten, damit das Thema sauber abgelegt werden kann",
          "Write in the report that the operators acknowledged incorrectly, so the topic can be cleanly archived",
          "Indiquer dans le rapport que les opérateurs ont mal acquitté, afin que le sujet puisse être proprement classé",
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
  SURPRISE_AUDITOR,
  HISTORIAN_DNS_EXFIL,
  ROGUE_WIFI,
  ALARM_FLOOD,
];

/** Comic-relief incidents trigger the cheesy "audit" music mode. */
export const COMIC_INCIDENT_IDS = new Set<string>([
  "ups_tampering",
  "surprise_auditor",
]);
