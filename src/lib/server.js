/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description Marmot server command
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import {spawn} from 'child_process';

import chalk from 'chalk';
import del from 'del';

import * as _ from './helper';
import * as tmpl from './template';
import pkg from '../package.json';
import {
  CWD,
  USERHOME,
  TOMCAT_PATH,
  SERVER_CONFIG_PATH,
  TOMCAT_FILE,
  TOMCAT_PID
} from './constants';

/**
 * 检查JDK是否安装及检测JAVA_HOME或者JRE_HOME环境变量是否已设置
 * @return {Promise}
 */
function checkJDK() {
  let regex = /\b((?:\d+\.){2}\d+(?:_\d+)?)\b/;
  return new Promise((resolve, reject) => {
    let jdk = spawn('java', ['-version']),
      version = null,
      fail = () => {
        console.error(chalk.red('[×] please install the JDK software'));
        process.exit(1);
        reject();
      };

    jdk.stderr.on('data', (data) => {
      let ret = data.toString().match(regex);
      if(!version && ret){
        version = ret[0];
        console.log('JVM version: %s', version);
        if(process.env.JAVA_HOME || process.env.JRE_HOME){
          resolve();
        // JAVA_HOME与JRE_HOME全部都未设置时给予用户错误提示
        } else {
          console.error(chalk.red('[×] neither the JAVA_HOME nor the JRE_HOME environment variable is defined at least one of these environment variable is needed to run this program'));
          reject();
        }
      }
    });

    jdk.on('error', fail).on('exit', () => !version && fail());
  });
}

/**
 * 检查tomcat是否安装，没有安装则安装tomcat
 * @return {Promise}
 */
function checkTomcat() {
  return new Promise((resolve, reject) => {
    if(fs.existsSync(TOMCAT_PATH)){
      resolve();
    } else {
      _.untargz({
        pack: TOMCAT_FILE,
        target: TOMCAT_PATH,
        strip: 1
      })
      .then(resolve)
      .catch(reject);
    }
  });
}

/**
 * 执行服务器脚本
 * @param  {String} name 命令名称
 * @return {Child_Process}
 */
function execCatalinaScript(name){
  return new Promise((resolve, reject) => {
    if(!name){
      reject('command name is required');
    }
    
    let suffix = '.sh',
      opts = [name],
      env = {};

    if(_.isWin()){
      suffix = '.bat';
      env['CATALINA_HOME'] = TOMCAT_PATH;
    } else {
      // *nix环境下启动时，记录pid
      if(name === 'start'){
        env['CATALINA_PID'] = TOMCAT_PID;
      }
    }

    let script = path.join(TOMCAT_PATH, 'bin', `catalina${suffix}`);
    if(fs.existsSync(script)){
      let command = spawn(script, opts, {
          env: Object.assign(process.env, env)
        });

      // windows环境下启动时，总是返回成功
      if(_.isWin() && name === 'start'){
        resolve();
      } else {
        let stdout = '',
          stderr = '';

        command.stdout.on('data', (data) => {
          stdout += data;
        });

        command.stderr.on('data', (data) => {
          stderr += data;
        });

        command.on('close', (code) => {
          if(code === 0){
            resolve(stdout);
          } else {
            reject(stdout !== '' ? stdout : stderr);
          }
        });
      }

      command.on('error', function(err){
        reject(err.message);
      });
    } else {
      reject(`${script} not found`);
    }
  });
}

/**
 * 启动tomcat server
 * @param {Object} opts
 * @param {Boolean} opts.port 端口号
 * @return {Promise}
 */
function startTomcat(opts = {}){
  let options = path.parse(CWD),
    $ = _.readServerFile(),
    // 匹配服务是否存在
    service = $(`Service[name="${options.base}"]`),
    // 匹配已使用指定端口的connector
    connector = $(`Connector[port="${opts.port}"]`, 'Service'),
    /**
     * 使用tomcat自带脚本启动server
     * @return {Promise}
     */
    startup = () => {
      return (
        execCatalinaScript('start')
          .then((data) => {
            // windows下2s后退出当前进程...
            if(_.isWin()){
              setTimeout(() => process.exit(0), 2000);
            }
            return data;
          })
      );
    },
    /**
     * 检查端口是否被占用
     * @return {Promise}
     */
    checkPort = () => {
      return new Promise((resolve, reject) => {
        // 检查service配置中当前端口是否被占用
        if(connector[0] && !service.has(connector)[0]){
          reject(`port [${opts.port}] is already in use`);
          return;
        }

        // 使用net模块创建一个server用来测试端口是否处于可用状态
        let sniffer = net.createServer();

        sniffer.once('error', () => {
          // 如果端口被包含在当前服务中，提示为当前服务已占用此端口
          if(service.has(connector)[0]){
            reject(`the current service is already using port [${opts.port}]`);
          } else {
            reject(`port [${opts.port}] is already in use`);
          }
        });

        sniffer.once('close', resolve);
        sniffer.listen(opts.port, sniffer.close);
      });
    },
    /**
     * 设置端口号
     * @todo 如果指定端口号与当前服务所使用的端口号一致则不设置
     * @return {Promise}
     */
    setPort = () => {
      return new Promise((resolve, reject) => {
        if(!opts.port || service.has(connector)[0]){
          resolve();
          return;
        }

        if(service[0]){
          service.find('Connector').attr('port', opts.port);
        } else {
          $('Server').append(tmpl.service({
            name: options.base,
            dir: options.dir,
            port: opts.port
          }));
        }
        _.writeServerFile($.html()).then(resolve).catch(reject);
      });
    },

    /**
     * 清理项目已经删除的相关service
     * @return {Promise}
     */
    cleanService = () => {
      return new Promise((resolve, reject) => {
        $('Service').each((index, item) => {
          let $item = $(item),
            docBase = $item.find('Context').attr('docBase') || '',
            appBase = $item.find('Host').attr('appBase') || '';

          if(!fs.existsSync(path.join(appBase, docBase))){
            $item.remove();
          }
        });

        _.writeServerFile($.html()).then(resolve).catch(reject);
      });
    };

  return (
    checkPort()
    .then(setPort)
    .then(stopTomcat)
    .then(cleanService)
    .then(startup)
  );
}

