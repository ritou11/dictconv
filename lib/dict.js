const fs = require('fs');
const _ = require('lodash');

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
      dat: dt.slice(o.offset, o.offset + o.size).toString(),
    }));
  }

  loadRes(resFile) {
    console.log('TODO', resFile, this.ifo);
  }
}

module.exports = Dictionary;
