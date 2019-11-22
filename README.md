# Marmot

[![](https://img.shields.io/badge/node.js-%3E=_4.0-brightgreen.svg?style=flat-square)]()

一个Java平台的Mock Server

## 标签库与模板引擎

* JSP/JSTL/EL (默认支持)
* Velocity
* Freemarker

## Install

#### Mac/Linux

```shell
$ sudo npm install -g marmot
```

#### Windows

> windows中您需要在管理员模式下安装

```shell
$ npm install -g marmot
```

## 依赖环境

* Node.js 4.0+
* JDK 7+

## Usage

### init sub-command

**进入项目目录下执行**

```bash
$ marmot init
```

> 项目下如果存在 `.marmotrc` 配置文件，那么会根据文件中的配置进行初始化，如果不存在 `.marmotrc` 配置文件，执行后会出现问答式的初始化设置，并会生成一个 `.marmotrc` 配置文件

* `marmot init` 主要生成了项目的 `WEB-INF` 目录所需要的jar包及模板引擎的配置。

* 如果您手动删除了 `WEB-INF` 目录，您需要再次运行 `marmot init` 进行项目初始化。
当你要指定一个或多个全局的宏文件时，请修改 `.marmotrc` 配置中的 `macro` 属性，然后重新执行 `marmot init -f` 命令，**该属性当指定多个宏文件的时候用逗号分割，宏文件的路径时相对于指定的模版目录** 如：  

  ```
  #...
  "template": "views/",
  "macro": "common/widget.vm,common/global.vm"
  #...

  # 以上的宏查找方式的结果时 views/common/widget.vm / views/common/global.vm
  ```

* 由于 `WEB-INF` 目录是根据 `.marmotrc` 配置文件生成的，所以您在提交代码的时候，无需提交此目录。

参数：

* `-f, --force` 强制初始化当前项目。

### server sub-command

进入项目目录下执行

```bash
$ marmot server <command>
```

**在启动多个应用的时候，应用名称及端口号是不可以重复的**

server 目前一共有4个命令，分别为:

* 启动应用 `marmot server start`
* 关闭应用 `marmot server stop`
* 从应用列表中移除应用 `marmot server remove`
* 显示所有应用列表 `marmot server list`

接下来针对每个命令进行详细说明。

#### 启动应用

```shell
$ marmot server start
```

初次启动时如果没有指定端口号，则默认为 `8080` ，若指定了端口号则以指定的端口号启动。**当第二次启动的时候，如果没有指定端口号则默认为上次启动时使用的端口号。**

参数：

- `-p, --port` 用于指定应用启动时所使用的端口
- `-a, --app` 指定应用名，默认会使用当前所在的目录名。

##### 示例

当前终端所在目录为：`/Users/evan/projects/cashier`

示例1:

```shell
$ marmot server start -p 8090
```

执行以上命令后，应用名为`cashier` ，端口号为 `8080`

示例2:

```shell
$ marmot server start -a cashier-project -p 8009
```

执行以上命令后，应用名为`cashier-project`，端口号为`8009`

#### 关闭应用

```shell
$ marmot server stop -p <port>
```

参数:

* `-p, --port` 根据端口关闭对应的应用
* `-a, --app` 根据应用名称关闭对应的应用
* `-i, --id` 根据应用ID关闭对应的应用，该ID是由初次启动应用时生成的ID。可使用`list`命令查看

##### 示例

> 关闭应用时，至少需要指定任意一个参数。

示例1:

```shell
$ marmot server stop -p 8090
```

关闭 `8090` 端口所对应的应用

示例2:

```shell
$ marmot server stop -n cashier-project
```

关闭名称为 `cashier-project` 的应用

示例3:

```shell
$ marmot server stop -i 1
```

关闭ID为 `1` 的应用

#### 移除应用

```shell
$ marmot server remove -p <port>
# or
$ marmot server rm -p <port>
```

> `remove` 的别名为 `rm`

参数:

- `-p, --port` 根据端口移除对应的应用
- `-a, --app` 根据应用名称移除对应的应用
- `-i, --id` 根据应用ID关闭对应的应用，该ID是由初次启动应用时生成的ID。可使用`list`命令查看

##### 示例

> 移除应用时，至少需要指定任意一个参数

示例1:

```shell
$ marmot server rm -p 8090
```

移除 `8090` 端口所对应的应用

示例2:

```shell
$ marmot server rm -n cashier-project
```

移除名称为 `cashier-project` 的应用

示例3:

```shell
$ marmot server rm -i 1
```

移除ID为 `1` 的应用

#### 显示所有应用列表

```shell
$ marmot server list
# or
$ marmot server ls
```

> `list` 的别名为 `ls`

以上命令将输出如下列表。

```
┌──────┬───────────┬────────┬─────────┬──────────┬────────────────────────────────┐
│  id  │  name     │  port  │  pid    │  status  │  path                          │
├──────┼───────────┼────────┼─────────┼──────────┼────────────────────────────────┤
│  1   │  cashier  │  8090  │  10067  │  online  │  /Users/evan/projects/cashier  │
└──────┴───────────┴────────┴─────────┴──────────┴────────────────────────────────┘
```

## 路由配置

> 在初始化项目时，会提示您输入路由文件入口的生成位置，默认是在当前项目目录下生成`router/main.xml`，如果您需要自定义文件名，请务必使用后缀为`.xml`的文件名。

以下是一个简单的路由示例。

```xml
<!-- router/main.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<router>
  <cookies>
    <cookie name="JSESSIONID" value="jstl9vqr6dket28u0xreps9e" http-only="true" />
  </cookies>
  <import src="product.xml" />
  <routes>
    <route rule="/" location="/index.vm" />
    <route rule="/api/v1/user.json" proxy="http://127.0.0.1:3000" />
    <route rule="/user/center" content-type="text/html" proxy="http://xxx.xxx.xxx" />
  </routes>
  <routes proxy="...">
    <route rule="...">
    <!-- ... -->
  </routes>
</router>

<!-- router/product.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<routes>
  <route rule="/product/detail" location="/product/detail.vm" />
</routes>
```

在路由的配置中有 `router`、 `import`、`cookies`、`cookie`、`routes`、`route` 六种标签(不包括 `xml` 声明)，接下来将逐一介绍其功能

### `router` 标签

`router` 标签是路由入口文件的根元素，使用 `import`标签引入的其他路由文件则不需要使用此标签。

#### `proxy` 属性

**原为provider属性，该属性仍然可用，但推荐使用proxy**

该属性作用于整个路由文件中，`proxy` 指向一个可访问的IP/域名，其作用为当规则被命中后，当前请求将被**转发**到该IP/域名，此属性的值必须是一个有效的IP/域名，如果不写协议类型，那么将以当前启动的 `Marmot` 应用的协议作为缺省值。

由 `Marmot` 通过 `proxy` 转发的请求，Request Headers中会包含 `X-Requested-With: MarmotHttpRequest` 字段。

有效的HTTP地址：

```
http://xxx.xxx.xxx
//xxx.xxx.xxx
xxx.xxx.xxx
```

值得注意的是被命中的路由规则中，`route` 中的 `location` 属性将会被忽略。

示例：

```xml
<router proxy="http://x.x.x.x:3000">
  <routes>
    <route rule="/user/info.json" />
  </routes>
</router>
```

结果如下：

```
本地访问地址
http://127.0.0.1:8080

访问以下地址
http://127.0.0.1:8080/user/info.json

实际上将从以下url中获取数据
http://x.x.x.x:3000/user/info.json
```

### `cookies` 标签

此标签用于包含所有的 `cookie` 设置，**该标签应放在 `router` 标签下的第一个位置**，如此才会应用于所有路由规则中。

示例:

```xml
<!-- main.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<router>
  <cookies>
    <cookie
      name="JSESSIONID"
      value="jstl9vqr6dket28u0xreps9e"
      http-only="true"
    />
    <cookie
      name="accessToken"
      value="jstl9vqr6dket28u0xreps9e"
      max-age="3600"
      http-only="true"
    />
  </cookies>
  <import src="product.xml">
  <routes>
    <route rule="/" location="/index.vm">
  </routes>
</router>
```

### `cookie` 标签

设置一条cookie

属性:

* `name` cookie名称
* `value` cookie值
* `domain` cookie适用的域名，通常没必要设置
* `path` 在指定的访问路径下发起请求，cookie才会被携带
* `max-age` cookie最大存活期，单位: 秒
* `http-only` 默认false，当设置为true时，该cookie在浏览器端不可被JS读取

示例:

```xml
<cookies>
  <cookie
    name="accessToken"
    value="abj3de2vjqp43mf2dd9fj1fd"
    domain="localhost"
    path="/profile"
    max-age="3600"
    http-only="true"
  />
</cookies>
```

### `import` 标签

引入一个新的路由文件，该文件的路径是相对于主入口文件的，建议所有路由文件统一放到同一目录下。

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

### `routes` ~~`route-map`~~ 标签

此标签用于包含一组路由规则，路由规则的匹配仅处理 `routes` 标签包含的元素，写在其他位置的路由规则将不会被匹配到。

**原为 `route-map` 标签，目前不建议使用，0.7.0 版本中将被移除。**

#### `proxy` 属性

**原为provider属性，该属性仍然可用，但推荐使用proxy**

该属性与 `router` 标签上的 `proxy` 是一样的，不同的是只作用于 `routes` 下的路由规则。若 `router` 和 `routes` 同时指定 `proxy` ，则优先使用 `routes` 的 `proxy`。

示例:

```xml
<router proxy="http://x.x.x.x:8888">
  <routes proxy="http://x.x.x.x:3002">
    <route rule="/user/info.json" />
  </routes>
  <routes>
    <route rule="/movie/list.json" />
  </routes>
</router>
```

结果如下：

```
本地访问地址
http://127.0.0.1:8080

访问以下地址
http://127.0.0.1:8080/user/info.json

实际上将从以下url中获取数据
http://x.x.x.x:3002/user/info.json

访问以下地址
http://127.0.0.1:8080/movie/list.json

实际上将从以下url中获取数据
http://x.x.x.x:8888/movie/list.json
```

### `route` 标签

该标签用于配置路由规则，以下为 `route` 标签所支持的属性。

#### `rule` ~~`uri`~~ 属性

`rule` 属性表示路由的匹配规则，其值可以是普通的字符串也可以是一个正则表达式，并且规则仅对URL中的路径部分进行匹配，其余部分(query string，anchor name)不会参与匹配。

**原为 `uri` 属性，目前不建议使用，0.7.0 版本中将被移除。**

```xml
<!-- 推荐 -->
<route rule="/foo" location="foo.vm">
<!-- 不推荐 -->
<route uri="/foo" location="foo.vm">
```

我们可以通过正则中的**捕获组`()`**来实现在`location`属性中使用 `$1, $2, $n` 的方式来获取捕获组的值，如果要跳过某些分组不匹配则使用**非捕获组`(?:)`**来进行匹配，其中 `$0` 表示整个匹配的字符串，`$1` 表示第一个捕获组，`$2` 表示第二个捕获组，以此类推。

如下示例：

```xml
<route rule="/foo/(?:[\w-]+)/(\w+)" location="/$1/foo.vm">
```

```
请求地址：
http://127.0.0.0:8080/foo/bar/baz.html

实际访问模版：
/baz/foo.vm
```

#### `redirect` 属性

针对命中的路由进行重定向，**会忽略其他属性如：`location, proxy, content-type`**

```xml
<route rule="/xxx" redirect="/aaa">
```

#### `location` ~~`target`~~ 属性

`location` 属性表示该规则命中后，指向的本地访问的文件，通常是一个模板文件或者JSON文件，当然也可以是一个JSP文件。

**原为 `target` 属性，目前不建议使用，0.7.0 版本中将被移除。**

```xml
<!-- 推荐 -->
<route rule="/xxx" location="xxx.vm">
<!-- 不推荐 -->
<route rule="/xxx" target="xxx.vm">
```

#### `proxy` 属性

**原为provider属性，该属性仍然可用，但推荐使用proxy**

与 `router/routes` 中的 `proxy` 功能一样，都是将当前命中规则的请求转发到指定的地址，唯一不同的是改属性存在于`route`标签中的话，其作用仅针对于当前规则。

示例：

```xml
<routes proxy="http://www.a.com">
  <route rule="/foo.json" proxy="http://www.b.com" />
</routes>
<!-- 最终的转发地址将会是: http://www.b.com/test.json -->
```

#### `content-type` 属性

该属性用于指定当前规则命中后的响应内容类型。

**值得注意的是如果你在使用 `proxy` 提供的数据渲染本地模板的时候，`content-type` 必须设置为 `text/html` 或 `text/htm`，否则将会直接显示 `proxy` 响应的内容**

示例：

路由规则配置:

```xml
<route rule="/index" content-type="text/html" proxy="http://127.0.0.1:3000">
```

本地 `Marmot` 启动端口为 `8080`

```
访问地址：
http://127.0.0.1:8080/index

规则命中，使用proxy转发后的地址
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

## 数据模拟

数据模拟主要分两类：

1. 本地数据模拟
2. 使用proxy来访问其他服务提供的模拟数据，如：本地启动的express模拟数据或者测试服务器提供的数据

### 本地数据模拟

#### 模板数据模拟

当路由规则被命中后，会渲染 `location` 指定的模板文件，而模板绑定的数据会从先前指定的模拟数据目录中以相同路径的方式先匹配JSP文件，其次匹配JSON文件。

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

index.vm 内容:

```html
<!DOCTYPE html>
<html>
  <head>
  	<meta charset="utf-8">
    <title>$!{title}</title>
  </head>
  <body>
    <h1>
      Hello, $!{username}
    </h1>
  </body>
</html>
```

本地环境模拟数据支持JSP与JSON两种格式

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

当路由规则被命中后，会返回 `location` 所指定文件的内容，支持静态的JSON文件或者动态JSP文件

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

在Marmot中解析JSON用的jar包就是 [fastjson](https://github.com/alibaba/fastjson)，所以你可以直接导入 fastjson 来将POJO、Map、List、Collection、Enum等类型序列化为JSON字符串。

### 远程数据模拟

上面说了Marmot本身提供的模拟数据，接下来要说下关于远程服务/本地其他服务提供模拟数据。

#### 模板数据模拟

之前介绍过 `proxy` 属性的作用，其作用就是将命中的路由转发给`proxy`指定的IP/域名。

以下为使用Marmot及express来演示一个由Node.js提供数据模拟服务的栗子：

**Marmot路由配置：**

```xml
<route rule="/index.html" render-template="/index.vm" proxy="http://127.0.0.1:3000">
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

输出：

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

1. 如果路由中没有指定 `content-type` 属性，则不会渲染模板，而是将 `proxy` (以上例子中即express服务)响应的结果提供给客户端。
2. express中的 `/index.html` 路由返回了一个JSON格式的数据，Marmot会将其绑定到模板上。

#### REST API 模拟数据

```xml
<route rule="/users.json" proxy="http://127.0.0.1:3000">
```

当路由命中后，Marmot直接将请求转发给 `proxy`，返回结果由 `proxy` 决定。当用于REST API的时候，通常是返回JSON字符串。
