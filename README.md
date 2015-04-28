
# my-server

A zero dependency file server.


```node

var server = require('my-server')()

server.get('/v/*', function (req, res) {
  res.sendFile(req.url.replace('/v/', 'd:/video/'))
})

server.get(function (req, res) {
  res.sendFile(__dirname + req.path)
})

server.listen(80)

```

