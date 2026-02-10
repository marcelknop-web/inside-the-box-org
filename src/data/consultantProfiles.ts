export const consultantProfiles = [
  {
    name: 'Marcel Knop',
    role: 'Senior Consultant',
    imageUrl: '/lovable-uploads/0b083536-ec9e-4eda-b874-e926cc196404.png',
    linkedinUrl: 'https://www.linkedin.com/in/inside-the-box',
    sections: [
      {
        title: 'Education & Qualifications',
        items: [
          'Dipl.-Ing. Mechanical Engineering',
          'CISSP, CISA',
          'ISO/IEC 27001 + 22301 Lead Auditor',
          'BSI Baseline Protection Practitioner',
        ],
      },
      {
        title: 'Professional Experience',
        items: [
          'KPMG: Consultant to Senior Manager',
          'Accenture: Senior Manager',
          'Ernst & Young: Senior Manager',
        ],
      },
      {
        title: 'Consulting Services',
        items: [
          'Cybersecurity consulting and audits',
          'ISMS, TISAX, NIS-2, PCI-DSS implementation',
          'Cyber crisis management and exercises',
          'TIBER, BCM',
        ],
      },
      {
        title: 'Languages',
        items: [
          'German (mother tongue)',
          'English (business fluent)',
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