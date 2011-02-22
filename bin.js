var rfinder = require('./main');

var argv = process.argv.slice(2)
  , port = 80
  , folders = []
  ;

argv.forEach(function (a) {
  if (!isNaN(parseInt(a))) {
    port = parseInt(a);
  } else {
    folders.push(a);
  }
})

rfinder.createServer(folders, function (server) {
  if (process.env.USER === 'root') {
    server.username = 'mikeal';
  }
  server.listen(port, function () {console.log("Serving on "+port+"...")});
})