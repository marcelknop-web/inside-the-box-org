import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2, XCircle, ArrowRight, Percent, Users, Trophy } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { useLanguage } from '@/i18n/LanguageContext';
import { StaggerReveal } from '@/components/StaggerReveal';
import { useIsMobile } from '@/hooks/use-mobile';

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
      de: 'NIS-2 unterscheidet zwischen „wesentlichen" und „wichtigen" Einrichtungen. Welche Konsequenz hat diese Unterscheidung primär?',
      en: 'NIS-2 distinguishes between "essential" and "important" entities. What is the primary consequence of this distinction?',
      fr: 'NIS-2 distingue les entités « essentielles » des entités « importantes ». Quelle est la conséquence principale de cette distinction ?',
    },
    options: [
      { label: { de: 'Unterschiedliche Meldepflichten bei Vorfällen', en: 'Different incident reporting obligations', fr: 'Différentes obligations de notification d\'incidents' }, value: 'a' },
      { label: { de: 'Unterschiedliche Aufsichtsregime (proaktiv vs. reaktiv)', en: 'Different supervisory regimes (proactive vs. reactive)', fr: 'Différents régimes de supervision (proactif vs réactif)' }, value: 'b' },
      { label: { de: 'Nur wesentliche Einrichtungen müssen ein ISMS betreiben', en: 'Only essential entities must operate an ISMS', fr: 'Seules les entités essentielles doivent exploiter un SMSI' }, value: 'c' },
      { label: { de: 'Wichtige Einrichtungen sind von Bußgeldern ausgenommen', en: 'Important entities are exempt from fines', fr: 'Les entités importantes sont exemptées d\'amendes' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Wesentliche Einrichtungen unterliegen einem proaktiven Aufsichtsregime (Audits, Inspektionen), während wichtige Einrichtungen reaktiv beaufsichtigt werden – erst bei Hinweisen auf Verstöße. Die Meldepflichten und Sicherheitsanforderungen gelten grundsätzlich für beide Kategorien.',
      en: 'Essential entities are subject to proactive supervision (audits, inspections), while important entities are supervised reactively – only when there are indications of non-compliance. Reporting obligations and security requirements generally apply to both categories.',
      fr: 'Les entités essentielles sont soumises à une supervision proactive (audits, inspections), tandis que les entités importantes sont supervisées de manière réactive – uniquement en cas d\'indices de non-conformité. Les obligations de notification et les exigences de sécurité s\'appliquent aux deux catégories.',
    },
  },
  {
    id: 'q2',
    question: {
      de: 'Welche Meldefrist gilt bei einem erheblichen Sicherheitsvorfall nach NIS-2 für die Frühwarnung?',
      en: 'What is the deadline for the early warning notification of a significant security incident under NIS-2?',
      fr: 'Quel est le délai pour la notification d\'alerte précoce d\'un incident de sécurité significatif selon NIS-2 ?',
    },
    options: [
      { label: { de: '72 Stunden', en: '72 hours', fr: '72 heures' }, value: 'a' },
      { label: { de: '24 Stunden', en: '24 hours', fr: '24 heures' }, value: 'b' },
      { label: { de: '48 Stunden', en: '48 hours', fr: '48 heures' }, value: 'c' },
      { label: { de: 'Unverzüglich, spätestens 4 Stunden', en: 'Without undue delay, at most 4 hours', fr: 'Sans retard injustifié, au plus tard 4 heures' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Frühwarnung muss innerhalb von 24 Stunden nach Kenntnisnahme eines erheblichen Sicherheitsvorfalls erfolgen. Innerhalb von 72 Stunden folgt die Vorfallmeldung mit Bewertung und Ersteinschätzung. Ein Abschlussbericht ist innerhalb eines Monats einzureichen.',
      en: 'The early warning must be submitted within 24 hours of becoming aware of a significant security incident. Within 72 hours, an incident notification with assessment follows. A final report must be submitted within one month.',
      fr: 'L\'alerte précoce doit être soumise dans les 24 heures suivant la connaissance d\'un incident de sécurité significatif. Dans les 72 heures suit la notification d\'incident avec évaluation. Un rapport final doit être soumis dans un délai d\'un mois.',
    },
  },
  {
    id: 'q3',
    question: {
      de: 'NIS-2 fordert explizit die persönliche Haftung der Leitungsorgane. Was bedeutet das konkret?',
      en: 'NIS-2 explicitly requires personal liability of management bodies. What does this mean in practice?',
      fr: 'NIS-2 exige explicitement la responsabilité personnelle des organes de direction. Que signifie cela concrètement ?',
    },
    options: [
      { label: { de: 'CEOs können bei Pflichtverletzung strafrechtlich verfolgt werden', en: 'CEOs can be criminally prosecuted for breaches of duty', fr: 'Les PDG peuvent être poursuivis pénalement en cas de manquement' }, value: 'a' },
      { label: { de: 'Die Geschäftsleitung muss Cybersecurity-Maßnahmen genehmigen und deren Umsetzung überwachen', en: 'Management must approve cybersecurity measures and oversee their implementation', fr: 'La direction doit approuver les mesures de cybersécurité et superviser leur mise en œuvre' }, value: 'b' },
      { label: { de: 'Die Geschäftsleitung kann die Verantwortung vollständig an den CISO delegieren', en: 'Management can fully delegate responsibility to the CISO', fr: 'La direction peut déléguer entièrement la responsabilité au RSSI' }, value: 'c' },
      { label: { de: 'Leitungsorgane müssen selbst technische Audits durchführen', en: 'Management bodies must conduct technical audits themselves', fr: 'Les organes de direction doivent réaliser eux-mêmes les audits techniques' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Art. 20 NIS-2 verpflichtet die Leitungsorgane, Risikomanagementmaßnahmen zu genehmigen und deren Umsetzung zu überwachen. Eine vollständige Delegation ist nicht vorgesehen. Bei Pflichtverletzung können Sanktionen gegen die Person verhängt werden – die Form richtet sich nach nationalem Recht.',
      en: 'Art. 20 NIS-2 obliges management bodies to approve risk management measures and oversee their implementation. Full delegation is not foreseen. In case of breach of duty, sanctions can be imposed on the individual – the form depends on national law.',
      fr: 'L\'art. 20 NIS-2 oblige les organes de direction à approuver les mesures de gestion des risques et à superviser leur mise en œuvre. La délégation complète n\'est pas prévue. En cas de manquement, des sanctions peuvent être imposées à la personne – la forme dépend du droit national.',
    },
  },
  {
    id: 'q4',
    question: {
      de: 'Welches der folgenden Unternehmen fällt NICHT automatisch in den Anwendungsbereich von NIS-2?',
      en: 'Which of the following companies does NOT automatically fall within the scope of NIS-2?',
      fr: 'Laquelle de ces entreprises n\'entre PAS automatiquement dans le champ d\'application de NIS-2 ?',
    },
    options: [
      { label: { de: 'Ein Cloud-Anbieter mit 300 Mitarbeitern', en: 'A cloud provider with 300 employees', fr: 'Un fournisseur cloud avec 300 employés' }, value: 'a' },
      { label: { de: 'Ein Lebensmittelhersteller mit 200 Mitarbeitern', en: 'A food manufacturer with 200 employees', fr: 'Un fabricant alimentaire avec 200 employés' }, value: 'b' },
      { label: { de: 'Eine Anwaltskanzlei mit 500 Mitarbeitern', en: 'A law firm with 500 employees', fr: 'Un cabinet d\'avocats avec 500 employés' }, value: 'c' },
      { label: { de: 'Ein Wasserversorger mit 60 Mitarbeitern', en: 'A water supplier with 60 employees', fr: 'Un fournisseur d\'eau avec 60 employés' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 erfasst 18 Sektoren. Rechtsberatung gehört nicht dazu. Cloud-Dienste (Digitale Infrastruktur), Lebensmittelproduktion und Wasserversorgung sind explizit erfasst. Die Unternehmensgröße allein reicht nicht – der Sektor muss in Anhang I oder II der Richtlinie genannt sein.',
      en: 'NIS-2 covers 18 sectors. Legal services are not among them. Cloud services (digital infrastructure), food production, and water supply are explicitly covered. Company size alone is not sufficient – the sector must be listed in Annex I or II of the directive.',
      fr: 'NIS-2 couvre 18 secteurs. Les services juridiques n\'en font pas partie. Les services cloud (infrastructure numérique), la production alimentaire et l\'approvisionnement en eau sont explicitement couverts. La taille de l\'entreprise seule ne suffit pas – le secteur doit être listé dans l\'annexe I ou II de la directive.',
    },
  },
  {
    id: 'q5',
    question: {
      de: 'Was versteht NIS-2 unter „Supply Chain Security" und warum ist das relevant?',
      en: 'What does NIS-2 mean by "supply chain security" and why is it relevant?',
      fr: 'Que signifie NIS-2 par « sécurité de la chaîne d\'approvisionnement » et pourquoi est-ce pertinent ?',
    },
    options: [
      { label: { de: 'Nur Tier-1-Zulieferer müssen vertraglich zur Einhaltung verpflichtet werden', en: 'Only Tier-1 suppliers must be contractually obliged to comply', fr: 'Seuls les fournisseurs de niveau 1 doivent être contractuellement obligés' }, value: 'a' },
      { label: { de: 'Einrichtungen müssen Cybersicherheitsrisiken in ihrer gesamten Lieferkette bewerten und angemessen behandeln', en: 'Entities must assess and appropriately address cybersecurity risks throughout their entire supply chain', fr: 'Les entités doivent évaluer et traiter de manière appropriée les risques de cybersécurité dans toute leur chaîne d\'approvisionnement' }, value: 'b' },
      { label: { de: 'Lieferanten müssen selbst NIS-2-zertifiziert sein', en: 'Suppliers must be NIS-2 certified themselves', fr: 'Les fournisseurs doivent être eux-mêmes certifiés NIS-2' }, value: 'c' },
      { label: { de: 'Supply Chain Security betrifft nur den öffentlichen Sektor', en: 'Supply chain security only applies to the public sector', fr: 'La sécurité de la chaîne d\'approvisionnement ne concerne que le secteur public' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Art. 21(2)(d) NIS-2 fordert die Sicherheit der Lieferkette einschließlich der Beziehungen zu Direktlieferanten und Diensteanbietern. Es geht um eine Risikobewertung der gesamten Kette – nicht um eine Zertifizierung der Zulieferer. Die Verantwortung liegt bei der betroffenen Einrichtung.',
      en: 'Art. 21(2)(d) NIS-2 requires supply chain security including relationships with direct suppliers and service providers. It\'s about a risk assessment of the entire chain – not about supplier certification. The responsibility lies with the affected entity.',
      fr: 'L\'art. 21(2)(d) NIS-2 exige la sécurité de la chaîne d\'approvisionnement, y compris les relations avec les fournisseurs directs et les prestataires de services. Il s\'agit d\'une évaluation des risques de toute la chaîne – pas d\'une certification des fournisseurs. La responsabilité incombe à l\'entité concernée.',
    },
  },
  {
    id: 'q6',
    question: {
      de: 'Welches Bußgeld droht wesentlichen Einrichtungen bei Verstößen gegen NIS-2 maximal?',
      en: 'What is the maximum fine for essential entities for violations of NIS-2?',
      fr: 'Quelle est l\'amende maximale pour les entités essentielles en cas de violation de NIS-2 ?',
    },
    options: [
      { label: { de: '2 % des weltweiten Jahresumsatzes oder 10 Mio. €', en: '2% of global annual turnover or €10 million', fr: '2 % du chiffre d\'affaires mondial annuel ou 10 M€' }, value: 'a' },
      { label: { de: '4 % des weltweiten Jahresumsatzes oder 20 Mio. €', en: '4% of global annual turnover or €20 million', fr: '4 % du chiffre d\'affaires mondial annuel ou 20 M€' }, value: 'b' },
      { label: { de: '1 % des weltweiten Jahresumsatzes oder 5 Mio. €', en: '1% of global annual turnover or €5 million', fr: '1 % du chiffre d\'affaires mondial annuel ou 5 M€' }, value: 'c' },
      { label: { de: 'Bis zu 500.000 € pauschal', en: 'Up to €500,000 flat', fr: 'Jusqu\'à 500 000 € forfaitaire' }, value: 'd' },
    ],
    correct: 'a',
    explanation: {
      de: 'Für wesentliche Einrichtungen gilt ein Bußgeldrahmen von bis zu 10 Mio. € oder 2 % des weltweiten Jahresumsatzes (je nachdem, welcher Betrag höher ist). Für wichtige Einrichtungen sind es 7 Mio. € oder 1,4 %. Diese Staffelung unterstreicht die abgestufte Verantwortung.',
      en: 'For essential entities, fines can reach up to €10 million or 2% of global annual turnover (whichever is higher). For important entities, it\'s €7 million or 1.4%. This tiered structure underscores the graduated responsibility.',
      fr: 'Pour les entités essentielles, les amendes peuvent atteindre 10 M€ ou 2 % du chiffre d\'affaires mondial annuel (le montant le plus élevé prévalant). Pour les entités importantes, c\'est 7 M€ ou 1,4 %. Cette structure échelonnée souligne la responsabilité graduée.',
    },
  },
  {
    id: 'q7',
    question: {
      de: 'NIS-2 Art. 21 listet Mindestmaßnahmen auf. Welche der folgenden gehört NICHT dazu?',
      en: 'NIS-2 Art. 21 lists minimum measures. Which of the following is NOT included?',
      fr: 'L\'art. 21 NIS-2 énumère des mesures minimales. Laquelle n\'en fait PAS partie ?',
    },
    options: [
      { label: { de: 'Business Continuity Management und Krisenmanagement', en: 'Business continuity management and crisis management', fr: 'Gestion de la continuité d\'activité et gestion de crise' }, value: 'a' },
      { label: { de: 'Multi-Faktor-Authentifizierung und Zero Trust', en: 'Multi-factor authentication and zero trust', fr: 'Authentification multifacteur et zero trust' }, value: 'b' },
      { label: { de: 'Penetrationstests durch zertifizierte Anbieter alle 6 Monate', en: 'Penetration tests by certified providers every 6 months', fr: 'Tests de pénétration par des prestataires certifiés tous les 6 mois' }, value: 'c' },
      { label: { de: 'Sicherheit bei Erwerb, Entwicklung und Wartung von IT-Systemen', en: 'Security in acquisition, development and maintenance of IT systems', fr: 'Sécurité dans l\'acquisition, le développement et la maintenance des systèmes IT' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'Art. 21 fordert keine spezifische Frequenz für Penetrationstests durch zertifizierte Anbieter. Die Maßnahmen sind risikobasiert und verhältnismäßig. BCM, MFA/Zero Trust und Sicherheit im Systemlebenszyklus sind explizit in Art. 21(2) genannt.',
      en: 'Art. 21 does not require a specific frequency for penetration tests by certified providers. The measures are risk-based and proportionate. BCM, MFA/zero trust, and security in the system lifecycle are explicitly mentioned in Art. 21(2).',
      fr: 'L\'art. 21 n\'exige pas de fréquence spécifique pour les tests de pénétration par des prestataires certifiés. Les mesures sont basées sur les risques et proportionnées. Le BCM, le MFA/zero trust et la sécurité dans le cycle de vie des systèmes sont explicitement mentionnés dans l\'art. 21(2).',
    },
  },
  {
    id: 'q8',
    question: {
      de: 'Wie verhält sich NIS-2 zur DSGVO bei einem Sicherheitsvorfall mit personenbezogenen Daten?',
      en: 'How does NIS-2 relate to GDPR in the case of a security incident involving personal data?',
      fr: 'Quel est le rapport entre NIS-2 et le RGPD en cas d\'incident de sécurité impliquant des données personnelles ?',
    },
    options: [
      { label: { de: 'NIS-2 ersetzt die DSGVO-Meldepflicht', en: 'NIS-2 replaces the GDPR notification obligation', fr: 'NIS-2 remplace l\'obligation de notification du RGPD' }, value: 'a' },
      { label: { de: 'Beide Meldepflichten bestehen unabhängig voneinander und müssen parallel erfüllt werden', en: 'Both notification obligations exist independently and must be fulfilled in parallel', fr: 'Les deux obligations de notification existent indépendamment et doivent être remplies en parallèle' }, value: 'b' },
      { label: { de: 'Die DSGVO-Meldung genügt, wenn sie innerhalb von 24 Stunden erfolgt', en: 'The GDPR notification suffices if made within 24 hours', fr: 'La notification RGPD suffit si elle est faite dans les 24 heures' }, value: 'c' },
      { label: { de: 'NIS-2 gilt nur für nicht-personenbezogene Daten', en: 'NIS-2 only applies to non-personal data', fr: 'NIS-2 ne s\'applique qu\'aux données non personnelles' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 und DSGVO haben unterschiedliche Schutzziele und Aufsichtsbehörden. Bei einem Vorfall mit personenbezogenen Daten müssen beide Meldepflichten unabhängig erfüllt werden – NIS-2 an das CSIRT/die zuständige Behörde, DSGVO an die Datenschutzaufsicht. Die Fristen unterscheiden sich (24h vs. 72h).',
      en: 'NIS-2 and GDPR have different protection objectives and supervisory authorities. In an incident involving personal data, both notification obligations must be fulfilled independently – NIS-2 to the CSIRT/competent authority, GDPR to the data protection authority. The deadlines differ (24h vs. 72h).',
      fr: 'NIS-2 et le RGPD ont des objectifs de protection et des autorités de surveillance différents. En cas d\'incident impliquant des données personnelles, les deux obligations de notification doivent être remplies indépendamment – NIS-2 au CSIRT/autorité compétente, RGPD à l\'autorité de protection des données. Les délais diffèrent (24h vs 72h).',
    },
  },
  {
    id: 'q9',
    question: {
      de: 'Ein Mitgliedstaat kann Einrichtungen als „wesentlich" einstufen, auch wenn sie die Größenschwellen nicht erreichen. Unter welcher Bedingung?',
      en: 'A Member State can classify entities as "essential" even if they don\'t meet the size thresholds. Under what condition?',
      fr: 'Un État membre peut classer des entités comme « essentielles » même si elles n\'atteignent pas les seuils de taille. Sous quelle condition ?',
    },
    options: [
      { label: { de: 'Wenn das Unternehmen freiwillig die Einstufung beantragt', en: 'If the company voluntarily requests the classification', fr: 'Si l\'entreprise demande volontairement la classification' }, value: 'a' },
      { label: { de: 'Wenn die Einrichtung der einzige Anbieter eines kritischen Dienstes im Mitgliedstaat ist', en: 'If the entity is the sole provider of a critical service in the Member State', fr: 'Si l\'entité est le seul fournisseur d\'un service critique dans l\'État membre' }, value: 'b' },
      { label: { de: 'Wenn das Unternehmen mehr als 50 Mio. € Umsatz hat', en: 'If the company has more than €50 million in revenue', fr: 'Si l\'entreprise a plus de 50 M€ de chiffre d\'affaires' }, value: 'c' },
      { label: { de: 'Das ist nicht vorgesehen – nur die Größenschwellen zählen', en: 'This is not foreseen – only size thresholds count', fr: 'Ce n\'est pas prévu – seuls les seuils de taille comptent' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Art. 2(2) NIS-2 erlaubt Mitgliedstaaten, auch kleinere Einrichtungen als wesentlich einzustufen, wenn sie z. B. der einzige Anbieter eines für Gesellschaft oder Wirtschaft kritischen Dienstes sind, oder wenn eine Störung erhebliche Auswirkungen auf die öffentliche Sicherheit hätte.',
      en: 'Art. 2(2) NIS-2 allows Member States to classify smaller entities as essential if, for example, they are the sole provider of a service critical to society or the economy, or if a disruption would have significant impacts on public safety.',
      fr: 'L\'art. 2(2) NIS-2 permet aux États membres de classer de plus petites entités comme essentielles si, par exemple, elles sont le seul fournisseur d\'un service critique pour la société ou l\'économie, ou si une perturbation aurait des impacts significatifs sur la sécurité publique.',
    },
  },
  {
    id: 'q10',
    question: {
      de: 'Was passiert, wenn eine Einrichtung einen erheblichen Sicherheitsvorfall NICHT fristgerecht meldet?',
      en: 'What happens if an entity does NOT report a significant security incident within the required timeframe?',
      fr: 'Que se passe-t-il si une entité ne signale PAS un incident de sécurité significatif dans le délai requis ?',
    },
    options: [
      { label: { de: 'Es gibt eine einmalige Verwarnung ohne weitere Konsequenzen', en: 'There is a one-time warning without further consequences', fr: 'Il y a un avertissement unique sans autres conséquences' }, value: 'a' },
      { label: { de: 'Die Einrichtung verliert automatisch ihre Betriebserlaubnis', en: 'The entity automatically loses its operating license', fr: 'L\'entité perd automatiquement sa licence d\'exploitation' }, value: 'b' },
      { label: { de: 'Es drohen Bußgelder, und die zuständige Behörde kann zusätzliche Durchsetzungsmaßnahmen anordnen', en: 'Fines may be imposed, and the competent authority can order additional enforcement measures', fr: 'Des amendes peuvent être imposées et l\'autorité compétente peut ordonner des mesures d\'exécution supplémentaires' }, value: 'c' },
      { label: { de: 'Die DSGVO-Aufsichtsbehörde übernimmt die Sanktionierung', en: 'The GDPR supervisory authority takes over sanctioning', fr: 'L\'autorité de surveillance RGPD prend en charge les sanctions' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'Bei Nichtmeldung können Bußgelder verhängt werden. Zudem können die zuständigen Behörden Durchsetzungsmaßnahmen anordnen – von verbindlichen Anweisungen bis hin zu temporären Betriebseinschränkungen für wesentliche Einrichtungen. Der Entzug der Betriebserlaubnis ist keine automatische Folge.',
      en: 'Failure to report can result in fines. Additionally, competent authorities can order enforcement measures – from binding instructions to temporary operational restrictions for essential entities. Revocation of the operating license is not an automatic consequence.',
      fr: 'Le défaut de notification peut entraîner des amendes. En outre, les autorités compétentes peuvent ordonner des mesures d\'exécution – des instructions contraignantes aux restrictions opérationnelles temporaires pour les entités essentielles. Le retrait de la licence d\'exploitation n\'est pas une conséquence automatique.',
    },
  },
  {
    id: 'q11',
    question: {
      de: 'Welche Schulungspflicht enthält NIS-2 in Bezug auf Cybersicherheit?',
      en: 'What training obligation does NIS-2 contain regarding cybersecurity?',
      fr: 'Quelle obligation de formation NIS-2 contient-elle en matière de cybersécurité ?',
    },
    options: [
      { label: { de: 'Alle Mitarbeiter müssen jährlich eine Zertifizierungsprüfung ablegen', en: 'All employees must pass a certification exam annually', fr: 'Tous les employés doivent passer un examen de certification annuellement' }, value: 'a' },
      { label: { de: 'Die Leitungsorgane müssen an Cybersicherheitsschulungen teilnehmen', en: 'Management bodies must participate in cybersecurity training', fr: 'Les organes de direction doivent participer à des formations en cybersécurité' }, value: 'b' },
      { label: { de: 'Nur IT-Mitarbeiter sind schulungspflichtig', en: 'Only IT staff are required to be trained', fr: 'Seul le personnel informatique doit être formé' }, value: 'c' },
      { label: { de: 'NIS-2 enthält keine Schulungspflicht', en: 'NIS-2 contains no training obligation', fr: 'NIS-2 ne contient aucune obligation de formation' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Art. 20(2) NIS-2 verpflichtet die Mitglieder der Leitungsorgane, an Schulungen teilzunehmen, um ausreichende Kenntnisse zur Erkennung und Bewertung von Cybersicherheitsrisiken zu erwerben. Darüber hinaus sollen regelmäßige Schulungen auch den Mitarbeitern angeboten werden.',
      en: 'Art. 20(2) NIS-2 obliges members of management bodies to participate in training to acquire sufficient knowledge for identifying and assessing cybersecurity risks. Beyond that, regular training should also be offered to employees.',
      fr: 'L\'art. 20(2) NIS-2 oblige les membres des organes de direction à participer à des formations pour acquérir des connaissances suffisantes pour identifier et évaluer les risques de cybersécurité. De plus, des formations régulières doivent également être proposées aux employés.',
    },
  },
  {
    id: 'q12',
    question: {
      de: 'Welchen Ansatz verfolgt NIS-2 bei der Festlegung von Sicherheitsmaßnahmen?',
      en: 'What approach does NIS-2 take in defining security measures?',
      fr: 'Quelle approche NIS-2 adopte-t-elle pour définir les mesures de sécurité ?',
    },
    options: [
      { label: { de: 'Einen technologiespezifischen Ansatz mit konkreten Produktvorgaben', en: 'A technology-specific approach with specific product requirements', fr: 'Une approche spécifique à la technologie avec des exigences de produits concrètes' }, value: 'a' },
      { label: { de: 'Einen risikobasierten, verhältnismäßigen All-Hazards-Ansatz', en: 'A risk-based, proportionate all-hazards approach', fr: 'Une approche tous risques basée sur les risques et proportionnée' }, value: 'b' },
      { label: { de: 'Einen checklisten-basierten Mindeststandard identisch für alle Einrichtungen', en: 'A checklist-based minimum standard identical for all entities', fr: 'Un standard minimum basé sur une checklist identique pour toutes les entités' }, value: 'c' },
      { label: { de: 'Es werden keine konkreten Anforderungen gestellt – nur Empfehlungen', en: 'No concrete requirements are made – only recommendations', fr: 'Aucune exigence concrète n\'est posée – seulement des recommandations' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Art. 21(1) NIS-2 fordert „geeignete und verhältnismäßige technische, operative und organisatorische Maßnahmen" unter Berücksichtigung eines All-Hazards-Ansatzes. Die Maßnahmen müssen dem Risiko, der Größe der Einrichtung und den wahrscheinlichen Auswirkungen angemessen sein – kein One-Size-Fits-All.',
      en: 'Art. 21(1) NIS-2 requires "appropriate and proportionate technical, operational and organizational measures" considering an all-hazards approach. Measures must be proportionate to the risk, the size of the entity, and the likely impact – no one-size-fits-all.',
      fr: 'L\'art. 21(1) NIS-2 exige des « mesures techniques, opérationnelles et organisationnelles appropriées et proportionnées » tenant compte d\'une approche tous risques. Les mesures doivent être proportionnées au risque, à la taille de l\'entité et à l\'impact probable – pas de solution universelle.',
    },
  },
  {
    id: 'q13',
    question: {
      de: 'Was ist die Rolle der ENISA im Kontext von NIS-2?',
      en: 'What is the role of ENISA in the context of NIS-2?',
      fr: 'Quel est le rôle de l\'ENISA dans le contexte de NIS-2 ?',
    },
    options: [
      { label: { de: 'ENISA ist die zentrale Aufsichtsbehörde, die direkt Bußgelder verhängt', en: 'ENISA is the central supervisory authority that directly imposes fines', fr: 'L\'ENISA est l\'autorité de surveillance centrale qui impose directement des amendes' }, value: 'a' },
      { label: { de: 'ENISA unterstützt mit Leitlinien, koordiniert die Zusammenarbeit und führt das EU Vulnerability Registry', en: 'ENISA supports with guidelines, coordinates cooperation, and maintains the EU Vulnerability Registry', fr: 'L\'ENISA fournit des orientations, coordonne la coopération et gère le registre européen des vulnérabilités' }, value: 'b' },
      { label: { de: 'ENISA zertifiziert die Compliance der Einrichtungen', en: 'ENISA certifies entity compliance', fr: 'L\'ENISA certifie la conformité des entités' }, value: 'c' },
      { label: { de: 'ENISA ist nur für den Finanzsektor zuständig', en: 'ENISA is only responsible for the financial sector', fr: 'L\'ENISA n\'est responsable que du secteur financier' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'ENISA hat eine koordinierende und beratende Rolle – sie entwickelt Leitlinien, unterstützt die Kooperation zwischen Mitgliedstaaten, betreibt das EU Vulnerability Disclosure Registry und erstellt den zweijährlichen Bericht über den Stand der Cybersicherheit in der EU. ENISA verhängt keine Bußgelder.',
      en: 'ENISA has a coordinating and advisory role – it develops guidelines, supports cooperation between Member States, operates the EU Vulnerability Disclosure Registry, and produces the biennial report on the state of cybersecurity in the EU. ENISA does not impose fines.',
      fr: 'L\'ENISA a un rôle de coordination et de conseil – elle développe des orientations, soutient la coopération entre États membres, gère le registre européen de divulgation des vulnérabilités et produit le rapport biennal sur l\'état de la cybersécurité dans l\'UE. L\'ENISA n\'impose pas d\'amendes.',
    },
  },
  {
    id: 'q14',
    question: {
      de: 'Ab wann müssen die NIS-2-Anforderungen in nationales Recht umgesetzt sein?',
      en: 'By when must NIS-2 requirements be transposed into national law?',
      fr: 'Avant quand les exigences NIS-2 doivent-elles être transposées en droit national ?',
    },
    options: [
      { label: { de: '17. Januar 2025', en: 'January 17, 2025', fr: '17 janvier 2025' }, value: 'a' },
      { label: { de: '17. Oktober 2024', en: 'October 17, 2024', fr: '17 octobre 2024' }, value: 'b' },
      { label: { de: '17. Oktober 2025', en: 'October 17, 2025', fr: '17 octobre 2025' }, value: 'c' },
      { label: { de: '1. Januar 2026', en: 'January 1, 2026', fr: '1er janvier 2026' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Umsetzungsfrist für die NIS-2-Richtlinie in nationales Recht war der 17. Oktober 2024. In Deutschland hat sich die Umsetzung durch das NIS2UmsuCG verzögert, aber die EU-Frist steht fest. Einrichtungen sollten sich unabhängig vom nationalen Umsetzungsstand vorbereiten.',
      en: 'The deadline for transposing the NIS-2 directive into national law was October 17, 2024. In Germany, implementation has been delayed through the NIS2UmsuCG, but the EU deadline stands. Entities should prepare regardless of the national implementation status.',
      fr: 'La date limite de transposition de la directive NIS-2 en droit national était le 17 octobre 2024. En Allemagne, la mise en œuvre a été retardée par le NIS2UmsuCG, mais la date limite de l\'UE est ferme. Les entités devraient se préparer indépendamment de l\'état de mise en œuvre nationale.',
    },
  },
  {
    id: 'q15',
    question: {
      de: 'Welche Einrichtung ist bei einem erheblichen Sicherheitsvorfall nach NIS-2 als ERSTES zu benachrichtigen?',
      en: 'Which entity must be notified FIRST in the event of a significant security incident under NIS-2?',
      fr: 'Quelle entité doit être notifiée EN PREMIER en cas d\'incident de sécurité significatif selon NIS-2 ?',
    },
    options: [
      { label: { de: 'Die betroffenen Kunden und die Öffentlichkeit', en: 'The affected customers and the public', fr: 'Les clients concernés et le public' }, value: 'a' },
      { label: { de: 'Das national zuständige CSIRT oder die zuständige Behörde', en: 'The nationally competent CSIRT or the competent authority', fr: 'Le CSIRT national compétent ou l\'autorité compétente' }, value: 'b' },
      { label: { de: 'ENISA direkt in Brüssel', en: 'ENISA directly in Brussels', fr: 'L\'ENISA directement à Bruxelles' }, value: 'c' },
      { label: { de: 'Die Europäische Kommission', en: 'The European Commission', fr: 'La Commission européenne' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Frühwarnung geht an das national zuständige CSIRT (in DE: BSI) oder die zuständige Behörde – nicht direkt an ENISA oder die Kommission. Kundenkommunikation kann je nach Vorfall erforderlich sein, ist aber nicht die erste Meldung im NIS-2-Prozess.',
      en: 'The early warning goes to the nationally competent CSIRT (in DE: BSI) or the competent authority – not directly to ENISA or the Commission. Customer communication may be required depending on the incident, but is not the first notification in the NIS-2 process.',
      fr: 'L\'alerte précoce est adressée au CSIRT national compétent (en DE : BSI) ou à l\'autorité compétente – pas directement à l\'ENISA ou à la Commission. La communication aux clients peut être nécessaire selon l\'incident, mais n\'est pas la première notification dans le processus NIS-2.',
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

  const handleSelect = (value: string) => {
    if (confirmed) return;
    setSelected(value);
  };

  const handleConfirm = () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    const isCorrect = selected === questions[currentQ].correct;
    if (isCorrect) {
      setScore(currentQ + 1);
      if (currentQ === QUIZ_SIZE - 1) {
        setWon(true);
      }
    } else {
      setGameOver(true);
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

          {/* Audience results */}
          {audienceResults && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-3">
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

          {/* Confirm / Next button */}
          {selected && !confirmed && (
            <div className="flex items-center justify-center gap-3">
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
