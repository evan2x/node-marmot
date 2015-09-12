
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
export const USERHOME = process.env.HOME || process.env.USERPROFILE;

/**
 * marmot配置文件
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
export const VELOCITY_PATH = path.join(CWD, 'WEB-INF/velocity.properties');

/**
 * tomcat
 * @type {String}
 */
export const TOMCAT_PATH = path.join(USERHOME, '.__tomcat__');

/**
 * tomcat配置文件
 * @type {String}
 */
export const SERVER_CONFIG_PATH = path.join(TOMCAT_PATH, 'conf/server.xml');

/**
 * tomcat是否启动的标识文件
 * @type {String}
 */
export const TOMCAT_START_IDENTIFIER = path.join(TOMCAT_PATH, 'identifier');

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
