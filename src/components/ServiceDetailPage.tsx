import { ArrowRight, Check, ChevronRight, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ServiceSymbol, type ServiceTheme } from '@/components/ServiceSymbol';
import { SERVICE_DETAILS } from '@/data/serviceDetails';
import { HOME_TOPICS, type HomeLanguage } from '@/data/homeTopics';
import { useLanguage } from '@/i18n/LanguageContext';

const COPY = {
  de: { back: 'Zurück zu', outcomes: 'Ergebnisse & Leistungen', process: 'So arbeiten wir', inputs: 'Das bringen Sie mit', details: 'Fachliche Details', contact: 'Erstgespräch vereinbaren', contactEnd: 'Klären wir den passenden Einstieg für Ihre Situation.', related: 'Verwandte Angebote' },
  en: { back: 'Back to', outcomes: 'Outcomes & services', process: 'How we work', inputs: 'What you provide', details: 'Technical details', contact: 'Schedule an introductory call', contactEnd: 'Let us identify the right starting point for your situation.', related: 'Related services' },
  fr: { back: 'Retour à', outcomes: 'Résultats & services', process: 'Notre démarche', inputs: 'Ce que vous apportez', details: 'Détails techniques', contact: 'Planifier un premier échange', contactEnd: 'Identifions le bon point de départ pour votre situation.', related: 'Services associés' },
};

export function ServiceDetailPage({ serviceId }: { serviceId: string }) {
  const { language, t } = useLanguage();
  const lang = language as HomeLanguage;
  const copy = COPY[lang];
  const service = SERVICE_DETAILS[serviceId];
  const navigate = useNavigate();
  if (!service) return null;
  const topic = HOME_TOPICS.find((item) => item.id === service.topic);
  const openContact = () => window.dispatchEvent(new CustomEvent('sitechrome:contact'));
  const backToTopic = () => {
    sessionStorage.setItem('overview:topic', service.topic);
    navigate('/#services');
  };

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:pt-12">
      <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-xs text-muted-foreground">
        <button type="button" onClick={backToTopic} className="inline-flex min-h-10 items-center gap-2 font-sans transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span aria-hidden="true">←</span> {copy.back} {topic?.title[lang]}
        </button>
      </nav>

      <header className="grid gap-7 border-b border-primary/20 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <ServiceSymbol theme={service.id as ServiceTheme} size={20} aria-hidden="true" />
            <span>{topic?.number} / {topic?.title[lang]}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">{t(service.titleKey)}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75 sm:text-lg">{service.value[lang]}</p>
        </div>
        <Button onClick={openContact} className="min-h-12 w-fit rounded-none px-5 font-sans font-semibold">
          {copy.contact}<ArrowRight aria-hidden="true" />
        </Button>
      </header>

      <section aria-labelledby="service-outcomes" className="py-10 sm:py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">01 / {copy.outcomes}</p>
        <h2 id="service-outcomes" className="sr-only">{copy.outcomes}</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {service.outcomes.map(({ icon: Icon, title, text }) => (
            <div key={title.en} className="min-w-0 border border-border bg-card/90 p-5 shadow-card sm:p-6">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.6} aria-hidden="true" />
              <h3 className="mt-5 text-lg font-semibold text-foreground">{title[lang]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/65">{text[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="service-process" className="border-y border-border bg-background/70 py-10 sm:py-12">
        <div className="px-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">02 / {copy.process}</p>
          <h2 id="service-process" className="mt-3 text-2xl font-semibold">{copy.process}</h2>
          <ol className="mt-6 grid gap-0 md:grid-cols-3">
            {service.steps.map((step, index) => (
              <li key={step.title.en} className="relative border-l border-primary/30 py-2 pl-5 pr-5 md:border-l-0 md:border-t md:pt-6">
                <span className="absolute -left-[5px] top-3 h-2.5 w-2.5 bg-primary md:-top-[5px] md:left-0" aria-hidden="true" />
                <span className="font-mono text-[10px] text-primary">0{index + 1}</span>
                <h3 className="mt-2 text-base font-semibold">{step.title[lang]}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground/60">{step.text[lang]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {service.inputs.length > 0 && (
        <section aria-labelledby="service-inputs" className="py-10 sm:py-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">03 / {copy.inputs}</p>
          <h2 id="service-inputs" className="mt-3 text-2xl font-semibold">{copy.inputs}</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {service.inputs.map((input) => <li key={input.en} className="flex items-start gap-3 border-t border-border pt-4 text-sm leading-relaxed text-foreground/70"><Check className="mt-0.5 h-4 w-4 flex-none text-highlight" aria-hidden="true" /><span>{input[lang]}</span></li>)}
          </ul>
        </section>
      )}

      <section aria-labelledby="service-details" className="border-t border-border py-10 sm:py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">04 / {copy.details}</p>
        <h2 id="service-details" className="mt-3 text-2xl font-semibold">{copy.details}</h2>
        <Accordion type="single" collapsible className="mt-5 border-t border-border">
          {service.details.map((detail) => (
            <AccordionItem key={`${detail.titleKey}-${detail.bodyKey}`} value={detail.titleKey} className="border-border">
              <AccordionTrigger className="min-h-14 text-left font-sans text-base font-semibold hover:text-primary hover:no-underline">{t(detail.titleKey)}</AccordionTrigger>
              <AccordionContent className="max-w-3xl pb-6 font-sans text-sm leading-relaxed text-foreground/70">{t(detail.bodyKey)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="grid gap-8 border-t border-primary/25 bg-card/75 px-5 py-7 sm:px-7 md:grid-cols-[1fr_auto] md:items-center">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">/ {copy.contact}</p><h2 className="mt-3 text-xl font-semibold">{copy.contactEnd}</h2></div>
        <Button onClick={openContact} className="min-h-12 w-fit rounded-none px-5"><Mail aria-hidden="true" />{copy.contact}</Button>
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
