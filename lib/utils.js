const os = require('os');
const fs = require('fs');
const path = require('path');

exports.mkTmpdir = (label = Date.now()) => {
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

exports.loadStaticFile = (filename) => {
  const fn = path.resolve(__dirname, '..', filename);
  return fs.readFileSync(fn, 'utf8');
};
