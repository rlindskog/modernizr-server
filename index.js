const modernizr = require('modernizr')

function modernizrExpress (options={}) {
  return (req, res, next) => {
    let cookieName = options.cookieName || 'modernizr' // default to 'modernizr'

    if (req.cookies === undefined) {
      throw (Error(`Cannot read property 'cookieName' of undefined

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
    ))
    }
    if (req.cookies[cookieName]) {
      req.cookies[cookieName] = JSON.parse(req.cookies[cookieName])
      // cookie already exists, continue
      next()
    } else {
      let expires = options.expires || 0 // default to expires=Session
      if (options.build) {
        let build = options.build
        let scriptToSend = modernizrJsBuild(build, cookieName, expires)
        res.send(scriptToSend)
      } else if (options.config) {
        // use the config and make a build...
        modernizr.build(options.config, build => {
          let scriptToSend = modernizrJsBuild(build, cookieName, expires)
          res.send(scriptToSend)
        })
      } else {
        // use a pre-configured CDN
        let cdn = options.cdn || 'https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js'
        let scriptToSend = modernizrJsCDN(cdn, cookieName, expires)
        res.send(scriptToSend)
      }
    }
  }
}

function modernizrJsBuild (modernizrBuild, cookieName, expires) {
  return `
    <script type="text/javascript">${modernizrBuild}</script>
    <script type="text/javascript">${setModernizrJs(cookieName, expires)}</script>
  `
}

function modernizrJsCDN (modernizrCDN, cookieName, expires) {
  return `
    <script type="text/javascript" src="${modernizrCDN}"></script>
    <script type="text/javascript">${setModernizrJs(cookieName, expires)}</script>
  `
}

function setModernizrJs (cookieName, expires) {
  let expiresStr = expires === 0 ? `let expiresDate = 0` : `
    let now = new Date()
    now.setTime(now.getTime()+${expires})
    let expiresDate = now.toGMTString()
  `
  return `
    ${expiresStr}
    try {
      document.cookie = '${cookieName}=' + JSON.stringify(Modernizr) + '; expires=' + expiresDate + ';'
      document.location.reload()
    } catch(e) {}
  `
}

module.exports = modernizrExpress
