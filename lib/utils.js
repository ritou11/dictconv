import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mkTmpdir = (label = Date.now()) => {
  const tmpdir = path.join(os.tmpdir(), 'dictconv/', label.toString());
  try {
    fs.mkdirSync(tmpdir, {
      recursive: true,
    });
  } catch (e) {
    console.error(e);
    return undefined;
  }
  return tmpdir;
};

const loadStaticFile = (filename) => {
  const fn = path.resolve(__dirname, '..', filename);
  return fs.readFileSync(fn, 'utf8');
};

// Tags supported by Apple Dictionary format (block elements handled separately)
const ALLOWED_TAGS = new Set([
  'a', 'b', 'br', 'em', 'font', 'i', 'img', 'span',
  'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u',
  'ruby', 'rp', 'rt', // Ruby text for Chinese/Japanese pronunciation
]);

const html2text = (html) => {
  let text = html;
  // Remove potentially harmful tags and their content
  text = text.replace(/<script([\s\S]*?)<\/script>/gi, '');
  text = text.replace(/<style([\s\S]*?)<\/style>/gi, '');
  text = text.replace(/<iframe([\s\S]*?)<\/iframe>/gi, '');
  text = text.replace(/<object([\s\S]*?)<\/object>/gi, '');
  text = text.replace(/<embed([\s\S]*?)<\/embed>/gi, '');

  // Convert block-level elements to newlines for readability
  text = text.replace(/<\/?div>/ig, '\n');
  text = text.replace(/<\/?p>/ig, '\n');
  text = text.replace(/<li>/ig, '  *  ');
  text = text.replace(/<\/li>/ig, '\n');
  text = text.replace(/<\/?ul>/ig, '\n');
  text = text.replace(/<\/?ol>/ig, '\n');
  text = text.replace(/<br\s*[/?]>/gi, '\n');

  // Remove disallowed tags but keep their content
  text = text.replace(/<\/?([a-z][a-z0-9]*)[^>]*>/gi, (match, tag) => {
    const lowerTag = tag.toLowerCase();
    if (ALLOWED_TAGS.has(lowerTag)) {
      return match; // Keep allowed tags
    }
    return ''; // Remove disallowed tags
  });

  return text;
};

// Process Chinese dictionary backtick notation: `1`字`2`pronunciation
// Converts to: <ruby>字<rt>pronunciation</rt></ruby>
const processRubyNotation = (text) => {
  // Match pattern: `number`character`number`pronunciation
  // The numbers appear to be markers, we extract character and pronunciation
  return text.replace(/`\d+`([^`\s])`\d+`([^`\s<]+)/g, '<ruby>$1<rt>$2</rt></ruby>');
};

// Void elements that must be self-closed in XHTML
const VOID_ELEMENTS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);

// Convert HTML to valid XHTML for XML compatibility
const htmlToXhtml = (html) => {
  return html.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (VOID_ELEMENTS.has(lowerTag)) {
      // Self-close void elements
      const trimmedAttrs = attrs.trim();
      return trimmedAttrs ? `<${lowerTag} ${trimmedAttrs} />` : `<${lowerTag} />`;
    }
    return match;
  });
};

// Convert HTML content for dictionary display
// Preserves allowed HTML tags and converts Chinese ruby notation
const convertHtmlContent = (html) => {
  let text = html;

  // Remove potentially harmful tags and their content
  text = text.replace(/<script([\s\S]*?)<\/script>/gi, '');
  text = text.replace(/<style([\s\S]*?)<\/style>/gi, '');
  text = text.replace(/<iframe([\s\S]*?)<\/iframe>/gi, '');
  text = text.replace(/<object([\s\S]*?)<\/object>/gi, '');
  text = text.replace(/<embed([\s\S]*?)<\/embed>/gi, '');

  // Process Chinese ruby notation before handling HTML
  text = processRubyNotation(text);

  // Keep allowed tags, remove others but keep content
  text = text.replace(/<\/?([a-z][a-z0-9]*)[^>]*>/gi, (match, tag) => {
    const lowerTag = tag.toLowerCase();
    if (ALLOWED_TAGS.has(lowerTag)) {
      return match; // Keep allowed tags
    }
    return ''; // Remove disallowed tags
  });

  // Convert to valid XHTML (self-close void elements)
  text = htmlToXhtml(text);

  return text;
};

// eslint-disable-next-line no-control-regex
const NOT_SAFE_IN_XML_1_0 = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;
const cleanXml = (xml) => xml
  .replace(NOT_SAFE_IN_XML_1_0, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export {
  mkTmpdir,
  loadStaticFile,
  html2text,
  convertHtmlContent,
  cleanXml,
};
