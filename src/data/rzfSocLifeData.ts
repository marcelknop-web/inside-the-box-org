// RZF SOC Life — fictional incidents for the Rechenzentrum der
// Finanzverwaltung NRW. German-only content (all three locale slots carry the
// same text). Every option carries an explicit rationale. Scenarios are
// invented training cases, not real events.
import type { Incident, LocaleStr, PlaybookOption, RoomId } from "./socLifeData";

const D = (s: string): LocaleStr => ({ de: s, en: s, fr: s });
const opt = (id: string, correct: boolean, delta: number, label: string, reason: string): PlaybookOption => ({
  id, correct, delta, label: D(label), reason: D(reason),
});
const step = (id: string, room: RoomId, timeLimitMs: number, title: string, prompt: string, options: PlaybookOption[]) => ({
  id, requiredRoom: room, timeLimitMs, title: D(title), prompt: D(prompt), options,
});

const PHISHING: Incident = {
  id: "rzf_phishing_bescheid",
  tier: "easy",
  category: "email",
  title: D("Phishing an Finanzämter"),
  brief: D("Mehrere Finanzämter melden eine Mail „Neues Kennwort für das Fachverfahren erforderlich“ mit Link."),
  initialDelayMs: 12_000,
  steps: [
    step("detect", "siem", 25_000, "Triage", "Was zuerst?", [
      opt("verify", true, 6, "Header und Link prüfen, Empfänger und Klicks im SIEM ermitteln",
        "Erst den Umfang kennen: Wer hat die Mail erhalten, wer hat geklickt? Das bestimmt alle weiteren Schritte."),
      opt("block_only", false, -3, "Absender sofort sperren, Analyse später nachholen",
        "Sperren hilft, aber ohne Analyse fehlen Klickzahlen und weitere Absenderadressen der Kampagne."),
      opt("ignore", false, -6, "Als Spam einstufen, Filter erledigt das",
        "Gezielte Mails an Behörden umgehen oft Filter. Ohne Prüfung bleiben Kontodaten womöglich in Täterhand."),
    ]),
    step("contain", "noc", 25_000, "Eindämmung", "Wie eindämmen?", [
      opt("block_url", true, 6, "Phishing-Domain am Proxy sperren, Mails aus allen Postfächern entfernen",
        "Sperre und Bereinigung zusammen schließen den Angriffsweg für alle Finanzämter."),
      opt("warn_only", false, -3, "Warnung ins Intranet stellen und abwarten",
        "Warnungen allein erreichen nicht alle rechtzeitig. Der Link bleibt erreichbar."),
      opt("shutdown_mail", false, -5, "Den Mailverkehr landesweit abschalten",
        "Unverhältnismäßig: Der Steuerbetrieb steht still, obwohl gezielte Maßnahmen reichen."),
    ]),
    step("follow", "soc_floor", 25_000, "Nachbereitung", "Was passiert mit den Betroffenen?", [
      opt("reset", true, 6, "Kennwörter der Klickenden zurücksetzen, Anmeldungen prüfen",
        "Wer Daten eingegeben hat, gilt als kompromittiert. Zurücksetzen und Anmeldeprotokolle prüfen."),
      opt("blame", false, -5, "Namen der Klickenden an die Amtsleitungen melden",
        "Bloßstellen schreckt vom Melden ab. Die Meldekultur ist ein wichtiger Frühwarnsensor."),
      opt("nothing", false, -3, "Nichts weiter, die Domain ist gesperrt",
        "Erbeutete Kennwörter funktionieren weiter, auch wenn die Phishing-Seite gesperrt ist."),
    ]),
  ],
};

