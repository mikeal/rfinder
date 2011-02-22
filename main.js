var fs = require('fs')
  , watch = require('watch')
  , http = require('http')
  , paperboy = require('paperboy')
  , path = require('path')
  , child_process = require('child_process')
  ;
  
function spawn () {
  var args = Array.prototype.slice.call(arguments);
  var x = child_process.spawn.apply(child_process, args);
  x.stdout.on('data', function (chunk) {console.print(chunk.toString())})
  x.stderr.on('data', function (chunk) {console.error(chunk.toString())})
  x.on('exit', function (code) {
    console.log("spawn "+JSON.stringify(args)+" results in "+code)
  })
}  
  
var folders = ['/Users/mikeal/Movies']
  , WEBROOT = path.join(__dirname, 'static')
  , monitors = []
  ;

exports.createServer = function (folders, cb) {
  folders.forEach(function (root) {
    watch.createMonitor(root, function (monitor) {
      monitors.push(monitor);
      if (monitors.length === folders.length) {
        var s = http.createServer(function (req, res) {
          if (req.method === 'POST') {
            var buf = '';
            req.on('data', function (c) {
              buf += c;
            })
            req.on('end', function () {
              var body = JSON.parse(buf);
              
              if (req.url === '/open') {
                spawn("/usr/bin/open", [body.filename]);
              } else {
                var foundfiles = [];
                monitors.forEach(function (monitor) {
                  for (f in monitor.files) {
                    if (f.slice(f.lastIndexOf('/')).indexOf(body.search) !== -1) {
                      foundfiles.push(f);
                    }
                  }
                })
                res.writeHead('200', {'content-type':'application/json'});
                res.write(JSON.stringify(foundfiles));
                res.end();
              }
            })
          } else {
            var ip = req.connection.remoteAddress;
            paperboy
              .deliver(WEBROOT, req, res)
              .addHeader('Expires', 300)
              .addHeader('X-PaperRoute', 'Node')
              .error(function(statCode, msg) {
                res.writeHead(statCode, {'Content-Type': 'text/plain'});
                res.end("Error " + statCode);
              })
              .otherwise(function(err) {
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end("Error 404: File not found");
              });
          }
        })
        cb(s);
      }
    })
  })
  
}






