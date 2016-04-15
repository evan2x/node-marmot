# Marmot

[![](https://img.shields.io/badge/node.js-%3E=_4.0-brightgreen.svg?style=flat-square)]()

一个解析velocity或者freemarker模板的平台。

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

## 依赖环境

* Node.js 4.0+
* JDK 7+

## Usage

### init 子命令

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

### server 子命令

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

## 路由配置

> 在初始化项目时，会提示您输入路由文件入口的生成位置，默认是在当前项目目录下生成`router/main.xml`，如果您需要自定义文件名，请务必使用后缀为`.xml`的文件名。

```xml
<!-- router/main.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<router>
  <import src="product.xml" />
  <route-map>
    <route rule="/" location="/index.vm" />
    <route rule="/api/v1/user.json" provider="http://127.0.0.1:3000" />
    <route rule="/user/center" render-template="/user/center.vm" provider="http://xxx.xxx.xxx" />
  </route-map>

  <route-map provider="">
    <route rule="">
  </route-map>
</router>

<!-- router/product.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<route-map>
  <route rule="/product/detail" location="/product/detail.vm" />
</route-map>
```

以上为一个简单的路由示例文件

在路由的配置中有 `import`、`router`、`route-map`、`route` 四种标签(不包括`xml`声明)，以下将逐一介绍其功能

### `import`标签

引入一个新的路由文件，该文件的路径是相对于主入口文件的。暂时不能使用绝对路径，所以建议所有路由文件统一放到同一目录下。

目录结构：

```
router/
  main.xml
  product.xml
```

路由引入方式:

```xml
<!-- main.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<router>
  <import src="product.xml">
  <!-- 等同如下方式 -->
  <import src="./product.xml">
</router>
```

### `router`标签

准确的说此标签并不会影响路由的匹配，加此标签的原因是由于XML规范中规定了XML文档必须只有一个根元素，所以在`route-map`很多的情况下或者`import`标签很多的情况下，他便成了必须要加的标签。此标签命名符合XML规范即可。

该标签为路由入口文件的根元素，由于XML规范规定必须只有一个根元素，所以建议路由入口文件加上`router`。

而通过`import`标签引入的路由文件通常是针对业务中某一单元的功能进行划分，所以`router`标签可以选择不加，不过一旦使用多个`route-map`那么您可以使用`partial-router`。

### `route-map`标签

此标签用于包含一组路由配置，路由规则的匹配仅处理`route-map`标签包含的元素，写在其他位置的路由规则将不会被匹配到。

#### `provider`属性

`provider` 指向一个可访问的地址，其作用为当规则被命中后，当前请求将被**转发**到该地址，此属性的值必须是一个有效的HTTP地址，如果不写协议类型，那么将以当前启动的`Marmot`服务的协议作为缺省值

有效的HTTP地址：

```
http://xxx.xxx.xxx
//xxx.xxx.xxx
xxx.xxx.xxx
```

值得注意的是被命中的路由规则中，`route`中的`location`~~`target`~~ 属性将会被忽略。

示例：

```xml
<route-map provider="http://x.x.x.x:3000">
  <route rule="/user/info.json" />
</route-map>
```

结果：

```
当前本地服务为
http://127.0.0.1:8080

发起请求，命中route规则
http://127.0.0.1:8080/user/info.json

实际请求地址
http://x.x.x.x:3000/user/info.json
```

### `route`标签

该标签用于配置路由规则，以下为`route`标签所支持的属性。

#### `rule`~~`uri`~~属性

`rule` 属性表示路由的匹配规则，其值可以是普通的字符串也可以是一个正则表达式，并且规则仅对URL中的路径部分进行匹配，其余部分(query string，anchor name)不会参与匹配。

`rule` 原名为 `uri`，后改为 `rule`，修改的原因是为了让其语义更加明确，虽然目前为止依旧可以使用`uri`，但强烈建议使用 `rule`。

```xml
<!-- 推荐 -->
<route rule="/xxx" location="xxx.vm">
<!-- 不推荐 -->
<route uri="/xxx" location="xxx.vm">
```

#### `location`~~`target`~~属性

`location` 属性表示该规则命中后，指向的**本地访问的文件**，通常是一个模板文件或者JSON文件，当然也可以是一个JSP文件。

`location` 原名为 `target`，后改为 `location`，修改的原因与`rule`的一样都是为了语义更加明确，当然 `target` 依旧是可以使用的，但强烈建议使用 `location`。

```xml
<!-- 推荐 -->
<route rule="/xxx" location="xxx.vm">
<!-- 不推荐 -->
<route rule="/xxx" target="xxx.vm">
```

**注意：如果当前规则有可用的provider属性(可能继承自`route-map`上的`provider`)，则该属性会被忽略**

#### `provider`属性

与`route-map`中的`provider`功能一样，都是将当前命中规则的请求转发到指定的地址，唯一不同的是改属性存在于`route`标签中的话，其作用仅针对于当前规则，而不像`route-map`一样，针对于其包含的所有规则。

当`route-map`标签中存在`provider`，并且`route-map`中的`route`也存在`provider`。那么当前`route`中的`provider`会覆盖掉`route-map`中的`provider`。

示例：

```xml
<route-map provider="http://www.a.com">
  <route rule="/foo.json" provider="http://www.b.com" />
</route-map>
<!-- 最终的转发地址将会是: http://www.b.com/test.json -->
```

#### `render-template`属性

该属性主要用于将转发后取来的数据绑定到本地指定的模板上。

由于模板本身被转发后，其意义并不大或者说已经不像是一个Mock Server该做的事情，所以提供了`render-template`来指定一个本地模板与转发后获取的JSON数据进行绑定。

示例：

路由规则配置:

```xml
<route rule="/index" render-template="/index.vm" provider="http://127.0.0.1:3000">
```

本地`Marmot`启动端口为`8080`

```
访问地址：
http://127.0.0.1:8080/index

规则命中，使用provider转发后的地址
http://127.0.0.1:3000/index

```

velocity模板如下：

```html
<!-- views/index.vm -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>$!{title}</title>
  </head>
  <body></body>
</html>
```

`http://127.0.0.1:3000/index` 返回结果

```json
{
  "title": "Hello World"
}
```

此时 `http://127.0.0.1:8080/index` 响应结果为

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Hello World</title>
  </head>
  <body></body>
</html>
```

**如果不使用 `render-template` 那么结果将只是普通的转发，把转发后返回的结果响应给浏览器**

## 数据模拟

数据模拟主要分两类：

1. 本地数据模拟
2. 使用provider来访问其他服务提供的模拟数据，如：本地开发环境(Node.js或其他服务)提供的数据

### 本地数据模拟

#### 模板数据模拟

当路由规则被命中后，会渲染`location`指定的模板文件，而模板绑定的数据会从先前指定的模拟数据目录中以相同路径的方式先匹配JSP文件，其次匹配JSON文件。

参考自 [jello](https://github.com/fex-team/jello/blob/master/README.md#模板数据绑定)


示例:

```xml
<route rule="/index.html" location="/xxx/index.vm">
```

目录结构:

```
app/
  views/
    xxx/
      index.vm
  mock/
    xxx/
      index.jsp
      index.json
```

如：

```
模板：
views/xxx/index.vm
自动绑定数据：
mock/xxx/index.json
```

模拟数据支持JSP与JSON两种格式

JSON：

```json
{
  "title": "foo",
  "username": "evan2x"
}
```

JSP：

```jsp
<%@page pageEncoding="UTF-8"%>
<%
  request.setAttribute("title", "foo");
  request.setAttribute("username", "evan2x");
%>
```

#### REST API 数据模拟

当路由规则被命中后，会返回`location`所指定文件的内容，支持静态的JSON文件或者动态JSP文件

示例：

```xml
<route rule="/user/\w+" location="/mock/api/user.json">
```

/mock/api/users.json

```json
{
  "name": "evan2x",
  "age": 24
}
```

若指定为JSP文件，那么该JSP需要输出JSON字符串

```xml
<route rule="/users" location="/mock/api/users.jsp">
```

/mock/api/users.jsp

```jsp
<%@ page trimDirectiveWhitespaces="true" %>
<%@ page contentType="application/json; charset=utf-8" %>
<%@ page import="com.alibaba.fastjson.*" %>
<%
  class Person {
    private String name;
    private int age;

    public void setName(String name) {
      this.name = name;
    }

    public String getName() {
      return name;
    }

    public void setAge(int age) {
      this.age = age;
    }

    public int getAge() {
      return age;
    }
  }
%>
<%
  Person p = new Person();
  p.setName("evan2x");
  p.setAge(24);

  out.print(JSON.toJSONString(p));
%>
```

以上代码输出结果与之前的 `/mock/api/users.json` 内容一致。

在Marmot中解析JSON用的jar包就是 [fastjson](https://github.com/alibaba/fastjson)，所以你可以直接导入 fastjson 来将JavaBean、Map、List、Collection、Enum等类型序列化为JSON字符串。

### 远程数据模拟

上面说了Marmot本身提供的模拟数据，接下来要说下关于远程服务/本地其他服务提供模拟数据。

#### 模板数据模拟

之前介绍过`provider`属性的作用，其作用就是将命中的路由转发给`provider`指定的服务。

以下为使用Marmot及express来演示一个由Node.js提供数据模拟服务的栗子：

**Marmot路由配置：**

```xml
<route rule="/index.html" render-template="/index.vm" provider="http://127.0.0.1:3000">
```

Node.js服务的入口 **app.js**

```js
var express = require('express');
var router = express.Router();
var app = express();

router.get('/index.html', function(req, res){
  // returns the JSON
  res.send({
    "title": "Hello World",
    "description": "This is an example"
  });
});

app.use(router);

app.listen(3000);
```

velocity模板 `/index.vm`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>$!{title}</title>
  </head>
  <body>
    <h1>$!{title}</h1>
    <p>$!{description}</p>
  </body>
</html>
```

结果：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Hello World</title>
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is an example</p>
  </body>
</html>
```

**注意：**

1. 如果路由中没有指定 `render-template` 属性，则不会渲染模板，而是将provider(以上例子中即express服务)响应的结果提供给客户端。
2. express中的 `/index.html` 路由返回了一个JSON格式的数据，Marmot会将其绑定到模板上。

#### REST API 模拟数据

```xml
<route rule="/users.json" provider="http://127.0.0.1:3000">
```

当路由命中后，Marmot直接将请求转发给provider，返回结果由provider决定。当用于REST API的时候，通常是返回JSON字符串。

