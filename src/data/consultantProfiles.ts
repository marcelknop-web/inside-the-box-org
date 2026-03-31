export const consultantProfiles = [
  {
    name: 'Marcel Knop',
    role: 'Senior Cybersecurity Consultant',
    imageUrl: '/lovable-uploads/0b083536-ec9e-4eda-b874-e926cc196404.png',
    linkedinUrl: 'https://www.linkedin.com/in/inside-the-box',
    bio: 'Ich unterstütze Organisationen bei der Umsetzung von Cybersecurity- und Compliance-Anforderungen mit Fokus auf ISMS, regulatorische Themen und Cyber-Krisenmanagement.\n\nDabei geht es weniger um Konzepte als um die strukturierte Umsetzung in bestehenden Organisationen und IT-/OT-Umgebungen.\n\nMeine Arbeit umfasst u.\u00a0a. den Aufbau und die Weiterentwicklung von ISMS, die Vorbereitung und Begleitung von Audits sowie die Etablierung von Sicherheits- und Krisenprozessen.\n\nZuvor war ich in leitenden Funktionen bei KPMG, Accenture und EY tätig.',
    meta: [
      { label: 'Schwerpunkte', value: 'ISMS · TISAX · NIS2 · PCI-DSS · Cyber-Krisenmanagement · TIBER · BCM' },
      { label: 'Zertifizierungen', value: 'CISSP · CISA · ISO/IEC 27001 & 22301 Lead Auditor · BSI IT-Grundschutz-Praktiker' },
      { label: 'Ausbildung', value: 'Dipl.-Ing. Maschinenbau' },
      { label: 'Sprachen', value: 'Deutsch · Englisch' },
    ],
    sections: [
      {
        title: 'Schwerpunkte',
        items: [
          'ISMS · TISAX · NIS2 · PCI-DSS',
          'Cyber-Krisenmanagement · TIBER · BCM',
        ],
      },
      {
        title: 'Erfahrung',
        items: [
          'KPMG: Consultant bis Senior Manager',
          'Accenture: Senior Manager',
          'Ernst & Young: Senior Manager',
        ],
      },
      {
        title: 'Zertifizierungen',
        items: [
          'CISSP · CISA',
          'ISO/IEC 27001 & 22301 Lead Auditor',
          'BSI IT-Grundschutz-Praktiker',
        ],
      },
      {
        title: 'Sprachen',
        items: [
          'Deutsch (Muttersprache)',
          'Englisch (verhandlungssicher)',
        ],
      },
    ] as [{ title: string; items: string[] }, { title: string; items: string[] }, { title: string; items: string[] }, { title: string; items: string[] }],
  },
  {
    name: 'Andreas Funder',
    role: 'Senior Consultant',
    imageUrl: '/lovable-uploads/11e7ca2e-054c-44e6-8555-9f230229ef12.png',
    linkedinUrl: 'https://www.linkedin.com/in/andreasfunder/',
    sections: [
      {
        title: 'Education & Qualifications',
        items: [
          'B.Sc. Business Administration',
          'ISO/IEC 27001 Lead Auditor + Implementer',
          'ISO/IEC 27005 Risk Manager',
          'BSI IT-Grundschutz Practitioner',
          'Data Privacy Auditor (DSA-TÜV)',
        ],
      },
      {
        title: 'Professional Experience',
        items: [
          'PwC: Manager, Cybersecurity and Privacy',
          'Ernst & Young: Senior Consultant',
          'CSPi: Consultant Security and Data Privacy',
        ],
      },
      {
        title: 'Consulting Services',
        items: [
          'Information Security, ISMS Strategy',
          'ISO/IEC 27001, PCI-DSS, NIST, TISAX',
          'Risk Management, Business Continuity',
          'EU GDPR, Critical Infrastructure (KRITIS)',
        ],
      },
      {
        title: 'Languages',
        items: [
          'German (mother tongue)',
          'English (business fluent)',
          'French (professional working)',
        ],
      },
    ] as [{ title: string; items: string[] }, { title: string; items: string[] }, { title: string; items: string[] }, { title: string; items: string[] }],
  },
];