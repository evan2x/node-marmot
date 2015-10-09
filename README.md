# Marmot

[![](https://img.shields.io/badge/node.js->=_0.12-brightgreen.svg?style=flat-square)]()

一个解析Freemarker或者velocity模板的平台。

## Install

#### Mac/Linux

```bash
sudo npm install -g marmot
```

#### Windows

> windows下您需要在管理员模式下安装

```bash
npm install -g marmot
```

## Usage

### init command

**进入项目目录下执行**

```bash
$ marmot init
```

> 项目下如果存在`.marmotrc`文件，那么会根据文件中的配置进行初始化，如果不存在 `.marmotrc` 文件，执行后会出现问答式的初始化设置，并会生成一个`.marmotrc`

1. `marmot init` 主要生成了项目所需要的服务器环境配置，如`WEB-INF`以及相关的jar包。
2. 如果您手动删除了`WEB-INF`目录，您需要再次运行`marmot init`进行项目初始化。
3. 由于`WEB-INF`目录是根据`.marmotrc`生成的，所以您在提交代码的时候，无需提交此目录。

`init`子命令参数：

* `-f, --force` 强制重新初始化当前项目的`WEB-INF`目录

### server command

**进入项目目录下执行**

```bash
$ marmot server
```

> 您可以启动多个项目，当然需要指定不同的端口。

`server`子命令参数：

* `-s, --start` 启动tomcat服务器，默认的端口是`8080`
* `-S, --stop` 停止tomcat服务器
* `-r, --restart` 重启tomcat服务器
* `-p, --port 8081` 指定端口号，该参数只在`-s, --start`参数的情况下有效
* `-c, --clean` 清理掉本地的tomcat服务器
* `-l, --list` 显示已经添加的tomcat service列表
* `-d, --delete 8080` 根据service的端口移除对应的service，你可以使用`marmot server -l`来查看当前已存在的service列表

#### Example

假设您现在有两个项目分别是`project1` 和 `project2`

```bash
#进入到prject1目录下执行
$ marmot server -s

#进入到project2目录下执行
$ marmot server -s -p 8081

#在任意目录下执行以下命令，那么所有服务都将被关闭
$ marmot server -S
```

## Router configure

在初始化项目时，会提示您输入路由文件入口的生成位置，默认是在当前项目目录下生成`router/main.xml`，如果您需要自定义文件名，请务必使用后缀为`.xml`的文件名。

- 路由中的`uri`属性支持正则模式。
- 关于正则模式配置请参考JAVA的正则表达式
- 由于XML中禁止使用`&`和`<`符号，所以`uri`中请使用`&amp;`和`&lt;`实体符号代替
- `uri`的匹配比较严格，通常是Ajax GET的时候我们不需要校验参数，那么可以在访问路径之后加上`.*`  

	```xml
	<!-- example -->
	<route uri="/users/friends\.json.*" target="/mock/users/ajax/friends.json"/>
	```

路由配置示例如下：

```xml
<!--main.xml的内容-->
<?xml version="1.0" encoding="UTF-8"?>
<router>
  <router-map>
    <!-- 路由配置，uri：访问地址，target：目标文件 -->
    <route uri="/" target="/index.vm"/>
  </router-map>
  <!-- 使用import 引入其他的router file -->
  <import src="product.xml"/>
</router>

<!-- product.xml的内容 -->
<?xml version="1.0" encoding="UTF-8"?>
<router-map>
  <route url="product/index" target="/product/index.vm"/>
</router-map>
```

**需要注意的是`<import src="xx"/>`中，引入其他路由文件的位置是相对于当前的`main.xml`文件的位置。我们建议您将所有路由统一放在同一个目录下**


## Mock data

目前我们把数据模拟分为两类：


### 针对渲染模板的数据模拟  

- 这里的`views`是模板目录，`mock`是模拟数据目录。  
- 在路由中您只需要配置访问地址指向的模板。  
- **工具会根据模板在`views`中的访问路径去`mock`目录中查找对应的模拟数据。**  
- 支持JSP/JSON两种方式模拟数据，JSP模拟数据的话通常是输出一个Map。
- 如果`mock`目录下下同时存在`xxx.jsp`和`xxx.json`两个同名的文件，那么会优先使用`xxx.jsp`模拟的数据。

> 此思路参考自 [jello](https://github.com/fex-team/jello)

示例：

```
#URI访问路径
/product

#模板路径
views/product/index.vm

#模拟数据的路径
mock/product/index.json

#树形结构对应关系
proj/
	views/
		product/
			index.vm
	mock/
		product/
			index.json
```

```xml
<!-- 路由配置 -->
<route uri="/product" target="/product/index.vm"/>
```

### 针对Ajax接口的数据模拟

- 与模板数据模拟不同的是，Ajax接口的路由，`target`直接指向json数据的访问路径。  
- **注意：`target`指向模板时，路径不需要加`views`目录，而`target`指向json数据时，路径需要加上`mock`目录**
- Ajax接口的数据模拟也支持JSP模式，和模板数据模拟不同的是，这里的JSP不是输出一个Map，而是输出一个JSON格式的字符串

示例：

```
#Ajax访问路径
/users/detail.json?uid=123&token=CDKS1232D92JD1

#Ajax模拟数据的路径
mock/users/ajax/user.json

#树形目录结构
proj/
	users/
		ajax/
			user.json
```

```xml
<!-- 路由配置 -->
<route uri="/users/detail\.json\?uid=\d+&amp;token=\w+" target="/mock/users/ajax/user.json"/>
```
