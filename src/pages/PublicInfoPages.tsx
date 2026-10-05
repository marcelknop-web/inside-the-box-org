import { ArrowRight, Linkedin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { SiteChrome } from '@/components/SiteChrome';
import { consultantProfiles } from '@/data/consultantProfiles';
import { useLanguage } from '@/i18n/LanguageContext';

const COPY = {
  de: {
    home: 'Start', team: 'Team', contact: 'Kontakt', teamTitle: 'Marcel Knop & Andreas Funder',
    teamLead: 'Senior-Beratung für Cybersecurity, Compliance und Krisenmanagement.',
    focus: 'Schwerpunkte', experience: 'Erfahrung', certifications: 'Zertifizierungen', languages: 'Sprachen',
    contactTitle: 'Sprechen wir über Ihre Situation.', contactLead: 'Ein kurzes Erstgespräch klärt Bedarf, Ziel und den passenden Einstieg.',
    email: 'E-Mail', mobile: 'Mobil', back: 'Leistungen ansehen',
  },
  en: {
    home: 'Home', team: 'Team', contact: 'Contact', teamTitle: 'Marcel Knop & Andreas Funder',
    teamLead: 'Senior advisory for cybersecurity, compliance and crisis management.',
    focus: 'Focus', experience: 'Experience', certifications: 'Certifications', languages: 'Languages',
    contactTitle: 'Let’s discuss your situation.', contactLead: 'A short introductory call clarifies your needs, objective and the right starting point.',
    email: 'Email', mobile: 'Mobile', back: 'View services',
  },
  fr: {
    home: 'Accueil', team: 'Équipe', contact: 'Contact', teamTitle: 'Marcel Knop & Andreas Funder',
    teamLead: 'Conseil senior en cybersécurité, conformité et gestion de crise.',
    focus: 'Expertise', experience: 'Expérience', certifications: 'Certifications', languages: 'Langues',
    contactTitle: 'Parlons de votre situation.', contactLead: 'Un premier échange permet de préciser le besoin, l’objectif et le bon point de départ.',
    email: 'E-mail', mobile: 'Mobile', back: 'Voir les services',
  },
} as const;

export function TeamPage() {
  const { language, t } = useLanguage();
  const copy = COPY[language];
  return (
    <SiteChrome activeSection="team">
      <PageMeta title={copy.team} description={copy.teamLead} canonicalPath="/team" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6 lg:px-0">
        <header className="max-w-3xl border-b border-primary/20 pb-8">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{copy.teamTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-foreground/70 sm:text-lg">{copy.teamLead}</p>
        </header>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {consultantProfiles.map((profile) => {
            const key = profile.name === 'Marcel Knop' ? 'marcel' : 'andreas';
            const facts = [
              [copy.focus, t(`profiles.${key}.focus`)],
              [copy.experience, t(`profiles.${key}.experience`)],
              [copy.certifications, t(`profiles.${key}.certs`)],
              [copy.languages, t(`profiles.${key}.lang`)],
            ];
            return <article key={profile.name} className="border border-border bg-card/90 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <img src={profile.imageUrl} alt={profile.name} className="h-20 w-20 rounded-full border border-primary/30 object-cover" loading="lazy" />
                <div className="min-w-0"><h2 className="text-xl font-semibold">{profile.name}</h2><p className="mt-1 text-sm text-primary">{profile.role}</p>
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"><Linkedin className="h-4 w-4" />LinkedIn</a>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-foreground/75">{t(`profiles.${key}.bio`)}</p>
              <dl className="mt-5 space-y-4 border-t border-border pt-5">{facts.map(([label, value]) => <div key={label}><dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{label}</dt><dd className="mt-1 text-sm leading-relaxed text-foreground/70">{value}</dd></div>)}</dl>
            </article>;
          })}
        </div>
      </main>
    </SiteChrome>
  );
}

export function ContactPage() {
  const { language } = useLanguage();
  const copy = COPY[language];
  return (
    <SiteChrome activeSection="contact">
      <PageMeta title={copy.contact} description={copy.contactLead} canonicalPath="/contact" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6 lg:px-0">
        <header className="max-w-3xl border-b border-primary/20 pb-8">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{copy.contactTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-foreground/70 sm:text-lg">{copy.contactLead}</p>
        </header>
        <div className="mt-8 grid max-w-3xl gap-px bg-border sm:grid-cols-2">
          <a href="mailto:marcel@inside-the-box.org" className="group flex min-h-28 items-center gap-4 bg-card p-5 transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><Mail className="h-5 w-5 text-primary"/><span><span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{copy.email} · Marcel Knop</span><span className="mt-2 block text-sm text-foreground">marcel@inside-the-box.org</span></span></a>
          <a href="tel:+4915205691648" className="group flex min-h-28 items-center gap-4 bg-card p-5 transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"><Phone className="h-5 w-5 text-primary"/><span><span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{copy.mobile} · Marcel Knop</span><span className="mt-2 block text-sm text-foreground">+49 1520 569 1648</span></span></a>
        </div>
        <Link to="/#services" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{copy.back}<ArrowRight className="h-4 w-4" /></Link>
      </main>
    </SiteChrome>
  );
}