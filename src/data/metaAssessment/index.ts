import type { StandardProfile } from './types';
import { NIS2_PROFILE } from './nis2Profile';
import { DORA_PROFILE } from './doraProfile';
import { AIACT_PROFILE } from './aiActProfile';
import { ISO27001_PROFILE } from './iso27001Profile';
import { IACS_E26_PROFILE } from './iacsE26Profile';
import { IACS_E27_PROFILE } from './iacsE27Profile';
import { MARITIME_CYBER_PROFILE } from './maritimeCyberProfile';
import { TISAX_PROFILE } from './tisaxProfile';
import { ISO22301_PROFILE } from './iso22301Profile';
import { ISO42001_PROFILE } from './iso42001Profile';
import { VENDOR_SECURITY_PROFILE } from './vendorSecurityProfile';
import { CIS_CONTROLS_PROFILE } from './cisControlsProfile';
import { ISO9001_PROFILE } from './iso9001Profile';
import { IEC62443_PROFILE } from './iec62443Profile';
import { SOC2_PROFILE } from './soc2Profile';
import { PCIDSS_PROFILE } from './pciDssProfile';

// ── Standard registry ───────────────────────────────────────────
// Add new profiles here. `available: false` profiles render as a
// "coming soon" tile so the roadmap is visible without being usable.

const COMING_SOON: StandardProfile[] = [
  stub('iec62443', 'IEC 62443', 'Factory', { de: 'OT-Security', en: 'OT security', fr: 'Sécurité OT' }),
  stub('cra', 'CRA', 'Server', { de: 'Cyber Resilience Act', en: 'Cyber Resilience Act', fr: 'Cyber Resilience Act' }),
];

function stub(id: string, name: string, icon: string, regulation: StandardProfile['regulation']): StandardProfile {
  return {
    id, name, icon, available: false,
    fullName: { de: name, en: name, fr: name },
    regulation,
    description: regulation,
    intake: [],
    requirements: [],
  };
}

export const STANDARD_PROFILES: StandardProfile[] = [NIS2_PROFILE, DORA_PROFILE, AIACT_PROFILE, ISO27001_PROFILE, ISO22301_PROFILE, ISO42001_PROFILE, IACS_E26_PROFILE, IACS_E27_PROFILE, MARITIME_CYBER_PROFILE, TISAX_PROFILE, SOC2_PROFILE, PCIDSS_PROFILE, VENDOR_SECURITY_PROFILE, CIS_CONTROLS_PROFILE, ...COMING_SOON];

export function getProfile(id: string): StandardProfile | undefined {
  return STANDARD_PROFILES.find((p) => p.id === id);
}

export * from './types';
export * from './engine';
export * from './workingPapers';
