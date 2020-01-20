const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const chalk = require('chalk');
const util = require('./shared/util');
const store = require('./shared/store');
const {
  CWD,
  JETTY_PATH,
  WEB_XML_PATH
} = require('./shared/constants');

let isRestart = false;

/**
 * 检测项目是否已经初始化
 * @return {Promise}
 */
function checkInitialized() {
  if (fs.existsSync(WEB_XML_PATH)) {
    return Promise.resolve();
  }

  return Promise.reject(new Error('Please initialize the project first'));
}

/**
 * 检测是否安装Java
 * @return {Promise}
 */
function checkJava() {
  return new Promise((resolve, reject) => {
    const regex = /\b((?:\d+\.){2}\d+(?:_\d+)?)\b/;
    const java = spawn('java', ['-version']);
    const throwError = () => {
      console.error(chalk.red('[×] Please install java in your PATH or set JAVA_HOME'));
      reject();
      process.exit(1);
    };
    let version = null;

    java.stderr.on('data', (data) => {
      const matched = data.toString().match(regex);

      if (!version && matched) {
        [version] = matched;
        console.log(chalk.cyan('JRE version: ') + chalk.magenta('%s'), version);
        resolve();
      }
    });

    java
      .on('error', throwError)
      .on('exit', () => {
        if (!version) {
          throwError();
        }
      });
  });
}

/**
 * 检测端口是否可用
 * @param  {Number} port
 * @return {Promise}
 */
function checkPort(port) {
  return new Promise((resolve, reject) => {
    store.findOne({ port })
      .then((webapp) => {
        if (webapp != null) {
          if (webapp.pathname === CWD) {
            resolve(port);
          } else {
            reject(new Error(`The port '${port}' is already use`));
          }

          return;
        }

        // 测试端口是否可用
        const sniffer = net.connect({
          port
        }, () => {
          reject(new Error(`The port '${port}' already in use`));
          sniffer.destroy();
        });

        sniffer.once('error', () => {
          resolve(port);
          sniffer.destroy();
        });
      })
      .catch(reject);
  });
}

/**
 * 检查参数
 * @param {Object} args
 * @param {Number} args.port
 * @param {Number} args.id
 * @return {Boolean}
 */
function checkArgs(args) {
  const { port, id } = args || {};

  if (port != null && (typeof port === 'boolean' || Number.isNaN(port))) {
    console.error(chalk.red('[×] Invalid port'));
    return false;
  }

  if (id != null && (typeof id === 'boolean' || Number.isNaN(id))) {
    console.error(chalk.red('[×] Invalid webapp id'));
    return false;
  }

  return true;
}

/**
 * 根据pid杀死指定进程
 * @param {Number} pid
 */
function kill(pid) {
  if (pid) {
    try {
      process.kill(pid, 'SIGKILL');
    // eslint-disable-next-line no-empty
    } catch (err) {}
  }
}

/**
 * 修复webapp状态
 * @param {Object} file
 * @param {Array} file.list
 * @return {Promise}
 */
function statusRepair(file) {
  return Promise.all(file.list.map((webapp) => {
    if (webapp.status !== 'online') {
      return Promise.resolve(webapp);
    }

    return util.getProcessByPid(webapp.pid).then((ret) => {
      if (!(ret && ret.indexOf(webapp.pid) > -1 && ret.indexOf(path.basename(JETTY_PATH)) > -1)) {
        webapp.pid = '--';
        webapp.status = 'stopped';

        // 更新状态
        return store.save(webapp);
      }

      return Promise.resolve(webapp);
    });
  }));
}

/**
 * 启动jetty server
 * @param  {Object} port
 * @return {Promise}
 */
function startJetty(port) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(JETTY_PATH)) {
      reject(new Error('The marmot has been corrupted! please reinstall the marmot'));
    }

    store.findOne({ port })
      .then((webapp) => {
        if (webapp != null) {
          kill(webapp.pid);
        }
      })
      .then(() => {
        const jetty = spawn('java', [
          '-jar', JETTY_PATH,
          '-w', CWD,
          '-p', port
        ], {
          detached: true
        });
        let finished = false;

        jetty.stderr.on('data', (data) => {
          // 启动成功或者失败之后不再对输出内容进行分析
          if (finished) return;

          const chunk = data.toString('utf8');

          if (/Server[^\r\n]+Started[^\r\n]+/i.test(chunk)) {
            finished = true;
            resolve(jetty.pid);
          }

          if (chunk.indexOf('Exception') > -1) {
            const err = new Error(chunk);

            finished = true;
            err.pid = jetty.pid;
            reject(err);
          }
        });

        jetty.on('error', reject);
      }).catch(reject);
  });
}

