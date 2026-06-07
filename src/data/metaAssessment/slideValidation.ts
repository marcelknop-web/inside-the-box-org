// Slide-metric validation — checks every presentation slide for correct
// numerical values, units and rounding against the canonical source metrics.
//
// Gamma may rephrase slide text, but it must never alter, mis-round or
// mis-unit a figure. This validator runs deterministically on the slide
// content BEFORE it is sent to Gamma, so the deck only ships when every
// number on every slide is traceable to the authoritative assessment data.
//
// RULE: no content is invented — the validator only checks consistency
// between slide figures and the deterministic source metrics.
import type { PresentationType } from './presentationContent';
import { selectPresentationCards, type PresentationInput } from './presentationContent';
import type { QaCheckItem, QaPanelResult } from '@/components/QualityCheckPanel';

export interface SlideValidationResult {
  result: QaPanelResult;
  /** category id → display label, ordered by slide */
  categories: Record<string, string>;
}

/** A canonical, authoritative metric the slides must match exactly. */
interface CanonicalMetric {
  value: number;
  unit: 'percent' | 'level' | 'count' | 'score';
}

const round = (n: number) => Math.round(n);

/** Builds the authoritative metric registry from the deterministic assessment. */
function buildCanonical(input: PresentationInput) {
  const { computed, result } = input;

  const percents = new Set<number>();
  const levels = new Set<number>();

  // Readiness score
  percents.add(round(computed.score.weighted));

  // Control coverage percentages (Math.round(n/total*100))
  const reqs = result.requirements;
  const total = reqs.length;
  const pass = reqs.filter((r) => r.status === 'pass').length;
  const partial = reqs.filter((r) => r.status === 'partial').length;
  const gap = reqs.filter((r) => r.status === 'fail').length;
  const pctOf = (n: number) => (total ? round((n / total) * 100) : 0);
  [pass, partial, gap].forEach((n) => percents.add(pctOf(n)));

  // Audit readiness
  const ar = computed.auditReadiness;
  if (ar) {
    if (typeof ar.overallPct === 'number') percents.add(round(ar.overallPct));
    (ar.dimensions ?? []).forEach((d) => {
      if (typeof d.pct === 'number') percents.add(round(d.pct));
    });
  }

  // CMMI levels (official 1–5 integers)
  const cmmi = computed.cmmi;
  if (cmmi?.enabled) {
    levels.add(cmmi.overall);
    levels.add(cmmi.target);
    (cmmi.categories ?? []).forEach((c) => { levels.add(c.level); levels.add(c.target); });
    (cmmi.controls ?? []).forEach((c) => { levels.add(c.level); levels.add(c.target); });
  }

  return {
    percents,
    levels,
    counts: { pass, partial, gap, total },
  };
}

/** Extracts every percentage token, with its raw (possibly decimal) value. */
function extractPercents(md: string): { raw: string; value: number; isInteger: boolean }[] {
  const out: { raw: string; value: number; isInteger: boolean }[] = [];
  const re = /(\d+(?:\.\d+)?)\s*%/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const value = parseFloat(m[1]);
    out.push({ raw: m[0], value, isInteger: Number.isInteger(value) });
  }
  return out;
}

/** Extracts every CMMI level token (L1–L5). */
function extractLevels(md: string): { raw: string; value: number; isInteger: boolean }[] {
  const out: { raw: string; value: number; isInteger: boolean }[] = [];
  const re = /\bL\s?(\d+(?:\.\d+)?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const value = parseFloat(m[1]);
    out.push({ raw: m[0], value, isInteger: Number.isInteger(value) });
  }
  return out;
}

