import type { StandardProfile } from './types';
import { NIS2_PROFILE } from './nis2Profile';
import { DORA_PROFILE } from './doraProfile';

// ── Standard registry ───────────────────────────────────────────
// Add new profiles here. `available: false` profiles render as a
// "coming soon" tile so the roadmap is visible without being usable.

const COMING_SOON: StandardProfile[] = [
  stub('aiact', 'AI Act', 'Sparkles', { de: 'Verordnung (EU) 2024/1689', en: 'Regulation (EU) 2024/1689', fr: 'Règlement (UE) 2024/1689' }),
  stub('tisax', 'TISAX', 'Car', { de: 'Automotive Information Security', en: 'Automotive Information Security', fr: 'Sécurité automobile' }),
  stub('pcidss', 'PCI-DSS', 'CreditCard', { de: 'Payment Card Industry DSS', en: 'Payment Card Industry DSS', fr: 'Payment Card Industry DSS' }),
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

export const STANDARD_PROFILES: StandardProfile[] = [NIS2_PROFILE, DORA_PROFILE, ...COMING_SOON];

export function getProfile(id: string): StandardProfile | undefined {
  return STANDARD_PROFILES.find((p) => p.id === id);
}

export * from './types';
export * from './engine';
