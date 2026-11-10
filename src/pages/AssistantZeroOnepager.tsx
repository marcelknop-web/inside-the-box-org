import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ShieldCheck, Building2, Users, ScanLine, SlidersHorizontal, ChartNoAxesCombined, FileCheck2, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import consultation from '@/assets/assistantzero-consultation.jpg';

export default function AssistantZeroOnepager() {
  const { language, setLanguage } = useLanguage();
  const L = (de: string, en: string, fr: string) => language === 'de' ? de : language === 'fr' ? fr : en;
  const start = L('Bewertung starten', 'Start assessment', 'Lancer l’évaluation');
  const stages = [
    { icon: Building2, title: L('Unternehmen verstehen', 'Understand the business', 'Comprendre l’entreprise'), text: L('Branche, Umsatz, Daten, IT-Abhängigkeit und Vorschäden bilden das Risikoprofil.', 'Industry, revenue, data, IT dependency and prior incidents shape the risk profile.', 'Secteur, chiffre d’affaires, données, dépendance informatique et sinistres définissent le profil de risque.') },
    { icon: ShieldCheck, title: L('Sicherheit einordnen', 'Assess security', 'Évaluer la sécurité'), text: L('Zwölf Sicherheitsmaßnahmen – von MFA über Backups bis zum Notfallplan – werden strukturiert erfasst.', 'Twelve security controls — from MFA and backups to incident response — are assessed consistently.', 'Douze mesures de sécurité sont examinées, de l’authentification multifacteur aux sauvegardes et au plan de crise.') },
    { icon: SlidersHorizontal, title: L('Bedarf festlegen', 'Define the needs', 'Définir les besoins'), text: L('Versicherungssumme, Deckungsbausteine und persönliche Prioritäten bestimmen den Vergleich.', 'Coverage limits, modules and client priorities determine the comparison.', 'Montant assuré, garanties et priorités du client orientent la comparaison.') },
    { icon: ChartNoAxesCombined, title: L('Optionen abwägen', 'Compare options', 'Comparer les options'), text: L('Fünf typische Marktsegmente werden nach Ausschlusskriterien und gewichteter Eignung verglichen.', 'Five typical market segments are compared using exclusions and weighted suitability.', 'Cinq segments types sont comparés selon les exclusions et une adéquation pondérée.') },
    { icon: FileCheck2, title: L('Entscheidung vorbereiten', 'Prepare the decision', 'Préparer la décision'), text: L('Versicherbarkeit, offene Maßnahmen und Vergleichsergebnisse stehen gemeinsam im PDF-Bericht.', 'Insurability, outstanding controls and comparison results come together in a PDF report.', 'Assurabilité, mesures à compléter et comparaison sont réunies dans un rapport PDF.') },
  ];
  const audiences = [
    { icon: ScanLine, label: L('Für Makler', 'For brokers', 'Pour les courtiers'), title: L('Struktur statt Bauchgefühl.', 'Structure, not guesswork.', 'Une méthode, pas une intuition.'), points: [L('Interessenten anhand gleicher Kriterien vorprüfen', 'Pre-assess prospects against consistent criteria', 'Évaluer les prospects selon des critères cohérents'), L('Fehlende Voraussetzungen früh erkennen', 'Identify missing prerequisites early', 'Identifier tôt les prérequis manquants'), L('Marktansprache und Beratung gezielt vorbereiten', 'Prepare targeted market enquiries and advice', 'Préparer les consultations du marché et le conseil')] },
    { icon: Users, label: L('Für Kunden', 'For clients', 'Pour les clients'), title: L('Verstehen, was zählt.', 'Understand what matters.', 'Comprendre l’essentiel.'), points: [L('Das eigene Risikoprofil besser verstehen', 'Better understand the business risk profile', 'Mieux comprendre le profil de risque'), L('Deckung an den tatsächlichen Bedarf anpassen', 'Match coverage to actual business needs', 'Adapter les garanties aux besoins réels'), L('Nächste Schritte nachvollziehbar priorisieren', 'Prioritise next steps with clear reasoning', 'Hiérarchiser les prochaines étapes de façon explicite')] },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta title="AssistantZero — Cyberversicherung mit klaren Kriterien" description={L('AssistantZero für Makler und Kunden: Risikoprofil erfassen, Deckungsbedarf klären und typische Marktsegmente nachvollziehbar vergleichen.', 'AssistantZero for brokers and clients: assess risk, define coverage needs and compare typical market segments transparently.', 'AssistantZero pour courtiers et clients : évaluer les risques, définir les garanties et comparer les segments types du marché.')} />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link to="/assistantzero-info" className="flex items-center gap-2 font-mono text-sm font-medium" aria-label="AssistantZero"><ShieldCheck className="h-5 w-5 text-primary" />Assistant<span className="text-primary">Zero</span></Link>
          <div className="flex items-center gap-2">
            <div className="flex" role="group" aria-label={L('Sprache', 'Language', 'Langue')}>
              {(['de', 'en', 'fr'] as const).map(lang => <Button key={lang} size="sm" variant="ghost" onClick={() => setLanguage(lang)} aria-pressed={language === lang} className={`h-8 px-2 font-mono text-xs ${language === lang ? 'text-primary' : 'text-muted-foreground'}`}>{lang.toUpperCase()}</Button>)}
            </div>
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex"><Link to="/assistantzero">{start}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <img src={consultation} width={1920} height={1024} fetchPriority="high" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] lg:object-center" />
          <div className="absolute inset-0 -z-10 bg-background/75 lg:bg-background/55" />
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
            <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase text-primary"><span className="h-px w-8 bg-primary" />{L('Cyberversicherung · Makler & Kunden', 'Cyber insurance · Brokers & clients', 'Cyberassurance · Courtiers & clients')}</p>
            <h1 className="break-words text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Assistant<span className="text-primary">Zero</span></h1>
            <h2 className="mt-5 max-w-lg text-2xl font-medium leading-snug sm:text-3xl">{L('Risiken verstehen. Deckung klären. Bewusst entscheiden.', 'Understand risk. Define cover. Decide with clarity.', 'Comprendre les risques. Définir les garanties. Décider clairement.')}</h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/85">{L('Eine gemeinsame Grundlage für die Cyberversicherungsberatung: vom Risikoprofil bis zur nachvollziehbaren Einordnung passender Marktsegmente.', 'A shared foundation for cyber insurance advice: from the risk profile to a transparent assessment of suitable market segments.', 'Une base commune pour le conseil en cyberassurance : du profil de risque à l’évaluation transparente des segments de marché adaptés.')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button asChild size="lg"><Link to="/assistantzero">{start}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild variant="link" className="px-0 text-foreground"><a href="#ablauf">{L('Den Ablauf ansehen', 'Explore the process', 'Découvrir le parcours')}<ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            </div>
          </div>
        </section>

        <div className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-3 px-5 py-6 sm:px-8">
            {[[L('Risiko', 'Risk', 'Risque'), L('strukturiert erfasst', 'structured assessment', 'évaluation structurée')], [L('Vergleich', 'Comparison', 'Comparaison'), L('Kriterien offengelegt', 'criteria disclosed', 'critères explicites')], [L('Ergebnis', 'Result', 'Résultat'), L('als PDF dokumentiert', 'documented as PDF', 'rapport PDF')]].map(([title, sub]) => <div key={title} className="min-w-0 border-l border-primary/40 pl-3 sm:pl-5"><p className="break-words font-mono text-sm text-primary sm:text-base">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{sub}</p></div>)}
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="font-mono text-xs uppercase text-highlight">{L('Zwei Perspektiven. Eine Grundlage.', 'Two perspectives. One foundation.', 'Deux perspectives. Une base commune.')}</p>
          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
            {audiences.map(({ icon: Icon, label, title, points }) => <div key={label} className="border-t border-border pt-6"><div className="flex items-center gap-3 text-primary"><Icon className="h-6 w-6" /><p className="font-mono text-sm">{label}</p></div><h2 className="mt-4 text-2xl font-medium">{title}</h2><ul className="mt-5 space-y-4">{points.map(point => <li key={point} className="flex gap-3 text-sm leading-relaxed text-foreground/85"><Check className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />{point}</li>)}</ul></div>)}
          </div>
        </section>

        <section id="ablauf" className="scroll-mt-6 border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
            <p className="font-mono text-xs uppercase text-highlight">{L('Der Ablauf', 'The process', 'Le parcours')}</p>
            <h2 className="mt-3 text-3xl font-medium">{L('Vom Profil zur Entscheidung.', 'From profile to decision.', 'Du profil à la décision.')}</h2>
            <ol className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
              {stages.map(({ icon: Icon, title, text }, i) => <li key={title} className="border-t border-primary/30 pt-5"><div className="mb-5 flex items-center justify-between"><Icon className="h-7 w-7 text-primary" /><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span></div><h3 className="text-base font-medium">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div><p className="font-mono text-xs uppercase text-highlight">{L('Nachvollziehbar statt Blackbox', 'Transparent, not a black box', 'Transparent, sans boîte noire')}</p><h2 className="mt-3 text-3xl font-medium leading-snug">{L('Jedes Ergebnis hat eine Grundlage.', 'Every result has a basis.', 'Chaque résultat repose sur des critères.')}</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground">{L('Feste Bewertungsregeln statt KI-generierter Einschätzungen. Risikotreiber und Sicherheitsmaßnahmen werden sichtbar; Deckung, relatives Preisniveau, Schadenhilfe und Versicherungssumme werden nach den Prioritäten des Kunden gewichtet.', 'Fixed assessment rules, not AI-generated judgements. Risk drivers and security controls remain visible; coverage, relative price level, claims support and limits are weighted by client priorities.', 'Des règles fixes, pas des avis générés par IA. Les facteurs de risque et les mesures restent visibles ; garanties, niveau de prix relatif, assistance et montants sont pondérés selon les priorités du client.')}</p></div>
          <aside className="border-l-2 border-primary pl-6"><div className="flex items-center gap-2 font-mono text-sm text-primary"><Info className="h-5 w-5" />{L('Klare Grenzen', 'Clear boundaries', 'Des limites claires')}</div><ul className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground"><li>{L('Vorprüfung auf Basis von Selbstauskünften – keine verbindliche Zusage zur Versicherbarkeit.', 'Pre-assessment based on self-declared information — not a binding assurance of insurability.', 'Pré-évaluation sur déclarations — aucune garantie ferme d’assurabilité.')}</li><li>{L('Vergleich generischer Marktsegmente, nicht einzelner Versicherer oder aktueller Tarife. Keine Prämienberechnung.', 'Comparison of generic market segments, not individual insurers or current tariffs. No premium calculation.', 'Comparaison de segments génériques, pas d’assureurs ni de tarifs actuels. Aucun calcul de prime.')}</li><li>{L('Die konkrete Police und die Annahmeentscheidung bleiben Gegenstand der Beratung und Prüfung durch den Versicherer.', 'The actual policy and acceptance decision remain subject to advice and insurer review.', 'La police concrète et l’acceptation restent soumises au conseil et à l’examen de l’assureur.')}</li></ul></aside>
        </section>

        <section className="border-y border-primary/25 bg-primary/5">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-5 py-12 sm:px-8 md:flex-row md:items-center"><div><p className="font-mono text-xs uppercase text-primary">AssistantZero</p><h2 className="mt-3 text-2xl font-medium">{L('Die nächste Beratung beginnt mit Klarheit.', 'The next conversation starts with clarity.', 'Le prochain échange commence par la clarté.')}</h2></div><Button asChild size="lg" className="shrink-0"><Link to="/assistantzero">{start}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-7 text-xs text-muted-foreground sm:px-8"><Link to="/" className="font-mono hover:text-primary">inside-the-box.org<ArrowUpRight className="ml-1 inline h-3 w-3" /></Link><span>{L('AssistantZero · Entscheidungshilfe, kein Versicherungsangebot', 'AssistantZero · Decision support, not an insurance quote', 'AssistantZero · Aide à la décision, pas une offre d’assurance')}</span></footer>
    </div>
  );
}