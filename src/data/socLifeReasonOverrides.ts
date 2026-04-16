/**
 * Per-option, per-language rationales for the SOC-Life consequence overlay.
 *
 * The generic tier+phase fallback in socLifeReasons.ts produced rationales
 * that did not actually match the option the user picked (e.g. picking
 * "back-date a PDF" against the auditor would yield a generic
 * "serious procedural error" line). That broke trust in the learning loop.
 *
 * This map gives every option a tailored, correct rationale that explains
 * *why* the specific choice was right or wrong — referencing the concrete
 * mechanism (chain of custody, IOCs, lateral movement, GDPR Art. 6, etc.).
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
    "Header- und URL-Analyse plus Sandbox liefern belastbare IOCs — Voraussetzung für saubere Eindämmung.",
    "Header/URL analysis plus sandbox detonation yields hard IOCs — the prerequisite for clean containment.",
    "L'analyse des en-têtes/URLs et la détonation sandbox produisent des IOCs solides — base d'un confinement propre.",
  ),
  "phishing::detect::block_now": R(
    "Sender blocken ohne IOC-Erfassung verbrennt Beweise und verhindert weitere Korrelation in Logs.",
    "Blocking the sender without capturing IOCs burns evidence and prevents further log correlation.",
    "Bloquer l'expéditeur sans capturer les IOCs détruit les preuves et empêche la corrélation.",
  ),
  "phishing::detect::user_train": R(
    "Massen-Awareness vor Analyse erzeugt Lärm, warnt den Angreifer und blockiert die SOC-Hotline mit Rückfragen.",
    "Mass awareness before analysis creates noise, tips off the attacker, and floods the SOC hotline.",
    "La sensibilisation de masse avant analyse crée du bruit, alerte l'attaquant et sature la hotline.",
  ),
  "phishing::contain::block_sender": R(
    "Sender + URL am Gateway blocken und Mails zurückziehen stoppt aktive Klicks und neue Treffer in einem Schritt.",
    "Blocking sender + URLs at the gateway and recalling mails stops active clicks and new hits in one step.",
    "Bloquer expéditeur + URLs sur la passerelle et rappeler les mails arrête les clics actifs et les nouveaux impacts.",
  ),
  "phishing::contain::delete_only": R(
    "Mails nur löschen lässt Sender und URLs frei — die Welle rollt unter neuem Betreff weiter.",
    "Just deleting the mails leaves sender and URLs live — the wave keeps coming under a new subject.",
    "Supprimer uniquement les mails laisse l'expéditeur et les URLs actifs — la vague continue sous un nouveau sujet.",
  ),
  "phishing::contain::quarantine": R(
    "Komplette Postfächer quarantänisieren produziert massiven Geschäftsausfall, ohne den Angriff zu stoppen.",
    "Quarantining entire mailboxes causes massive business outage without stopping the attack.",
    "Mettre en quarantaine les boîtes entières crée un arrêt massif sans stopper l'attaque.",
  ),
  "phishing::report::brief_ciso": R(
    "Knappes CISO-Briefing mit Scope, Impact und nächsten Schritten ist genau das Format, das Entscheidungen ermöglicht.",
    "A crisp CISO brief with scope, impact and next steps is exactly the format that enables decisions.",
    "Un briefing CISO concis avec portée, impact et étapes suivantes est le format qui permet de décider.",
  ),
  "phishing::report::wait_full": R(
    "Auf den Vollbericht warten verzögert Entscheidungen, die jetzt getroffen werden müssen.",
    "Waiting for the full report delays decisions that need to be made now.",
    "Attendre le rapport complet retarde des décisions à prendre maintenant.",
  ),
  "phishing::report::email_only": R(
    "Nur E-Mail an den CISO unterläuft die Eskalationspflicht und erlaubt Missverständnisse ohne Rückfrage-Möglichkeit.",
    "Email-only to the CISO bypasses the escalation duty and allows misreads with no chance to clarify.",
    "Un simple email au CISO contourne l'obligation d'escalade et laisse place à l'incompréhension.",
  ),

  // ============================ RANSOMWARE ==============================
  "ransomware::verify::confirm_edr": R(
    "EDR-Telemetrie und Hash-Verifikation bestätigen den Vorfall, bevor irreversible Schritte erfolgen.",
    "EDR telemetry and hash verification confirm the incident before any irreversible step is taken.",
    "La télémétrie EDR et la vérification des hashes confirment l'incident avant toute action irréversible.",
  ),
  "ransomware::verify::shutdown_srv": R(
    "Hartes Abschalten zerstört flüchtigen Speicher (Schlüsselmaterial!) und damit die einzige Decryption-Chance.",
    "Hard shutdown destroys volatile memory (key material!) — and with it the only chance at decryption.",
    "Un arrêt brutal détruit la mémoire volatile (matériel cryptographique !) — et toute chance de déchiffrement.",
  ),
  "ransomware::verify::kill_share": R(
    "Share offline nehmen ohne Forensik bremst zwar die Verschlüsselung, vernichtet aber Spuren des Initial-Vektors.",
    "Pulling the share offline without forensics slows encryption but erases initial-vector traces.",
    "Couper le partage sans forensique ralentit le chiffrement mais détruit les traces du vecteur initial.",
  ),
  "ransomware::isolate::segment_vlan": R(
    "VLAN-Segmentierung + EDR-Isolation stoppt Lateral Movement und erhält gleichzeitig die Forensik.",
    "VLAN segmentation + EDR isolation stops lateral movement while preserving forensics.",
    "Segmentation VLAN + isolation EDR stoppe le mouvement latéral tout en préservant la forensique.",
  ),
  "ransomware::isolate::block_ad": R(
    "AD-Konto sperren reicht nicht — der Verschlüsselungs-Prozess läuft mit lokalem Token weiter.",
    "Disabling the AD account isn't enough — the encryption process keeps running with its local token.",
    "Désactiver le compte AD ne suffit pas — le processus de chiffrement continue avec son jeton local.",
  ),
  "ransomware::isolate::block_internet": R(
    "Internet kappen stoppt nur C2 — die lokale Verschlüsselung läuft ungebremst weiter.",
    "Cutting internet only stops C2 — local encryption continues unimpeded.",
    "Couper Internet stoppe seulement le C2 — le chiffrement local continue sans entrave.",
  ),
  "ransomware::recover::restore_backup": R(
    "Backup aus Offline-Vault prüfen und sauber restoren ist der einzige Weg, Re-Infection zuverlässig auszuschließen.",
    "Verifying offline-vault backups and restoring cleanly is the only way to reliably exclude re-infection.",
    "Vérifier les sauvegardes hors-ligne puis restaurer proprement est le seul moyen d'exclure la ré-infection.",
  ),
  "ransomware::recover::restore_latest": R(
    "Sofortiges Online-Restore riskiert, dass das Backup bereits verschlüsselt ist — du installierst den Schaden erneut.",
    "Restoring the latest online backup risks that the backup is already encrypted — you reinstall the damage.",
    "Restaurer la dernière sauvegarde en ligne risque qu'elle soit déjà chiffrée — tu réinstalles les dégâts.",
  ),
  "ransomware::recover::shadow_copies": R(
    "Shadow Copies ohne Integritätsprüfung sind oft die erste Komponente, die Ransomware löscht oder manipuliert.",
    "Shadow copies without integrity check are often the first thing ransomware deletes or tampers with.",
    "Les shadow copies sans vérification d'intégrité sont souvent la première cible des ransomwares.",
  ),

  // =============================== DDOS =================================
  "ddos::verify::verify_traffic": R(
    "Flow-Daten + Geo-Verteilung trennen volumetrische von Layer-7-Angriffen — entscheidet über die richtige Mitigation.",
    "Flow data + geo distribution separates volumetric from L7 attacks — drives the right mitigation choice.",
    "Flow data + géo distinguent volumétrique vs L7 — détermine la bonne mitigation.",
  ),
  "ddos::verify::scale_up": R(
    "Web-Tier hochskalieren ohne Analyse erhöht nur die Angriffsfläche und die Cloud-Rechnung.",
    "Scaling up the web tier without analysis only inflates attack surface and cloud bill.",
    "Scaler la couche web sans analyse n'augmente que la surface d'attaque et la facture cloud.",
  ),
  "ddos::verify::rate_limit_all": R(
    "Globales Rate-Limit straft legitime Kunden ab und löst keinen volumetrischen Layer-3/4-Angriff.",
    "Global rate-limit punishes legitimate customers and won't solve a volumetric L3/4 attack.",
    "Un rate-limit global pénalise les clients légitimes et ne règle pas une attaque L3/4.",
  ),
  "ddos::mitigate::scrubbing": R(
    "Scrubbing-Provider + gezielte WAF-Regeln ist der Industriestandard — Volumen weg, Service bleibt online.",
    "Scrubbing provider + targeted WAF rules is the industry standard — volume gone, service stays online.",
    "Provider de scrubbing + règles WAF ciblées est le standard — volume éliminé, service en ligne.",
  ),
  "ddos::mitigate::geoblock": R(
    "Pauschaler Geoblock blockiert echte Kunden, während Botnetze einfach Region wechseln.",
    "A blanket geo-block locks out real customers while botnets simply rotate regions.",
    "Un géo-blocage massif bloque les vrais clients pendant que les botnets changent de région.",
  ),
  "ddos::mitigate::captcha_all": R(
    "CAPTCHA für alle Logins zerstört die Conversion und stoppt einen L3/4-Flood überhaupt nicht.",
    "Forcing CAPTCHA on all logins kills conversion and does nothing against an L3/4 flood.",
    "Forcer CAPTCHA sur tous les logins tue la conversion et ne stoppe pas un flood L3/4.",
  ),
  "ddos::comms::status_page": R(
    "Status-Page + interne Stakeholder zu informieren bewahrt Vertrauen und verhindert Gerüchtebildung.",
    "Status page + internal stakeholder updates preserves trust and prevents rumour spirals.",
    "La status page + les parties prenantes internes préserve la confiance et évite les rumeurs.",
  ),
  "ddos::comms::wait_resolved": R(
    "Schweigen während eines Ausfalls erzeugt Spekulation in Medien und Twitter — Reputationsschaden ist größer als der Vorfall.",
    "Silence during an outage drives media and Twitter speculation — reputational damage exceeds the outage itself.",
    "Le silence pendant une panne alimente médias et Twitter — les dégâts de réputation dépassent la panne.",
  ),
  "ddos::comms::internal_only": R(
    "Nur intern kommunizieren wirkt wie Vertuschung, sobald Kunden den Ausfall selbst bemerken.",
    "Internal-only comms looks like cover-up the moment customers notice the outage themselves.",
    "La communication interne uniquement ressemble à une dissimulation dès que les clients voient la panne.",
  ),

  // ============================== INSIDER ===============================
  "insider::triage::review_dlp": R(
    "DLP + UEBA-Baseline-Vergleich trennt echtes Fehlverhalten von harmloser Anomalie — schützt vor Falschverdächtigung.",
    "DLP + UEBA baseline comparison separates real misconduct from harmless anomaly — guards against false accusation.",
    "DLP + comparaison UEBA distinguent vraie faute et anomalie bénigne — protège des fausses accusations.",
  ),
  "insider::triage::lock_acct": R(
    "Account ohne Kontext sperren kann arbeitsrechtlich und kollektivvertraglich angreifbar sein und tippt den Insider ab.",
    "Locking the account without context may be legally challengeable and tips off the insider.",
    "Verrouiller le compte sans contexte est juridiquement attaquable et alerte l'initié.",
  ),
  "insider::triage::ask_mgr": R(
    "Den Vorgesetzten zu fragen verletzt Vertraulichkeit der Untersuchung und kann Kollusionsrisiken schaffen.",
    "Asking the line manager breaks the investigation's confidentiality and may create collusion risk.",
    "Demander au manager rompt la confidentialité de l'enquête et peut créer un risque de collusion.",
  ),
  "insider::preserve::image_endpoint": R(
    "Forensisches Image + Chain-of-Custody ist die einzige Beweisform, die vor Arbeitsgericht und Staatsanwalt hält.",
    "A forensic image + chain of custody is the only evidence form that holds up in labour court and prosecution.",
    "L'image forensique + chaîne de garde est la seule preuve qui tienne devant les prud'hommes et le procureur.",
  ),
  "insider::preserve::remote_collect": R(
    "Reine Remote-Triage übersieht Memory-Artefakte und ist als Beweis vor Gericht oft nicht ausreichend.",
    "Remote-only triage misses memory artefacts and often falls short as legal evidence.",
    "La seule triage à distance manque les artefacts mémoire et est souvent insuffisante en justice.",
  ),
  "insider::preserve::snapshot_vm": R(
    "VM-Snapshot ohne Memory-Dump verliert laufende Prozesse, Schlüssel und Netzwerk-Verbindungen.",
    "VM snapshot without memory dump loses running processes, keys and network connections.",
    "Snapshot VM sans dump mémoire perd processus, clés et connexions réseau.",
  ),
  "insider::hr_legal::loop_hr_legal": R(
    "HR + Legal + DPO formell einbinden ist Pflicht: ohne sie ist jede Konsequenz angreifbar.",
    "Formally looping HR + Legal + DPO is mandatory: without them every consequence is challengeable.",
    "Impliquer formellement RH + juridique + DPO est obligatoire : sans eux, toute conséquence est attaquable.",
  ),
  "insider::hr_legal::ciso_only": R(
    "Nur den CISO informieren übergeht arbeits- und datenschutzrechtliche Verfahren — alles spätere wird angreifbar.",
    "Informing only the CISO bypasses labour and data-protection procedure — everything downstream becomes challengeable.",
    "Informer uniquement le CISO contourne le droit du travail et la protection des données.",
  ),
  "insider::hr_legal::shadow": R(
    "Stilles Beobachten ohne Eskalation lässt den Schaden weiterlaufen und macht später jede Sanktion unmöglich.",
    "Silent monitoring without escalation lets the damage continue and makes later sanctions impossible.",
    "Observer en silence sans escalader laisse le dommage s'étendre et rend toute sanction impossible.",
  ),

  // ================================ BEC =================================
  "bec::verify::auth_logs": R(
    "Mail-Auth + Login-Geo des CEO-Postfachs zeigt Spoofing oder echten Account-Takeover binnen Minuten.",
    "Mail auth + login geo of the CEO mailbox shows spoofing or real account takeover within minutes.",
    "L'auth mail + géo des connexions du CEO révèle spoofing ou compromission en quelques minutes.",
  ),
  "bec::verify::call_ceo": R(
    "Die Nummer aus der Mail-Signatur stammt vom Angreifer — du rufst den Betrüger an, der bestätigt.",
    "The number from the mail signature is the attacker's — you'd call the fraudster, who 'confirms'.",
    "Le numéro dans la signature est celui de l'attaquant — tu appelles le fraudeur, qui 'confirme'.",
  ),
  "bec::verify::ask_finance": R(
    "Buchhaltung nach 'Plausibilität' fragen ist genau der Social-Engineering-Hebel, den BEC ausnutzt.",
    "Asking finance whether it 'looks plausible' is exactly the social-engineering lever BEC exploits.",
    "Demander à la finance si c'est 'plausible' est précisément le levier social-engineering du BEC.",
  ),
  "bec::stop_payment::freeze_call": R(
    "Buchhaltung + Bank-Hotline parallel zu kontaktieren ist die einzige Chance, das Geld vor SWIFT-Cutoff zurückzuholen.",
    "Contacting finance + bank hotline in parallel is the only chance to recover funds before SWIFT cutoff.",
    "Contacter finance + hotline banque en parallèle est la seule chance de récupérer avant le cutoff SWIFT.",
  ),
  "bec::stop_payment::email_only": R(
    "Eine Stop-Mail wird in der Buchhaltung erst nach Stunden gelesen — Geld ist längst weg.",
    "A stop email gets read in finance hours later — money is long gone.",
    "Un mail d'arrêt sera lu en finance des heures plus tard — l'argent est déjà parti.",
  ),
  "bec::stop_payment::wait_legal": R(
    "Auf Legal-Freigabe zu warten ist bei BEC eine Garantie für 100% Verlust — Stunden zählen.",
    "Waiting for legal sign-off in a BEC case is a guaranteed 100% loss — hours count.",
    "Attendre l'aval juridique en BEC garantit 100% de perte — chaque heure compte.",
  ),
  "bec::harden::policy_4eyes": R(
    "4-Augen-Prinzip + Rückruf-Pflicht über verifizierten Kanal ist die einzige strukturelle Abwehr gegen BEC.",
    "Four-eyes + callback over a verified channel is the only structural defence against BEC.",
    "Quatre yeux + rappel sur canal vérifié est la seule défense structurelle contre le BEC.",
  ),
  "bec::harden::block_ext": R(
    "Alle externen Mails zu blocken bricht das Geschäft komplett — Overreaction ohne Schutzwirkung.",
    "Blocking all external email breaks the business entirely — overreaction with no real protection.",
    "Bloquer tous les mails externes casse l'activité — surréaction sans protection réelle.",
  ),
  "bec::harden::rotate_ceo": R(
    "Nur das CEO-Passwort rotieren adressiert weder Spoofing noch das fehlende Vier-Augen-Prinzip.",
    "Just rotating the CEO's password addresses neither spoofing nor the missing four-eyes rule.",
    "Faire tourner seul le mot de passe du CEO ne traite ni le spoofing ni l'absence de quatre yeux.",
  ),

  // =========================== LATERAL MOVEMENT =========================
  "lateral_movement::scope::graph": R(
    "Auth-Graph + 4624/4672-Korrelation zeigt das vollständige Lateral-Pattern — Voraussetzung für komplette Eindämmung.",
    "Auth graph + 4624/4672 correlation reveals the full lateral pattern — prerequisite for complete containment.",
    "Graphe d'auth + 4624/4672 révèle le pattern latéral complet — base d'un confinement complet.",
  ),
  "lateral_movement::scope::endpoint_only": R(
    "Nur den Ursprungs-Endpoint zu analysieren übersieht alle bereits kompromittierten Hops.",
    "Analysing only the origin endpoint misses every already-compromised hop.",
    "Analyser seulement l'endpoint d'origine rate tous les sauts déjà compromis.",
  ),
  "lateral_movement::scope::ask_user": R(
    "Den User zu fragen ist nutzlos — entweder lügt er, oder seine Credentials wurden ohne sein Wissen genutzt.",
    "Asking the user is useless — either they lie, or their credentials were used without their knowledge.",
    "Demander à l'utilisateur est inutile — soit il ment, soit ses identifiants ont été utilisés à son insu.",
  ),
  "lateral_movement::contain::isolate_set": R(
    "Alle betroffenen Hosts EDR-isolieren + Service-Konten sperren schneidet Lateral Movement vollständig ab.",
    "EDR-isolating all affected hosts + disabling service accounts cuts lateral movement completely.",
    "Isoler tous les hôtes via EDR + désactiver les comptes service coupe complètement le mouvement latéral.",
  ),
  "lateral_movement::contain::isolate_one": R(
    "Nur den ersten Host zu isolieren ignoriert die bereits etablierten Persistenz-Punkte auf den anderen Hops.",
    "Isolating only the first host ignores persistence already established on the other hops.",
    "Isoler seulement le premier hôte ignore la persistance déjà établie sur les autres sauts.",
  ),
  "lateral_movement::contain::block_smb": R(
    "Pauschales SMB-Block legt Datei-Server, Drucker und Backups lahm — und der Angreifer wechselt auf WinRM oder RDP.",
    "Blanket SMB block kills file servers, printers and backups — and the attacker just pivots to WinRM or RDP.",
    "Bloquer SMB partout casse fichiers, imprimantes et backups — et l'attaquant passe à WinRM ou RDP.",
  ),
  "lateral_movement::creds::rotate_tier": R(
    "Tier-0-Konten + krbtgt zweimal rotieren entwertet alle Golden-Tickets, die der Angreifer bereits geprägt hat.",
    "Rotating tier-0 + krbtgt twice invalidates every Golden Ticket the attacker may already have minted.",
    "Faire tourner tier-0 + krbtgt deux fois invalide tous les Golden Tickets éventuellement forgés.",
  ),
  "lateral_movement::creds::rotate_all": R(
    "Alle Passwörter unternehmensweit zurückzusetzen sprengt jeden Helpdesk und beseitigt die Kerberos-Tickets nicht.",
    "Resetting every password company-wide overwhelms the helpdesk and doesn't invalidate Kerberos tickets.",
    "Réinitialiser tous les mots de passe sature le helpdesk et n'invalide pas les tickets Kerberos.",
  ),
  "lateral_movement::creds::rotate_one": R(
    "Nur das User-Passwort zu ändern ignoriert Service-Konten, Computer-Accounts und gestohlene Tickets.",
    "Resetting only the user's password ignores service accounts, computer accounts and stolen tickets.",
    "Changer seulement le mot de passe de l'utilisateur ignore les comptes service, machine et tickets volés.",
  ),

  // ============================= C2 BEACON ==============================
  "c2_beacon::analyse::ti_lookup": R(
    "TI-Lookup + JA3 + Beacon-Intervall identifiziert Tooling und alle infizierten Hosts in einem Schritt.",
    "TI lookup + JA3 + beacon interval identifies tooling and every infected host in one step.",
    "Lookup TI + JA3 + intervalle identifie l'outil et tous les hôtes infectés en une étape.",
  ),
  "c2_beacon::analyse::block_dns": R(
    "DNS-Sinkhole ohne Analyse warnt den Angreifer und zerstört die Chance, das Tooling zu identifizieren.",
    "DNS sinkhole without analysis tips off the attacker and destroys the chance to identify the tooling.",
    "Le sinkhole DNS sans analyse alerte l'attaquant et détruit la chance d'identifier l'outil.",
  ),
  "c2_beacon::analyse::wait": R(
    "24h beobachten gibt dem Angreifer 24h für Datendiebstahl und weitere Lateral-Bewegung.",
    "Observing for 24h gives the attacker 24h for data theft and further lateral movement.",
    "Observer 24h donne 24h à l'attaquant pour exfiltrer et continuer le mouvement latéral.",
  ),
  "c2_beacon::block::fw_proxy": R(
    "Domain + IPs auf Firewall und Proxy + DNS-Sinkhole schließt alle drei realistischen Egress-Wege gleichzeitig.",
    "Domain + IPs at firewall and proxy + DNS sinkhole closes all three realistic egress paths at once.",
    "Domaine + IPs sur firewall et proxy + sinkhole DNS ferme les trois chemins d'egress réalistes.",
  ),
  "c2_beacon::block::edr_only": R(
    "Nur Hash blacklisten ist trivial umgangen — der Angreifer rebuildet das Binary in 5 Minuten.",
    "Hash-only blacklist is trivially bypassed — the attacker rebuilds the binary in 5 minutes.",
    "Blacklister seul le hash est trivialement contourné — l'attaquant reconstruit le binaire en 5 min.",
  ),
  "c2_beacon::block::block_outb": R(
    "Allen Outbound-Traffic zu blocken legt den Host komplett lahm — kein Patching, keine Telemetrie mehr.",
    "Blocking all outbound traffic cripples the host — no patching, no telemetry anymore.",
    "Bloquer tout le trafic sortant paralyse l'hôte — plus de patch ni de télémétrie.",
  ),
  "c2_beacon::remediate::image_reimage": R(
    "Imagen, Persistenz suchen und sauber neu aufsetzen ist der einzige Weg, versteckte Backdoors zuverlässig zu entfernen.",
    "Image, hunt persistence, then reimage cleanly is the only reliable way to remove hidden backdoors.",
    "Imager, chasser la persistance puis réinstaller est la seule façon fiable d'éliminer les backdoors.",
  ),
  "c2_beacon::remediate::av_scan": R(
    "Ein AV-Vollscan findet bekannte Signaturen — moderne Loader und Reflective DLLs werden ihn überleben.",
    "A full AV scan only catches known signatures — modern loaders and reflective DLLs survive it.",
    "Un scan AV complet n'attrape que les signatures connues — les loaders modernes y survivent.",
  ),
  "c2_beacon::remediate::kill_proc": R(
    "Nur den Beacon-Prozess zu killen lässt Persistenz-Mechanismen (Run-Key, Scheduled Task, WMI) unberührt.",
    "Killing only the beacon process leaves persistence (Run keys, Scheduled Tasks, WMI) untouched.",
    "Tuer seulement le processus beacon laisse la persistance (Run keys, tâches planifiées, WMI) intacte.",
  ),

  // ============================= CRED DUMP ==============================
  "cred_dump::validate::process_tree": R(
    "Prozess-Tree + Tool-Signatur ist der schnellste deterministische Beleg, ob LSASS-Zugriff legitim oder Angriff ist.",
    "Process tree + tool signature is the fastest deterministic proof of whether LSASS access is legit or attack.",
    "L'arbre de processus + signature outil est la preuve déterministe la plus rapide.",
  ),
  "cred_dump::validate::ask_admin": R(
    "Den Admin zu fragen verbrennt Zeit und tippt im Worst Case einen kollusionierenden Insider ab.",
    "Asking the admin wastes time and, worst case, tips off a colluding insider.",
    "Demander à l'admin perd du temps et, au pire, alerte un initié complice.",
  ),
  "cred_dump::validate::trust_av": R(
    "AV-Schweigen ist bei modernen Credential-Dumpern Standard — als FP zu schließen heißt, den Angriff zu billigen.",
    "AV silence is standard with modern credential dumpers — closing as FP means greenlighting the attack.",
    "Le silence de l'AV est la norme avec les dumpers modernes — fermer en FP revient à valider l'attaque.",
  ),
  "cred_dump::isolate::edr_isolate": R(
    "EDR-Isolation + Session-Kill stoppt sofort weiteren Dump und Pivot, ohne Memory zu verlieren.",
    "EDR isolation + session kill immediately stops further dumping and pivot without losing memory.",
    "Isolation EDR + kill de sessions stoppe dump et pivot sans perdre la mémoire.",
  ),
  "cred_dump::isolate::shutdown": R(
    "Hartes Ausschalten zerstört den RAM — und damit jeden Beweis dafür, was wirklich abgezogen wurde.",
    "Hard power-off destroys RAM — and with it every proof of what was actually exfiltrated.",
    "Un arrêt brutal détruit la RAM — et toute preuve de ce qui a été exfiltré.",
  ),
  "cred_dump::isolate::user_logoff": R(
    "User abmelden bei aktivem Angriff ist wirkungslos — der Dumper läuft als SYSTEM oder Service weiter.",
    "Logging the user off during an active attack is futile — the dumper runs as SYSTEM or a service.",
    "Déconnecter l'utilisateur est inutile — le dumper tourne en SYSTEM ou en service.",
  ),
  "cred_dump::rotate::all_admin": R(
    "Alle privilegierten Konten + Service-Accounts vom Host rotieren ist die einzige Garantie, dass gestohlene Hashes wertlos sind.",
    "Rotating all privileged + service accounts from the host is the only guarantee that stolen hashes are worthless.",
    "Faire tourner tous les comptes priv. + service de l'hôte est la seule garantie que les hashes volés soient inutiles.",
  ),
  "cred_dump::rotate::owner_only": R(
    "Nur das Konto des Admins zu rotieren ignoriert alle anderen Hashes, die im LSASS-Speicher waren.",
    "Rotating only the admin's account ignores every other hash that was in LSASS memory.",
    "Faire tourner seul le compte de l'admin ignore tous les autres hashes présents dans LSASS.",
  ),
  "cred_dump::rotate::schedule": R(
    "Rotation in das nächste Wartungsfenster zu legen schenkt dem Angreifer Wochen mit gültigen Credentials.",
    "Pushing rotation to the next maintenance window gifts the attacker weeks of valid credentials.",
    "Reporter la rotation à la maintenance offre à l'attaquant des semaines d'identifiants valides.",
  ),

  // ============================ SUPPLY CHAIN ============================
  "supply_chain::exposure::cmdb_query": R(
    "CMDB + EDR nach Version & Hash zu fragen liefert exakte Exposition in Minuten — Basis für jede weitere Entscheidung.",
    "Querying CMDB + EDR for version & hash gives exact exposure in minutes — basis for every further decision.",
    "Interroger CMDB + EDR pour version & hash donne l'exposition exacte en minutes.",
  ),
  "supply_chain::exposure::ask_owners": R(
    "System-Owner einzeln zu mailen dauert Tage — und liefert subjektive, oft falsche Antworten.",
    "Emailing system owners one by one takes days — and yields subjective, often wrong answers.",
    "Mailer les owners un par un prend des jours — et donne des réponses subjectives, souvent fausses.",
  ),
  "supply_chain::exposure::wait_advisory": R(
    "Auf das Hersteller-Advisory zu warten heißt, dem Angreifer einen Vorsprung zu geben, der sich nicht aufholen lässt.",
    "Waiting for the vendor advisory hands the attacker a head start you can't claw back.",
    "Attendre l'advisory donne à l'attaquant une avance qu'on ne rattrape plus.",
  ),
  "supply_chain::block::isolate_block": R(
    "Hosts isolieren + Update-Server + IOCs am FW blocken trennt akute Compromise und verhindert neue Auslieferungen.",
    "Isolating hosts + blocking update server + IOCs at the FW cuts active compromise and prevents new deliveries.",
    "Isoler les hôtes + bloquer serveur d'update + IOCs au FW coupe la compromission et empêche de nouvelles livraisons.",
  ),
  "supply_chain::block::uninstall_all": R(
    "Komponente überall deinstallieren, auch in Produktion, erzeugt Ausfälle, die schlimmer sind als der Angriff.",
    "Uninstalling the component everywhere, production included, creates outages worse than the attack itself.",
    "Désinstaller le composant partout, prod incluse, crée des pannes pires que l'attaque elle-même.",
  ),
  "supply_chain::block::patch_now": R(
    "Den nächsten Patch ungetestet auszurollen kann den Angriff verstärken — der nächste Patch könnte selbst kompromittiert sein.",
    "Pushing the next patch untested can amplify the attack — that next patch might itself be compromised.",
    "Pousser le patch suivant sans test peut amplifier l'attaque — il pourrait lui-même être compromis.",
  ),
  "supply_chain::report::ciso_legal": R(
    "CISO + Legal + DPO + Prüfung der NIS-2/DORA-Meldepflichten ist Pflichtprogramm — Fristen laufen ab Kenntnis.",
    "CISO + Legal + DPO + checking NIS-2/DORA notification duties is mandatory — clocks start at awareness.",
    "CISO + juridique + DPO + vérifier obligations NIS-2/DORA est obligatoire — les délais courent dès la connaissance.",
  ),
  "supply_chain::report::ciso_only": R(
    "Nur CISO informieren übersieht regulatorische Fristen, die unabhängig von technischer Bewertung laufen.",
    "Informing only the CISO misses regulatory deadlines that run independent of the technical assessment.",
    "Informer uniquement le CISO rate les délais réglementaires indépendants de l'évaluation technique.",
  ),
  "supply_chain::report::wait_impact": R(
    "Auf konkreten Impact zu warten verletzt NIS-2/DORA — Meldepflicht entsteht bereits bei begründetem Verdacht.",
    "Waiting for concrete impact breaches NIS-2/DORA — duty to report kicks in on reasonable suspicion.",
    "Attendre un impact concret viole NIS-2/DORA — l'obligation naît dès le soupçon raisonnable.",
  ),

  // ============================== EXFIL =================================
  "data_exfil::scope::proxy_dlp": R(
    "Proxy + DLP zu korrelieren klassifiziert Datentyp und Volumen — bestimmt Meldepflicht (DSGVO Art. 33) korrekt.",
    "Correlating proxy + DLP classifies data type and volume — drives correct GDPR Art. 33 reporting decision.",
    "Corréler proxy + DLP classe type et volume — détermine correctement l'obligation RGPD Art. 33.",
  ),
  "data_exfil::scope::block_first": R(
    "Erst zu blocken ohne Analyse warnt den Angreifer und macht es unmöglich, die abgeflossene Datenmenge zu beziffern.",
    "Blocking first without analysis tips off the attacker and makes it impossible to quantify what left.",
    "Bloquer avant d'analyser alerte l'attaquant et empêche de quantifier ce qui est sorti.",
  ),
  "data_exfil::scope::ask_user": R(
    "Den User direkt anzurufen verletzt die Untersuchungs-Vertraulichkeit und kann Beweise gefährden.",
    "Calling the user directly breaches investigation confidentiality and risks evidence integrity.",
    "Appeler directement l'utilisateur rompt la confidentialité de l'enquête et compromet les preuves.",
  ),
  "data_exfil::stop::isolate_revoke": R(
    "Endpoint isolieren + Cloud-Tokens revoken stoppt aktive und gespeicherte Sessions in einem Schritt.",
    "Isolating endpoint + revoking cloud tokens kills active and cached sessions in one step.",
    "Isoler endpoint + révoquer tokens cloud tue sessions actives et en cache en une étape.",
  ),
  "data_exfil::stop::block_cloud": R(
    "Cloud-Anbieter unternehmensweit blocken bricht legitime Workloads und treibt User in Schatten-IT.",
    "Company-wide block of the cloud provider breaks legit workloads and drives users into shadow IT.",
    "Bloquer le provider sur toute l'entreprise casse les workloads légitimes et pousse vers le shadow IT.",
  ),
  "data_exfil::stop::rate_limit": R(
    "Bandbreite zu drosseln verlangsamt Exfiltration nur — der Angreifer braucht eben länger, fertig wird er trotzdem.",
    "Rate-limiting only slows exfiltration — the attacker just takes longer and still finishes.",
    "Limiter la bande passante ne fait que ralentir l'exfiltration — l'attaquant termine quand même.",
  ),
  "data_exfil::notify::dpo_legal": R(
    "DPO + Legal + DSGVO-72h-Bewertung ist Pflicht — Versäumnis kann Bußgeld bis 4 % Jahresumsatz auslösen.",
    "DPO + Legal + GDPR 72h assessment is mandatory — missing it can trigger fines up to 4% of annual revenue.",
    "DPO + juridique + évaluation RGPD 72h est obligatoire — un manquement peut coûter jusqu'à 4 % du CA.",
  ),
  "data_exfil::notify::ciso_only": R(
    "Nur CISO zu informieren verzögert die DSGVO-Frist und macht das Unternehmen sanktionierbar.",
    "Informing only the CISO delays the GDPR clock and exposes the company to sanctions.",
    "Informer uniquement le CISO retarde le délai RGPD et expose l'entreprise à des sanctions.",
  ),
  "data_exfil::notify::wait_proof": R(
    "Auf 'harten Beweis' zu warten verletzt Art. 33 DSGVO — Meldepflicht beginnt bei 'wahrscheinlichem' Risiko.",
    "Waiting for 'hard proof' breaches GDPR Art. 33 — duty starts at 'likely' risk, not certainty.",
    "Attendre une 'preuve dure' viole l'Art. 33 RGPD — l'obligation naît au risque 'probable', pas à la certitude.",
  ),

  // ============================== PATCH =================================
  "zero_day::compromise::ioc_hunt": R(
    "IOCs jagen + Konfig auf Webshells prüfen klärt vor dem Patch, ob bereits eingebrochen wurde — entscheidend für Recovery-Pfad.",
    "Hunting IOCs + checking config for webshells clarifies pre-patch whether you're already breached — drives recovery path.",
    "Chasser les IOCs + vérifier la conf pour webshells clarifie avant le patch si déjà compromis.",
  ),
  "zero_day::compromise::patch_now": R(
    "Sofort patchen ohne Forensik überschreibt Beweise — du weißt nie, ob ein Angreifer schon drin war und persistiert hat.",
    "Patching immediately without forensics overwrites evidence — you'll never know if an attacker was already in.",
    "Patcher sans forensique écrase les preuves — tu ne sauras jamais si un attaquant était déjà entré.",
  ),
  "zero_day::compromise::trust_vendor": R(
    "Auf konkrete IOCs vom Hersteller zu warten ist bei aktiv ausgenutzten 0-Days zu spät — eigene Hunts laufen sofort.",
    "Waiting for concrete vendor IOCs on an actively-exploited 0-day is too late — your own hunts start now.",
    "Attendre des IOCs concrets du fournisseur sur un 0-day exploité est trop tard.",
  ),
  "zero_day::mitigate::workaround": R(
    "Hersteller-Workaround + Allowlist auf Management-Interface schließt den Vektor, ohne den Geschäftsbetrieb abzuschalten.",
    "Vendor workaround + allowlist on the management interface closes the vector without killing operations.",
    "Workaround éditeur + allowlist sur l'interface management ferme le vecteur sans casser l'activité.",
  ),
  "zero_day::mitigate::shut_vpn": R(
    "VPN komplett abzuschalten erzeugt Geschäftsausfall, der oft teurer ist als der Vorfall selbst.",
    "Shutting down the VPN entirely causes business outage often more expensive than the incident.",
    "Couper le VPN entièrement crée une panne souvent plus coûteuse que l'incident.",
  ),
  "zero_day::mitigate::block_external": R(
    "Geo-Filter sind bei Tor/VPN-fähigen Angreifern wirkungslos — Sicherheitsgefühl ohne Schutz.",
    "Geo filters are useless against Tor/VPN-capable attackers — security feel without protection.",
    "Les filtres géo sont inutiles contre des attaquants Tor/VPN — illusion de sécurité.",
  ),
  "zero_day::patch::patch_verify": R(
    "Patch im Wartungsfenster + Re-Hunt nach IOCs danach stellt sicher, dass kein bereits gesetzter Backdoor übersehen wird.",
    "Patch in maintenance window + post-patch IOC re-hunt ensures no pre-existing backdoor is missed.",
    "Patcher en maintenance + re-hunt IOCs après garantit qu'aucune backdoor antérieure n'est ratée.",
  ),
  "zero_day::patch::patch_blind": R(
    "Patch ohne Re-Hunt: wenn der Angreifer bereits Persistenz hatte, bleibt sie nach dem Patch unsichtbar.",
    "Patching without re-hunt: any persistence the attacker placed before stays invisible after.",
    "Patcher sans re-hunt : toute persistance préalable reste invisible après.",
  ),
  "zero_day::patch::wait_window": R(
    "4 Wochen auf das nächste reguläre Fenster zu warten ist bei aktiv ausgenutzter Lücke grobe Fahrlässigkeit.",
    "Waiting four weeks for the next regular window on an actively-exploited flaw is gross negligence.",
    "Attendre 4 semaines la prochaine fenêtre sur une faille exploitée est une négligence grave.",
  ),

  // ============================ AUDITOR VISIT ===========================
  "auditor_visit::greet::calm_pro": R(
    "Ruhig empfangen, Scope klären und eine Begleitperson zu stellen ist Lehrbuch — der Auditor sieht eine kontrollierte Organisation.",
    "Welcome calmly, clarify scope, assign an escort — textbook. The auditor sees a controlled organisation.",
    "Accueillir calmement, clarifier le périmètre, assigner un accompagnant — manuel. L'auditeur voit une organisation maîtrisée.",
  ),
  "auditor_visit::greet::hide_run": R(
    "Sich zu verstecken wirkt sofort verdächtig und führt fast immer zu einer Major Non-Conformity.",
    "Hiding immediately looks suspicious and almost always leads to a major non-conformity.",
    "Se cacher paraît suspect et mène presque toujours à une non-conformité majeure.",
  ),
  "auditor_visit::greet::blame_ciso": R(
    "Jede Auditfrage sofort an den CISO zu eskalieren signalisiert fehlende Verantwortung auf operativer Ebene.",
    "Escalating every audit question to the CISO signals lack of operational ownership.",
    "Escalader chaque question au CISO signale un manque d'ownership opérationnel.",
  ),
  "auditor_visit::doc::show_doc": R(
    "Aktuelle, freigegebene Version aus dem ISMS-Tool zeigen ist genau das Verhalten, das ein Audit reibungslos macht.",
    "Showing the current, approved version from the ISMS tool is exactly what makes an audit go smoothly.",
    "Présenter la version approuvée depuis l'outil SMSI est exactement ce qui fait un audit fluide.",
  ),
  "auditor_visit::doc::fake_pdf": R(
    "Ein PDF antedatieren ist Urkundenfälschung — entzieht das Zertifikat dauerhaft und ist strafbar.",
    "Back-dating a PDF is document fraud — costs the certificate permanently and is a criminal offence.",
    "Antidater un PDF est de la fraude documentaire — fait perdre le certificat et est pénalement punissable.",
  ),
  "auditor_visit::doc::promise_send": R(
    "'Schicken wir später' wird als Major Non-Conformity ('records not available') notiert.",
    "'We'll send it later' gets logged as a major non-conformity ('records not available').",
    "'On vous l'envoie plus tard' devient une non-conformité majeure ('records not available').",
  ),
  "auditor_visit::finding::own_it": R(
    "Lücke offen anerkennen + Risiko-Akzeptanz + Zieldatum vorlegen ist genau das, was Auditoren als Reife bewerten.",
    "Acknowledging the gap + risk acceptance + target date is exactly what auditors score as maturity.",
    "Reconnaître l'écart + acceptation du risque + échéance est ce que les auditeurs notent comme maturité.",
  ),
  "auditor_visit::finding::blame_intern": R(
    "Schuld auf Praktikanten zu schieben demonstriert fehlende Prozess-Owner — der Befund wird zu zwei Befunden.",
    "Blaming an intern demonstrates absent process ownership — the finding becomes two findings.",
    "Mettre la faute sur un stagiaire montre un manque d'ownership — le constat devient deux constats.",
  ),
  "auditor_visit::finding::ticket_close": R(
    "Ticket vor den Augen des Auditors zu schließen ist Beweis-Manipulation und führt zur sofortigen Major Non-Conformity.",
    "Closing the ticket under the auditor's eyes is evidence tampering and an instant major non-conformity.",
    "Fermer le ticket sous les yeux de l'auditeur est de la manipulation de preuve — non-conformité majeure immédiate.",
  ),

  // ============================== FIRE DRILL ============================
  "fire_drill::act::handover": R(
    "On-Call-Übergabe an den Backup-SOC dokumentieren und dann raus — Personensicherheit zuerst, Betriebskontinuität gewahrt.",
    "Documenting on-call handover to backup SOC, then leaving — life safety first, continuity preserved.",
    "Documenter le passage de relais au SOC de secours, puis sortir — sécurité d'abord, continuité préservée.",
  ),
  "fire_drill::act::stay": R(
    "Drinbleiben ist Verstoß gegen Brandschutzvorschriften — keine Information ist es wert, dafür ins Gefängnis oder Krankenhaus zu kommen.",
    "Staying inside violates fire safety rules — no information is worth jail or hospital.",
    "Rester viole les règles incendie — aucune info ne vaut prison ou hôpital.",
  ),
  "fire_drill::act::panic_run": R(
    "Sessions offen lassen erlaubt physischen Zugriff auf laufende Admin-Tools — Risiko für gezielte 'Brand'-Inszenierung.",
    "Leaving sessions open allows physical access to live admin tools — risk of a staged 'fire' diversion.",
    "Laisser les sessions ouvertes permet l'accès physique aux outils admin — risque de 'feu' mis en scène.",
  ),

  // ============================== DPO VISIT =============================
  "dpo_visit::lawful_basis::legit_interest": R(
    "Berechtigtes Interesse Art. 6(1)(f) + dokumentierte Interessenabwägung ist die DSGVO-konforme Begründung für SIEM-Logs.",
    "Legitimate interest Art. 6(1)(f) + documented balancing test is the GDPR-compliant basis for SIEM logging.",
    "Intérêt légitime Art. 6(1)(f) + test de mise en balance documenté est la base RGPD-conforme.",
  ),
  "dpo_visit::lawful_basis::consent": R(
    "Einwilligung im Arbeitsvertrag ist im Beschäftigungsverhältnis nicht freiwillig und damit unwirksam (EDPB-Leitlinie).",
    "Consent in an employment contract isn't freely given and is therefore invalid (EDPB guideline).",
    "Le consentement dans un contrat de travail n'est pas libre et donc invalide (orientation EDPB).",
  ),
  "dpo_visit::lawful_basis::vague": R(
    "'Halt für die Sicherheit' ist keine Rechtsgrundlage — DSGVO verlangt Bestimmtheit und Dokumentation.",
    "'We just do it for security' isn't a legal basis — GDPR requires specificity and documentation.",
    "'On le fait pour la sécurité' n'est pas une base légale — le RGPD exige précision et documentation.",
  ),
  "dpo_visit::retention::policy_pointer": R(
    "Konkrete Retention (90 Tage hot / 12 Monate cold / dann anonymisiert) zeigt Reife und erfüllt Art. 5(1)(e) DSGVO.",
    "Concrete retention (90 days hot / 12 months cold / then anonymised) shows maturity and meets GDPR Art. 5(1)(e).",
    "Conservation concrète (90j chaud / 12 mois froid / puis anonymisé) montre la maturité et respecte l'Art. 5(1)(e).",
  ),
  "dpo_visit::retention::forever": R(
    "'Für immer' verstößt direkt gegen Speicherbegrenzung Art. 5(1)(e) DSGVO — sofort meldepflichtige Datenpanne in der Praxis.",
    "'Forever' directly violates GDPR Art. 5(1)(e) storage limitation — effectively a reportable data breach.",
    "'Pour toujours' viole directement la limitation de conservation Art. 5(1)(e) — violation de fait à signaler.",
  ),
  "dpo_visit::retention::delete_now": R(
    "Logs vor einer DPO-Anfrage zu löschen ist Beweisvereitelung und kann strafbar sein.",
    "Deleting logs ahead of a DPO inquiry is evidence destruction and may be a criminal offence.",
    "Effacer les logs avant une demande du DPO est une destruction de preuve, potentiellement pénale.",
  ),
  "dpo_visit::incident_log::show_register": R(
    "Lebendes Register mit 'meldepflichtig ja/nein' pro Vorfall ist exakt das, was NIS-2/DSGVO als Nachweis verlangen.",
    "A live register with 'reportable yes/no' per incident is exactly what NIS-2/GDPR require as evidence.",
    "Un registre vivant avec 'à signaler oui/non' par incident est exactement ce qu'exigent NIS-2/RGPD.",
  ),
  "dpo_visit::incident_log::verbal_only": R(
    "Mündlich zusammenzufassen ist kein Nachweis — bei Audit oder Aufsichtsbehörde nicht haltbar.",
    "Verbal summary is not evidence — won't hold up against an audit or supervisory authority.",
    "Un résumé oral n'est pas une preuve — intenable face à un audit ou à l'autorité de contrôle.",
  ),
  "dpo_visit::incident_log::filter_out": R(
    "Vor der DPO Vorfälle herauszufiltern ist Verschleierung und kann eine eigene meldepflichtige Verletzung darstellen.",
    "Filtering incidents out for the DPO is concealment and may itself be a reportable breach.",
    "Filtrer les incidents pour le DPO est de la dissimulation, potentiellement une violation à signaler.",
  ),

  // ========================== COMPLIANCE VISIT ==========================
  "compliance_visit::scope_meeting::agenda": R(
    "Kurze Agenda + Themenliste pro Domain führt das Audit — der Prüfer arbeitet deine Struktur, nicht seine Hypothesen ab.",
    "A short agenda + topics-per-domain leads the audit — the assessor works your structure, not their hypotheses.",
    "Une agenda + liste de thèmes par domaine guide l'audit — l'évaluateur suit ta structure, pas ses hypothèses.",
  ),
  "compliance_visit::scope_meeting::open_bar": R(
    "'Schaut alles an' ohne Struktur produziert zufällige Stichproben — meistens genau die Lücken.",
    "'Look at anything' with no structure produces random samples — usually right at the gaps.",
    "'Regardez tout' sans structure produit des échantillons aléatoires — souvent sur les lacunes.",
  ),
  "compliance_visit::scope_meeting::delay_weeks": R(
    "'In drei Wochen' wird im Bericht als 'Organisation nicht audit-bereit' notiert — Reifegrad sinkt sofort.",
    "'In three weeks' gets logged as 'organisation not audit-ready' — maturity score drops immediately.",
    "'Dans trois semaines' est noté comme 'organisation non prête' — la note de maturité chute.",
  ),
  "compliance_visit::evidence::live_export": R(
    "Live-Export aus dem Compliance-Tool zeigt belastbare Findings, Maßnahmen und Zieldaten — Goldstandard für Nachweise.",
    "Live export from the compliance tool shows solid findings, actions and target dates — gold standard.",
    "Export en direct depuis l'outil montre findings, actions et échéances — standard or de la preuve.",
  ),
  "compliance_visit::evidence::screenshot": R(
    "Screenshots aus alten Slides sind keine Nachweise — Aktualität und Versionierung lassen sich nicht zeigen.",
    "Screenshots from old slides aren't evidence — currency and versioning can't be demonstrated.",
    "Captures d'anciennes slides ne sont pas des preuves — actualité et versioning indémontrables.",
  ),
  "compliance_visit::evidence::rewrite": R(
    "'Rückwirkend dokumentieren' ist Fälschung — wird beim nächsten Stichprobenvergleich entdeckt und beendet das Zertifikat.",
    "'Retroactive documentation' is fabrication — caught on the next cross-check and ends the certificate.",
    "'Documentation rétroactive' est une fabrication — détectée au prochain recoupement, fin du certificat.",
  ),
  "compliance_visit::gap::own_plan": R(
    "Lücke anerkennen + Maßnahme + Owner + Zieldatum ist genau das Format, das aus einer Lücke ein 'Observation' statt einer Major macht.",
    "Acknowledge gap + action + owner + target date is exactly what turns a gap into an 'observation' rather than a major.",
    "Reconnaître + action + responsable + échéance transforme un écart en 'observation' plutôt qu'en majeure.",
  ),
  "compliance_visit::gap::wordsmith": R(
    "Pflichten 'kreativ uminterpretieren' fällt im Cross-Check sofort auf — der Befund eskaliert von Observation auf Major.",
    "'Creatively reinterpreting' obligations gets caught on cross-check — the finding escalates to major.",
    "'Réinterpréter' les obligations se voit au recoupement — le constat passe en majeur.",
  ),
  "compliance_visit::gap::blame_it": R(
    "Auf die IT zu zeigen offenbart fehlende ISMS-Verantwortung — der Auditor notiert Governance-Lücke zusätzlich.",
    "Pointing at IT exposes absent ISMS ownership — the auditor logs an extra governance gap.",
    "Pointer vers l'IT révèle un manque d'ownership SMSI — l'auditeur note une lacune de gouvernance en plus.",
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
