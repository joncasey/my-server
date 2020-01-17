
var mime = module.exports = function (file) {
  var ext = String(file).split('.').pop().toLowerCase()
  return mime.types[ext]
      || mime.types.exe
}

mime.types = {
  css: 'text/css',
  exe: 'application/octet-stream',
  htm: 'text/html',
  html: 'text/html',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  js: 'application/javascript',
  json: 'application/json; charset=utf-8',
  mkv: 'video/x-matroska',
  m4a: 'audio/mp4',
  m4v: 'video/mp4',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  png: 'image/png',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  webm: 'video/webm',
  webp: 'image/webp',
  xml: 'text/xml',
  xsl: 'text/xml',
  xslt: 'text/xml'
}

