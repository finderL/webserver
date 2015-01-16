webserver-node v-0.0.3
===================
修正了ip地址之前指定参数,改为判断是否为需要的ip并优化了代码

webserver-node v-0.0.2
===================
增加自定义文件名功能（原来默认打开index.html），远程url地址生成二维码功能
----------
> **使用说明：**
> - eg: node start.js
> - eg: node start.js 端口
> - eg: node start.js 文件名
> - eg: node start.js 端口 文件名
> - eg: node start.js 文件名 端口
> - eg: node start.js www.baidu.com   


功能：搭建本地web服务，自动生成二维码，便于手机站测试  v-0.0.1
===================
require:安装node.js(官网地址：http://www.nodejs.org/)
----------
使用说明：把start.js拷贝到需要启动的项目根目录后启动服务
> **启动服务命令：**
> -node start.js port(端口号可以省略，默认8080)
> -eg: node start.js 999
服务启动后，当前目录为根目录