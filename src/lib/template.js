/**
 * Copyright 2015 creditease Inc. All rights reserved.
 * @description marmot template file
 * @author evan2x(evan2zaw@gmail.com/aiweizhang@creditease.cn)
 * @date  2015/07/27
 */
import * as _ from './helper';

/**
 * 生成freemarker的配置
 * @param  {Object} params
 * @return {String}
 */
function freemarker(params) {
    return _.serializeXMLParams({
        tag_syntax: params.tagSyntax,
        TemplatePath: params.template,
        template_update_delay: 0,
        NoCache: true,
        default_encoding: params.encoding
    });
}

/**
 * 生成velocity配置
 * @param  {Object} params
 * @return {String}
 */
export function velocity(params) {

    return (
`input.encoding = ${params.encoding}
output.encoding = ${params.encoding}
resource.loader = webapp
webapp.resource.loader.class = org.apache.velocity.tools.view.servlet.WebappLoader
webapp.resource.loader.path = /${params.template}
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
      <router-map>
        <!-- 路由配置，uri：访问地址，target：目标文件 -->
        <!-- <route uri="/" target="/index.vm"/> -->
      </router-map>
      <!-- 使用import 引入其他的router file -->
      <!-- <import src="product.xml"/> -->
    </router>`
);

/**
 * 生成一个tomcat service
 * @param  {Object} conf 配置文件
 * @return {String}
 */
export function service(conf) {
    return (
        `<Service name="${conf.name}">
           <Connector port="${conf.port}" protocol="HTTP/1.1"
                       connectionTimeout="20000"
                       redirectPort="8443"
                       compression="on"
                       compressionMinSize="2048"
                       compressableMimeType="text/html,text/xml,text/css,text/plain,text/javascript,application/javascript" />
           <Engine name="${conf.name}" defaultHost="localhost">
             <Host name="localhost"  appBase="${conf.dir}" unpackWARs="true" autoDeploy="true">
               <Context path="" docBase="${conf.name}" />
               <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs" prefix="localhost_access_log" suffix=".txt" pattern="%h %l %u %t &quot;%r&quot; %s %b" />
             </Host>
           </Engine>
        </Service>`
    );
}

/**
 * 生成servlet配置
 * @param  {Object} params
 * @return {String}
 */
export function servlet(params) {
    var className = '',
        fragment = '';

    switch(params.name) {

    case 'velocity':
        fragment = _.serializeXMLParams({
            'org.apache.velocity.properties': '/WEB-INF/velocity.properties'
        });
        className = 'org.apache.velocity.tools.view.VelocityLayoutServlet';
        break;

    case 'freemarker':
        fragment = freemarker(params);
        className = 'freemarker.ext.servlet.FreemarkerServlet';
        break;
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
