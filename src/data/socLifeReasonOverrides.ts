/**
 * Per-option, per-language rationales for the SOC-Life consequence overlay.
 *
 * Style: KEEP IT TIGHT. One short sentence, max ~14 words. The verdict tier
 * (excellent/solid/risky/severe) already conveys the emotional weight — the
 * reason just has to surface the *mechanism* (chain of custody, IOCs, lateral
 * movement, GDPR Art. 6, …) so the player learns the lesson in one glance.
 *
 * Long, multi-clause sentences caused the consequence overlay to grow tall
 * and made mobile pop-ups jump on resize — these are deliberately compact.
 *
 * Key shape: `${incidentId}::${stepId}::${optionId}` — exact match required.
 * If a key is missing, socLifeReasons.ts falls back to the generic bank.
 */

import type { Lang } from "@/data/socLifeData";

type Reason = Record<Lang, string>;
const R = (de: string, en: string, fr: string): Reason => ({ de, en, fr });

export const REASON_OVERRIDES: Record<string, Reason> = {
  // ============================== PHISHING ==============================
  "phishing::detect::verify": R(
    "Erst Header und Sandbox — IOCs vor jeder Aktion.",
    "Headers and sandbox first — IOCs before any action.",
    "En-têtes et sandbox d'abord — IOCs avant toute action.",
  ),
  "phishing::detect::block_now": R(
    "Blocken ohne IOCs verbrennt Beweise.",
    "Blocking without IOCs burns evidence.",
    "Bloquer sans IOCs détruit les preuves.",
  ),
  "phishing::detect::user_train": R(
    "Massen-Awareness warnt den Angreifer und flutet die Hotline.",
    "Mass awareness tips off the attacker and floods the hotline.",
    "La sensibilisation de masse alerte l'attaquant et sature la hotline.",
  ),
  "phishing::contain::block_sender": R(
    "Sender und URL am Gateway blocken stoppt die Welle in einem Schritt.",
    "Block sender and URL at the gateway — wave stops in one step.",
    "Bloquer expéditeur et URL au gateway — vague stoppée d'un coup.",
  ),
  "phishing::contain::delete_only": R(
    "Nur löschen lässt die Quelle aktiv — neue Welle folgt.",
    "Just deleting leaves the source live — next wave follows.",
    "Supprimer seul laisse la source active — nouvelle vague.",
  ),
  "phishing::contain::quarantine": R(
    "Postfächer komplett zu sperren ist Geschäftsausfall ohne Schutzwirkung.",
    "Quarantining whole mailboxes is outage without protection.",
    "Mettre en quarantaine les boîtes entières : panne sans protection.",
  ),
  "phishing::report::brief_ciso": R(
    "Kurzes Briefing mit Scope, Impact, nächsten Schritten ermöglicht Entscheidungen.",
    "Crisp brief with scope, impact, next steps enables decisions.",
    "Briefing concis avec portée, impact, étapes — permet de décider.",
  ),
  "phishing::report::wait_full": R(
    "Auf den Vollbericht warten verzögert nötige Entscheidungen.",
    "Waiting for the full report delays needed decisions.",
    "Attendre le rapport complet retarde les décisions.",
  ),
  "phishing::report::email_only": R(
    "Nur E-Mail unterläuft die Eskalationspflicht.",
    "Email-only bypasses the escalation duty.",
    "Le simple email contourne l'obligation d'escalade.",
  ),

  // ============================ RANSOMWARE ==============================
  "ransomware::verify::confirm_edr": R(
    "EDR und Hash bestätigen den Vorfall vor irreversiblen Schritten.",
    "EDR and hash confirm before any irreversible step.",
    "EDR et hash confirment avant toute action irréversible.",
  ),
  "ransomware::verify::shutdown_srv": R(
    "Hartes Abschalten zerstört Schlüssel im RAM — Decryption futsch.",
    "Hard shutdown destroys keys in RAM — decryption gone.",
    "Arrêt brutal détruit les clés en RAM — déchiffrement perdu.",
  ),
  "ransomware::verify::kill_share": R(
    "Share kappen ohne Forensik vernichtet Spuren des Initial-Vektors.",
    "Pulling the share without forensics erases the initial vector.",
    "Couper le partage sans forensique efface le vecteur initial.",
  ),
  "ransomware::isolate::segment_vlan": R(
    "Segmentierung plus EDR-Isolation stoppt Lateral Movement, behält Forensik.",
    "Segmentation plus EDR isolation stops lateral movement, keeps forensics.",
    "Segmentation plus isolation EDR stoppe le mouvement, garde la forensique.",
  ),
  "ransomware::isolate::block_ad": R(
    "AD-Sperre genügt nicht — der Prozess läuft mit lokalem Token weiter.",
    "AD lock isn't enough — process keeps running with its local token.",
    "Le verrou AD ne suffit pas — le processus continue avec son jeton local.",
  ),
  "ransomware::isolate::block_internet": R(
    "Internet kappen stoppt nur C2 — die Verschlüsselung läuft weiter.",
    "Cutting internet only stops C2 — encryption keeps going.",
    "Couper Internet stoppe le C2 — le chiffrement continue.",
  ),
  "ransomware::recover::restore_backup": R(
    "Offline-Backup verifizieren und restoren — einziger Weg gegen Re-Infection.",
    "Verify offline backup and restore — only path that excludes re-infection.",
    "Vérifier le backup hors-ligne et restaurer — seul moyen contre la ré-infection.",
  ),
  "ransomware::recover::restore_latest": R(
    "Online-Backup könnte selbst verschlüsselt sein — du installierst den Schaden erneut.",
    "Online backup may already be encrypted — you reinstall the damage.",
    "Le backup en ligne peut être chiffré — tu réinstalles les dégâts.",
  ),
  "ransomware::recover::shadow_copies": R(
    "Shadow Copies löscht Ransomware oft als Erstes.",
    "Shadow copies are often the first thing ransomware deletes.",
    "Les shadow copies sont la première cible des ransomwares.",
  ),

  // =============================== DDOS =================================
  "ddos::verify::verify_traffic": R(
    "Flow- und Geo-Daten trennen volumetrisch von L7 — bestimmt die Mitigation.",
    "Flow and geo data separate volumetric from L7 — drives the mitigation.",
    "Flow et géo distinguent volumétrique vs L7 — guident la mitigation.",
  ),
  "ddos::verify::scale_up": R(
    "Hochskalieren ohne Analyse erhöht Angriffsfläche und Cloud-Rechnung.",
    "Scaling up without analysis inflates attack surface and bill.",
    "Scaler sans analyse augmente la surface et la facture.",
  ),
  "ddos::verify::rate_limit_all": R(
    "Globales Rate-Limit straft echte Kunden — und löst keinen L3/4-Flood.",
    "Global rate-limit punishes real customers — won't stop L3/4 floods.",
    "Rate-limit global pénalise les clients — n'arrête pas un flood L3/4.",
  ),
  "ddos::mitigate::scrubbing": R(
    "Scrubbing-Provider plus gezielte WAF-Regeln ist Industriestandard.",
    "Scrubbing provider plus targeted WAF rules is the standard.",
    "Provider de scrubbing plus WAF ciblé est le standard.",
  ),
  "ddos::mitigate::geoblock": R(
    "Pauschales Geoblock sperrt echte Kunden, Botnetze rotieren weiter.",
    "Blanket geo-block locks out real customers, botnets just rotate.",
    "Géo-blocage massif bloque les clients, les botnets rotent.",
  ),
  "ddos::mitigate::captcha_all": R(
    "CAPTCHA für alle killt Conversion und stoppt L3/4 nicht.",
    "CAPTCHA for everyone kills conversion and won't stop L3/4.",
    "CAPTCHA pour tous tue la conversion et n'arrête pas L3/4.",
  ),
  "ddos::comms::status_page": R(
    "Status-Page plus interne Updates erhalten Vertrauen.",
    "Status page plus internal updates preserve trust.",
    "Status page plus updates internes préservent la confiance.",
  ),
  "ddos::comms::wait_resolved": R(
    "Schweigen während des Ausfalls befeuert Spekulation und Reputationsschaden.",
    "Silence during outage fuels speculation and reputation damage.",
    "Le silence pendant la panne nourrit spéculation et dégâts de réputation.",
  ),
  "ddos::comms::internal_only": R(
    "Nur intern wirkt wie Vertuschung, sobald Kunden den Ausfall sehen.",
    "Internal-only looks like cover-up once customers see the outage.",
    "Seulement interne paraît dissimulation dès que les clients voient.",
  ),

  // ============================== INSIDER ===============================
  "insider::triage::review_dlp": R(
    "DLP plus UEBA trennt echtes Fehlverhalten von harmloser Anomalie.",
    "DLP plus UEBA separates real misconduct from harmless anomaly.",
    "DLP plus UEBA distingue vraie faute et anomalie bénigne.",
  ),
  "insider::triage::lock_acct": R(
    "Sperre ohne Kontext ist arbeitsrechtlich angreifbar und tippt den Insider ab.",
    "Locking without context is legally challengeable and tips off the insider.",
    "Verrouiller sans contexte est attaquable et alerte l'initié.",
  ),
  "insider::triage::ask_mgr": R(
    "Den Vorgesetzten zu fragen bricht die Vertraulichkeit der Untersuchung.",
    "Asking the line manager breaks investigation confidentiality.",
    "Demander au manager rompt la confidentialité.",
  ),
  "insider::preserve::image_endpoint": R(
    "Forensisches Image plus Chain-of-Custody hält vor Gericht.",
    "Forensic image plus chain of custody holds up in court.",
    "Image forensique plus chaîne de garde tient en justice.",
  ),
  "insider::preserve::remote_collect": R(
    "Reine Remote-Triage übersieht Memory und reicht vor Gericht selten.",
    "Remote-only triage misses memory, rarely holds in court.",
    "Triage à distance manque la mémoire, tient rarement en justice.",
  ),
  "insider::preserve::snapshot_vm": R(
    "VM-Snapshot ohne Memory-Dump verliert Prozesse, Schlüssel, Verbindungen.",
    "VM snapshot without memory dump loses processes, keys, connections.",
    "Snapshot VM sans dump mémoire perd processus, clés, connexions.",
  ),
  "insider::hr_legal::loop_hr_legal": R(
    "HR, Legal und DPO einbinden ist Pflicht — sonst ist jede Sanktion angreifbar.",
    "Looping HR, Legal and DPO is mandatory — else every sanction is challengeable.",
    "Impliquer RH, juridique, DPO est obligatoire — sinon toute sanction est attaquable.",
  ),
  "insider::hr_legal::ciso_only": R(
    "Nur CISO informieren übergeht Arbeits- und Datenschutzrecht.",
    "Informing only the CISO bypasses labour and data-protection law.",
    "Informer seul le CISO contourne droit du travail et protection des données.",
  ),
  "insider::hr_legal::shadow": R(
    "Stilles Beobachten ohne Eskalation lässt den Schaden weiterlaufen.",
    "Silent monitoring without escalation lets the damage continue.",
    "Observer en silence laisse le dommage continuer.",
  ),

  // ================================ BEC =================================
  "bec::verify::auth_logs": R(
    "Mail-Auth und Login-Geo zeigen Spoofing oder Account-Takeover binnen Minuten.",
    "Mail auth and login geo reveal spoofing or takeover in minutes.",
    "L'auth mail et la géo révèlent spoofing ou takeover en minutes.",
  ),
  "bec::verify::call_ceo": R(
    "Die Nummer in der Mail-Signatur ist die des Angreifers.",
    "The number in the mail signature belongs to the attacker.",
    "Le numéro dans la signature appartient à l'attaquant.",
  ),
  "bec::verify::ask_finance": R(
    "Buchhaltung nach Plausibilität fragen ist genau der Social-Engineering-Hebel.",
    "Asking finance about plausibility is the exact social-engineering lever.",
    "Demander la plausibilité à la finance est le levier social-engineering.",
  ),
  "bec::stop_payment::freeze_call": R(
    "Buchhaltung und Bank parallel — einzige Chance vor SWIFT-Cutoff.",
    "Finance and bank in parallel — only chance before SWIFT cutoff.",
    "Finance et banque en parallèle — seule chance avant cutoff SWIFT.",
  ),
  "bec::stop_payment::email_only": R(
    "Stop-Mail wird Stunden später gelesen — Geld längst weg.",
    "Stop email is read hours later — money is long gone.",
    "Mail d'arrêt lu des heures plus tard — argent parti.",
  ),
  "bec::stop_payment::wait_legal": R(
    "Auf Legal warten heißt bei BEC: 100 % Verlust.",
    "Waiting for legal in a BEC case means 100 % loss.",
    "Attendre le juridique en BEC garantit 100 % de perte.",
  ),
  "bec::harden::policy_4eyes": R(
    "Vier-Augen plus Rückruf über verifizierten Kanal ist die strukturelle Abwehr.",
    "Four-eyes plus callback over a verified channel is the structural defence.",
    "Quatre yeux plus rappel sur canal vérifié est la défense structurelle.",
  ),
  "bec::harden::block_ext": R(
    "Alle externen Mails zu blocken bricht das Geschäft komplett.",
    "Blocking all external email breaks the business entirely.",
    "Bloquer tous les mails externes casse l'activité.",
  ),
  "bec::harden::rotate_ceo": R(
    "Nur das CEO-Passwort adressiert weder Spoofing noch fehlendes Vier-Augen-Prinzip.",
    "Just rotating the CEO password addresses neither spoofing nor missing four-eyes.",
    "Tourner seul le mot de passe CEO ne traite ni spoofing ni quatre yeux.",
  ),

  // =========================== LATERAL MOVEMENT =========================
  "lateral_movement::scope::graph": R(
    "Auth-Graph plus Logon-Korrelation zeigt das volle Lateral-Pattern.",
    "Auth graph plus logon correlation shows the full lateral pattern.",
    "Graphe d'auth plus corrélation logon montre le pattern complet.",
  ),
  "lateral_movement::scope::endpoint_only": R(
    "Nur den Ursprungs-Endpoint zu prüfen übersieht alle weiteren Hops.",
    "Checking only the origin endpoint misses every other hop.",
    "Vérifier seul l'endpoint d'origine rate tous les autres sauts.",
  ),
  "lateral_movement::scope::ask_user": R(
    "Den User zu fragen ist nutzlos — er weiß es nicht oder lügt.",
    "Asking the user is useless — they don't know or they lie.",
    "Demander à l'utilisateur est inutile — il ignore ou ment.",
  ),
  "lateral_movement::contain::isolate_set": R(
    "Alle betroffenen Hosts isolieren plus Service-Konten sperren — Bewegung tot.",
    "Isolate all affected hosts plus disable service accounts — movement dead.",
    "Isoler tous les hôtes plus désactiver comptes service — mouvement mort.",
  ),
  "lateral_movement::contain::isolate_one": R(
    "Nur den ersten Host zu isolieren ignoriert die Persistenz auf den anderen Hops.",
    "Isolating only the first host ignores persistence on other hops.",
    "Isoler seul le premier hôte ignore la persistance ailleurs.",
  ),
  "lateral_movement::contain::block_smb": R(
    "Pauschales SMB-Block legt File-Server lahm — der Angreifer wechselt auf WinRM.",
    "Blanket SMB block kills file servers — the attacker pivots to WinRM.",
    "Bloquer SMB partout casse les serveurs — l'attaquant passe à WinRM.",
  ),
  "lateral_movement::creds::rotate_tier": R(
    "Tier-0 plus krbtgt zweimal rotieren entwertet jedes Golden Ticket.",
    "Rotating tier-0 plus krbtgt twice invalidates every Golden Ticket.",
    "Tourner tier-0 plus krbtgt deux fois invalide tout Golden Ticket.",
  ),
  "lateral_movement::creds::rotate_all": R(
    "Alle Passwörter zurücksetzen sprengt den Helpdesk und löst keine Tickets.",
    "Resetting every password overwhelms the helpdesk, won't kill tickets.",
    "Réinitialiser tout sature le helpdesk, ne tue pas les tickets.",
  ),
  "lateral_movement::creds::rotate_one": R(
    "Nur das User-Passwort ignoriert Service- und Computer-Konten.",
    "Just the user's password ignores service and computer accounts.",
    "Seul le mot de passe utilisateur ignore comptes service et machine.",
  ),

  // ============================= C2 BEACON ==============================
  "c2_beacon::analyse::ti_lookup": R(
    "TI-Lookup plus Beacon-Analyse identifiziert Tooling und alle infizierten Hosts.",
    "TI lookup plus beacon analysis identifies tooling and every infected host.",
    "Lookup TI plus analyse beacon identifie l'outil et tous les hôtes infectés.",
  ),
  "c2_beacon::analyse::block_dns": R(
    "Sinkhole ohne Analyse warnt den Angreifer.",
    "Sinkhole without analysis tips off the attacker.",
    "Sinkhole sans analyse alerte l'attaquant.",
  ),
  "c2_beacon::analyse::wait": R(
    "24 h beobachten gibt 24 h für Datendiebstahl.",
    "Observing 24 h gives 24 h for data theft.",
    "Observer 24 h donne 24 h pour exfiltrer.",
  ),
  "c2_beacon::block::fw_proxy": R(
    "Firewall, Proxy und DNS gleichzeitig schließen alle Egress-Pfade.",
    "Firewall, proxy and DNS at once close every egress path.",
    "Firewall, proxy et DNS en même temps ferment tous les egress.",
  ),
  "c2_beacon::block::edr_only": R(
    "Hash-Block ist trivial umgangen — Binary in 5 Minuten neu gebaut.",
    "Hash block is trivially bypassed — binary rebuilt in 5 minutes.",
    "Bloquer le hash est trivialement contourné — binaire reconstruit en 5 min.",
  ),
  "c2_beacon::block::block_outb": R(
    "Allen Outbound zu blocken legt den Host lahm — kein Patch, keine Telemetrie.",
    "Blocking all outbound cripples the host — no patch, no telemetry.",
    "Bloquer tout le sortant paralyse l'hôte — ni patch ni télémétrie.",
  ),
  "c2_beacon::remediate::image_reimage": R(
    "Image, Persistenz suchen, sauber neu — einziger Weg gegen versteckte Backdoors.",
    "Image, hunt persistence, reimage — only path against hidden backdoors.",
    "Imager, chasser, réinstaller — seul moyen contre les backdoors cachées.",
  ),
  "c2_beacon::remediate::av_scan": R(
    "AV-Scan findet nur Signaturen — Loader und Reflective DLLs überleben.",
    "AV scan finds signatures only — loaders and reflective DLLs survive.",
    "Le scan AV ne voit que les signatures — loaders et DLL réflective survivent.",
  ),
  "c2_beacon::remediate::kill_proc": R(
    "Nur Prozess killen lässt Run-Keys, Tasks und WMI unberührt.",
    "Killing only the process leaves Run keys, tasks and WMI untouched.",
    "Tuer seul le processus laisse Run keys, tâches et WMI intacts.",
  ),

  // ============================= CRED DUMP ==============================
  "cred_dump::validate::process_tree": R(
    "Prozess-Tree plus Tool-Signatur belegt LSASS-Zugriff in Sekunden.",
    "Process tree plus tool signature proves LSASS access in seconds.",
    "L'arbre processus plus signature outil prouve l'accès LSASS en secondes.",
  ),
  "cred_dump::validate::ask_admin": R(
    "Den Admin zu fragen verbrennt Zeit und tippt Insider ab.",
    "Asking the admin wastes time and tips off insiders.",
    "Demander à l'admin perd du temps et alerte les initiés.",
  ),
  "cred_dump::validate::trust_av": R(
    "AV-Schweigen ist bei Credential-Dumpern Standard — kein FP.",
    "AV silence is standard with credential dumpers — not an FP.",
    "Le silence AV est la norme avec les dumpers — pas un FP.",
  ),
  "cred_dump::isolate::edr_isolate": R(
    "EDR-Isolation plus Session-Kill stoppt Dump und Pivot, RAM bleibt.",
    "EDR isolation plus session kill stops dump and pivot, RAM stays.",
    "Isolation EDR plus kill de session stoppe dump et pivot, RAM préservée.",
  ),
  "cred_dump::isolate::shutdown": R(
    "Hartes Ausschalten zerstört RAM und damit jeden Beweis.",
    "Hard power-off destroys RAM and every proof with it.",
    "Arrêt brutal détruit la RAM et toute preuve.",
  ),
  "cred_dump::isolate::user_logoff": R(
    "User abmelden ist wirkungslos — Dumper läuft als SYSTEM.",
    "Logging the user off is futile — dumper runs as SYSTEM.",
    "Déconnecter l'utilisateur est inutile — le dumper tourne en SYSTEM.",
  ),
  "cred_dump::rotate::all_admin": R(
    "Alle privilegierten und Service-Konten rotieren — gestohlene Hashes wertlos.",
    "Rotate all privileged and service accounts — stolen hashes worthless.",
    "Tourner tous les comptes priv. et service — hashes volés sans valeur.",
  ),
  "cred_dump::rotate::owner_only": R(
    "Nur das Admin-Konto ignoriert alle anderen Hashes im LSASS.",
    "Just the admin account ignores every other hash in LSASS.",
    "Seul le compte admin ignore tous les autres hashes LSASS.",
  ),
  "cred_dump::rotate::schedule": R(
    "Rotation in das nächste Wartungsfenster schenkt Wochen mit gültigen Credentials.",
    "Pushing rotation to next maintenance gifts weeks of valid credentials.",
    "Reporter à la maintenance offre des semaines d'identifiants valides.",
  ),

  // ============================ SUPPLY CHAIN ============================
  "supply_chain::exposure::cmdb_query": R(
    "CMDB plus EDR liefert exakte Exposition in Minuten.",
    "CMDB plus EDR yields exact exposure in minutes.",
    "CMDB plus EDR donne l'exposition exacte en minutes.",
  ),
  "supply_chain::exposure::ask_owners": R(
    "Owner einzeln mailen dauert Tage und liefert subjektive Antworten.",
    "Emailing owners one by one takes days, yields subjective answers.",
    "Mailer les owners un par un prend des jours et donne du subjectif.",
  ),
  "supply_chain::exposure::wait_advisory": R(
    "Auf das Advisory zu warten gibt dem Angreifer einen uneinholbaren Vorsprung.",
    "Waiting for the advisory hands the attacker an unrecoverable head start.",
    "Attendre l'advisory donne à l'attaquant une avance irrattrapable.",
  ),
  "supply_chain::block::isolate_block": R(
    "Hosts isolieren, Update-Server und IOCs blocken — akute Compromise weg.",
    "Isolate hosts, block update server and IOCs — active compromise gone.",
    "Isoler les hôtes, bloquer serveur d'update et IOCs — compromission stoppée.",
  ),
  "supply_chain::block::uninstall_all": R(
    "Überall deinstallieren erzeugt Ausfälle, die schlimmer sind als der Angriff.",
    "Uninstalling everywhere causes outages worse than the attack.",
    "Désinstaller partout crée des pannes pires que l'attaque.",
  ),
  "supply_chain::block::patch_now": R(
    "Nächsten Patch ungetestet rollen — er könnte selbst kompromittiert sein.",
    "Pushing next patch untested — it might itself be compromised.",
    "Pousser le patch suivant non testé — il peut être compromis.",
  ),
  "supply_chain::report::ciso_legal": R(
    "CISO, Legal, DPO plus NIS-2/DORA-Check ist Pflicht — Fristen laufen.",
    "CISO, Legal, DPO plus NIS-2/DORA check is mandatory — clocks run.",
    "CISO, juridique, DPO plus check NIS-2/DORA est obligatoire — délais courent.",
  ),
  "supply_chain::report::ciso_only": R(
    "Nur CISO übersieht regulatorische Fristen.",
    "CISO only misses regulatory deadlines.",
    "CISO seul rate les délais réglementaires.",
  ),
  "supply_chain::report::wait_impact": R(
    "Auf konkreten Impact warten verletzt NIS-2/DORA — Verdacht reicht.",
    "Waiting for concrete impact breaches NIS-2/DORA — suspicion suffices.",
    "Attendre un impact concret viole NIS-2/DORA — le soupçon suffit.",
  ),

  // ============================== EXFIL =================================
  "data_exfil::scope::proxy_dlp": R(
    "Proxy plus DLP klassifiziert Datentyp und Volumen — bestimmt DSGVO Art. 33.",
    "Proxy plus DLP classifies data type and volume — drives GDPR Art. 33.",
    "Proxy plus DLP classe type et volume — décide RGPD Art. 33.",
  ),
  "data_exfil::scope::block_first": R(
    "Erst blocken warnt den Angreifer und macht Mengenmessung unmöglich.",
    "Blocking first tips off the attacker and prevents volume measurement.",
    "Bloquer d'abord alerte l'attaquant et empêche de mesurer le volume.",
  ),
  "data_exfil::scope::ask_user": R(
    "Den User direkt anzurufen verletzt die Untersuchungs-Vertraulichkeit.",
    "Calling the user breaches investigation confidentiality.",
    "Appeler l'utilisateur rompt la confidentialité de l'enquête.",
  ),
  "data_exfil::stop::isolate_revoke": R(
    "Endpoint isolieren plus Cloud-Tokens revoken stoppt aktive und gespeicherte Sessions.",
    "Isolate endpoint plus revoke cloud tokens stops live and cached sessions.",
    "Isoler endpoint plus révoquer tokens stoppe sessions actives et en cache.",
  ),
  "data_exfil::stop::block_cloud": R(
    "Cloud-Anbieter unternehmensweit blocken bricht legitime Workloads.",
    "Company-wide cloud block breaks legitimate workloads.",
    "Bloquer le cloud à l'échelle entreprise casse les workloads légitimes.",
  ),
  "data_exfil::stop::rate_limit": R(
    "Bandbreite drosseln verlangsamt nur — fertig wird der Angreifer trotzdem.",
    "Rate-limiting only slows — the attacker still finishes.",
    "Limiter la bande ne fait que ralentir — l'attaquant termine.",
  ),
  "data_exfil::notify::dpo_legal": R(
    "DPO, Legal und 72-h-Bewertung sind Pflicht — bis 4 % Jahresumsatz Bußgeld.",
    "DPO, Legal and 72-h assessment are mandatory — fines up to 4 % revenue.",
    "DPO, juridique et évaluation 72 h obligatoires — amendes jusqu'à 4 % du CA.",
  ),
  "data_exfil::notify::ciso_only": R(
    "Nur CISO verzögert die DSGVO-Frist und macht sanktionierbar.",
    "CISO only delays the GDPR clock and exposes to sanctions.",
    "CISO seul retarde le délai RGPD et expose aux sanctions.",
  ),
  "data_exfil::notify::wait_proof": R(
    "Auf harten Beweis warten verletzt Art. 33 — wahrscheinliches Risiko reicht.",
    "Waiting for hard proof breaches Art. 33 — likely risk is enough.",
    "Attendre une preuve dure viole l'Art. 33 — le risque probable suffit.",
  ),

  // ============================== PATCH =================================
  "zero_day::compromise::ioc_hunt": R(
    "IOCs jagen vor dem Patch klärt, ob bereits eingebrochen wurde.",
    "Hunting IOCs before the patch clarifies if you're already breached.",
    "Chasser les IOCs avant le patch clarifie si déjà compromis.",
  ),
  "zero_day::compromise::patch_now": R(
    "Patchen ohne Forensik überschreibt Beweise.",
    "Patching without forensics overwrites evidence.",
    "Patcher sans forensique écrase les preuves.",
  ),
  "zero_day::compromise::trust_vendor": R(
    "Auf Vendor-IOCs zu warten ist bei aktivem 0-Day zu spät.",
    "Waiting for vendor IOCs on an active 0-day is too late.",
    "Attendre des IOCs éditeur sur un 0-day actif est trop tard.",
  ),
  "zero_day::mitigate::workaround": R(
    "Vendor-Workaround plus Allowlist schließt den Vektor ohne Geschäftsausfall.",
    "Vendor workaround plus allowlist closes the vector without outage.",
    "Workaround éditeur plus allowlist ferme le vecteur sans panne.",
  ),
  "zero_day::mitigate::shut_vpn": R(
    "VPN komplett aus erzeugt einen Ausfall, der teurer ist als der Vorfall.",
    "Shutting VPN entirely causes an outage costlier than the incident.",
    "Couper le VPN entier crée une panne plus chère que l'incident.",
  ),
  "zero_day::mitigate::block_external": R(
    "Geo-Filter sind gegen Tor und VPN wirkungslos.",
    "Geo filters are useless against Tor and VPN.",
    "Les filtres géo sont inutiles face à Tor et VPN.",
  ),
  "zero_day::patch::patch_verify": R(
    "Patch im Fenster plus Re-Hunt stellt sicher, dass keine Backdoor übersehen wird.",
    "Patch in window plus re-hunt ensures no backdoor is missed.",
    "Patch en fenêtre plus re-hunt garantit qu'aucune backdoor n'est ratée.",
  ),
  "zero_day::patch::patch_blind": R(
    "Patch ohne Re-Hunt: jede vorherige Persistenz bleibt unsichtbar.",
    "Patch without re-hunt: every prior persistence stays invisible.",
    "Patcher sans re-hunt : toute persistance préalable reste invisible.",
  ),
  "zero_day::patch::wait_window": R(
    "4 Wochen warten bei aktiv ausgenutzter Lücke ist grobe Fahrlässigkeit.",
    "Waiting 4 weeks on an actively-exploited flaw is gross negligence.",
    "Attendre 4 semaines sur une faille exploitée est une négligence grave.",
  ),

  // ============================ AUDITOR VISIT ===========================
  "auditor_visit::greet::calm_pro": R(
    "Ruhig empfangen, Scope klären, Begleitung stellen — Lehrbuch.",
    "Welcome calmly, clarify scope, assign escort — textbook.",
    "Accueil calme, périmètre clair, accompagnant — manuel.",
  ),
  "auditor_visit::greet::hide_run": R(
    "Sich zu verstecken wirkt verdächtig und führt zur Major Non-Conformity.",
    "Hiding looks suspicious and leads to a major non-conformity.",
    "Se cacher paraît suspect et mène à une non-conformité majeure.",
  ),
  "auditor_visit::greet::blame_ciso": R(
    "Alles an den CISO eskalieren signalisiert fehlende operative Verantwortung.",
    "Escalating everything to the CISO signals absent operational ownership.",
    "Tout escalader au CISO signale un manque d'ownership opérationnel.",
  ),
  "auditor_visit::doc::show_doc": R(
    "Aktuelle, freigegebene Version aus dem ISMS — Goldstandard.",
    "Current, approved version from the ISMS — gold standard.",
    "Version actuelle approuvée depuis le SMSI — standard or.",
  ),
  "auditor_visit::doc::fake_pdf": R(
    "PDF antedatieren ist Urkundenfälschung — Zertifikat weg, strafbar.",
    "Back-dating a PDF is document fraud — certificate gone, criminal.",
    "Antidater un PDF est de la fraude — certificat perdu, pénal.",
  ),
  "auditor_visit::doc::promise_send": R(
    "'Schicken wir später' wird als Major Non-Conformity notiert.",
    "'We'll send it later' is logged as a major non-conformity.",
    "'On vous l'envoie plus tard' devient une non-conformité majeure.",
  ),
  "auditor_visit::finding::own_it": R(
    "Lücke anerkennen plus Risiko-Akzeptanz plus Zieldatum — das wertet Auditoren als Reife.",
    "Acknowledge gap plus risk acceptance plus target date — auditors score this as maturity.",
    "Reconnaître l'écart plus acceptation plus échéance — les auditeurs notent la maturité.",
  ),
  "auditor_visit::finding::blame_intern": R(
    "Schuld auf den Praktikanten zeigt fehlende Owner — aus einem Befund werden zwei.",
    "Blaming the intern shows absent ownership — one finding becomes two.",
    "Blâmer le stagiaire montre un manque d'ownership — un constat devient deux.",
  ),
  "auditor_visit::finding::ticket_close": R(
    "Ticket vor dem Auditor schließen ist Beweismanipulation — sofort Major.",
    "Closing the ticket in front of the auditor is evidence tampering — instant major.",
    "Fermer le ticket devant l'auditeur est manipulation — majeur immédiat.",
  ),

  // ============================== FIRE DRILL ============================
  "fire_drill::act::handover": R(
    "Übergabe an Backup-SOC dokumentieren und raus — Personensicherheit zuerst.",
    "Document handover to backup SOC and leave — life safety first.",
    "Documenter le passage au SOC de secours puis sortir — sécurité d'abord.",
  ),
  "fire_drill::act::stay": R(
    "Drinbleiben verstößt gegen Brandschutz — keine Info ist das wert.",
    "Staying violates fire safety — no information is worth it.",
    "Rester viole les règles incendie — aucune info ne le vaut.",
  ),
  "fire_drill::act::panic_run": R(
    "Sessions offen lassen erlaubt physischen Zugriff auf Admin-Tools.",
    "Leaving sessions open allows physical access to admin tools.",
    "Laisser les sessions ouvertes permet l'accès physique aux outils admin.",
  ),

  // ============================== DPO VISIT =============================
  "dpo_visit::lawful_basis::legit_interest": R(
    "Berechtigtes Interesse Art. 6(1)(f) plus Interessenabwägung ist DSGVO-konform.",
    "Legitimate interest Art. 6(1)(f) plus balancing test is GDPR-compliant.",
    "Intérêt légitime Art. 6(1)(f) plus mise en balance est RGPD-conforme.",
  ),
  "dpo_visit::lawful_basis::consent": R(
    "Einwilligung im Arbeitsvertrag ist nicht freiwillig — unwirksam (EDPB).",
    "Consent in an employment contract isn't free — invalid (EDPB).",
    "Le consentement dans un contrat de travail n'est pas libre — invalide (EDPB).",
  ),
  "dpo_visit::lawful_basis::vague": R(
    "'Für die Sicherheit' ist keine Rechtsgrundlage — DSGVO verlangt Bestimmtheit.",
    "'For security' isn't a legal basis — GDPR requires specificity.",
    "'Pour la sécurité' n'est pas une base légale — RGPD exige précision.",
  ),
  "dpo_visit::retention::policy_pointer": R(
    "Konkrete Retention zeigt Reife und erfüllt Art. 5(1)(e) DSGVO.",
    "Concrete retention shows maturity and meets GDPR Art. 5(1)(e).",
    "Une rétention concrète montre la maturité et respecte l'Art. 5(1)(e).",
  ),
  "dpo_visit::retention::forever": R(
    "'Für immer' verstößt direkt gegen Art. 5(1)(e) DSGVO.",
    "'Forever' directly violates GDPR Art. 5(1)(e).",
    "'Pour toujours' viole directement l'Art. 5(1)(e) RGPD.",
  ),
  "dpo_visit::retention::delete_now": R(
    "Logs vor einer Anfrage löschen ist Beweisvereitelung, oft strafbar.",
    "Deleting logs before an inquiry is evidence destruction, often criminal.",
    "Effacer les logs avant une demande est destruction de preuve, souvent pénale.",
  ),
  "dpo_visit::incident_log::show_register": R(
    "Lebendes Register mit 'meldepflichtig ja/nein' ist genau der NIS-2-Nachweis.",
    "Live register with 'reportable yes/no' is exactly the NIS-2 evidence.",
    "Registre vivant avec 'à signaler oui/non' est la preuve NIS-2.",
  ),
  "dpo_visit::incident_log::verbal_only": R(
    "Mündlich ist kein Nachweis — vor Aufsicht nicht haltbar.",
    "Verbal isn't evidence — won't hold against the regulator.",
    "L'oral n'est pas une preuve — intenable face au régulateur.",
  ),
  "dpo_visit::incident_log::filter_out": R(
    "Vorfälle vor der DPO herauszufiltern ist Verschleierung — eigene Verletzung.",
    "Filtering incidents from the DPO is concealment — its own breach.",
    "Filtrer les incidents pour la DPO est dissimulation — violation en soi.",
  ),

  // ========================== COMPLIANCE VISIT ==========================
  "compliance_visit::scope_meeting::agenda": R(
    "Kurze Agenda plus Themenliste führt das Audit — du gibst die Struktur vor.",
    "Short agenda plus topic list leads the audit — you set the structure.",
    "Agenda court plus thèmes guide l'audit — tu poses la structure.",
  ),
  "compliance_visit::scope_meeting::open_bar": R(
    "'Schaut alles an' produziert zufällige Stichproben — meist genau die Lücken.",
    "'Look at anything' produces random samples — usually right at the gaps.",
    "'Regardez tout' produit des échantillons aléatoires — souvent sur les lacunes.",
  ),
  "compliance_visit::scope_meeting::delay_weeks": R(
    "'In drei Wochen' wird als 'nicht audit-bereit' notiert.",
    "'In three weeks' gets logged as 'not audit-ready'.",
    "'Dans trois semaines' devient 'pas prêt pour l'audit'.",
  ),
  "compliance_visit::evidence::live_export": R(
    "Live-Export zeigt belastbare Findings, Maßnahmen und Zieldaten — Goldstandard.",
    "Live export shows solid findings, actions and target dates — gold standard.",
    "Export en direct montre findings, actions, échéances — standard or.",
  ),
  "compliance_visit::evidence::screenshot": R(
    "Screenshots aus alten Slides sind keine Nachweise.",
    "Screenshots from old slides aren't evidence.",
    "Captures d'anciennes slides ne sont pas des preuves.",
  ),
  "compliance_visit::evidence::rewrite": R(
    "Rückwirkend dokumentieren ist Fälschung — beim Cross-Check entdeckt.",
    "Retroactive documentation is fabrication — caught on cross-check.",
    "Documentation rétroactive est fabrication — détectée au recoupement.",
  ),
  "compliance_visit::gap::own_plan": R(
    "Anerkennen plus Maßnahme plus Owner plus Datum macht aus Lücke eine Observation.",
    "Acknowledge plus action plus owner plus date turns gap into observation.",
    "Reconnaître plus action plus responsable plus date — l'écart devient observation.",
  ),
  "compliance_visit::gap::wordsmith": R(
    "Pflichten 'kreativ' uminterpretieren fällt im Cross-Check auf — Eskalation zu Major.",
    "'Creative' reinterpretation gets caught on cross-check — escalates to major.",
    "Réinterprétation 'créative' se voit au recoupement — passe en majeur.",
  ),
  "compliance_visit::gap::blame_it": R(
    "Auf die IT zeigen offenbart fehlende ISMS-Verantwortung — Governance-Lücke notiert.",
    "Pointing at IT exposes absent ISMS ownership — governance gap logged.",
    "Pointer l'IT révèle un manque d'ownership SMSI — lacune de gouvernance notée.",
  ),

  // ============================ MFA BOMBING ============================
  "mfa_bombing::validate::auth_review": R(
    "Sign-in-Telemetrie zuerst — Quelle, Gerät, Geo machen den Fall klar.",
    "Sign-in telemetry first — source, device and geo make the case clear.",
    "Télémétrie de connexion d'abord — source, appareil, géo clarifient.",
  ),
  "mfa_bombing::validate::ask_user_only": R(
    "Nur den User fragen genügt nicht — ohne IdP-Logs fehlt der Beweis.",
    "Asking the user alone isn't enough — without IdP logs the proof is missing.",
    "Demander à l'utilisateur ne suffit pas — sans logs IdP la preuve manque.",
  ),
  "mfa_bombing::validate::trust_idp": R(
    "Bestätigtes MFA ≠ legitim — Push-Bombing umgeht genau diese Annahme.",
    "Confirmed MFA ≠ legitimate — push bombing exploits exactly that assumption.",
    "MFA confirmé ≠ légitime — le push bombing exploite cette hypothèse.",
  ),
  "mfa_bombing::contain::revoke_sessions": R(
    "Sessions beenden + Re-Auth nur von bekannten Geräten — Angreifer raus, User arbeitsfähig.",
    "End sessions and re-auth only from known devices — attacker out, user productive.",
    "Mettre fin aux sessions, ré-auth depuis appareils connus — attaquant out, user OK.",
  ),
  "mfa_bombing::contain::disable_user": R(
    "Account komplett sperren ist Overkill — Service-Desk-Stau ohne Sicherheitsplus.",
    "Fully disabling the account is overkill — service-desk backlog with no security gain.",
    "Désactiver entièrement le compte est excessif — engorgement sans bénéfice.",
  ),
  "mfa_bombing::contain::wait_more": R(
    "Auf Forensik warten lässt den Angreifer aktiv — Containment ist zeitkritisch.",
    "Waiting for forensics keeps the attacker active — containment is time-critical.",
    "Attendre la forensique laisse l'attaquant actif — confinement urgent.",
  ),
  "mfa_bombing::harden::number_match": R(
    "Number-Matching + Kontext schließt die Push-Müdigkeits-Lücke strukturell.",
    "Number matching plus context closes the push-fatigue gap structurally.",
    "Number matching et contexte ferment la faille de fatigue push structurellement.",
  ),
  "mfa_bombing::harden::more_training": R(
    "Awareness-Mail allein behebt keine technische Schwäche — Lücke bleibt.",
    "An awareness blast alone doesn't fix a technical weakness — gap persists.",
    "Un mail de sensibilisation ne corrige pas une faiblesse technique — faille reste.",
  ),
  "mfa_bombing::harden::remove_mfa": R(
    "Push auf SMS herunterstufen schwächt MFA — SIM-Swap wird die nächste Tür.",
    "Downgrading push to SMS weakens MFA — SIM swap becomes the next door.",
    "Rétrograder push vers SMS affaiblit le MFA — le SIM-swap suit.",
  ),

  // ============================ OT ANOMALY ============================
  "ot_anomaly::verify::passive_capture": R(
    "Passiver Mitschnitt mit Engineering — kein Eingriff in laufende Steuerbefehle.",
    "Passive capture with engineering — no interference with live control commands.",
    "Capture passive avec l'ingénierie — aucun impact sur les commandes en cours.",
  ),
  "ot_anomaly::verify::active_scan": R(
    "Aktiver Scan in OT kann SPS umkippen — produktionskritisches Risiko.",
    "Active scanning in OT can crash a PLC — production-critical risk.",
    "Un scan actif en OT peut planter un PLC — risque critique production.",
  ),
  "ot_anomaly::verify::ask_vendor": R(
    "Nur auf den Hersteller zu warten verschenkt das Reaktionsfenster.",
    "Just waiting for the vendor wastes the response window.",
    "Attendre seulement le fournisseur gaspille la fenêtre de réaction.",
  ),
  "ot_anomaly::isolate::fw_acl": R(
    "Engineering-only ACL mit Schichtleitung abgestimmt — Containment ohne Stillstand.",
    "Engineering-only ACL signed off with shift lead — containment without downtime.",
    "ACL engineering-only validée avec chef de quart — confinement sans arrêt.",
  ),
  "ot_anomaly::isolate::shutdown_plc": R(
    "SPS hart abschalten erzeugt unkontrollierten Prozessstopp — Safety-Risiko.",
    "Hard-stopping the PLC creates an uncontrolled process halt — safety risk.",
    "Couper le PLC à chaud crée un arrêt incontrôlé — risque sécurité.",
  ),
  "ot_anomaly::isolate::block_all_ot": R(
    "Komplette OT-IT-Trennung kappt auch HMI/Historian — Blindflug für die Schicht.",
    "Cutting all OT-IT also kills HMI/historian — shift flies blind.",
    "Couper tout OT-IT supprime aussi HMI/historian — équipe en aveugle.",
  ),
  "ot_anomaly::coord::ot_safety": R(
    "Schicht, OT-Engineering und Safety gemeinsam — Produktionsimpact wird greifbar.",
    "Shift, OT engineering and safety together — production impact becomes tangible.",
    "Quart, ingénierie OT et safety ensemble — l'impact production devient palpable.",
  ),
  "ot_anomaly::coord::it_only": R(
    "Im IT-SOC abkapseln ignoriert Safety und Schicht — Eskalationspfad fehlt.",
    "Keeping it inside IT-SOC ignores safety and shift — escalation path missing.",
    "Garder en interne IT-SOC ignore safety et quart — chemin d'escalade absent.",
  ),
  "ot_anomaly::coord::press_first": R(
    "Presse vor Engineering ist Reputationsschaden ohne belastbaren Befund.",
    "Press before engineering is reputation damage without a solid finding.",
    "La presse avant l'ingénierie nuit à la réputation sans constat solide.",
  ),

  // ============================ ROGUE WIFI ============================
  "rogue_wifi::locate::triangulate": R(
    "Triangulation über Signalstärke + Geräte-ID liefert Beweis und Standort.",
    "Triangulation via signal strength and device ID yields evidence and location.",
    "Triangulation par force de signal et ID donne preuve et emplacement.",
  ),
  "rogue_wifi::locate::deauth_now": R(
    "Blind deauthen warnt den Angreifer und vernichtet Funkbeweise.",
    "Blind deauth tips off the attacker and destroys radio evidence.",
    "Désauthentifier à l'aveugle alerte l'attaquant et détruit les preuves radio.",
  ),
  "rogue_wifi::locate::ignore": R(
    "Als WIDS-Falschmeldung schließen ist bequem — und genau das, worauf der Angreifer baut.",
    "Closing as WIDS false positive is convenient — and exactly what the attacker counts on.",
    "Clore comme faux positif WIDS est commode — et c'est ce sur quoi l'attaquant compte.",
  ),
  "rogue_wifi::remove::facilities": R(
    "Mit Site-Security einsammeln, Beweis sichern, Etage informieren — sauberer Ablauf.",
    "Collect with site security, preserve evidence, brief the floor — clean workflow.",
    "Récupérer avec la sécurité du site, conserver la preuve, briefer l'étage — propre.",
  ),
  "rogue_wifi::remove::smash": R(
    "Vor Ort zerstören vernichtet Forensik — Täterzuordnung verloren.",
    "Smashing it on the spot destroys forensics — attribution lost.",
    "L'écraser sur place détruit la forensique — attribution perdue.",
  ),
  "rogue_wifi::remove::leave_run": R(
    "Als Honeypot weiterlaufen lassen ohne Mandat überschreitet die SOC-Befugnis.",
    "Leaving it as a honeypot without authorisation oversteps SOC authority.",
    "Le laisser en honeypot sans mandat dépasse l'autorité du SOC.",
  ),
  "rogue_wifi::users::etage_brief": R(
    "Knappe, sachliche Etagen-Notiz — Hinweis auf Zertifikatsprüfung reicht.",
    "Brief factual floor note — pointing at certificate checks is enough.",
    "Note d'étage brève et factuelle — rappeler la vérif certificat suffit.",
  ),
  "rogue_wifi::users::company_wide": R(
    "Firmenweite Panikmail mit Foto erzeugt Lärm und neue Phishing-Vorlage.",
    "Company-wide panic mail with a photo creates noise and a fresh phishing template.",
    "Mail panique globale avec photo crée du bruit et un modèle de phishing.",
  ),
  "rogue_wifi::users::silent": R(
    "Ganz schweigen lässt Betroffene unwissend weitersurfen — Lerneffekt null.",
    "Total silence leaves affected users browsing on unaware — zero learning effect.",
    "Silence total laisse les utilisateurs naviguer sans savoir — zéro apprentissage.",
  ),
};

/** Lookup helper used by socLifeReasons.ts. */
export function lookupReasonOverride(
  incidentId: string,
  stepId: string,
  optionId: string,
  lang: Lang,
): string | null {
  const key = `${incidentId}::${stepId}::${optionId}`;
  const entry = REASON_OVERRIDES[key];
  return entry ? entry[lang] : null;
}
