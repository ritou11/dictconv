import path from 'path';
import fs from 'fs';
import yargRoot from 'yargs';
import { execSync } from 'child_process';
import { fromArchive, fromIfo } from './lib/raw.js';
import { buildDictionary } from './lib/build.js';
import { mkTmpdir } from './lib/utils.js';

// Validate destination path to prevent accidental deletion of important directories
const validateDestPath = (destPath) => {
  if (!destPath) return true;
  const resolved = path.resolve(destPath);
  const home = process.env.HOME || process.env.USERPROFILE;
  const dangerousPaths = ['/', '/home', '/Users', home, path.join(home, 'Downloads'), path.join(home, 'Documents'), path.join(home, 'Desktop'), '.', './'];
  for (const dangerous of dangerousPaths) {
    if (resolved === path.resolve(dangerous)) {
      console.error(`Error: Cannot use ${destPath} as destination. This path is too dangerous and may cause data loss.`);
      console.error('Please specify a subdirectory or a different location.');
      return false;
    }
  }
  return true;
};

export default yargRoot
  .command('raw <stardict> <destPath>', 'Convert the startdict to xml dictionary.',
    (yargs) => {
      yargs
        .positional('stardict', {
          describe: '<stardict> The path to the stardict file.',
          type: 'string',
        })
        .positional('destPath', {
          describe: '<destPath> The destination path.',
          type: 'string',
        });
    },
    (argv) => {
      if (path.extname(argv.stardict) === '.ifo') {
        fromIfo(argv.stardict, argv.destPath);
      } else {
        fromArchive(argv.stardict, argv.destPath);
      }
    })
  .command('build <rawPath> [<destPath>]', 'Build the Mac dictionary from raw data',
    (yargs) => {
      yargs
        .positional('rawPath', {
          describe: '<rawPath> The path to the raw data files.',
          type: 'string',
        })
        .option('name', {
          alias: 'n',
          describe: 'The name of dictionary',
          type: 'string',
        })
        .option('install', {
          alias: 'i',
          describe: 'Install the converted dictionary to the system',
          default: false,
          type: 'boolean',
        })
        .option('verbose', {
          alias: 'v',
          describe: 'Print all logs',
          default: false,
          type: 'boolean',
        });
    },
    async (argv) => {
      if (!validateDestPath(argv.destPath)) {
        process.exit(1);
      }
      const name = argv.name || argv.rawPath.split(path.sep).slice(-1).pop();
      const xmlFile = path.resolve(argv.rawPath, 'Dictionary.xml');
      const cssFile = path.resolve(argv.rawPath, 'Dictionary.css');
      const plistFile = path.resolve(argv.rawPath, 'DictInfo.plist');
      if (!fs.existsSync(xmlFile)) {
        console.error(`${xmlFile} not found.`);
        return;
      }
      if (!fs.existsSync(cssFile)) {
        console.error(`${cssFile} not found.`);
        return;
      }
      if (!fs.existsSync(plistFile)) {
        console.error(`${plistFile} not found.`);
        return;
      }
      try {
        const dict = await buildDictionary(name, xmlFile, cssFile, plistFile, {
          destPath: argv.destPath,
          verbose: argv.verbose,
        });
        console.log('Built', dict);
        if (argv.install) {
          execSync(`cp -r ${dict.replace(/'/g, "'\\''")} ~/Library/Dictionaries/`);
          console.log('Installed to ~/Library/Dictionaries/');
        }
      } catch (err) {
        console.error('Build failed:', err.message);
        process.exit(1);
      }
    })
  .command('convert <stardict> [<destPath>]', 'Convert the startdict to Mac dictionary.',
    (yargs) => {
      yargs
        .positional('stardict', {
          describe: '<stardict> The path to the stardict file.',
          type: 'string',
        })
        .positional('destPath', {
          describe: '<destPath> The destination path.',
          type: 'string',
        })
        .option('name', {
          alias: 'n',
          describe: 'The name of dictionary',
          type: 'string',
        })
        .option('install', {
          alias: 'i',
          describe: 'Install the converted dictionary to the system',
          default: false,
          type: 'boolean',
        })
        .option('verbose', {
          alias: 'v',
          describe: 'Print all logs',
          default: false,
          type: 'boolean',
        });
    },
    async (argv) => {
      if (!validateDestPath(argv.destPath)) {
        process.exit(1);
      }
      const rawDest = mkTmpdir('raw');
      const rawPath = path.extname(argv.stardict) === '.ifo' ? fromIfo(argv.stardict, rawDest) : fromArchive(argv.stardict, rawDest);
      console.log('Converted raw file path:', rawPath);

      const name = argv.name || rawPath.split(path.sep).slice(-1).pop();
      const xmlFile = path.resolve(rawPath, 'Dictionary.xml');
      const cssFile = path.resolve(rawPath, 'Dictionary.css');
      const plistFile = path.resolve(rawPath, 'DictInfo.plist');
      if (!fs.existsSync(xmlFile)) {
        console.error(`${xmlFile} not found.`);
        return;
      }
      if (!fs.existsSync(cssFile)) {
        console.error(`${cssFile} not found.`);
        return;
      }
      if (!fs.existsSync(plistFile)) {
        console.error(`${plistFile} not found.`);
        return;
      }
      console.log('Start building...');
      try {
        const dict = await buildDictionary(name, xmlFile, cssFile, plistFile, {
          destPath: argv.destPath,
          verbose: argv.verbose,
        });
        console.log('Built', dict);
        if (argv.install) {
          execSync(`cp -r ${dict.replace(/'/g, "'\\''")} ~/Library/Dictionaries/`);
          console.log('Installed to ~/Library/Dictionaries/');
        }
      } catch (err) {
        console.error('Build failed:', err.message);
        process.exit(1);
      }
    })
  .help()
  .alias('h', 'help')
  .parse;
