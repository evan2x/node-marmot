/**
 * 创建web.xml格式的参数配置
 * @param  {Object} params 参数表
 * @return {String}
 */
function createXMLParams(params) {
  let fragment = '';

  // eslint-disable-next-line no-restricted-syntax
  for (let key in params) {
    // eslint-disable-next-line no-prototype-builtins
    if (params.hasOwnProperty(key)) {
      fragment += (`
        <init-param>
          <param-name>${key}</param-name>
          <param-value>${params[key]}</param-value>
        </init-param>
      `);
    }
  }
  return fragment;
}

/**
 * 生成freemarker的配置
 * @param  {Object} params
 * @return {String}
 */
function freemarker(params) {
  return createXMLParams({
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
function velocity(params) {
  return (
    `input.encoding = UTF-8
output.encoding = UTF-8
resource.loader = webapp
webapp.resource.loader.class = org.apache.velocity.tools.view.WebappResourceLoader
webapp.resource.loader.path = ${params.template}
webapp.resource.loader.cache = false
webapp.resource.loader.modificationCheckInterval = 0
tools.view.servlet.layout.directory = /
velocimacro.library.autoreload = true
velocimacro.permissions.allow.inline.to.replace.global = true`
  );
}

/**
 * 路由配置示例
 * @type {String}
 */
const router = (
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
function servlet(params) {
  const props = {};
  let className = '';
  let fragment = '';

  switch (params.name) {
    case 'velocity':
      props['org.apache.velocity.properties'] = '/WEB-INF/velocity.properties';

      if (params.tools) {
        props['org.apache.velocity.tools'] = params.tools;
      }

      fragment = createXMLParams(props);
      className = 'org.apache.velocity.tools.view.VelocityLayoutServlet';
      break;

    case 'freemarker':
      fragment = freemarker(params);
      className = 'freemarker.ext.servlet.FreemarkerServlet';
      break;
    default:
      return '';
  }

  return (
    `<servlet>
      <servlet-name>${params.name}</servlet-name>
      <servlet-class>${className}</servlet-class>
      ${fragment}
    </servlet>
    <servlet-mapping>
      <servlet-name>${params.name}</servlet-name>
      <url-pattern>*${params.extension}</url-pattern>
    </servlet-mapping>`
  );
}

module.exports = {
  createXMLParams,
  velocity,
  router,
  servlet
};
