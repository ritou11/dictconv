const path = require('path');
const fs = require('fs');
const yargRoot = require('yargs');
const { fromArchive, fromIfo } = require('./lib/stardict');

module.exports = yargRoot
  .option('install', {
    alias: 'i',
    describe: 'Install the converted dictionary to the system',
    default: false,
    type: 'boolean',
  })
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
        // console.log(`${path.extname(argv.stardict)} file detected`);
        fromIfo(argv.stardict, argv.destPath);
      } else {
        fromArchive(argv.stardict, argv.destPath);
      }
    })
  .command('$0 <stardict> <destPath>', 'Convert the startdict to MacOSX dictionary.',
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
      console.log(argv);
    })
  .help()
  .alias('h', 'help')
  .parse;
