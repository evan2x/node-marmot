
import fs from 'fs';
import path from 'path';
import net from 'net';
import {spawn} from 'child_process';

import chalk from 'chalk';

import * as _ from './helper';
import {
  CWD,
  JETTY_PATH
} from './constants';

/**
 * 检测是否安装Java
 * @return {Promise}
 */
function checkJava() {
  return new Promise((resolve, reject) => {
    let regex = /\b((?:\d+\.){2}\d+(?:_\d+)?)\b/,
      java = spawn('java', ['-version']),
      version = null,
      fail = () => {
        console.error(chalk.red('[×] Please install java in your PATH or set JAVA_HOME'));
        reject();
        process.exit(1);
      };

    java.stderr.on('data', (data) => {
      let ret = data.toString().match(regex);

      if (!version && ret) {
        version = ret[0];
        console.log(chalk.cyan('JRE version: ') + chalk.magenta('%s'), version);
        resolve();
      }
    });

    java
      .on('error', fail)
      .on('exit', () => {
        if (!version) {
          fail();
        }
      });
  });
}

/**
 * 检测端口是否可用
 * @param  {Number} port
 * @param  {String} name
 * @return {Promise}
 */
function checkPort(port, name) {
  return new Promise((resolve, reject) => {
    _.apps.find({port})
      .then((appList) => {
        let app = appList[0];

        if (app && app.name !== name) {
          reject(new Error(`The port ${port} is be used by ${app.name} app`));
          return;
        }

        // 测试端口是否可用
        let sniffer = net.connect({
          port
        }, () => {
          reject(new Error(`${port} already in use`));
          sniffer.destroy();
        });

        sniffer.once('error', () => {
          resolve(port);
          sniffer.destroy();
        });
      });
  });
}

/**
 * 检查参数
 * @return {Number}
 */
function checkArgs(args) {
  let {port, name, id} = args;

  if (port != null && (typeof port === 'boolean' || isNaN(port))) {
    console.error(chalk.red('[×] Invalid port'));
    return false;
  }

  if (name != null && typeof name !== 'string') {
    console.error(chalk.red('[×] Invalid app name'));
    return false;
  }

  if (id != null && (typeof id === 'boolean' || isNaN(id))) {
    console.error(chalk.red('[×] Invalid app id'));
    return false;
  }

  return true;
}

/**
 * 根据pid杀死指定进程
 * @param {Number}
 */
function kill(pid) {
  if (pid) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (err) {
      throw new Error(`pid(${pid}): process kill fail`);
    }
  }
}

/**
 * 纠正name，当name被认为是无效的值，则返回当前所在目录名
 * @param {String} name
 * @return {String}
 */
function correctName(name) {
  if (typeof name !== 'string' || name === '') {
    return path.basename(CWD);
  }

  return name;
}

/**
 * 启动jetty
 * @param  {Number} port
 * @param  {String} name
 * @return {Promise}
 */
function startJetty(port, name) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(JETTY_PATH)) {
      _.apps.find({name})
        .then((appList) => {
          let app = appList[0] || {};
          kill(app.pid);
        })
        .then(() => {
          let finished = false;

          let jetty = spawn('java', [
            '-jar', JETTY_PATH,
            '-w', CWD,
            '-p', port
          ], {
            detached: true
          });

          jetty.stderr.on('data', (data) => {
            let chunk = data.toString('utf8');

            // 当输出过异常或成功启动
            if (finished) return;

            if (/Server[^\r\n]+Started[^\r\n]+/i.test(chunk)) {
              finished = true;
              resolve(jetty.pid);
            }

            if (chunk.indexOf('Exception') > -1) {
              let err = new Error(chunk);

              finished = true;
              err.pid = jetty.pid;
              reject(err);
            }
          });

          jetty.on('error', reject);
        });

    } else {
      reject(new Error('The marmot has been corrupted! please reinstall the marmot'));
    }
  });
}

/**
 * 停止jetty
 * @param  {Number} port
 * @param  {String} name
 * @param  {Number} id
 * @return {Promise}
 */
