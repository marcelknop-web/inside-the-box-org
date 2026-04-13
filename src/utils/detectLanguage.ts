/**
 * Simple language detection based on character patterns and common words.
 * Analyses free-text fields from intake data to determine content language.
 */

const DE_MARKERS = [
  'und', 'der', 'die', 'das', 'ist', 'ein', 'eine', 'für', 'mit', 'auf',
  'nicht', 'auch', 'sich', 'nach', 'bei', 'über', 'werden', 'sowie',
  'durch', 'kann', 'oder', 'alle', 'wird', 'sind', 'wurde', 'vom',
  'zum', 'zur', 'aus', 'wie', 'nur', 'noch', 'mehr', 'aber', 'haben',
  'bereits', 'zwischen', 'sicherheit', 'prüfung', 'unternehmen',
];

const FR_MARKERS = [
  'les', 'des', 'une', 'est', 'dans', 'pour', 'que', 'sur', 'par',
  'avec', 'sont', 'pas', 'plus', 'aux', 'ont', 'été', 'nous', 'cette',
  'tout', 'entre', 'après', 'aussi', 'peut', 'leurs', 'même', 'sans',
  'sous', 'donc', 'être', 'sécurité', 'entreprise', 'réseau',
];

const EN_MARKERS = [
  'the', 'and', 'for', 'are', 'was', 'that', 'with', 'this', 'from',
  'have', 'has', 'been', 'were', 'which', 'their', 'will', 'would',
  'there', 'each', 'about', 'other', 'into', 'more', 'could', 'than',
  'only', 'should', 'after', 'security', 'network', 'system',
];

function countMarkers(words: string[], markers: string[]): number {
  const set = new Set(markers);
  return words.filter(w => set.has(w)).length;
}

/**
 * Detect language from an array of free-text strings.
 * Returns 'de' | 'en' | 'fr'.
 */
export function detectLanguage(texts: string[]): 'de' | 'en' | 'fr' {
  const combined = texts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-zäöüàâéèêëîïôùûç\s]/g, ' ');

  const words = combined.split(/\s+/).filter(w => w.length >= 2);

  if (words.length < 5) return 'en'; // too little text, default EN

  const de = countMarkers(words, DE_MARKERS);
  const fr = countMarkers(words, FR_MARKERS);
  const en = countMarkers(words, EN_MARKERS);

  // Check for umlauts / ß as strong DE signal
  const hasUmlauts = /[äöüß]/.test(combined);
  const deScore = de + (hasUmlauts ? 5 : 0);

  // Check for accented chars as FR signal
  const hasFrAccents = /[àâéèêëîïôùûç]/.test(combined);
  const frScore = fr + (hasFrAccents ? 5 : 0);

  if (deScore > en && deScore > frScore) return 'de';
  if (frScore > en && frScore > deScore) return 'fr';
  return 'en';
}

/** Extract free-text fields from a generic intake object for detection. */
export function extractTexts(intake: Record<string, any>): string[] {
  const texts: string[] = [];
  for (const val of Object.values(intake)) {
    if (typeof val === 'string' && val.length > 3) texts.push(val);
    if (Array.isArray(val)) {
      val.forEach(v => { if (typeof v === 'string' && v.length > 3) texts.push(v); });
    }
  }
  return texts;
}
