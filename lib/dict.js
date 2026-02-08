/* eslint-disable no-fallthrough */
import fs from 'fs';
import zlib from 'zlib';
import _ from 'lodash';
import ProgressBar from 'progress';
import { html2text, cleanXml, convertHtmlContent } from './utils.js';
import { xdxfTransform } from './xdxf.js';

// Parse PowerWord XML format and convert to HTML
// Supports both English-Chinese (EC) and Chinese-English (CE) formats
export const parsePowerWord = (xml) => {
  // Remove CDATA tags and extract content
  const cleanCdata = (str) => str.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');

  // Process &L{...} syntax - returns array of definitions
  const processLTags = (str) => {
    const matches = [];
    const regex = /&L\{(.*?)\}/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  // Process &x{...} syntax - just extract the content
  const processXTag = (str) => str.replace(/&x\{(.*?)\}/g, '$1');

  // Extract text content from a tag
  const extractTag = (str, tag) => {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs');
    const matches = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
      matches.push(cleanCdata(match[1]));
    }
    return matches;
  };

  // Parse the JS (entry) blocks
  const entries = [];
  const jsRegex = /<JS>(.*?)<\/JS>/gs;
  let jsMatch;

  while ((jsMatch = jsRegex.exec(xml)) !== null) {
    const entryXml = jsMatch[1];

    // Get phonetics: try CB first (English-Chinese), then PY (Chinese-English)
    const ybMatches = entryXml.match(/<YB>(.*?)<\/YB>/gs) || [];
    let phonetics = [];
    for (const yb of ybMatches) {
      // CB = English phonetic (EC dictionary)
      const cbMatches = extractTag(yb, 'CB');
      phonetics.push(...cbMatches);
      // PY = Pinyin (CE dictionary)
      const pyMatches = extractTag(yb, 'PY');
      phonetics.push(...pyMatches.map((p) => processXTag(p)));
    }

    // Get part of speech (EC dictionary only)
    const dxMatches = extractTag(entryXml, 'DX');

    // Get definitions from JX tags
    const jxMatches = extractTag(entryXml, 'JX');

    // Build HTML for this entry
    let html = '<div class="powerword-entry">\n';

    // Phonetics
    if (phonetics.length > 0) {
      const validPhonetics = phonetics.filter((p) => p.trim());
      if (validPhonetics.length > 0) {
        html += `  <span class="phonetic">${validPhonetics.map((p) => `[${cleanXml(p)}]`).join(' ')}</span>\n`;
      }
    }

    // Process definitions
    // EC dictionary: plain text definitions with part of speech
    // CE dictionary: &L{...} wrapped definitions
    let posIndex = 0;
    for (let i = 0; i < jxMatches.length; i++) {
      const jxContent = jxMatches[i];

      // Check if this is CE format with &L{...} syntax
      const lDefinitions = processLTags(jxContent);

      if (lDefinitions.length > 0) {
        // CE dictionary format: &L{def1}&L{def2}...
        for (const def of lDefinitions) {
          if (def.trim()) {
            html += `  <p class="definition">${cleanXml(def)}</p>\n`;
          }
        }
      } else {
        // EC dictionary format: plain text with optional part of speech
        const def = jxContent.trim();
        if (!def) continue;

        const pos = dxMatches[posIndex] || '';
        if (pos && (i === 0 || !jxMatches[i - 1].trim())) {
          html += `  <p class="definition"><span class="pos">${cleanXml(pos)}</span> ${cleanXml(def)}</p>\n`;
          posIndex++;
        } else {
          html += `  <p class="definition">${cleanXml(def)}</p>\n`;
        }
      }
    }

    html += '</div>';
    entries.push(html);
  }

  return entries.join('\n');
};

export const convertDictData = (buffer, type) => {
  let text;
  switch (type) {
    case 'h': // HTML
      // Preserve HTML formatting with proper handling of Chinese ruby notation
      return convertHtmlContent(buffer.toString());
    case 'g': // Pango text markup language
      text = buffer.toString();
      return `<pre>${text}</pre>`;
    case 'x': // xdxf language
      text = buffer.toString();
      return xdxfTransform(`<co>${text}</co>`);
      // return `<pre>${text}</pre>`;
    case 'k': // KingSoft PowerWord's data; xml;
      return parsePowerWord(buffer.toString('utf8'));
    case 't': // English phonetic string.
    // Legacy formats is not supported:
    case 'y': // Chinese YinBiao or Japanese KANA.
    case 'w': // MediaWiki markup language
    case 'n': // WordNet data
    case 'l': // local encoding
    default:
      text = buffer.toString();
      return _.map(text.split('\n'), (par) => `<p class="plaintext">${cleanXml(par)}</p>`).join('\n');
  }
};

