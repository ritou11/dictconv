const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { execSync } = require('child_process');
const ProgressBar = require('progress');
const { mkTmpdir, loadStaticFile, cleanXml } = require('./utils');
const Dictionary = require('./dict');

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
  console.log('Loading dictionary...');
  const dict = new Dictionary(`${barename}.ifo`, `${barename}.idx`, `${barename}.dict`);
  console.log(dict.ifo);

  const bar = new ProgressBar('converting [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: dict.data.length,
  });

  const strEntries = _.map(dict.data, (entry) => {
    bar.tick(1);
    return `<d:entry id="${entry.id}" d:title="${cleanXml(entry.index)}">
    <d:index d:value="${cleanXml(entry.index)}"/>
    <h1>${cleanXml(entry.index)}</h1>
    <div>
    ${_.map(entry.dat, (dt) => _.map(dt.text.split('\n'), (par) => `<p>${cleanXml(par)}</p>`).join('')).join('')}
    </div>
  </d:entry>`;
  });
  console.log('Saving...');
  fs.writeFileSync(path.join(destDir, 'Dictionary.xml'), `<?xml version="1.0" encoding="UTF-8"?>
  <d:dictionary xmlns="http://www.w3.org/1999/xhtml" xmlns:d="http://www.apple.com/DTDs/DictionaryService-1.0.rng">
  ${strEntries.join('\n')}
  </d:dictionary>
  `);

  console.log('Copy assets...');
  const dictinfo = loadStaticFile('templates/DictInfo.plist');
  fs.writeFileSync(path.join(destDir, 'DictInfo.plist'), _.template(dictinfo)({
    dictName: dict.ifo.bookname,
    dictID,
  }));

  const cssFile = path.resolve(__dirname, '../templates/Dictionary.css');
  fs.copyFileSync(cssFile, path.join(destDir, 'Dictionary.css'));
  return destDir;
};

exports.fromIfo = (ifoFile, destPath) => {
  const fname = ifoFile.split(path.sep).slice(-1).pop();
  const dictID = fname.endsWith('.ifo') ? fname.slice(0, -4) : fname;
  const dictdir = path.dirname(ifoFile);
  const barename = path.join(dictdir, dictID);

  const idxFile = `${barename}.idx`;
  if (!fs.existsSync(idxFile)) {
    console.error(`Cannot find ${dictID}.idx`);
    return undefined;
  }

  try {
    execSync(`gunzip -f -S .dz ${barename}.dict.dz`);
  } catch (e) {
    console.error(e);
    return undefined;
  }
  console.log(`Unarchived ${dictID}.dict.dz`);
  const dictFile = `${barename}.dict`;
  if (!fs.existsSync(dictFile)) {
    console.error(`Cannot find ${dictID}.dict`);
    return undefined;
  }
  // if (fs.exists(path.join(dictdir, `${dictID}.idx.gz`)))
  return convert(dictdir, dictID, destPath);
};

exports.fromArchive = (filename, destPath) => {
  const tmpdir = mkTmpdir('archive');
  if (tmpdir === undefined) {
    return undefined;
  }
  console.log(`Tmpdir created at ${tmpdir}`);
  const cmd = `tar -xjf ${filename} -C ${tmpdir}`;
  try {
    execSync(cmd);
  } catch (e) {
    console.error(e);
    return undefined;
  }
  const dictdir = path.join(tmpdir, fs.readdirSync(tmpdir)[0]);
  const filecontents = fs.readdirSync(dictdir);
  const ifoFiles = _.filter(filecontents, (fc) => path.extname(fc) === '.ifo');
  if (ifoFiles.length === 0) {
    console.error('Cannot find .ifo files!');
    return undefined;
  }
  return exports.fromIfo(path.join(dictdir, ifoFiles[0]), destPath);
  // const converted = [];
  // _.forEach(ifoFiles, (ifo) => {
  //   converted.push();
  // });
  // const success = _.filter(converted);
  // if (success.length === 0) {
  //   console.error('Converted none!');
  //   return undefined;
  // }
  // console.log(`Successfully converted ${success.length} file(s).`);
  // return true;
};