const STEUERGEHEIMNIS: Incident = {
  id: "rzf_insider_abfrage",
  tier: "medium",
  category: "identity",
  title: D("Auffällige Abfragen von Steuerdaten"),
  brief: D("Ein Konto ruft in kurzer Zeit hunderte Steuerakten prominenter Personen ab, ohne Bezug zum eigenen Bezirk."),
  initialDelayMs: 14_000,
  steps: [
    step("verify", "siem", 26_000, "Prüfen", "Wie bewerten?", [
      opt("context", true, 7, "Abrufmuster mit Rolle und Zuständigkeit abgleichen, Protokolle sichern",
        "Erst prüfen, ob es einen dienstlichen Grund gibt. Gesicherte Protokolle sind später Beweismittel."),
      opt("confront", false, -4, "Die Person sofort anrufen und fragen",
        "Warnt eine mögliche Täterin oder einen Täter vor. Spuren können verschwinden."),
      opt("lock_all", false, -3, "Alle Konten der Dienststelle sperren",
        "Trifft viele Unbeteiligte und legt die Dienststelle lahm."),
    ]),
    step("escalate", "ciso_office", 26_000, "Eskalation", "Wen informieren?", [
      opt("isb_personnel", true, 7, "ISB, Datenschutz und Personalstelle einbinden, Vorgehen abstimmen",
        "Eine Verletzung des Steuergeheimnisses (§ 30 AO) hat dienst- und strafrechtliche Folgen. Das braucht abgestimmtes Handeln."),
      opt("press", false, -6, "Pressestelle sofort informieren",
        "Verfrüht. Der Sachverhalt ist noch nicht geklärt und die Ermittlungen würden gefährdet."),
      opt("team_only", false, -4, "Im SOC-Team klären, nicht nach oben melden",
        "Ein Vorfall dieser Art gehört in die vorgesehenen Meldewege. Stilles Klären ist ein Risiko."),
    ]),
    step("act", "forensics", 26_000, "Maßnahme", "Wie weiter?", [
      opt("restrict", true, 6, "Rechte des Kontos einschränken, Beweise gerichtsfest sichern",
        "Weitere Abrufe werden verhindert, und die Beweiskette bleibt sauber."),
      opt("delete_logs", false, -6, "Protokolle bereinigen, um Daten zu schützen",
        "Zerstört Beweise. Protokolle zu Zugriffen auf Steuerdaten sind zu sichern, nicht zu löschen."),
      opt("wait", false, -3, "Weiter beobachten, um mehr Belege zu sammeln",
        "Jeder weitere Abruf ist eine weitere Verletzung. Einschränken und Sichern gehen vor."),
    ]),
  ],
};

const RANSOMWARE: Incident = {
  id: "rzf_ransomware_finanzamt",
  tier: "hard",
  category: "endpoint",
  title: D("Verschlüsselung in einem Finanzamt"),
  brief: D("Das EDR meldet Massenumbenennungen auf Netzlaufwerken eines Finanzamts. Erste Clients zeigen eine Lösegeldnachricht."),
  initialDelayMs: 16_000,
  steps: [
    step("isolate", "soc_floor", 22_000, "Sofortmaßnahme", "Was zuerst?", [
      opt("isolate", true, 8, "Betroffene Clients per EDR isolieren, Standort-Netz vom RZ trennen",
        "Schnelle Isolation stoppt die Ausbreitung ins Rechenzentrum und in andere Finanzämter."),
      opt("reboot", false, -5, "Alle Clients neu starten lassen",
        "Neustart vernichtet Spuren im Arbeitsspeicher und stoppt die Verschlüsselung nicht zuverlässig."),
      opt("ticket", false, -6, "Ticket an den Vor-Ort-Support geben",
        "Zu langsam. Ransomware breitet sich in Minuten aus."),
    ]),
    step("crisis", "war_room", 24_000, "Krisenstab", "Wie organisieren?", [
      opt("convene", true, 8, "Krisenstab einberufen, CERT NRW beteiligen, Lagebild führen",
        "Ein großer Vorfall braucht klare Führung und die Landesstellen. Ein gemeinsames Lagebild verhindert Doppelarbeit."),
      opt("solo", false, -4, "Erst selbst lösen, dann berichten",
        "Verzögert Entscheidungen und Meldungen, die Fristen haben."),
      opt("pay", false, -8, "Kontakt zu den Erpressern aufnehmen",
        "Die öffentliche Verwaltung verhandelt nicht. Zahlungen finanzieren weitere Angriffe."),
    ]),
    step("restore", "server_room", 24_000, "Wiederherstellung", "Wie zurück zum Betrieb?", [
      opt("clean_restore", true, 8, "Saubere Sicherungen prüfen, Systeme neu aufsetzen, schrittweise zurückholen",
        "Erst wenn Sicherungen frei von Schadcode sind, ist eine Rückkehr ohne Wiederbefall möglich."),
      opt("fast_restore", false, -4, "Neueste Sicherung sofort einspielen",
        "Die neueste Sicherung kann den Schadcode bereits enthalten."),
      opt("decryptor", false, -3, "Einen Entschlüsseler aus dem Internet testen",
        "Ungeprüfte Tools können Daten endgültig zerstören oder selbst Schadcode sein."),
    ]),
  ],
};

