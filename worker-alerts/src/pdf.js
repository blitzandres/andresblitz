// Builds the bio and crypto-guides PDFs from the site's own content, stamped with a per-email tag.
// The tag goes in three places: the PDF metadata, a small footer on every page, and invisible
// text on every page. To use a dedicated encoding library later, replace stamp() below.
import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from 'pdf-lib';

const W = 595.28, H = 841.89, M = 56;          // A4, margins in points
const INK = rgb(0.07, 0.09, 0.14), MUTED = rgb(0.42, 0.47, 0.56), ACCENT = rgb(0.36, 0.55, 0.94);
const GUIDES = ['que-es-usdt', 'como-funciona-p2p', 'redes-y-comisiones', 'brecha-dolar-cripto', 'estafas-comunes'];

// Standard PDF fonts only cover Latin-1 plus a few typographic marks.
const EXTRA = '–—‘’“”•…€';
const clean = (s) => [...String(s)].filter((ch) => { const c = ch.charCodeAt(0); return (c >= 32 && c < 127) || (c >= 160 && c <= 255) || EXTRA.includes(ch); }).join('');

export async function buildPdf(env, doc, tag) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const w = writer(pdf, font, bold);

  if (doc === 'bio') {
    const site = await (await fetch(env.SITE + '/api/site.json')).json();
    w.title(clean(site.name));
    w.meta(clean(`${site.location} · andresblitz.com`));
    w.para(clean(site.description));
    w.h2('Focus');
    w.para(clean(site.topics.join(' · ')));
    w.h2('Projects');
    for (const p of site.pages.filter((x) => x.kind === 'project')) {
      w.bullet(clean(p.title.replace(/\s*\|\s*Andr[ée]s Blitz.*$/, '')), clean(p.summary));
    }
    w.h2('Contact');
    w.para(clean(`${site.contact.email} · ${site.contact.x} · ${site.contact.github}`));
  } else {
    w.title('Guías cripto en español');
    w.meta('USDT, P2P, redes, brecha y estafas · andresblitz.com/guias-cripto/');
    w.para('Informativo, no es asesoría financiera.');
    for (const slug of GUIDES) {
      const md = await (await fetch(`${env.SITE}/guias-cripto/${slug}/index.md`)).text();
      w.newPage();
      for (const block of mdBlocks(md)) {
        if (block.h === 1) w.title(clean(block.text));
        else if (block.h) w.h2(clean(block.text));
        else if (block.li) w.bullet('', clean(block.text));
        else w.para(clean(block.text));
      }
    }
  }

  stamp(pdf, font, doc, tag);
  return pdf.save();
}

function stamp(pdf, font, doc, tag) {
  pdf.setTitle(doc === 'bio' ? 'Andrés Blitz — Bio' : 'Guías cripto — andresblitz.com');
  pdf.setAuthor('Andrés Blitz');
  pdf.setSubject('Personal copy ' + tag);
  pdf.setKeywords(['andresblitz', 'copy:' + tag]);
  pdf.setCreator('andresblitz.com');
  pdf.getInfoDict().set(PDFName.of('ABCopyId'), PDFString.of(tag));
  const pages = pdf.getPages();
  pages.forEach((page, i) => {
    page.drawText(`Copia personal · ${tag} · ${i + 1}/${pages.length}`, { x: M, y: 28, size: 7, font, color: MUTED });
    page.drawText(`ab-copy:${tag}`, { x: M, y: 12, size: 4, font, color: rgb(1, 1, 1), opacity: 0 });
  });
}

function writer(pdf, font, bold) {
  let page, y;
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  newPage();
  const need = (h) => { if (y - h < M + 20) newPage(); };
  const lines = (text, f, size, width) => {
    const out = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/)) {
        const t = line ? line + ' ' + word : word;
        if (f.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = word; } else line = t;
      }
      out.push(line);
    }
    return out;
  };
  const block = (text, f, size, color, gap, indent = 0) => {
    for (const l of lines(text, f, size, W - 2 * M - indent)) {
      need(size * 1.5);
      page.drawText(l, { x: M + indent, y: y - size, size, font: f, color });
      y -= size * 1.5;
    }
    y -= gap;
  };
  return {
    newPage,
    title: (t) => { need(40); page.drawRectangle({ x: M, y: y - 4, width: 40, height: 3, color: ACCENT }); y -= 14; block(t, bold, 22, INK, 6); },
    meta: (t) => block(t, font, 10, MUTED, 14),
    h2: (t) => { y -= 6; block(t, bold, 13, INK, 4); },
    para: (t) => block(t, font, 10.5, INK, 8),
    bullet: (head, t) => {
      need(30);
      page.drawCircle({ x: M + 3, y: y - 6, size: 1.6, color: ACCENT });
      if (head) block(head, bold, 10.5, INK, 1, 12);
      block(t, font, 10, head ? MUTED : INK, 6, 12);
    },
  };
}

// Small Markdown reader: headings, list items and paragraphs, with inline marks removed.
export function mdBlocks(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  const out = [];
  for (const raw of body.split(/\n{2,}/)) {
    const t = raw.trim();
    if (!t || t.startsWith('>') || t.startsWith('|') || t.startsWith('```')) continue;
    const inline = (s) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '').trim();
    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) { out.push({ h: h[1].length, text: inline(h[2]) }); continue; }
    if (/^([-*]|\d+\.)\s/.test(t)) {
      for (const li of t.split('\n')) { const m = li.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/); if (m) out.push({ li: true, text: inline(m[1]) }); }
      continue;
    }
    out.push({ text: inline(t.replace(/\n/g, ' ')) });
  }
  return out;
}
