
var server = require('my-server')()

server.all(function (req, res) {
  res.json({
    headers: req.headers,
    method: req.method,
    range: req.headers.range,
    url: req.url
  }, 0, 2)
})

server.listen(5000)