const DDOS: Incident = {
  id: "rzf_ddos_portal",
  tier: "medium",
  category: "network",
  title: D("Überlastung am Landesnetz-Übergang"),
  brief: D("Kurz vor Ende der Abgabefrist bricht die Erreichbarkeit der Online-Dienste ein. Der Datenverkehr steigt stark an."),
  initialDelayMs: 14_000,
  steps: [
    step("analyse", "noc", 24_000, "Analyse", "Was ist los?", [
      opt("traffic", true, 7, "Verkehrsmuster auswerten: echte Nutzer oder Angriff?",
        "Fristende erzeugt echte Spitzen. Nur die Analyse trennt Ansturm von Angriff."),
      opt("assume_attack", false, -3, "Sofort von Angriff ausgehen und Länder sperren",
        "Sperrt womöglich echte Steuerpflichtige aus, etwa Menschen im Ausland."),
      opt("restart_fw", false, -5, "Firewalls neu starten",
        "Kurzer Totalausfall, ohne die Ursache zu beheben."),
    ]),
    step("mitigate", "noc", 24_000, "Abwehr", "Wie gegensteuern?", [
      opt("scrubbing", true, 7, "DDoS-Schutz des Netzbetreibers aktivieren, Raten begrenzen",
        "Filtern vor dem eigenen Netz hält den Dienst für echte Nutzer erreichbar."),
      opt("offline", false, -5, "Online-Dienste ganz abschalten",
        "Damit erreicht der Angreifer sein Ziel."),
      opt("more_servers", false, -2, "Nur zusätzliche Server hochfahren",
        "Hilft kaum gegen massenhaften Verkehr am Netzübergang."),
    ]),
    step("communicate", "ciso_office", 24_000, "Kommunikation", "Was nach außen?", [
      opt("deadline", true, 6, "Ministerium informieren, Hinweis zu Fristen veröffentlichen lassen",
        "Steuerpflichtige brauchen Klarheit, ob Fristen gelten. Diese Entscheidung trifft nicht das SOC allein."),
      opt("silent", false, -4, "Nichts sagen, es ist bald vorbei",
        "Unklarheit erzeugt Anrufe, Beschwerden und Misstrauen."),
      opt("blame", false, -4, "Einen Staat als Täter öffentlich nennen",
        "Zuschreibung ohne Belege schadet der Glaubwürdigkeit."),
    ]),
  ],
};