/**
 * kill tomcat process
 * @return {Promise}
 */
function stopTomcat(){
  return new Promise((resolve, reject) => {
    let scriptKill = () => {
      execCatalinaScript('stop').then(resolve).then(resolve);
    }

    if(fs.existsSync(TOMCAT_PID)){
      let pid = fs.readFileSync(TOMCAT_PID).toString().trim();
      try {
        process.kill(pid, 'SIGKILL');
        del.sync(TOMCAT_PID, {force: true});
        resolve();
      } catch(e){
        scriptKill();
      }
    } else {
      scriptKill();
    }
  });
}

/**
 * 显示tomcat配置中已经存在的service
 */
function showServices(){
  let $ = _.readServerFile(),
    list = [];

  // 提取services组成二维数组
  $('Service').each((index, item) => {
    let $item = $(item),
      name = $item.attr('name'),
      port = $item.find('Connector').attr('port'),
      base = path.join($item.find('Host').attr('appBase'), name);
    list.push([name, port, base]);
  });

  _.printTables({
    head: ['name', 'port', 'path'],
    body: list
  });
}

/**
 * 根据端口号删除对应的service
 * @param  {String} port
 */
function deleteServiceByPort(port){
  if(typeof port === 'boolean'){
    return;
  }

  let $ = _.readServerFile(),
    exists = false;

  $('Connector', 'Service').each((index, item) => {
    let $item = $(item);
    if($item.attr('port') === port){
      exists = true;
      $item.parent().remove();
      return false;
    }
  });

  if(!exists){
    console.error(chalk.red(`[×] port "${port}" is not found`));
    return;
  }

  _.writeServerFile($.html())
    .then(() => {
      console.log(chalk.green('[√] removed the service'));
      if(fs.existsSync(TOMCAT_PID)){
        return startTomcat();
      }
    })
    .catch((err) => {
      console.error(chalk.log(`[×] ${err}`));
    });
}

export default function(options) {
  // 检查启动，停止以及重启是否有两个以上参数同时存在
  if(_.checkParamsMutex([options.start, options.stop, options.restart])){
    console.error(chalk.red('[×] \'-s, --start\', \'-S, --stop\', \'-r, --restart\' are mutually exclusive'));
    return;
  }

  // 打印已配置的服务列表
  if(options.list){
    showServices();
    return;
  }

  // 根据服务的端口号删除相关的配置项
  if(options.delete){
    deleteServiceByPort(options.delete);
    return;
  }

  let clean = null;
  // 存在-c, --clean的话停止tomcat进程并删除已配置的tomcat
  if(options.clean){
    clean = stopTomcat().then(() => {
      return del(TOMCAT_PATH, {force: true});
    });
  }

  if(options.start || options.stop || options.restart){
    Promise.resolve(clean)
      .then(checkJDK)
      .then(checkTomcat)
      .then(() => {
        if(options.start){

          startTomcat({
            port: options.port
          })
          .then((data) => {
            console.log(chalk.green('[√] tomcat server started'));
          })
          .catch((err) => {
            console.error(chalk.red('[×] starting tomcat server has encountered a error'));
            err && console.error(chalk.red(`[×] ${err}`));
          });

        } else if(options.stop){

          stopTomcat()
          .then((data) => {
            console.log(chalk.green('[√] tomcat server stopped'));
          })
          .catch((err) => {
            console.error(chalk.red('[×] stopping tomcat server has encountered a error'));
            err && console.error(chalk.red(`[×] ${err}`));
          });

        } else if(options.restart){

          stopTomcat()
          .then(startTomcat)
          .then((data) => {
            console.log(chalk.green('[√] tomcat server restarted'));
          })
          .catch((err) => {
            console.error(chalk.red('[×] restarting tomcat server has encountered a error'));
            err && console.error(chalk.red(`[×] ${err}`));
          });
        }
      });
  }
};
