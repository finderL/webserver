//  webserver-node v-0.0.3
//  功能：搭建本地web服务，自动生成二维码，便于手机站测试
//  require:安装node.js(官网地址：http://www.nodejs.org/)
//  启动服务命令(默认为内网地址，外网加'-e')：
//  node start.js 端口 文件名(端口号可以省略，默认8080)
//  eg: node start.js
//  eg: node start.js 端口
//  eg: node start.js 文件名
//  eg: node start.js 端口 文件名
//  eg: node start.js 文件名 端口
//  eg: node start.js www.baidu.com   
//  服务启动后，当前目录为根目录
//  Author:Liubei  E-mail:liubei@liubeismx.cn
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

//配置
var config = {
    denyAccess: [],
    localIPs: ['127.0.0.1'],
    srcpath: '/nodejs',
    port : 8080
};
var os = require('os');
var IP = '';
var defaultIP = config.localIPs[0];
var URL = '';
var URLQcode = '';
var regNumber = /^[0-9]*$/;
var regPageName = /\.html|\.htm/;
var regInternet = /^-e$/;
var regRemoteUrl = /http:\/\/|www\.|m\.|\.com|\.net|\.org|\.me|\.cn/;
var regHttp = /http:\/\//;
var regIp = /192\.168\.[0-9]{1,3}\.[0-9]{1,3}/;
//  win本地地址，mac本地地址，ubuntu外网地址
var typeIps = ['本地连接','en0','eth1'];
var PageName = 'index.html';   //  设置默认打开二维码网页文件名
var isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function validateLocalIp (ip) {
    return regIp.test(ip);
}
process.argv.forEach(function () {
    var paramsArr = [];
    if( arguments[2].length > 2){
        paramsArr = arguments[2];
        for(var i = 2; i < paramsArr.length; i++){
            if( regNumber.test(paramsArr[i]) ){
                config.port = parseInt(paramsArr[i]);
            }else{
                if( regRemoteUrl.test(paramsArr[i]) ){
                    PageName = paramsArr[i] = (regHttp.test(paramsArr[i]) ? paramsArr[i] : ('http://' + paramsArr[i]) );
                }else if( regPageName.test(paramsArr[i]) ){
                    PageName = paramsArr[i];
                }else if(regInternet.test(paramsArr[i])){
                    validateLocalIp = function(ip) {
                        return !regIp.test(ip);
                    };
                }else{
                    PageName = paramsArr[i] + '.html';
                }
            }
        }
    }
});


//开始HTTP服务器
http.createServer(processRequestRoute).listen(config.port);
function getLocalIP() {
    var ip, ifaces = os.networkInterfaces(), pass = true;
    for (var dev in ifaces) {
        var ipTemp = ifaces[dev];
        for(var i = 0; i < ipTemp.length; i++ ){
            if (ipTemp[i].family=='IPv4' && validateLocalIp(ipTemp[i].address) && pass ) {  
                console.log(ipTemp[i].address, validateLocalIp(ipTemp[i].address));
                ip = ipTemp[i].address;
                pass = false;
            }
        }
    }
    return ip == undefined ? defaultIP : ip;
}
IP = getLocalIP();
URL = "http://"+IP+':'+config.port;
console.log( "open " + URL);
URLQcode = (regHttp.test(PageName) ? PageName : (URL + '/' + PageName) );

//路由URL
function processRequestRoute(request, response) {
    var pathname = url.parse(request.url).pathname;
    
    var ext = path.extname(pathname);
    var localPath = ''; //本地相对路径
    var staticres = false; //是否是静态资源
    if (ext.length > 0) {
        localPath = '.' + pathname;
        staticRes = true;
    } else {
        localPath = '.' + config.srcpath + pathname + '.js';
        staticRes = false;
    }
    //禁止远程访问
    if (config.denyAccess && config.denyAccess.length > 0) {
        var islocal = false;
        var remoteAddress = request.connection.remoteAddress;
        for (var j = 0; j < config.localIPs.length; j++) {
            if (remoteAddress === config.localIPs[j]) {
                islocal = true;
                break;
            }
        }
        if (!islocal) {
            for (var i = 0; i < config.denyAccess.length; i++) {
                if (localPath === config.denyAccess[i]) {
                    response.writeHead(403, { 'Content-Type': 'text/plain' });
                    response.end('403:Deny access to this page');
                    return;
                }
            }
        }
    }
    //禁止访问后端js
    if (staticRes && localPath.indexOf(config.srcpath) >= 0) {
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('403:Deny access to this page');
        return;
    }

    fs.exists(localPath, function (exists) {
        if (exists) {
            if (staticRes) {
                staticResHandler(localPath, ext, response); //静态资源
            } else {
                try {
                    var handler = require(localPath);
                    if (handler.processRequest && typeof handler.processRequest === 'function') {
                        handler.processRequest(request, response); //动态资源
                    } else {
                        response.writeHead(404, { 'Content-Type': 'text/plain' });
                        response.end('404:Handle Not found');
                    }
                } catch (exception) {
                    console.log('error::url:' + request.url + 'msg:' + exception);
                    response.writeHead(500, { "Content-Type": "text/plain" });
                    response.end("Server Error:" + exception);
                }
            }
        } else { //资源不存在
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            if (pathname === '/') {
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end("<html><meta charset='utf-8'><title>扫描二维码</title></html><div style='text-align:center;margin-top:100px;'><p><a target='_blank' href='"+URLQcode+"'>"+URLQcode+"</a></p><p><img src='http://trans.2sitebbs.com/qr/?w=100&h=100&str="+URLQcode+"'/></p></div></html>");
            }
        }
    });
}

//处理静态资源
function staticResHandler(localPath, ext, response) {
    fs.readFile(localPath, "binary", function (error, file) {
        if (error) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Server Error:" + error);
        } else {
            response.writeHead(200, { "Content-Type": getContentTypeByExt(ext) });
            response.end(file, "binary");
        }
    });
}

//得到ContentType
function getContentTypeByExt(ext) {
    ext = ext.toLowerCase();
    if (ext === '.htm' || ext === '.html')
        return 'text/html';
    else if (ext === '.js')
        return 'application/x-javascript';
    else if (ext === '.css')
        return 'text/css';
    else if (ext === '.jpe' || ext === '.jpeg' || ext === '.jpg')
        return 'image/jpeg';
    else if (ext === '.png')
        return 'image/png';
    else if (ext === '.ico')
        return 'image/x-icon';
    else if (ext === '.zip')
        return 'application/zip';
    else if (ext === '.doc')
        return 'application/msword';
    else
        return 'text/plain';
}