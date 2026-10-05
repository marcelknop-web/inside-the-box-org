import { BookOpen, GraduationCap, Presentation, type LucideIcon } from 'lucide-react';

/**
 * Curated, verified public references for /publications.
 *
 * Source notes (internal):
 * - "Schadensbegrenzung" (iX 7/2015, p. 78): bibliography confirmed via reference [2]
 *   in N. Pohlmann's iX article PDF (norbert-pohlmann.com, PDF p. 5). That PDF is NOT
 *   Knop's full text and must not be linked as such.
 * - "Eingefangen" (iX 7/2008): heise.de iX archive 2008/7.
 * - building IoT 2024: official organiser programme.
 * - BSI-Cyberkrisenübung 2015, SOC trainings, Netsecurity: CV only, no external source.
 * - ISACA CSE: past course example (06.10.2025) listing Marcel Knop as trainer.
 *
 * Legacy, unverified entries removed from the public selection (kept for history only):
 * - "Cyber Training Ranges — iX 10/2021" (heise.de/select/ix/2021/10/2019809530193925811)
 * - "DENIC Jahrestagung — Keynote" (vimeo.com/295582173)
 */

type L = { de: string; en: string; fr: string };
const l = (de: string, en: string, fr: string): L => ({ de, en, fr });

export type PublicationEntry = {
  title: string | L; // string = proper name kept in original language
  source: L; // organiser / publication
  year?: string;
  role: L;
  text?: L;
  link?: { href: string; label: L };
};

export type PublicationGroup = { id: string; icon: LucideIcon; title: L; entries: PublicationEntry[] };

export const PUBLICATION_GROUPS: PublicationGroup[] = [
  {
    id: 'articles', icon: BookOpen, title: l('Fachartikel', 'Articles', 'Articles spécialisés'),
    entries: [
      {
        title: 'Schadensbegrenzung – Management von Cyberkrisen',
        source: l('iX 7/2015, S. 78', 'iX 7/2015, p. 78', 'iX 7/2015, p. 78'), year: '2015',
        role: l('Autor: Marcel Knop', 'Author: Marcel Knop', 'Auteur : Marcel Knop'),
      },
      {
        title: 'Eingefangen – Unerlaubte WLAN-Zugänge ausfindig machen',
        source: l('iX 7/2008, S. 100–103', 'iX 7/2008, pp. 100–103', 'iX 7/2008, p. 100–103'), year: '2008',
        role: l('Autoren: Marcel Knop, Michael G. Kaiser', 'Authors: Marcel Knop, Michael G. Kaiser', 'Auteurs : Marcel Knop, Michael G. Kaiser'),
        link: { href: 'https://www.heise.de/select/ix/archiv/2008/7', label: l('Verlagsnachweis', 'Publisher record', 'Référence de l’éditeur') },
      },
    ],
  },
  {
    id: 'talks', icon: Presentation, title: l('Vorträge & Übungen', 'Talks & exercises', 'Conférences & exercices'),
    entries: [
      {
        title: 'Cyber Security Arena Trainings',
        source: l('building IoT', 'building IoT', 'building IoT'), year: '2024',
        role: l('Referent: Marcel Knop', 'Speaker: Marcel Knop', 'Intervenant : Marcel Knop'),
        text: l('Planung und Durchführung von Arena-Trainings für Angriffserkennung, Reaktion und Zusammenarbeit unter Stress.', 'Planning and running arena training for attack detection, response and teamwork under stress.', 'Conception et animation d’entraînements en arène pour la détection d’attaques, la réponse et la coopération sous pression.'),
        link: { href: 'https://www.buildingiot.de/lecture.php?id=12870&source=11', label: l('Vortragsprogramm', 'Conference programme', 'Programme de la conférence') },
      },
      {
        title: 'BSI-Cyberkrisenübung',
        source: l('BSI / UP KRITIS', 'BSI / UP KRITIS', 'BSI / UP KRITIS'), year: '2015',
        role: l('Konzeption und Durchführung', 'Design and delivery', 'Conception et animation'),
        text: l('Cyberkrisenübung im KRITIS-Umfeld.', 'Cyber crisis exercise in the critical infrastructure sector.', 'Exercice de cyber-crise dans le secteur des infrastructures critiques.'),
      },
    ],
  },
  {
    id: 'trainings', icon: GraduationCap, title: l('Trainings', 'Training', 'Formations'),
    entries: [
      {
        title: 'Cyber Security Expert (CSE)',
        source: l('ISACA Germany Chapter', 'ISACA Germany Chapter', 'ISACA Germany Chapter'),
        role: l('Konzeption und Durchführung des Zertifizierungstrainings', 'Design and delivery of the certification training', 'Conception et animation de la formation certifiante'),
        text: l('Angriffserkennung und Krisenbewältigung in einer simulierten IT-Umgebung.', 'Attack detection and crisis handling in a simulated IT environment.', 'Détection d’attaques et gestion de crise dans un environnement informatique simulé.'),
        link: { href: 'https://www.isaca.de/seminare/seminare/seminare-f%C3%BCr-manager1/cyber-security-expert-06-10-2025.html', label: l('Kursbeispiel bei ISACA', 'Course example at ISACA', 'Exemple de cours chez ISACA') },
      },
      {
        title: l('SOC-Trainings', 'SOC training', 'Formation des équipes SOC'),
        source: l('Bechtle, Fast Lane', 'Bechtle, Fast Lane', 'Bechtle, Fast Lane'),
        role: l('Leitender Dozent', 'Lead trainer', 'Formateur principal'),
        text: l('Trainings für SOC-Teams, vor Ort und remote.', 'Training courses for SOC teams, on site and remote.', 'Formations pour équipes SOC, sur site et à distance.'),
      },
      {
        title: l('Incident Response & Forensik für OT-Teams', 'Incident response & forensics for OT teams', 'Réponse aux incidents et investigation numérique pour les équipes OT'),
        source: l('Netsecurity, Norwegen', 'Netsecurity, Norway', 'Netsecurity, Norvège'),
        role: l('Konzeption und Durchführung', 'Design and delivery', 'Conception et animation'),
        text: l('Trainings zu Incident Response und Forensik im IEC-62443-Umfeld.', 'Training courses on incident response and forensics in the IEC 62443 context.', 'Formations à la réponse aux incidents et à la forensique dans le contexte IEC 62443.'),
      },
    ],
  },
];
