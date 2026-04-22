import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Curated cross-links between consulting services. Only strong thematic matches
 * are listed here — no exhaustive enumeration. Each entry references an existing
 * sidebar/service id and an i18n key under `consulting.*Title` / `consulting.*Desc`.
 */
type RelatedEntry = { id: string; titleKey: string; descKey: string };

const RELATED_MAP: Record<string, RelatedEntry[]> = {
  isms: [
    { id: 'nis2-dora', titleKey: 'consulting.nis2Title', descKey: 'consulting.nis2Desc' },
    { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc' },
    { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle', descKey: 'consulting.vcisoDesc' },
  ],
  'nis2-dora': [
    { id: 'isms', titleKey: 'consulting.ismsTitle', descKey: 'consulting.ismsDesc' },
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
  ],
  'tisax-pci-dss': [
    { id: 'isms', titleKey: 'consulting.ismsTitle', descKey: 'consulting.ismsDesc' },
    { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc' },
  ],
  'assessments-concepts': [
    { id: 'isms', titleKey: 'consulting.ismsTitle', descKey: 'consulting.ismsDesc' },
    { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle', descKey: 'consulting.vcisoDesc' },
  ],
  'incident-management': [
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
    { id: 'bcm', titleKey: 'consulting.bcmTitle', descKey: 'consulting.bcmDesc' },
    { id: 'arena-training', titleKey: 'consulting.arenaTitle', descKey: 'consulting.arenaDesc' },
  ],
  'bcm': [
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
    { id: 'isms', titleKey: 'consulting.ismsTitle', descKey: 'consulting.ismsDesc' },
  ],
  'cyber-crisis-management': [
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
    { id: 'bcm', titleKey: 'consulting.bcmTitle', descKey: 'consulting.bcmDesc' },
    { id: 'arena-training', titleKey: 'consulting.arenaTitle', descKey: 'consulting.arenaDesc' },
    { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining', descKey: 'consulting.nis2Desc' },
  ],
  'arena-training': [
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
  ],
  'virtual-ciso': [
    { id: 'isms', titleKey: 'consulting.ismsTitle', descKey: 'consulting.ismsDesc' },
    { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc' },
    { id: 'nis2-dora', titleKey: 'consulting.nis2Title', descKey: 'consulting.nis2Desc' },
  ],
  'dora-nis2-ttx': [
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
    { id: 'nis2-dora', titleKey: 'consulting.nis2Title', descKey: 'consulting.nis2Desc' },
  ],
  'events-workshops': [
    { id: 'publications', titleKey: 'consulting.pubTitle', descKey: 'consulting.pubDesc' },
    { id: 'arena-training', titleKey: 'consulting.arenaTitle', descKey: 'consulting.arenaDesc' },
  ],
  publications: [
    { id: 'events-workshops', titleKey: 'consulting.eventsTitle', descKey: 'consulting.eventsDesc' },
    { id: 'ai-workflows', titleKey: 'consulting.aiWorkflowsTitle', descKey: 'consulting.aiWorkflowsDesc' },
  ],
  'ai-workflows': [
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
  ],
  'soc-operations': [
    { id: 'incident-management', titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
    { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle', descKey: 'consulting.vcisoDesc' },
    { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc' },
  ],
};

interface RelatedServicesProps {
  /** Current service id — used to look up curated related entries */
  serviceId: string;
  /** Callback to switch active service in ChatView */
  onSelect: (id: string) => void;
}

export const RelatedServices = ({ serviceId, onSelect }: RelatedServicesProps) => {
  const { t } = useLanguage();
  const entries = RELATED_MAP[serviceId];
  if (!entries || entries.length === 0) return null;

  return (
    <div className="bg-card/40 rounded-xl p-5 mt-6 border border-primary/10">
      <p className="text-primary font-mono font-bold text-xs uppercase tracking-widest mb-1">
        {t('related.title')}
      </p>
      <p className="text-foreground/70 text-xs font-sans mb-4">
        {t('related.subtitle')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className="group text-left bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg p-3 transition-electric flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <ArrowRight size={16} className="text-primary mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <div className="min-w-0">
              <p className="text-primary font-mono font-semibold text-sm group-hover:text-highlight transition-electric">
                {t(e.titleKey as any)}
              </p>
              <p className="text-foreground/70 text-xs font-sans mt-0.5 line-clamp-2">
                {t(e.descKey as any)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
