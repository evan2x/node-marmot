#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');
const init = require('../lib/init');
const server = require('../lib/server');

/**
 * extract options into a plain object.
 * @param {Object} cmd
 * @return {Object}
 */
function extractArgs(cmd) {
  const args = {};

  cmd.options.forEach((option) => {
    const key = option.long.replace(/^--/, '');

    if (typeof cmd[key] !== 'function' && cmd[key] != null) {
      args[key] = cmd[key];
    }
  });

  return args;
}

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
    console.log('    Start the webapp on the port 8090:');
    console.log('    $ marmot server start -p 8090');
    console.log('');
    console.log('    Stop the webapp:');
    console.log('    $ marmot server stop');
    console.log('');
    console.log('    List all webapp:');
    console.log('    $ marmot server list');
  });

// init command
program
  .command('init')
  .usage('<command> [options]')
  .description('init webapp')
  .option('-f, --force', 'forced to initialize WEB-INF directory of the current webapp')
  .action(init);

// server command
const commander = program
  .command('server')
  .usage('<command> [options]')
  .option('-p, --port [port]', 'start, stop or remove the webapp by specifying the port (default: 8080)', parseInt)
  .option('-i, --id [id]', 'stop or remove the webapp by specifying the id', parseInt)
  .description('a embedded jetty server')
  .action((...args) => {
    const cmd = args[args.length - 1];
    const options = extractArgs(cmd);

    switch (args[0]) {
      case 'start':
        server.start(options.port);
        break;

      case 'stop':
        server.stop(options);
        break;

      case 'restart':
        server.restart();
        break;

      case 'list':
      case 'ls':
        server.list();
        break;

      case 'remove':
      case 'rm':
        server.remove(options);
        break;

      default:
        cmd.outputHelp();
    }
  });

// server sub-command
commander
  .command('start')
  .description('start a jetty server');

commander
  .command('restart')
  .description('restart a jetty server');

commander
  .command('stop')
  .description('stop a jetty server');

commander
  .command('remove')
  .alias('rm')
  .description('remove and stop the webapp from the webapps list');

commander
  .command('list')
  .alias('ls')
  .description('list of all webapps');

commander.command('');

program.parse(process.argv);

if (process.argv.length === 2) {
  program.outputHelp();
  process.exit(1);
}
