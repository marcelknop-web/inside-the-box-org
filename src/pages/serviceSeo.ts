/**
 * Per-route SEO metadata for the service sub-pages rendered by ChatView.
 *
 * Titles are kept short (≤ 38 chars) because PageMeta appends
 * " · inside-the-box.org" (21 chars), keeping the final <title> under 60.
 * Descriptions stay within the 50–160 character window search engines show.
 */
export interface ServiceSeo {
  title: string;
  description: string;
}

export const SITE_SEO: ServiceSeo = {
  title: 'Cybersecurity Consulting & Training',
  description:
    'Senior cybersecurity consulting and cyber crisis training: ISO 27001, IEC 62443, NIS-2, DORA, TISAX, incident response and tabletop exercises.',
};

export const SERVICE_SEO: Record<string, ServiceSeo> = {
  isms: {
    title: 'ISMS: ISO 27001 & IT-Grundschutz',
    description:
      'ISMS design, implementation and audit preparation along ISO 27001, BSI IT-Grundschutz and IEC 62443 for IT and OT environments.',
  },
  'nis2-dora': {
    title: 'NIS-2 & DORA Compliance',
    description:
      'NIS-2 and DORA readiness: gap analysis, governance, reporting duties, supplier requirements and management liability in practical steps.',
  },
  'tisax-pci-dss': {
    title: 'TISAX & PCI-DSS Readiness',
    description:
      'TISAX assessment level scoping and PCI-DSS SAQ preparation: scope definition, control evidence and audit-ready documentation.',
  },
  'assessments-concepts': {
    title: 'Security Assessments & Concepts',
    description:
      'Independent security assessments, maturity reviews and security concepts with prioritised, budget-aware remediation roadmaps.',
  },
  'incident-management': {
    title: 'Incident Response Management',
    description:
      'Incident response capability build-up: playbooks, escalation paths, forensic readiness and post-incident lessons-learned processes.',
  },
  bcm: {
    title: 'BCM & ISO 22301',
    description:
      'Business continuity management to ISO 22301: business impact analysis, RTO/RPO targets, continuity plans and exercise programmes.',
  },
  'cyber-crisis-management': {
    title: 'Cyber Crisis Management',
    description:
      'Cyber crisis management for executives: crisis organisation, decision rights, communication lines and realistic crisis exercises.',
  },
  'arena-training': {
    title: 'Cyber Range & Red Team Training',
    description:
      'Hands-on cyber range and red team training: attack simulations, blue team drills and measurable defensive skill development.',
  },
  'events-workshops': {
    title: 'Events & Security Workshops',
    description:
      'Security workshops, awareness formats and keynote sessions tailored to management, IT and OT audiences in German, English or French.',
  },
  publications: {
    title: 'Publications & Insights',
    description:
      'Articles, talks and practical publications on ISMS, NIS-2, DORA, OT security and cyber crisis management from the field.',
  },
  'virtual-ciso': {
    title: 'Virtual CISO (vCISO)',
    description:
      'Virtual CISO services: security strategy, board reporting, risk decisions and programme steering without a full-time hire.',
  },
  'soc-operations': {
    title: 'SOC Operations & Monitoring',
    description:
      'SOC design and operations: use cases, detection engineering, alert triage, KPIs and realistic staffing and tooling decisions.',
  },
  'ai-workflows': {
    title: 'AI Workflows for Security',
    description:
      'AI-assisted security workflows: automation of assessments, documentation and reporting with clear data protection guardrails.',
  },
  'dora-nis2-ttx': {
    title: 'DORA & NIS-2 Tabletop Exercises',
    description:
      'Tabletop exercises for DORA and NIS-2: regulatory reporting clocks, decision drills and documented evidence for auditors.',
  },
  why: {
    title: 'Cyber Training Range',
    description:
      'The Cyber Training Range concept: why realistic exercises change behaviour faster than slide decks and policy documents.',
  },
  'ki-lab': {
    title: 'AI Lab: Compliance Tools',
    description:
      'Free browser-based AI tools for compliance and training: assessment wizards, crisis simulators and awareness quizzes.',
  },
  contact: {
    title: 'Contact',
    description:
      'Get in touch for cybersecurity consulting, audit preparation or a cyber crisis exercise tailored to your organisation.',
  },
  imprint: {
    title: 'Imprint',
    description:
      'Legal notice and provider identification for inside-the-box.org, including contact details and responsible parties.',
  },
  'nis2-compliance': {
    title: 'NIS-2 Compliance Check',
    description:
      'Interactive NIS-2 compliance check: assess governance, risk management and reporting duties, then export an audit-grade report.',
  },
  iec62443: {
    title: 'IEC 62443 Assessment',
    description:
      'IEC 62443 assessment for industrial control systems: zones, conduits, security levels and documented conformance findings.',
  },
  'iacs-e27': {
    title: 'IACS UR E27 Assessment',
    description:
      'IACS UR E27 assessment for onboard systems: requirement-by-requirement evidence review and maritime-calibrated findings.',
  },
  'soc-life': {
    title: 'SOC Life Simulation',
    description:
      'SOC Life simulation: run a security operations centre, triage incidents and feel the trade-offs between alerts, staff and budget.',
  },
  'ot-soc-life': {
    title: 'OT SOC Life Simulation',
    description:
      'OT SOC Life simulation: defend an industrial plant, balance safety and availability, and learn OT incident response decisions.',
  },
  'ai-act-readiness': {
    title: 'EU AI Act Readiness Check',
    description:
      'EU AI Act readiness check: classify AI systems by risk, review obligations and export a structured readiness report.',
  },
};

export const getServiceSeo = (serviceId: string | null, fallbackLabel?: string): ServiceSeo => {
  if (!serviceId) return SITE_SEO;
  const hit = SERVICE_SEO[serviceId];
  if (hit) return hit;
  const label = (fallbackLabel || serviceId).slice(0, 38);
  return {
    title: label,
    description: `${label} — cybersecurity consulting, compliance and cyber crisis training by inside-the-box.org.`,
  };
};
