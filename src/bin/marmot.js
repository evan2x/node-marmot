#!/usr/bin/env node

import program from 'commander';
import pkg from '../package.json';

import init from '../lib/init';
import server from '../lib/server';

program
  .usage('<command>')
  .version(pkg.version)
  .description(pkg.description);

// init sub command
program
  .command('init')
  .description('init project')
  .option('-f, --force', 'forced to redownload WEB-INF directory of the current project')
  .action(init);

// server sub command
program
  .command('server')
  .description('a tomcat server')
  .option('-p, --port [port]', 'specify the server listening [port] to start', 8080)
  .option('-s, --start', 'start the tomcat server')
  .option('-S, --stop', 'stop the tomcat server')
  .option('-r, --restart', 'restart the tomcat server')
  .option('-c, --clean', 'cleanup the tomcat server')
  .option('-l, --list', 'list of tomcat services')
  .option('-d, --delete [port]', 'delete the service by [port]')
  .action(server);

program.parse(process.argv);
