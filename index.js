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
  .help()
  .parse;
