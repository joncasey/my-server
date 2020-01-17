
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
  m4a: 'audio/mp4',
  m4s: 'video/mp4',
  m4v: 'video/mp4',
  mjs: 'application/javascript',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mpd: 'application/dash+xml',
  png: 'image/png',
  svg: 'image/svg+xml',
  ts: 'video/MP2T',
  txt: 'text/plain',
  vtt: 'text/vtt',
  webm: 'video/webm',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  xml: 'text/xml',
  xsl: 'text/xml',
  xslt: 'text/xml'
}

