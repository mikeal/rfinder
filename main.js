var fs = require('fs')
  , watch = require('watch')
  , http = require('http')
  , paperboy = require('paperboy')
  , path = require('path')
  , child_process = require('child_process')
  ;
  
function spawn () {
  var args = Array.prototype.slice.call(arguments);
  var cb = args.pop();
  var x = child_process.spawn.apply(child_process, args);
  var body = ''
  x.stdout.on('data', function (chunk) {body += chunk; console.print(chunk.toString())})
  x.stderr.on('data', function (chunk) {body += chunk; console.error(chunk.toString())})
  x.on('exit', function (code) {
    cb(code, body)
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
              var finish = function (code, body) {
                if (code > 0) {
                  res.writeHead(500, {'content-type':'application/json'});
                } else {
                  res.writeHead(200, {'content-type':'application/json'});
                }
                res.write(JSON.stringify({output:body, code:code}));
                res.end();
              }
              if (req.url === '/open') {
                if (s.username) {
                  spawn('sudo', ["-u", "mikeal", "/usr/bin/open", body.filename], finish);
                } else {
                  spawn("/usr/bin/open", [body.filename], finish);
                }
              } else {
                var foundfiles = [];
                body.search = body.search.toLowerCase();
                monitors.forEach(function (monitor) {
                  for (f in monitor.files) {
                    if (f.toLowerCase().slice(f.lastIndexOf('/')).indexOf(body.search) !== -1) {
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






