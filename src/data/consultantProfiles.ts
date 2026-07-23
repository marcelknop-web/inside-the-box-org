import marcelPhoto from '@/assets/marcel-2026.png.asset.json';

export const consultantProfiles = [
  {
    name: 'Marcel Knop',
    role: 'Senior Cybersecurity Consultant',
    imageUrl: marcelPhoto.url,
    imagePosition: 'center top',
    linkedinUrl: 'https://www.linkedin.com/in/inside-the-box',
    bio: 'I help organisations establish cybersecurity and resilience capabilities that remain effective in practice.',
    meta: [
      { label: 'Schwerpunkte', value: 'ISMS · TISAX · NIS2 · PCI-DSS · Cyber-Krisenmanagement · TIBER · BCM' },
      { label: 'Zertifizierungen', value: 'ISO 27001 Lead Auditor · ISO 22301 Lead Auditor' },
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
          'ISO 27001 Lead Auditor',
          'ISO 22301 Lead Auditor',
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
    role: 'Senior Cybersecurity Consultant',
    imageUrl: '/lovable-uploads/11e7ca2e-054c-44e6-8555-9f230229ef12.png',
    linkedinUrl: 'https://www.linkedin.com/in/andreasfunder/',
    bio: 'I help organisations implement regulatory requirements in a structured and sustainable way.',
    meta: [
      { label: 'Schwerpunkte', value: 'ISO/IEC 27001 · PCI-DSS · NIST · TISAX · Risikomanagement · BCM · DSGVO · KRITIS' },
      { label: 'Zertifizierungen', value: 'ISO/IEC 27001 Lead Auditor & Implementer · ISO/IEC 27005 Risk Manager · BSI IT-Grundschutz-Praktiker · Datenschutzauditor (DSA-TÜV)' },
      { label: 'Sprachen', value: 'Deutsch · Englisch · Französisch' },
    ],
    sections: [
      {
        title: 'Schwerpunkte',
        items: [
          'ISO/IEC 27001 · PCI-DSS · NIST · TISAX',
          'Risikomanagement · Business Continuity · DSGVO · KRITIS',
        ],
      },
      {
        title: 'Erfahrung',
        items: [
          'PwC: Manager, Cybersecurity and Privacy',
          'Ernst & Young: Senior Consultant',
          'CSPi: Consultant Security and Data Privacy',
        ],
      },
      {
        title: 'Zertifizierungen',
        items: [
          'ISO/IEC 27001 Lead Auditor & Implementer',
          'ISO/IEC 27005 Risk Manager',
          'BSI IT-Grundschutz-Praktiker',
          'Datenschutzauditor (DSA-TÜV)',
        ],
      },
      {
        title: 'Sprachen',
        items: [
          'Deutsch (Muttersprache)',
          'Englisch (verhandlungssicher)',
          'Französisch (beruflich)',
        ],
      },
    ] as [{ title: string; items: string[] }, { title: string; items: string[] }, { title: string; items: string[] }, { title: string; items: string[] }],
  },
];