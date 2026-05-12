// EU AI Act Readiness Report — slim PDF using shared pdfCore engine.
import type { AiActIntakeData, AiActRisk, AiActReq, AiRiskClass } from '@/data/aiActData';
import { riskId, RISK_CATEGORIES, CLASS_META } from '@/data/aiActData';
import { createPdfDoc, humanizeList, humanizeText } from '@/utils/pdfCore';

export interface AiActReportData {
  intakeData: AiActIntakeData;
  risks: AiActRisk[];
  reqs: AiActReq[];
  language: 'de' | 'en' | 'fr';
  classification: AiRiskClass;
  isDraft?: boolean;
}

const I = (de: string, en: string, fr: string, lang: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;

export async function generateAiActReport(data: AiActReportData): Promise<void> {
  const { intakeData, risks, reqs, language, classification, isDraft } = data;
  const lang = language;

  const pdf = await createPdfDoc({
    lang, isDraft,
    reportPrefix: 'AI-ACT',
    confidentialLabel: I('VERTRAULICH', 'CONFIDENTIAL', 'CONFIDENTIEL', lang),
    pageLabel: I('Seite', 'Page', 'Page', lang),
    draftWatermark: I('ENTWURF', 'DRAFT', 'BROUILLON', lang),
  });

  const today = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const classLabel = CLASS_META[classification][lang as 'de'|'en'|'fr'];

  // ── Cover ──
  pdf.newPage();
  pdf.heading(I('EU-AI-Act-Readiness-Bericht', 'EU AI Act Readiness Report', 'Rapport de préparation EU AI Act', lang), 1);
  pdf.bodyText(I(
    `Konformitätsbewertung nach Verordnung (EU) 2024/1689 für ${intakeData.entityName || '—'}.`,
    `Compliance assessment per Regulation (EU) 2024/1689 for ${intakeData.entityName || '—'}.`,
    `Évaluation de conformité selon le règlement (UE) 2024/1689 pour ${intakeData.entityName || '—'}.`,
    lang,
  ));
  pdf.field(I('System','System','Système',lang), intakeData.systemName || '—');
  pdf.field(I('Klassifizierung','Classification','Classification',lang), classLabel);
  pdf.field(I('Erstellt am','Generated on','Généré le',lang), today);

  // ── 1 Management Summary ──
  pdf.newPage();
  pdf.heading('1  ' + I('Zusammenfassung für die Geschäftsleitung', 'Management Summary', 'Synthèse pour la direction', lang), 1);
  const critRisks = risks.filter(r => r.likelihood * r.impact >= 20);
  const failReqs = reqs.filter(r => r.status === 'fail');
  pdf.bodyText(I(
    `Die Bewertung des KI-Systems "${intakeData.systemName || '—'}" erfolgt im Kontext der Klassifizierung "${classLabel}". Es wurden ${risks.length} Risiken in den Dimensionen Bias, Robustheit, Transparenz, Datenschutz, Sicherheit, Governance und Umweltauswirkung identifiziert; davon ${critRisks.length} mit kritischem Score (≥ 20). Von ${reqs.length} geprüften AI-Act-Anforderungen bestehen aktuell ${failReqs.length} substantielle Lücken.`,
    `The assessment of the AI system "${intakeData.systemName || '—'}" was conducted under the classification "${classLabel}". ${risks.length} risks were identified across bias, robustness, transparency, privacy, security, governance and environmental dimensions; ${critRisks.length} with critical score (≥ 20). Of ${reqs.length} AI Act requirements assessed, ${failReqs.length} substantive gaps remain.`,
    `L'évaluation du système IA "${intakeData.systemName || '—'}" a été menée sous la classification "${classLabel}". ${risks.length} risques ont été identifiés ; ${critRisks.length} avec score critique. Sur ${reqs.length} exigences évaluées, ${failReqs.length} lacunes subsistent.`,
    lang,
  ));
  pdf.kpiRow([
    [String(risks.length), I('Risiken','Risks','Risques',lang)],
    [String(critRisks.length), I('Kritisch','Critical','Critiques',lang)],
    [String(failReqs.length), I('Lücken','Gaps','Lacunes',lang)],
    [classLabel.length > 18 ? classLabel.slice(0, 16) + '…' : classLabel, I('Klasse','Class','Classe',lang)],
  ]);

  // ── 2 Scope ──
  pdf.newPage();
  pdf.heading('2  ' + I('Gegenstand der Prüfung', 'Scope of Assessment', 'Périmètre de l\'évaluation', lang), 1);
  pdf.field(I('Einrichtung','Entity','Entité',lang), intakeData.entityName || '—');
  pdf.field(I('Rolle nach AI Act','Role under AI Act','Rôle AI Act',lang), intakeData.role.join(', ') || '—');
  pdf.field(I('System / Modell','System / Model','Système / Modèle',lang), intakeData.systemName || '—');
  pdf.field(I('Zweckbestimmung','Intended purpose','Finalité prévue',lang), intakeData.systemPurpose || '—');
  pdf.field(I('Domäne','Domain','Domaine',lang), intakeData.domain || '—');
  if (intakeData.annexIII.length > 0) {
    pdf.field(I('Anhang-III-Bereiche','Annex III domains','Domaines Annexe III',lang), intakeData.annexIII.join(', '));
  }
  if (intakeData.knownIssues) pdf.bodyText(humanizeText(intakeData.knownIssues, lang, 'issues'));

  // ── 3 Findings: Risk Landscape ──
  pdf.newPage();
  pdf.heading('3  ' + I('Feststellungen — Risikolandschaft', 'Findings — Risk Landscape', 'Constatations — Paysage des risques', lang), 1);
  for (const r of risks) {
    pdf.checkSpace(40);
    const score = r.likelihood * r.impact;
    pdf.sectionLabel(`${riskId(r)}  ${RISK_CATEGORIES[r.category]?.label[lang] || r.category}  •  ${r.aiActRef}  •  ${I('Score','Score','Score',lang)} ${r.likelihood}×${r.impact}=${score}`);
    pdf.bodyText(r.name);
    pdf.fieldInline(I('Komponente','Component','Composant',lang), r.component);
    pdf.fieldInline(I('Akteur','Actor','Acteur',lang), r.attacker);
    pdf.fieldInline(I('Pfad','Path','Chemin',lang), r.path);
    pdf.fieldInline(I('Evidenz','Evidence','Preuve',lang), r.evidence);
    pdf.fieldInline(I('Begründung','Rationale','Fondement',lang), r.rationale);
    if (r.sources.length > 0) pdf.fieldInline(I('Quellen','Sources','Sources',lang), r.sources.join(' · '));
  }

  // ── 4 Findings: Compliance Gaps ──
  pdf.newPage();
  pdf.heading('4  ' + I('Feststellungen — AI-Act-Konformitätslücken', 'Findings — AI Act Compliance Gaps', 'Constatations — Lacunes de conformité', lang), 1);
  for (const r of reqs) {
    pdf.checkSpace(35);
    pdf.sectionLabel(`${r.id}  •  ${r.article}`);
    pdf.bodyText(r.name);
    pdf.statusBadge(r.status);
    pdf.y += 4;
    if (r.evidence) pdf.fieldInline(I('Evidenz','Evidence','Preuve',lang), r.evidence);
    if (r.gap) pdf.fieldInline(I('Lücke','Gap','Lacune',lang), r.gap);
    if (r.rationale) pdf.fieldInline(I('Begründung','Rationale','Fondement',lang), r.rationale);
    if (r.measure) pdf.fieldInline(I('Maßnahme','Measure','Mesure',lang), r.measure);
    if (r.criteria.length > 0) {
      pdf.fieldInline(I('Kriterien','Criteria','Critères',lang), r.criteria.join(' · '));
    }
    if (r.effort || r.priority) {
      pdf.fieldInline(I('Aufwand / Priorität','Effort / Priority','Effort / Priorité',lang), `${r.effort || '—'}  •  ${r.priority || '—'}`);
    }
  }

  // ── 5 Roadmap ──
  pdf.newPage();
  pdf.heading('5  ' + I('Handlungsempfehlungen und Roadmap', 'Recommendations and Roadmap', 'Recommandations et feuille de route', lang), 1);
  ['P0', 'P1', 'P2', 'P3'].forEach(p => {
    const items = reqs.filter(r => r.priority === p && r.status !== 'pass');
    if (items.length === 0) return;
    pdf.sectionLabel(`${p}  (${items.length})`);
    items.forEach(r => pdf.bulletItem(`${r.id} — ${r.name}  •  ${r.effort || '—'}`));
  });

  // ── 6 Methodology ──
  pdf.newPage();
  pdf.heading('6  ' + I('Methodik','Methodology','Méthodologie',lang), 1);
  pdf.bodyText(I(
    'Risiken werden anhand einer 5×5-Matrix (Eintrittswahrscheinlichkeit × Auswirkung) bewertet. Anforderungen werden in pass / partial / fail klassifiziert. Bidirektionale Traceability zwischen Risiken und Anforderungen wird automatisch geprüft. Verbotene Praktiken nach Art. 5 führen zu sofortigem Quality-Gate-Ausschluss.',
    'Risks are scored on a 5×5 likelihood × impact matrix. Requirements are classified pass / partial / fail. Bidirectional traceability between risks and requirements is automatically checked. Prohibited practices under Art. 5 trigger immediate quality-gate failure.',
    'Les risques sont évalués sur une matrice 5×5. Les exigences sont classées pass / partial / fail. Une traçabilité bidirectionnelle est vérifiée automatiquement. Les pratiques interdites Art. 5 entraînent un échec immédiat.',
    lang,
  ));

  // Save
  pdf.doc.save(`AI-Act-Readiness_${intakeData.entityName || 'Report'}_${today.replace(/[^0-9A-Za-z]/g, '-')}.pdf`);
}