const VPN_VULN: Incident = {
  id: "rzf_vpn_schwachstelle",
  tier: "medium",
  category: "vuln",
  title: D("Kritische Lücke im VPN-Gateway"),
  brief: D("Das BSI warnt vor einer aktiv ausgenutzten Schwachstelle im VPN-Produkt, über das Telearbeit in den Finanzämtern läuft."),
  initialDelayMs: 14_000,
  steps: [
    step("exposure", "siem", 26_000, "Betroffenheit", "Was zuerst?", [
      opt("check", true, 7, "Version prüfen und Protokolle nach bekannten Angriffsspuren durchsuchen",
        "Erst klären, ob man betroffen ist und ob schon jemand eingedrungen ist."),
      opt("wait_patch", false, -4, "Auf das reguläre Patchfenster warten",
        "Bei aktiver Ausnutzung ist das zu spät."),
      opt("ignore", false, -6, "Unser Gateway ist intern, also kein Thema",
        "VPN-Gateways stehen per Definition am Internet."),
    ]),
    step("patch", "server_room", 26_000, "Absicherung", "Wie absichern?", [
      opt("emergency", true, 7, "Notfall-Change: Patch einspielen, vorher Konfiguration sichern",
        "Schnell, aber kontrolliert. Die Sicherung erlaubt die Rückkehr bei Problemen."),
      opt("untested", false, -3, "Patch sofort ohne Sicherung auf alle Gateways",
        "Ein fehlerhafter Patch kann die gesamte Telearbeit lahmlegen."),
      opt("disable_vpn", false, -4, "VPN dauerhaft abschalten",
        "Sicher, aber tausende Beschäftigte können nicht arbeiten."),
    ]),
    step("hunt", "forensics", 26_000, "Nachsorge", "Und danach?", [
      opt("hunt", true, 6, "Nach Hintertüren suchen, Zugangsdaten der VPN-Konten erneuern",
        "Ein Patch schließt die Lücke, entfernt aber keine bereits eingerichteten Zugänge."),
      opt("done", false, -4, "Gepatcht ist gepatcht, Ticket schließen",
        "Angreifer, die vorher drin waren, bleiben drin."),
      opt("rebuild_all", false, -2, "Das gesamte Netz neu aufbauen",
        "Ohne konkrete Hinweise unverhältnismäßig."),
    ]),
  ],
};

const SUPPLY_CHAIN: Incident = {
  id: "rzf_lieferkette_update",
  tier: "hard",
  category: "vuln",
  title: D("Verdächtiges Update eines Dienstleisters"),
  brief: D("Nach einem Software-Update eines externen Dienstleisters baut ein Server Verbindungen zu einer unbekannten Adresse auf."),
  initialDelayMs: 16_000,
  steps: [
    step("confirm", "siem", 24_000, "Erkennen", "Wie bewerten?", [
      opt("ioc", true, 8, "Ziel-Adresse und Update-Paket prüfen, betroffene Server ermitteln",
        "Klärt, ob das Update manipuliert ist und wie weit es verteilt wurde."),
      opt("trust", false, -5, "Dienstleister ist vertrauenswürdig, also Fehlalarm",
        "Lieferketten-Angriffe nutzen genau dieses Vertrauen aus."),
      opt("uninstall", false, -3, "Update überall sofort entfernen",
        "Entfernen ohne Analyse vernichtet Spuren und klärt nicht, was schon passiert ist."),
    ]),
    step("contain", "noc", 24_000, "Eindämmen", "Wie eindämmen?", [
      opt("block_c2", true, 8, "Verbindung zur Adresse sperren, Server in Quarantänenetz verschieben",
        "Unterbricht die Steuerung durch Angreifer, ohne Beweise zu verlieren."),
      opt("shutdown", false, -4, "Alle Server des Fachverfahrens herunterfahren",
        "Stoppt den Steuerbetrieb und löscht flüchtige Spuren."),
      opt("monitor", false, -4, "Nur beobachten, was weiter passiert",
        "Daten könnten in dieser Zeit abfließen."),
    ]),
    step("report", "war_room", 24_000, "Melden", "Wen informieren?", [
      opt("report", true, 7, "Krisenstab, CERT NRW und Dienstleister einbinden, Meldungen vorbereiten",
        "Andere Behörden nutzen womöglich dasselbe Update. Frühe Meldung schützt alle."),
      opt("vendor_only", false, -3, "Nur den Dienstleister anschreiben",
        "Die Landesstellen bleiben ahnungslos, obwohl andere betroffen sein können."),
      opt("later", false, -5, "Erst melden, wenn alles geklärt ist",
        "Meldepflichten haben Fristen. Unvollständige Erstmeldungen sind üblich und erwünscht."),
    ]),
  ],
};

