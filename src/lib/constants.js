
import path from 'path';

/**
 * 当前命令执行的目录
 * @type {String}
 */
export const CWD = process.cwd();

/**
 * 用户家目录
 * @type {String}
 */
export const HOME = process.env.HOME || process.env.USERPROFILE;

/**
 * marmot 安装的位置
 * @type {String}
 */
export const MARMOT_PATH = path.resolve(__dirname, '../');

/**
 * embedded jetty server
 * @type {String}
 */
export const JETTY_PATH = path.join(MARMOT_PATH, 'vendor/embedded-jetty-server-standalone.jar');

/**
 * mamrot 所有应用的启动配置文件
 * @type {String}
 */
export const MARMOT_APPS_PATH = path.join(HOME, '.marmot/apps.json');

/**
 * marmot 当前应用配置文件
 * @type {String}
 */
export const CONFIG_PATH = path.join(CWD, '.marmotrc');

/**
 * web.xml文件
 * @type {String}
 */
export const WEB_XML_PATH = path.join(CWD, 'WEB-INF/web.xml');

/**
 * 项目相关的jar包目录
 * @type {String}
 */
export const LIB_PATH = path.join(CWD, 'WEB-INF/lib');

/**
 * velocity配置文件的路径
 * @type {String}
 */
export const VELOCITY_CONFIG_FILE = path.join(CWD, 'WEB-INF/velocity.properties');

/**
 * velocity gzip文件
 * @type {String}
 */
export const VELOCITY_FILE = path.join(MARMOT_PATH, 'vendor/velocity.tar.gz');

/**
 * freemarker jar包名
 * @type {String}
 */
export const FREEMARKER_NAME = 'freemarker-2.3.23.jar';

/**
 * freemarker jar包
 * @type {String}
 */
export const FREEMARKER_FILE = path.join(MARMOT_PATH, 'vendor', FREEMARKER_NAME);

/**
 * marmot gzip文件
 * @type {String}
 */
export const MARMOT_INIT_FILE = path.join(MARMOT_PATH, 'vendor/marmot.tar.gz');

/**
 * web.xml中filter tag
 * @type {String}
 */
export const FILTER_TAG = 'filter';

/**
 * web.xml中filter-name tag
 * @type {String}
 */
export const FILTER_NAME_TAG = 'filter-name';

/**
 * web.xml中filter-mapping tag
 * @type {String}
 */
export const FILTER_MAPPING_TAG = 'filter-mapping';

/**
 * web.xml中mock filter的name
 * @type {String}
 */
export const MOCK_FILTER = 'MockFilter';

/**
 * web.xml中rewrite filter的name
 * @type {String}
 */
export const REWRITE_FILTER = 'RewriteFilter';
