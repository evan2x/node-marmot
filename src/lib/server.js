/**
 * Marmot server
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */

import fs from 'fs';
import path from 'path';
import net from 'net';
import {spawn} from 'child_process';

import chalk from 'chalk';
import del from 'del';

import * as _ from './helper';
import {
  CWD,
  JETTY_PATH,
} from './constants';

/**
 * 检测是否安装java
 * @return {Promise}
 */
function checkJava() {
  return new Promise((resolve, reject) => {
    let regex = /\b((?:\d+\.){2}\d+(?:_\d+)?)\b/,
      java = spawn('java', ['-version']),
      version = null,
      fail = () => {
        console.error(chalk.red('[×] please install the JDK software'));
        reject();
        process.exit(1);
      };

    java.stderr.on('data', (data) => {
      let ret = data.toString().match(regex);
      if (!version && ret) {
        version = ret[0];
        console.log('JDK version: %s', version);
        resolve();
      }
    });

    java
      .on('error', fail)
      .on('exit', (data) => {
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
    _.services.find({port})
      .then((projects) => {
        let project = projects[0];
        if (project && project.name != name) {
          reject(new Error(`the port ${port} is be used by ${project.name} service`));
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
    console.error(chalk.red('[×] invalid port'));
    return false;
  }

  if (name != null && typeof name !== 'string') {
    console.error(chalk.red('[×] invalid service name'));
    return false;
  }

  if (id != null && (typeof id === 'boolean' || isNaN(id))) {
    console.error(chalk.red('[×] invalid service id'));
    return false;
  }

  return true;
}

/**
 * 纠正name，当name被认为是无效的值，则返回当前所在目录名
 * @return {String}
 */
function correctName(name) {
  if (typeof name !== 'string' || name === '') {
    return path.basename(CWD);
  } else {
    return name;
  }
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
      _.services.find({name})
        .then((projects) => {
          let project = projects[0] || {},
            finished = false;

          if (project.pid !== '' && project.status === 'online') {
            reject(new Error(`the ${name} service has been started using port ${port}`));
            return;
          }

          let jetty = spawn('java', [
            '-jar', JETTY_PATH,
            '-w', CWD,
            '-p', port
          ]);

          jetty.stderr.on('data', (data) => {
            let chunk = data.toString('utf8');

            // 当输出过异常或成功启动
            if (finished) return;

            if (/Server[^\r\n]+Started[^\r\n]+/i.test(chunk)) {
              finished = true;
              resolve(jetty.pid);
            }
            if (chunk.indexOf('Exception') > -1) {
              finished = true;
              reject();
            }
          });

          jetty.on('error', reject);
        });

    } else {
      reject(new Error('the marmot has been corrupted! please reinstall the marmot'));
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
  return _.services.find({port, name, id})
    .then((projects) => {
      for (let i = 0, project; project = projects[i++];) {
        if (project.pid !== '') {
          try {
            // ctrl+c
            process.kill(project.pid, 'SIGINT');
            // kill -9
            process.kill(project.pid, 'SIGKILL');
          } catch (e) {}

          project.status = 'stopped';
          project.pid = '';
        }
      }

      return projects;
    })
    .then(_.services.save);
}

/**
 * 启动服务
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
    resolver = _.services.find({name})
      .then((projects) => {
        let project = projects[0];
        if (project) {
          port = project.port;
        } else {
          // 默认8080
          port = 8080;
        }
      });
  }

  resolver
    .then(checkJava)
    .then(() => checkPort(port, name))
    .then(() => startJetty(port, name))
    .then((pid) => new Promise((resolve, reject) => {
      _.services.save({
        name,
        port,
        pid,
        status: 'online',
        path: CWD
      })
      .then(resolve)
      .catch((err) => {
        // 当保存项目信息出现异常的时候，杀死进程
        // todo: 低概率事件
        try {
          // ctrl+c
          process.kill(pid, 'SIGINT');
          // kill -9
          process.kill(pid, 'SIGKILL');
        } catch(e) {}
        reject(err);
      });
    }))
    .then(() => {
      console.log(chalk.green('[√] %s service started successfully'), name);
      process.exit(0);
    })
    .catch((err) => {
      console.error(chalk.red('[×] startup server has encountered a error'));
      err && console.error(chalk.red('[×] %s'), err.message);
      process.exit(1);
    });
}

/**
 * 停止服务
 * @param  {Number} port
 * @param  {String} name
 * @param  {Number} id
 */
export function stop(port, name, id) {
  if (!checkArgs({port, name, id})) return;

  checkJava()
    .then(() => stopJetty(port, name, id))
    .then((names) => {
      if (names.length) {
        console.log(chalk.green('[√] %s service stopped successfully'), names.join());
      } else {
        console.warn(chalk.yellow('[i] didn\'t find any service can be stopped'));
      }
    })
    .catch((err) => {
      console.error(chalk.red('[×] stopped server has encountered a error'));
      console.error(chalk.red('[×] %s'), err.message);
    });
}

/**
 * 删除服务
 * @param {Number} port 
 * @param {String} name 
 * @param {Number} id
 */
export function remove(port, name, id) {
  let opts = {port, name, id};
  if (!checkArgs(opts)) return;

  _.services.find(opts)
    .then((projects) => {
      for (let i = 0, project; project = projects[i++];) {
        // 关闭正在运行的服务
        if (project.pid !== '') {
          try {
            // ctrl+c
            process.kill(project.pid, 'SIGINT');
            // kill -9
            process.kill(project.pid, 'SIGKILL');
          } catch (e) {}
        }
      }

      return projects;
    })
    .then(_.services.remove)
    .then((names) => {
      if (names.length) {
        console.log(chalk.green('[√] %s services removed success'), names.join());
      } else {
        console.warn(chalk.yellow('[i] didn\'t find any service can be removed'));
      }
    })
    .catch((err) => {
      console.error(chalk.red('[×] %s'), err.message);
    });
}

/**
 * 显示所有服务列表
 */
export function list() {
  _.readServicesFile()
    .then((services) => {
      let list = [],
        projects = services.projects;

      list = projects.map((p) => {

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
          p.path
        ];
      });

      _.printTable({
        head: ['id', 'name', 'port', 'pid', 'status', 'path'],
        body: list
      });
    })
    .catch((err) => {
      console.error(chalk.red('[×] %s'), err.message);
    });
}
