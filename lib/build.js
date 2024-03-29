import path from 'path';
import { spawn } from 'child_process';
import { mkTmpdir } from './utils.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDictionary = (name, xmlFile, cssFile, plistFile, options) => {
  const destPath = options.destPath ? path.resolve(options.destPath, `_dict_${name}/`) : mkTmpdir('build');
  try {
    fs.mkdirSync(tmpdir, {
      recursive: true,
    });
  } catch (e) {
    console.error(e);
    return undefined;
  }
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
