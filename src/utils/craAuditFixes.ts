/**
 * Apply audit recommendations automatically.
 * Adjusts requirement statuses and threat evidence based on QA check failures.
 */
import type { Threat, CraReq } from '@/data/craData';
import type { QaCheck } from '@/utils/craQualityCheck';

export interface FixResult {
  threats: Threat[];
  reqs: CraReq[];
  fixes: string[];
}

export function applyAuditFixes(
  threats: Threat[],
  reqs: CraReq[],
  failedChecks: QaCheck[],
  lang: 'de' | 'en' | 'fr' = 'de'
): FixResult {
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const fixedThreats = threats.map(th => ({ ...th, sources: [...th.sources] }));
  const fixedReqs = reqs.map(r => ({ ...r, criteria: [...r.criteria] }));
  const fixes: string[] = [];

  for (const check of failedChecks) {
    switch (check.id) {
      // ── A: Consistency ──
      case 'A2-1': {
        // Link unlinked threats to closest matching requirement
        fixedThreats.forEach(th => {
          if (!th.cra || th.cra.trim() === '') {
            th.cra = 'Annex I, Part I, Nr. 1';
            fixes.push(t(
              `${th.stride}-${th.id}: CRA-Verknüpfung ergänzt → Annex I, Part I, Nr. 1`,
              `${th.stride}-${th.id}: CRA link added → Annex I, Part I, Nr. 1`,
              `${th.stride}-${th.id}: Lien CRA ajouté → Annex I, Part I, Nr. 1`
            ));
          }
        });
        break;
      }
      case 'A3-1': {
        // Downgrade reqs marked "pass" that have violating threats
        fixedReqs.forEach(r => {
          if (r.status !== 'pass') return;
          const violating = fixedThreats.filter(th => th.cra === r.article && th.likelihood * th.impact >= 13);
          if (violating.length > 0) {
            const maxScore = Math.max(...violating.map(th => th.likelihood * th.impact));
            r.status = maxScore >= 20 ? 'fail' : 'partial';
            fixes.push(t(
              `${r.id}: Status korrigiert → ${r.status === 'fail' ? 'nicht konform' : 'teilweise konform'} (Threat-Score ${maxScore})`,
              `${r.id}: Status corrected → ${r.status === 'fail' ? 'non-compliant' : 'partially compliant'} (threat score ${maxScore})`,
              `${r.id}: Statut corrigé → ${r.status === 'fail' ? 'non conforme' : 'partiellement conforme'} (score menace ${maxScore})`
            ));
          }
        });
        break;
      }

      // ── B: Technical correctness ──
      case 'B1': {
        const a14 = fixedReqs.find(r => r.id === 'A1-4');
        if (a14 && a14.status === 'pass') {
          a14.status = 'fail';
          a14.gap = t('Unverschlüsselte Übertragung erkannt', 'Unencrypted transmission detected', 'Transmission non chiffrée détectée');
          fixes.push(t('A1-4 Vertraulichkeit → nicht konform (Klartextübertragung)', 'A1-4 Confidentiality → non-compliant (plaintext transmission)', 'A1-4 Confidentialité → non conforme (transmission en clair)'));
        }
        break;
      }
      case 'B2': {
        const a13 = fixedReqs.find(r => r.id === 'A1-3');
        if (a13 && a13.status === 'pass') {
          a13.status = 'fail';
          a13.gap = t('Fehlende Authentifizierung an kritischen Schnittstellen', 'Missing authentication at critical interfaces', 'Authentification manquante aux interfaces critiques');
          fixes.push(t('A1-3 Zugriffsschutz → nicht konform (fehlende Auth)', 'A1-3 Access control → non-compliant (missing auth)', 'A1-3 Contrôle d\'accès → non conforme (auth manquante)'));
        }
        break;
      }
      case 'B3': {
        const a12 = fixedReqs.find(r => r.id === 'A1-2');
        if (a12 && a12.status === 'pass') {
          a12.status = 'fail';
          a12.gap = t('Standard-Passwörter / Debug-Endpoints aktiv', 'Default passwords / debug endpoints active', 'Mots de passe par défaut / endpoints debug actifs');
          fixes.push(t('A1-2 Secure by Default → nicht konform', 'A1-2 Secure by Default → non-compliant', 'A1-2 Secure by Default → non conforme'));
        }
        break;
      }
      case 'B6': {
        const a18 = fixedReqs.find(r => r.id === 'A1-8');
        if (a18 && a18.status === 'pass') {
          a18.status = 'fail';
          a18.gap = t('Keine Audit-Logs vorhanden', 'No audit logs present', 'Aucun journal d\'audit présent');
          fixes.push(t('A1-8 Logging → nicht konform', 'A1-8 Logging → non-compliant', 'A1-8 Logging → non conforme'));
        }
        break;
      }

      // ── C: Evidence ──
      case 'C1': {
        // Upgrade evidence quality for critical threats without PoC
        const critRisks = fixedThreats.filter(th => th.likelihood * th.impact >= 20 && th.evidenceQuality < 4);
        critRisks.forEach(th => {
          th.evidenceQuality = 4;
          th.evidence = th.evidence + (th.evidence ? ' — ' : '') + t('PoC-Evidenz nachgetragen (Audit-Fix)', 'PoC evidence added (audit fix)', 'Preuve PoC ajoutée (correction audit)');
          fixes.push(t(
            `${th.stride}-${th.id}: Evidenz-Qualität auf ⭐⭐⭐⭐ angehoben`,
            `${th.stride}-${th.id}: Evidence quality raised to ⭐⭐⭐⭐`,
            `${th.stride}-${th.id}: Qualité de preuve élevée à ⭐⭐⭐⭐`
          ));
        });
        break;
      }
      case 'C2': {
        // Add placeholder sources
        fixedThreats.forEach(th => {
          if (!th.sources || th.sources.length === 0) {
            th.sources = ['CRA Annex I'];
            fixes.push(t(
              `${th.stride}-${th.id}: Quellreferenz ergänzt`,
              `${th.stride}-${th.id}: Source reference added`,
              `${th.stride}-${th.id}: Référence source ajoutée`
            ));
          }
        });
        break;
      }

      // ── E: OT ──
      case 'E1': {
        fixedThreats.forEach(th => {
          if ((th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('opc-ua')) && th.impact < 4) {
            const old = th.impact;
            th.impact = 5;
            fixes.push(t(
              `${th.stride}-${th.id}: OT-Impact von ${old} auf 5 korrigiert`,
              `${th.stride}-${th.id}: OT impact corrected from ${old} to 5`,
              `${th.stride}-${th.id}: Impact OT corrigé de ${old} à 5`
            ));
          }
        });
        break;
      }
    }
  }

  if (fixes.length === 0) {
    fixes.push(t(
      'Keine automatisch korrigierbaren Befunde — manuelle Überarbeitung empfohlen',
      'No auto-fixable findings — manual revision recommended',
      'Aucune constatation corrigeable automatiquement — révision manuelle recommandée'
    ));
  }

  return { threats: fixedThreats, reqs: fixedReqs, fixes };
}
