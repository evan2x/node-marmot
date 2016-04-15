# Marmot ChangeLog

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
