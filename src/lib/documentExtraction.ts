// Client-side document text extraction.
// Files never leave the browser as binaries — only extracted plain text is
// later sent to the assessment AI. Supports PDF, DOCX, XLSX/CSV and plain text.

export interface ExtractedDocument {
  name: string;
  size: number;
  type: string;
  text: string;
  chars: number;
  status: 'ok' | 'empty' | 'unsupported' | 'error';
  error?: string;
}

const MAX_CHARS_PER_DOC = 60000; // cap per document to keep AI payload sane

function clamp(text: string): string {
  const clean = text.replace(/\u0000/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return clean.length > MAX_CHARS_PER_DOC ? clean.slice(0, MAX_CHARS_PER_DOC) + '\n…[truncated]' : clean;
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Worker via bundled URL (Vite resolves ?url)
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = '';
  const pages = Math.min(doc.numPages, 80);
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => ('str' in it ? it.str : ''));
    out += strings.join(' ') + '\n';
    if (out.length > MAX_CHARS_PER_DOC) break;
  }
  return out;
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value || '';
}

async function extractSpreadsheet(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  let out = '';
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws);
    if (csv.trim()) out += `# ${sheetName}\n${csv}\n\n`;
    if (out.length > MAX_CHARS_PER_DOC) break;
  }
  return out;
}

async function extractText(file: File): Promise<string> {
  return await file.text();
}

const PLAIN_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'log', 'ini', 'cfg', 'conf'];

function ext(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

export async function extractDocumentText(file: File): Promise<{ text: string; status: ExtractedDocument['status']; error?: string }> {
  const e = ext(file.name);
  const mime = (file.type || '').toLowerCase();
  try {
    let raw = '';
    if (e === 'pdf' || mime === 'application/pdf') {
      raw = await extractPdf(file);
    } else if (e === 'docx' || mime.includes('officedocument.wordprocessingml')) {
      raw = await extractDocx(file);
    } else if (['xlsx', 'xls', 'xlsm'].includes(e) || mime.includes('spreadsheetml') || mime === 'application/vnd.ms-excel') {
      raw = await extractSpreadsheet(file);
    } else if (PLAIN_EXT.includes(e) || mime.startsWith('text/')) {
      raw = await extractText(file);
    } else if (e === 'doc') {
      return { text: '', status: 'unsupported', error: 'Legacy .doc not supported — please convert to .docx or PDF.' };
    } else {
      // last resort: try reading as text
      raw = await extractText(file);
      if (!/[\x20-\x7E]{8,}/.test(raw)) {
        return { text: '', status: 'unsupported', error: `Format .${e || '?'} not supported for content analysis.` };
      }
    }
    const text = clamp(raw);
    return { text, status: text.length > 0 ? 'ok' : 'empty' };
  } catch (err) {
    return { text: '', status: 'error', error: err instanceof Error ? err.message : 'Extraction failed' };
  }
}
