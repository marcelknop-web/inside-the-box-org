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
      { label: { de: 'NIS-2 betrifft die Sicherheit der Dienste, nicht einzelner Netzwerksegmente – wenn die Wasserversorgung von OT abhängt, ist auch das OT-Netz im Scope', en: 'NIS-2 concerns the security of services, not individual network segments – if water supply depends on OT, the OT network is also in scope', fr: 'NIS-2 concerne la sécurité des services, pas des segments réseau individuels – si l\'approvisionnement en eau dépend de l\'OT, le réseau OT est aussi dans le périmètre' }, value: 'b' },
      { label: { de: 'Der Air Gap ist ausreichend, aber NIS-2 verlangt eine dokumentierte Risikoanalyse, die beweist, dass die Trennung wirksam ist und regelmäßig getestet wird', en: 'The air gap is sufficient, but NIS-2 requires a documented risk analysis proving the separation is effective and regularly tested', fr: 'L\'air gap est suffisant, mais NIS-2 exige une analyse de risque documentée prouvant l\'efficacité de la séparation' }, value: 'c' },
      { label: { de: 'NIS-2 erfasst OT-Systeme nur bei Betreibern kritischer Infrastruktur nach dem KRITIS-Dachgesetz – ein normaler Wasserversorger unter den KRITIS-Schwellenwerten ist nicht betroffen', en: 'NIS-2 only covers OT systems at critical infrastructure operators under the CRITIS umbrella law – a normal water utility below CRITIS thresholds is not affected', fr: 'NIS-2 ne couvre les systèmes OT que chez les opérateurs d\'infrastructure critique – un fournisseur d\'eau normal n\'est pas concerné' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 adressiert die Sicherheit der erbrachten Dienste, nicht einzelner Netzwerksegmente. Wenn die Wasserversorgung (wesentlicher Dienst) von OT-Systemen abhängt, fallen diese in den Scope – unabhängig davon, ob sie mit dem Internet verbunden sind. Zudem sind echte Air Gaps in der Praxis selten; USB-Transfers, Wartungszugänge und Updates schaffen regelmäßig Brücken.',
      en: 'NIS-2 addresses the security of services provided, not individual network segments. If water supply (essential service) depends on OT systems, they\'re in scope – regardless of internet connectivity. Moreover, true air gaps are rare in practice; USB transfers, maintenance access, and updates regularly create bridges.',
      fr: 'NIS-2 adresse la sécurité des services fournis, pas des segments réseau individuels. Si l\'approvisionnement en eau dépend des systèmes OT, ils sont dans le périmètre.',
    },
  },
  {
    id: 'q12',
    question: {
      de: 'Ein Unternehmen führt Penetrationstests durch einen externen Dienstleister durch. Die Ergebnisse zeigen 47 Schwachstellen, davon 3 kritische. Der CISO priorisiert die Behebung nach CVSS-Score. Was übersieht er aus NIS-2-Perspektive?',
      en: 'A company runs pen tests through an external provider. Results show 47 vulnerabilities, 3 critical. The CISO prioritizes remediation by CVSS score. What\'s he missing from a NIS-2 perspective?',
      fr: 'Une entreprise fait des tests de pénétration. Les résultats montrent 47 vulnérabilités, dont 3 critiques. Le RSSI priorise par score CVSS. Qu\'oublie-t-il du point de vue NIS-2 ?',
    },
    options: [
      { label: { de: 'Nichts – CVSS-basierte Priorisierung entspricht dem Stand der Technik und erfüllt die Anforderungen von Art. 21 Abs. 2 lit. e an die Schwachstellenbehandlung', en: 'Nothing – CVSS-based prioritization meets the state of the art and fulfills Art. 21(2)(e) vulnerability handling requirements', fr: 'Rien – la priorisation CVSS correspond à l\'état de l\'art et satisfait les exigences de l\'Art. 21(2)(e)' }, value: 'a' },
      { label: { de: 'Den Geschäftskontext – NIS-2 fordert risikobasierte Bewertung: Eine CVSS-5.0-Schwachstelle auf einem System mit Kundendaten kann kritischer sein als eine CVSS-9.8 auf einem isolierten Testsystem', en: 'The business context – NIS-2 requires risk-based assessment: a CVSS 5.0 vulnerability on a customer data system can be more critical than a CVSS 9.8 on an isolated test system', fr: 'Le contexte métier – NIS-2 exige une évaluation basée sur les risques : une vulnérabilité CVSS 5.0 sur un système client peut être plus critique qu\'un CVSS 9.8 sur un système de test isolé' }, value: 'b' },
      { label: { de: 'Die Meldepflicht – kritische Schwachstellen, die bei einem Penetrationstest entdeckt werden, müssen gemäß Art. 23 innerhalb von 72h an das CSIRT gemeldet werden', en: 'The reporting obligation – critical vulnerabilities found in pen tests must be reported to the CSIRT within 72h under Art. 23', fr: 'L\'obligation de notification – les vulnérabilités critiques trouvées lors de tests doivent être signalées au CSIRT dans les 72h' }, value: 'c' },
      { label: { de: 'Die Haftungsfrage – bei Kenntnis kritischer Schwachstellen beginnt eine 30-Tage-Frist, in der die Geschäftsleitung persönlich für nicht behobene Schwachstellen haftet', en: 'The liability question – upon knowledge of critical vulnerabilities, a 30-day deadline begins during which management is personally liable for unpatched vulnerabilities', fr: 'La question de responsabilité – un délai de 30 jours commence, pendant lequel la direction est personnellement responsable' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 verlangt einen gefahrenübergreifenden, risikobasierten Ansatz. CVSS bewertet die technische Schwere einer Schwachstelle, nicht das Geschäftsrisiko. Eine Schwachstelle mit niedrigem CVSS-Score auf einem geschäftskritischen System mit Kundendaten kann ein höheres Risiko darstellen als eine technisch kritischere Schwachstelle auf einem isolierten System.',
      en: 'NIS-2 requires an all-hazards, risk-based approach. CVSS scores assess technical severity, not business risk. A vulnerability with a low CVSS score on a business-critical customer data system can pose higher risk than a technically more critical vulnerability on an isolated system.',
      fr: 'NIS-2 exige une approche basée sur les risques. Le CVSS évalue la sévérité technique, pas le risque métier.',
    },
  },
];

const QUIZ_SIZE = 10;
const MONEY_LEVELS = ['100', '200', '500', '1.000', '2.000', '4.000', '8.000', '16.000', '32.000', '64.000'];
const SAFETY_NETS = [4, 8]; // indices where money is secured
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const QUESTION_TIME = 45;
const BONUS_TIME_THRESHOLD = 30;
const STORAGE_KEY = 'nis2_quiz_best';

const I18N = {
  title: { de: 'NIS-2 Awareness Quiz', en: 'NIS-2 Awareness Quiz', fr: 'Quiz NIS-2' },
  intro: { de: 'Teste dein Wissen zur NIS-2-Richtlinie. 10 praxisnahe Szenarien aus dem Management- und IT-Alltag – im Millionär-Stil. Wie weit kommst du?', en: 'Test your NIS-2 knowledge. 10 practical scenarios from management and IT – millionaire style. How far can you go?', fr: 'Testez vos connaissances NIS-2. 10 scénarios pratiques – style millionnaire.' },
  start: { de: 'Quiz starten', en: 'Start Quiz', fr: 'Commencer' },
  correct: { de: 'Richtig!', en: 'Correct!', fr: 'Correct !' },
  incorrect: { de: 'Leider falsch.', en: 'Incorrect.', fr: 'Incorrect.' },
  next: { de: 'Weiter', en: 'Next', fr: 'Suivant' },
  confirm: { de: 'Letzte Antwort', en: 'Final Answer', fr: 'Réponse finale' },
  restart: { de: 'Neues Spiel', en: 'New Game', fr: 'Nouvelle partie' },
  won: { de: 'Gewonnen!', en: 'You won!', fr: 'Gagné !' },
  gameOver: { de: 'Ausgeschieden!', en: 'Game Over!', fr: 'Éliminé !' },
  reached: { de: 'Erreicht', en: 'Reached', fr: 'Atteint' },
  secured: { de: 'Gesichert', en: 'Secured', fr: 'Sécurisé' },
  fiftyFifty: { de: '50:50 Joker', en: '50:50 Lifeline', fr: 'Joker 50:50' },
  audience: { de: 'Publikum', en: 'Audience', fr: 'Public' },
  jokerUsed: { de: 'Joker verbraucht', en: 'Lifeline used', fr: 'Joker utilisé' },
  safetyNet: { de: 'Sicherheitsstufe!', en: 'Safety net!', fr: 'Filet de sécurité !' },
  disclaimer: { de: 'Hinweis: Dieses Quiz dient der Sensibilisierung und ersetzt keine Rechtsberatung.', en: 'Note: This quiz is for awareness purposes and does not constitute legal advice.', fr: 'Note : Ce quiz est à des fins de sensibilisation et ne constitue pas un avis juridique.' },
};

const FAKE_DIFFICULTY: Record<string, number> = {
  q1: 38, q2: 42, q3: 31, q4: 45, q5: 52, q6: 35, q7: 28, q8: 48, q9: 55, q10: 33, q11: 40, q12: 37,
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
  
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [audienceUsed, setAudienceUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [audienceResults, setAudienceResults] = useState<Record<string, number> | null>(null);

  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [speedBonuses, setSpeedBonuses] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); } catch { return 0; }
  });
  const [showMilestone, setShowMilestone] = useState(false);
  const [showSpeedBonus, setShowSpeedBonus] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || gameOver || won || confirmed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        if (prev <= 11 && prev > 5) playTick();
        if (prev <= 5) playTickUrgent();
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQ, started, gameOver, won, confirmed]);

  useEffect(() => {
    if (timeLeft === 0 && started && !gameOver && !won && !confirmed) {
      setGameOver(true);
      setTimeout(() => playDefeat(), 300);
    }
  }, [timeLeft, started, gameOver, won, confirmed]);

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
      if (timeLeft >= BONUS_TIME_THRESHOLD) {
        setSpeedBonuses(s => s + 1);
        setShowSpeedBonus(true);
        setTimeout(() => setShowSpeedBonus(false), 1500);
      }
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

  const progressPct = ((currentQ) / QUIZ_SIZE) * 100;
  const timerPct = (timeLeft / QUESTION_TIME) * 100;
  const timerUrgent = timeLeft <= 10;
  const timerCritical = timeLeft <= 5;

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 max-w-4xl mx-auto bg-transparent';
  const diamondClip = 'polygon(3% 50%, 6% 0%, 94% 0%, 97% 50%, 94% 100%, 6% 100%)';

  // ── Entry screen ──
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
        <div className="text-center space-y-8 max-w-md relative">
          <div className="absolute inset-0 -top-20 bg-[radial-gradient(ellipse_at_center,hsl(45_100%_48%/0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent rounded-full animate-pulse" />
            <div className="absolute inset-3 rotate-45 border-2 border-primary/60 bg-gradient-to-br from-primary/20 to-card flex items-center justify-center shadow-[0_0_40px_hsl(45_100%_48%/0.3)]">
              <span className="text-3xl -rotate-45">💎</span>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-mono tracking-widest uppercase">NIS-2</h1>
            <p className="text-lg text-foreground/70 font-mono tracking-wide">Awareness Quiz</p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </div>
          <p className="text-foreground/60 text-sm leading-relaxed max-w-sm mx-auto">{t(I18N.intro)}</p>
          {bestScore > 0 && (
            <div className="flex items-center justify-center gap-2 text-primary text-sm">
              <Star size={14} className="fill-primary" />
              <span className="font-mono font-bold">{bestScore}/{QUIZ_SIZE}</span>
              <span className="text-foreground/50">{t({ de: 'Persönlicher Rekord', en: 'Personal Best', fr: 'Record personnel' })}</span>
            </div>
          )}
          <button onClick={() => setStarted(true)} className="relative group px-10 py-4 mx-auto" style={{ clipPath: diamondClip }}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 group-hover:from-primary/30 group-hover:via-primary/50 group-hover:to-primary/30 transition-all duration-500" />
            <div className="absolute inset-[1px] bg-gradient-to-b from-card via-secondary to-card" style={{ clipPath: diamondClip }} />
            <span className="relative text-primary font-mono font-bold text-lg tracking-wider uppercase group-hover:text-foreground transition-colors">{t(I18N.start)}</span>
          </button>
          <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> <span className="font-mono">{QUESTION_TIME}s</span></span>
            <span className="flex items-center gap-1.5"><Flame size={12} className="text-primary/60" /> Streak</span>
            <span className="flex items-center gap-1.5"><Zap size={12} className="text-primary/60" /> Speed</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over / Won ──
  if (gameOver || won) {
    const securedLevel = getSecuredLevel();
    const finalLevel = won ? QUIZ_SIZE - 1 : (securedLevel >= 0 ? securedLevel : -1);
    const finalAmount = finalLevel >= 0 ? MONEY_LEVELS[finalLevel] : '0';
    const q = questions[currentQ];
    const isNewBest = score > (bestScore - (won ? 0 : 1));
    const timeRanOut = timeLeft === 0 && !selected;

    return (
      <div className={wrapperClass}>
        <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
        <div className="text-center mb-6">
          <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono tracking-widest uppercase`}>
            <Typewriter text={t(I18N.title)} charDelay={8} />
          </h1>
        </div>
        <StaggerReveal stagger={400}>
          <div className={`relative rounded-2xl p-8 text-center overflow-hidden border ${won ? 'border-primary/40' : 'border-destructive/40'}`}>
            <div className={`absolute inset-0 ${won ? 'bg-[radial-gradient(ellipse_at_center,hsl(45_100%_48%/0.1)_0%,transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,hsl(0_84%_60%/0.08)_0%,transparent_70%)]'}`} />
            {won && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="absolute w-1 h-1 bg-primary rounded-full animate-ping" style={{ left: `${5 + (i * 5) % 90}%`, top: `${10 + (i * 11) % 80}%`, animationDelay: `${i * 0.15}s`, animationDuration: `${1 + (i % 4) * 0.4}s` }} />
                ))}
              </div>
            )}
            <div className="relative z-10">
              <div className="text-5xl mb-4">{won ? '🏆' : (timeRanOut ? '⏰' : '💔')}</div>
              <h2 className={`text-2xl md:text-3xl font-bold font-mono tracking-wider ${won ? 'text-primary' : 'text-destructive'}`}>
                {won ? t(I18N.won) : (timeRanOut ? t({ de: 'Zeit abgelaufen!', en: 'Time\'s up!', fr: 'Temps écoulé !' }) : t(I18N.gameOver))}
              </h2>
              <div className="mt-6 space-y-2">
                <p className="text-foreground/40 text-xs uppercase tracking-[0.2em] font-mono">{won ? t(I18N.reached) : t(I18N.secured)}</p>
                <p className="text-4xl md:text-5xl font-mono font-black text-primary drop-shadow-[0_0_20px_hsl(45_100%_48%/0.4)]">€ {won ? '64.000' : finalAmount}</p>
                {!won && <p className="text-foreground/40 text-xs font-mono">{t(I18N.reached)}: € {MONEY_LEVELS[currentQ]} · {t(I18N.secured)}: € {finalAmount}</p>}
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs">
                <span className="flex items-center gap-1.5 text-primary"><CheckCircle2 size={14} /> <span className="font-mono font-bold">{score}/{QUIZ_SIZE}</span></span>
                {speedBonuses > 0 && <span className="flex items-center gap-1.5 text-highlight"><Zap size={14} /> <span className="font-mono font-bold">{speedBonuses}x</span></span>}
                {isNewBest && score > 0 && <span className="flex items-center gap-1.5 text-primary animate-pulse"><Star size={14} className="fill-primary" /> {t({ de: 'Neuer Rekord!', en: 'New record!', fr: 'Nouveau record !' })}</span>}
              </div>
            </div>
          </div>
          {!won && !timeRanOut && (
            <div className="bg-card/80 border border-border rounded-xl p-5">
              <p className="text-foreground/50 text-xs mb-3 font-mono">{q.question[lang] || q.question.en}</p>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-foreground/70 text-sm leading-relaxed">{q.explanation[lang] || q.explanation.en}</p>
              </div>
            </div>
          )}
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-xs">
              {won ? t({ de: 'Kannst du es nochmal schaffen?', en: 'Can you do it again?', fr: 'Pouvez-vous recommencer ?' })
                : t({ de: `Nur ${FAKE_DIFFICULTY[q.id] || 50}% beantworten diese Frage richtig.`, en: `Only ${FAKE_DIFFICULTY[q.id] || 50}% answer this question correctly.`, fr: `Seulement ${FAKE_DIFFICULTY[q.id] || 50}% répondent correctement.` })}
            </p>
            <Button onClick={restart} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 font-mono font-bold tracking-wider">
              <RotateCcw className="w-4 h-4 mr-2" /> {t(I18N.restart)}
            </Button>
          </div>
          <p className="text-muted-foreground text-[10px] text-center italic">{t(I18N.disclaimer)}</p>
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
      
      {/* Top HUD */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className={`${embedded ? 'text-lg' : 'text-xl md:text-2xl'} font-bold text-primary font-mono tracking-widest uppercase`}>
            <Typewriter text={t(I18N.title)} charDelay={8} />
          </h1>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-primary text-sm font-bold animate-pulse font-mono">
              <Flame size={16} className={streak >= 5 ? 'text-destructive' : ''} />
              <span>{streak}x</span>
            </div>
          )}
        </div>
        <div className="relative">
          <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
          </div>
          {SAFETY_NETS.map(idx => (
            <div key={idx} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border border-primary shadow-[0_0_6px_hsl(45_100%_48%/0.5)]" style={{ left: `${((idx + 1) / QUIZ_SIZE) * 100}%` }} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative h-1 bg-muted/15 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerCritical ? 'bg-destructive animate-pulse' : timerUrgent ? 'bg-primary' : 'bg-highlight/40'}`} style={{ width: `${timerPct}%` }} />
          </div>
          <span className={`font-mono text-xs tabular-nums min-w-[2.5rem] text-right ${timerCritical ? 'text-destructive font-bold animate-pulse' : timerUrgent ? 'text-primary' : 'text-muted-foreground'}`}>
            <Clock size={10} className="inline mr-1" />{timeLeft}s
          </span>
          <span className="font-mono text-xs text-muted-foreground/60">{currentQ + 1}/{QUIZ_SIZE}</span>
        </div>
      </div>

      {/* Milestone */}
      {showMilestone && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-card/95 border-2 border-primary rounded-2xl p-8 text-center animate-bounce shadow-[0_0_60px_hsl(45_100%_48%/0.3)]">
            <Trophy className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-primary font-bold text-xl font-mono">€ {MONEY_LEVELS[currentQ]}</p>
            <p className="text-primary/60 text-xs mt-1 uppercase tracking-widest">{t(I18N.safetyNet)}</p>
          </div>
        </div>
      )}

      {/* Speed bonus */}
      {showSpeedBonus && (
        <div className="fixed top-20 right-4 z-50 pointer-events-none">
          <div className="bg-highlight/20 border border-highlight/40 rounded-lg px-4 py-2 flex items-center gap-2 animate-bounce shadow-[0_0_20px_hsl(187_100%_42%/0.2)]">
            <Zap size={16} className="text-highlight" />
            <span className="text-highlight font-mono text-sm font-bold">Speed Bonus!</span>
          </div>
        </div>
      )}

      <div className={`flex gap-5 ${showLadder ? '' : 'flex-col'}`}>
        <div className="flex-1 min-w-0 space-y-4">
          <StaggerReveal key={`question-${currentQ}`} stagger={isMobile ? 600 : 350}>
            {/* Jokers */}
            <div className="flex items-center gap-2">
              <button onClick={useFiftyFifty} disabled={fiftyFiftyUsed || confirmed}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-mono text-xs transition-all duration-300 ${fiftyFiftyUsed ? 'border-muted/20 text-muted-foreground/30 cursor-not-allowed line-through opacity-40' : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_12px_hsl(45_100%_48%/0.15)]'}`}>
                <Percent size={14} /> 50:50
              </button>
              <button onClick={useAudience} disabled={audienceUsed || confirmed}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-mono text-xs transition-all duration-300 ${audienceUsed ? 'border-muted/20 text-muted-foreground/30 cursor-not-allowed line-through opacity-40' : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_12px_hsl(45_100%_48%/0.15)]'}`}>
                <Users size={14} /> {t(I18N.audience)}
              </button>
              <span className="ml-auto text-muted-foreground/40 font-mono text-[10px]">{diffPct}% ✓</span>
              {!showLadder && <span className="text-primary font-mono text-sm font-bold drop-shadow-[0_0_8px_hsl(45_100%_48%/0.3)]">€ {MONEY_LEVELS[currentQ]}</span>}
            </div>

            {/* Question panel */}
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-2xl" />
              <div className="relative bg-gradient-to-b from-secondary via-card to-secondary rounded-2xl p-5 md:p-6 border border-primary/20">
                <p className="text-foreground text-sm md:text-base leading-relaxed text-center font-medium">{q.question[lang] || q.question.en}</p>
              </div>
            </div>

            {/* Answer options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, i) => {
                const val = opt.value;
                const isHidden = hiddenOptions.includes(val);
                const isThis = selected === val;
                const isAnswer = val === q.correct;

                if (isHidden) {
                  return (
                    <div key={val} className="relative px-5 py-3 text-sm opacity-15" style={{ clipPath: diamondClip }}>
                      <div className="absolute inset-0 bg-muted/20" style={{ clipPath: diamondClip }} />
                      <span className="relative font-mono font-bold mr-2 text-muted-foreground">{OPTION_LETTERS[i]}:</span>
                      <span className="relative line-through text-muted-foreground">{opt.label[lang] || opt.label.en}</span>
                    </div>
                  );
                }

                let outerGradient = 'from-primary/20 via-primary/40 to-primary/20';
                let innerBg = 'from-secondary via-card to-secondary';
                let textClass = 'text-foreground/80';
                let glowClass = '';

                if (isThis && !confirmed) {
                  outerGradient = 'from-primary/50 via-primary/80 to-primary/50';
                  innerBg = 'from-primary/20 via-primary/10 to-primary/20';
                  textClass = 'text-primary';
                  glowClass = 'shadow-[0_0_20px_hsl(45_100%_48%/0.2)]';
                }
                if (confirmed) {
                  if (isAnswer) {
                    outerGradient = 'from-success/50 via-success/80 to-success/50';
                    innerBg = 'from-success/15 via-success/10 to-success/15';
                    textClass = 'text-success';
                    glowClass = 'shadow-[0_0_20px_hsl(142_71%_45%/0.2)]';
                  } else if (isThis && !isCorrect) {
                    outerGradient = 'from-destructive/50 via-destructive/80 to-destructive/50';
                    innerBg = 'from-destructive/15 via-destructive/10 to-destructive/15';
                    textClass = 'text-destructive';
                    glowClass = 'shadow-[0_0_20px_hsl(0_84%_60%/0.2)]';
                  } else {
                    outerGradient = 'from-muted/20 via-muted/30 to-muted/20';
                    innerBg = 'from-muted/10 via-card to-muted/10';
                    textClass = 'text-muted-foreground/40';
                  }
                }

                return (
                  <button key={val} onClick={() => handleSelect(val)} disabled={confirmed}
                    className={`relative text-left transition-all duration-300 active:scale-[0.98] disabled:cursor-default ${glowClass} group`}
                    style={{ clipPath: diamondClip }}>
                    <div className={`absolute inset-0 bg-gradient-to-r ${outerGradient}`} style={{ clipPath: diamondClip }} />
                    <div className={`absolute inset-[1px] bg-gradient-to-b ${innerBg}`} style={{ clipPath: diamondClip }} />
                    <div className={`relative px-5 py-3 text-sm ${textClass}`}>
                      <span className="font-mono font-bold mr-2 text-primary/80">{OPTION_LETTERS[i]}:</span>
                      {opt.label[lang] || opt.label.en}
                    </div>
                    {!confirmed && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: diamondClip }} />}
                  </button>
                );
              })}
            </div>
          </StaggerReveal>

          {/* Audience results */}
          {audienceResults && (
            <div className="bg-card/80 border border-primary/20 rounded-xl p-4 animate-fade-in">
              <p className="text-primary text-xs mb-2 uppercase tracking-[0.15em] font-mono">{t(I18N.audience)}</p>
              <div className="flex items-end gap-3 h-20">
                {q.options.map((opt, i) => {
                  const pct = audienceResults[opt.value] || 0;
                  if (hiddenOptions.includes(opt.value)) return null;
                  return (
                    <div key={opt.value} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-foreground/50 font-mono text-[10px]">{pct}%</span>
                      <div className="w-full bg-muted/20 rounded-sm overflow-hidden" style={{ height: '48px' }}>
                        <div className="w-full bg-gradient-to-t from-primary/60 to-primary/30 rounded-sm transition-all duration-700" style={{ height: `${pct * 0.48}px`, marginTop: `${48 - pct * 0.48}px` }} />
                      </div>
                      <span className="text-primary font-mono text-xs font-bold">{OPTION_LETTERS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm */}
          {selected && !confirmed && (
            <div className="flex items-center justify-center animate-fade-in">
              <button onClick={handleConfirm} className="relative group px-8 py-3" style={{ clipPath: diamondClip }}>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 animate-pulse group-hover:animate-none group-hover:from-primary/60 group-hover:via-primary group-hover:to-primary/60 transition-all" style={{ clipPath: diamondClip }} />
                <div className="absolute inset-[1px] bg-gradient-to-b from-card via-secondary to-card" style={{ clipPath: diamondClip }} />
                <span className="relative text-primary font-mono font-bold tracking-wider uppercase text-sm group-hover:text-foreground transition-colors">{t(I18N.confirm)}</span>
              </button>
            </div>
          )}

          {/* Explanation */}
          {confirmed && (
            <StaggerReveal stagger={300}>
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                {isCorrect ? <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />}
                <div>
                  <p className={`text-sm font-bold mb-1 font-mono ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                    {isCorrect ? t(I18N.correct) : t(I18N.incorrect)}
                    {isCorrect && streak > 1 && <span className="ml-2 text-primary text-xs">🔥 {streak}x Streak!</span>}
                  </p>
                  <p className="text-foreground/70 text-sm leading-relaxed">{q.explanation[lang] || q.explanation.en}</p>
                </div>
              </div>
              {isCorrect && !won && (
                <div className="flex justify-end">
                  <button onClick={handleNext} className="relative group px-6 py-2.5" style={{ clipPath: diamondClip }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-highlight/30 via-highlight/50 to-highlight/30 group-hover:from-highlight/50 group-hover:via-highlight/70 group-hover:to-highlight/50 transition-all" style={{ clipPath: diamondClip }} />
                    <div className="absolute inset-[1px] bg-gradient-to-b from-card via-secondary to-card" style={{ clipPath: diamondClip }} />
                    <span className="relative flex items-center gap-2 text-highlight font-mono font-bold text-sm group-hover:text-foreground transition-colors">
                      {t(I18N.next)} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </div>
              )}
            </StaggerReveal>
          )}
        </div>

        {/* Money Ladder */}
        {showLadder && (
          <div className="w-40 flex-shrink-0">
            <div className="sticky top-4">
              <div className="bg-gradient-to-b from-card via-secondary/50 to-card rounded-xl border border-primary/10 p-2 space-y-0">
                {[...MONEY_LEVELS].reverse().map((level, reverseIdx) => {
                  const idx = MONEY_LEVELS.length - 1 - reverseIdx;
                  const isCurrent = idx === currentQ;
                  const isPassed = idx < score;
                  const isSafetyNet = SAFETY_NETS.includes(idx);
                  const isReached = idx <= currentQ;

                  let textColor = 'text-foreground/20';
                  let bg = '';
                  let borderStyle = 'border-transparent';
                  let glow = '';

                  if (isCurrent && !gameOver) {
                    textColor = 'text-primary';
                    bg = 'bg-primary/10';
                    borderStyle = 'border-primary/40';
                    glow = 'shadow-[0_0_12px_hsl(45_100%_48%/0.15)]';
                  } else if (isPassed) {
                    textColor = 'text-success/70';
                    bg = 'bg-success/5';
                  } else if (isSafetyNet) {
                    textColor = isReached ? 'text-primary/80' : 'text-primary/40';
                  }

                  return (
                    <div key={level} className={`flex items-center justify-between px-2.5 py-1 rounded-lg border text-xs font-mono transition-all duration-500 ${textColor} ${bg} ${borderStyle} ${glow} ${isCurrent ? 'scale-105 font-bold' : ''}`}>
                      <span className="text-[10px] opacity-40 w-4">{idx + 1}</span>
                      <span className={isSafetyNet ? 'font-black' : 'font-semibold'}>€ {level}</span>
                      {isSafetyNet && <Trophy size={10} className="text-primary/50" />}
                      {!isSafetyNet && <span className="w-[10px]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
