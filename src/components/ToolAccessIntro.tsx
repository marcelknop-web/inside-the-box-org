import type { ReactNode } from 'react';
import { ArrowDown, CheckCircle2, LockKeyhole, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ToolIntroduction } from '@/data/toolIntroductions';
import { getLocalized } from '@/data/toolIntroductions';
import type { HomeLanguage } from '@/data/homeTopics';
import { PageMeta } from '@/components/PageMeta';
import { SiteChrome } from '@/components/SiteChrome';

type Props = {
  intro: ToolIntroduction;
  language: HomeLanguage;
  login: ReactNode;
  withChrome?: boolean;
};

const UI = {
  de: { jump: 'Zum Zugang', suited: 'Geeignet für', prepare: 'Was Sie vorbereiten', flow: 'Ablauf', results: 'Ergebnisse', limits: 'Wichtige Grenze', access: 'Geschützter Zugang' },
  en: { jump: 'Go to access', suited: 'Who it is for', prepare: 'What to prepare', flow: 'Process', results: 'Outputs', limits: 'Important limitation', access: 'Protected access' },
  fr: { jump: 'Aller à l’accès', suited: 'Pour qui', prepare: 'À préparer', flow: 'Déroulement', results: 'Résultats', limits: 'Limite importante', access: 'Accès protégé' },
};

const CANONICAL_ROUTES: Record<string, string> = {
  gapzero: '/gapzero',
  'assessment-tools': '/assessment-tools',
  'iacs-ur26': '/iacs-ur26',
  'iacs-ur27': '/iacs-ur27',
  iec62443: '/iec62443',
  ernstlfall: '/ernstlfall',
  marsec: '/marsec',
  'cra-check': '/cra-check',
  'dora-compliance': '/dora-compliance',
  'nis2-compliance': '/nis2-compliance',
  'ai-act-readiness': '/ai-act-readiness',
  itsm: '/itsm',
  'itsm-dev': '/itsm-dev',
  'sitemap-index': '/sitemap',
};

export function ToolAccessIntro({ intro, language, login, withChrome = true }: Props) {
  const ui = UI[language];
  const Icon = intro.icon;
  const content = (
    <>
      <PageMeta title={`${intro.name} — ${getLocalized(intro.eyebrow, language)}`} description={getLocalized(intro.problem, language)} canonicalPath={CANONICAL_ROUTES[intro.key]} />
      <main className="w-full overflow-x-clip">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex min-h-11 items-center border-b border-border pb-3">
          <a href="/#services" className="font-sans text-sm text-muted-foreground transition-colors hover:text-primary">← {language === 'de' ? 'Zur Themenauswahl' : language === 'fr' ? 'Retour aux thèmes' : 'Back to topics'}</a>
        </div>
        <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3 text-primary">
              <span className="flex h-11 w-11 items-center justify-center border border-primary/35 bg-primary/5"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{getLocalized(intro.eyebrow, language)}</p>
            </div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{intro.name}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/75">{getLocalized(intro.problem, language)}</p>
          </div>
          <Button variant="outline" className="rounded-none" onClick={() => document.getElementById('tool-login')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            {ui.jump}<ArrowDown aria-hidden="true" />
          </Button>
        </div>

        <div className="grid gap-px bg-border py-px md:grid-cols-2">
          <section className="bg-card p-5 sm:p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{ui.suited}</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/75">{getLocalized(intro.audience, language)}</p>
          </section>
          <section className="bg-card p-5 sm:p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{ui.prepare}</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/75">
              {intro.inputs.map((item) => <li key={item.en} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />{getLocalized(item, language)}</li>)}
            </ul>
          </section>
        </div>

        <section className="border-b border-border py-8">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{ui.flow}</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {intro.steps.map((step, index) => (
              <li key={step.title.en} className="border-l border-primary/40 pl-4">
                <span className="font-mono text-[10px] text-primary">0{index + 1}</span>
                <h3 className="mt-2 font-semibold">{getLocalized(step.title, language)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/65">{getLocalized(step.description, language)}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-6 py-8 md:grid-cols-[1.1fr_.9fr]">
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{ui.results}</h2>
            <ul className="mt-4 space-y-3">
              {intro.outcomes.map((item) => <li key={item.en} className="flex gap-3 text-sm text-foreground/80"><CheckCircle2 className="h-4 w-4 flex-none text-primary" aria-hidden="true" />{getLocalized(item, language)}</li>)}
            </ul>
          </section>
          <aside className="border border-border bg-secondary/35 p-5">
            <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><ShieldAlert className="h-4 w-4" aria-hidden="true" />{ui.limits}</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/65">{getLocalized(intro.limits, language)}</p>
          </aside>
        </div>

        <section id="tool-login" className="scroll-mt-8 border-t border-primary/30 py-9 text-center">
          <LockKeyhole className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground/75">{ui.access}</h2>
          <div className="mt-5 flex justify-center">{login}</div>
        </section>
      </section>
      </main>
    </>
  );
  return withChrome ? <SiteChrome>{content}</SiteChrome> : content;
}