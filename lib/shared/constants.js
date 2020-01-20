const path = require('path');

/**
 * 当前工作目录
 * @type {String}
 */
const CWD = process.cwd();

/**
 * 用户家目录
 * @type {String}
 */
const HOME = process.env.HOME || process.env.USERPROFILE;

/**
 * marmot 安装的位置
 * @type {String}
 */
const MARMOT_PATH = path.resolve(__dirname, '../../');

/**
 * embedded jetty server
 * @type {String}
 */
const JETTY_PATH = path.join(MARMOT_PATH, 'vendor/embedded-jetty-server-standalone.jar');

/**
 * mamrot 所有应用的启动配置文件
 * @type {String}
 */
const MARMOT_APPS_PATH = path.join(HOME, '.marmot/apps.json');

/**
 * marmot 当前应用配置文件
 * @type {String}
 */
const CONFIG_PATH = path.join(CWD, '.marmotrc');

/**
 * web.xml文件
 * @type {String}
 */
const WEB_XML_PATH = path.join(CWD, 'WEB-INF/web.xml');

/**
 * 项目相关的jar包目录
 * @type {String}
 */
const LIB_PATH = path.join(CWD, 'WEB-INF/lib');

/**
 * velocity配置文件的路径
 * @type {String}
 */
const VELOCITY_CONFIG_FILE = path.join(CWD, 'WEB-INF/velocity.properties');

/**
 * velocity gzip文件
 * @type {String}
 */
const VELOCITY_FILE = path.join(MARMOT_PATH, 'vendor/velocity.tar.gz');

/**
 * freemarker jar包名
 * @type {String}
 */
const FREEMARKER_NAME = 'freemarker-2.3.23.jar';

/**
 * freemarker jar包
 * @type {String}
 */
const FREEMARKER_FILE = path.join(MARMOT_PATH, 'vendor', FREEMARKER_NAME);

/**
 * marmot gzip文件
 * @type {String}
 */
const MARMOT_INIT_FILE = path.join(MARMOT_PATH, 'vendor/marmot.tar.gz');

/**
 * web.xml中filter tag
 * @type {String}
 */
const FILTER_TAG = 'filter';

/**
 * web.xml中filter-name tag
 * @type {String}
 */
const FILTER_NAME_TAG = 'filter-name';

/**
 * web.xml中filter-mapping tag
 * @type {String}
 */
const FILTER_MAPPING_TAG = 'filter-mapping';

/**
 * web.xml中mock filter的name
 * @type {String}
 */
const MOCK_FILTER = 'MockFilter';

/**
 * web.xml中rewrite filter的name
 * @type {String}
 */
const REWRITE_FILTER = 'RewriteFilter';

module.exports = {
  CWD,
  HOME,
  MARMOT_PATH,
  JETTY_PATH,
  MARMOT_APPS_PATH,
  CONFIG_PATH,
  WEB_XML_PATH,
  LIB_PATH,
  VELOCITY_CONFIG_FILE,
  VELOCITY_FILE,
  FREEMARKER_FILE,
  MARMOT_INIT_FILE,
  FILTER_TAG,
  FILTER_NAME_TAG,
  FILTER_MAPPING_TAG,
  MOCK_FILTER,
  REWRITE_FILTER
};
