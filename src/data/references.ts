/**
 * Public client / project references.
 *
 * Sources:
 * - CORE: nine CV-verified examples supplied by the site owner (Marcel Knop).
 * - EARLIER: project examples and client list from the previous homepage
 *   reference dialog (src/pages/Overview.tsx before commit 7248a6df). Kept so no
 *   previously published reference is lost; partly from earlier advisory roles.
 * No quotes, logos, results or current contracts are stated.
 */
import type { HomeTopic } from '@/data/homeTopics';

type L = { de: string; en: string; fr: string };
const l = (de: string, en: string, fr: string): L => ({ de, en, fr });
type TopicId = HomeTopic['id'];

export type ClientReference = {
  id: string;
  name: string;
  years?: L;
  topics: TopicId[];
  /** Main theme for balanced grouping on /references. */
  group?: TopicId;
  text: L;
  /** Service slugs where this reference appears in "Aus der Projektpraxis" (max. 2 per page). */
  services: string[];
  /** Internal link when the same work is already described elsewhere. */
  seeAlso?: string;
  /** Scope statement shown on a specific service page instead of the general text. */
  serviceText?: Record<string, L>;
};

export const CORE_REFERENCES: ClientReference[] = [
  {
    id: 'diethelm-keller', name: 'Diethelm Keller Holding (CH)', years: l('2023–2025', '2023–2025', '2023–2025'), topics: ['security'], group: 'security',
    text: l('Aufbau eines konzernweiten ISMS, Policy-Rahmenwerk und interne Audits.', 'Set-up of a group-wide ISMS, policy framework and internal audits.', 'Mise en place d’un SMSI à l’échelle du groupe, cadre de politiques et audits internes.'),
    services: ['isms', 'assessments-concepts'],
  },
  {
    id: 'hapag-lloyd', name: 'Hapag-Lloyd', years: l('2024–2025', '2024–2025', '2024–2025'), topics: ['security'], group: 'security',
    text: l('Cybersecurity-Konzept und Zugriffsverfahren für maritime Satellitenkonnektivität.', 'Cybersecurity concept and access procedures for maritime satellite connectivity.', 'Concept de cybersécurité et procédures d’accès pour la connectivité satellitaire maritime.'),
    services: ['assessments-concepts'],
  },
  {
    id: 'arlanxeo', name: 'ARLANXEO', years: l('2025', '2025', '2025'), topics: ['security', 'crisis', 'exercise'], group: 'crisis',
    text: l('IT-/OT-Sicherheitsaudits, Notfallpläne und Tabletop-Übungen.', 'IT/OT security audits, emergency plans and tabletop exercises.', 'Audits de sécurité IT/OT, plans d’urgence et exercices sur table.'),
    services: ['bcm', 'cyber-crisis-management', 'dora-nis2-ttx'],
  },
  {
    id: 'sap-fioneer', name: 'SAP Fioneer', years: l('2024–2025', '2024–2025', '2024–2025'), topics: ['crisis', 'security'], group: 'crisis',
    text: l('Aufbau von Security-Incident-Management und DORA-bezogenen Meldeprozessen.', 'Set-up of security incident management and DORA-related reporting processes.', 'Mise en place de la gestion des incidents de sécurité et des processus de notification liés à DORA.'),
    services: ['incident-management', 'nis2-dora'],
  },
  {
    id: 'lufthansa', name: 'Deutsche Lufthansa', years: l('2024–2025', '2024–2025', '2024–2025'), topics: ['security', 'crisis', 'exercise'], group: 'crisis',
    text: l('SOC-/SIEM-Prozesse und Runbooks sowie BCM-Tabletop-Übungen.', 'SOC/SIEM processes and runbooks, plus BCM tabletop exercises.', 'Processus et runbooks SOC/SIEM, ainsi qu’exercices BCM sur table.'),
    services: ['soc-operations', 'bcm'],
  },
  {
    id: 'fi-ts', name: 'Finanz Informatik – Technologie Services (FI-TS)', years: l('2021–2025', '2021–2025', '2021–2025'), topics: ['security', 'crisis', 'exercise'], group: 'security',
    text: l('SOC-Kunden-Onboarding, Incident-Response-Playbooks und TIBER-DE-Übungstrainings.', 'SOC client onboarding, incident response playbooks and TIBER-DE exercise training.', 'Intégration de clients SOC, playbooks de réponse aux incidents et entraînements aux exercices TIBER-DE.'),
    services: ['soc-operations', 'incident-management', 'dora-nis2-ttx', 'arena-training'],
    serviceText: { 'arena-training': l('Konzeption von TIBER-DE-Übungstrainings für Kunden.', 'Design of TIBER-DE exercise training for clients.', 'Conception de formations aux exercices TIBER-DE pour des clients.') },
  },
  {
    id: 'isaca', name: 'ISACA Germany Chapter', topics: ['exercise'], group: 'exercise',
    text: l('Konzeption und Durchführung des Zertifizierungstrainings Cyber Security Expert (CSE).', 'Design and delivery of the Cyber Security Expert (CSE) certification training.', 'Conception et animation de la formation certifiante Cyber Security Expert (CSE).'),
    services: ['events-workshops'], seeAlso: '/publications',
  },
  {
    id: 'bechtle-fastlane', name: 'Bechtle, Fast Lane', topics: ['exercise', 'security'], group: 'exercise',
    text: l('SOC-Trainings als leitender Dozent, vor Ort und remote.', 'SOC training as lead trainer, on site and remote.', 'Formations SOC en tant que formateur principal, sur site et à distance.'),
    services: ['events-workshops'], seeAlso: '/publications',
  },
  {
    id: 'netsecurity', name: 'Netsecurity (NO)', topics: ['exercise'], group: 'exercise',
    text: l('Konzeption und Durchführung von Incident-Response- und Forensik-Trainings für OT-Teams im IEC-62443-Umfeld.', 'Design and delivery of incident response and forensics training for OT teams in the IEC 62443 context.', 'Conception et animation de formations à la réponse aux incidents et à l’investigation numérique pour les équipes OT dans le contexte IEC 62443.'),
    services: [], seeAlso: '/publications',
  },
];