export const parseDictData = (buffer, types) => {
  const res = [];
  if (!types || types.length === 0) {
    let pos = 0;
    while (pos < buffer.length) {
      const type = buffer.toString('ascii', pos, pos + 1);
      pos += 1;
      let l = 0;
      switch (type) {
        case 'W':
        case 'P':
        case 'X':
          l = buffer.readUInt32BE(pos);
          pos += 4 + l;
          res.push({
            type,
            xml: '<p class="error"> dictconv: Media file is not supported. </p>',
          });
          break;
        case 'r':
          while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
          res.push({
            type,
            xml: '<p class="error"> dictconv: Resource file is not supported. </p>',
          });
          break;
        default:
          while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
          res.push({
            type,
            xml: convertDictData(buffer.slice(pos, pos + l), type),
          });
      }
      pos += l + 1;
    }
  } else {
    const tps = types.split('');
    let pos = 0;
    for (let i = 0; i < tps.length; i += 1) {
      const type = tps[i];
      let l = 0;
      switch (type) {
        case 'W':
        case 'P':
        case 'X':
          if (i < tps.length - 1) {
            l = buffer.readUInt32BE(pos);
            pos += 4 + l;
          } else {
            l = buffer.length - pos;
            pos = buffer.length;
          }
          res.push({
            type,
            xml: '<p class="error"> dictconv: Media file is not supported. </p>',
          });
          break;
        case 'r':
          while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
          res.push({
            type,
            xml: '<p class="error"> dictconv: Resource file is not supported. </p>',
          });
          pos += l + 1;
          break;
        default:
          // For single-type sequence (like 'k', 'h', 'm'), the entire buffer is one entry
          // Use the full remaining buffer length instead of looking for null terminator
          if (tps.length === 1) {
            l = buffer.length - pos;
          } else {
            while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
          }
          res.push({
            type,
            xml: convertDictData(buffer.slice(pos, pos + l), type),
          });
          pos += l + (tps.length === 1 ? 0 : 1);
      }
    }
  }
  return res;
};

class Dictionary {
  constructor(ifoFile, idxFile, dictFile, resFile) {
    this.loadIfo(ifoFile);
    this.loadIdx(idxFile);
    this.loadDict(dictFile);
    if (resFile) {
      this.loadRes(resFile);
    }
  }

  loadIfo(ifoFile) {
    const lines = fs.readFileSync(ifoFile, 'utf8');
    const res = _.reduce(lines.match(/^.+=.+$/gm), (acc, line) => {
      const grp = line.match(/^(?<name>.+)=(?<value>.+)$/).groups;
      return { ...acc, [grp.name]: grp.value };
    }, {});
    res.wordcount = res.wordcount && parseInt(res.wordcount, 10);
    res.idxfilesize = res.idxfilesize && parseInt(res.idxfilesize, 10);
    this.ifo = res;
  }

  loadIdx(idxFile) {
    const { wordcount } = this.ifo;
    const filesize = this.ifo.idxfilesize;
    const buffer = fs.readFileSync(idxFile);
    if (buffer.length !== filesize) {
      console.warn(`Index file size ${buffer.length} doesn't meet ${filesize} in .ifo`);
    }
    let pos = 0;
    const entries = [];
    for (let i = 0; i < wordcount; i += 1) {
      let l = 1;
      while (buffer[pos + l] !== 0 && pos + l < buffer.length) l += 1;
      entries.push({
        id: i,
        index: buffer.slice(pos, pos + l).toString(), // TODO index may duplicate
        offset: buffer.readUInt32BE(pos + l + 1), // TODO
        // If the version is "3.0.0" and "idxoffsetbits=64", word_data_offset will
        // be 64-bits unsigned number in network byte order. Otherwise it will be
        // 32-bits.
        size: buffer.readUInt32BE(pos + l + 1 + 4),
      });
      pos += l + 1 + 2 * 4;
    }
    // this.idx = entries.slice(0, 100);
    this.idx = entries;
  }

  loadDict(dictFile) {
    const bar = new ProgressBar('Loading dictionary [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: this.idx.length,
    });
    console.log(`Total length of entries: ${this.idx.length}`);
    const fileData = fs.readFileSync(dictFile);

    // Check if file is gzip compressed (.dict.dz)
    let dt;
    if (fileData.length >= 2 && fileData[0] === 0x1f && fileData[1] === 0x8b) {
      console.log('Decompressing gzip dictionary file...');
      dt = zlib.gunzipSync(fileData);
    } else {
      dt = fileData;
    }

    this.data = _.map(this.idx, (o) => {
      bar.tick(1);
      const dat = parseDictData(dt.slice(o.offset, o.offset + o.size), this.ifo.sametypesequence);
      return {
        ...o,
        xml: _.map(dat, 'xml').join('\n'),
      };
    });
  }

  loadRes(resFile) {
    console.log('TODO', resFile, this.ifo);
  }
}

export default Dictionary;
