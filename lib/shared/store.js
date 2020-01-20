const { readAppsFile, writeAppsFile } = require('./util');
const { CWD } = require('./constants');

/**
  * 保存应用
  * @param  {Object} options 参数
  * @param {String} options.domain 域名
  * @param {Number} options.port 端口号
  * @param {Number} options.pid 进程ID
  * @param {String} options.status 状态
  * @return {Promise<Object>}
  */
function save(options) {
  if (options == null) {
    return Promise.resolve(null);
  }

  let webapp = null;

  return readAppsFile()
    .then((file) => {
      const webapps = file.list;
      const {
        id, domain = '', port, pid, status
      } = options;
      webapp = webapps.find((o) => o.id === id || o.pathname === CWD);

      if (webapp) {
        webapp.domain = domain;
        webapp.port = port;
        webapp.pid = pid;
        webapp.status = status;
      } else {
        file.lastIndex += 1;
        webapp = {
          id: file.lastIndex,
          domain,
          port,
          pid,
          status,
          pathname: CWD
        };

        webapps.push(webapp);
      }

      return file;
    })
    .then(writeAppsFile)
    .then(() => webapp);
}

/**
 * 根据应用id, port查找对应的应用, 如果不传参数则通过当前工作目录查找对应的webapp
 * @param  {Object} options 参数
 * @param {String} optoins.id 应用ID
 * @param {Number} optoins.port 端口号
 * @return {Promise<Object>}
 */
function findOne(options) {
  if (options == null) {
    options = {};
  }
  
  return readAppsFile()
    .then((file) => {
      const webapps = file.list;
      const { id, port } = options;

      for (let i = 0, webapp; webapp = webapps[i++];) {
        if (
          webapp.id === id
          || webapp.port === port
          || webapp.pathname === CWD
        ) {
          return webapp;
        }
      }

      return null;
    });
}

/**
 * 根据应用id, port删除对应的应用
 * @param  {Object} options 参数
 * @param {String} optoins.id 应用ID
 * @param {Number} optoins.port 应用端口号
 * @return {Promise<Object>}
 */
function remove(options) {
  if (options == null) {
    return Promise.resolve(null);
  }

  let webapp = null;

  return readAppsFile()
    .then((file) => {
      const webapps = file.list;
      const { id, port } = options;

      for (let i = 0; i < webapps.length; i++) {
        webapp = webapps[i];

        if (
          webapp.id === id
          || webapp.port === port
        ) {
          webapps.splice(i, 1);
          break;
        } else {
          webapp = null;
        }
      }

      return file;
    })
    .then(writeAppsFile)
    .then(() => webapp);
}

module.exports = {
  save,
  findOne,
  remove
};
