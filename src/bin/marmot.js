#!/usr/bin/env node

import 'babel-polyfill';
import program from 'commander';
import pkg from '../package.json';

import init from '../lib/init';
import * as server from '../lib/server';

program
  .usage('<command>')
  .version(pkg.version)
  .description(pkg.description)
  .on('--help', () => {
    console.log('  Examples:');
    console.log('');
    console.log('    Initialize the project:');
    console.log('    $ marmot init');
    console.log('');
    console.log('    Forced to initialize the project:');
    console.log('    $ marmot init -f');
    console.log('');
    console.log('    start the server on the port 8090:');
    console.log('    $ marmot server start -p 8090');
    console.log('');
    console.log('    stop the server:');
    console.log('    $ marmot server stop');
    console.log('');
    console.log('    list all services:');
    console.log('    $ marmot server list');
  });

// init command
program
  .command('init')
  .usage('<command> [options]')
  .description('init project')
  .option('-f, --force', 'forced to initialize WEB-INF directory of the current project')
  .action(init);

// server command
const commander = program
  .command('server')
  .usage('<command> [options]')
  .option('-p, --port [port]', 'specify the port used to start, restart, stop, delete the service (default: 8080)', parseInt)
  .option('-i, --id [id]', 'specify the service id used to start, restart, stop, delete the service', parseInt)
  .option('-a, --app [app]', 'specify the app name used to start, restart, stop, delete the service, (default: the current directory name)', /^[^/\\:*?<>|"'[\]$+&%#!~`]+$/)
  .description('a embedded jetty server')
  .action((...args) => {
    let cmd = args[args.length - 1];

    switch (args[0]) {
      case 'start':
        server.start(cmd.port, cmd.app);
        break;

      case 'stop':
        server.stop(cmd.port, cmd.app, cmd.id);
        break;

      case 'restart':
        server.restart(cmd.port, cmd.app, cmd.id);
        break;

      case 'list':
      case 'ls':
        server.list();
        break;

      case 'remove':
      case 'rm':
        server.remove(cmd.port, cmd.app, cmd.id);
        break;

      default:
        cmd.outputHelp();
    }
  });
// server sub-command
commander
  .command('start')
  .description('start a jetty service');

commander
  .command('restart')
  .description('restart a jetty service');

commander
  .command('stop')
  .description('stop a jetty service');

commander
  .command('remove')
  .alias('rm')
  .description('remove and stop the service from the services list');

commander
  .command('list')
  .alias('ls')
  .description('list of all services');

commander.command('');

program.parse(process.argv);

if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(1);
}
