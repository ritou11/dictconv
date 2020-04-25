const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { execSync } = require('child_process');
const { mkTmpdir } = require('./utils');

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
  for (const i = 0; i < wordcount;) {
    let l = 1;
    while (buffer[pos + l] !== 0 && pos + l < buffer.length) l += 1;
    entries.push({
      index: buffer.slice(pos, pos + l - 1).toString(),
      offset: buffer.readUInt32BE(pos + l),
      size: buffer.readUInt32BE(pos + l + 4),
    });
  }
  return entries;
};

const convert = (ifoFile, idxFile, dictFile) => {
  const ifo = loadIfo(ifoFile);
  console.log(ifo);
  const idx = loadIdx(idxFile, ifo.wordcount, ifo.idxfilesize);
  return true;
};

exports.fromIfo = (ifoFile) => {
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
  return convert(ifoFile, idxFile, dictFile);
};

exports.fromArchive = (filename) => {
  const tmpdir = mkTmpdir(1);
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
    success += exports.fromIfo(path.join(dictdir, ifo));
  });
  if (success === 0) {
    console.error('Converted none!');
    return false;
  }
  console.log(`Successfully converted ${success} file(s).`);
  return true;
};
