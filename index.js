var fs = require('fs')
var url = require('url')
var http = require('http')
var mime = getMimeTypes()
var myip = getIPs()[0]
var pkg = require('./package.json')

var endsWithSlash = /[\\\/]$/
var rangeBytes = /bytes=(\d+)-(\d+)?/
var serverName = pkg.name + '/' + pkg.version
var routes = {'/': process.cwd() + '/'}
var sorted = ['/']

module.exports.route = function (path, to) {

  routes[path] = to.replace(/\\/g, '/')

  sorted = Object.keys(routes).sort().reverse()

  return this

}

module.exports.listen = function (port) {

  http.createServer(function (req, res) {

    var head = {
      'Accept-Ranges': 'bytes',
      'Content-Type': mime.txt,
      'Date': new Date().toUTCString(),
      'Server': serverName
    }

    var path = decodeURIComponent(url.parse(req.url).pathname)

    var end = function (status, text) {
      res.writeHead(status = status || 200, head)
      res.end('' + text)
      console.log(status + ' | ' + path)
    }

    sorted.some(function (route) {
      if (path.indexOf(route) == 0) {
        path = path.replace(route, routes[route])
        return true
      }
    })

    resolveURL(path, function (err, stats, file) {

      if (err) {
        return end(404, 'Not found')
      }

      var exts = file.split('/').pop().split('.')
      var ext = exts.pop().toLowerCase()
      if (ext === 'gz') {
        head['Content-Encoding'] = 'gzip'
        head['Vary'] = 'Accept-Encoding'
        ext = exts.pop().toLowerCase()
      }
      var type = mime[ext]

      if (!type) {
        return end(404, 'Not found')
      }

      head[mime.type] = type

      var etag = head['ETag'] = '"' + [stats.ino, stats.size, Number(stats.mtime)].join('-') + '"'
      var mtime = head['Last-Modified'] = stats.mtime.toUTCString()

      var range = (req.headers.range || '').match(rangeBytes)
      if (range !== null) {
        var l = stats.size - 1
        var x = parseFloat(range[1])
        var y = parseFloat(range[2] || l)
        if (x <= l && y <= l) {
          // we have a valid range
          head['Accept-Ranges'] = 'bytes'
          head['Cache-Control'] = 'no-cache'
          head['Content-Length'] = (y - x) + 1
          head['Content-Range'] = 'bytes ' + x + '-' + y + '/' + stats.size
          res.writeHead(206, head)
          fs.createReadStream(file, { start:x, end:y }).pipe(res)
          console.log('206 | ' + file + ' | ' + head['Content-Range'])
          return
        }
      }

      if ( mtime === req.headers['if-modified-since'] ||
            etag === req.headers['if-none-match'] ) {
        delete head[mime.type]
        end(304)
      }

      else {
        head['Content-Length'] = stats.size
        res.writeHead(200, head)
        fs.createReadStream(file).pipe(res)
        console.log('200 | ' + file)
      }

    })

  }).listen(port = port || 80)

  console.log(serverName + ' running on ' + myip + (port === 80 ? '' : ':' + port))

  return this

}

                                                                               

function getIPs(version) {
  var family = 'IPv' + (version || 4)
  var nics = require('os').networkInterfaces()
  var ips = []
  for (var type in nics) {
    nics[type].forEach(function (nic) {
      if (!nic.internal && nic.family === family) {
        ips.push(nic.address)
      }
    })
  }
  return ips
}

function getMimeTypes() {
  return {
    type : 'Content-Type',
    css  : 'text/css',
    exe  : 'application/octet-stream',
    htm  : 'text/html',
    html : 'text/html',
    ico  : 'image/x-icon',
    jpg  : 'image/jpeg',
    js   : 'application/javascript',
    json : 'application/json',
    mp3  : 'audio/mpeg',
    mp4  : 'video/mp4',
    png  : 'image/png',
    txt  : 'text/plain',
    webm : 'video/webm',
    webp : 'image/webp',
    xml  : 'text/xml',
    xsl  : 'text/xml',
    xslt : 'text/xml'
  }
}

function resolveURL(url, fn) {
  fs.stat(url, function (err, stats) {

    if (err) {
      fn(err) // could try += '.html'?
    }

    else if (stats.isDirectory()) {
      if (!endsWithSlash.test(url)) {
        url += '/'
      }
      resolveURL(url += 'index.html', fn)
    }

    else {
      fn(undefined, stats, url)
    }

  })
}

