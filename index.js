const path = require('path');
// const fs = require('fs');
const yargRoot = require('yargs');
const { fromArchive, fromIfo } = require('./lib/raw');

module.exports = yargRoot
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
        .option('install', {
          alias: 'i',
          describe: 'Install the converted dictionary to the system',
          default: false,
          type: 'boolean',
        });
    },
    (argv) => {
      if (!argv.install && !argv.destPath) {
        console.error('Please provide destination path or --install.');
        return;
      }
      console.log(argv);
    })
  .help()
  .alias('h', 'help')
  .parse;
