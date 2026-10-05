import { ArrowRight, Check, ChevronRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { SERVICE_DETAILS } from '@/data/serviceDetails';
import { REFERENCES_COPY, referencesForService } from '@/data/references';
import { ReferenceCard } from '@/components/ReferenceCard';
import { HOME_TOPICS, type HomeLanguage } from '@/data/homeTopics';
import { useLanguage } from '@/i18n/LanguageContext';

const COPY = {
  de: { home: 'Start', back: 'Zur Themenübersicht', outcomes: 'Das erhalten Sie', process: 'Ablauf', inputs: 'Vorbereitung', processAndInputs: 'Ablauf & Vorbereitung', details: 'Fachliche Details', contact: 'Erstgespräch vereinbaren', contactEnd: 'Klären wir den passenden Einstieg.', related: 'Verwandte Angebote' },
  en: { home: 'Home', back: 'Back to topic overview', outcomes: 'What you receive', process: 'Process', inputs: 'Preparation', processAndInputs: 'Process & preparation', details: 'Technical details', contact: 'Schedule an introductory call', contactEnd: 'Let us identify the right starting point.', related: 'Related services' },
  fr: { home: 'Accueil', back: 'Retour à la vue du thème', outcomes: 'Ce que vous obtenez', process: 'Déroulement', inputs: 'Préparation', processAndInputs: 'Déroulement & préparation', details: 'Détails techniques', contact: 'Planifier un premier échange', contactEnd: 'Identifions le bon point de départ.', related: 'Services associés' },
};

export function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const { language, t } = useLanguage();
  const lang = language as HomeLanguage;
  const copy = COPY[lang];
  const service = SERVICE_DETAILS[serviceId];
  if (!service) return null;
  const refs = referencesForService(serviceId);
  const refCopy = REFERENCES_COPY[lang];
  const topic = HOME_TOPICS.find((item) => item.id === service.topic);
  const rememberTopic = () => {
    sessionStorage.setItem('overview:topic', service.topic);
  };

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-0">
      <header className="grid gap-7 border-b border-primary/20 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">{t(service.titleKey)}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg">{service.value[lang]}</p>
        </div>
        <Button asChild className="min-h-12 w-fit rounded-none px-5 font-sans font-semibold"><Link to="/contact">{copy.contact}<ArrowRight aria-hidden="true" /></Link></Button>
      </header>

      <section aria-labelledby="service-outcomes" className="py-8 sm:py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{copy.outcomes}</p>
        <h2 id="service-outcomes" className="sr-only">{copy.outcomes}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {service.outcomes.map(({ icon: Icon, title, text }) => (
            <div key={title.en} className="min-w-0 border border-border bg-card/90 p-5 shadow-card sm:p-6">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.6} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">{title[lang]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/65">{text[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {refs.length > 0 && (
        <section aria-labelledby="service-references" className="pb-8 sm:pb-10">
          <h2 id="service-references" className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{refCopy.practice}</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {refs.map((item) => <ReferenceCard key={item.id} item={item} lang={lang} showTags={false} />)}
          </ul>
          <Link to="/references" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">{refCopy.all}<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>
      )}

      <Accordion type="multiple" className="border-y border-border">
        <AccordionItem value="process" className="border-border">
          <AccordionTrigger className="min-h-16 text-left font-sans text-lg font-semibold hover:text-primary hover:no-underline">{copy.processAndInputs}</AccordionTrigger>
          <AccordionContent className="pb-8">
            <h2 id="service-process" className="text-lg font-semibold">{copy.process}</h2>
            <ol className="mt-5 grid gap-5 md:grid-cols-3">
              {service.steps.map((step, index) => (
                <li key={step.title.en} className="border-l border-primary/35 pl-4">
                  <span className="font-mono text-[10px] text-primary">0{index + 1}</span>
                  <h3 className="mt-2 text-base font-semibold">{step.title[lang]}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/65">{step.text[lang]}</p>
                </li>
              ))}
            </ol>
            {service.inputs.length > 0 && <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-lg font-semibold">{copy.inputs}</h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {service.inputs.map((input) => <li key={input.en} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/70"><Check className="mt-0.5 h-4 w-4 flex-none text-highlight" aria-hidden="true" /><span>{input[lang]}</span></li>)}
              </ul>
            </div>}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="details" className="border-0">
          <AccordionTrigger className="min-h-16 text-left font-sans text-lg font-semibold hover:text-primary hover:no-underline">{copy.details}</AccordionTrigger>
          <AccordionContent className="max-w-3xl space-y-6 pb-8">
            {service.details.map((detail) => <section key={`${detail.titleKey}-${detail.bodyKey}`}>
              <h2 className="text-base font-semibold text-foreground">{t(detail.titleKey)}</h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/70">{t(detail.bodyKey)}</p>
            </section>)}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <section className="mt-10 grid gap-6 border-t border-primary/25 bg-card/75 px-5 py-7 sm:px-7 md:grid-cols-[1fr_auto] md:items-center">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">/ {copy.contact}</p><h2 className="mt-3 text-xl font-semibold">{copy.contactEnd}</h2></div>
        <Button asChild className="min-h-12 w-fit rounded-none px-5"><Link to="/contact"><Mail aria-hidden="true" />{copy.contact}</Link></Button>
      </section>

      {service.related.length > 0 && (
        <nav aria-label={copy.related} className="mt-8 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{copy.related}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {service.related.map((id) => {
              const related = SERVICE_DETAILS[id];
              return related ? <Link key={id} to={`/${id}`} className="inline-flex min-h-10 items-center gap-1 text-sm text-foreground/70 transition-colors hover:text-primary">{t(related.titleKey)}<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link> : null;
            })}
          </div>
        </nav>
      )}
    </article>
  );
}
