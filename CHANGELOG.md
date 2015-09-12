# Marmot ChangeLog

---

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
