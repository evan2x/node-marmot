
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
  MARMOT_SERVICES_PATH
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
 * 读取projects文件, 返回一个plain object
 * @return {Object}
 */
export function readServicesFile() {
  return new Promise((resolve, reject) => {
    let dirname = path.dirname(MARMOT_SERVICES_PATH);
    if (!fs.existsSync(dirname)) mkdirp.sync(dirname);

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
    let dirname = path.dirname(MARMOT_SERVICES_PATH);
    if (!fs.existsSync(dirname)) mkdirp.sync(dirname);

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
  }
}

export const service = Object.freeze({
  /**
    * 保存服务
    * @param {String} options.name 项目名
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

    return readServicesFile()
      .then((services) => {
        let projects = services.projects;

        for (let i = 0, item; item = options[i++];) {
          let {name, port, pid, status, pathname} = item,
            project = projects.find((p) => p.name === item.name);

          if (project) {
            project.port = port;
            project.pid = pid;
            project.status = status;
            project.pathname = pathname;
          } else {
            services.lastIndex += 1;
            projects.push({
              id: services.lastIndex,
              name,
              port,
              pid,
              status,
              pathname
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
              project.name === name ||
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

