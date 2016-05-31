
import * as _ from './helper';

/**
 * 生成freemarker的配置
 * @param  {Object} params
 * @return {String}
 */
function freemarker(params) {
  return _.createXMLParams({
    tag_syntax: params.tagSyntax, // eslint-disable-line camelcase
    TemplatePath: params.template,
    template_update_delay: 0, // eslint-disable-line camelcase
    NoCache: true,
    default_encoding: 'UTF-8' // eslint-disable-line camelcase
  });
}

/**
 * 生成velocity配置
 * @param  {Object} params
 * @return {String}
 */
export function velocity(params) {
  return (
`input.encoding = UTF-8
output.encoding = UTF-8
resource.loader = webapp
webapp.resource.loader.class = org.apache.velocity.tools.view.WebappResourceLoader
webapp.resource.loader.path = ${params.template}
webapp.resource.loader.cache = false
webapp.resource.loader.modificationCheckInterval = 0
tools.view.servlet.layout.directory = /`
  );
}

/**
 * 路由配置示例
 * @type {String}
 */
export let router = (
  `<?xml version="1.0" encoding="UTF-8"?>
  <router>
    <routes>
      <!-- <route rule="/" location="/index.vm"/> -->
    </routes>
    <!-- <import src="product.xml"/> -->
  </router>`
);

/**
 * 生成servlet配置
 * @param  {Object} params
 * @return {String}
 */
export function servlet(params) {
  let className = '',
    fragment = '',
    props = {};

  switch (params.name) {
    case 'velocity':
      props['org.apache.velocity.properties'] = '/WEB-INF/velocity.properties';

      if (params.tools) {
        props['org.apache.velocity.tools'] = params.tools;
      }

      fragment = _.createXMLParams(props);
      className = 'org.apache.velocity.tools.view.VelocityLayoutServlet';
      break;

    case 'freemarker':
      fragment = freemarker(params);
      className = 'freemarker.ext.servlet.FreemarkerServlet';
  }

  return (
    `<servlet>
      <servlet-name>${params.name}</servlet-name>
      <servlet-class>${className}</servlet-class>
      ${fragment}
    </servlet>
    <servlet-mapping>
      <servlet-name>${params.name}</servlet-name>
      <url-pattern>*${params.suffix}</url-pattern>
    </servlet-mapping>`
  );
}

/**
 * 创建web.xml中的参数配置
 * @param  {String} key
 * @param  {String} value
 * @return {String}
 */
export function createParam(key, value) {
  return (`
    <init-param>
      <param-name>${key}</param-name>
      <param-value>${value}</param-value>
    </init-param>
    `);
}
