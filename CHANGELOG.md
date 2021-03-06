# Marmot ChangeLog

# 1.0.0-alpha.0

* 不再支持通过应用名操作对应的服务
* 移除`server`命令下的 `-a, --app`参数

# 0.6.7

* 使用JDK 7重新构建java-marmot

# 0.6.6

* 修复执行`restart`命令时的异常错误
* 修复velocity模版引入外部macro文件后再次修改macro内容时无法生效的问题
* 移除全局宏的配置项，直接使用#parse指令引入macro即可

# 0.6.5

* 修复java-marmot的空指针异常错误 

# 0.6.4

* 废弃provider属性，请使用proxy代替
* 修复routes标签中设置的proxy属性会传递到同级元素的下一个routes标签的问题

# 0.6.3

* 修复个别情况下marmot解析应用配置异常的问题

# 0.6.0

* 修复`marmot server ls`命令打印出错

# 0.6.0-rc.7

* 修复进程被杀掉后，`marmot server ls` 状态显示错误的问题

# 0.6.0-rc.6

* 修复路由的无限重定向Bug

# 0.6.0-rc.5

* Velocity模版增加可配置的全局宏

# 0.6.0-rc.4

* 支持在 `location/redirect` 属性中使用 `$1, $2, $n` 的方式来引用 `rule` 属性中的捕获组，如下示例：

路由配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<router>
  <routes>
	<route rule="/foo/(\w+).html" location="/foo/$1.vm" />
  </routes>
</router>
```

```
请求地址：
http://127.0.0.0:8080/foo/bar.html

实际访问模版：
/foo/bar.vm
```

得益于 `rule` 属性支持正则的特性，我们可以通过正则中的 **捕获组`()` ** 来实现在`location`属性中使用 `$1, $2, $n` 的方式来获取捕获组的值，如果要跳过某些分组不匹配则使用 **非捕获组`(?:)`** 来进行匹配，其中 `$0` 表示整个匹配的字符串，`$1` 表示第一个捕获组，`$2` 表示第二个捕获组，以此类推。


# 0.6.0-rc.3

* 在启动项目前先检查项目是否初始化。

# 0.6.0-rc.2

* Bugfix

# 0.6.0-rc.1

* 调整代码风格
* 当Jetty出错时打印错误明细
* 更新依赖模块版本

# 0.6.0-beta.2

* 参数 `-n, --name` 改为 `-a, --app`。
* `stop` 命令在未指定任何参数的情况下，则以当前所在目录的名称作为应用名来关闭应用。
* `start` 命令启动时打印本地访问地址及外部访问地址。
* 代码优化。

# 0.6.0-alpha.6

* bugfix and optimize code

# 0.6.0-alpha.3

* bugfix

# 0.6.0-alpha.1

* Servlet容器由Tomcat改为Jetty，默认支持JSP, JSTL, EL。
* marmot server命令重构，将原有以参数形式的启动方式改为命令的方式。
* 由于使用的是嵌入式的Jetty，所以`--clean`参数已经移除。
* `marmot server --start` 改为 `marmot server start`
* `marmot server --stop` 改为 `marmot server stop`
* `marmot server --list` 改为 `marmot server list`
* `marmot server --delete` 改为 `marmot server remove`
* 移除 `--restart` 参数
* 增加`-n, --name` 参数用于指定服务名
* 增加`-i, --id` 参数用于指定服务ID
* 路由文件中由原`<route-map>`标签改为`<routes>`，但同时兼容，建议使用`<routes>`
* 路由增加代理功能，`<router>`, `<routes>`, `<route>` 标签均具有 `provider` 属性，该属性会继承，即 `route` 继承 `routes` 继承 `router`。
* 路由增加支持 `cookie` 设置。
* 增加由marmot代理发出的请求，HTTP Headers中会包含 `X-Requested-With: MarmotHttpRequest`。
* 当没有输入任何子命令时，打印帮助信息。

# 0.5.0

* release 0.5.0

# 0.5.0-beta.4

* 更新至 ESLint 2.x
* 优化代码

# 0.5.0-beta.2

* 修复路由偶尔无法解析的问题

# 0.5.0-beta.1

* 重写JAVA部分实现，优化JAVA部分的代码。
* 增加远程模拟数据，即请求转发功能。
* 路由规则原`uri`属性改为`rule`，`target`属性改为`location`，`uri`与`target`仍被保留，为了向下兼容
* 更详细的说明文档

# 0.4.0-alpha.7

* 调整tomcat部分启动脚本
* marmot java部分调整

# 0.4.0-alpha.5

* 修复windows关闭不了service的问题
* `marmot init -f`由原本的仅删除`web.xml`文件改为删除整个`WEB-INF`目录
* 对非正常路由的容错处理，如路由地址为`///user//info.html`将被修正为`/user/info.html`进行处理
* 对路由文件结构进行严格检查，所有`<route uri="..." target="...">`配置必须包含在`<route-map>`标签中
* 路由匹配改为仅匹配`URL`(原为匹配完整的路由，如包含了queryString的URL)
* Marmot JAVA部分编译环境由`JDK8`降级为`JDK7`

# 0.4.0-alpha.4

* 修复velocity初始化失败的问题

# 0.4.0-alpha.3

* 更新版本号

# 0.4.0-alpha.2

* 执行 `tomcat` 脚本由原 `exec` 改为 `spawn` 执行

# 0.4.0-alpha.1

* 修复`marmot server -S`关闭不掉服务的问题
* 调整代码风格
* 增加velocity toolbox.xml支持

# v0.3.6

* 移除 `console.log`

# v0.3.5

* 修复 `marmot server -l` 报错的 `bug`

# v0.3.4

* 优化代码中使用的 `ECMAScript 2015` 语法

# v0.3.3

* 当JAVA的环境变量 `JAVA_HOME` 或者 `JRE_HOME` 全部未设置的时候，给出错误提示

# v0.3.2

* 修复`marmot server -d [port]`命令在未找到端口号匹配的service时，执行错误的问题

# v0.3.1

* 修改`marmot server`中参数`-d, --delete`以端口号删除service
* 开放至公网，将依赖的`tar.gz`文件放到`http://www.codershow.com`

# v0.3.0

* 修改`server`子命令的`-r, --remove`参数为`-d, --delete`用于根据service名删除对应的service配置
* `server`子命令增加`-r, --restart`参数用于重启服务
* 修复`init`子命令在初始化配置模板引擎未生效的bug
* 梳理启动tomcat的检查顺序
* 修复tomcat在启动时候出现同样端口的bug
* 增加读取`server.xml`的方法

# v0.2.1

* 调整`server`子命令的`-r, --remove`参数在未找到service情况下的提示信息

# v0.2.0

* `server`子命令增加`-l, --list`参数，用于显示当前的service列表
* `server`子命令增加`-r, --remove`参数，用于根据service名删除对应的service配置
* 修正`-c, --clean`参数在执行后，未关闭tomcat的问题
* 将常量抽取出来形成一个统一存放常量的文件
* 修复了一些其他的bug

# v0.1.0

* `init`子命令增加`-f, --force`参数，用于强制重置当前目录的WEB-INF配置.
* `server`子命令增加`-c, --clean`参数用于清空已配置的tomcat服务器.
* 相关的`tar`文件改为gzip压缩的方式，减小需要下载的文件体积.
* 增加`start`和`stop`的互斥性判断.
