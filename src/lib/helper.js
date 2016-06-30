
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import os from 'os';

import chalk from 'chalk';
import tar from 'tar';
import mkdirp from 'mkdirp';
import * as tmpl from './template';

import {
  CONFIG_PATH,
  MARMOT_APPS_PATH
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
 * @param {Object} table
 * @param {Array} table.head 表头
 * @param {Array} table.body 表内容
 * @example
 * {
 *   head: ['name', 'port', 'path'],
 *   body: [
 *     ['app', 8080, '/path/to/app']
 *   ]
 * }
 */
export function printTable(table = {
  head: [],
  body: []
}) {
  let space = ' ',
    output = '',
    placeholder = '',
    list = [table.head, ...table.body],
    rowWidth = [],
    margin = space.repeat(2),
    tableSymbols = {
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
     * @param  {Object} mark  单元格分隔符
     * @return {String}
     */
    breakline = (width, mark) => {
      let line = mark.l;

      for (let i = 0; i < width.length; i++) {
        line += '─'.repeat(width[i] + margin.length * 2);
        if (i < width.length - 1) {
          line += mark.c;
        }
      }

      line += mark.r;

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
        let cell = '' + data[i], // eslint-disable-line prefer-template
          len = cell.replace(/\u001b\[\d+m/gi, '').length;

        placeholder = space.repeat(Math.max(width[i] - len, 0));
        str += `${margin}${cell}${placeholder}${margin}│`;
      }

      return `${str}\n`;
    };

  list.forEach((item) => {
    rowWidth = item.map((v, i) => {
      let len = ('' + v).replace(/\u001b\[\d+m/gi, '').length; // eslint-disable-line prefer-template
      return Math.max(rowWidth[i] || 0, len);
    });
  });

  output += breakline(rowWidth, tableSymbols.header);
  // 首行
  output += createRow(table.head, rowWidth);

  for (let i = 0; i < table.body.length; i++) {
    output += breakline(rowWidth, tableSymbols.body);
    output += createRow(table.body[i], rowWidth);
  }

  output += breakline(rowWidth, tableSymbols.footer);

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
 * 读取apps文件, 返回一个plain object
 * @return {Object}
 */
export function readAppsFile() {
  return new Promise((resolve, reject) => {
    let dirname = path.dirname(MARMOT_APPS_PATH);
    if (!fs.existsSync(dirname)) mkdirp.sync(dirname);

    if (fs.existsSync(MARMOT_APPS_PATH)) {
      fs.readFile(MARMOT_APPS_PATH, 'utf8', (err, data) => {
        if (err) return reject(err);
        let apps = JSON.parse(data);
        resolve(apps);
      });
    } else {
      resolve({
        lastIndex: 0,
        list: []
      });
    }
  });
}

/**
 * 写入apps文件
 * @param  {Object} apps
 * @return {Promise}
 */
export function writeAppsFile(apps) {
  return new Promise((resolve, reject) => {
    let dirname = path.dirname(MARMOT_APPS_PATH);
    if (!fs.existsSync(dirname)) mkdirp.sync(dirname);

    fs.writeFile(
      MARMOT_APPS_PATH,
      JSON.stringify(apps, null, '  '),
      (err) => {
        if (err) return reject(err);
        resolve(apps);
      }
    );
  });
}

/**
 * 获取本地IP及外部访问IP
 * @return {Object} ip
 * @return {String} ip.internal 本地IP
 * @return {String} ip.external 外部访问IP
 */
export function ip() {
  let networkInterfaces = os.networkInterfaces(),
    internal = [],
    external = [];

  Object.keys(networkInterfaces).forEach((key) => {
    networkInterfaces[key].forEach((item) => {
      if (item.family === 'IPv4') {
        if (item.internal) {
          internal.push(item);
        } else {
          external.push(item);
        }
      }
    });
  });

  return {
    internal: internal.length ? internal[0].address : null,
    external: external.length ? external[0].address : null
  };
}

export const apps = Object.freeze({
  /**
    * 保存应用
    * @param {String} options.name 应用名
    * @param {Number} options.port 端口号
    * @param {Number} options.pid 进程ID
    * @param {String} options.status 状态
    * @param {String} options.pathname 所在目录的路径
    * @return {Promise}
   */
  save(options) {
    let names = [];

    if (!Array.isArray(options)) {
      options = [options];
    }

    return readAppsFile()
      .then((file) => {
        let appList = file.list;

        for (let i = 0, item; item = options[i++];) {
          let {name, port, pid, status, pathname} = item,
            app = appList.find((p) => p.name === item.name);

          if (app) {
            app.port = port;
            app.pid = pid;
            app.status = status;
            app.pathname = pathname;
          } else {
            file.lastIndex += 1;
            appList.push({
              id: file.lastIndex,
              name,
              port,
              pid,
              status,
              pathname
            });
          }

          names.push(name);
        }

        return file;
      })
      .then(writeAppsFile)
      .then(() => names);
  },

  /**
   * 根据应用name, id, port查找对应的应用
   * @param  {Object|Array<Object>} options 参数
   * @param {String} optoins.name 应用名
   * @param {Number} optoins.port 端口号
   * @param {String} optoins.name 应用ID
   * @return {Promise}
   */
  find(options) {
    if (!Array.isArray(options)) {
      options = [options];
    }

    return readAppsFile()
      .then((file) => {
        let appList = file.list,
          ret = [];

        for (let i = 0, item; item = options[i++];) {
          let {name, port, id} = item;
          for (let j = 0, app; app = appList[j++];) {
            if (
              app.name === name ||
              app.port === port ||
              app.id === id
            ) {
              ret.push(app);
            }
          }
        }

        return ret;
      });
  },

  /**
   * 根据应用name, id, port删除对应的应用
   * @param  {Object|Array<Object>} options 参数
   * @param {String} optoins.name 应用名
   * @param {Number} optoins.port 应用端口号
   * @param {String} optoins.name 应用ID
   * @return {Promise}
   */
  remove(options) {
    let names = [];

    if (!Array.isArray(options)) {
      options = [options];
    }

    return readAppsFile()
      .then((file) => {
        let appList = file.list;

        for (let i = 0, item; item = options[i++];) {
          let {name, port, id} = item;

          for (let j = 0; j < appList.length; j++) {
            let app = appList[j];
            if (
              app.name === name ||
              app.port === port ||
              app.id === id
            ) {
              names.push(app.name);
              appList.splice(j, 1);
            }
          }
        }

        return file;
      })
      .then(writeAppsFile)
      .then(() => names);
  }
});

