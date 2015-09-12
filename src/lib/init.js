/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description marmot init command
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */

import fs from 'fs';
import path from 'path';

import inquirer from 'inquirer';
import mkdirp from 'mkdirp';
import cheerio from 'cheerio';
import { pd } from 'pretty-data';
import del from 'del';

import * as _ from './helper';
import * as q from './questions';
import * as tmpl from './template';
import pkg from '../package.json';

import {
    CWD,
    CONFIG_PATH,
    WEB_XML_PATH,
    LIB_PATH,
    VELOCITY_PATH,
    FILTER_TAG,
    FILTER_NAME_TAG,
    FILTER_MAPPING_TAG,
    MOCK_FILTER,
    REWRITE_FILTER
} from './constant';

/**
 * 初始化项目
 * @param  {Object} answers
 */
function initProject(answers) {
    let exists = fs.existsSync;

    // 配置文件存在的话，读取后合并当前answers
    if(exists(CONFIG_PATH)){
        answers = Object.assign(_.readRCFile(), answers);
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(answers, null, 2));

    // 创建mock数据目录
    if(!exists(answers.mock)){
        mkdirp.sync(answers.mock);
    }

    // 创建template存放目录
    if(!exists(answers.template)){
        mkdirp.sync(answers.template);
    }

    const ROUTER_PATH = path.join(CWD, answers.router);
    // 创建路由文件
    if(!exists(ROUTER_PATH)){
        mkdirp.sync(path.dirname(ROUTER_PATH));
        fs.writeFileSync(ROUTER_PATH, pd.xml(tmpl.router));
    }

    // 创建WEB-INF目录
    if(!exists(WEB_XML_PATH)){
        _.download(pkg._marmot)
        .then(file => _.untargz({
            pack: file,
            target: CWD
        }))
        .then(() => {
            initWebXML(answers);
        });
    }
}

/**
 * 初始化设置web.xml
 * @param  {Object} answers
 */
function initWebXML(answers) {
    let engines = answers.engines,
        servlet = '',
        /**
         * 载入web.xml文件
         * @type {Object}
         */
        $ = cheerio.load(fs.readFileSync(WEB_XML_PATH).toString(), {
            normalizeWhitespace: true,
            xmlMode: true
        }),

        /**
         * 下载模板引擎并解压
         * @param  {String} src
         * @return {Promise}
         */
        fetch = src => {
            return _.download(src)
                .then(file => _.untargz({
                    pack: file,
                    target: LIB_PATH,
                    strip: 1
                }));
        };

    otherConfiguration($, answers);

    // 下载及配置velocity
    if(~engines.indexOf('velocity')){
        fetch(pkg._velocity)
        .then(() => {
            servlet = tmpl.servlet({
                name: 'velocity',
                suffix: answers.vsuffix
            });
            $(FILTER_MAPPING_TAG).last().after(servlet);

            // 创建velocity配置文件
            let vconf = tmpl.velocity(answers);
            fs.writeFileSync(VELOCITY_PATH, vconf);
        });
    }

    // 下载及配置freemarker
    if(~engines.indexOf('freemarker')){
        fetch(pkg._freemarker)
        .then(() => {
            servlet = tmpl.servlet({
                name: 'freemarker',
                suffix: answers.fsuffix,
                tagSyntax: answers.tagSyntax,
                template: answers.template,
                encoding: answers.encoding
            });

            $(FILTER_MAPPING_TAG).last().after(servlet);
        });
    }
    
    // 更新web.xml文件
    fs.writeFileSync(WEB_XML_PATH, pd.xml($.html()));
}

/**
 * 添加相关配置
 * 1.marmot filter配置mock目录和router文件指定
 * 1.过滤器中添加url-pattern
 * @param  {Object} $
 * @param  {Object} answers
 */
function otherConfiguration($, answers) {
    let filters = $(FILTER_TAG),
        filterMappingNames = $(FILTER_NAME_TAG, FILTER_MAPPING_TAG),
        suffixs = [answers.vsuffix, answers.fsuffix];

    // filter中添加配置项
    filters.each((index, item) => {
        let $item = $(item);

        switch ($item.children(FILTER_NAME_TAG).text()) {
            case REWRITE_FILTER:
                $item.append(_.serializeXMLParams({
                    routerFile: answers.router
                }));
                break;
            case MOCK_FILTER:
                $item.append(_.serializeXMLParams({
                    mockDir: answers.mock
                }));
                break;
        }
    });

    // filter-mapping中的MockFilter添加url-pattern
    filterMappingNames.each((index, item) => {
        let $item = $(item);
        if($item.text() === MOCK_FILTER){
            suffixs.forEach(suffix => {
                suffix && $item.after($('<url-pattern>').text(`*${suffix}`));
            });
        }
    });
}

export default options => {
    let config = {},

        /**
         * 根据key过滤数组中与name不同的数据
         * @param  {Array} arr
         * @param  {String} key
         * @return {Array}
         */
        remove = (arr, key) => {
            return arr.filter((item) => {
                if(item.name !== key){
                    return item;
                }
            });
        },

        /**
         * 子问题
         * @param  {Array}   engines
         * @param  {Function} done
         */
        subPrompt = (engines, done) => {
            let subq = [];

            // velocity questions
            if( ~engines.indexOf('velocity') ){
                subq = subq.concat(q.velocity);
            }

            // freemarker questions
            if( ~engines.indexOf('freemarker') ){
                subq = subq.concat(q.freemarker);
            }

            if( subq.length > 0 ){
                inquirer.prompt(subq, done);
            } else {
                done({});
            }
        };

    if(options.force){
        del.sync(WEB_XML_PATH, {force: true});
    }

    if(fs.existsSync(CONFIG_PATH)){
        config = _.readRCFile();
    }

    // 过滤已经回答过的问题
    for(let key in config){
        if(config.hasOwnProperty(key)){
            q.common = remove(q.common, key);
            q.velocity = remove(q.velocity, key);
            q.freemarker = remove(q.freemarker, key);
        }
    }

    // common questions
    if(q.common.length > 0){
        inquirer.prompt(q.common, answers => {
            subPrompt(answers.engines || config.engines, subAnswers => {
                initProject(Object.assign(answers, subAnswers));
            });
        });

    // freemarker and velocity questions
    } else if(q.freemarker.length > 0 || q.velocity.length > 0){
        subPrompt(config.engines, initProject);

    // use package.json config
    } else {
        initProject(config);
    }
};
