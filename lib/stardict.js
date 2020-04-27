const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { execSync } = require('child_process');
const xml = require('xmlbuilder2');
const { mkTmpdir, loadStaticFile } = require('./utils');

const loadIfo = (ifoFile) => {
  const lines = fs.readFileSync(ifoFile, 'utf8');
  const res = _.reduce(lines.match(/^.+=.+$/gm), (acc, line) => {
    const grp = line.match(/^(?<name>.+)=(?<value>.+)$/).groups;
    return { ...acc, [grp.name]: grp.value };
  }, {});
  return res;
};

const loadIdx = (idxFile, wordcount, filesize) => {
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
      index: buffer.slice(pos, pos + l).toString(),
      offset: buffer.readUInt32BE(pos + l + 1),
      size: buffer.readUInt32BE(pos + l + 1 + 4),
    });
    pos += l + 1 + 2 * 4;
  }
  return entries;
};

const convert = (dictdir, dictID, destPath) => {
  const destDir = path.join(destPath, `mac-${dictID}`);
  try {
    fs.mkdirSync(destDir, {
      recursive: true,
    });
  } catch (e) {
    console.error(e);
    return undefined;
  }
  const barename = path.join(dictdir, dictID);
  const ifo = loadIfo(`${barename}.ifo`);
  console.log(ifo);
  const idx = loadIdx(`${barename}.idx`, parseInt(ifo.wordcount, 10), parseInt(ifo.idxfilesize, 10));
  const nd = xml.create({
    version: '1.0',
    encoding: 'UTF-8',
  }).ele('d:dictionary', {
    xmlns: 'http://www.w3.org/1999/xhtml',
    'xmlns:d': 'http://www.apple.com/DTDs/DictionaryService-1.0.rng',
  });
  _.forEach(idx, (entry) => {
    const node = nd.ele('d:entry', {
      id: entry.id,
      'd:title': entry.index,
    });
    node.ele('d:index', { 'd:value': entry.index });
    node.ele('h1').txt(entry.index);
    node.ele('p', { class: 'error' }).txt('Format not supported yet.');
  });
  fs.writeFileSync(path.join(destDir, 'Dictionary.xml'), nd.end({ prettyPrint: true }));

  const dictinfo = loadStaticFile('templates/DictInfo.plist');
  fs.writeFileSync(path.join(destDir, 'DictInfo.plist'), _.template(dictinfo)({
    dictName: ifo.bookname,
    dictID,
  }));
  return true;
};

exports.fromIfo = (ifoFile, destPath) => {
  const fname = ifoFile.split(path.sep).slice(-1).pop();
  const dictID = fname.endsWith('.ifo') ? fname.slice(0, -4) : fname;
  const dictdir = path.dirname(ifoFile);
  const barename = path.join(dictdir, dictID);

  const idxFile = `${barename}.idx`;
  if (!fs.existsSync(idxFile)) {
    console.error(`Cannot find ${dictID}.idx`);
    return false;
  }

  try {
    execSync(`gunzip -f -S .dz ${barename}.dict.dz`);
  } catch (e) {
    console.error(e);
    return false;
  }
  console.log(`Unarchived ${dictID}.dict.dz`);
  const dictFile = `${barename}.dict`;
  if (!fs.existsSync(dictFile)) {
    console.error(`Cannot find ${dictID}.dict`);
    return false;
  }
  // if (fs.exists(path.join(dictdir, `${dictID}.idx.gz`)))
  return convert(dictdir, dictID, destPath);
};

exports.fromArchive = (filename, destPath) => {
  const tmpdir = mkTmpdir(2);
  if (tmpdir === undefined) {
    return false;
  }
  console.log(`Tmpdir created at ${tmpdir}`);
  const cmd = `tar -xjf ${filename} -C ${tmpdir}`;
  try {
    execSync(cmd);
  } catch (e) {
    console.error(e);
    return false;
  }
  const dictdir = path.join(tmpdir, fs.readdirSync(tmpdir)[0]);
  const filecontents = fs.readdirSync(dictdir);
  const ifoFiles = _.filter(filecontents, (fc) => path.extname(fc) === '.ifo');
  if (ifoFiles.length === 0) {
    console.error('Cannot find .ifo files!');
    return false;
  }
  let success = 0;
  _.forEach(ifoFiles, (ifo) => {
    success += exports.fromIfo(path.join(dictdir, ifo), destPath);
  });
  if (success === 0) {
    console.error('Converted none!');
    return false;
  }
  console.log(`Successfully converted ${success} file(s).`);
  return true;
};
