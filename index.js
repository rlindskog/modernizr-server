const modernizr = require('modernizr')
const bodyParser = require('body-parser')

function modernizrExpress (options={}) {
  return (req, res, next) => {
    if (options.storageMethod == 'cookie') {
      handleCookie(req, res, next, options)
    } else if (options.storageMethod === 'session') {
      bodyParser.urlencoded({ extended: false })(req, res, handleSession(req, res, next, options))
    } else {
      handleCookie(req, res, next, options) // default
    }
  }
}

function handleCookie(req, res, next, options) {
  let storageName = options.storageName || 'modernizr' // default to 'modernizr'
  if (req.cookies === undefined) {
    throw (Error(noCookieMessage(req.cookies[storageName])))
  }
  if (req.cookies[storageName]) {
    req.cookies[storageName] = JSON.parse(req.cookies[storageName])
    // cookie already exists, continue
    next()
  } else {
    let expires = options.expires || 0 // default to expires=Session
    if (options.build) {
      let build = options.build
      let scriptToSend = modernizrJsBuild(build, storageName, setModernizrCookieJs, expires)
      res.send(scriptToSend)
    } else if (options.config) {
      // use the config and make a build...
      modernizr.build(options.config, build => {
        let scriptToSend = modernizrJsBuild(build, storageName, setModernizrCookieJs, expires)
        res.send(scriptToSend)
      })
    } else {
      // use a pre-configured CDN
      let cdn = options.cdn || 'https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js'
      let scriptToSend = modernizrJsCDN(cdn, storageName, setModernizrCookieJs, expires)
      res.send(scriptToSend)
    }
  }
}

function handleSession(req, res, next, options) {
  let storageName = options.storageName || 'modernizr' // default to 'modernizr'
  req.session.expires = options.expires || req.session.expires
  return () => {
    if (req.session === undefined) {
      throw (Error('Something went wrong'))
      // throw (Error(noCookieMessage(req.session[storageName])))
    }
    if (req.session[storageName]) {
      next()
    } else if (req.query[storageName] ) { // the request from the javascript
      req.session[storageName] = JSON.parse(req.query[storageName])
      next()
    } else { // the original request
      if (options.build) {
        let build = options.build
        let scriptToSend = modernizrJsBuild(build, storageName, setModernizrSessionJs)
        res.send(scriptToSend)
      } else if (options.config) {
        // use the config and make a build...
        modernizr.build(options.config, build => {
          let scriptToSend = modernizrJsBuild(build, storageName, setModernizrSessionJs)
          res.send(scriptToSend)
        })
      } else {
        // use a pre-configured CDN
        let cdn = options.cdn || 'https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js'
        let scriptToSend = modernizrJsCDN(cdn, storageName, setModernizrSessionJs)
        res.send(scriptToSend)
      }
    }
  }
}

function noCookieMessage(storageName) {
  return `Cannot read property '${storageName}' of undefined

  Make sure you have cookie-parser installed, and is used before modernizr-server.

  Try:

  npm install cookie-parser

  and

  const cookieParser = require('cookie-parser')
  const modernizrServer = require('modernizr-server')

  app.use(cookieParser())
  app.use(modernizrServer())

  ...

  see https://www.github.com/rlindskog/modernizr-server/ for more information
  `
}

function modernizrJsBuild (modernizrBuild, storageName, setModernizr, expires=0) {
  return `
    <script type="text/javascript">${modernizrBuild}</script>
    <script type="text/javascript">${setModernizr(storageName, expires)}</script>
  `
}

function modernizrJsCDN (modernizrCDN, storageName, setModernizr, expires=0) {
  return `
    <script type="text/javascript" src="${modernizrCDN}"></script>
    <script type="text/javascript">${setModernizr(storageName, expires)}</script>
  `
}

function setModernizrCookieJs (storageName, expires) {
  let expiresStr = expires === 0 ? `let expiresDate = 0` : `
    let now = new Date()
    now.setTime(now.getTime()+${expires})
    let expiresDate = now.toGMTString()
  `
  return `
    ${expiresStr}
    try {
      document.cookie = '${storageName}=' + JSON.stringify(Modernizr) + '; expires=' + expiresDate + ';';
      document.location.reload();
    } catch(e) {}
  `
}

function setModernizrSessionJs (storageName, expires) {
  return `
    try {
      function sendModernizr() {
        let xhttp = new XMLHttpRequest();
        let payload = JSON.stringify(Modernizr)
        xhttp.open("GET", document.location.pathname + '?${storageName}=' + payload, true);
        xhttp.send();
        document.location.reload();
      }
      sendModernizr();
    } catch(e) {};
  `
}

module.exports = modernizrExpress
