import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, Percent, Users, Trophy } from 'lucide-react';
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
      { label: { de: 'Die Lösegeldzahlung – das ist unter NIS-2 generell verboten', en: 'The ransom payment – this is generally prohibited under NIS-2', fr: 'Le paiement de rançon – c\'est généralement interdit sous NIS-2' }, value: 'a' },
      { label: { de: 'Die unterlassene Meldung – die Frühwarnung an das CSIRT muss innerhalb von 24 Stunden erfolgen, unabhängig von der Wiederherstellung', en: 'The failure to report – the early warning to the CSIRT must be sent within 24 hours, regardless of recovery', fr: 'L\'absence de signalement – l\'alerte précoce au CSIRT doit être envoyée dans les 24 heures, indépendamment de la restauration' }, value: 'b' },
      { label: { de: 'Kein Problem – bei schneller Wiederherstellung entfällt die Meldepflicht', en: 'No problem – rapid recovery eliminates the reporting obligation', fr: 'Pas de problème – une restauration rapide élimine l\'obligation de notification' }, value: 'c' },
      { label: { de: 'Die fehlende Einschaltung der Polizei – das ist die primäre NIS-2-Pflicht', en: 'The failure to involve police – this is the primary NIS-2 obligation', fr: 'L\'absence d\'implication de la police – c\'est l\'obligation principale de NIS-2' }, value: 'd' },
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
      { label: { de: 'Ja – Logistik gehört nicht zu den erfassten Sektoren', en: 'Yes – logistics is not among the covered sectors', fr: 'Oui – la logistique ne fait pas partie des secteurs couverts' }, value: 'a' },
      { label: { de: 'Nein – als Teil der Lieferkette wesentlicher Einrichtungen kann die nationale Behörde das Unternehmen einbeziehen', en: 'No – as part of the supply chain of essential entities, the national authority can include the company', fr: 'Non – en tant que partie de la chaîne d\'approvisionnement d\'entités essentielles, l\'autorité nationale peut inclure l\'entreprise' }, value: 'b' },
      { label: { de: 'Ja – unter 250 MA greift NIS-2 nie', en: 'Yes – under 250 employees NIS-2 never applies', fr: 'Oui – en dessous de 250 employés NIS-2 ne s\'applique jamais' }, value: 'c' },
      { label: { de: 'Nein – jedes Unternehmen mit über 10 Mio. € Umsatz fällt automatisch unter NIS-2', en: 'No – every company with over €10M revenue automatically falls under NIS-2', fr: 'Non – toute entreprise avec plus de 10 M€ de CA est automatiquement soumise à NIS-2' }, value: 'd' },
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
      { label: { de: 'Weil US-Anbieter grundsätzlich nicht NIS-2-konform sein können', en: 'Because US providers fundamentally cannot be NIS-2 compliant', fr: 'Parce que les fournisseurs américains ne peuvent fondamentalement pas être conformes à NIS-2' }, value: 'a' },
      { label: { de: 'Weil ISO 27001 des Anbieters nichts über Konzentrationsrisiko, Verfügbarkeitsabhängigkeit und geopolitische Risiken im eigenen Risikomanagement aussagt', en: 'Because the provider\'s ISO 27001 says nothing about concentration risk, availability dependency, and geopolitical risks in your own risk management', fr: 'Parce que l\'ISO 27001 du fournisseur ne dit rien sur le risque de concentration et les risques géopolitiques dans votre propre gestion des risques' }, value: 'b' },
      { label: { de: 'Es reicht tatsächlich – der Auditor liegt falsch', en: 'It actually suffices – the auditor is wrong', fr: 'C\'est en fait suffisant – l\'auditeur a tort' }, value: 'c' },
      { label: { de: 'Weil SIEM-Systeme unter NIS-2 zwingend on-premise betrieben werden müssen', en: 'Because SIEM systems must be operated on-premise under NIS-2', fr: 'Parce que les systèmes SIEM doivent être exploités on-premise sous NIS-2' }, value: 'd' },
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
      { label: { de: 'Der Vorstand – ISO 27001:2022 deckt alle NIS-2-Anforderungen ab', en: 'The board – ISO 27001:2022 covers all NIS-2 requirements', fr: 'Le conseil – ISO 27001:2022 couvre toutes les exigences NIS-2' }, value: 'a' },
      { label: { de: 'Die Compliance-Abteilung – ISO 27001 deckt weder die persönliche Haftung der Geschäftsleitung noch die spezifischen Meldepflichten und Schulungsvorgaben für Leitungsorgane ab', en: 'Compliance – ISO 27001 covers neither personal management liability nor specific reporting obligations and training requirements for management bodies', fr: 'La conformité – ISO 27001 ne couvre ni la responsabilité personnelle de la direction ni les obligations de notification et de formation spécifiques' }, value: 'b' },
      { label: { de: 'Beide liegen falsch – Maschinenbau fällt gar nicht unter NIS-2', en: 'Both are wrong – mechanical engineering doesn\'t fall under NIS-2', fr: 'Les deux ont tort – le génie mécanique ne relève pas de NIS-2' }, value: 'c' },
      { label: { de: 'Die Compliance-Abteilung – aber nur wegen fehlender Penetrationstests', en: 'Compliance – but only because of missing penetration tests', fr: 'La conformité – mais uniquement à cause de tests de pénétration manquants' }, value: 'd' },
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
      { label: { de: 'Abwarten bis die Forensik abgeschlossen ist – ohne klare Fakten meldet man nicht', en: 'Wait until forensics are complete – you don\'t report without clear facts', fr: 'Attendre la fin de l\'analyse forensique – on ne signale pas sans faits clairs' }, value: 'a' },
      { label: { de: 'Innerhalb von 24h eine Frühwarnung absetzen mit den verfügbaren Informationen – die vollständige Bewertung folgt innerhalb von 72h', en: 'Send an early warning within 24h with available information – the full assessment follows within 72 hours', fr: 'Envoyer une alerte précoce dans les 24h avec les informations disponibles – l\'évaluation complète suit dans les 72 heures' }, value: 'b' },
      { label: { de: 'Nur intern eskalieren – ein Entwicklungsserver ist kein produktives System', en: 'Only escalate internally – a dev server is not a production system', fr: 'Escalader uniquement en interne – un serveur de développement n\'est pas un système productif' }, value: 'c' },
      { label: { de: 'Die DSGVO-Meldung an die Datenschutzbehörde deckt auch NIS-2 ab', en: 'The GDPR notification to the data protection authority also covers NIS-2', fr: 'La notification RGPD à l\'autorité de protection des données couvre aussi NIS-2' }, value: 'd' },
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
      { label: { de: 'Der IT-Leiter hat recht – vertragliche Pflichten liegen beim Dienstleister', en: 'The IT lead is right – contractual obligations rest with the provider', fr: 'Le responsable IT a raison – les obligations contractuelles incombent au prestataire' }, value: 'a' },
      { label: { de: 'Die Verantwortung bleibt beim Stadtwerk – es muss die Einhaltung überwachen, Eskalationsmechanismen etablieren und notfalls den Anbieter wechseln', en: 'Responsibility remains with the utility – it must monitor compliance, establish escalation mechanisms, and switch providers if necessary', fr: 'La responsabilité reste chez le service municipal – il doit surveiller la conformité, établir des mécanismes d\'escalade et changer de prestataire si nécessaire' }, value: 'b' },
      { label: { de: 'NIS-2 schreibt keine konkreten Patch-Fristen vor, daher kein Problem', en: 'NIS-2 doesn\'t prescribe specific patch timelines, so no problem', fr: 'NIS-2 ne prescrit pas de délais spécifiques pour les correctifs, donc pas de problème' }, value: 'c' },
      { label: { de: 'Nur relevant, wenn ein Angriff über die ungepatchte Schwachstelle erfolgt', en: 'Only relevant if an attack exploits the unpatched vulnerability', fr: 'Pertinent uniquement si une attaque exploite la vulnérabilité non corrigée' }, value: 'd' },
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
      { label: { de: 'Die Pflicht zur jährlichen Durchführung von Penetrationstests', en: 'The obligation to conduct annual penetration tests', fr: 'L\'obligation de réaliser des tests de pénétration annuels' }, value: 'a' },
      { label: { de: 'Die Anforderung an Krisenmanagement-Governance – klare Rollen, Entscheidungsbefugnisse und Verantwortlichkeiten müssen vorab definiert sein', en: 'The crisis management governance requirement – clear roles, decision authority, and responsibilities must be defined in advance', fr: 'L\'exigence de gouvernance de gestion de crise – rôles, autorité et responsabilités doivent être définis à l\'avance' }, value: 'b' },
      { label: { de: 'Die Pflicht zur Einrichtung eines SOC', en: 'The obligation to establish a SOC', fr: 'L\'obligation d\'établir un SOC' }, value: 'c' },
      { label: { de: 'Die Meldepflicht gegenüber der Aufsichtsbehörde', en: 'The reporting obligation to the supervisory authority', fr: 'L\'obligation de notification à l\'autorité de surveillance' }, value: 'd' },
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
      { label: { de: 'Ja – reine Softwareanbieter fallen nicht unter NIS-2', en: 'Yes – pure software vendors don\'t fall under NIS-2', fr: 'Oui – les éditeurs de logiciels purs ne relèvent pas de NIS-2' }, value: 'a' },
      { label: { de: 'Falsch – ein SaaS-Anbieter betreibt die Infrastruktur und ist als Anbieter digitaler Dienste potenziell erfasst, besonders bei Kunden in der öffentlichen Verwaltung', en: 'Wrong – a SaaS provider operates infrastructure and is potentially covered as a digital service provider, especially with public administration clients', fr: 'Faux – un fournisseur SaaS exploite l\'infrastructure et est potentiellement couvert comme fournisseur de services numériques' }, value: 'b' },
      { label: { de: 'Stimmt – erst ab 250 MA relevant', en: 'Correct – only relevant from 250 employees', fr: 'Correct – pertinent à partir de 250 employés' }, value: 'c' },
      { label: { de: 'Nur relevant, wenn die Software sicherheitsrelevante Funktionen hat', en: 'Only relevant if the software has security-related functions', fr: 'Pertinent uniquement si le logiciel a des fonctions de sécurité' }, value: 'd' },
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
      { label: { de: 'NIS-2 schreibt ein generelles USB-Verbot an Produktionssystemen vor', en: 'NIS-2 mandates a general USB ban on production systems', fr: 'NIS-2 impose une interdiction générale des USB sur les systèmes de production' }, value: 'a' },
      { label: { de: 'NIS-2 verlangt verhältnismäßige Maßnahmen auf Basis einer Risikoanalyse – die konkrete Maßnahme muss das Risiko adressieren, ohne pauschal zu sein', en: 'NIS-2 requires proportionate measures based on risk analysis – the measure must address the risk without being blanket', fr: 'NIS-2 exige des mesures proportionnées basées sur l\'analyse des risques – la mesure doit adresser le risque sans être générale' }, value: 'b' },
      { label: { de: 'Das ist kein NIS-2-Thema, sondern eine arbeitsrechtliche Frage', en: 'This is not a NIS-2 topic but an employment law question', fr: 'Ce n\'est pas un sujet NIS-2 mais une question de droit du travail' }, value: 'c' },
      { label: { de: 'Der Betriebsrat hat immer Vorrang vor regulatorischen Sicherheitsanforderungen', en: 'The works council always takes priority over regulatory security requirements', fr: 'Le comité d\'entreprise a toujours priorité sur les exigences réglementaires' }, value: 'd' },
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
      { label: { de: 'Kein Haken – ein ISMS nach ISO 27001 deckt beides vollständig ab', en: 'No catch – an ISO 27001 ISMS fully covers both', fr: 'Aucun piège – un SMSI ISO 27001 couvre les deux' }, value: 'a' },
      { label: { de: 'Ein gemeinsames ISMS ist sinnvoll als Basis, aber NIS-2 bringt eigenständige Anforderungen: Meldepflichten, persönliche Leitungshaftung und Aufsichtsregime, die TISAX nicht kennt', en: 'A shared ISMS makes sense as a foundation, but NIS-2 brings independent requirements: reporting obligations, personal management liability, and supervisory regimes that TISAX doesn\'t have', fr: 'Un SMSI commun a du sens comme base, mais NIS-2 apporte des exigences propres que TISAX ne connaît pas' }, value: 'b' },
      { label: { de: 'TISAX und NIS-2 schließen sich gegenseitig aus', en: 'TISAX and NIS-2 are mutually exclusive', fr: 'TISAX et NIS-2 s\'excluent mutuellement' }, value: 'c' },
      { label: { de: 'Der Haken ist, dass man zwei getrennte Zertifizierungsaudits braucht', en: 'The catch is you need two separate certification audits', fr: 'Le piège est qu\'il faut deux audits séparés' }, value: 'd' },
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
      { label: { de: 'Kein Denkfehler – Air-Gapped-Systeme sind von NIS-2 ausgenommen', en: 'No flaw – air-gapped systems are exempted from NIS-2', fr: 'Aucune erreur – les systèmes air-gapped sont exemptés de NIS-2' }, value: 'a' },
      { label: { de: 'NIS-2 erfasst alle Netz- und Informationssysteme, die für die Erbringung des Dienstes relevant sind – die OT-Steuerung eines Wasserversorgers gehört zwingend dazu', en: 'NIS-2 covers all network and information systems relevant to service delivery – a water utility\'s OT systems are necessarily included', fr: 'NIS-2 couvre tous les systèmes pertinents pour la fourniture du service – les systèmes OT d\'un fournisseur d\'eau sont inclus' }, value: 'b' },
      { label: { de: 'NIS-2 gilt nur für IT-Systeme, nicht für OT', en: 'NIS-2 only applies to IT systems, not OT', fr: 'NIS-2 ne s\'applique qu\'aux systèmes IT, pas à l\'OT' }, value: 'c' },
      { label: { de: 'Der Air Gap ist ausreichend – weitere Maßnahmen sind nicht erforderlich', en: 'The air gap is sufficient – no further measures required', fr: 'L\'air gap est suffisant – aucune mesure supplémentaire requise' }, value: 'd' },
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
      { label: { de: 'Ja – die Geschäftsleitung muss nur informiert sein', en: 'Yes – management only needs to be informed', fr: 'Oui – la direction doit seulement être informée' }, value: 'a' },
      { label: { de: 'Ja – der CISO kann die Schulungspflicht stellvertretend erfüllen', en: 'Yes – the CISO can fulfill the training obligation on management\'s behalf', fr: 'Oui – le RSSI peut remplir l\'obligation de formation au nom de la direction' }, value: 'b' },
      { label: { de: 'Nein – NIS-2 verlangt, dass Leitungsorgane selbst an Schulungen teilnehmen, um Risiken eigenständig beurteilen und Maßnahmen genehmigen zu können', en: 'No – NIS-2 requires management bodies to personally attend training to independently assess risks and approve measures', fr: 'Non – NIS-2 exige que les organes de direction participent personnellement à des formations' }, value: 'c' },
      { label: { de: 'Nur relevant bei Unternehmen über 500 Mitarbeiter', en: 'Only relevant for companies over 500 employees', fr: 'Pertinent uniquement pour les entreprises de plus de 500 employés' }, value: 'd' },
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
      { label: { de: 'Nein – NIS-2 betrifft nur Cyberangriffe, keine technischen Fehler', en: 'No – NIS-2 only concerns cyber attacks, not technical failures', fr: 'Non – NIS-2 ne concerne que les cyberattaques, pas les défaillances techniques' }, value: 'a' },
      { label: { de: 'Nein – 6 Stunden sind unterhalb der Erheblichkeitsschwelle', en: 'No – 6 hours is below the significance threshold', fr: 'Non – 6 heures est en dessous du seuil de gravité' }, value: 'b' },
      { label: { de: 'Ja – NIS-2 umfasst alle erheblichen Sicherheitsvorfälle, unabhängig davon ob sie böswillig, fahrlässig oder durch technisches Versagen verursacht wurden', en: 'Yes – NIS-2 covers all significant security incidents regardless of cause – malicious, negligent, or technical failure', fr: 'Oui – NIS-2 couvre tous les incidents significatifs, quelle qu\'en soit la cause' }, value: 'c' },
      { label: { de: 'Nur an den Software-Hersteller, nicht an die Behörde', en: 'Only to the software vendor, not to the authority', fr: 'Uniquement au fournisseur du logiciel, pas à l\'autorité' }, value: 'd' },
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
      { label: { de: 'Ja – Universitäten sind explizit ausgenommen', en: 'Yes – universities are explicitly exempted', fr: 'Oui – les universités sont explicitement exemptées' }, value: 'a' },
      { label: { de: 'Formal möglicherweise korrekt für die Universität selbst, aber das Rechenzentrum als IT-Infrastrukturdienstleister für Krankenhäuser könnte eigenständig erfasst sein', en: 'Formally possibly correct for the university itself, but the data center as IT infrastructure provider for hospitals could be independently covered', fr: 'Formellement peut-être correct pour l\'université, mais le centre de données comme fournisseur d\'infrastructure pour des hôpitaux pourrait être couvert indépendamment' }, value: 'b' },
      { label: { de: 'Nein – alle öffentlichen Einrichtungen fallen unter NIS-2', en: 'No – all public institutions fall under NIS-2', fr: 'Non – toutes les institutions publiques relèvent de NIS-2' }, value: 'c' },
      { label: { de: 'Ja – unter 10.000 Studierende ist die Schwelle nicht erreicht', en: 'Yes – under 10,000 students the threshold isn\'t met', fr: 'Oui – en dessous de 10 000 étudiants le seuil n\'est pas atteint' }, value: 'd' },
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
      { label: { de: 'Kein Problem – ein zentrales ISMS reicht für alle EU-Länder', en: 'No problem – one central ISMS suffices for all EU countries', fr: 'Pas de problème – un SMSI central suffit pour tous les pays' }, value: 'a' },
      { label: { de: 'Weil NIS-2 als Richtlinie national umgesetzt wird – jede Tochtergesellschaft unterliegt den Anforderungen und der Aufsicht des Landes, in dem sie tätig ist', en: 'Because NIS-2 as a directive is nationally implemented – each subsidiary is subject to the requirements and supervision of its operating country', fr: 'Parce que NIS-2 est transposée nationalement – chaque filiale est soumise aux exigences du pays où elle opère' }, value: 'b' },
      { label: { de: 'Weil NIS-2 nur in Deutschland gilt', en: 'Because NIS-2 only applies in Germany', fr: 'Parce que NIS-2 ne s\'applique qu\'en Allemagne' }, value: 'c' },
      { label: { de: 'Weil das ISMS von einem französischen Auditor rezertifiziert werden muss', en: 'Because the ISMS must be recertified by a French auditor', fr: 'Parce que le SMSI doit être recertifié par un auditeur français' }, value: 'd' },
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
  const { playQuestionReveal, playCorrect, playWrong, playSelect, playConfirm, playVictory, playDefeat } = useMillionaireSound();

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

  // Play question reveal sound when a new question appears
  useEffect(() => {
    if (started && !gameOver && !won) {
      playQuestionReveal();
    }
  }, [currentQ, started]);

  const handleSelect = (value: string) => {
    if (confirmed) return;
    playSelect();
    setSelected(value);
  };

  const handleConfirm = () => {
    if (!selected || confirmed) return;
    playConfirm();
    setConfirmed(true);
    const isCorrect = selected === questions[currentQ].correct;
    if (isCorrect) {
      setScore(currentQ + 1);
      if (currentQ === QUIZ_SIZE - 1) {
        setWon(true);
        setTimeout(() => playVictory(), 300);
      } else {
        setTimeout(() => playCorrect(), 400);
      }
    } else {
      setGameOver(true);
      setTimeout(() => playDefeat(), 300);
    }
  };

  const handleNext = () => {
    setCurrentQ(q => q + 1);
    setSelected(null);
    setConfirmed(false);
    setHiddenOptions([]);
    setAudienceResults(null);
  };

  const useFiftyFifty = useCallback(() => {
    if (fiftyFiftyUsed || confirmed) return;
    setFiftyFiftyUsed(true);
    const q = questions[currentQ];
    const wrongOptions = q.options.filter(o => o.value !== q.correct).map(o => o.value);
    // Remove 2 wrong options
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
    // Simulate audience: correct answer gets 45-75%, rest distributed
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
    // Hidden options get 0
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
  };

  // Calculate secured amount (last safety net passed)
  const getSecuredLevel = () => {
    for (let i = SAFETY_NETS.length - 1; i >= 0; i--) {
      if (score > SAFETY_NETS[i]) return SAFETY_NETS[i];
    }
    return -1;
  };

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 max-w-3xl mx-auto';

  // ── Entry screen ──
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
        <div className="text-center space-y-6 max-w-md">
          <div className="text-5xl">💎</div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono">NIS-2 Awareness Quiz</h1>
          <p className="text-foreground/80 text-sm font-mono leading-relaxed">{t(I18N.intro)}</p>
          <button onClick={() => setStarted(true)} className="px-8 py-4 font-mono text-lg border-2 border-primary/60 bg-primary/10 text-primary rounded-lg transition-electric hover:bg-primary/20 hover:border-primary hover:shadow-[var(--shadow-electric)] flex items-center gap-3 mx-auto">
            {t(I18N.start)}
          </button>
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

    return (
      <div className={wrapperClass}>
        <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
        <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-3`}>
          <Typewriter text={t(I18N.title)} charDelay={8} />
        </h1>
        <StaggerReveal stagger={400}>
          {/* Result */}
          <div className={`border-2 rounded-lg p-6 text-center ${won ? 'border-primary bg-primary/10' : 'border-[hsl(0,75%,55%)] bg-[hsl(0,75%,55%,0.1)]'}`}>
            <div className="text-4xl mb-3">{won ? '🏆' : '💔'}</div>
            <h2 className={`text-xl md:text-2xl font-mono font-bold ${won ? 'text-primary' : 'text-[hsl(0,75%,55%)]'}`}>
              {won ? t(I18N.won) : t(I18N.gameOver)}
            </h2>
            <div className="mt-4 space-y-1">
              <p className="text-foreground/60 text-xs font-mono uppercase tracking-wider">
                {won ? t(I18N.reached) : t(I18N.secured)}
              </p>
              <p className="text-3xl font-mono font-bold text-primary">€ {won ? '64.000' : finalAmount}</p>
              {!won && (
                <p className="text-foreground/50 text-xs font-mono">
                  {t(I18N.reached)}: € {MONEY_LEVELS[currentQ]} · {t(I18N.secured)}: € {finalAmount}
                </p>
              )}
            </div>
          </div>

          {/* Last question explanation */}
          {!won && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-5">
              <p className="text-foreground/60 text-xs font-mono mb-2">{q.question[lang] || q.question.en}</p>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-[hsl(0,75%,55%)] mt-0.5 flex-shrink-0" />
                <p className="text-foreground/80 text-sm leading-relaxed">{q.explanation[lang] || q.explanation.en}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={restart} variant="outline" className="border-highlight/30 text-highlight hover:bg-highlight/10 hover:border-highlight/50 font-mono">
              <RotateCcw className="w-4 h-4 mr-2" /> {t(I18N.restart)}
            </Button>
          </div>

          <p className="text-muted-foreground text-xs text-center italic">{t(I18N.disclaimer)}</p>
        </StaggerReveal>
      </div>
    );
  }

  // ── Active game ──
  const q = questions[currentQ];
  const isCorrect = confirmed && selected === q.correct;
  const isWrong = confirmed && selected !== q.correct;
  const showLadder = !isMobile;

  return (
    <div className={wrapperClass}>
      <PageMeta title="NIS-2 Awareness Quiz" description="NIS-2 Awareness Quiz" />
      <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-4`}>
        <Typewriter text={t(I18N.title)} charDelay={8} />
      </h1>

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
              {/* Mobile: current level */}
              {!showLadder && (
                <span className="ml-auto text-primary font-mono text-sm font-bold">
                  € {MONEY_LEVELS[currentQ]}
                </span>
              )}
            </div>

            {/* Question */}
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 md:p-5">
              <p className="text-primary font-mono text-sm leading-relaxed">
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
                    <div key={val} className="px-4 py-3 rounded-lg border-2 border-muted/20 bg-transparent opacity-20 font-mono text-sm">
                      <span className="font-bold mr-2">{OPTION_LETTERS[i]}:</span>
                      <span className="line-through">{opt.label[lang] || opt.label.en}</span>
                    </div>
                  );
                }

                let borderClass = 'border-primary/30 bg-transparent text-foreground/80 hover:border-highlight hover:bg-highlight/5';
                if (isThis && !confirmed) {
                  borderClass = 'border-highlight bg-highlight/15 text-highlight';
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
                    className={`text-left px-4 py-3 rounded-lg border-2 font-mono text-sm transition-electric disabled:cursor-default ${borderClass}`}
                  >
                    <span className="font-bold text-highlight mr-2">{OPTION_LETTERS[i]}:</span>
                    {opt.label[lang] || opt.label.en}
                  </button>
                );
              })}
            </div>
          </StaggerReveal>

          {/* Audience results (outside stagger, shown dynamically) */}
          {audienceResults && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-3 animate-fade-in">
              <p className="text-highlight font-mono text-xs mb-2 uppercase tracking-wider">{t(I18N.audience)}</p>
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

          {/* Confirm / Next button */}
          {selected && !confirmed && (
            <div className="flex items-center justify-center gap-3 animate-fade-in">
              <Button
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono px-6 animate-pulse hover:animate-none"
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
                  <p className={`font-mono text-sm font-semibold mb-1 ${isCorrect ? 'text-[hsl(122,39%,45%)]' : 'text-[hsl(0,75%,55%)]'}`}>
                    {isCorrect ? t(I18N.correct) : t(I18N.incorrect)}
                  </p>
                  <p className="text-foreground/80 text-sm leading-relaxed">{q.explanation[lang] || q.explanation.en}</p>
                </div>
              </div>

              {isCorrect && !won && (
                <div className="flex justify-end">
                  <Button onClick={handleNext} className="bg-highlight text-highlight-foreground hover:bg-highlight/80 font-mono">
                    {t(I18N.next)} <ArrowRight className="w-4 h-4 ml-2" />
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
                    className={`flex items-center justify-between px-2 py-1 rounded border text-xs font-mono transition-all duration-300 ${textColor} ${bg} ${border}`}
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