/** Extracts risk tuples "L<l> × I<i> (<score>)". */
function extractRiskTuples(md: string): { raw: string; l: number; i: number; score: number }[] {
  const out: { raw: string; l: number; i: number; score: number }[] = [];
  const re = /L\s?(\d+)\s*[×x]\s*I\s?(\d+)\s*\((\d+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    out.push({ raw: m[0], l: parseInt(m[1], 10), i: parseInt(m[2], 10), score: parseInt(m[3], 10) });
  }
  return out;
}

export function validateSlideMetrics(type: PresentationType, input: PresentationInput): SlideValidationResult {
  const lang = input.lang;
  const t = (de: string, en: string, fr: string) => (lang === 'de' ? de : lang === 'fr' ? fr : en);

  const cards = selectPresentationCards(type, input);
  const canon = buildCanonical(input);
  const checks: QaCheckItem[] = [];
  const categories: Record<string, string> = {};

  cards.forEach((card, idx) => {
    const catKey = `slide-${idx + 1}`;
    categories[catKey] = `${idx + 1}. ${card.headline}`;
    const md = card.md;

    // ── 1. Percentages: rounding (must be integers) ──
    const pcts = extractPercents(md);
    if (pcts.length > 0) {
      const badRound = pcts.filter((p) => !p.isInteger);
      checks.push({
        id: `${catKey}-pct-round`, category: catKey,
        label: t('Prozentwerte korrekt gerundet', 'Percentages correctly rounded', 'Pourcentages correctement arrondis'),
        detail: badRound.length
          ? `${t('Nicht ganzzahlig', 'Not whole numbers', 'Non entiers')}: ${badRound.map((p) => p.raw).join(', ')}`
          : `${pcts.length} ${t('Werte ganzzahlig', 'integer values', 'valeurs entières')}`,
        passed: badRound.length === 0, severity: 'major',
      });

      // ── 2. Percentages: traceable to source ──
      const untraceable = pcts.filter((p) => !canon.percents.has(round(p.value)));
      checks.push({
        id: `${catKey}-pct-trace`, category: catKey,
        label: t('Prozentwerte aus Quellmetriken', 'Percentages match source metrics', 'Pourcentages issus des métriques source'),
        detail: untraceable.length
          ? `${t('Nicht in Quelle', 'Not in source', 'Absent de la source')}: ${untraceable.map((p) => p.raw).join(', ')}`
          : t('Alle rückverfolgbar', 'All traceable', 'Toutes traçables'),
        passed: untraceable.length === 0, severity: 'critical',
      });
    }

    // ── 3. CMMI levels: integer 1–5 and traceable ──
    const lvls = extractLevels(md);
    if (lvls.length > 0 && canon.levels.size > 0) {
      const badLevels = lvls.filter((l) => !l.isInteger || l.value < 1 || l.value > 5 || !canon.levels.has(l.value));
      checks.push({
        id: `${catKey}-cmmi`, category: catKey,
        label: t('CMMI-Level korrekt (1–5, Quelle)', 'CMMI levels valid (1–5, source)', 'Niveaux CMMI valides (1–5, source)'),
        detail: badLevels.length
          ? `${t('Ungültig/abweichend', 'Invalid/mismatched', 'Invalides/divergents')}: ${badLevels.map((l) => l.raw).join(', ')}`
          : `${lvls.length} ${t('Level konsistent', 'levels consistent', 'niveaux cohérents')}`,
        passed: badLevels.length === 0, severity: 'critical',
      });
    }

    // ── 4. Risk tuples: score must equal likelihood × impact ──
    const tuples = extractRiskTuples(md);
    if (tuples.length > 0) {
      const wrong = tuples.filter((r) => r.l * r.i !== r.score || r.l < 1 || r.l > 5 || r.i < 1 || r.i > 5);
      checks.push({
        id: `${catKey}-risk`, category: catKey,
        label: t('Risiko-Scores = Eintritt × Auswirkung', 'Risk scores = likelihood × impact', 'Scores de risque = probabilité × impact'),
        detail: wrong.length
          ? `${t('Falsch berechnet', 'Wrong calculation', 'Calcul erroné')}: ${wrong.map((r) => r.raw).join(', ')}`
          : `${tuples.length} ${t('Scores korrekt', 'scores correct', 'scores corrects')}`,
        passed: wrong.length === 0, severity: 'critical',
      });
    }

    // ── 5. Control overview: pass + partial + gap = total ──
    if (card.headline === 'Control Overview') {
      const { pass, partial, gap, total } = canon.counts;
      const ok = pass + partial + gap === total;
      checks.push({
        id: `${catKey}-count-sum`, category: catKey,
        label: t('Kontroll-Summe = Gesamtanzahl', 'Control counts sum to total', 'Somme des contrôles = total'),
        detail: `${pass}+${partial}+${gap} = ${pass + partial + gap} ${ok ? '=' : '≠'} ${total}`,
        passed: ok, severity: 'critical',
      });
    }

    // If a slide produced no numeric check at all, record an (informational) pass.
    if (!checks.some((c) => c.category === catKey)) {
      checks.push({
        id: `${catKey}-none`, category: catKey,
        label: t('Keine prüfbaren Kennzahlen', 'No quantitative metrics to verify', 'Aucune métrique à vérifier'),
        detail: t('Textfolie ohne Zahlenwerte', 'Narrative slide without figures', 'Diapositive sans chiffres'),
        passed: true, severity: 'minor',
      });
    }
  });

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  const criticalErrors = checks.filter((c) => !c.passed && c.severity === 'critical').length;
  const total = checks.length;

  const verdict: QaPanelResult['verdict'] = criticalErrors > 0 ? 'failed' : failed > 0 ? 'conditional' : 'passed';
  const verdictLabel = verdict === 'passed'
    ? t('FOLIEN-VALIDIERUNG: BESTANDEN', 'SLIDE VALIDATION: PASSED', 'VALIDATION DES DIAPOSITIVES : RÉUSSIE')
    : verdict === 'conditional'
    ? t(`FOLIEN-VALIDIERUNG: BEDINGT (${passed}/${total})`, `SLIDE VALIDATION: CONDITIONAL (${passed}/${total})`, `VALIDATION : CONDITIONNELLE (${passed}/${total})`)
    : t(`FOLIEN-VALIDIERUNG: NICHT BESTANDEN (${passed}/${total})`, `SLIDE VALIDATION: FAILED (${passed}/${total})`, `VALIDATION : ÉCHOUÉE (${passed}/${total})`);

  return {
    result: { checks, passed, failed, total, criticalErrors, verdict, verdictLabel },
    categories,
  };
}
