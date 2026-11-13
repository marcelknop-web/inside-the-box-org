import { ArrowUpRight, Monitor, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import suite from '@/assets/navigators/suite.jpg.asset.json';
import cra from '@/assets/navigators/cra.jpg.asset.json';
import dora from '@/assets/navigators/dora.jpg.asset.json';
import tisax from '@/assets/navigators/tisax.jpg.asset.json';
import nis2 from '@/assets/navigators/nis2.jpg.asset.json';
import grundschutz from '@/assets/navigators/grundschutz.jpg.asset.json';
import environment from '@/assets/navigators/environment.jpg.asset.json';
import ai from '@/assets/navigators/ai.jpg.asset.json';

const apps = [
  { key: 'suite', name: 'Lightspeed Navigator Suite', standard: 'ISO 27001 / ISO 9001', id: '6821362369', slug: 'lightspeed-navigator-suite', image: suite },
  { key: 'ai', name: 'ISO 42001 Navigator', standard: 'ISO/IEC 42001', id: '6816852360', slug: 'iso-42001-navigator', image: ai },
  { key: 'cra', name: 'CRA Navigator', standard: 'Cyber Resilience Act', id: '6816540234', slug: 'cra-navigator', image: cra },
  { key: 'dora', name: 'DORA Navigator', standard: 'DORA', id: '6816724636', slug: 'dora-navigator', image: dora },
  { key: 'tisax', name: 'TISAX Navigator', standard: 'VDA ISA / TISAX', id: '6820074341', slug: 'tisax-navigator', image: tisax },
  { key: 'nis2', name: 'NIS-2 Navigator', standard: 'NIS-2 / BSIG', id: '6816662300', slug: 'nis-2-navigator', image: nis2 },
  { key: 'grundschutz', name: 'IT-Grundschutz Navigator', standard: 'BSI · Grundschutz++', id: '6820413188', slug: 'it-grundschutz-navigator', image: grundschutz },
  { key: 'environment', name: 'ISO 14001 Navigator', standard: 'ISO 14001', id: '6820624987', slug: 'iso-14001-navigator', image: environment },
];

export function NavigatorApps() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="navigator-apps-title" className="px-5 py-5 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="mb-2 text-xs font-mono text-highlight">{t('aiWorkflows.appsEyebrow')}</p>
          <h3 id="navigator-apps-title" className="text-xl font-bold font-mono text-primary">{t('aiWorkflows.appsTitle')}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Smartphone size={15} aria-hidden="true" /><Monitor size={16} aria-hidden="true" />
          <span>iPhone · iPad · Mac</span>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/85">{t('aiWorkflows.appsIntro')}</p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {apps.map(app => (
          <article key={app.key} className="group flex min-w-0 flex-col rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-highlight/50">
            <div className="flex items-start gap-3">
              <img src={app.image.url} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-contain" />
              <div className="min-w-0">
                <p className="mb-1 text-xs font-mono text-highlight">{app.standard}</p>
                <h4 className="text-base font-semibold leading-snug text-foreground break-words">{app.name}</h4>
              </div>
            </div>
            <p className="mt-3 mb-4 text-sm leading-relaxed text-muted-foreground">{t(`aiWorkflows.apps${app.key}Desc`)}</p>
            <Button asChild variant="ghost" className="mt-auto h-11 w-fit max-w-full justify-start px-0 text-highlight hover:bg-transparent hover:text-primary">
              <a href={`https://apps.apple.com/de/app/${app.slug}/id${app.id}`} target="_blank" rel="noopener noreferrer" aria-label={`${app.name} — ${t('aiWorkflows.appsOpen')}`}>
                {t('aiWorkflows.appsOpen')}<ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          </article>
        ))}
      </div>
      <div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-highlight" aria-hidden="true" />
        <p className="leading-relaxed">{t('aiWorkflows.appsPrivacy')}</p>
      </div>
    </section>
  );
}