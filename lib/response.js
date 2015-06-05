
var fs = require('fs')
var mime = require('./mime')
var res = module.exports = {
  __proto__: require('http').ServerResponse.prototype
}

res.json = function (object, replacer, space) {
  this.type('json')
  var text = JSON.stringify(object, replacer, space)
  this.set('Content-Length', text.length)
  this.end(text)
}

res.send = function (html) {
  this.type('html')
  var text = [].concat(html).join('\n')
  this.set('Content-Length', text.length)
  this.end(text)
}

res.sendFile = function (file) {
  var res = this
  var req = this.req
  var end = function (status, text) {
    res.statusCode = (status || 404)
    res.end(text)
  }

  fs.stat(file = unescape(file), function (err, stats) {
    if (err) return end(404, 'Not found')

    if (stats.isDirectory()) {
      if (/\/$/.test(req.path)) {
        res.sendFile(file + 'index.html')
      }
      else {
        res.set('Location', req.path + '/')
        end(302)
      }
      return
    }

    var exts = file.toLowerCase().split('/').pop().split('.')
    var ext = exts.pop()
    if (ext === 'gz') {
      ext = exts.pop()
      res.set({
        'Content-Encoding': 'gzip',
        'Vary': 'Accept-Encoding'
      })
    }

    res.type(ext)

    var etag = '"' + [stats.ino, stats.size, Number(stats.mtime)].join('-') + '"'
    var mtime = stats.mtime.toUTCString()

    res.set({
      'Content-Length': stats.size,
      'Last-Modified': mtime,
      'ETag': etag
    })

    var offset = ranges(req.headers.range, stats.size).shift()
    if (offset) {
      res.statusCode = 206
      res.set({
        'Cache-Control': 'no-cache',
        'Content-Length': (offset.end - offset.start) + 1,
        'Content-Range': 'bytes ' + offset.start + '-' + offset.end + '/' + stats.size
      })
    }

    if (req.method === 'HEAD') {
      res.end()
    }

    else if (mtime === req.headers['if-modified-since']
           || etag === req.headers['if-none-match']) {
      end(304)
    }

    else {
      fs.createReadStream(file, offset).pipe(res)
    }

  })

}

res.sendFileStat = function (file) {
  var res = this

  fs.stat(file = unescape(file), function (err, stats) {
    if (err)
      res.json(err)
    else
      res.json(stats)
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

function ranges(range, size) {
  var array = []
  var valid = true
  if (!range || range.indexOf('bytes=') !== 0) return array

  range.replace(/[=,](\d*)-(\d*)/g, function (_, x, y) {
    var x = parseFloat(x)
    var y = parseFloat(y)
    var z = size - 1

    if (isNaN(x)) x = size - y, y = z; else
    if (isNaN(y)) y = z
    if (y > z) y = z

    if (isNaN(x) || isNaN(y) || x > y || x < 0)
      valid = false
    else
      array.push({ start:x, end:y })
  })

  return valid ? array : []
}

