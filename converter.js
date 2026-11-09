'use strict';

const MASK_BOUNDARY = '\u0000';

/**
 * Maskuje komentarze i literały tekstowe spacjami, zachowując długość tekstu
 * oraz znaki końca linii. Dzięki temu indeksy dopasowań pozostają zgodne
 * z oryginalnym dokumentem, a wartości w komentarzach/stringach nie są zmieniane.
 */
function maskNonCode(text, languageId = '') {
  const chars = text.split('');
  const isLineCommentLanguage = new Set([
    'scss', 'less', 'javascript', 'javascriptreact', 'typescript',
    'typescriptreact', 'vue', 'svelte', 'php'
  ]).has(languageId);
  const isHtmlLike = new Set([
    'html', 'xml', 'vue', 'svelte', 'javascriptreact', 'typescriptreact', 'php'
  ]).has(languageId);

  const blank = (start, end) => {
    for (let k = start; k < end; k += 1) {
      if (chars[k] !== '\n' && chars[k] !== '\r') chars[k] = ' ';
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    // Komentarze HTML.
    if (ch === '<' && text.startsWith('<!--', i)) {
      const close = text.indexOf('-->', i + 4);
      const end = close === -1 ? text.length : close + 3;
      blank(i, end);
      i = end;
      continue;
    }

    // Komentarze blokowe CSS/JS.
    if (ch === '/' && next === '*') {
      const close = text.indexOf('*/', i + 2);
      const end = close === -1 ? text.length : close + 2;
      blank(i, end);
      i = end;
      continue;
    }

    // Komentarze liniowe SCSS/LESS/JS/TS i popularnych plików komponentów.
    if (isLineCommentLanguage && ch === '/' && next === '/') {
      let end = i + 2;
      while (end < text.length && text[end] !== '\n' && text[end] !== '\r') end += 1;
      blank(i, end);
      i = end;
      continue;
    }

    // Atrybut style w HTML: analizujemy jego zawartość jak CSS, ale nadal
    // pomijamy teksty/komentarze znajdujące się wewnątrz samego CSS.
    if ((ch === "'" || ch === '"') && isHtmlLike && /(?:^|[\s<])style\s*=\s*$/i.test(text.slice(Math.max(0, i - 32), i))) {
      const quote = ch;
      const start = i;
      let close = i + 1;
      while (close < text.length) {
        if (text[close] === '\\') {
          close += 2;
          continue;
        }
        if (text[close] === quote) break;
        close += 1;
      }
      const contentEnd = Math.min(close, text.length);
      const inner = text.slice(start + 1, contentEnd);
      const maskedInner = maskNonCode(inner, 'css').split('');
      for (let k = 0; k < maskedInner.length; k += 1) chars[start + 1 + k] = maskedInner[k];
      chars[start] = MASK_BOUNDARY;
      if (close < text.length) chars[close] = MASK_BOUNDARY;
      i = close < text.length ? close + 1 : text.length;
      continue;
    }

    // Łańcuchy znaków: apostrofy, cudzysłowy i backticki.
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      const start = i;
      i += 1;
      while (i < text.length) {
        if (text[i] === '\\') {
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      blank(start, Math.min(i, text.length));
      continue;
    }

    i += 1;
  }

  return chars.join('');
}

function formatNumber(value, precision) {
  const factor = 10 ** precision;
  let rounded = Math.round((value + Math.sign(value || 1) * Number.EPSILON) * factor) / factor;
  if (Object.is(rounded, -0) || Math.abs(rounded) < 0.5 / factor) rounded = 0;

  if (precision === 0) return String(rounded);
  return rounded.toFixed(precision).replace(/\.?0+$/, '');
}

function normalizeProperties(properties) {
  if (!Array.isArray(properties)) return [];
  return [...new Set(properties
    .filter((property) => typeof property === 'string')
    .map((property) => property.trim().toLowerCase())
    .filter((property) => /^--[\w-]+$|^[a-z][\w-]*$/.test(property))
  )];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Zwraca zakresy wartości deklaracji CSS dla wskazanych właściwości.
 * Dopasowanie właściwości jest dokładne: np. "margin" nie obejmuje
 * "margin-top". Dla HTML/Vue/Svelte obsługiwany jest też atrybut style="...".
 */
function getPropertyRanges(text, properties, languageId = '') {
  const normalized = normalizeProperties(properties);
  if (normalized.length === 0) return [];

  const masked = maskNonCode(text, languageId);
  const alternatives = normalized.sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
  const isHtmlLike = new Set([
    'html', 'xml', 'vue', 'svelte', 'javascriptreact', 'typescriptreact', 'php'
  ]).has(languageId);
  // Specjalny separator oznacza początek/koniec zawartości atrybutu style.
  const boundary = isHtmlLike ? '[;{}\\x00]' : '[;{}]';
  const declarationRegex = new RegExp(`(?:^|${boundary})\\s*(${alternatives})\\s*:`, 'gim');
  const ranges = [];
  let match;

  while ((match = declarationRegex.exec(masked)) !== null) {
    const valueStart = declarationRegex.lastIndex;
    let valueEnd = text.length;

    for (const delimiter of [';', '}', ...(isHtmlLike ? [MASK_BOUNDARY, '>'] : [])]) {
      const index = masked.indexOf(delimiter, valueStart);
      if (index !== -1 && index < valueEnd) valueEnd = index;
    }

    ranges.push({ start: valueStart, end: valueEnd, property: match[1].toLowerCase() });
    // Zapobiega ponownemu wyszukiwaniu tej samej deklaracji w jej wartości.
    declarationRegex.lastIndex = Math.max(declarationRegex.lastIndex, valueStart);
  }

  return ranges;
}

function getMatches(text, direction, languageId = '', properties = null) {
  const masked = maskNonCode(text, languageId);
  const unit = direction === 'pxToRem' ? 'px' : 'rem';
  const regex = new RegExp(`(?<![\\w.-])(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+))(${unit})\\b`, 'gi');
  const matches = [];
  let match;

  while ((match = regex.exec(masked)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      number: match[1],
      unit: match[2],
      raw: match[0]
    });
  }

  if (properties === null) return matches;
  const ranges = getPropertyRanges(text, properties, languageId);
  return matches.filter((item) => ranges.some((range) => item.start >= range.start && item.end <= range.end));
}

function convertMatch(match, direction, rootFontSize, precision) {
  const input = Number(match.number);
  const output = direction === 'pxToRem'
    ? input / rootFontSize
    : input * rootFontSize;
  const outputUnit = direction === 'pxToRem' ? 'rem' : 'px';
  return `${formatNumber(output, precision)}${outputUnit}`;
}

/** Konwertuje dopasowania całkowicie mieszczące się w podanym zakresie. */
function convertRange(
  text,
  direction,
  options = {},
  range = { start: 0, end: text.length },
  languageId = '',
  properties = null
) {
  const rootFontSize = Number(options.rootFontSize) > 0 ? Number(options.rootFontSize) : 16;
  const precision = Number.isInteger(options.precision)
    ? Math.min(10, Math.max(0, options.precision))
    : 6;
  const matches = getMatches(text, direction, languageId, properties)
    .filter((item) => item.start >= range.start && item.end <= range.end);

  let result = text;
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const item = matches[i];
    const replacement = convertMatch(item, direction, rootFontSize, precision);
    result = result.slice(0, item.start) + replacement + result.slice(item.end);
  }

  return { text: result, count: matches.length, matches };
}

/** Wybiera najbliższą wartość z jednostką, ograniczoną do wskazanych właściwości. */
function findNearestMatch(text, direction, offset, languageId = '', properties = null) {
  const matches = getMatches(text, direction, languageId, properties);
  if (matches.length === 0) return null;

  const lineStart = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  const nextNewline = text.indexOf('\n', offset);
  const lineEnd = nextNewline === -1 ? text.length : nextNewline;
  const lineMatches = matches.filter((item) => item.start >= lineStart && item.end <= lineEnd);
  if (lineMatches.length === 0) return null;

  lineMatches.sort((a, b) => {
    const distance = (item) => offset < item.start
      ? item.start - offset
      : offset > item.end
        ? offset - item.end
        : 0;
    return distance(a) - distance(b);
  });

  return lineMatches[0];
}

module.exports = {
  maskNonCode,
  formatNumber,
  normalizeProperties,
  getPropertyRanges,
  getMatches,
  convertMatch,
  convertRange,
  findNearestMatch
};