const USB: Incident = {
  id: "rzf_usb_fund",
  tier: "easy",
  category: "endpoint",
  title: D("USB-Stick im Besucherbereich"),
  brief: D("Ein Beschäftigter hat einen gefundenen USB-Stick mit der Aufschrift „Gehälter 2026“ an seinen Rechner gesteckt."),
  initialDelayMs: 12_000,
  steps: [
    step("check", "soc_floor", 25_000, "Prüfen", "Was zuerst?", [
      opt("edr", true, 6, "Client im EDR prüfen, Gerät vom Netz nehmen lassen",
        "Klärt schnell, ob Schadcode gestartet wurde, und verhindert die Ausbreitung."),
      opt("ok", false, -4, "Kein Alarm im Virenscanner, also alles gut",
        "Gezielte Schadsoftware wird oft nicht erkannt."),
      opt("open", false, -5, "Stick selbst einstecken und ansehen",
        "Damit ist der nächste Rechner betroffen."),
    ]),
    step("analyse", "forensics", 25_000, "Analyse", "Was tun mit dem Stick?", [
      opt("lab", true, 6, "Stick im isolierten Labor untersuchen",
        "Sicher und aufschlussreich: Was sollte der Stick tun?"),
      opt("bin", false, -2, "Stick wegwerfen",
        "Beweis und Erkenntnisse gehen verloren."),
      opt("return", false, -3, "Stick am Empfang abgeben",
        "Das Risiko wandert nur weiter."),
    ]),
    step("learn", "kitchen", 25_000, "Lernen", "Wie mit dem Beschäftigten umgehen?", [
      opt("thank", true, 5, "Für die Meldung danken, Hinweis an alle Dienststellen",
        "Wer meldet, hilft. Ein freundlicher Umgang stärkt die Meldekultur."),
      opt("punish", false, -4, "Abmahnung vorschlagen",
        "Führt dazu, dass beim nächsten Mal nichts gemeldet wird."),
      opt("ignore", false, -2, "Nicht weiter ansprechen",
        "Eine Chance zur Sensibilisierung bleibt ungenutzt."),
    ]),
  ],
};

const AUDIT: Incident = {
  id: "rzf_besuch_pruefung",
  tier: "comic",
  category: "governance",
  title: D("Besuch vom Landesrechnungshof"),
  brief: D("Unangekündigt steht eine Prüfgruppe im Leitstand und möchte „mal eben“ das Notfallkonzept sehen."),
  initialDelayMs: 12_000,
  steps: [
    step("greet", "ciso_office", 28_000, "Empfang", "Wie reagieren?", [
      opt("isb", true, 5, "Die ISB holen und die Unterlagen geordnet vorlegen",
        "Prüfungen laufen über die Verantwortlichen. Geordnete Unterlagen sprechen für sich."),
      opt("hide", false, -4, "Schnell den Leitstand aufräumen und Bildschirme abschalten",
        "Wirkt, als gäbe es etwas zu verbergen."),
      opt("monitor", false, -3, "Prüfer an die SIEM-Konsole setzen",
        "Ungeplant Einblick in Live-Daten zu geben, verletzt das Need-to-know-Prinzip."),
    ]),
    step("question", "war_room", 28_000, "Nachfrage", "„Wann wurde der Notfallplan zuletzt geübt?“", [
      opt("evidence", true, 5, "Übungsprotokoll mit Datum und Ergebnissen zeigen",
        "Belege statt Beteuerungen."),
      opt("guess", false, -3, "„Irgendwann letztes Jahr, glaube ich“",
        "Unsicherheit wird zum Prüfbefund."),
      opt("joke", false, -2, "„Jeden Tag, so wie heute“",
        "Humor ersetzt keinen Nachweis."),
    ]),
  ],
};

export const RZF_INCIDENTS: Incident[] = [
  PHISHING, USB, STEUERGEHEIMNIS, DDOS, VPN_VULN, AUDIT, RANSOMWARE, SUPPLY_CHAIN,
];

export const RZF_COMIC_INCIDENT_IDS = new Set<string>([AUDIT.id]);
