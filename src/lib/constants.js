/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description Marmot constants
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/08/03
 */

import path from 'path';

/**
 * 当前命令执行的目录
 * @type {String}
 */
export const CWD = process.cwd();

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
 * tomcat gzip文件
 * @type {String}
 */
export const TOMCAT_FILE = path.resolve(__dirname, '..', 'vendor/tomcat.tar.gz');

/**
 * velocity gzip文件
 * @type {String}
 */
export const VELOCITY_FILE = path.resolve(__dirname, '..', 'vendor/velocity.tar.gz');

/**
 * freemarker gzip文件
 * @type {String}
 */
export const FREEMARKER_FILE = path.resolve(__dirname, '..', 'vendor/freemarker.tar.gz');

/**
 * marmot gzip文件
 * @type {String}
 */
export const MARMOT_INIT_FILE = path.resolve(__dirname, '..', 'vendor/marmot.tar.gz');

/**
 * tomcat
 * @type {String}
 */
export const TOMCAT_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.__tomcat__');

/**
 * tomcat配置文件
 * @type {String}
 */
export const SERVER_CONFIG_PATH = path.join(TOMCAT_PATH, 'conf/server.xml');

/**
 * tomcat pid文件
 * @type {String}
 */
export const TOMCAT_PID = path.join(TOMCAT_PATH, '__pid__');

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
