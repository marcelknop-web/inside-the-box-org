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
      de: 'Ihr Unternehmen hat einen funktionierenden CISO und ein Security-Team. Die Geschäftsleitung sagt: „Cybersicherheit ist Sache der IT." Wie bewerten Sie das unter NIS-2?',
      en: 'Your company has a functioning CISO and security team. The board says: "Cybersecurity is an IT matter." How do you assess this under NIS-2?',
      fr: 'Votre entreprise a un RSSI et une équipe sécurité. La direction dit : « La cybersécurité est une affaire IT. » Comment évaluez-vous cela selon NIS-2 ?',
    },
    options: [
      { label: { de: 'Korrekt – der CISO trägt die operative und strategische Verantwortung', en: 'Correct – the CISO bears operational and strategic responsibility', fr: 'Correct – le RSSI porte la responsabilité opérationnelle et stratégique' }, value: 'a' },
      { label: { de: 'Problematisch – die Geschäftsleitung muss Maßnahmen selbst genehmigen und deren Umsetzung überwachen', en: 'Problematic – the board must approve measures themselves and oversee their implementation', fr: 'Problématique – la direction doit approuver elle-même les mesures et superviser leur mise en œuvre' }, value: 'b' },
      { label: { de: 'Akzeptabel, solange der CISO direkt an den Vorstand berichtet', en: 'Acceptable as long as the CISO reports directly to the board', fr: 'Acceptable tant que le RSSI rapporte directement au conseil' }, value: 'c' },
      { label: { de: 'Unerheblich – NIS-2 regelt nur technische Maßnahmen, keine Governance', en: 'Irrelevant – NIS-2 only regulates technical measures, not governance', fr: 'Sans importance – NIS-2 ne régule que les mesures techniques, pas la gouvernance' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 verankert explizit die Verantwortung der Leitungsorgane. Sie müssen Risikomanagementmaßnahmen genehmigen und deren Umsetzung überwachen. Eine vollständige Delegation an den CISO ist nicht vorgesehen – die Geschäftsleitung bleibt persönlich verantwortlich.',
      en: 'NIS-2 explicitly anchors responsibility at the management body level. They must approve risk management measures and oversee their implementation. Full delegation to the CISO is not foreseen – management remains personally accountable.',
      fr: 'NIS-2 ancre explicitement la responsabilité au niveau des organes de direction. Ils doivent approuver les mesures de gestion des risques et superviser leur mise en œuvre. La délégation complète au RSSI n\'est pas prévue – la direction reste personnellement responsable.',
    },
  },
  {
    id: 'q2',
    question: {
      de: 'Ein Zulieferer Ihres Unternehmens wird Opfer eines Ransomware-Angriffs. Ihre eigenen Systeme sind nicht betroffen. Ist das für Sie unter NIS-2 relevant?',
      en: 'A supplier of your company falls victim to a ransomware attack. Your own systems are not affected. Is this relevant for you under NIS-2?',
      fr: 'Un fournisseur de votre entreprise est victime d\'une attaque ransomware. Vos propres systèmes ne sont pas affectés. Est-ce pertinent pour vous selon NIS-2 ?',
    },
    options: [
      { label: { de: 'Nein – nur direkte Angriffe auf eigene Systeme sind relevant', en: 'No – only direct attacks on your own systems are relevant', fr: 'Non – seules les attaques directes sur vos systèmes sont pertinentes' }, value: 'a' },
      { label: { de: 'Ja, aber nur wenn der Zulieferer selbst unter NIS-2 fällt', en: 'Yes, but only if the supplier itself falls under NIS-2', fr: 'Oui, mais seulement si le fournisseur est lui-même soumis à NIS-2' }, value: 'b' },
      { label: { de: 'Ja – Sie müssen prüfen, ob der Vorfall Auswirkungen auf Ihre Dienste hat, und ggf. Ihre eigene Risikolage neu bewerten', en: 'Yes – you must assess whether the incident impacts your services and potentially reassess your own risk posture', fr: 'Oui – vous devez évaluer si l\'incident a un impact sur vos services et potentiellement réévaluer votre propre posture de risque' }, value: 'c' },
      { label: { de: 'Nur relevant, wenn personenbezogene Daten betroffen sind', en: 'Only relevant if personal data is affected', fr: 'Pertinent uniquement si des données personnelles sont concernées' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 fordert explizit die Bewertung von Cybersicherheitsrisiken in der Lieferkette. Auch wenn Ihre Systeme nicht direkt betroffen sind, müssen Sie prüfen, ob der Vorfall Auswirkungen auf Ihre Dienstleistungen hat – und Ihre Risikobewertung entsprechend anpassen.',
      en: 'NIS-2 explicitly requires assessing cybersecurity risks in the supply chain. Even if your systems are not directly affected, you must evaluate whether the incident impacts your services – and adjust your risk assessment accordingly.',
      fr: 'NIS-2 exige explicitement l\'évaluation des risques de cybersécurité dans la chaîne d\'approvisionnement. Même si vos systèmes ne sont pas directement touchés, vous devez évaluer si l\'incident a un impact sur vos services – et ajuster votre évaluation des risques.',
    },
  },
  {
    id: 'q3',
    question: {
      de: 'Ihr Unternehmen hat 180 Mitarbeiter und stellt Medizinprodukte her. Der CFO meint, NIS-2 betreffe Sie nicht, weil Sie unter 250 Mitarbeiter haben. Stimmt das?',
      en: 'Your company has 180 employees and manufactures medical devices. The CFO says NIS-2 doesn\'t apply because you\'re under 250 employees. Is that correct?',
      fr: 'Votre entreprise a 180 employés et fabrique des dispositifs médicaux. Le CFO dit que NIS-2 ne s\'applique pas car vous êtes sous 250 employés. Est-ce correct ?',
    },
    options: [
      { label: { de: 'Ja – unter 250 Mitarbeitern greift NIS-2 generell nicht', en: 'Yes – NIS-2 generally doesn\'t apply under 250 employees', fr: 'Oui – NIS-2 ne s\'applique généralement pas en dessous de 250 employés' }, value: 'a' },
      { label: { de: 'Nein – die Schwelle liegt bei 50 Mitarbeitern oder 10 Mio. € Umsatz, und der Gesundheitssektor ist erfasst', en: 'No – the threshold is 50 employees or €10M turnover, and the health sector is covered', fr: 'Non – le seuil est de 50 employés ou 10 M€ de CA, et le secteur santé est couvert' }, value: 'b' },
      { label: { de: 'Kommt darauf an, ob die Produkte in der EU verkauft werden', en: 'Depends on whether the products are sold in the EU', fr: 'Cela dépend si les produits sont vendus dans l\'UE' }, value: 'c' },
      { label: { de: 'Ja – Medizinprodukte fallen unter MDR, nicht unter NIS-2', en: 'Yes – medical devices fall under MDR, not NIS-2', fr: 'Oui – les dispositifs médicaux relèvent du MDR, pas de NIS-2' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 gilt für mittlere Unternehmen ab 50 Mitarbeitern oder 10 Mio. € Umsatz in erfassten Sektoren. Der Gesundheitssektor (inkl. Medizinproduktehersteller) gehört dazu. MDR und NIS-2 schließen sich nicht gegenseitig aus – beide können parallel gelten.',
      en: 'NIS-2 applies to medium-sized entities with 50+ employees or €10M+ turnover in covered sectors. The health sector (including medical device manufacturers) is covered. MDR and NIS-2 are not mutually exclusive – both can apply in parallel.',
      fr: 'NIS-2 s\'applique aux entités moyennes de 50+ employés ou 10 M€+ de CA dans les secteurs couverts. Le secteur santé (y compris les fabricants de dispositifs médicaux) est couvert. Le MDR et NIS-2 ne sont pas mutuellement exclusifs – les deux peuvent s\'appliquer en parallèle.',
    },
  },
  {
    id: 'q4',
    question: {
      de: 'Bei einem Sicherheitsvorfall stellt sich heraus, dass personenbezogene Daten betroffen sind. Ihr Datenschutzbeauftragter sagt: „Ich melde das an die Datenschutzbehörde – damit ist alles abgedeckt." Was fehlt?',
      en: 'During a security incident, personal data turns out to be affected. Your DPO says: "I\'ll report to the data protection authority – that covers everything." What\'s missing?',
      fr: 'Lors d\'un incident, des données personnelles s\'avèrent concernées. Votre DPO dit : « Je notifie l\'autorité de protection des données – tout est couvert. » Que manque-t-il ?',
    },
    options: [
      { label: { de: 'Nichts – die DSGVO-Meldung deckt auch NIS-2 ab', en: 'Nothing – the GDPR notification also covers NIS-2', fr: 'Rien – la notification RGPD couvre aussi NIS-2' }, value: 'a' },
      { label: { de: 'Die NIS-2-Meldung an das zuständige CSIRT/die Aufsichtsbehörde – beide Meldewege laufen parallel', en: 'The NIS-2 notification to the CSIRT/competent authority – both reporting channels run in parallel', fr: 'La notification NIS-2 au CSIRT/autorité compétente – les deux canaux fonctionnent en parallèle' }, value: 'b' },
      { label: { de: 'Die Meldung an ENISA in Brüssel', en: 'The notification to ENISA in Brussels', fr: 'La notification à l\'ENISA à Bruxelles' }, value: 'c' },
      { label: { de: 'Eine zusätzliche Meldung an die Polizei ist Pflicht', en: 'An additional report to the police is mandatory', fr: 'Un signalement supplémentaire à la police est obligatoire' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'DSGVO und NIS-2 haben unterschiedliche Meldewege, Fristen und Empfänger. Beide Pflichten bestehen parallel und unabhängig voneinander. Die NIS-2-Meldung geht an das CSIRT oder die zuständige Behörde – die DSGVO-Meldung an die Datenschutzaufsicht.',
      en: 'GDPR and NIS-2 have different reporting channels, deadlines, and recipients. Both obligations exist in parallel and independently. The NIS-2 notification goes to the CSIRT or competent authority – the GDPR notification to the data protection authority.',
      fr: 'Le RGPD et NIS-2 ont des canaux de notification, délais et destinataires différents. Les deux obligations existent en parallèle et indépendamment. La notification NIS-2 va au CSIRT ou à l\'autorité compétente – la notification RGPD à l\'autorité de protection des données.',
    },
  },
  {
    id: 'q5',
    question: {
      de: 'Ihr IT-Leiter schlägt vor, für NIS-2 einen festen Maßnahmenkatalog abzuarbeiten: „Wir implementieren einfach alle Controls aus ISO 27001 – dann sind wir sicher." Wie bewerten Sie das?',
      en: 'Your IT lead suggests working through a fixed set of controls for NIS-2: "We\'ll just implement all ISO 27001 controls – then we\'re safe." How do you assess this?',
      fr: 'Votre responsable IT propose d\'appliquer un catalogue fixe de mesures pour NIS-2 : « On implémente tous les contrôles ISO 27001 – et on est couverts. » Comment évaluez-vous cela ?',
    },
    options: [
      { label: { de: 'Richtig – ISO 27001 deckt NIS-2 vollständig ab', en: 'Correct – ISO 27001 fully covers NIS-2', fr: 'Correct – ISO 27001 couvre entièrement NIS-2' }, value: 'a' },
      { label: { de: 'Guter Ausgangspunkt, aber NIS-2 verlangt einen risikobasierten Ansatz – nicht pauschal alle Controls', en: 'Good starting point, but NIS-2 requires a risk-based approach – not a blanket application of all controls', fr: 'Bon point de départ, mais NIS-2 exige une approche basée sur les risques – pas tous les contrôles de manière uniforme' }, value: 'b' },
      { label: { de: 'Falsch – ISO 27001 und NIS-2 haben nichts miteinander zu tun', en: 'Wrong – ISO 27001 and NIS-2 have nothing in common', fr: 'Faux – ISO 27001 et NIS-2 n\'ont rien en commun' }, value: 'c' },
      { label: { de: 'Das reicht aus, wenn ein externer Auditor die Umsetzung bestätigt', en: 'That suffices if an external auditor confirms the implementation', fr: 'Cela suffit si un auditeur externe confirme la mise en œuvre' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 fordert einen risikobasierten, verhältnismäßigen Ansatz. ISO 27001 kann eine gute Grundlage sein, aber NIS-2 erfordert, dass Maßnahmen auf die spezifische Risikolage zugeschnitten sind. Pauschal alle Controls umzusetzen wäre weder verhältnismäßig noch zielführend – und deckt NIS-2-spezifische Anforderungen wie Meldepflichten nicht automatisch ab.',
      en: 'NIS-2 requires a risk-based, proportionate approach. ISO 27001 can be a good foundation, but NIS-2 demands measures tailored to the specific risk landscape. Blanket implementation of all controls is neither proportionate nor effective – and doesn\'t automatically cover NIS-2-specific requirements like incident reporting.',
      fr: 'NIS-2 exige une approche basée sur les risques et proportionnée. ISO 27001 peut être une bonne base, mais NIS-2 demande des mesures adaptées au paysage de risques spécifique. L\'implémentation uniforme de tous les contrôles n\'est ni proportionnée ni efficace – et ne couvre pas automatiquement les exigences spécifiques de NIS-2 comme la notification d\'incidents.',
    },
  },
  {
    id: 'q6',
    question: {
      de: 'Ihre Organisation nutzt einen SaaS-Anbieter für die Personalverwaltung. Wer ist unter NIS-2 für die Sicherheit dieser Datenverarbeitung verantwortlich?',
      en: 'Your organization uses a SaaS provider for HR management. Who is responsible under NIS-2 for the security of this data processing?',
      fr: 'Votre organisation utilise un fournisseur SaaS pour la gestion RH. Qui est responsable selon NIS-2 de la sécurité de ce traitement de données ?',
    },
    options: [
      { label: { de: 'Der SaaS-Anbieter – er verarbeitet die Daten und muss sie schützen', en: 'The SaaS provider – they process the data and must protect it', fr: 'Le fournisseur SaaS – il traite les données et doit les protéger' }, value: 'a' },
      { label: { de: 'Ausschließlich der interne Datenschutzbeauftragte', en: 'Exclusively the internal data protection officer', fr: 'Exclusivement le délégué à la protection des données interne' }, value: 'b' },
      { label: { de: 'Ihre Organisation – Sie müssen die Risiken der Dienstleisterbeziehung bewerten und angemessen steuern', en: 'Your organization – you must assess the risks of the service provider relationship and manage them appropriately', fr: 'Votre organisation – vous devez évaluer les risques de la relation avec le prestataire et les gérer de manière appropriée' }, value: 'c' },
      { label: { de: 'Beide gleichermaßen – NIS-2 sieht eine geteilte Verantwortung vor', en: 'Both equally – NIS-2 provides for shared responsibility', fr: 'Les deux à parts égales – NIS-2 prévoit une responsabilité partagée' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'Die Verantwortung für die Lieferkettensicherheit liegt bei der betroffenen Einrichtung. Sie muss die Cybersicherheitsrisiken ihrer Dienstleister bewerten, vertragliche Sicherheitsanforderungen stellen und die Umsetzung überwachen. Der Anbieter hat eigene Pflichten – aber die Steuerungsverantwortung bleibt bei Ihnen.',
      en: 'Responsibility for supply chain security lies with the affected entity. You must assess cybersecurity risks of your service providers, set contractual security requirements, and oversee implementation. The provider has their own obligations – but the governance responsibility remains with you.',
      fr: 'La responsabilité de la sécurité de la chaîne d\'approvisionnement incombe à l\'entité concernée. Vous devez évaluer les risques de cybersécurité de vos prestataires, définir des exigences contractuelles et superviser la mise en œuvre. Le fournisseur a ses propres obligations – mais la responsabilité de gouvernance reste chez vous.',
    },
  },
  {
    id: 'q7',
    question: {
      de: 'Ihr Unternehmen hat ein ISO 27001-Zertifikat. Ein Vorstandsmitglied fragt: „Brauchen wir für NIS-2 überhaupt noch etwas zu tun?" Was ist die richtige Einschätzung?',
      en: 'Your company holds an ISO 27001 certificate. A board member asks: "Do we still need to do anything for NIS-2?" What\'s the right assessment?',
      fr: 'Votre entreprise détient un certificat ISO 27001. Un membre du conseil demande : « Devons-nous encore faire quelque chose pour NIS-2 ? » Quelle est la bonne évaluation ?',
    },
    options: [
      { label: { de: 'Nein – ISO 27001 erfüllt automatisch alle NIS-2-Anforderungen', en: 'No – ISO 27001 automatically fulfills all NIS-2 requirements', fr: 'Non – ISO 27001 remplit automatiquement toutes les exigences NIS-2' }, value: 'a' },
      { label: { de: 'Ja – NIS-2 hat spezifische Anforderungen an Meldepflichten, Governance und Aufsicht, die über ISO 27001 hinausgehen', en: 'Yes – NIS-2 has specific requirements for reporting, governance, and supervision that go beyond ISO 27001', fr: 'Oui – NIS-2 a des exigences spécifiques en matière de notification, gouvernance et supervision qui vont au-delà d\'ISO 27001' }, value: 'b' },
      { label: { de: 'Nur wenn das Zertifikat älter als 2 Jahre ist', en: 'Only if the certificate is older than 2 years', fr: 'Seulement si le certificat a plus de 2 ans' }, value: 'c' },
      { label: { de: 'Das Zertifikat reicht – man muss es nur der Aufsichtsbehörde vorlegen', en: 'The certificate suffices – you just need to present it to the supervisory authority', fr: 'Le certificat suffit – il faut juste le présenter à l\'autorité de surveillance' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'ISO 27001 bildet eine gute Grundlage, deckt aber NIS-2-spezifische Anforderungen wie Vorfallmeldungen (24h/72h/1 Monat), persönliche Haftung der Geschäftsleitung, Lieferkettensicherheit und die Zusammenarbeit mit CSIRTs nicht vollständig ab. Ein Gap-Assessment ist erforderlich.',
      en: 'ISO 27001 provides a good foundation but doesn\'t fully cover NIS-2-specific requirements like incident reporting (24h/72h/1 month), personal management liability, supply chain security, and cooperation with CSIRTs. A gap assessment is necessary.',
      fr: 'ISO 27001 fournit une bonne base mais ne couvre pas entièrement les exigences spécifiques de NIS-2 comme la notification d\'incidents (24h/72h/1 mois), la responsabilité personnelle de la direction, la sécurité de la chaîne d\'approvisionnement et la coopération avec les CSIRTs. Un gap assessment est nécessaire.',
    },
  },
  {
    id: 'q8',
    question: {
      de: 'Ein Abteilungsleiter argumentiert: „Wir müssen nur die IT-Systeme absichern – die Bürokommunikation per Telefon und Fax ist davon nicht betroffen." Stimmt das unter NIS-2?',
      en: 'A department head argues: "We only need to secure IT systems – office communication via phone and fax isn\'t affected." Is this correct under NIS-2?',
      fr: 'Un chef de département argumente : « Nous n\'avons qu\'à sécuriser les systèmes IT – la communication par téléphone et fax n\'est pas concernée. » Est-ce correct selon NIS-2 ?',
    },
    options: [
      { label: { de: 'Richtig – NIS-2 betrifft nur Netzwerk- und Informationssysteme', en: 'Correct – NIS-2 only concerns network and information systems', fr: 'Correct – NIS-2 ne concerne que les systèmes de réseau et d\'information' }, value: 'a' },
      { label: { de: 'Falsch – NIS-2 fordert einen All-Hazards-Ansatz, der die gesamte Betriebsumgebung einschließt', en: 'Wrong – NIS-2 requires an all-hazards approach that includes the entire operational environment', fr: 'Faux – NIS-2 exige une approche tous risques qui inclut tout l\'environnement opérationnel' }, value: 'b' },
      { label: { de: 'Stimmt teilweise – es kommt auf die Klassifizierung der Informationen an', en: 'Partly correct – it depends on the classification of the information', fr: 'Partiellement correct – cela dépend de la classification des informations' }, value: 'c' },
      { label: { de: 'NIS-2 gilt nur für Cloud-Systeme und kritische Infrastruktur', en: 'NIS-2 only applies to cloud systems and critical infrastructure', fr: 'NIS-2 ne s\'applique qu\'aux systèmes cloud et aux infrastructures critiques' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 verfolgt einen All-Hazards-Ansatz: Die Sicherheitsmaßnahmen müssen alle Risiken adressieren, die den Betrieb der Netz- und Informationssysteme und die damit erbrachten Dienste gefährden könnten. Dazu gehören auch physische Sicherheit, Personalaspekte und die Sicherheit der gesamten Betriebsumgebung.',
      en: 'NIS-2 follows an all-hazards approach: security measures must address all risks that could endanger the operation of network and information systems and the services they provide. This includes physical security, personnel aspects, and the security of the entire operational environment.',
      fr: 'NIS-2 suit une approche tous risques : les mesures de sécurité doivent adresser tous les risques pouvant mettre en danger le fonctionnement des systèmes de réseau et d\'information et les services qu\'ils fournissent. Cela inclut la sécurité physique, les aspects du personnel et la sécurité de tout l\'environnement opérationnel.',
    },
  },
  {
    id: 'q9',
    question: {
      de: 'Nach einem Cyberangriff fragt der Krisenstab: „Müssen wir die Behörde informieren, auch wenn wir den Vorfall innerhalb von 2 Stunden eingedämmt haben?" Was ist korrekt?',
      en: 'After a cyber attack, the crisis team asks: "Do we need to inform the authority even though we contained the incident within 2 hours?" What is correct?',
      fr: 'Après une cyberattaque, l\'équipe de crise demande : « Devons-nous informer l\'autorité même si nous avons contenu l\'incident en 2 heures ? » Quelle est la bonne réponse ?',
    },
    options: [
      { label: { de: 'Nein – schnell eingedämmte Vorfälle müssen nicht gemeldet werden', en: 'No – quickly contained incidents don\'t need to be reported', fr: 'Non – les incidents rapidement contenus n\'ont pas à être signalés' }, value: 'a' },
      { label: { de: 'Ja – die Meldepflicht hängt von der Erheblichkeit des Vorfalls ab, nicht von der Eindämmungsdauer', en: 'Yes – the reporting obligation depends on the significance of the incident, not the containment time', fr: 'Oui – l\'obligation de notification dépend de la gravité de l\'incident, pas du temps de confinement' }, value: 'b' },
      { label: { de: 'Nur wenn Kundendaten betroffen waren', en: 'Only if customer data was affected', fr: 'Seulement si des données clients étaient concernées' }, value: 'c' },
      { label: { de: 'Nur wenn der Vorfall länger als 24 Stunden dauerte', en: 'Only if the incident lasted more than 24 hours', fr: 'Seulement si l\'incident a duré plus de 24 heures' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Meldepflicht richtet sich nach der Erheblichkeit des Vorfalls – nicht nach der Dauer. Kriterien sind u. a. die Zahl betroffener Nutzer, die Auswirkung auf den Dienst und das Ausmaß des Schadens. Ein Vorfall kann meldepflichtig sein, auch wenn er schnell eingedämmt wurde.',
      en: 'The reporting obligation is based on the significance of the incident – not its duration. Criteria include the number of affected users, impact on the service, and extent of damage. An incident can be reportable even if it was quickly contained.',
      fr: 'L\'obligation de notification est basée sur la gravité de l\'incident – pas sur sa durée. Les critères incluent le nombre d\'utilisateurs affectés, l\'impact sur le service et l\'étendue des dommages. Un incident peut être soumis à notification même s\'il a été rapidement contenu.',
    },
  },
  {
    id: 'q10',
    question: {
      de: 'Ein Kollege aus dem Einkauf fragt: „Wir verhandeln gerade einen neuen IT-Dienstleistervertrag. Muss ich dabei irgendwas wegen NIS-2 beachten?"',
      en: 'A colleague from procurement asks: "We\'re negotiating a new IT service provider contract. Do I need to consider anything regarding NIS-2?"',
      fr: 'Un collègue des achats demande : « Nous négocions un nouveau contrat avec un prestataire IT. Dois-je prendre en compte NIS-2 ? »',
    },
    options: [
      { label: { de: 'Nein – NIS-2 betrifft nur die IT-Abteilung', en: 'No – NIS-2 only concerns the IT department', fr: 'Non – NIS-2 ne concerne que le département IT' }, value: 'a' },
      { label: { de: 'Nur wenn der Dienstleister Cloud-Services anbietet', en: 'Only if the provider offers cloud services', fr: 'Seulement si le prestataire offre des services cloud' }, value: 'b' },
      { label: { de: 'Ja – Sicherheitsanforderungen an Dienstleister müssen vertraglich verankert und die Risiken der Lieferbeziehung bewertet werden', en: 'Yes – security requirements for providers must be contractually established and the risks of the supplier relationship assessed', fr: 'Oui – les exigences de sécurité pour les prestataires doivent être contractuellement établies et les risques de la relation évalués' }, value: 'c' },
      { label: { de: 'Das regelt der Datenschutzbeauftragte über die Auftragsverarbeitung', en: 'The DPO handles this through data processing agreements', fr: 'Le DPO gère cela via les contrats de sous-traitance' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 betrifft nicht nur die IT-Abteilung. Der Einkauf spielt eine zentrale Rolle bei der Lieferkettensicherheit: Sicherheitsanforderungen müssen vertraglich verankert, die Risiken der Dienstleisterbeziehung bewertet und Audit-Rechte vereinbart werden. Auftragsverarbeitung nach DSGVO deckt die NIS-2-Anforderungen nicht ab.',
      en: 'NIS-2 doesn\'t only concern the IT department. Procurement plays a central role in supply chain security: security requirements must be contractually anchored, risks of the provider relationship assessed, and audit rights agreed. GDPR data processing agreements don\'t cover NIS-2 requirements.',
      fr: 'NIS-2 ne concerne pas uniquement le département IT. Les achats jouent un rôle central dans la sécurité de la chaîne d\'approvisionnement : les exigences de sécurité doivent être contractuellement ancrées, les risques de la relation évalués et les droits d\'audit convenus. Les contrats RGPD ne couvrent pas les exigences NIS-2.',
    },
  },
  {
    id: 'q11',
    question: {
      de: 'Ihr Security-Team hat einen Incident-Response-Plan im Wiki dokumentiert. Bei einer Übung stellt sich heraus, dass niemand weiß, wo er steht und die Inhalte veraltet sind. Wie bewertet NIS-2 das?',
      en: 'Your security team has documented an incident response plan in the wiki. During an exercise, nobody knows where it is and the contents are outdated. How does NIS-2 assess this?',
      fr: 'Votre équipe sécurité a documenté un plan de réponse aux incidents dans le wiki. Lors d\'un exercice, personne ne sait où il se trouve et le contenu est obsolète. Comment NIS-2 évalue-t-elle cela ?',
    },
    options: [
      { label: { de: 'Ausreichend – es existiert ein dokumentierter Plan', en: 'Sufficient – a documented plan exists', fr: 'Suffisant – un plan documenté existe' }, value: 'a' },
      { label: { de: 'Unzureichend – NIS-2 fordert wirksame Maßnahmen, nicht nur Dokumentation. Der Plan muss bekannt, aktuell und geübt sein', en: 'Insufficient – NIS-2 requires effective measures, not just documentation. The plan must be known, current, and practiced', fr: 'Insuffisant – NIS-2 exige des mesures efficaces, pas seulement de la documentation. Le plan doit être connu, actuel et pratiqué' }, value: 'b' },
      { label: { de: 'Das ist ein reines Audit-Problem, kein NIS-2-Thema', en: 'That\'s purely an audit issue, not a NIS-2 topic', fr: 'C\'est purement un problème d\'audit, pas un sujet NIS-2' }, value: 'c' },
      { label: { de: 'Akzeptabel, wenn der Plan jährlich formal freigegeben wird', en: 'Acceptable if the plan is formally approved annually', fr: 'Acceptable si le plan est formellement approuvé annuellement' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 fordert nicht nur die Existenz von Maßnahmen, sondern deren Wirksamkeit. Ein Incident-Response-Plan, den niemand kennt und der veraltet ist, erfüllt die Anforderungen an BCM und Krisenmanagement nicht. Regelmäßige Übungen und Aktualisierung sind Teil der geforderten operativen Resilienz.',
      en: 'NIS-2 requires not just the existence of measures but their effectiveness. An incident response plan that nobody knows about and that is outdated doesn\'t meet BCM and crisis management requirements. Regular exercises and updates are part of the required operational resilience.',
      fr: 'NIS-2 exige non seulement l\'existence de mesures mais leur efficacité. Un plan de réponse aux incidents que personne ne connaît et qui est obsolète ne répond pas aux exigences de BCM et gestion de crise. Des exercices réguliers et des mises à jour font partie de la résilience opérationnelle requise.',
    },
  },
  {
    id: 'q12',
    question: {
      de: 'Ihr Unternehmen fällt unter NIS-2. Der CEO fragt: „Was passiert uns konkret, wenn wir die Anforderungen nicht umsetzen – mal abgesehen von Bußgeldern?"',
      en: 'Your company falls under NIS-2. The CEO asks: "What specifically happens to us if we don\'t implement the requirements – aside from fines?"',
      fr: 'Votre entreprise relève de NIS-2. Le PDG demande : « Que nous arrive-t-il concrètement si nous ne mettons pas en œuvre les exigences – en dehors des amendes ? »',
    },
    options: [
      { label: { de: 'Nur Bußgelder – weitere Konsequenzen gibt es nicht', en: 'Only fines – there are no further consequences', fr: 'Seulement des amendes – il n\'y a pas d\'autres conséquences' }, value: 'a' },
      { label: { de: 'Die Aufsichtsbehörde kann verbindliche Anweisungen erteilen, Betriebsgenehmigungen einschränken und Leitungspersonen temporär von der Ausübung ihrer Funktion ausschließen', en: 'The supervisory authority can issue binding instructions, restrict operating licenses, and temporarily suspend management from their functions', fr: 'L\'autorité peut émettre des instructions contraignantes, restreindre les licences d\'exploitation et suspendre temporairement les dirigeants de leurs fonctions' }, value: 'b' },
      { label: { de: 'Es gibt eine Übergangsfrist von 5 Jahren ohne Sanktionen', en: 'There is a 5-year transition period without sanctions', fr: 'Il y a une période transitoire de 5 ans sans sanctions' }, value: 'c' },
      { label: { de: 'Die EU-Kommission übernimmt die direkte Aufsicht', en: 'The EU Commission takes over direct supervision', fr: 'La Commission européenne prend en charge la supervision directe' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'Die Durchsetzungsinstrumente unter NIS-2 gehen deutlich über Bußgelder hinaus. Aufsichtsbehörden können verbindliche Anweisungen erteilen, Compliance-Audits anordnen, Betriebsgenehmigungen einschränken und bei wesentlichen Einrichtungen sogar Leitungspersonen temporär suspendieren.',
      en: 'Enforcement instruments under NIS-2 go well beyond fines. Supervisory authorities can issue binding instructions, order compliance audits, restrict operating licenses, and for essential entities even temporarily suspend management personnel.',
      fr: 'Les instruments d\'exécution sous NIS-2 vont bien au-delà des amendes. Les autorités peuvent émettre des instructions contraignantes, ordonner des audits, restreindre les licences d\'exploitation et pour les entités essentielles même suspendre temporairement le personnel de direction.',
    },
  },
  {
    id: 'q13',
    question: {
      de: 'Die Geschäftsleitung will die NIS-2-Schulungspflicht mit dem jährlichen E-Learning zur Informationssicherheit abdecken. Reicht das?',
      en: 'Management wants to cover the NIS-2 training obligation with the annual information security e-learning. Is that sufficient?',
      fr: 'La direction veut couvrir l\'obligation de formation NIS-2 avec le e-learning annuel en sécurité de l\'information. Est-ce suffisant ?',
    },
    options: [
      { label: { de: 'Ja – solange alle Mitarbeiter teilnehmen', en: 'Yes – as long as all employees participate', fr: 'Oui – tant que tous les employés participent' }, value: 'a' },
      { label: { de: 'Nicht ausreichend – NIS-2 fordert, dass die Leitungsorgane selbst an Schulungen teilnehmen, um Risiken beurteilen zu können', en: 'Not sufficient – NIS-2 requires management bodies themselves to participate in training to be able to assess risks', fr: 'Pas suffisant – NIS-2 exige que les organes de direction participent eux-mêmes à des formations pour pouvoir évaluer les risques' }, value: 'b' },
      { label: { de: 'NIS-2 enthält keine Schulungspflicht', en: 'NIS-2 contains no training obligation', fr: 'NIS-2 ne contient aucune obligation de formation' }, value: 'c' },
      { label: { de: 'Ja – E-Learning ist die von NIS-2 empfohlene Methode', en: 'Yes – e-learning is the method recommended by NIS-2', fr: 'Oui – le e-learning est la méthode recommandée par NIS-2' }, value: 'd' },
    ],
    correct: 'b',
    explanation: {
      de: 'NIS-2 verpflichtet explizit die Leitungsorgane, an Cybersicherheitsschulungen teilzunehmen – nicht nur die Belegschaft. Ziel ist, dass die Geschäftsleitung Risiken selbst erkennen und bewerten kann. Ein allgemeines E-Learning für alle reicht dafür nicht aus.',
      en: 'NIS-2 explicitly requires management bodies to participate in cybersecurity training – not just employees. The goal is that management can recognize and assess risks themselves. A general e-learning for all staff is not sufficient for this.',
      fr: 'NIS-2 exige explicitement que les organes de direction participent à des formations en cybersécurité – pas seulement les employés. L\'objectif est que la direction puisse elle-même reconnaître et évaluer les risques. Un e-learning général pour tout le personnel ne suffit pas.',
    },
  },
  {
    id: 'q14',
    question: {
      de: 'Bei der Risikoanalyse für NIS-2 identifiziert Ihr Team nur technische Risiken (Malware, DDoS, Phishing). Ist das ausreichend?',
      en: 'During the NIS-2 risk analysis, your team identifies only technical risks (malware, DDoS, phishing). Is that sufficient?',
      fr: 'Lors de l\'analyse de risques NIS-2, votre équipe n\'identifie que des risques techniques (malware, DDoS, phishing). Est-ce suffisant ?',
    },
    options: [
      { label: { de: 'Ja – NIS-2 konzentriert sich auf Cybersicherheitsrisiken', en: 'Yes – NIS-2 focuses on cybersecurity risks', fr: 'Oui – NIS-2 se concentre sur les risques de cybersécurité' }, value: 'a' },
      { label: { de: 'Ja, wenn zusätzlich ein Penetrationstest durchgeführt wird', en: 'Yes, if a penetration test is additionally performed', fr: 'Oui, si un test de pénétration est réalisé en complément' }, value: 'b' },
      { label: { de: 'Nein – der All-Hazards-Ansatz verlangt auch physische, personelle und organisatorische Risiken einzubeziehen', en: 'No – the all-hazards approach requires including physical, personnel, and organizational risks', fr: 'Non – l\'approche tous risques exige d\'inclure les risques physiques, humains et organisationnels' }, value: 'c' },
      { label: { de: 'Nein – es fehlt die Bewertung durch einen externen Auditor', en: 'No – an assessment by an external auditor is missing', fr: 'Non – il manque l\'évaluation par un auditeur externe' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 verlangt einen All-Hazards-Ansatz: Neben technischen Risiken müssen auch physische Risiken (Zugangsschutz, Naturkatastrophen), personelle Risiken (Innentäter, Kompetenzverlust) und organisatorische Risiken (unklare Prozesse, fehlende Verantwortlichkeiten) berücksichtigt werden.',
      en: 'NIS-2 requires an all-hazards approach: beyond technical risks, physical risks (access control, natural disasters), personnel risks (insider threats, loss of competence), and organizational risks (unclear processes, missing responsibilities) must also be considered.',
      fr: 'NIS-2 exige une approche tous risques : au-delà des risques techniques, les risques physiques (contrôle d\'accès, catastrophes naturelles), les risques humains (menaces internes, perte de compétences) et les risques organisationnels (processus flous, responsabilités manquantes) doivent aussi être pris en compte.',
    },
  },
  {
    id: 'q15',
    question: {
      de: 'Ein Mitarbeiter meldet verdächtige Aktivitäten auf seinem Arbeitsrechner. Das IT-Team stuft es als „kleinere Malware-Infektion" ein und bereinigt das System. Muss die Geschäftsleitung informiert werden?',
      en: 'An employee reports suspicious activity on their workstation. The IT team classifies it as a "minor malware infection" and cleans the system. Does management need to be informed?',
      fr: 'Un employé signale une activité suspecte sur son poste. L\'équipe IT la classe comme « infection malware mineure » et nettoie le système. La direction doit-elle être informée ?',
    },
    options: [
      { label: { de: 'Nein – kleinere Vorfälle löst die IT eigenständig', en: 'No – minor incidents are resolved by IT independently', fr: 'Non – les incidents mineurs sont résolus par l\'IT de manière autonome' }, value: 'a' },
      { label: { de: 'Nur wenn sich herausstellt, dass Daten abgeflossen sind', en: 'Only if it turns out that data was exfiltrated', fr: 'Seulement s\'il s\'avère que des données ont été exfiltrées' }, value: 'b' },
      { label: { de: 'Die Geschäftsleitung sollte über alle Vorfälle im Bilde sein – NIS-2 verlangt, dass sie die Risikosituation aktiv überwacht', en: 'Management should be aware of all incidents – NIS-2 requires them to actively monitor the risk situation', fr: 'La direction devrait être au courant de tous les incidents – NIS-2 exige qu\'elle surveille activement la situation de risque' }, value: 'c' },
      { label: { de: 'Ja, aber nur bei Vorfällen, die länger als 4 Stunden dauern', en: 'Yes, but only for incidents lasting more than 4 hours', fr: 'Oui, mais seulement pour les incidents de plus de 4 heures' }, value: 'd' },
    ],
    correct: 'c',
    explanation: {
      de: 'NIS-2 verpflichtet die Geschäftsleitung, die Umsetzung der Sicherheitsmaßnahmen zu überwachen. Dazu gehört ein strukturierter Überblick über Vorfälle – auch kleinere. Nur so kann die Leitungsebene ihre Steuerungsverantwortung wahrnehmen und Muster erkennen.',
      en: 'NIS-2 obliges management to oversee the implementation of security measures. This includes a structured overview of incidents – including minor ones. Only then can management fulfill their governance responsibility and identify patterns.',
      fr: 'NIS-2 oblige la direction à superviser la mise en œuvre des mesures de sécurité. Cela inclut une vue structurée des incidents – y compris mineurs. C\'est la seule façon pour la direction de remplir sa responsabilité de gouvernance et d\'identifier des schémas.',
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