/**
 * 停止jetty server
 * @param  {Object} options
 * @param  {Number} options.port
 * @param  {Number} options.id
 * @return {Promise}
 */
function stopJetty(options) {
  return store.findOne(options)
    .then((webapp) => {
      if (webapp && webapp.pid !== '') {
        kill(webapp.pid);
        webapp.status = 'stopped';
        webapp.pid = '--';
      }

      return webapp;
    });
}

/**
 * 启动应用
 * @param  {Number} port
 */
function start(port) {
  if (!checkArgs({ port })) return;

  const ip = util.ip();
  let resolver = Promise.resolve();

  // 未指定端口号时从配置表中读取该项目对应的端口号
  if (port == null) {
    resolver = store.findOne({ port }).then((webapp) => {
      port = webapp ? webapp.port : 8080;
    });
  }

  const saveWebapp = (pid) => new Promise((resolve, reject) => {
    store.save({
      domain: `http://${ip.internal}:${port}`,
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
  });

  return resolver
    .then(isRestart ? null : checkJava)
    .then(() => checkInitialized())
    .then(() => checkPort(port))
    .then(() => startJetty(port))
    .then((pid) => saveWebapp(pid))
    .then((webapp) => {
      console.log('');
      console.log('Access URLs:');
      console.log('----------------------');
      console.log(`   Local: ${chalk.magenta('http://%s:%s')}`, ip.internal, webapp.port);
      console.log(`External: ${chalk.magenta('http://%s:%s')}`, ip.external, webapp.port);
      console.log('');
      console.log(chalk.green('[√] webapp on port \'%s\' has started successfully'), webapp.port);

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
 * @param {Object} options
 * @param {Number} options.port
 * @param {Number} options.id
 */
function stop(options) {
  if (!checkArgs(options)) return;

  return Promise.resolve()
    .then(isRestart ? null : checkJava)
    .then(() => stopJetty(options))
    .then(store.save)
    .then((webapp) => {
      if (webapp) {
        console.log(chalk.green('[√] webapp on port \'%s\' has stopped successfully'), webapp.port);
      } else {
        console.warn(chalk.yellow('[i] Didn\'t find any webapp can be stopped'));
      }
    })
    .catch((err) => {
      console.error(chalk.red('[×] Stopped server has encountered a error'));
      console.error(chalk.red('[×] %s'), err.message);
    });
}

/**
 * 重启应用
 */
function restart() {
  isRestart = true;

  return Promise.resolve()
    .then(checkJava)
    .then(stop)
    .then(start);
}

/**
 * 删除应用
 * @param {Object} options
 * @param {Number} options.port
 * @param {Number} options.id
 */
function remove(options) {
  if (!checkArgs(options)) return;

  if (options.id == null && options.port == null) {
    console.warn(chalk.yellow('[i] You must specify the \'-p [port]\' or \'-i [id]\' when deleting the webapp'));
    return;
  }

  store.findOne(options)
    .then((webapp) => {
      if (webapp) {
        kill(webapp.pid);
      }

      return webapp;
    })
    .then(store.remove)
    .then((webapp) => {
      if (webapp) {
        console.log(chalk.green('[√] Webapp on port \'%s\' has removed successfully'), webapp.port);
      } else {
        console.warn(chalk.yellow('[i] Can\'t find any webapp that can be deleted'));
      }
    })
    .catch((err) => {
      console.error(chalk.red('[×] %s'), err.message);
    });
}

/**
 * 显示所有应用列表
 */
function list() {
  util.readAppsFile()
    .then(statusRepair)
    .then((webapps) => {
      let body = [];

      body = webapps.map((webapp) => {
        webapp.domain = chalk.magenta(webapp.domain || '');
        webapp.pathname = chalk.cyan(webapp.pathname);

        if (webapp.status === 'online') {
          webapp.status = chalk.green(webapp.status);
        } else if (webapp.status === 'stopped') {
          webapp.status = chalk.red(webapp.status);
        }

        return [
          webapp.id,
          webapp.domain,
          webapp.port,
          webapp.pid,
          webapp.status,
          webapp.pathname
        ];
      });

      util.printTable({
        head: ['id', 'domain', 'port', 'pid', 'status', 'pathname'],
        body
      });
    })
    .catch((err) => {
      console.error(chalk.red('[×] %s'), err.message);
    });
}

module.exports = {
  start,
  stop,
  restart,
  remove,
  list
};