function stopJetty(port, name, id) {
  return _.apps.find({port, name, id})
    .then((appList) => {
      for (let i = 0, app; app = appList[i++];) {
        if (app.pid !== '') {
          kill(app.pid);
          app.status = 'stopped';
          app.pid = '';
        }
      }

      return appList;
    })
    .then(_.apps.save);
}

/**
 * 启动应用
 * @todo 项目名未传的情况下会使用当前所在的目录名
 * @param {Number} port
 * @param {String} name
 */
export function start(port, name) {
  if (!checkArgs({port})) return;
  name = correctName(name);

  let resolver = Promise.resolve();

  // 未指定端口号的情况下
  if (port == null) {
    resolver = _.apps.find({name})
      .then((appList) => {
        let app = appList[0];

        if (app) {
          port = app.port;
        } else {
          port = 8080;
        }
      });
  }

  resolver
    .then(checkJava)
    .then(() => checkPort(port, name))
    .then(() => startJetty(port, name))
    .then(pid => new Promise((resolve, reject) => {
      _.apps.save({
        name,
        port,
        pid,
        status: 'online',
        pathname: CWD
      })
      .then(resolve)
      .catch((err) => {
        err.pid = pid;
        reject(err);
      });
    }))
    .then(() => {
      let ip = _.ip();

      console.log('');
      console.log('Access URLs:');
      console.log('----------------------');
      console.log(`   Local: ${chalk.magenta('http://%s:%s')}`, ip.internal, port);
      console.log(`External: ${chalk.magenta('http://%s:%s')}`, ip.external, port);
      console.log('');
      console.log(chalk.green('[√] %s app started successfully'), name);

      process.exit(0);
    })
    .catch((err) => {
      console.error(chalk.red('[×] Startup server has encountered a error'));
      if (err) {
        console.error(chalk.red('[×] %s'), err.message);
        kill(err.pid);
      }
      process.exit(1);
    });
}

/**
 * 停止应用
 * @param  {Number} port
 * @param  {String} name
 * @param  {Number} id
 */
export function stop(port, name, id) {
  if (!checkArgs({port, name, id})) return;

  if (port == null && name == null && id == null) {
    name = correctName(name);
  }

  checkJava()
    .then(() => stopJetty(port, name, id))
    .then((nameList) => {
      if (nameList.length) {
        console.log(chalk.green('[√] %s app stopped successfully'), nameList.join());
      } else {
        console.warn(chalk.yellow('[i] Didn\'t find any app can be stopped'));
      }
    })
    .catch((err) => {
      console.error(chalk.red('[×] Stopped server has encountered a error'));
      console.error(chalk.red('[×] %s'), err.message);
    });
}

/**
 * 删除应用
 * @param {Number} port
 * @param {String} name
 * @param {Number} id
 */
export function remove(port, name, id) {
  let opts = {port, name, id};

  if (!checkArgs(opts)) return;

  _.apps.find(opts)
    .then((appList) => {
      for (let i = 0, app; app = appList[i++];) {
        kill(app.pid);
      }

      return appList;
    })
    .then(_.apps.remove)
    .then((nameList) => {
      if (nameList.length) {
        console.log(chalk.green('[√] %s app removed success'), nameList.join());
      } else {
        console.warn(chalk.yellow('[i] Didn\'t find any app can be removed'));
      }
    })
    .catch((err) => {
      console.error(chalk.red('[×] %s'), err.message);
    });
}

/**
 * 显示所有应用列表
 */
export function list() {
  _.readAppsFile()
    .then((file) => {
      let body = [],
        appList = file.list;

      body = appList.map((p) => {

        p.name = chalk.cyan(p.name);

        if (p.status === 'online') {
          p.status = chalk.green(p.status);
        } else if (p.status === 'stopped') {
          p.status = chalk.red(p.status);
        }

        return [
          p.id,
          p.name,
          p.port,
          p.pid,
          p.status,
          p.pathname
        ];
      });

      _.printTable({
        head: ['id', 'name', 'port', 'pid', 'status', 'path'],
        body
      });
    })
    .catch((err) => {
      console.error(chalk.red('[×] %s'), err.message);
    });
}
