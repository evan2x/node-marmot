/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description command helper
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/08/03
 */

import path from 'path';
import fs from 'fs';
import url from 'url';
import os from 'os';
import zlib from 'zlib';

import chalk from 'chalk';
import tar from 'tar';
import {pd} from 'pretty-data';
import cheerio from 'cheerio';
import * as tmpl from './template';

import {
  CWD,
  CONFIG_PATH,
  MARMOT_SERVICES_PATH,
  SERVER_CONFIG_PATH
} from './constants';

/**
 * 解压tar.gz文件
 * @param {Object} opts
 * @param {String} opts.pack   tar.gz包的路径
 * @param {String} opts.target 解压到指定目录
 * @param {Number} opts.strip
 */
export function untargz(opts) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(opts.pack)
      .pipe(zlib.createGunzip())
      .pipe(tar.Extract({  // eslint-disable-line new-cap
        path: opts.target,
        strip: opts.strip || 0
      }))
      .on('error', (err) => {
        if (err) console.error(chalk.red('[×] %s'), err.message);
        reject(err);
      })
      .on('end', () => {
        resolve();
      });
  });
}

/**
 * 读取marmot的配置文件
 * @return {Object}
 */
export function readRCFile() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(chalk.red('[×] .marmotrc file not found, please execute \'marmot init\' command'));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH));
}

/**
 * 控制台中打印一张表
 * @param  {Object} tables
 * @example
 * {
 *   head: ['name', 'port', 'path'],
 *   body: [
 *     ['app', 8080, '/path/to/app']
 *   ]
 * }
 */
export function printTables(tables = {
  head: [],
  body: []
}) {
  let space = ' ',
    output = '',
    placeholder = '',
    list = [tables.head, ...tables.body],
    rowWidth = [],
    margin = space.repeat(2),
    symbols = {
      header: {
        l: '┌',
        c: '┬',
        r: '┐'
      },
      body: {
        l: '├',
        c: '┼',
        r: '┤'
      },
      footer: {
        l: '└',
        c: '┴',
        r: '┘'
      }
    },
    /**
     * 分割线
     * @param  {Array}  width    单元格宽度
     * @param  {Object} symbols  单元格分隔符
     * @return {String}
     */
    breakline = (width, symbols) => {
      let line = symbols.l;

      for (let i = 0; i < width.length; i++) {
        line += '─'.repeat(width[i] + margin.length * 2);
        if (i < width.length - 1) {
          line += symbols.c;
        }
      }

      line += symbols.r;

      return `${line}\n`;
    },
    /**
     * 创建一行数据
     * @param  {Number} type
     * @param  {Array}  data  要打印的数据
     * @param  {Array}  width 单元格宽度
     * @return {String}
     */
    createRow = (data, width) => {
      let str = '│';

      for (let i = 0; i < data.length; i++) {
        let cell = '' + data[i],
          len = cell.replace(/\u001b\[\d+m/gi, '').length;

        placeholder = space.repeat(Math.max(width[i] - len, 0));
        str += `${margin}${cell}${placeholder}${margin}│`;
      }

      return `${str}\n`;
    };

  list.forEach((item) => {
    rowWidth = item.map((v, i) => {
      let len = ('' + v).replace(/\u001b\[\d+m/gi, '').length;
      return Math.max(rowWidth[i] || 0, len);
    });
  });

  output += breakline(rowWidth, symbols.header);
  // 首行
  output += createRow(tables.head, rowWidth);

  for (let i = 0; i < tables.body.length; i++) {
    output += breakline(rowWidth, symbols.body);
    output += createRow(tables.body[i], rowWidth);
  }

  output += breakline(rowWidth, symbols.footer);

  process.stdout.write(output);
}

/**
 * 创建web.xml格式的参数配置
 * @param  {Object} params 参数表
 * @return {String}
 */
export function createXMLParams(params) {
  let fragment = '';
  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      fragment += tmpl.createParam(key, params[key]);
    }
  }
  return fragment;
}

/**
 * 读取projects文件, 返回一个plain object
 * @return {Object}
 */
export function readServicesFile() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(MARMOT_SERVICES_PATH)) {
      fs.readFile(MARMOT_SERVICES_PATH, 'utf8', (err, data) => {
        if (err) return reject(err);
        let services = JSON.parse(data);
        resolve(services);
      });
    } else {
      resolve({
        lastIndex: 0,
        projects: []
      });
    }
  });
}

/**
 * 写入services文件
 * @param  {Object} services JSONObject
 * @return {Promise}
 */
export function writeServicesFile(services) {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      MARMOT_SERVICES_PATH,
      JSON.stringify(services, null, '  '),
      (err) => {
        if (err) return reject(err);
        resolve(services);
      }
    );
  });
}

export const services = Object.freeze({
  /**
    * 保存服务
    * @param {String} options.name 项目名
    * @param {Number} options.port 端口号
    * @param {Number} options.pid 进程ID
    * @param {String} options.status 状态
    * @param {String} options.path 所在目录的路径
    * @return {Promise}
   */
  save(options) {
    let names = [];

    if (!Array.isArray(options)) {
      options = [options];
    }

    return readServicesFile()
      .then((services) => {
        let projects = services.projects;

        for (let i = 0, item; item = options[i++];) {
          let {name, port, pid, status, path} = item,
            project = projects.find((p) => p.name === item.name);

          if (project) {
            project.port = port;
            project.pid = pid;
            project.status = status;
            project.path = path;
          } else {
            services.lastIndex += 1;
            projects.push({
              id: services.lastIndex,
              name,
              port,
              pid,
              status,
              path
            });
          }

          names.push(name);
        }

        return services;
      })
      .then(writeServicesFile)
      .then(() => names);
  },

  /**
   * 根据服务name, id, port查找对应的服务
   * @param  {Object|Array<Object>} options 参数
   * @param {String} optoins.name 服务名
   * @param {Number} optoins.port 服务端口号
   * @param {String} optoins.name 服务ID
   * @return {Promise}
   */
  find(options) {
    if (!Array.isArray(options)) {
      options = [options];
    }

    return readServicesFile()
      .then((services) => {
        let projects = services.projects,
          ret = [];

        for (let i = 0, item; item = options[i++];) {
          let {name, port, id} = item;
          for (let j = 0, project; project = projects[j++];) {
            if (
              project.name === name ||
              project.port === port ||
              project.id === id
            ) {
              ret.push(project);
            }
          }
        }

        return ret;
      });
  },

  /**
   * 根据服务name, id, port删除对应的服务
   * @param  {Object|Array<Object>} options 参数
   * @param {String} optoins.name 服务名
   * @param {Number} optoins.port 服务端口号
   * @param {String} optoins.name 服务ID
   * @return {Promise}
   */
  remove(options) {
    let names = [];

    if (!Array.isArray(options)) {
      options = [options];
    }

    return readServicesFile()
      .then((services) => {
        let projects = services.projects;

        for (let i = 0, item; item = options[i++];) {
          let {name, port, id} = item;

          for (let j = 0; j < projects.length; j++) {
            let project = projects[j];
            if (
              project.name === item.name ||
              project.port === port ||
              project.id === id
            ) {
              names.push(project.name);
              projects.splice(j, 1);
            }
          }
        }

        return services;
      })
      .then(writeServicesFile)
      .then(() => names);
  }
});

