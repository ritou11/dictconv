import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { mkTmpdir } from './utils.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDictionary = (name, xmlFile, cssFile, plistFile, options) => {
  const destPath = options.destPath ? path.resolve(options.destPath, `_dict_${name}/`) : mkTmpdir('build');
  try {
    fs.mkdirSync(destPath, {
      recursive: true,
    });
  } catch (e) {
    console.error(e);
    return undefined;
  }
  return new Promise((resolve, reject) => {
    const bin = path.resolve(__dirname, '../bin/build_dict.sh');
    const builder = spawn(bin, [name, xmlFile, cssFile, plistFile], {
      env: {
        DICT_DEV_KIT_OBJ_DIR: destPath,
        LANG: 'en_US.UTF-8',
      },
    });
    let stderr = '';
    builder.stdout.on('data', (data) => options.verbose && process.stdout.write(`builder ${data}`));
    builder.stderr.on('data', (data) => {
      stderr += data.toString();
      options.verbose && process.stderr.write(`builder error: ${data}`);
    });
    builder.on('close', (code) => {
      const dictPath = path.join(destPath, `${name}.dictionary`);
      if (code !== 0) {
        reject(new Error(`Dictionary build failed with exit code ${code}. Error: ${stderr}`));
        return;
      }
      if (!fs.existsSync(dictPath)) {
        reject(new Error(`Dictionary build reported success but ${dictPath} was not created. Error: ${stderr}`));
        return;
      }
      resolve(dictPath);
    });
  });
};

export { buildDictionary };
