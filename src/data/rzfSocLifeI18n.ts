// RZF SOC Life — German-locked text overrides. Any key missing here falls
// back to `de.socLife.*` (see variantContext.tsx).
export const RZF_I18N = {
  metaTitle: "RZF SOC Life — Cyber-Simulation Finanzverwaltung NRW",
  metaDesc: "SOC-Simulator im Rechenzentrum der Finanzverwaltung NRW: Vorfälle in Fachverfahren, Landesnetz und Finanzämtern unter Zeitdruck bewältigen.",
  title: "RZF SOC LIFE",
  subtitle: "Rechenzentrum der Finanzverwaltung NRW. Steuergeheimnis inklusive",
  intro: "Du arbeitest im Security Operations Center des RZF. Hinter dir laufen die Fachverfahren für alle Finanzämter in Nordrhein-Westfalen. Lies die Lage, geh in den richtigen Raum und triff die passende Entscheidung, bevor die Zeit abläuft.",
  incomingIncident: "Eingehender Sicherheitsvorfall",
  rooms: {
    soc_floor:   { name: "SOC-Leitstand",        desc: "Tier-1-Triage für Finanzämter und Fachverfahren. Tickets, Alarme, Hotline." },
    siem:        { name: "SIEM-Konsole",         desc: "Korrelation, Use-Cases, Threat Hunting über Clients, Server und Landesnetz." },
    forensics:   { name: "Forensik-Labor",       desc: "Images, Speicherabbilder, gerichtsfeste Beweissicherung." },
    noc:         { name: "Netzleitstelle",       desc: "Landesnetz-Übergänge, Firewalls, DDoS-Abwehr, VPN der Finanzämter." },
    server_room: { name: "RZ-Halle",             desc: "Racks, Mainframe-nahe Systeme, Backup und Wiederherstellung." },
    war_room:    { name: "Krisenstab",           desc: "Lagebesprechung, Entscheidungen, Abstimmung mit CERT NRW." },
    ciso_office: { name: "ISB-Büro",             desc: "Informationssicherheitsbeauftragte: Eskalation, Meldungen, Ministerium." },
    kitchen:     { name: "Teeküche",             desc: "Kaffee, kurzer Austausch, durchatmen." },
  },
  npcs: {
    junior:   { name: "Jana (Analystin)",          greet: "Im Finanzamt Köln-Mitte meldet ein Client merkwürdige Prozesse …" },
    ir_lead:  { name: "Stefan (IR-Leitung)",       greet: "Größere Lage? Dann sofort in den Krisenstab." },
    ciso:     { name: "Frau Dr. Brandt (ISB)",     greet: "Kurz, präzise, mit Bezug zum Steuergeheimnis bitte." },
    sysadmin: { name: "Hakan (RZ-Betrieb)",        greet: "Die Sicherungen laufen. Bitte nichts ohne Change neu starten." },
  },
  idle: {
    byRoom: {
      soc_floor: {
        threat_intel: { name: "Schichtbuch lesen", result: "Reputation +2" },
        smalltalk:    { name: "Mit Jana über die Hotline sprechen", result: "Stress -8" },
      },
      siem: {
        threat_intel: { name: "Warnmeldungen von CERT NRW und BSI prüfen", result: "Reputation +2" },
        playbook:     { name: "Use-Cases für Fachverfahren nachschärfen", result: "Reputation +3, Stress +5" },
      },
      noc: {
        threat_intel: { name: "Verkehr an den Landesnetz-Übergängen prüfen", result: "Reputation +2" },
      },
      server_room: {
        stretch: { name: "Zwischen den Racks kurz bewegen", result: "Stress -5" },
      },
      war_room: {
        playbook: { name: "Notfallhandbuch durchgehen", result: "Reputation +3, Stress +5" },
      },
      ciso_office: {
        playbook: { name: "Meldewege und Fristen durchgehen", result: "Reputation +3, Stress +5" },
      },
      kitchen: {
        smalltalk: { name: "Mit Hakan über das Patchfenster sprechen", result: "Stress -8" },
      },
    },
  },
};
