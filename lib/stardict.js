const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { mkTmpdir } = require('./utils');

exports.fromArchive = (filename) => {
  const tmpdir = mkTmpdir();
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

  return true;
};