/** Project examples from the earlier website, partly from previous advisory roles. */
export const EARLIER_REFERENCES: ClientReference[] = [
  {
    id: 'lufthansa-partis', name: 'Lufthansa Airlines & Lufthansa Technik', topics: ['security'],
    text: l('Scoping der PART-IS-Implementierung.', 'Scoping of the PART-IS implementation.', 'Cadrage de la mise en œuvre PART-IS.'), services: [],
  },
  {
    id: 'dataguard', name: 'DataGuard', topics: ['security'],
    text: l('TISAX-Assessments und ISO-27001-Audits für Automotive-Zulieferer.', 'TISAX assessments and ISO 27001 audits for automotive suppliers.', 'Évaluations TISAX et audits ISO 27001 pour des fournisseurs automobiles.'), services: ['tisax-pci-dss'],
  },
  {
    id: 'pci', name: 'Cyberport, AirPlus, Lufthansa', topics: ['security'],
    text: l('PCI-DSS-Implementierung und Beratung.', 'PCI DSS implementation and advisory.', 'Mise en œuvre PCI DSS et conseil.'), services: ['tisax-pci-dss'],
  },
];

export const ALL_REFERENCES = [...CORE_REFERENCES, ...EARLIER_REFERENCES];

/** Homepage teaser: one example per topic. */
export const HOME_REFERENCE_IDS: Record<TopicId, string> = { security: 'diethelm-keller', crisis: 'sap-fioneer', exercise: 'isaca' };

export const referencesForService = (slug: string) => ALL_REFERENCES.filter((r) => r.services.includes(slug)).slice(0, 2);

