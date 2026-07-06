import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Syndicate — lightweight self-contained i18n (EN / DE)              */
/*  String-keyed: tr("English source") → German (or English fallback).*/
/* ------------------------------------------------------------------ */

export type SynLang = "en" | "de";

const STORAGE_KEY = "syndicate_lang";

let current: SynLang =
  (typeof localStorage !== "undefined" &&
    (localStorage.getItem(STORAGE_KEY) as SynLang)) || "en";

const listeners = new Set<() => void>();

export function getSynLang(): SynLang {
  return current;
}

export function setSynLang(lang: SynLang) {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Hook — subscribes the component so it re-renders when the language changes. */
export function useSynLang() {
  const lang = useSyncExternalStore(subscribe, getSynLang, getSynLang);
  return { lang, setLang: setSynLang, tr };
}

/** Translate an English source string to the current language.
 *  Optionally pass an explicit English fallback for short keys. */
export function tr(s?: string | null, enFallback?: string): string {
  if (s == null) return "";
  if (current === "en") return enFallback ?? s;
  return DE[s] ?? enFallback ?? s;
}

/* ------------------------------------------------------------------ */
/*  German dictionary                                                  */
/* ------------------------------------------------------------------ */

const DE: Record<string, string> = {
  /* --- risk / outcome labels --- */
  Low: "Niedrig",
  Medium: "Mittel",
  High: "Hoch",
  "Very High": "Sehr hoch",
  Safe: "Sicher",
  Success: "Erfolg",
  "Big Success": "Großer Erfolg",
  Bonus: "Bonus",
  Investigation: "Ermittlung",
  Caught: "Erwischt",

  /* --- operation descriptions --- */
  "Rent a ready-made phishing kit and harvest logins at scale.":
    "Miete ein fertiges Phishing-Kit und sammle Logins in großem Stil.",
  "Spread stealer malware to siphon passwords, cookies and wallets.":
    "Verbreite Stealer-Malware, um Passwörter, Cookies und Wallets abzugreifen.",
  "Inject card-skimming code into online checkout pages.":
    "Schleuse Card-Skimming-Code in Online-Bezahlseiten ein.",
  "AI-cloned voices and faces drain a victim's savings.":
    "KI-geklonte Stimmen und Gesichter räumen die Ersparnisse eines Opfers ab.",
  "Spin up counterfeit storefronts that take orders and vanish.":
    "Starte gefälschte Onlineshops, die Bestellungen annehmen und verschwinden.",
  "Encrypt a company's network and negotiate the payout.":
    "Verschlüssle das Netzwerk einer Firma und verhandle das Lösegeld.",
  "Launch a hyped token, drain the liquidity pool, disappear.":
    "Bring einen gehypten Token heraus, leere den Liquiditätspool, verschwinde.",
  "Run a hidden Tor bazaar and skim a fee off every deal.":
    "Betreibe einen versteckten Tor-Basar und kassiere bei jedem Deal mit.",
  "Buy stolen VPN and admin access, then resell to the highest bidder.":
    "Kaufe gestohlene VPN- und Admin-Zugänge und verkaufe sie an den Höchstbietenden.",
  "Sell one unpatched exploit to the highest bidder — no second chance.":
    "Verkaufe einen ungepatchten Exploit an den Höchstbietenden — keine zweite Chance.",
  "Tumble stolen funds through mixers and shell wallets.":
    "Wasche gestohlene Gelder durch Mixer und Briefkasten-Wallets.",
  "Poison a trusted software update and breach thousands at once.":
    "Vergifte ein vertrauenswürdiges Software-Update und kompromittiere Tausende auf einmal.",

  /* --- AI profiles --- */
  "A patient operator. Low-and-slow campaigns, minimal footprint.":
    "Ein geduldiger Akteur. Leise Kampagnen, minimale Spuren.",
  "Lives for the big exploit. High risk, high reward.":
    "Lebt für den großen Exploit. Hohes Risiko, hohe Belohnung.",
  "OPSEC discipline — detection risk trimmed.":
    "OPSEC-Disziplin — geringeres Entdeckungsrisiko.",
  "Zero-day rush — +20% payout on high-risk wins.":
    "Zero-Day-Rausch — +20 % Auszahlung bei riskanten Gewinnen.",

  /* --- quips --- */
  "Slow profits are still profits.": "Langsame Gewinne sind auch Gewinne.",
  "Patience pays. Always.": "Geduld zahlt sich aus. Immer.",
  "No need to be a hero.": "Kein Grund, den Helden zu spielen.",
  "Steady hands, full pockets.": "Ruhige Hände, volle Taschen.",
  "Risk is just another investment.": "Risiko ist nur eine weitere Investition.",
  "Fortune loves a gambler.": "Das Glück liebt den Zocker.",
  "Go big or go home.": "Ganz oder gar nicht.",
  "Safety is for the poor.": "Sicherheit ist etwas für die Armen.",
  "Fortune favors the bold.": "Das Glück ist mit den Mutigen.",
  "More. Always more.": "Mehr. Immer mehr.",
  "I want it all.": "Ich will alles.",
  "Greed never sleeps.": "Gier schläft nie.",
  "Adjusting strategy…": "Passe Strategie an…",
  "Reading the board.": "Lese das Spielfeld.",
  "Every move is calculated.": "Jeder Zug ist berechnet.",
  "I adapt. You don't.": "Ich passe mich an. Du nicht.",
  "Oops. Let's do something stupid.": "Ups. Machen wir was Dummes.",
  "Chaos is a ladder.": "Chaos ist eine Leiter.",
  "Who needs a plan?": "Wer braucht schon einen Plan?",
  "Let's see what breaks.": "Mal sehen, was kaputtgeht.",

  /* --- global events --- */
  "Interpol Joint Operation": "Interpol-Gemeinschaftsaktion",
  "Cross-border task forces coordinate takedowns. Detection risk rises.":
    "Grenzüberschreitende Einsatzkräfte koordinieren Zerschlagungen. Das Entdeckungsrisiko steigt.",
  "SOC Analyst Shortage": "SOC-Analysten-Mangel",
  "Blue teams are understaffed and burned out. Detection risk drops.":
    "Blue Teams sind unterbesetzt und ausgebrannt. Das Entdeckungsrisiko sinkt.",
  "Crypto Bull Run": "Krypto-Bullenmarkt",
  "Token prices surge. Every cash-out pays more.":
    "Token-Preise steigen. Jede Auszahlung bringt mehr.",
  "Crypto Market Crash": "Krypto-Marktcrash",
  "Markets bleed out. Big operations pay far less.":
    "Die Märkte bluten aus. Große Operationen bringen deutlich weniger.",
  "Viral News Cycle": "Virale Nachrichtenwelle",
  "The press chases a scandal elsewhere. Investigations ease.":
    "Die Presse jagt einen Skandal woanders. Die Ermittlungen lassen nach.",
  "Mega Breach Dump": "Mega-Datenleck",
  "Billions of records leak overnight. Investigators drown in the noise.":
    "Milliarden Datensätze werden über Nacht geleakt. Ermittler ertrinken im Rauschen.",
  "Global Cybersecurity Summit": "Globaler Cybersecurity-Gipfel",
  "Nations unite on threat intel. International cooperation surges.":
    "Nationen bündeln ihre Bedrohungsdaten. Die internationale Zusammenarbeit steigt sprunghaft.",
  "Exploit Market Boom": "Exploit-Markt-Boom",
  "Demand for zero-days spikes. Every score pays a premium.":
    "Die Nachfrage nach Zero-Days steigt. Jeder Coup zahlt einen Aufschlag.",
  "Insider Informant": "Insider-Informant",
  "A snitch feeds the authorities. Everyone is being watched.":
    "Ein Spitzel versorgt die Behörden. Alle werden beobachtet.",
  "Critical Infrastructure Outage": "Ausfall kritischer Infrastruktur",
  "The grid fails. Chaos masks your moves — for now.":
    "Das Stromnetz fällt aus. Das Chaos verschleiert deine Züge — vorerst.",

  /* --- event long details --- */
  "Interpol has spun up a cross-border task force. Shared intel and synchronized raids mean any operation is far likelier to be traced.":
    "Interpol hat eine grenzüberschreitende Einsatzgruppe aufgestellt. Geteilte Erkenntnisse und koordinierte Razzien machen jede Operation deutlich leichter nachverfolgbar.",
  "Blue teams are gutted by layoffs and burnout. Alerts pile up unread, so intrusions slip past overwhelmed defenders.":
    "Blue Teams sind durch Entlassungen und Burnout geschwächt. Warnmeldungen stapeln sich ungelesen, sodass Angriffe an überforderten Verteidigern vorbeiziehen.",
  "A crypto bull run is inflating token prices. Every laundered cash-out converts to more real value while the market runs hot.":
    "Ein Krypto-Bullenmarkt treibt die Token-Preise hoch. Jede gewaschene Auszahlung bringt mehr echten Wert, solange der Markt heiß läuft.",
  "Markets are in freefall. Liquidations and frozen exchanges mean large scores fetch a fraction of their usual value.":
    "Die Märkte sind im freien Fall. Liquidationen und eingefrorene Börsen bedeuten, dass große Coups nur einen Bruchteil ihres üblichen Werts einbringen.",
  "A rival scandal is dominating the news cycle. Investigators are pulled onto the story, easing pressure and lifting payouts slightly.":
    "Ein rivalisierender Skandal beherrscht die Schlagzeilen. Ermittler werden abgezogen, was den Druck senkt und die Auszahlungen leicht anhebt.",
  "A mega breach dumped billions of records overnight. Analysts are drowning in noise, so your moves hide in the flood.":
    "Ein Mega-Datenleck hat über Nacht Milliarden Datensätze veröffentlicht. Analysten ertrinken im Rauschen, sodass deine Züge in der Flut untergehen.",
  "A global cybersecurity summit has nations sharing live threat intel. Coordination is at an all-time high and detection spikes.":
    "Ein globaler Cybersecurity-Gipfel lässt Nationen Live-Bedrohungsdaten teilen. Die Koordination ist auf Rekordniveau und die Entdeckung steigt stark.",
  "Demand for zero-days is surging on exploit markets. Buyers are paying a premium, so every successful score pays extra.":
    "Die Nachfrage nach Zero-Days steigt auf Exploit-Märkten. Käufer zahlen Aufschläge, sodass jeder erfolgreiche Coup extra einbringt.",
  "An insider is feeding the authorities. Everyone is under surveillance and detection risk climbs across the board.":
    "Ein Insider versorgt die Behörden. Alle stehen unter Beobachtung und das Entdeckungsrisiko steigt überall.",




  /* --- sectors --- */
  "Industrial robotics": "Industrierobotik",
  "Private banking": "Private Banking",
  Resources: "Rohstoffe",
  "Cloud infrastructure": "Cloud-Infrastruktur",
  "Energy grid": "Energienetz",
  "Sovereign fund": "Staatsfonds",
  Agritech: "Agrartechnik",
  Pharmaceuticals: "Pharma",
  "Payment rails": "Zahlungsverkehr",
  Fintech: "Fintech",
  Telecom: "Telekommunikation",
  Freight: "Fracht",
  "Chip fab": "Chip-Fabrik",
  Automotive: "Automobil",
  "Trading house": "Handelshaus",
  Healthcare: "Gesundheitswesen",
  Commodities: "Rohstoffe",
  "Water utility": "Wasserversorger",
  "Bullion vault": "Edelmetalltresor",
  Renewables: "Erneuerbare Energien",
  Insurance: "Versicherung",
  Maritime: "Maritim",
  "E-commerce": "E-Commerce",
  Gaming: "Glücksspiel",
  "Mobile money": "Mobile Payment",
  Securities: "Wertpapiere",
  "Defence tech": "Verteidigungstechnik",
  "Power grid": "Stromnetz",
  Payments: "Zahlungen",
  Colocation: "Colocation",

  /* --- target company descriptions --- */
  "Factory automation giant with fragile OT networks.":
    "Automatisierungsriese mit fragilen OT-Netzwerken.",
  "Offshore wealth vault holding elite client funds.":
    "Offshore-Vermögenstresor mit Geldern von Elite-Kunden.",
  "Ore conglomerate running legacy control systems.":
    "Erz-Konzern mit veralteten Steuerungssystemen.",
  "Hyperscaler hosting half the startup economy.":
    "Hyperscaler, der die halbe Startup-Wirtschaft hostet.",
  "Utility operator wired into the national grid.":
    "Versorger, verdrahtet mit dem nationalen Stromnetz.",
  "Petro-cash sovereign fund with thin security.":
    "Petro-Staatsfonds mit dünner Absicherung.",
  "Continental food supplier with exposed logistics.":
    "Kontinentaler Lebensmittellieferant mit offener Logistik.",
  "Drug maker guarding priceless research IP.":
    "Pharmahersteller, der unbezahlbares Forschungs-IP hütet.",
  "Card processor clearing millions of transactions an hour.":
    "Kartenabwickler, der Millionen Transaktionen pro Stunde verarbeitet.",
  "Neobank with a sprawling, under-patched API surface.":
    "Neobank mit weitläufiger, schlecht gepatchter API-Oberfläche.",
  "Carrier routing traffic for half the continent.":
    "Netzbetreiber, der den Verkehr des halben Kontinents leitet.",
  "Rail and port operator on brittle SCADA gear.":
    "Bahn- und Hafenbetreiber mit brüchiger SCADA-Technik.",
  "Foundry hoarding bleeding-edge lithography secrets.":
    "Chipfabrik, die modernste Lithografie-Geheimnisse hortet.",
  "EV maker with connected cars phoning home.":
    "E-Auto-Hersteller mit vernetzten Fahrzeugen, die nach Hause funken.",
  "Commodities broker moving billions in the dark.":
    "Rohstoffhändler, der Milliarden im Verborgenen bewegt.",
  "Hospital chain guarding millions of patient records.":
    "Krankenhauskette, die Millionen Patientenakten hütet.",
  "Grain exporter with wide-open supplier portals.":
    "Getreideexporteur mit weit offenen Lieferantenportalen.",
  "Public utility running decades-old control systems.":
    "Öffentlicher Versorger mit jahrzehntealten Steuerungssystemen.",
  "Gold depository with paper-thin access controls.":
    "Goldlager mit hauchdünnen Zugangskontrollen.",
  "Wind operator remotely managing hundreds of turbines.":
    "Windbetreiber, der Hunderte Turbinen fernsteuert.",
  "Insurer sitting on a lake of unencrypted claims data.":
    "Versicherer auf einem See unverschlüsselter Schadensdaten.",
  "Smart-port operator steering automated container cranes.":
    "Smart-Port-Betreiber, der automatisierte Containerkräne steuert.",
  "Retail titan with a leaky loyalty database.":
    "Handelsriese mit einer undichten Kundenbindungs-Datenbank.",
  "Casino resort laundering cash through weak systems.":
    "Casino-Resort, das Geld über schwache Systeme wäscht.",
  "Wallet provider banking tens of millions of users.":
    "Wallet-Anbieter für zig Millionen Nutzer.",
  "Central clearinghouse for European stock trades.":
    "Zentrale Clearingstelle für europäische Aktiengeschäfte.",
  "Contractor holding classified sensor blueprints.":
    "Auftragnehmer mit geheimen Sensor-Bauplänen.",
  "Grid operator balancing load across three provinces.":
    "Netzbetreiber, der die Last über drei Provinzen ausgleicht.",
  "Super-app wallet with reused admin credentials.":
    "Super-App-Wallet mit wiederverwendeten Admin-Zugangsdaten.",
  "Arctic data halls hosting sensitive government tenants.":
    "Arktische Rechenzentren mit sensiblen Regierungskunden.",

  /* --- tutorial tips --- */
  "Welcome, boss": "Willkommen, Boss",
  "Outlast 2 rival crews across up to 12 rounds. Each round you run one operation for cash — the richest crew still standing at the end wins. I'll walk you through the first moves.":
    "Überlebe 2 rivalisierende Crews über bis zu 12 Runden. Jede Runde führst du eine Operation für Geld aus — die reichste Crew, die am Ende noch steht, gewinnt. Ich führe dich durch die ersten Züge.",
  "Pick an operation": "Wähle eine Operation",
  "Every card shows its COST (what you pay), PAYOUT (what you can earn) and CAUGHT % (odds of getting busted). The colored badge is the risk tier — green is safe, purple is a gamble. Tap a card to select it.":
    "Jede Karte zeigt KOSTEN (was du zahlst), AUSZAHLUNG (was du verdienen kannst) und ERWISCHT % (Risiko, aufzufliegen). Das farbige Abzeichen ist die Risikostufe — grün ist sicher, lila ist ein Wagnis. Tippe eine Karte an, um sie zu wählen.",
  "Spin the wheel": "Dreh das Rad",
  "The wheel decides your fate. Most slices pay out — but land on a Caught slice and you burn a token. Lose all your tokens and you're eliminated. Hit SPIN when you're ready.":
    "Das Rad entscheidet dein Schicksal. Die meisten Felder zahlen aus — doch landest du auf einem Erwischt-Feld, verbrennst du einen Token. Verlierst du alle Tokens, bist du ausgeschieden. Drücke DREHEN, wenn du bereit bist.",
  "Your result": "Dein Ergebnis",
  "This is how the operation played out and how your fortune changed. High-risk jobs swing hard both ways — manage your tokens and don't overreach.":
    "So ist die Operation ausgegangen und so hat sich dein Vermögen verändert. Riskante Jobs schlagen in beide Richtungen stark aus — verwalte deine Tokens und übernimm dich nicht.",
  "The standings": "Die Rangliste",
  "See where you rank against the rival crews after each round. Stay alive and keep your fortune on top. That's the whole game — good luck, boss.":
    "Sieh, wo du nach jeder Runde gegen die rivalisierenden Crews stehst. Bleib am Leben und halte dein Vermögen an der Spitze. Das ist das ganze Spiel — viel Glück, Boss.",

  /* --- wheel legend --- */
  "Job pays off — solid profit on your stake.":
    "Der Job zahlt sich aus — solider Gewinn auf deinen Einsatz.",
  "Jackpot — the biggest payout on the wheel.":
    "Jackpot — die größte Auszahlung auf dem Rad.",
  "Windfall — extra cash on top of the job.":
    "Geldsegen — extra Bargeld zusätzlich zum Job.",
  "No harm done — you break even, keep your stake.":
    "Kein Schaden — du machst plus/minus null und behältst deinen Einsatz.",
  "Heat rises — a small loss, but no token burned.":
    "Die Hitze steigt — ein kleiner Verlust, aber kein Token verbrannt.",
  "Busted — you burn a shield token. Out at zero.":
    "Aufgeflogen — du verbrennst einen Schild-Token. Bei null bist du raus.",
  "WHAT THE SLICES MEAN": "WAS DIE FELDER BEDEUTEN",

  /* --- generic UI --- */
  "Got it": "Verstanden",
  "Skip guide": "Anleitung überspringen",
  Close: "Schließen",
  STATISTICS: "STATISTIKEN",
  "Hall of Fame": "Ruhmeshalle",
  "Games played": "Gespielte Spiele",
  "Games won": "Gewonnene Spiele",
  "Win rate": "Siegquote",
  "Highest fortune": "Höchstes Vermögen",
  "Largest single payout": "Größte Einzelauszahlung",
  "Longest survival": "Längstes Überleben",
  "Closest escape": "Knappste Flucht",
  "Most-used operation": "Meistgenutzte Operation",
  "Highest Fortune Ever": "Höchstes Vermögen aller Zeiten",
  "Longest Win Streak": "Längste Siegesserie",
  "Luckiest Run": "Glücklichster Lauf",
  "Biggest Single Win": "Größter Einzelgewinn",
  "Fastest Victory": "Schnellster Sieg",
  "Most Eliminations Survived": "Meiste überlebte Ausscheidungen",
  Unmute: "Ton an",
  Mute: "Stummschalten",
  Fullscreen: "Vollbild",
  "Exit fullscreen": "Vollbild verlassen",
  "How to play": "Spielanleitung",
  "Hide guide": "Anleitung ausblenden",
  "YOUR COACH": "DEIN COACH",
  "System Initialization Sequence": "System-Initialisierungssequenz",
  "Strategic Command & Corporate Dominance":
    "Strategisches Kommando & Unternehmensdominanz",
  "Operator Alias": "Operator-Alias",
  "ENTER IDENTIFIER...": "KENNUNG EINGEBEN...",
  "Establish Connection": "Verbindung herstellen",
  "Server: Node_01_Online": "Server: Node_01_Online",
  "Meet the Syndicate": "Triff das Syndikat",
  "THE PLAYERS": "DIE SPIELER",
  "Three operators enter. One empire remains.":
    "Drei Operatoren treten an. Ein Imperium bleibt.",
  "You — the newcomer": "Du — der Neuling",
  "An ambitious upstart with everything to prove. Your move first.":
    "Ein ehrgeiziger Aufsteiger, der alles beweisen will. Du bist zuerst dran.",
  "ENTER THE GAME": "DAS SPIEL BETRETEN",
  "Active Crews": "Aktive Crews",
  "Financial Assets": "Finanzwerte",
  Shields: "Schilde",
  "Uplink Stable": "Uplink stabil",
  "Intercepting rival comms · tactical analysis pending":
    "Abfangen von Rivalen-Kommunikation · taktische Analyse ausstehend",
  Round: "Runde",
  "Target location": "Zielort",
  "Deploying payload…": "Payload wird eingesetzt…",
  "Target acquired": "Ziel erfasst",
  "Spinning…": "Dreht…",
  "No Global Event": "Kein globales Ereignis",
  "All Quiet": "Alles ruhig",
  "The streets are calm. Standard odds apply this round.":
    "Die Straßen sind ruhig. Diese Runde gelten Standardchancen.",
  "CHOOSE OPERATION": "OPERATION WÄHLEN",
  COST: "KOSTEN",
  PAYOUT: "AUSZAHLUNG",
  "CAUGHT %": "ERWISCHT %",
  "SPIN THE WHEEL": "DREH DAS RAD",
  "RUNNING OPERATION": "LAUFENDE OPERATION",
  "OPERATION RESULT": "OPERATIONSERGEBNIS",
  "That was close…": "Das war knapp…",
  "Lucky escape!": "Glück gehabt!",
  "Detection risk": "Entdeckungsrisiko",
  Detection: "Entdeckung",
  Profit: "Profit",
  "No change": "Keine Änderung",
  "Hide briefing": "Briefing ausblenden",
  "Event details": "Ereignisdetails",
  "Why it's happening": "Warum es passiert",
  "Exact impact this round": "Genaue Auswirkung diese Runde",
  "Applied to every operation's caught chance.":
    "Gilt für die Erwischt-Chance jeder Operation.",
  "Applied to winning payouts.": "Gilt für gewinnende Auszahlungen.",
  "Victim company": "Opferfirma",
  "LEADERBOARD": "RANGLISTE",
  Out: "Raus",
  "SEE RESULTS →": "ERGEBNISSE ANSEHEN →",
  "NEXT ROUND →": "NÄCHSTE RUNDE →",
  "RIVALS' TURN →": "RIVALEN SIND DRAN →",
  "SEE THE FALLOUT →": "DIE FOLGEN ANSEHEN →",
  "SEE LEADERBOARD →": "RANGLISTE ANSEHEN →",
  "NEXT RIVAL →": "NÄCHSTER RIVALE →",
  "skip all →": "alle überspringen →",
  "Skip →": "Überspringen →",
  "Caught — Shield Lost": "Erwischt — Schild verloren",
  "The wheel is deciding this rival's fate…":
    "Das Rad entscheidet über das Schicksal dieses Rivalen…",
  "This rival has locked in their operation. Read it, then spin their wheel to see how it plays out.":
    "Dieser Rivale hat seine Operation festgelegt. Lies sie, dann dreh sein Rad, um zu sehen, wie es ausgeht.",
  "Here's their result. Tap continue to move on to the next rival.":
    "Hier ist sein Ergebnis. Tippe auf Weiter, um zum nächsten Rivalen zu gelangen.",
  "The round is over. You're ranked by cash — gold row is you, shields show lives left. Goal: be the richest crew still standing. Tap NEXT ROUND to keep going.":
    "Die Runde ist vorbei. Du wirst nach Vermögen sortiert — die goldene Zeile bist du, Schilde zeigen verbleibende Leben. Ziel: die reichste noch stehende Crew sein. Tippe auf NÄCHSTE RUNDE, um weiterzumachen.",
  "Every round starts here. The streets are calm right now. Tap CHOOSE OPERATION to see the jobs you can run.":
    "Jede Runde beginnt hier. Die Straßen sind gerade ruhig. Tippe auf OPERATION WÄHLEN, um die verfügbaren Jobs zu sehen.",
  "Tap a card to run a job. Gold = cost, green = payout, eye = caught chance. Green cards are safe, purple are high-risk.":
    "Tippe eine Karte an, um einen Job auszuführen. Gold = Kosten, Grün = Auszahlung, Auge = Erwischt-Chance. Grüne Karten sind sicher, lila sind riskant.",
  "You picked a job. Now tap SPIN THE WHEEL — most slices pay you, but a red slice means you're caught and lose a shield.":
    "Du hast einen Job gewählt. Tippe jetzt auf DREH DAS RAD — die meisten Felder zahlen dir aus, aber ein rotes Feld bedeutet, dass du erwischt wirst und ein Schild verlierst.",
  "You've been caught with no shields left — your crew is out of the game. Watch how the rest plays out below.":
    "Du wurdest ohne verbleibende Schilde erwischt — deine Crew ist aus dem Spiel. Sieh unten, wie es weitergeht.",
  "Caught! You lost one shield token. When all shields are gone, you're eliminated — so weigh the risk next time.":
    "Erwischt! Du hast einen Schild-Token verloren. Wenn alle Schilde weg sind, scheidest du aus — wäge das Risiko also nächstes Mal ab.",
  "You're broke — your fortune hit $0 and your crew is out of the game. Watch how the rest plays out below.":
    "Du bist pleite — dein Vermögen ist auf 0 $ gefallen und deine Crew ist aus dem Spiel. Sieh unten, wie es weitergeht.",
  "The job paid off — this is your net profit after costs. Tap the button below to watch your rivals move.":
    "Der Job hat sich gelohnt — das ist dein Nettogewinn nach Kosten. Tippe auf den Knopf unten, um deinen Rivalen zuzusehen.",
  "The job cost more than it earned this time. That happens — tap below to continue to your rivals' turn.":
    "Der Job hat diesmal mehr gekostet als eingebracht. Das passiert — tippe unten, um zum Zug deiner Rivalen zu gelangen.",
  " — Eliminated": " — Ausgeschieden",
  " — Shield Lost": " — Schild verloren",
  " — Bankrupt": " — Bankrott",
  CHAMPION: "MEISTER",
  "Final Fortune": "Endvermögen",
  "Rounds Survived": "Überlebte Runden",
  "Biggest Win": "Größter Gewinn",
  Operations: "Operationen",
  "HALL OF FAME": "RUHMESHALLE",
  "Biggest Winner": "Größter Gewinner",
  "Highest Single Profit": "Höchster Einzelgewinn",
  "Biggest Gamble": "Größtes Wagnis",
  "Luckiest Player": "Glücklichster Spieler",
  "Most Wanted": "Meistgesucht",
  "Closest Escape": "Knappste Flucht",
  "Richest Eliminated": "Reichster Ausgeschiedener",
  Copied: "Kopiert",
  "Share seed": "Seed teilen",
  Statistics: "Statistiken",
  Achievements: "Erfolge",
  "PLAY AGAIN": "NOCHMAL SPIELEN",
  "(you)": "(du)",
  RIVAL: "RIVALE",
  "Global event": "Globales Ereignis",
  "← pick a different operation": "← andere Operation wählen",
  Invested: "Investiert",
  Conservative: "Konservativ",
  Risktaker: "Risikofreudig",
  Greedy: "Gierig",
  Adaptive: "Anpassungsfähig",
  Chaotic: "Chaotisch",

  /* --- quick guide --- */
  "Welcome": "Willkommen",
  "guide.title": "Kurzanleitung",
  "guide.welcome":
    "Syndicate ist ein rundenbasiertes Taktikspiel. Du leitest eine kriminelle Operation, planst Jobs und versuchst, am Ende von 12 Runden die meisten Punkte zu besitzen. Jede Runde birgt Chancen und Risiken.",
  "guide.objective":
    "Verdiene nach 12 Runden mehr als deine zwei KI-Rivalen. Dein Ergebnis setzt sich aus Bargeld, dem aktuellen Wert deiner Aktivitäten und deinem Heat-Stand ab. Wer die beste Balance aus Risiko und Rendite findet, gewinnt.",
  "guide.startTitle": "Starten",
  "guide.start1":
    "Wähle einen Spielmodus: Free Play (Standard mit Zufallsereignissen), Daily Challenge (jeder Tag hat einen festen Seed) oder Seeded Game (eigener Code für identische Bedingungen).",
  "guide.start2": "Gib deinen Namen oder Alias ein.",
  "guide.start3":
    "Wähle eine KI-Strategie für deinen Charakter: konservativ, risikofreudig, gierig, adaptiv oder chaotisch.",
  "guide.roundTitle": "Rundenablauf",
  "guide.round1":
    "Globales Ereignis — Weltweite Nachrichten beeinflussen Risiko und Gewinn. Lies sie aufmerksam.",
  "guide.round2":
    "Operation wählen — Klicke eine der 12 verfügbaren Aktionen. Jede hat Kosten, mögliche Auszahlung und eine Risikostufe.",
  "guide.round3": "Glücksrad drehen — Das Rad entscheidet über den Ausgang deiner Operation.",
  "guide.outcomeTitle": "Mögliche Ergebnisse",
  "guide.safe": "Safe — Einsatz zurück, kein Gewinn, kein Verlust.",
  "guide.success": "Success — Normale Auszahlung.",
  "guide.bigSuccess": "Big Success — Auszahlung × 1,8.",
  "guide.bonus": "Bonus — Auszahlung × 1,3.",
  "guide.investigation":
    "Investigation — Nur 50 % des Einsatzes zurück, Heat steigt.",
  "guide.caught": "Caught — Einsatz verloren, Schild-Token verbraucht.",
  "guide.shieldsTitle": "Schilder & Tokens",
  "guide.shields1": "Du startest mit 3 Schildern.",
  "guide.shields2": "Bei Caught verlierst du ein Schild.",
  "guide.shields3":
    "Hast du keine Schilder mehr, bedeutet ein weiterer Caught das Spielende.",
  "guide.heatTitle": "Heat (Aufmerksamkeit)",
  "guide.heat":
    "Heat steigt mit jeder Runde und bei Ermittlungen. Hoher Heat erhöht die Wahrscheinlichkeit, erwischt zu werden.",
  "guide.rivalsTitle": "KI-Rivalen",
  "guide.vex": "Vex — Konservativ, reduziert das Entdeckungsrisiko.",
  "guide.nyx": "Nyx — Risikofreudig, gewinnt bei hohen Risiken mehr.",
  "guide.tipsTitle": "Tipps",
  "guide.tip1": "Niedrige Risiken am Anfang sichern dein Kapital.",
  "guide.tip2":
    "Weltnachrichten beachten: Bei Boom oder Gold Rush lohnen sich teure Operationen.",
  "guide.tip3":
    "Bei „Interpol Joint Operation“ oder „Insider Informant“ lieber kleinere Risiken wählen.",
  "guide.tip4":
    "Behalte deine Schilder im Auge; ein weiteres Caught ohne Schutz beendet das Spiel.",
  "guide.tip5":
    "Versuche, in den letzten Runden noch einmal zu pushen, bevor die Endwertung zählt.",
  "guide.languageTitle": "Sprache",
  "guide.language":
    "Über den Schalter oben rechts kannst du zwischen Deutsch und Englisch wechseln.",
  "guide.endTitle": "Spiel beenden",
  "guide.end":
    "Das Spiel endet nach 12 Runden oder früher, wenn du alle Schilder verlierst. Die Highscore-Liste zeigt deine besten Ergebnisse.",
  "guide.close": "Schließen",
};

