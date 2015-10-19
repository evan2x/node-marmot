/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description marmot server command
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import { spawn } from 'child_process';

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
 * 检查JDK是否安装及检测JAVA_HOME或者JRE_HOME环境变量是否已设置
 * @return {Promise}
 */
function checkJDK() {
    let regex = /\b((?:\d+\.){2}\d+(?:_\d+)?)\b/;

    return new Promise((resolve, reject) => {
        let jdk = spawn('java', ['-version']),
            version = null,
            fail = () => {
                console.error(chalk.red('Please installing the JDK Software'));
                process.exit(1);
                reject();
            };

        jdk.stderr.on('data', data => {
            let ret = data.toString().match(regex);
            if(!version && ret){
                version = ret[0];
                console.log('JVM version: %s', version);
                if(process.env.JAVA_HOME || process.env.JRE_HOME){
                    resolve();

                // JAVA_HOME与JRE_HOME全部都未设置时给予用户错误提示
                } else {
                    console.error(chalk.red('Neither the JAVA_HOME nor the JRE_HOME environment variable is defined'));
                    console.error(chalk.red('At least one of these environment variable is needed to run this program'));
                    reject();
                }
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
         * 检查端口是否被占用
         * @return {Promise}
         */
        checkPort = () => {
            return new Promise((resolve, reject) => {
                let portExists = chalk.red(`port [${opts.port}] is already in use`);
                // 检查service配置中当前端口是否被占用
                if(connector[0] && !service.has(connector)[0]){
                    opts.hasMessage && console.error(portExists);
                    reject();
                    return;
                }

                // 使用net模块创建一个server用来测试端口是否处于可用状态
                let sniffer = net.createServer();

                sniffer.once('error', () => {
                    // 如果端口被包含在当前服务中，提示为当前服务已占用此端口
                    if(service.has(connector)[0]){
                        opts.hasMessage && console.error(chalk.red(`the current service is already using port [${opts.port}]`));
                    } else {
                        opts.hasMessage && console.error(portExists);
                    }
                    reject();
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
function deleteServiceByPort(port){
    if(typeof port === 'boolean'){
        return;
    }

    let $ = _.readServerFile(),
        hasExist = false;

    $('Connector', 'Service').each((index, item) => {
        let $item = $(item);
        if($item.attr('port') === port){
            hasExist = true;
            $item.parent().remove();
            return false;
        }
    });

    if(!hasExist){
        console.error(chalk.red(`port "${port}" is not found`));
        return;
    }

    _.writeServerFile($.html())
    .then(() => {
        console.log(chalk.green('remove the service successfully'));

        if(fs.existsSync(TOMCAT_START_IDENTIFIER)){
            startTomcat();
        }
    });
}

export default options => {
    // 检查启动，停止以及重启是否有两个以上参数同时存在
    if(_.checkParamsMutex([
        options.start,
        options.stop,
        options.restart])
    ){
        console.error(chalk.red('\'-s, --start\', \'-S, --stop\', \'-r, --restart\' are mutually exclusive'));
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
    // 存在-c, --clean的话停止tomcat进程并删除已下载的tomcat
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
                    hasMessage: true,
                    port: options.port
                });
            } else if(options.stop){
                stopTomcat({hasMessage: true});
            } else if(options.restart){
                stopTomcat()
                .then(startTomcat)
                .then(() => {
                    console.log(chalk.green('tomcat server restart successfully'));
                });
            }
        });
    }
};
