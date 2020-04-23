const path = require('path');
const fs = require('fs');
const yargRoot = require('yargs');
const { fromArchive } = require('./lib/stardict');

module.exports = yargRoot
  .option('install', {
    alias: 'i',
    describe: 'Install the converted dictionary to the system',
    default: false,
    type: 'boolean',
  })
  .command('$0 <stardict>', 'Convert the startdict to MacOSX dictionary.',
    (yargs) => {
      yargs
        .positional('stardict', {
          describe: '<stardict> The path to the stardict file.',
          type: 'string',
        });
    },
    (argv) => {
      if (path.extname(argv.stardict) == '.ifo') {
        console.log(`${path.extname(argv.stardict)} file detected`);
      } else {
        fromArchive(argv.stardict);
      }
    })
  .help()
  .alias('h', 'help')
  .parse;
