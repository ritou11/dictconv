/* eslint-disable no-fallthrough */
import fs from 'fs';
import _ from 'lodash';
import ProgressBar from 'progress';
import { html2text, cleanXml } from './utils.js';
import { xdxfTransform } from './xdxf.js';

const convertDictData = (buffer, type) => {
  let text;
  switch (type) {
    case 'h': // HTML
      text = html2text(buffer.toString());
      return _.map(text.split('\n'), (par) => `<p class="plaintext">${cleanXml(par)}</p>`).join('\n');
    case 'g': // Pango text markup language
      text = buffer.toString();
      return `<pre>${text}</pre>`;
    case 'x': // xdxf language
      text = buffer.toString();
      return xdxfTransform(text);
      // return `<pre>${text}</pre>`;
    case 't': // English phonetic string.
    // Legacy formats is not supported:
    case 'y': // Chinese YinBiao or Japanese KANA.
    case 'k': // KingSoft PowerWord's data; xml;
    case 'w': // MediaWiki markup language
    case 'n': // WordNet data
    case 'l': // local encoding
    default:
      text = buffer.toString();
      return _.map(text.split('\n'), (par) => `<p class="plaintext">${cleanXml(par)}</p>`).join('\n');
  }
};

const parseDictData = (buffer, types) => {
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
    const tps = types.split();
    let pos = 0;
    for (let i = 0; i < tps.length; i += 1) {
      while (pos < buffer.length) {
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
              pos = buffer.length;
              // discard all remaining data
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
    const dt = fs.readFileSync(dictFile);
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