/** Client names from the earlier homepage, grouped by sector (names only, no scope claims). */
export const FURTHER_CLIENTS: { label: L; clients: string[] }[] = [
  { label: l('Finanzdienstleister & Aufsicht', 'Financial services & supervision', 'Services financiers & supervision'), clients: ['BaFin', 'Deutsche Bank', 'Deutsche Bundesbank', 'ECB', 'Commerzbank', 'DKB', 'Comdirect', 'Swiss Life', 'MunichRe', 'Swiss Re', 'Allianz', 'ERGO', 'Hansainvest', 'Sal. Oppenheim', 'AirPlus'] },
  { label: l('KRITIS, Energie & öffentlicher Sektor', 'Critical infrastructure, energy & public sector', 'Infrastructures critiques, énergie & secteur public'), clients: ['RWE', 'EnBW', 'Deutsche Bahn', 'Deutsche Post / DHL', 'BSI / UP KRITIS', 'ADAC', 'Bundeswehr'] },
  { label: l('Industrie, Automotive & OT', 'Industry, automotive & OT', 'Industrie, automobile & OT'), clients: ['Daimler', 'Mercedes-Benz Bank', 'Continental', 'BMW', 'General Motors', 'Opel Bank', 'VW Financial Services', 'WABCO', 'Siemens', 'KION', 'MAN', 'Bilfinger', 'SGL-Carbon', 'Merck', 'Pfizer', 'Alois Müller', 'Jägermeister'] },
  { label: l('Luftfahrt & Maritim', 'Aviation & maritime', 'Aéronautique & maritime'), clients: ['Lufthansa Technik', 'Airbus', 'Fraport', 'Deutsche Flugsicherung'] },
  { label: l('Software, Tech & Handel', 'Software, tech & retail', 'Logiciel, tech & commerce'), clients: ['SAP', 'Sage', 'arvato', 'Burda', 'CTS Eventim', 'Saturn', 'Tchibo', 'Zalando', 'Otto', 'VALOVIS'] },
];

export const REFERENCES_COPY = {
  de: { nav: 'Referenzen', h1: 'Kunden & Projektreferenzen', intro: 'Ausgewählte Projekte aus der Beratungspraxis von Marcel Knop.', earlier: 'Weitere Projektbeispiele', earlierNote: 'Teils aus früheren Beratungstätigkeiten.', further: 'Weitere Kunden', practice: 'Aus der Projektpraxis', exerciseGroup: 'Übungen & Trainings', all: 'Alle Referenzen ansehen', home: 'Ausgewählte Referenzen', seeAlso: 'Zu Artikel, Vorträge & Trainings', cta: 'Projekt besprechen', metaDesc: 'Ausgewählte Kunden- und Projektreferenzen von Marcel Knop zu ISMS, SOC, Incident Management, DORA, BCM und Cyber-Trainings.', teamLink: 'Projektreferenzen von Marcel Knop' },
  en: { nav: 'References', h1: 'Clients & project references', intro: 'Selected projects from Marcel Knop’s advisory practice.', earlier: 'Further project examples', earlierNote: 'Partly from earlier advisory roles.', further: 'Further clients', practice: 'Project experience', exerciseGroup: 'Training & exercises', all: 'View all references', home: 'Selected references', seeAlso: 'See articles, talks & training', cta: 'Discuss a project', metaDesc: 'Selected client and project references by Marcel Knop on ISMS, SOC, incident management, DORA, BCM and cyber training.', teamLink: 'Project references of Marcel Knop' },
  fr: { nav: 'Références', h1: 'Clients & références de projets', intro: 'Projets sélectionnés issus de la pratique de conseil de Marcel Knop.', earlier: 'Autres exemples de projets', earlierNote: 'En partie issus de missions de conseil antérieures.', further: 'Autres clients', practice: 'Issu de la pratique', exerciseGroup: 'Exercices & formations', all: 'Voir toutes les références', home: 'Références sélectionnées', seeAlso: 'Voir articles, conférences & formations', cta: 'Discuter d’un projet', metaDesc: 'Références clients et projets sélectionnées de Marcel Knop : SMSI, SOC, gestion des incidents, DORA, BCM et formations cyber.', teamLink: 'Références de projets de Marcel Knop' },
} as const;
