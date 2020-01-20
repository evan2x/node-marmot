const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const cheerio = require('cheerio');
const { pd } = require('pretty-data');
const chalk = require('chalk');
const del = require('del');
const tar = require('tar');
const util = require('./shared/util');
const questions = require('./shared/questions');
const tmpl = require('./shared/template');
const {
  CWD,
  CONFIG_PATH,
  WEB_XML_PATH,
  LIB_PATH,
  VELOCITY_CONFIG_FILE,
  FILTER_TAG,
  FILTER_NAME_TAG,
  FILTER_MAPPING_TAG,
  MOCK_FILTER,
  REWRITE_FILTER,
  MARMOT_INIT_FILE,
  VELOCITY_FILE,
  FREEMARKER_FILE,
  FREEMARKER_NAME
} = require('./shared/constants');

/**
 * 添加相关配置
 * 1.marmot filter配置mock目录和router文件指定
 * 1.过滤器中添加url-pattern
 * @param  {Object} $
 * @param  {Object} answers
 */
function configureAbout($, answers) {
  const filters = $(FILTER_TAG);
  const filterMappingNames = $(FILTER_NAME_TAG, FILTER_MAPPING_TAG);
  const extensions = [answers.vextension, answers.fextension];

  // filter中添加配置项
  filters.each((index, item) => {
    const $item = $(item);
    const filterName = $item.children(FILTER_NAME_TAG).text();

    if (filterName === REWRITE_FILTER) {
      $item.append(tmpl.createXMLParams({
        routerFile: answers.router
      }));
    }

    if (filterName === MOCK_FILTER) {
      $item.append(tmpl.createXMLParams({
        mockDir: answers.mock
      }));
    }
  });

  // filter-mapping中的MockFilter添加url-pattern
  filterMappingNames.each((index, item) => {
    const $item = $(item);

    if ($item.text() === MOCK_FILTER) {
      extensions.forEach((extension) => {
        if (extension) {
          $item.after($('<url-pattern>').text(`*${extension}`));
        }
      });
    }
  });
}

/**
 * 初始化设置web.xml
 * @param  {Object} answers
 */
function initWebXML(answers) {
  const { engines } = answers;

  /**
   * 载入web.xml文件
   * @type {Object}
   */
  const $ = cheerio.load(fs.readFileSync(WEB_XML_PATH, 'utf-8'), {
    normalizeWhitespace: true,
    xmlMode: true
  });

  configureAbout($, answers);

  // 解压并配置velocity模板引擎
  if (engines.includes('velocity')) {
    let useTools = false;

    if (answers.tools) {
      useTools = true;
      const toolsFile = path.join(CWD, answers.tools);

      if (!fs.existsSync(toolsFile)) {
        useTools = false;
        console.warn(
          chalk.yellow('[i] The %s file does not exist in the current directory, if you want to force the creation of %s file, execute the \'marmot init -f\' command again'),
          answers.tools,
          answers.tools
        );
      }
    }

    tar.extract({
      file: VELOCITY_FILE,
      cwd: LIB_PATH,
      strip: 1
    })
      .then(() => {
        const data = {
          name: 'velocity',
          extension: answers.vextension
        };

        if (useTools) {
          data.tools = answers.tools;
        }

        $(FILTER_MAPPING_TAG).last().after(tmpl.servlet(data));

        if (answers.template) {
          answers.template = util.addLeadingSlash(answers.template);
        }

        const vconf = tmpl.velocity(answers);

        fs.writeFileSync(VELOCITY_CONFIG_FILE, vconf);
        fs.writeFileSync(WEB_XML_PATH, pd.xml($.html()));
        console.log(chalk.green('[√] Velocity initialized is complete'));
      });
  }

  // 配置freemarker模板引擎
  if (engines.includes('freemarker')) {
    const target = path.join(LIB_PATH, FREEMARKER_NAME);

    fs.createReadStream(FREEMARKER_FILE)
      .pipe(fs.createWriteStream(target))
      .on('close', () => {
        const servlet = tmpl.servlet({
          name: 'freemarker',
          extension: answers.fextension,
          tagSyntax: answers.tagSyntax,
          template: answers.template
        });

        $(FILTER_MAPPING_TAG).last().after(servlet);
        fs.writeFileSync(WEB_XML_PATH, pd.xml($.html()));
        console.log(chalk.green('[√] Freemarker initialized is complete'));
      });
  }
}

/**
 * 初始化项目
 * @param  {Object} answers
 */
function initProject(data) {
  const exists = fs.existsSync;
  let answers = data;

  // 配置文件存在的话，读取后合并当前answers
  if (exists(CONFIG_PATH)) {
    answers = {
      ...util.readRCFile(),
      data
    };
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(answers, null, 2));

  // 创建mock数据目录
  if (!exists(answers.mock)) {
    mkdirp.sync(answers.mock);
  }

  // 创建template存放目录
  if (!exists(answers.template)) {
    mkdirp.sync(answers.template);
  }

  const ROUTER_PATH = path.join(CWD, answers.router);

  // 不存在则创建路由文件
  if (!exists(ROUTER_PATH)) {
    mkdirp.sync(path.dirname(ROUTER_PATH));
    fs.writeFileSync(ROUTER_PATH, pd.xml(tmpl.router));
  }

  // 创建WEB-INF目录
  if (exists(WEB_XML_PATH)) {
    console.warn(chalk.yellow('[i] WEB-INF directory already exists in the current directory, if you want to force initialize, do \'marmot init -f\''));
  } else {
    tar.extract({
      file: MARMOT_INIT_FILE,
      cwd: CWD,
      strip: 0
    })
      .then(() => {
        initWebXML(answers);
      });
  }
}

module.exports = (command) => {
  let config = {};

  /**
   * 根据key过滤数组中与name不同的数据
   * @param  {Array} arr
   * @param  {String} key
   * @return {Array}
   */
  const remove = (arr, key) => arr.filter((item) => item.name !== key);

  /**
   * 子问题
   * @param  {Array}   engines
   * @param  {Object} answers
   * @return {Promise}
   */
  const subPrompt = (engines, answers = {}) => {
    let subq = [];

    // velocity questions
    if (engines.includes('velocity')) {
      subq = [...subq, ...questions.velocity];
    }

    // freemarker questions
    if (engines.includes('freemarker')) {
      subq = [...subq, ...questions.freemarker];
    }

    if (subq.length > 0) {
      return inquirer
        .prompt(subq)
        .then((subAnswers) => ({
          ...answers,
          ...subAnswers
        }));
    }

    return Promise.resolve(answers);
  };

  if (command.force) {
    del.sync(path.dirname(WEB_XML_PATH), { force: true });
  }

  if (fs.existsSync(CONFIG_PATH)) {
    config = util.readRCFile();
  }

  // 过滤已经回答过的问题
  // eslint-disable-next-line no-restricted-syntax
  for (let key in config) {
    // eslint-disable-next-line no-prototype-builtins
    if (config.hasOwnProperty(key)) {
      questions.common = remove(questions.common, key);
      questions.velocity = remove(questions.velocity, key);
      questions.freemarker = remove(questions.freemarker, key);
    }
  }

  // common questions
  if (questions.common.length > 0) {
    inquirer.prompt(questions.common)
      .then((answers) => subPrompt(answers.engines || config.engines, answers))
      .then(initProject);

  // freemarker and velocity questions
  } else if (questions.freemarker.length > 0 || questions.velocity.length > 0) {
    subPrompt(config.engines).then(initProject);

  // use .marmotrc config
  } else {
    initProject(config);
  }
};
