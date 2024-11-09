import path from 'path';
import fs from 'fs';
import yargRoot from 'yargs';
import { spawnSync } from 'child_process';
import { fromArchive, fromIfo } from './lib/raw.js';
import { buildDictionary } from './lib/build.js';
import { mkTmpdir } from './lib/utils.js';

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
      const dict = await buildDictionary(name, xmlFile, cssFile, plistFile, {
        destPath: argv.destPath,
        verbose: argv.verbose,
      });
      console.log('Built', dict);
      if (argv.install) {
        const result = spawnSync('cp', ['-r', dict, '~/Library/Dictionaries/'], {
          stdio: 'inherit',
        });
      
        if (result.status !== 0) {
          console.error('Error moving dictionary to target folder:', result.stderr?.toString() || 'Unknown error');
          return;
        }
        console.log('Installed to ~/Library/Dictionaries/');
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
      const dict = await buildDictionary(name, xmlFile, cssFile, plistFile, {
        destPath: argv.destPath,
        verbose: argv.verbose,
      });
      console.log('Built', dict);
      if (argv.install) {
        const result = spawnSync('cp', ['-r', dict, '~/Library/Dictionaries/'], {
          stdio: 'inherit',
        });
      
        if (result.status !== 0) {
          console.error('Error moving dictionary to target folder:', result.stderr?.toString() || 'Unknown error');
          return;
        }
        console.log('Installed to ~/Library/Dictionaries/');
      }
    })
  .help()
  .alias('h', 'help')
  .parse;
