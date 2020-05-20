import path from 'path';
import { spawn } from 'child_process';
import { mkTmpdir } from './utils.js';

const buildDictionary = (name, xmlFile, cssFile, plistFile, options) => {
  const destPath = options.destPath ? path.resolve(options.destPath) : mkTmpdir('build');
  return new Promise((resolve) => {
    const bin = path.resolve(__dirname, '../bin/build_dict.sh');
    const builder = spawn(bin, [name, xmlFile, cssFile, plistFile], {
      env: {
        DICT_DEV_KIT_OBJ_DIR: destPath,
        LANG: 'en_US.UTF-8',
      },
    });
    builder.stdout.on('data', (data) => options.verbose && process.stdout.write(`builder ${data}`));
    builder.on('close', () => {
      resolve(path.join(destPath, `${name}.dictionary`));
    });
  });
};

export { buildDictionary };
