import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, Percent, Users, Trophy, Flame, Clock, Star, Zap } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { useLanguage } from '@/i18n/LanguageContext';
import { StaggerReveal } from '@/components/StaggerReveal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMillionaireSound } from '@/hooks/useMillionaireSound';

interface QuizQuestion {
  id: string;
  question: Record<string, string>;
  options: { label: Record<string, string>; value: string }[];
  correct: string;
  explanation: Record<string, string>;
}

const ALL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: {
      de: 'Ein mittelständischer Energieversorger (800 MA) wird Opfer eines Ransomware-Angriffs. Die Geschäftsleitung beschließt, das Lösegeld zu zahlen und den Vorfall nicht zu melden, da die Stromversorgung nach 4 Stunden wiederhergestellt war. Was ist das größte Problem?',
      en: 'A mid-sized energy provider (800 employees) suffers a ransomware attack. Management decides to pay the ransom and not report the incident since power was restored after 4 hours. What is the biggest problem?',
      fr: 'Un fournisseur d\'énergie (800 employés) subit une attaque ransomware. La direction décide de payer la rançon et de ne pas signaler l\'incident car l\'alimentation a été rétablie après 4 heures. Quel est le plus gros problème ?',
    },
    options: [
      { label: { de: 'Die Lösegeldzahlung – Art. 21 NIS-2 verbietet finanzielle Zugeständnisse an Angreifer, da sie kriminelle Infrastrukturen stärken', en: 'The ransom payment – Art. 21 NIS-2 prohibits financial concessions to attackers as they strengthen criminal infrastructure', fr: 'Le paiement de rançon – l\'Art. 21 NIS-2 interdit les concessions financières aux attaquants' }, value: 'a' },
      { label: { de: 'Die unterlassene Meldung – die Frühwarnung an das CSIRT muss innerhalb von 24 Stunden erfolgen, unabhängig von der Wiederherstellung', en: 'The failure to report – the early warning to the CSIRT must be sent within 24 hours, regardless of recovery', fr: 'L\'absence de signalement – l\'alerte précoce au CSIRT doit être envoyée dans les 24 heures, indépendamment de la restauration' }, value: 'b' },
      { label: { de: 'Die fehlende Abstimmung mit der ENISA – bei grenzüberschreitender Auswirkung muss vorab eine Koordination mit der EU-Agentur erfolgen', en: 'The missing coordination with ENISA – cross-border impact requires prior coordination with the EU agency', fr: 'L\'absence de coordination avec l\'ENISA – un impact transfrontalier nécessite une coordination préalable' }, value: 'c' },
      { label: { de: 'Die unterlassene sofortige Abschaltung aller betroffenen Systeme – Art. 21 Abs. 2 verlangt die unverzügliche Isolierung kompromittierter Infrastruktur', en: 'The failure to immediately shut down all affected systems – Art. 21(2) requires immediate isolation of compromised infrastructure', fr: 'L\'absence d\'arrêt immédiat de tous les systèmes affectés – l\'Art. 21(2) exige l\'isolation immédiate' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Meldepflicht unter NIS-2 ist nicht an die Dauer oder erfolgreiche Eindämmung gekoppelt. Ein erheblicher Vorfall bei einem Energieversorger (wesentliche Einrichtung) muss innerhalb von 24h als Frühwarnung gemeldet werden. Die Lösegeldzahlung ist unter NIS-2 nicht explizit verboten, aber die Nicht-Meldung ist ein klarer Verstoß mit persönlichen Konsequenzen für die Geschäftsleitung.',
      en: 'The reporting obligation under NIS-2 is not tied to duration or successful containment. A significant incident at an energy provider (essential entity) must be reported as an early warning within 24 hours. The ransom payment is not explicitly prohibited under NIS-2, but failure to report is a clear violation with personal consequences for management.',
      fr: 'L\'obligation de notification sous NIS-2 n\'est pas liée à la durée ou au confinement réussi. Un incident significatif chez un fournisseur d\'énergie (entité essentielle) doit être signalé en alerte précoce dans les 24 heures.',
    },
  },
  {
    id: 'q2',
    question: {
      de: 'Ein Logistikunternehmen (120 MA, 25 Mio. € Umsatz) betreibt keine kritische Infrastruktur, liefert aber ausschließlich an Krankenhäuser. Der Geschäftsführer ist sicher, nicht unter NIS-2 zu fallen. Hat er recht?',
      en: 'A logistics company (120 employees, €25M revenue) doesn\'t operate critical infrastructure but exclusively delivers to hospitals. The CEO is certain they don\'t fall under NIS-2. Is he right?',
      fr: 'Une entreprise de logistique (120 employés, 25 M€ CA) ne gère pas d\'infrastructure critique mais livre exclusivement aux hôpitaux. Le PDG est certain de ne pas être soumis à NIS-2. A-t-il raison ?',
    },
    options: [
      { label: { de: 'Ja – das Unternehmen liegt unter den Schwellenwerten für mittlere Unternehmen (mind. 50 MA und 10 Mio. € Umsatz), aber die Lieferketten-Klausel greift hier nicht, da keine eigene IT-Dienstleistung erbracht wird', en: 'Yes – the company is below the thresholds for medium enterprises (min. 50 employees and €10M revenue), but the supply chain clause doesn\'t apply here as no IT services are provided', fr: 'Oui – l\'entreprise est en dessous des seuils, et la clause de chaîne d\'approvisionnement ne s\'applique pas' }, value: 'a' },
      { label: { de: 'Nein – als Teil der Lieferkette wesentlicher Einrichtungen kann die nationale Behörde das Unternehmen einbeziehen', en: 'No – as part of the supply chain of essential entities, the national authority can include the company', fr: 'Non – en tant que partie de la chaîne d\'approvisionnement d\'entités essentielles, l\'autorité nationale peut inclure l\'entreprise' }, value: 'b' },
      { label: { de: 'Ja – Logistikunternehmen sind nur erfasst, wenn sie selbst Betreiber kritischer Infrastruktur nach dem KRITIS-Dachgesetz sind', en: 'Yes – logistics companies are only covered if they are critical infrastructure operators themselves under the CRITIS umbrella law', fr: 'Oui – les entreprises de logistique ne sont couvertes que si elles sont elles-mêmes opérateurs d\'infrastructure critique' }, value: 'c' },
      { label: { de: 'Nein – die ausschließliche Belieferung von Krankenhäusern macht das Unternehmen automatisch zur wesentlichen Einrichtung nach Annex I', en: 'No – exclusively supplying hospitals automatically makes the company an essential entity under Annex I', fr: 'Non – la fourniture exclusive aux hôpitaux fait automatiquement de l\'entreprise une entité essentielle selon l\'Annexe I' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 ermöglicht es den Mitgliedstaaten, Unternehmen unabhängig von Größenkriterien einzubeziehen, wenn sie eine kritische Rolle in der Lieferkette wesentlicher Einrichtungen spielen. Zudem ist der Transportsektor explizit in NIS-2 Annex I erfasst.',
      en: 'NIS-2 allows member states to include companies regardless of size criteria if they play a critical role in the supply chain of essential entities. Additionally, the transport sector is explicitly covered in NIS-2 Annex I.',
      fr: 'NIS-2 permet aux États membres d\'inclure des entreprises indépendamment des critères de taille si elles jouent un rôle critique dans la chaîne d\'approvisionnement d\'entités essentielles. De plus, le secteur des transports est explicitement couvert dans l\'Annexe I de NIS-2.',
    },
  },
  {
    id: 'q3',
    question: {
      de: 'Ein Finanzdienstleister nutzt für sein SIEM einen US-amerikanischen Cloud-Anbieter. Nach einer NIS-2-Prüfung wird die Abhängigkeit von diesem einzelnen Anbieter bemängelt. Der CISO argumentiert: „Aber der Anbieter ist ISO 27001-zertifiziert!" Warum reicht das nicht?',
      en: 'A financial services company uses a US cloud provider for its SIEM. After a NIS-2 audit, the dependency on this single provider is flagged. The CISO argues: "But the provider is ISO 27001 certified!" Why isn\'t that enough?',
      fr: 'Un prestataire financier utilise un fournisseur cloud américain pour son SIEM. Après un audit NIS-2, la dépendance à ce fournisseur est signalée. Le RSSI argue : « Mais le fournisseur est certifié ISO 27001 ! » Pourquoi cela ne suffit-il pas ?',
    },
    options: [
      { label: { de: 'Weil ISO 27001 des Anbieters keine C5-Attestierung enthält, die für Cloud-Dienste in der EU nach Art. 21 Abs. 3 NIS-2 vorgeschrieben ist', en: 'Because the provider\'s ISO 27001 doesn\'t include C5 attestation, required for cloud services in the EU under Art. 21(3) NIS-2', fr: 'Parce que l\'ISO 27001 ne contient pas d\'attestation C5, requise pour les services cloud dans l\'UE' }, value: 'a' },
      { label: { de: 'Weil ISO 27001 des Anbieters nichts über Konzentrationsrisiko, Verfügbarkeitsabhängigkeit und geopolitische Risiken im eigenen Risikomanagement aussagt', en: 'Because the provider\'s ISO 27001 says nothing about concentration risk, availability dependency, and geopolitical risks in your own risk management', fr: 'Parce que l\'ISO 27001 du fournisseur ne dit rien sur le risque de concentration et les risques géopolitiques dans votre propre gestion des risques' }, value: 'b' },
      { label: { de: 'Weil der Anbieter als Auftragsverarbeiter zusätzlich eine SOC 2 Type II-Zertifizierung benötigt, die den Anforderungen der DORA-Verordnung entspricht', en: 'Because the provider as a processor additionally needs SOC 2 Type II certification that meets DORA regulation requirements', fr: 'Parce que le fournisseur en tant que sous-traitant nécessite une certification SOC 2 Type II conforme au DORA' }, value: 'c' },
      { label: { de: 'Weil NIS-2 eine verpflichtende Datenlokalisierung innerhalb der EU vorschreibt und US-Anbieter diese Anforderung strukturell nicht erfüllen können', en: 'Because NIS-2 mandates data localization within the EU and US providers structurally cannot meet this requirement', fr: 'Parce que NIS-2 impose la localisation des données dans l\'UE et les fournisseurs américains ne peuvent structurellement pas répondre' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 fordert eine ganzheitliche Risikobewertung der Lieferkette. Die ISO 27001-Zertifizierung eines Anbieters belegt dessen Sicherheitsniveau, adressiert aber nicht das Konzentrationsrisiko beim Kunden: Was passiert bei Ausfall des Anbieters, bei jurisdiktionsbedingten Zugriffsrisiken (CLOUD Act) oder bei geopolitischen Spannungen?',
      en: 'NIS-2 requires a holistic supply chain risk assessment. A provider\'s ISO 27001 certification demonstrates their security level but doesn\'t address concentration risk at the customer: What happens if the provider fails, with jurisdiction-related access risks (CLOUD Act), or geopolitical tensions?',
      fr: 'NIS-2 exige une évaluation holistique des risques de la chaîne d\'approvisionnement. La certification ISO 27001 d\'un fournisseur démontre son niveau de sécurité mais n\'adresse pas le risque de concentration chez le client.',
    },
  },
  {
    id: 'q4',
    question: {
      de: 'Ein Maschinenbauunternehmen (600 MA) hat sein ISMS gerade nach ISO 27001:2022 zertifizieren lassen. Der Vorstand sagt: „NIS-2 können wir abhaken." Die Compliance-Abteilung widerspricht. Wer hat recht – und was ist der blinde Fleck?',
      en: 'A mechanical engineering company (600 employees) just certified its ISMS to ISO 27001:2022. The board says: "We can check off NIS-2." Compliance disagrees. Who is right – and what\'s the blind spot?',
      fr: 'Une entreprise de génie mécanique (600 employés) vient de certifier son SMSI ISO 27001:2022. Le conseil dit : « NIS-2 est réglé. » La conformité conteste. Qui a raison – et quel est l\'angle mort ?',
    },
    options: [
      { label: { de: 'Der Vorstand – ISO 27001:2022 wird von der EU-Kommission gemäß Art. 25 als gleichwertiger Nachweis anerkannt, sofern der Geltungsbereich die betroffenen Dienste abdeckt', en: 'The board – ISO 27001:2022 is recognized by the EU Commission under Art. 25 as equivalent proof, provided the scope covers affected services', fr: 'Le conseil – ISO 27001:2022 est reconnu par la Commission UE comme preuve équivalente selon l\'Art. 25' }, value: 'a' },
      { label: { de: 'Die Compliance-Abteilung – ISO 27001 deckt weder die persönliche Haftung der Geschäftsleitung noch die spezifischen Meldepflichten und Schulungsvorgaben für Leitungsorgane ab', en: 'Compliance – ISO 27001 covers neither personal management liability nor specific reporting obligations and training requirements for management bodies', fr: 'La conformité – ISO 27001 ne couvre ni la responsabilité personnelle de la direction ni les obligations de notification et de formation spécifiques' }, value: 'b' },
      { label: { de: 'Beide teilweise – ISO 27001 deckt die technischen Maßnahmen ab, es fehlt nur die formale Registrierung bei der nationalen Aufsichtsbehörde nach Art. 3', en: 'Both partially – ISO 27001 covers technical measures, only the formal registration with the national supervisory authority under Art. 3 is missing', fr: 'Les deux partiellement – ISO 27001 couvre les mesures techniques, seul l\'enregistrement formel manque' }, value: 'c' },
      { label: { de: 'Die Compliance-Abteilung – aber nur, weil ISO 27001 keine expliziten Vorgaben für Business Continuity nach Art. 21 Abs. 2 lit. c enthält', en: 'Compliance – but only because ISO 27001 lacks explicit requirements for business continuity under Art. 21(2)(c)', fr: 'La conformité – mais uniquement parce qu\'ISO 27001 manque d\'exigences explicites pour la continuité d\'activité' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'ISO 27001 ist eine hervorragende Grundlage, hat aber strukturelle Lücken gegenüber NIS-2: Die persönliche Genehmigungspflicht und Haftung der Leitungsorgane, die gestuften Meldefristen (24h/72h/1 Monat), die verpflichtende Cybersicherheitsschulung der Geschäftsleitung und die spezifischen Aufsichtsregime sind in ISO 27001 nicht vorgesehen.',
      en: 'ISO 27001 is an excellent foundation but has structural gaps versus NIS-2: personal approval obligations and liability of management bodies, tiered reporting deadlines (24h/72h/1 month), mandatory cybersecurity training for management, and specific supervisory regimes are not covered.',
      fr: 'ISO 27001 est une excellente base mais a des lacunes structurelles par rapport à NIS-2 : obligations d\'approbation personnelle et responsabilité des organes de direction, délais de notification échelonnés (24h/72h/1 mois), formation obligatoire pour la direction.',
    },
  },
  {
    id: 'q5',
    question: {
      de: 'Samstagnacht: Ihr SOC erkennt ungewöhnlichen Datenabfluss aus einem Entwicklungsserver. Der Analyst kann nicht sicher sagen, ob Kundendaten betroffen sind – die Forensik braucht noch mindestens 48 Stunden. Wie gehen Sie mit der Meldepflicht um?',
      en: 'Saturday night: your SOC detects unusual data exfiltration from a dev server. The analyst can\'t confirm whether customer data is affected – forensics need at least 48 more hours. How do you handle the reporting obligation?',
      fr: 'Samedi soir : votre SOC détecte une exfiltration inhabituelle depuis un serveur de développement. L\'analyste ne peut confirmer si des données clients sont concernées – l\'analyse forensique nécessite encore 48 heures. Comment gérez-vous la notification ?',
    },
    options: [
      { label: { de: 'Zunächst die Forensik abschließen und dann innerhalb von 72h die vollständige Vorfallmeldung einreichen – eine Frühwarnung ohne belastbare Fakten würde die Behörde unnötig belasten', en: 'Complete forensics first and submit the full incident report within 72h – an early warning without solid facts would unnecessarily burden the authority', fr: 'Terminer l\'analyse forensique d\'abord et soumettre le rapport complet dans les 72h – une alerte sans faits fiables surchargerait l\'autorité' }, value: 'a' },
      { label: { de: 'Innerhalb von 24h eine Frühwarnung absetzen mit den verfügbaren Informationen – die vollständige Bewertung folgt innerhalb von 72h', en: 'Send an early warning within 24h with available information – the full assessment follows within 72 hours', fr: 'Envoyer une alerte précoce dans les 24h avec les informations disponibles – l\'évaluation complète suit dans les 72 heures' }, value: 'b' },
      { label: { de: 'Intern eskalieren und abwarten – ein Entwicklungsserver fällt als Nicht-Produktionssystem nicht unter die Meldepflicht nach Art. 23 NIS-2', en: 'Escalate internally and wait – a dev server as a non-production system doesn\'t fall under the reporting obligation of Art. 23 NIS-2', fr: 'Escalader en interne – un serveur de développement comme système non productif ne relève pas de l\'Art. 23' }, value: 'c' },
      { label: { de: 'Parallel zur Forensik eine DSGVO-Meldung nach Art. 33 an die Datenschutzbehörde einreichen – diese erfüllt zugleich die NIS-2-Meldepflicht', en: 'Submit a GDPR notification under Art. 33 to the data protection authority in parallel with forensics – this simultaneously fulfills the NIS-2 obligation', fr: 'Soumettre une notification RGPD selon l\'Art. 33 – celle-ci remplit simultanément l\'obligation NIS-2' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 kennt ein gestuftes Meldesystem: Die Frühwarnung (24h) muss bereits bei Verdacht auf einen erheblichen Vorfall erfolgen – eine vollständige Analyse ist dafür nicht nötig. Die Vorfallmeldung (72h) liefert dann eine erste Bewertung, der Abschlussbericht folgt innerhalb eines Monats.',
      en: 'NIS-2 has a tiered reporting system: the early warning (24h) must be issued upon suspicion of a significant incident – a complete analysis is not required. The incident notification (72h) provides an initial assessment, with the final report following within one month.',
      fr: 'NIS-2 prévoit un système de notification échelonné : l\'alerte précoce (24h) doit être émise dès la suspicion d\'un incident significatif – une analyse complète n\'est pas nécessaire.',
    },
  },
  {
    id: 'q6',
    question: {
      de: 'Ein Stadtwerk (wesentliche Einrichtung) lagert sein Patch-Management komplett an einen IT-Dienstleister aus. Dieser verzögert kritische Patches regelmäßig um 3–4 Wochen. Der IT-Leiter sagt: „Das ist das Problem des Dienstleisters – wir haben einen Vertrag." Wie sieht NIS-2 das?',
      en: 'A municipal utility (essential entity) outsources its entire patch management to an IT provider. The provider regularly delays critical patches by 3–4 weeks. The IT lead says: "That\'s the provider\'s problem – we have a contract." How does NIS-2 see this?',
      fr: 'Un service municipal (entité essentielle) externalise toute sa gestion des correctifs. Le prestataire retarde régulièrement les correctifs critiques de 3-4 semaines. Le responsable IT dit : « C\'est le problème du prestataire – nous avons un contrat. » Quel est le point de vue de NIS-2 ?',
    },
    options: [
      { label: { de: 'Der IT-Leiter hat recht – gemäß Art. 21 Abs. 2 lit. d geht die Verantwortung durch vertragliche Sicherheitsvereinbarungen auf den Dienstleister über, sofern SLAs definiert sind', en: 'The IT lead is right – under Art. 21(2)(d), responsibility transfers to the provider through contractual security agreements, provided SLAs are defined', fr: 'Le responsable IT a raison – selon l\'Art. 21(2)(d), la responsabilité est transférée par les accords contractuels' }, value: 'a' },
      { label: { de: 'Die Verantwortung bleibt beim Stadtwerk – es muss die Einhaltung überwachen, Eskalationsmechanismen etablieren und notfalls den Anbieter wechseln', en: 'Responsibility remains with the utility – it must monitor compliance, establish escalation mechanisms, and switch providers if necessary', fr: 'La responsabilité reste chez le service municipal – il doit surveiller la conformité, établir des mécanismes d\'escalade et changer de prestataire si nécessaire' }, value: 'b' },
      { label: { de: 'NIS-2 sieht eine geteilte Verantwortung vor – das Stadtwerk haftet nur, wenn es die Verzögerung nachweislich kannte und nicht eskaliert hat', en: 'NIS-2 provides for shared responsibility – the utility is only liable if it demonstrably knew about the delay and didn\'t escalate', fr: 'NIS-2 prévoit une responsabilité partagée – le service municipal n\'est responsable que s\'il connaissait le retard' }, value: 'c' },
      { label: { de: 'Problematisch erst bei nachgewiesenem Sicherheitsvorfall – die präventive Überwachung der Patch-Compliance ist eine Empfehlung, keine NIS-2-Pflicht', en: 'Only problematic upon a proven security incident – preventive patch compliance monitoring is a recommendation, not a NIS-2 obligation', fr: 'Problématique seulement en cas d\'incident prouvé – le suivi préventif est une recommandation, pas une obligation NIS-2' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Unter NIS-2 kann die Verantwortung für Risikomanagement nicht durch Outsourcing delegiert werden. Das Stadtwerk bleibt für die Sicherheit seiner Systeme verantwortlich – es muss die Leistung des Dienstleisters aktiv überwachen, SLAs mit konkreten Patch-Fristen definieren und im Extremfall den Anbieter wechseln.',
      en: 'Under NIS-2, responsibility for risk management cannot be delegated through outsourcing. The utility remains responsible for the security of its systems – it must actively monitor provider performance, define SLAs with concrete patch timelines, and switch providers if needed.',
      fr: 'Sous NIS-2, la responsabilité de la gestion des risques ne peut pas être déléguée par l\'externalisation. Le service municipal reste responsable de la sécurité de ses systèmes.',
    },
  },
  {
    id: 'q7',
    question: {
      de: 'Ein Pharmakonzern führt nach einem Cyberangriff eine Tabletop-Übung durch. Ergebnis: Der Krisenstab konnte keine Entscheidungen treffen, weil unklar war, wer final entscheidet – CEO, CISO oder der Leiter des Incident-Response-Teams. Welche NIS-2-Anforderung wurde primär verletzt?',
      en: 'After a cyber attack, a pharmaceutical company runs a tabletop exercise. Result: the crisis team couldn\'t make decisions because it was unclear who has final authority – CEO, CISO, or IR team lead. Which NIS-2 requirement was primarily violated?',
      fr: 'Après une cyberattaque, un groupe pharmaceutique mène un exercice. Résultat : l\'équipe de crise ne pouvait décider car il était flou qui avait l\'autorité finale. Quelle exigence NIS-2 a été violée ?',
    },
    options: [
      { label: { de: 'Die Pflicht zur regelmäßigen Überprüfung der Risikomanagementmaßnahmen nach Art. 21 Abs. 2 lit. f – die Wirksamkeit der bestehenden Prozesse wurde nicht validiert', en: 'The obligation to regularly review risk management measures under Art. 21(2)(f) – the effectiveness of existing processes was not validated', fr: 'L\'obligation de réviser régulièrement les mesures selon l\'Art. 21(2)(f)' }, value: 'a' },
      { label: { de: 'Die Anforderung an Krisenmanagement-Governance – klare Rollen, Entscheidungsbefugnisse und Verantwortlichkeiten müssen vorab definiert sein', en: 'The crisis management governance requirement – clear roles, decision authority, and responsibilities must be defined in advance', fr: 'L\'exigence de gouvernance de gestion de crise – rôles, autorité et responsabilités doivent être définis à l\'avance' }, value: 'b' },
      { label: { de: 'Die Pflicht zur Einbindung der Geschäftsleitung nach Art. 20 – der CEO hätte als Leitungsorgan automatisch die finale Entscheidungsbefugnis gehabt', en: 'The obligation to involve management under Art. 20 – the CEO as a management body would have automatically had final decision authority', fr: 'L\'obligation d\'impliquer la direction selon l\'Art. 20 – le PDG aurait automatiquement eu l\'autorité finale' }, value: 'c' },
      { label: { de: 'Die Meldepflicht gegenüber der Aufsichtsbehörde – das Ergebnis der Tabletop-Übung hätte als Schwachstelle innerhalb von 72h gemeldet werden müssen', en: 'The reporting obligation – the tabletop exercise result should have been reported as a vulnerability within 72h', fr: 'L\'obligation de notification – le résultat de l\'exercice aurait dû être signalé comme vulnérabilité dans les 72h' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 fordert Maßnahmen zur Bewältigung von Sicherheitsvorfällen und zum Krisenmanagement. Dazu gehört zwingend eine klare Governance-Struktur: Wer entscheidet was, in welcher Reihenfolge, mit welcher Befugnis? Unklare Entscheidungsstrukturen im Krisenfall zeigen, dass die operativen Voraussetzungen für wirksames Krisenmanagement fehlen.',
      en: 'NIS-2 requires measures for incident handling and crisis management. This mandates a clear governance structure: who decides what, in what order, with what authority? Unclear decision structures during a crisis demonstrate missing operational prerequisites for effective crisis management.',
      fr: 'NIS-2 exige des mesures de gestion des incidents et de crise. Cela impose une structure de gouvernance claire : qui décide quoi, dans quel ordre, avec quelle autorité ?',
    },
  },
  {
    id: 'q8',
    question: {
      de: 'Ein deutsches SaaS-Unternehmen (200 MA, 30 Mio. € Umsatz) bietet Projektmanagement-Software an. 40% der Kunden sind öffentliche Verwaltungen. Der CEO meint: „Wir sind kein IT-Dienstleister im Sinne von NIS-2 – wir machen ja nur Software." Stimmt das?',
      en: 'A German SaaS company (200 employees, €30M revenue) offers project management software. 40% of customers are public administrations. The CEO says: "We\'re not an IT service provider under NIS-2 – we just make software." Is that correct?',
      fr: 'Une entreprise SaaS allemande (200 employés, 30 M€ CA) propose un logiciel de gestion de projets. 40% des clients sont des administrations. Le PDG dit : « Nous ne sommes pas un prestataire IT au sens de NIS-2. » Est-ce correct ?',
    },
    options: [
      { label: { de: 'Ja – reine Softwareanbieter fallen unter die Produkthaftungsrichtlinie und den Cyber Resilience Act, nicht unter NIS-2', en: 'Yes – pure software vendors fall under the Product Liability Directive and Cyber Resilience Act, not NIS-2', fr: 'Oui – les éditeurs purs relèvent de la directive sur la responsabilité des produits et du CRA, pas de NIS-2' }, value: 'a' },
      { label: { de: 'Falsch – ein SaaS-Anbieter betreibt die Infrastruktur und ist als Anbieter digitaler Dienste potenziell erfasst, besonders bei Kunden in der öffentlichen Verwaltung', en: 'Wrong – a SaaS provider operates infrastructure and is potentially covered as a digital service provider, especially with public administration clients', fr: 'Faux – un fournisseur SaaS exploite l\'infrastructure et est potentiellement couvert comme fournisseur de services numériques' }, value: 'b' },
      { label: { de: 'Teilweise richtig – NIS-2 erfasst SaaS nur, wenn die Software sicherheitsrelevante Funktionen wie Zugangskontrolle oder Verschlüsselung bereitstellt', en: 'Partially correct – NIS-2 only covers SaaS if the software provides security-relevant functions like access control or encryption', fr: 'Partiellement correct – NIS-2 ne couvre le SaaS que si le logiciel fournit des fonctions de sécurité' }, value: 'c' },
      { label: { de: 'Ja – mit 200 MA liegt das Unternehmen unter dem Schwellenwert von 250 MA für wichtige Einrichtungen nach Art. 2', en: 'Yes – with 200 employees the company is below the 250-employee threshold for important entities under Art. 2', fr: 'Oui – avec 200 employés, l\'entreprise est sous le seuil de 250 pour les entités importantes selon l\'Art. 2' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'SaaS-Anbieter sind keine reinen Softwareverkäufer – sie betreiben Infrastruktur, verarbeiten Daten und stellen Dienste bereit. NIS-2 erfasst Anbieter digitaler Dienste (Annex II), darunter Cloud-Computing-Dienste. Mit 200 MA und 30 Mio. € Umsatz überschreitet das Unternehmen die Schwellenwerte.',
      en: 'SaaS providers are not pure software sellers – they operate infrastructure, process data, and provide services. NIS-2 covers digital service providers (Annex II), including cloud computing services. With 200 employees and €30M revenue, the company exceeds the thresholds.',
      fr: 'Les fournisseurs SaaS ne sont pas de simples vendeurs de logiciels – ils exploitent une infrastructure, traitent des données et fournissent des services. NIS-2 couvre les fournisseurs de services numériques (Annexe II).',
    },
  },
  {
    id: 'q9',
    question: {
      de: 'Nach einem Vorfall steht fest: Ein Mitarbeiter hat seinen privaten USB-Stick an einen Produktionsrechner angeschlossen und so Malware eingeschleust. Der Betriebsrat argumentiert, ein USB-Port-Verbot sei unverhältnismäßig. Wie positioniert sich NIS-2?',
      en: 'After an incident: an employee connected a private USB stick to a production computer, introducing malware. The works council argues a USB port ban would be disproportionate. How does NIS-2 position itself?',
      fr: 'Après un incident : un employé a connecté sa clé USB personnelle à un ordinateur de production, introduisant un malware. Le comité d\'entreprise argue qu\'une interdiction des ports USB serait disproportionnée. Quelle est la position de NIS-2 ?',
    },
    options: [
      { label: { de: 'NIS-2 Art. 21 Abs. 2 lit. i fordert Sicherheit der Personalressourcen – ein technisches USB-Verbot an Produktionssystemen ist die Mindestanforderung zum Schutz vor Insider-Bedrohungen', en: 'NIS-2 Art. 21(2)(i) requires human resources security – a technical USB ban on production systems is the minimum requirement for insider threat protection', fr: 'L\'Art. 21(2)(i) exige la sécurité des ressources humaines – une interdiction USB est l\'exigence minimale' }, value: 'a' },
      { label: { de: 'NIS-2 verlangt verhältnismäßige Maßnahmen auf Basis einer Risikoanalyse – die konkrete Maßnahme muss das Risiko adressieren, ohne pauschal zu sein', en: 'NIS-2 requires proportionate measures based on risk analysis – the measure must address the risk without being blanket', fr: 'NIS-2 exige des mesures proportionnées basées sur l\'analyse des risques – la mesure doit adresser le risque sans être générale' }, value: 'b' },
      { label: { de: 'NIS-2 überlässt solche operativen Entscheidungen dem nationalen Arbeitsrecht – der Betriebsrat hat bei Maßnahmen mit Mitarbeiterbezug ein zwingendes Mitbestimmungsrecht', en: 'NIS-2 defers such operational decisions to national labor law – the works council has a mandatory co-determination right for employee-related measures', fr: 'NIS-2 laisse ces décisions au droit du travail national – le comité d\'entreprise a un droit de codécision' }, value: 'c' },
      { label: { de: 'NIS-2 priorisiert technische Maßnahmen über organisatorische – die Implementierung einer Device-Control-Software mit Whitelisting wäre die konforme Lösung', en: 'NIS-2 prioritizes technical over organizational measures – implementing device control software with whitelisting would be the compliant solution', fr: 'NIS-2 priorise les mesures techniques – un logiciel de contrôle d\'appareils avec liste blanche serait conforme' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 fordert einen risikobasierten, verhältnismäßigen Ansatz. Ein generelles USB-Verbot kann verhältnismäßig sein – muss es aber nicht. Die Organisation muss auf Basis ihrer Risikoanalyse entscheiden: selektives Whitelisting, technische Gerätekontrolle oder tatsächlich ein Verbot. Entscheidend ist die dokumentierte Risikobewertung.',
      en: 'NIS-2 requires a risk-based, proportionate approach. A general USB ban may be proportionate – but doesn\'t have to be. The organization must decide based on its risk analysis. The documented risk assessment is what matters.',
      fr: 'NIS-2 exige une approche proportionnée basée sur les risques. Une interdiction générale des USB peut être proportionnée – mais ne l\'est pas forcément. L\'évaluation documentée des risques est ce qui compte.',
    },
  },
  {
    id: 'q10',
    question: {
      de: 'Ein Automobilzulieferer hat gleichzeitig TISAX- und NIS-2-Anforderungen zu erfüllen. Der Compliance-Leiter schlägt vor, beides über ein einziges ISMS abzudecken. Sein Chef fragt: „Wo ist der Haken?"',
      en: 'An automotive supplier must meet both TISAX and NIS-2 requirements. The compliance lead suggests covering both through a single ISMS. His boss asks: "What\'s the catch?"',
      fr: 'Un sous-traitant automobile doit satisfaire TISAX et NIS-2. Le responsable conformité propose un seul SMSI. Son patron demande : « Où est le piège ? »',
    },
    options: [
      { label: { de: 'Kein Haken – die EU-Kommission hat TISAX in der Durchführungsverordnung zu Art. 24 als sektorspezifisches Zertifizierungsschema anerkannt, das NIS-2-Konformität nachweist', en: 'No catch – the EU Commission recognized TISAX in the implementing regulation under Art. 24 as a sector-specific certification scheme proving NIS-2 compliance', fr: 'Aucun piège – la Commission UE a reconnu TISAX comme schéma de certification sectoriel selon l\'Art. 24' }, value: 'a' },
      { label: { de: 'Ein gemeinsames ISMS ist sinnvoll als Basis, aber NIS-2 bringt eigenständige Anforderungen: Meldepflichten, persönliche Leitungshaftung und Aufsichtsregime, die TISAX nicht kennt', en: 'A shared ISMS makes sense as a foundation, but NIS-2 brings independent requirements: reporting obligations, personal management liability, and supervisory regimes that TISAX doesn\'t have', fr: 'Un SMSI commun a du sens comme base, mais NIS-2 apporte des exigences propres que TISAX ne connaît pas' }, value: 'b' },
      { label: { de: 'Der Haken liegt im Scope – TISAX fokussiert auf Prototypenschutz und Informationssicherheit beim OEM-Datenaustausch, während NIS-2 die Verfügbarkeit der eigenen Dienste adressiert', en: 'The catch is the scope – TISAX focuses on prototype protection and information security in OEM data exchange, while NIS-2 addresses availability of own services', fr: 'Le piège est dans le périmètre – TISAX se concentre sur la protection des prototypes, NIS-2 sur la disponibilité' }, value: 'c' },
      { label: { de: 'TISAX und NIS-2 verwenden unterschiedliche Reifegradmodelle – eine Harmonisierung der Bewertungsmethodik ist ohne externes Mapping-Framework nicht möglich', en: 'TISAX and NIS-2 use different maturity models – harmonizing assessment methodology is not possible without an external mapping framework', fr: 'TISAX et NIS-2 utilisent des modèles de maturité différents – l\'harmonisation n\'est pas possible sans framework de mapping' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Ein integriertes ISMS ist strategisch klug – man vermeidet Doppelarbeit. Der Haken: NIS-2 hat eigenständige Anforderungen, die über TISAX hinausgehen – insbesondere das gestufte Meldewesen (24h/72h), die persönliche Haftung der Geschäftsleitung, verpflichtende Management-Schulungen und das behördliche Aufsichtsregime.',
      en: 'An integrated ISMS is strategically smart – you avoid duplicate work. The catch: NIS-2 has independent requirements beyond TISAX – particularly tiered reporting (24h/72h), personal management liability, mandatory management training, and the supervisory regime.',
      fr: 'Un SMSI intégré est stratégiquement intelligent. Le piège : NIS-2 a des exigences propres au-delà de TISAX – notamment la notification échelonnée (24h/72h), la responsabilité personnelle de la direction et le régime de supervision.',
    },
  },
  {
    id: 'q11',
    question: {
      de: 'Ein Wasserversorger hat sein gesamtes OT-Netzwerk (Steuerungstechnik) vom IT-Netzwerk getrennt (Air Gap). Der Betriebsleiter: „Unsere Steuerungssysteme sind nicht mit dem Internet verbunden – NIS-2 betrifft nur das Office-Netz." Wo liegt der Denkfehler?',
      en: 'A water utility has air-gapped its entire OT network from IT. The ops manager: "Our control systems aren\'t internet-connected – NIS-2 only affects the office network." Where\'s the flaw?',
      fr: 'Un fournisseur d\'eau a isolé son réseau OT de l\'IT (air gap). Le directeur : « Nos systèmes de contrôle ne sont pas connectés – NIS-2 ne concerne que le réseau bureau. » Où est l\'erreur ?',
    },
    options: [
      { label: { de: 'Kein Denkfehler – Art. 6 Nr. 1 definiert Netz- und Informationssysteme als elektronische Kommunikationsnetze; Air-Gapped-Systeme ohne Netzanbindung fallen definitionsgemäß nicht darunter', en: 'No flaw – Art. 6(1) defines network and information systems as electronic communications networks; air-gapped systems without network connectivity don\'t fall under this definition', fr: 'Aucune erreur – l\'Art. 6(1) définit les systèmes comme des réseaux de communication ; les systèmes air-gapped n\'en font pas partie' }, value: 'a' },
      { label: { de: 'NIS-2 erfasst alle Netz- und Informationssysteme, die für die Erbringung des Dienstes relevant sind – die OT-Steuerung eines Wasserversorgers gehört zwingend dazu', en: 'NIS-2 covers all network and information systems relevant to service delivery – a water utility\'s OT systems are necessarily included', fr: 'NIS-2 couvre tous les systèmes pertinents pour la fourniture du service – les systèmes OT d\'un fournisseur d\'eau sont inclus' }, value: 'b' },
      { label: { de: 'Der Denkfehler liegt in der Annahme eines echten Air Gaps – NIS-2 Art. 21 verlangt eine Verifizierung der Netzsegmentierung durch unabhängige Dritte', en: 'The flaw is assuming a true air gap – NIS-2 Art. 21 requires verification of network segmentation by independent third parties', fr: 'L\'erreur est de supposer un vrai air gap – l\'Art. 21 NIS-2 exige une vérification par des tiers indépendants' }, value: 'c' },
      { label: { de: 'NIS-2 adressiert OT nur indirekt über die NIS-Kooperationsgruppe – die direkte Regulierung von OT-Systemen erfolgt über die Maschinenverordnung 2023/1230', en: 'NIS-2 only addresses OT indirectly through the NIS Cooperation Group – direct regulation of OT systems falls under the Machinery Regulation 2023/1230', fr: 'NIS-2 n\'adresse l\'OT qu\'indirectement – la régulation directe relève du Règlement Machines 2023/1230' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 bezieht sich auf die Sicherheit der Dienste, nicht nur auf internetverbundene Systeme. Die OT-Steuerung eines Wasserversorgers ist das Kernstück der Dienstleistung. Zudem sind echte Air Gaps in der Praxis selten: USB-Wartungsschnittstellen, Fernwartungszugänge oder veraltete Protokolle schaffen oft unbemerkte Verbindungen.',
      en: 'NIS-2 relates to service security, not just internet-connected systems. A water utility\'s OT control is the core of service delivery. Additionally, true air gaps are rare: USB maintenance interfaces, remote access, or legacy protocols often create unnoticed connections.',
      fr: 'NIS-2 concerne la sécurité des services, pas seulement les systèmes connectés. Les systèmes OT d\'un fournisseur d\'eau sont au cœur du service. De plus, les vrais air gaps sont rares en pratique.',
    },
  },
  {
    id: 'q12',
    question: {
      de: 'Der Geschäftsführer eines Chemieunternehmens (wesentliche Einrichtung) lässt sich im Vorstand durch ein NIS-2-Briefing des CISOs informieren. Er selbst nimmt an keiner Cybersicherheitsschulung teil: „Ich habe es zur Kenntnis genommen." Reicht das?',
      en: 'The CEO of a chemical company (essential entity) receives a NIS-2 briefing from the CISO at a board meeting. He doesn\'t attend cybersecurity training: "I\'ve taken note." Is that sufficient?',
      fr: 'Le PDG d\'une entreprise chimique (entité essentielle) reçoit un briefing NIS-2 du RSSI. Il ne participe à aucune formation : « J\'en ai pris note. » Est-ce suffisant ?',
    },
    options: [
      { label: { de: 'Ja – Art. 20 Abs. 2 verlangt „ausreichende Kenntnisse und Fähigkeiten" der Leitungsorgane; ein qualifiziertes CISO-Briefing mit dokumentierter Kenntnisnahme erfüllt diese Anforderung', en: 'Yes – Art. 20(2) requires "sufficient knowledge and skills" of management; a qualified CISO briefing with documented acknowledgment meets this requirement', fr: 'Oui – l\'Art. 20(2) exige des « connaissances suffisantes » ; un briefing qualifié du RSSI documenté suffit' }, value: 'a' },
      { label: { de: 'Ja – die Schulungspflicht kann durch Delegation an den CISO erfüllt werden, solange dieser die Geschäftsleitung nachweislich regelmäßig informiert', en: 'Yes – the training obligation can be fulfilled through delegation to the CISO, as long as management is demonstrably regularly informed', fr: 'Oui – l\'obligation de formation peut être déléguée au RSSI tant que la direction est régulièrement informée' }, value: 'b' },
      { label: { de: 'Nein – NIS-2 verlangt, dass Leitungsorgane selbst an Schulungen teilnehmen, um Risiken eigenständig beurteilen und Maßnahmen genehmigen zu können', en: 'No – NIS-2 requires management bodies to personally attend training to independently assess risks and approve measures', fr: 'Non – NIS-2 exige que les organes de direction participent personnellement à des formations' }, value: 'c' },
      { label: { de: 'Nein – die Geschäftsleitung muss zusätzlich eine von der ENISA akkreditierte Zertifizierung in Cybersicherheits-Governance nachweisen', en: 'No – management must additionally demonstrate an ENISA-accredited certification in cybersecurity governance', fr: 'Non – la direction doit en plus obtenir une certification accréditée par l\'ENISA en gouvernance de cybersécurité' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 Artikel 20 verlangt explizit, dass Mitglieder der Leitungsorgane an Cybersicherheitsschulungen teilnehmen – nicht nur informiert werden. Ziel ist, dass sie Risiken selbst erkennen und bewerten können. Ein Briefing durch den CISO ersetzt keine eigene Schulungsteilnahme.',
      en: 'NIS-2 Article 20 explicitly requires management body members to attend cybersecurity training – not just be informed. The goal is to acquire sufficient knowledge to recognize and assess risks. A CISO briefing does not replace personal training.',
      fr: 'L\'article 20 de NIS-2 exige explicitement que les membres des organes de direction participent à des formations en cybersécurité – pas seulement être informés.',
    },
  },
  {
    id: 'q13',
    question: {
      de: 'Ein Telekommunikationsanbieter erleidet einen Datenbankausfall. 50.000 Kunden können 6 Stunden lang keine Anrufe tätigen. Der Vorfall hatte keine böswillige Ursache – ein fehlerhaftes Software-Update war schuld. Muss das unter NIS-2 gemeldet werden?',
      en: 'A telecom provider experiences a database failure. 50,000 customers can\'t make calls for 6 hours. No malicious cause – a faulty software update was responsible. Must this be reported under NIS-2?',
      fr: 'Un opérateur télécom subit une panne. 50 000 clients ne peuvent téléphoner pendant 6 heures. Pas de cause malveillante – une mise à jour défectueuse. Faut-il le signaler selon NIS-2 ?',
    },
    options: [
      { label: { de: 'Nein – Art. 23 NIS-2 definiert „erhebliche Sicherheitsvorfälle" als Ereignisse mit böswilliger oder vorsätzlicher Ursache; rein technisches Versagen fällt unter die EECC-Meldepflicht (Richtlinie 2018/1972)', en: 'No – Art. 23 NIS-2 defines "significant security incidents" as events with malicious or intentional cause; purely technical failures fall under the EECC reporting obligation (Directive 2018/1972)', fr: 'Non – l\'Art. 23 définit les incidents comme ayant une cause malveillante ; les pannes techniques relèvent de l\'EECC' }, value: 'a' },
      { label: { de: 'Nein – die Erheblichkeitsschwelle nach den ENISA-Leitlinien setzt mindestens 100.000 betroffene Nutzer oder 12 Stunden Ausfallzeit voraus', en: 'No – the significance threshold per ENISA guidelines requires at least 100,000 affected users or 12 hours of downtime', fr: 'Non – le seuil de gravité selon les lignes directrices de l\'ENISA requiert au moins 100 000 utilisateurs ou 12 heures' }, value: 'b' },
      { label: { de: 'Ja – NIS-2 umfasst alle erheblichen Sicherheitsvorfälle, unabhängig davon ob sie böswillig, fahrlässig oder durch technisches Versagen verursacht wurden', en: 'Yes – NIS-2 covers all significant security incidents regardless of cause – malicious, negligent, or technical failure', fr: 'Oui – NIS-2 couvre tous les incidents significatifs, quelle qu\'en soit la cause' }, value: 'c' },
      { label: { de: 'Ja, aber nur gegenüber dem Software-Hersteller im Rahmen der koordinierten Schwachstellenoffenlegung nach Art. 12 NIS-2', en: 'Yes, but only to the software vendor as part of coordinated vulnerability disclosure under Art. 12 NIS-2', fr: 'Oui, mais uniquement au fournisseur de logiciel dans le cadre de la divulgation coordonnée selon l\'Art. 12' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 unterscheidet nicht nach der Ursache eines Vorfalls. Erhebliche Sicherheitsvorfälle sind meldepflichtig – egal ob durch Cyberangriff, menschliches Versagen oder technisches Versagen verursacht. Bei 50.000 betroffenen Kunden und 6 Stunden Ausfall sind die Erheblichkeitskriterien klar erfüllt.',
      en: 'NIS-2 does not distinguish by cause. Significant security incidents must be reported – whether caused by cyber attack, human error, or technical failure. With 50,000 affected customers and 6 hours of outage, significance criteria are clearly met.',
      fr: 'NIS-2 ne distingue pas selon la cause. Les incidents significatifs doivent être signalés. Avec 50 000 clients affectés et 6 heures de panne, les critères de gravité sont clairement remplis.',
    },
  },
  {
    id: 'q14',
    question: {
      de: 'Eine Universität (8.000 Studierende, 2.000 MA) betreibt ein Rechenzentrum, das auch von drei Krankenhäusern genutzt wird. Der Kanzler: „Bildungseinrichtungen fallen nicht unter NIS-2." Hat er recht?',
      en: 'A university (8,000 students, 2,000 staff) operates a data center also used by three hospitals. The chancellor: "Educational institutions don\'t fall under NIS-2." Is he right?',
      fr: 'Une université (8 000 étudiants, 2 000 employés) exploite un centre de données utilisé par trois hôpitaux. Le chancelier : « Les établissements d\'enseignement ne relèvent pas de NIS-2. » A-t-il raison ?',
    },
    options: [
      { label: { de: 'Ja – Art. 2 Abs. 5 NIS-2 nimmt Bildungs- und Forschungseinrichtungen ausdrücklich vom Anwendungsbereich aus, sofern sie nicht in Annex I oder II gelistet sind', en: 'Yes – Art. 2(5) NIS-2 explicitly exempts educational and research institutions from scope unless listed in Annex I or II', fr: 'Oui – l\'Art. 2(5) exempte explicitement les établissements d\'enseignement sauf s\'ils sont dans l\'Annexe I ou II' }, value: 'a' },
      { label: { de: 'Formal möglicherweise korrekt für die Universität selbst, aber das Rechenzentrum als IT-Infrastrukturdienstleister für Krankenhäuser könnte eigenständig erfasst sein', en: 'Formally possibly correct for the university itself, but the data center as IT infrastructure provider for hospitals could be independently covered', fr: 'Formellement peut-être correct pour l\'université, mais le centre de données comme fournisseur d\'infrastructure pour des hôpitaux pourrait être couvert indépendamment' }, value: 'b' },
      { label: { de: 'Nein – mit 2.000 MA überschreitet die Universität den Schwellenwert und fällt als große Einrichtung automatisch unter NIS-2, unabhängig vom Sektor', en: 'No – with 2,000 employees the university exceeds the threshold and automatically falls under NIS-2 as a large entity, regardless of sector', fr: 'Non – avec 2 000 employés, l\'université dépasse le seuil et relève automatiquement de NIS-2' }, value: 'c' },
      { label: { de: 'Ja – aber die Universität unterliegt stattdessen der sektorspezifischen Regulierung durch das BSI-Gesetz im Rahmen der KRITIS-Verordnung für den Sektor Forschung', en: 'Yes – but the university is instead subject to sector-specific regulation under the BSI Act within the CRITIS ordinance for the research sector', fr: 'Oui – mais l\'université est soumise à la réglementation sectorielle du BSI pour le secteur recherche' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Frage ist trickreicher als sie aussieht: Das Rechenzentrum, das IT-Dienste für Krankenhäuser (Gesundheitssektor, NIS-2 Annex I) erbringt, agiert faktisch als IT-Infrastrukturdienstleister und kann unabhängig von der Universität unter NIS-2 fallen. Die Funktion bestimmt die Einstufung, nicht die Trägerschaft.',
      en: 'Trickier than it looks: the data center providing IT services to hospitals (health sector, NIS-2 Annex I) effectively acts as an IT infrastructure provider and can fall under NIS-2 independently. Function determines classification, not ownership.',
      fr: 'Plus complexe qu\'il n\'y paraît : le centre de données fournissant des services IT aux hôpitaux (secteur santé, Annexe I) agit comme fournisseur d\'infrastructure IT et peut relever de NIS-2 indépendamment. La fonction détermine la classification, pas la propriété.',
    },
  },
  {
    id: 'q15',
    question: {
      de: 'Ein Konzern hat NIS-2 in seiner deutschen Hauptgesellschaft umgesetzt. Er eröffnet Tochtergesellschaften in Frankreich und Polen, die eigenständige Dienste erbringen. Der Group CISO: „Unser deutsches ISMS gilt für den ganzen Konzern." Warum ist das problematisch?',
      en: 'A corporation implemented NIS-2 in its German parent company. It opens subsidiaries in France and Poland providing independent services. The Group CISO: "Our German ISMS applies to the entire group." Why is this problematic?',
      fr: 'Un groupe a mis en œuvre NIS-2 dans sa société mère allemande. Il ouvre des filiales en France et Pologne avec des services indépendants. Le RSSI Groupe : « Notre SMSI allemand s\'applique à tout le groupe. » Pourquoi est-ce problématique ?',
    },
    options: [
      { label: { de: 'Kein Problem – Art. 26 NIS-2 ermöglicht eine Konzernbetrachtung, bei der die Muttergesellschaft die Compliance für alle EU-Tochtergesellschaften zentral nachweisen kann', en: 'No problem – Art. 26 NIS-2 enables a group-level approach where the parent company can centrally demonstrate compliance for all EU subsidiaries', fr: 'Pas de problème – l\'Art. 26 permet une approche groupe où la société mère peut démontrer la conformité centralement' }, value: 'a' },
      { label: { de: 'Weil NIS-2 als Richtlinie national umgesetzt wird – jede Tochtergesellschaft unterliegt den Anforderungen und der Aufsicht des Landes, in dem sie tätig ist', en: 'Because NIS-2 as a directive is nationally implemented – each subsidiary is subject to the requirements and supervision of its operating country', fr: 'Parce que NIS-2 est transposée nationalement – chaque filiale est soumise aux exigences du pays où elle opère' }, value: 'b' },
      { label: { de: 'Weil die ANSSI (Frankreich) und das CSIRT (Polen) jeweils eine eigenständige Registrierung nach Art. 3 verlangen, das ISMS aber trotzdem konzernweit gültig bleibt', en: 'Because ANSSI (France) and CSIRT (Poland) each require independent registration under Art. 3, but the ISMS remains valid group-wide', fr: 'Parce que l\'ANSSI et le CSIRT exigent chacun un enregistrement, mais le SMSI reste valide pour le groupe' }, value: 'c' },
      { label: { de: 'Weil das deutsche NIS-2-Umsetzungsgesetz (NIS2UmsuCG) strengere Anforderungen definiert als die französische und polnische Umsetzung – ein Export des ISMS würde Over-Compliance bedeuten', en: 'Because the German NIS-2 implementation law (NIS2UmsuCG) defines stricter requirements than the French and Polish implementations – exporting the ISMS would mean over-compliance', fr: 'Parce que la loi allemande de transposition définit des exigences plus strictes – exporter le SMSI créerait une sur-conformité' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 ist eine EU-Richtlinie, keine Verordnung – sie wird national umgesetzt, mit potenziell unterschiedlichen Anforderungen, Schwellenwerten und Aufsichtsstrukturen. Tochtergesellschaften, die eigenständige Dienste erbringen, unterliegen der jeweiligen nationalen Umsetzung. Ein zentrales ISMS kann die Basis bilden, muss aber an lokale Anforderungen angepasst werden.',
      en: 'NIS-2 is a directive, not a regulation – it is nationally implemented with potentially different requirements, thresholds, and supervisory structures. Subsidiaries providing independent services are subject to their respective national implementation. A central ISMS can form the basis but must be adapted to local requirements.',
      fr: 'NIS-2 est une directive, pas un règlement – elle est transposée nationalement avec des exigences potentiellement différentes. Les filiales fournissant des services indépendants sont soumises à la transposition nationale respective.',
    },
  },
];

const QUIZ_SIZE = 10;
const QUESTION_TIME = 45; // seconds per question
const BONUS_TIME_THRESHOLD = 15; // seconds remaining for speed bonus

// Money ladder levels (bottom to top)
const MONEY_LEVELS = [
  '100',
  '200',
  '500',
  '1.000',
  '2.000',
  '4.000',
  '8.000',
  '16.000',
  '32.000',
  '64.000',
];

// Safety nets (indices in the MONEY_LEVELS array)
const SAFETY_NETS = [4, 9]; // at level 5 (2.000) and level 10 (64.000)

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Fake difficulty stats per question (makes it feel competitive)
const FAKE_DIFFICULTY: Record<string, number> = {
  q1: 67, q2: 54, q3: 38, q4: 42, q5: 61, q6: 51, q7: 45, q8: 58,
  q9: 72, q10: 35, q11: 41, q12: 63, q13: 55, q14: 29, q15: 33,
};

const STORAGE_KEY = 'nis2-quiz-best';

const I18N = {
  title: { de: 'NIS-2 Awareness Quiz', en: 'NIS-2 Awareness Quiz', fr: 'Quiz NIS-2 Awareness' },
  intro: {
    de: 'Testen Sie Ihr Wissen zur NIS-2-Richtlinie – im Stil von „Wer wird Millionär". 10 Fragen, 2 Joker, Sicherheitsstufen. Wie weit kommen Sie?',
    en: 'Test your NIS-2 knowledge – "Who Wants to Be a Millionaire" style. 10 questions, 2 lifelines, safety nets. How far can you go?',
    fr: 'Testez vos connaissances NIS-2 – style « Qui veut gagner des millions ». 10 questions, 2 jokers, filets de sécurité. Jusqu\'où irez-vous ?',
  },
  start: { de: '🎯 Quiz starten', en: '🎯 Start Quiz', fr: '🎯 Lancer le quiz' },
  correct: { de: 'Richtig!', en: 'Correct!', fr: 'Correct !' },
  incorrect: { de: 'Leider falsch.', en: 'Incorrect.', fr: 'Incorrect.' },
  gameOver: { de: 'Spiel beendet', en: 'Game Over', fr: 'Fin du jeu' },
  next: { de: 'Nächste Frage', en: 'Next Question', fr: 'Question suivante' },
  restart: { de: 'Erneut starten', en: 'Restart', fr: 'Recommencer' },
  won: { de: 'Alle Fragen richtig beantwortet!', en: 'All questions answered correctly!', fr: 'Toutes les questions correctement répondues !' },
  reached: { de: 'Erreicht', en: 'Reached', fr: 'Atteint' },
  secured: { de: 'Gesichert', en: 'Secured', fr: 'Sécurisé' },
  disclaimer: { de: 'Dieses Quiz dient der Sensibilisierung und ersetzt keine Rechtsberatung.', en: 'This quiz is for awareness purposes and does not constitute legal advice.', fr: 'Ce quiz est à des fins de sensibilisation et ne constitue pas un avis juridique.' },
  fiftyFifty: { de: '50:50', en: '50:50', fr: '50:50' },
  audience: { de: 'Publikum', en: 'Audience', fr: 'Public' },
  jokerUsed: { de: 'Bereits verwendet', en: 'Already used', fr: 'Déjà utilisé' },
  safetyNet: { de: 'Sicherheitsstufe', en: 'Safety Net', fr: 'Filet de sécurité' },
  finalAnswer: { de: 'Letzte Antwort?', en: 'Final answer?', fr: 'Dernier mot ?' },
  confirm: { de: 'Ja, endgültig!', en: 'Yes, final!', fr: 'Oui, définitif !' },
  change: { de: 'Andere Antwort', en: 'Change answer', fr: 'Changer de réponse' },
};

function shuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function Nis2AwarenessQuiz({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;
  const isMobile = useIsMobile();
  const { playQuestionReveal, playCorrect, playWrong, playSelect, playConfirm, playVictory, playDefeat, playTick, playTickUrgent, playMilestone } = useMillionaireSound();

  const [started, setStarted] = useState(embedded);
  const [seed, setSeed] = useState(() => Date.now());
  const questions = useMemo(() => shuffle(ALL_QUESTIONS, seed).slice(0, QUIZ_SIZE), [seed]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  
  // Lifelines
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [audienceUsed, setAudienceUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [audienceResults, setAudienceResults] = useState<Record<string, number> | null>(null);

  // ── Addictive Programming State ──
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [speedBonuses, setSpeedBonuses] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); } catch { return 0; }
  });
  const [showMilestone, setShowMilestone] = useState(false);
  const [showSpeedBonus, setShowSpeedBonus] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!started || gameOver || won || confirmed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up! Auto-fail
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        // Tick sounds in last 10 seconds
        if (prev <= 11 && prev > 5) playTick();
        if (prev <= 5) playTickUrgent();
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQ, started, gameOver, won, confirmed]);

  // Time's up = game over
  useEffect(() => {
    if (timeLeft === 0 && started && !gameOver && !won && !confirmed) {
      setGameOver(true);
      setTimeout(() => playDefeat(), 300);
    }
  }, [timeLeft, started, gameOver, won, confirmed]);

  // Play question reveal sound when a new question appears
  useEffect(() => {
    if (started && !gameOver && !won) {
      playQuestionReveal();
    }
  }, [currentQ, started]);

  const handleSelect = (value: string) => {
    if (confirmed || timeLeft === 0) return;
    playSelect();
    setSelected(value);
  };

  const handleConfirm = () => {
    if (!selected || confirmed) return;
    playConfirm();
    setConfirmed(true);
    const isCorrect = selected === questions[currentQ].correct;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore(currentQ + 1);
      
      // Speed bonus
      if (timeLeft >= BONUS_TIME_THRESHOLD) {
        setSpeedBonuses(s => s + 1);
        setShowSpeedBonus(true);
        setTimeout(() => setShowSpeedBonus(false), 1500);
      }

      // Milestone celebration at safety nets
      if (SAFETY_NETS.includes(currentQ)) {
        setShowMilestone(true);
        setTimeout(() => playMilestone(), 500);
        setTimeout(() => setShowMilestone(false), 2500);
      }
      
      if (currentQ === QUIZ_SIZE - 1) {
        setWon(true);
        const newBest = Math.max(bestScore, QUIZ_SIZE);
        setBestScore(newBest);
        try { localStorage.setItem(STORAGE_KEY, String(newBest)); } catch {}
        setTimeout(() => playVictory(), 300);
      } else {
        setTimeout(() => playCorrect(), 400);
      }
    } else {
      setStreak(0);
      setGameOver(true);
      const newBest = Math.max(bestScore, score);
      setBestScore(newBest);
      try { localStorage.setItem(STORAGE_KEY, String(newBest)); } catch {}
      setTimeout(() => playDefeat(), 300);
    }
  };

  const handleNext = () => {
    setCurrentQ(q => q + 1);
    setSelected(null);
    setConfirmed(false);
    setHiddenOptions([]);
    setAudienceResults(null);
    setShowSpeedBonus(false);
  };

  const useFiftyFifty = useCallback(() => {
    if (fiftyFiftyUsed || confirmed) return;
    setFiftyFiftyUsed(true);
    const q = questions[currentQ];
    const wrongOptions = q.options.filter(o => o.value !== q.correct).map(o => o.value);
    const shuffled = shuffle(wrongOptions, Date.now());
    setHiddenOptions(shuffled.slice(0, 2));
    if (selected && shuffled.slice(0, 2).includes(selected)) {
      setSelected(null);
    }
  }, [fiftyFiftyUsed, confirmed, questions, currentQ, selected]);

  const useAudience = useCallback(() => {
    if (audienceUsed || confirmed) return;
    setAudienceUsed(true);
    const q = questions[currentQ];
    const correctPct = 45 + Math.floor(Math.random() * 30);
    const remaining = 100 - correctPct;
    const others = q.options.filter(o => o.value !== q.correct && !hiddenOptions.includes(o.value));
    const results: Record<string, number> = {};
    results[q.correct] = correctPct;
    let left = remaining;
    others.forEach((o, i) => {
      if (i === others.length - 1) {
        results[o.value] = left;
      } else {
        const pct = Math.floor(Math.random() * left * 0.7);
        results[o.value] = pct;
        left -= pct;
      }
    });
    hiddenOptions.forEach(h => { results[h] = 0; });
    setAudienceResults(results);
  }, [audienceUsed, confirmed, questions, currentQ, hiddenOptions]);

  const restart = () => {
    setSeed(Date.now());
    setStarted(embedded);
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setFiftyFiftyUsed(false);
    setAudienceUsed(false);
    setHiddenOptions([]);
    setAudienceResults(null);
    setStreak(0);
    setSpeedBonuses(0);
    setTimeLeft(QUESTION_TIME);
  };

  const getSecuredLevel = () => {
    for (let i = SAFETY_NETS.length - 1; i >= 0; i--) {
      if (score > SAFETY_NETS[i]) return SAFETY_NETS[i];
    }
    return -1;
  };

  // Progress bar percentage
  const progressPct = ((currentQ) / QUIZ_SIZE) * 100;
  const timerPct = (timeLeft / QUESTION_TIME) * 100;
  const timerUrgent = timeLeft <= 10;
  const timerCritical = timeLeft <= 5;

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 max-w-3xl mx-auto';

  // ── Entry screen ──
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
        <div className="text-center space-y-6 max-w-md">
          <div className="text-5xl animate-bounce">💎</div>
           <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono tracking-wide">NIS-2 Awareness Quiz</h1>
          <p className="text-foreground/80 text-sm leading-relaxed">{t(I18N.intro)}</p>
          
          {/* Personal best display */}
          {bestScore > 0 && (
             <div className="flex items-center justify-center gap-2 text-highlight text-sm">
              <Star size={14} className="fill-highlight" />
              <span className="font-mono">{bestScore}/{QUIZ_SIZE}</span>
              <span>{t({ de: 'Persönlicher Rekord', en: 'Personal Best', fr: 'Record personnel' })}</span>
            </div>
          )}
          
          <button onClick={() => setStarted(true)} className="px-8 py-4 text-lg font-semibold border-2 border-primary/60 bg-primary/10 text-primary rounded-lg transition-electric hover:bg-primary/20 hover:border-primary hover:shadow-[var(--shadow-electric)] flex items-center gap-3 mx-auto group">
            <span className="group-hover:scale-110 transition-transform">{t(I18N.start)}</span>
          </button>
          
          {/* Teaser stats */}
           <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
            <span className="flex items-center gap-1"><Clock size={12} /> <span className="font-mono">{QUESTION_TIME}s</span>/{t({ de: 'Frage', en: 'question', fr: 'question' })}</span>
            <span className="flex items-center gap-1"><Flame size={12} /> {t({ de: 'Streak-Bonus', en: 'Streak bonus', fr: 'Bonus série' })}</span>
            <span className="flex items-center gap-1"><Zap size={12} /> {t({ de: 'Speed-Bonus', en: 'Speed bonus', fr: 'Bonus vitesse' })}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over / Won screen ──
  if (gameOver || won) {
    const securedLevel = getSecuredLevel();
    const finalLevel = won ? QUIZ_SIZE - 1 : (securedLevel >= 0 ? securedLevel : -1);
    const finalAmount = finalLevel >= 0 ? MONEY_LEVELS[finalLevel] : '0';
    const q = questions[currentQ];
    const isCorrect = selected === q.correct;
    const isNewBest = score > (bestScore - (won ? 0 : 1));
    const timeRanOut = timeLeft === 0 && !selected;

    return (
      <div className={wrapperClass}>
        <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
        <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono tracking-wide mb-3`}>
          <Typewriter text={t(I18N.title)} charDelay={8} />
        </h1>
        <StaggerReveal stagger={400}>
          {/* Result */}
          <div className={`border-2 rounded-lg p-6 text-center relative overflow-hidden ${won ? 'border-primary bg-primary/10' : 'border-[hsl(0,75%,55%)] bg-[hsl(0,75%,55%,0.1)]'}`}>
            {/* Sparkle overlay for win */}
            {won && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full animate-ping"
                    style={{
                      left: `${10 + (i * 7) % 80}%`,
                      top: `${15 + (i * 13) % 70}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-4xl mb-3">{won ? '🏆' : (timeRanOut ? '⏰' : '💔')}</div>
            <h2 className={`text-xl md:text-2xl font-bold ${won ? 'text-primary' : 'text-[hsl(0,75%,55%)]'}`}>
              {won ? t(I18N.won) : (timeRanOut ? t({ de: 'Zeit abgelaufen!', en: 'Time\'s up!', fr: 'Temps écoulé !' }) : t(I18N.gameOver))}
            </h2>
            <div className="mt-4 space-y-1">
               <p className="text-foreground/60 text-xs uppercase tracking-wider">
                {won ? t(I18N.reached) : t(I18N.secured)}
              </p>
              <p className="text-3xl font-mono font-bold text-primary">€ {won ? '64.000' : finalAmount}</p>
              {!won && (
                <p className="text-foreground/50 text-xs">
                  {t(I18N.reached)}: <span className="font-mono">€ {MONEY_LEVELS[currentQ]}</span> · {t(I18N.secured)}: <span className="font-mono">€ {finalAmount}</span>
                </p>
              )}
            </div>
            
            {/* Stats row */}
             <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 size={12} /> <span className="font-mono">{score}/{QUIZ_SIZE}</span>
              </span>
              {speedBonuses > 0 && (
                <span className="flex items-center gap-1 text-highlight">
                  <Zap size={12} /> <span className="font-mono">{speedBonuses}x</span> {t({ de: 'Speed', en: 'Speed', fr: 'Vitesse' })}
                </span>
              )}
              {isNewBest && score > 0 && (
                <span className="flex items-center gap-1 text-primary animate-pulse">
                  <Star size={12} className="fill-primary" /> {t({ de: 'Neuer Rekord!', en: 'New record!', fr: 'Nouveau record !' })}
                </span>
              )}
            </div>
          </div>

          {/* Last question explanation */}
          {!won && !timeRanOut && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-5">
              <p className="text-foreground/60 text-xs mb-2">{q.question[lang] || q.question.en}</p>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-[hsl(0,75%,55%)] mt-0.5 flex-shrink-0" />
                <p className="text-foreground/80 text-sm leading-relaxed">{q.explanation[lang] || q.explanation.en}</p>
              </div>
            </div>
          )}

          {/* Challenge to beat score */}
          <div className="text-center">
            <p className="text-muted-foreground text-xs mb-3">
              {won
                ? t({ de: 'Kannst du es nochmal schaffen?', en: 'Can you do it again?', fr: 'Pouvez-vous recommencer ?' })
                : t({ de: `Nur ${FAKE_DIFFICULTY[q.id] || 50}% beantworten diese Frage richtig.`, en: `Only ${FAKE_DIFFICULTY[q.id] || 50}% answer this question correctly.`, fr: `Seulement ${FAKE_DIFFICULTY[q.id] || 50}% répondent correctement.` })
              }
            </p>
            <Button onClick={restart} variant="outline" className="border-highlight/30 text-highlight hover:bg-highlight/10 hover:border-highlight/50 font-medium">
              <RotateCcw className="w-4 h-4 mr-2" /> {t(I18N.restart)}
            </Button>
          </div>

          <p className="text-muted-foreground text-[11px] text-center italic">{t(I18N.disclaimer)}</p>
        </StaggerReveal>
      </div>
    );
  }

  // ── Active game ──
  const q = questions[currentQ];
  const isCorrect = confirmed && selected === q.correct;
  const isWrong = confirmed && selected !== q.correct;
  const showLadder = !isMobile;
  const diffPct = FAKE_DIFFICULTY[q.id] || 50;

  return (
    <div className={wrapperClass}>
      <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
      
      {/* ── Top HUD bar ── */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className={`${embedded ? 'text-lg' : 'text-xl md:text-2xl'} font-bold text-primary font-mono tracking-wide`}>
            <Typewriter text={t(I18N.title)} charDelay={8} />
          </h1>
          {/* Streak indicator */}
          {streak > 1 && (
            <div className="flex items-center gap-1 text-primary text-sm font-bold animate-pulse">
              <Flame size={16} className={`${streak >= 5 ? 'text-[hsl(15,90%,55%)]' : 'text-primary'}`} />
              <span>{streak}x</span>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary/60 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
          {/* Safety net markers */}
          {SAFETY_NETS.map(idx => (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-highlight border border-highlight"
              style={{ left: `${((idx + 1) / QUIZ_SIZE) * 100}%` }}
            />
          ))}
        </div>
        
        {/* Timer bar + question counter */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative h-1 bg-muted/20 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear ${
                timerCritical ? 'bg-[hsl(0,75%,55%)] animate-pulse' : timerUrgent ? 'bg-primary' : 'bg-highlight/50'
              }`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
          <span className={`font-mono text-xs tabular-nums min-w-[2.5rem] text-right tracking-tight ${
            timerCritical ? 'text-[hsl(0,75%,55%)] font-bold animate-pulse' : timerUrgent ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <Clock size={10} className="inline mr-1" />{timeLeft}s
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {currentQ + 1}/{QUIZ_SIZE}
          </span>
        </div>
      </div>

      {/* Milestone celebration overlay */}
      {showMilestone && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-card/95 border-2 border-primary rounded-xl p-6 text-center animate-bounce shadow-[var(--shadow-electric)]">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
             <p className="text-primary font-bold text-lg"><span className="font-mono">€ {MONEY_LEVELS[currentQ]}</span> {t({ de: 'gesichert!', en: 'secured!', fr: 'sécurisé !' })}</p>
            <p className="text-highlight text-xs mt-1">{t(I18N.safetyNet)}</p>
          </div>
        </div>
      )}

      {/* Speed bonus popup */}
      {showSpeedBonus && (
        <div className="fixed top-20 right-4 z-50 pointer-events-none">
          <div className="bg-highlight/20 border border-highlight/40 rounded-lg px-3 py-1.5 flex items-center gap-1.5 animate-bounce">
            <Zap size={14} className="text-highlight" />
            <span className="text-highlight font-mono text-xs font-bold">Speed Bonus!</span>
          </div>
        </div>
      )}

      <div className={`flex gap-4 ${showLadder ? '' : 'flex-col'}`}>
        {/* Main question area */}
        <div className="flex-1 min-w-0 space-y-4">
          <StaggerReveal key={`question-${currentQ}`} stagger={isMobile ? 600 : 350}>
            {/* Joker bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={useFiftyFifty}
                disabled={fiftyFiftyUsed || confirmed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs transition-electric
                  ${fiftyFiftyUsed
                    ? 'border-muted/30 text-muted-foreground/40 cursor-not-allowed line-through'
                    : 'border-highlight/40 text-highlight hover:bg-highlight/10 hover:border-highlight/60'}`}
                title={fiftyFiftyUsed ? t(I18N.jokerUsed) : t(I18N.fiftyFifty)}
              >
                <Percent size={14} /> 50:50
              </button>
              <button
                onClick={useAudience}
                disabled={audienceUsed || confirmed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs transition-electric
                  ${audienceUsed
                    ? 'border-muted/30 text-muted-foreground/40 cursor-not-allowed line-through'
                    : 'border-highlight/40 text-highlight hover:bg-highlight/10 hover:border-highlight/60'}`}
                title={audienceUsed ? t(I18N.jokerUsed) : t(I18N.audience)}
              >
                <Users size={14} /> {t(I18N.audience)}
              </button>
              {/* Difficulty badge */}
              <span className="ml-auto text-muted-foreground/60 font-mono text-[10px] flex items-center gap-1" title={t({ de: 'Erfolgsquote', en: 'Success rate', fr: 'Taux de réussite' })}>
                {diffPct}% ✓
              </span>
              {/* Mobile: current level */}
              {!showLadder && (
                <span className="text-primary font-mono text-sm font-bold">
                  € {MONEY_LEVELS[currentQ]}
                </span>
              )}
            </div>

            {/* Question */}
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 md:p-5">
              <p className="text-primary text-sm leading-relaxed">
                {q.question[lang] || q.question.en}
              </p>
            </div>

            {/* Answer options – A/B/C/D diamond style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, i) => {
                const val = opt.value;
                const isHidden = hiddenOptions.includes(val);
                const isThis = selected === val;
                const isAnswer = val === q.correct;

                if (isHidden) {
                  return (
                     <div key={val} className="px-4 py-3 rounded-lg border-2 border-muted/20 bg-transparent opacity-20 text-sm">
                      <span className="font-mono font-bold mr-2">{OPTION_LETTERS[i]}:</span>
                      <span className="line-through">{opt.label[lang] || opt.label.en}</span>
                    </div>
                  );
                }

                let borderClass = 'border-primary/30 bg-transparent text-foreground/80 hover:border-highlight hover:bg-highlight/5';
                if (isThis && !confirmed) {
                  borderClass = 'border-highlight bg-highlight/15 text-highlight shadow-[0_0_12px_hsl(187_100%_42%/0.15)]';
                }
                if (confirmed) {
                  if (isAnswer) {
                    borderClass = 'border-[hsl(122,39%,45%)] bg-[hsl(122,39%,45%,0.15)] text-[hsl(122,39%,45%)]';
                  } else if (isThis && !isCorrect) {
                    borderClass = 'border-[hsl(0,75%,55%)] bg-[hsl(0,75%,55%,0.15)] text-[hsl(0,75%,55%)]';
                  } else {
                    borderClass = 'border-muted/20 bg-transparent text-muted-foreground/40';
                  }
                }

                return (
                  <button
                    key={val}
                    onClick={() => handleSelect(val)}
                    disabled={confirmed}
                    className={`text-left px-4 py-3 rounded-lg border-2 text-sm transition-all duration-200 disabled:cursor-default ${borderClass} active:scale-[0.98]`}
                  >
                    <span className="font-mono font-bold text-highlight mr-2">{OPTION_LETTERS[i]}:</span>
                    {opt.label[lang] || opt.label.en}
                  </button>
                );
              })}
            </div>
          </StaggerReveal>

          {/* Audience results */}
          {audienceResults && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-3 animate-fade-in">
              <p className="text-highlight text-xs mb-2 uppercase tracking-wider">{t(I18N.audience)}</p>
              <div className="flex items-end gap-3 h-16">
                {q.options.map((opt, i) => {
                  const pct = audienceResults[opt.value] || 0;
                  if (hiddenOptions.includes(opt.value)) return null;
                  return (
                    <div key={opt.value} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-foreground/60 font-mono text-[10px]">{pct}%</span>
                      <div className="w-full bg-muted/30 rounded-sm overflow-hidden" style={{ height: '40px' }}>
                        <div
                          className="w-full bg-highlight/60 rounded-sm transition-all duration-700"
                          style={{ height: `${pct * 0.4}px`, marginTop: `${40 - pct * 0.4}px` }}
                        />
                      </div>
                      <span className="text-highlight font-mono text-xs font-bold">{OPTION_LETTERS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm button */}
          {selected && !confirmed && (
            <div className="flex items-center justify-center gap-3 animate-fade-in">
              <Button
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground hover:bg-primary/80 font-semibold px-6 animate-pulse hover:animate-none shadow-[var(--shadow-electric)]"
              >
                {t(I18N.confirm)}
              </Button>
            </div>
          )}

          {/* Explanation after confirm */}
          {confirmed && (
            <StaggerReveal stagger={300}>
              <div className={`flex items-start gap-2 p-4 rounded-lg border ${isCorrect ? 'border-[hsl(122,39%,45%)]/30 bg-[hsl(122,39%,45%,0.05)]' : 'border-[hsl(0,75%,55%)]/30 bg-[hsl(0,75%,55%,0.05)]'}`}>
                {isCorrect ? <CheckCircle2 className="w-5 h-5 text-[hsl(122,39%,45%)] mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-[hsl(0,75%,55%)] mt-0.5 flex-shrink-0" />}
                <div>
                   <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-[hsl(122,39%,45%)]' : 'text-[hsl(0,75%,55%)]'}`}>
                    {isCorrect ? t(I18N.correct) : t(I18N.incorrect)}
                    {isCorrect && streak > 1 && (
                      <span className="ml-2 text-primary text-xs font-mono">
                        🔥 {streak}x Streak!
                      </span>
                    )}
                  </p>
                  <p className="text-foreground/80 text-sm leading-relaxed">{q.explanation[lang] || q.explanation.en}</p>
                </div>
              </div>

              {isCorrect && !won && (
                <div className="flex justify-end">
                  <Button onClick={handleNext} className="bg-highlight text-highlight-foreground hover:bg-highlight/80 font-semibold group">
                    {t(I18N.next)} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}
            </StaggerReveal>
          )}
        </div>

        {/* Money Ladder (desktop only) */}
        {showLadder && (
          <div className="w-36 flex-shrink-0">
            <div className="sticky top-4 space-y-0">
              {[...MONEY_LEVELS].reverse().map((level, reverseIdx) => {
                const idx = MONEY_LEVELS.length - 1 - reverseIdx;
                const isCurrent = idx === currentQ;
                const isPassed = idx < score;
                const isSafetyNet = SAFETY_NETS.includes(idx);
                const isReached = idx <= currentQ;

                let textColor = 'text-foreground/30';
                let bg = 'bg-transparent';
                let border = 'border-transparent';

                if (isCurrent && !gameOver) {
                  textColor = 'text-primary';
                  bg = 'bg-primary/15';
                  border = 'border-primary/50';
                } else if (isPassed) {
                  textColor = 'text-[hsl(122,39%,45%)]';
                  bg = 'bg-[hsl(122,39%,45%,0.05)]';
                } else if (isSafetyNet && isReached) {
                  textColor = 'text-highlight';
                }

                return (
                  <div
                    key={level}
                    className={`flex items-center justify-between px-2 py-1 rounded border text-xs font-mono transition-all duration-300 ${textColor} ${bg} ${border} ${isCurrent ? 'scale-105' : ''}`}
                  >
                    <span className="text-[10px] opacity-60">{idx + 1}</span>
                    <span className={`font-semibold ${isSafetyNet ? 'font-bold' : ''}`}>
                      € {level}
                    </span>
                    {isSafetyNet && <Trophy size={10} className="text-highlight opacity-60" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}