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
  return fs.readFileSync(filename, 'utf8');
};
