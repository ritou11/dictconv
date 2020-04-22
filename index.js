const _ = require('lodash');
const os = require('os');
const path = require('path');
const fs = require('fs');
const yargRoot = require('yargs');

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
      console.log(`this command will be run by default ${argv.stardict}`)
    })
  .help()
  .alias('h', 'help')
  .parse;
