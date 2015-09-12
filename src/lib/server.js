/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description marmot server command
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import { spawn } from 'child_process';

import { pd } from 'pretty-data';
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
    TOMCAT_START_IDENTIFIER
} from './constant';

/**
 * 检查JDK是否安装
 * @return {Promise}
 */
function checkJDK() {
    let regex = /\b((?:\d+\.){2}\d+(?:_\d+)?)\b/;

    return new Promise((resolve, reject) => {
        let jdk = spawn('java', ['-version']),
            version = null,
            fail = () => {
                console.error(chalk.red('Please installing the JDK Software and Setting Environment Variables'));
                process.exit(1);
                reject();
            };


        jdk.stderr.on('data', data => {
            let ret = data.toString().match(regex);
            if(!version && ret){
                version = ret[0];
                console.log('JVM version: %s', version);
                resolve();
            }
        });

        jdk.on('error', fail).on('exit', () => !version && fail());
    });
}

/**
 * 检查tomcat是否安装，没有安装则下载安装tomcat
 * @return {Promise}
 */
function checkTomcat() {
    return new Promise((resolve, reject) => {
        if(fs.existsSync(TOMCAT_PATH)){
            resolve();
        } else {
            _.download(pkg._server, USERHOME)
            .then(file => _.untargz({
                pack: file,
                target: TOMCAT_PATH,
                strip: 1
            }))
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
    if(!name) return null;

    let command = null,
        suffix = '.sh',
        args = [name],
        scriptPath = '';

    if(_.isWin()){
        suffix = '.bat';
        // windows的startup.bat、shutdown.bat被改造了下
        // 将CATALINA_HOME环境变量指向tomcat所在的位置
        args.push(TOMCAT_PATH);
    }

    scriptPath = path.join(TOMCAT_PATH, 'bin', `catalina${suffix}`);
    if(fs.existsSync(scriptPath)){
        command = spawn(scriptPath, args);
    }

    return command;
}

/**
 * 启动tomcat server
 * @param {Object} opts
 * @param {Boolean} opts.hasMessage 是否显示提示信息
 * @param {Boolean} opts.port 端口号
 * @return {Promise}
 */
function startTomcat(opts = {}){
    let
        /**
         * 使用tomcat自带脚本启动server
         */
        startup = () => {

            return new Promise((resolve, reject) => {
                let command = execCatalinaScript('start');

                if(command == null){
                    opts.hasMessage && console.error(chalk.red('starting tomcat server has encountered a error'));
                    reject();
                } else {
                    fs.writeFileSync(TOMCAT_START_IDENTIFIER, '');
                    opts.hasMessage && console.log(chalk.green('tomcat server start successfully'));
                    resolve();
                }

                // windows下1秒后退出当前进程...
                if(_.isWin()){
                    setTimeout(() => process.exit(0), 1000);
                }
            });
        },

        /**
         * 检查service配置，两种情况:
         * 1.存在同名的service，只修改port
         * 2.创建全新的service
         * @return {Promise}
         */
        checkService = () => {

            return new Promise((resolve, reject) => {
                let options = path.parse(CWD),
                    $ = _.readServerFile(),
                    service = $(`Service[name="${options.base}"]`);

                // 清理项目已经删除的相关service
                $('Service').each((index, item) => {
                    let $item = $(item),
                        docBase = $item.find('Context').attr('docBase') || '',
                        appBase = $item.find('Host').attr('appBase') || '';

                    if(!fs.existsSync(path.join(appBase, docBase))){
                        $item.remove();
                    }
                });

                // service已经存在的情况下只调整port
                if(service[0]){
                    service.find('Connector').attr('port', opts.port);

                // 生成一个service配置
                } else {
                    // 没有端口的情况下不创建Service
                    if(!opts.port){
                        resolve();
                        return;
                    }
                    //检查server.xml是否有重复的端口号
                    if($(`Connector[port="${opts.port}"]`, 'Service')[0]){
                        opts.hasMessage && console.error(chalk.red('port already in use'));
                        reject();
                        return;
                    }

                    $('Server').append(tmpl.service({
                        name: options.base,
                        dir: options.dir,
                        port: opts.port
                    }));
                }

                // 重写server.xml文件
                fs.writeFile(SERVER_CONFIG_PATH, pd.xml($.html()), err => {

                    if(err) reject(err);
                    resolve();
                });
            });
        },
        /**
         * 使用node net模块创建一个server用来测试端口是否处于可用状态
         * @return {Promise}
         */
        checkPort = () => {
            return new Promise((resolve, reject) => {
                let sniffer = net.createServer();

                sniffer.on('error', () => {
                    opts.hasMessage && console.error(chalk.red('port already in use'));
                    reject();
                });

                sniffer.once('close', resolve);
                sniffer.listen(opts.port, sniffer.close);
            });
        };

    return (
        checkPort()
        .then(checkService)
        .then(() => {
            return stopTomcat();
        })
        .then(startup)
    );
}

/**
 * 使用tomcat自带脚本停止server
 * @param {Object} opts
 * @param {Boolean} opts.hasMessage 是否显示提示信息
 * @return {Promise}
 */
function stopTomcat(opts = {}){

    return new Promise((resolve, reject) => {
        let errMsg = chalk.red('stopping tomcat server has encountered a error'),
            command = execCatalinaScript('stop');

        if(command == null){
            opts.hasMessage && console.error(errMsg);
            reject();
            return;
        }

        command.on('error', () => {
            opts.hasMessage && console.error(errMsg);
            reject();
        });

        command.on('exit', () => {
            del.sync(TOMCAT_START_IDENTIFIER, {force: true});
            opts.hasMessage && console.log(chalk.green('tomcat server stop successfully'));
            resolve();
        });
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
function removeServiceByName(name){
    if(typeof name === 'boolean'){
        return;
    }

    let $ = _.readServerFile(),
        hasExist = false;

    $('Service').each((index, item) => {
        let $item = $(item);
        if($item.attr('name') === name){
            hasExist = true;
            $item.remove();
            return false;
        }
    });

    if(!hasExist){
        console.error(chalk.red(`service "${name}" is not found`));
        return;
    }

    fs.writeFile(SERVER_CONFIG_PATH, pd.xml($.html()), err => {
        if(err){
            console.error(err);
            return;
        }

        console.log(chalk.green('remove the service successfully'));
        if(fs.existsSync(TOMCAT_START_IDENTIFIER)){
            startTomcat();
        }
    });
}

export default options => {
    // 是否同时存在-s, --start和-S, --stop两个参数
    if(options.start && options.stop){
        console.log(chalk.red('\'-s, --start\' and \'-S, --stop\' are mutually exclusive'));
        return;
    }

    if(options.list){
        showServices();
        return;
    }

    if(options.remove){
        removeServiceByName(options.remove);
        return;
    }

    let clean = null;
    // 存在-c, --clean的话删除掉已下载的tomcat并停止tomcat进程
    if(options.clean){
        clean = stopTomcat().then(() => {
            return del(TOMCAT_PATH, {force: true});
        });
    }

    if(options.start || options.stop){
        Promise.resolve(clean)
        .then(checkJDK)
        .then(checkTomcat)
        .then(() => {
            if(options.start){
                startTomcat({hasMessage: true, port: options.port});
            } else if(options.stop){
                stopTomcat({hasMessage: true});
            }
        });
    }
};
