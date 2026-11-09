// The 10 sign-up topics. `unique`: one subscription per email, whatever the options.
const C = (enSubj, enLead, esSubj, esLead, enReady = '', esReady = '') => ({
  en: { confirmSubject: enSubj, confirmLead: enLead, ready: enReady },
  es: { confirmSubject: esSubj, confirmLead: esLead, ready: esReady },
});

export const TOPICS = {
  'btc-bracket': {
    copy: C('Confirm your Bitcoin bracket alert', 'Click below and we will email you when Bitcoin closes a day in a new price bracket.',
      'Confirma tu alerta de Bitcoin', 'Confirma y te avisamos cuando Bitcoin cierre el día en un nuevo rango de precio.'),
  },
  'bio-pdf': {
    unique: true,
    copy: C('Confirm to get the PDF bio', 'Click below and your personal copy of the Andrés Blitz bio will be on its way.',
      'Confirma para recibir la biografía en PDF', 'Confirma y te enviamos tu copia personal de la biografía.',
      'Your PDF bio is ready', 'Tu biografía en PDF está lista'),
  },
  'dolar-gap': {
    copy: C('Confirm your dollar gap alert', 'Click below and we will email you when the crypto dollar gap crosses your level.',
      'Confirma tu alerta de brecha', 'Confirma y te avisamos cuando la brecha del dólar cripto cruce tu nivel.'),
  },
  'bcv-daily': {
    unique: true,
    copy: C('Confirm the daily BCV rate', 'Click below to get the Tasa BCV every morning.',
      'Confirma la Tasa BCV diaria', 'Confirma y recibe la Tasa BCV cada mañana, alrededor de las 8:00 (hora de Caracas).'),
  },
  'rates-weekly': {
    unique: true,
    copy: C('Confirm the weekly LatAm rates', 'Click below to get dollar rates for 7 countries every Monday.',
      'Confirma el resumen semanal', 'Confirma y recibe cada lunes el dólar en 7 países, con el cambio de la semana.'),
  },
  'guias-pdf': {
    unique: true,
    copy: C('Confirm to get the crypto guides PDF', 'Click below and the 5 crypto guides arrive as one PDF.',
      'Confirma para recibir las guías en PDF', 'Confirma y te enviamos las 5 guías cripto en un solo PDF.',
      'Your crypto guides PDF is ready', 'Tus guías cripto en PDF están listas'),
  },
  'new-projects': {
    unique: true,
    copy: C('Confirm new project alerts', 'Click below to hear when a new project or demo goes live.',
      'Confirma avisos de proyectos nuevos', 'Confirma y te avisamos cuando haya un proyecto nuevo.'),
  },
  'trading-notes': {
    unique: true,
    copy: C('Confirm trading notes', 'Click below to get the monthly trading notes when they publish.',
      'Confirma las notas de trading', 'Confirma y recibe las notas de trading mensuales.'),
  },
  el70: {
    unique: true,
    copy: C('Confirm El 70 updates', 'Click below to get news from El 70, the family ranch in Zulia.',
      'Confirma las noticias de El 70', 'Confirma y recibe las novedades de la finca El 70.'),
  },
  'calc-result': {
    copy: C('Confirm to get your result', 'Click below and we will email your result, plus a reminder in 30 days.',
      'Confirma para recibir tu resultado', 'Confirma y te enviamos tu resultado, más un recordatorio en 30 días.',
      'Your result', 'Tu resultado'),
  },
};

const CALCS = {
  'enviar-dinero': 'Costo de enviar dinero',
  'salario-en-dolares': 'Salario en dólares',
  'convertidor-cripto': 'Convertidor cripto',
  'comision-cripto': 'Comisión cripto',
  'ahorro-en-dolares': 'Ahorro en dólares',
};

// Returns cleaned params, or null when invalid. Nothing free-form reaches an email except the
// calculator summary, which is capped, stripped to plain text and only sent after confirming.
export function validParams(topic, p) {
  if (topic === 'btc-bracket') {
    const width = Number(p.width);
    return [3000, 5000, 10000, 15000].includes(width) ? { width } : null;
  }
  if (topic === 'dolar-gap') {
    const threshold = Number(p.threshold);
    if (!['VE', 'AR', 'CO'].includes(p.country) || !(threshold >= 1 && threshold <= 200)) return null;
    return { country: p.country, threshold: Math.round(threshold * 10) / 10 };
  }
  if (topic === 'calc-result') {
    if (!CALCS[p.calc]) return null;
    const summary = String(p.summary || '').replace(/[<>]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 280);
    if (!summary) return null;
    return { calc: p.calc, calcName: CALCS[p.calc], path: '/' + p.calc + '/', summary };
  }
  return {};
}

export const bracketOf = (price, width) => Math.floor(price / width);
export const fmtUsd = (n) => '$' + Math.round(n).toLocaleString('en-US');
// Alert only on a real crossing, never on the first reading.
export const gapCrossed = (prev, above) => !!prev && prev.above !== above;
