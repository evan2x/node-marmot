
import path from 'path';
import fs from 'fs';
import os from 'os';
// eslint-disable-next-line camelcase
import child_process from 'child_process';

import del from 'del';
import iconv from 'iconv-lite';
import chalk from 'chalk';
import mkdirp from 'mkdirp';

import {
  CONFIG_PATH,
  MARMOT_APPS_PATH
} from './constants';

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
 * 路径左侧添加斜杠
 * @param {String} p
 * @return {String}
 */
export function addLeadingSlash(p) {
  if (!p) return p;

  return p.charAt(0) === '/' ? p : `/${p}`;
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
  let space = ' ';
  let output = '';
  let placeholder = '';
  let list = [table.head, ...table.body];
  let rowWidth = [];
  let margin = space.repeat(2);

  const tableSymbols = {
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
  };

  /**
   * 分割线
   * @param  {Array}  width    单元格宽度
   * @param  {Object} mark  单元格分隔符
   * @return {String}
   */
  const breakline = (width, mark) => {
    let line = mark.l;

    for (let i = 0; i < width.length; i++) {
      line += '─'.repeat(width[i] + (margin.length * 2));
      if (i < width.length - 1) {
        line += mark.c;
      }
    }

    line += mark.r;

    return `${line}\n`;
  };

  /**
   * 创建一行数据
   * @param  {Number} type
   * @param  {Array}  data  要打印的数据
   * @param  {Array}  width 单元格宽度
   * @return {String}
   */
  const createRow = (data, width) => {
    let str = '│';

    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line prefer-template
      let cell = '' + data[i];
      let len = cell.replace(/\u001b\[\d+m/gi, '').length;

      placeholder = space.repeat(Math.max(width[i] - len, 0));
      str += `${margin}${cell}${placeholder}${margin}│`;
    }

    return `${str}\n`;
  };

  list.forEach((item) => {
    rowWidth = item.map((v, i) => {
      // eslint-disable-next-line prefer-template
      let len = ('' + v).replace(/\u001b\[\d+m/gi, '').length;

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

    if (fs.existsSync(MARMOT_APPS_PATH)) {
      del.sync(MARMOT_APPS_PATH, { force: true });
    }

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
 * 根据pid查找指定进程
 * @param  {Number} pid 进程id
 * @return {Promise}
 */
export function getProcessByPid(pid) {
  return new Promise((resolve, reject) => {
    let proc = null;
    let stdout = [];
    let stderr = [];
    const isWin = process.platform === 'win32';

    if (isWin) {
      proc = child_process.spawn('cmd', ['/c', `wmic process where ProcessId=${pid} get ProcessId,CommandLine`]);
    } else {
      proc = child_process.spawn('ps', ['-p', pid, '-o', 'pid,args']);
    }

    proc.stdout.on('data', (data) => {
      stdout.push(data);
    });

    proc.stderr.on('data', (data) => {
      stderr.push(data);
    });

    proc.on('close', () => {
      if (stderr.length > 0) {
        let err = Buffer.concat(stderr);
        reject(new Error(isWin ? err.toString() : iconv.decode(err, 'gbk')));
      } else {
        let out = Buffer.concat(stdout);

        if (isWin) {
          out = iconv.decode(out, 'gbk');
        } else {
          out = out.toString();
        }

        let rows = out.split(os.EOL).filter((row) => row && row.trim() !== '');
        resolve(rows.length >= 2 ? rows[1] : '');
      }
    });
  });
}

/**
 * 获取本地IP及外部访问IP
 * @return {Object} ip
 * @return {String} ip.internal 本地IP
 * @return {String} ip.external 外部访问IP
 */
export function ip() {
  const networkInterfaces = os.networkInterfaces();
  let internal = [];
  let external = [];

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
          let {
            name, port, pid, status, pathname
          } = item;
          let app = appList.find((p) => p.name === item.name);

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
        const appList = file.list;
        let ret = [];

        for (let i = 0, item; item = options[i++];) {
          let { name, port, id } = item;

          for (let j = 0, app; app = appList[j++];) {
            if (
              app.name === name
              || app.port === port
              || app.id === id
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
          let { name, port, id } = item;

          for (let j = 0; j < appList.length; j++) {
            let app = appList[j];

            if (
              app.name === name
              || app.port === port
              || app.id === id
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
