const _ = require('lodash');
const os = require('os');
const path = require('path');
const fs = require('fs');
const yargRoot = require('yargs');

module.exports = yargRoot
  .option('c', {
    alias: 'config-file',
    describe: 'Json file that contains username, md5_password and other infomation.',
    default: path.join(os.homedir(), '.thunet-reg'),
    type: 'string',
  })
  .command('login [<ip>]', 'Login my current IP',
    (yargs) => {
      yargs
        .positional('ip', {
          describe: '<ip> Which IP to register.',
          type: 'string',
        });
    },
    (argv) => {
      const config = readConfig(argv);
      const ck = checkConfig(config);
      if (ck) {
        console.error(ck);
        return;
      }
      tryLogin(config);
    })
  .help()
  .parse;
