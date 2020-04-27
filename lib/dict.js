/* eslint-disable no-fallthrough */
const fs = require('fs');
const _ = require('lodash');
const { html2text } = require('./utils');

const convertDictData = (buffer, type) => {
  switch (type) {
    case 'h': // HTML
      return html2text(buffer.toString());
    case 't': // English phonetic string.
    // Legacy formats will not supported:
    case 'x': // xdxf language
    case 'y': // Chinese YinBiao or Japanese KANA.
    case 'k': // KingSoft PowerWord's data; xml;
    case 'w': // MediaWiki markup language
    case 'n': // WordNet data
    case 'g': // Pango text markup language
    case 'l': // local encoding
    default:
      return buffer.toString();
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
            text: 'dictconv: Media file is not supported.',
          });
          break;
        case 'r':
          while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
          res.push({
            type,
            text: 'dictconv: Resource file is not supported.',
          });
          break;
        default:
          while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
          res.push({
            type,
            text: convertDictData(buffer.slice(pos, pos + l), type),
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
              text: 'dictconv: Media file is not supported.',
            });
            break;
          case 'r':
            while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
            res.push({
              type,
              text: 'dictconv: Resource file is not supported.',
            });
            break;
          default:
            while (pos + l < buffer.length && buffer[pos + l] !== 0) l += 1;
            res.push({
              type,
              text: convertDictData(buffer.slice(pos, pos + l), type),
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
    const dt = fs.readFileSync(dictFile);
    this.data = _.map(this.idx, (o) => ({
      ...o,
      dat: parseDictData(dt.slice(o.offset, o.offset + o.size), this.ifo.sametypesequence),
    }));
  }

  loadRes(resFile) {
    console.log('TODO', resFile, this.ifo);
  }
}

module.exports = Dictionary;