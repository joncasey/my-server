
var fs = require('fs')
var mime = require('./mime')
var res = module.exports = {
  __proto__: require('http').ServerResponse.prototype
}

res.json = function (object, replacer, space) {
  this.type('json')
  var text = JSON.stringify(object, replacer, space)
  this.set('Content-Length', text.length)
  if (this.method !== 'HEAD') {
    this.write(text)
  }
  this.end()
}

res.send = function (html) {
  this.type('html')
  var text = [].concat(html).join('\n')
  this.set('Content-Length', text.length)
  if (this.method !== 'HEAD') {
    this.write(text)
  }
  this.end()
}

res.sendFile = function (file) {
  var res = this
  var req = this.req
  var end = function (status, text) {
    res.statusCode = (status || 404)
    res.end(text)
  }

  fs.exists(file = unescape(file), function (exists) {
    if (!exists) return end(404, 'Not found')

    fs.stat(file, function (err, stats) {
      if (err) return end(500, err)

      if (stats.isDirectory()) {
        if (/\/$/.test(req.path)) {
          res.sendFile(file + 'index.html')
        }
        else {
          res.set('Location', req.path + '/')
          end(302)
        }
      }

      else {

        var exts = file.toLowerCase().split('/').pop().split('.')
        var ext = exts.pop()
        if (ext === 'gz') {
          res.set({ 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' })
          ext = exts.pop()
        }

        res.type(ext)

        var etag = '"' + [stats.ino, stats.size, Number(stats.mtime)].join('-') + '"'
        var mtime = stats.mtime.toUTCString()

        res.set({
          'Content-Length': stats.size,
          'Last-Modified': mtime,
          'ETag': etag
        })

        var range = (req.headers.range || '').match(/bytes=(\d+)-(\d+)?/)
        if (range !== null) {
          var l = stats.size - 1
          var x = parseFloat(range[1])
          var y = parseFloat(range[2] || l)
          if (x <= l && y <= l) {
            res.statusCode = 206
            res.set({
              'Cache-Control': 'no-cache',
              'Content-Length': (y - x) + 1,
              'Content-Range': 'bytes ' + x + '-' + y + '/' + stats.size
            })
            fs.createReadStream(file, { start:x, end:y }).pipe(res)
            return
          }
        }

        if (req.method === 'HEAD') {
          res.end()
        }

        else if (mtime === req.headers['if-modified-since']
               || etag === req.headers['if-none-match']) {
          end(304)
        }

        else {
          fs.createReadStream(file).pipe(res)
        }

      }

    })

  })
}

res.sendFileStat = function (file) {
  var res = this
  fs.exists(file, function (exists) {
    if (exists) {
      fs.stat(file, function (err, stats) {
        if (err) {
          res.json(err)
        }
        else {
          res.json(stats)
        }
      })
    }
    else {
      res.statusCode = 404
      res.end('Not found')
    }
  })
}

res.set = function (name, value) {

  if (toString.call(name) === '[object Object]') {
    for (var p in name) {
      this.set(p, name[p])
    }
  }

  else if (value === undefined) {
    this.removeHeader(name)
  }

  else if (name.toLowerCase() === 'content-type') {
    this.type(value)
  }

  else {
    this.setHeader(name, value)
  }

  return this

}

res.type = function (type) {
  var value = type.indexOf('/') > 0 ? type : mime(type)
  if (value.indexOf('text/') === 0 && !/;\s*charset\s*=/.test(value)) {
    value += '; charset=utf-8'
  }
  return this.setHeader('Content-Type', value)
}

