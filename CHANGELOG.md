# Marmot ChangeLog

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
