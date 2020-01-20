const path = require('path');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const del = require('del');
const iconv = require('iconv-lite');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const {
  CONFIG_PATH,
  MARMOT_APPS_PATH
} = require('./constants');

/**
 * 读取marmot的配置文件
 * @return {Object}
 */
function readRCFile() {
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
function addLeadingSlash(p) {
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
function printTable(table = {
  head: [],
  body: []
}) {
  const space = ' ';
  const list = [table.head, ...table.body];
  const margin = space.repeat(2);
  let output = '';
  let placeholder = '';
  let rowWidth = [];

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
function readAppsFile() {
  return new Promise((resolve, reject) => {
    const dirname = path.dirname(MARMOT_APPS_PATH);

    if (!fs.existsSync(dirname)) mkdirp.sync(dirname);

    if (fs.existsSync(MARMOT_APPS_PATH)) {
      fs.readFile(MARMOT_APPS_PATH, 'utf8', (err, data) => {
        if (err) return reject(err);

        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.warn(chalk.yellow(`The file '${MARMOT_APPS_PATH}' parsing failed`));
          console.warn(chalk.yellow('Will return an empty application list'));
          resolve({});
        }
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
function writeAppsFile(apps) {
  return new Promise((resolve, reject) => {
    const dirname = path.dirname(MARMOT_APPS_PATH);

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
function getProcessByPid(pid) {
  return new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];
    const isWin = process.platform === 'win32';
    let proc = null;

    if (isWin) {
      proc = childProcess.spawn('cmd', ['/c', `wmic process where ProcessId=${pid} get ProcessId,CommandLine`]);
    } else {
      proc = childProcess.spawn('ps', ['-p', pid, '-o', 'pid,args']);
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
function ip() {
  const networkInterfaces = os.networkInterfaces();
  const internal = [];
  const external = [];

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

module.exports = {
  readRCFile,
  addLeadingSlash,
  printTable,
  readAppsFile,
  writeAppsFile,
  getProcessByPid,
  ip
};
