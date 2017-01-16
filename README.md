# modernizr-server
Express middleware that exposes client modernizr data to the server.

# Install

    npm install --save modernizr-server

# Options
modernizr-server supports an options object as a parameter. (See an example below).

**storageMethod**: String

Default: 'cookie'
If you want to use a session, set this option as 'session'.  See 'Example (session)' below.  modernizr-server by default stores the modernizr information as a cookie.  This is good if you want to access the same modernizr on the client; however, modernizr builds can be pretty big.  If you want to use this method, we recommend that you use a smaller build. We also support 'session' as a storage method.  This is the preferred method. 

**cdn**: String

Default: 'https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js'
If no build options are given ('config' or 'build'), modernizr-server will use a [CDN](https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js) to load modernizr.  You can choose to use your own CDN as well.

    cdn: 'https://YourCDN.com/modernizr/...'

**config**: Object

Set the config option to create custom builds per client.  **NOTE**: this create the same build every time someone new makes a request.  This can potentially add more dynamics.  If you don't need this, Use the *build* option below.

    config: {
      "minify": true,
      "options": [
        "hasEvent",
        "html5shiv"
      ],
      "feature-detects": [
	    "canvas",
	    "webanimations"
	  ]
    }

For a full list of **feature-detects** checkout [config-all.json](https://github.com/Modernizr/Modernizr/blob/master/lib/config-all.json)

**build**: String

If you already have a preset modernizr build, you can use it with the fs module like this:

	build: fs.readFileSync('./modernizr-custom.js', 'UTF-8')

You can make a custom modernizr build [on their website.](https://modernizr.com/download?setclasses) This is the most recommended option because node won't have to create a custom build every time someone different connects to your webapp, and it keeps the modernizr build small.

**storageName**: String

Default: 'modernizr'
This will change the name of the cookie or session variable that modernizr-server sets.

**expires**: Number

Default: 0 (Session)

This will change the expiration time of the modernizr cookie in ms.  You should probably set this something very high.

# Example (cookie)
    // server.js
    const express = require('express')
    const cookieParser = require('cookie-parser')
    const modernizrServer = require('modernizr-server')

    const app = express()

    app.use(cookieParser())
    app.use(modernizrServer({
      config: {
        "minify": true,
        "options": [
          "hasEvent",
          "html5shiv"
        ],
        "feature-detects": [
          "canvas",
          "webanimations"
        ]
      },
    }))

    app.get('/', function(req, res) {
      let Modernizr = req.cookies.modernizr
      if (!Modernizr.canvas) {
        console.log('The client does not support canvas!')
        res.send('You should get a better web browser. :(')
      } else {
	    console.log('The client supports canvas!')
        res.send('Yay, you  support canvas! :)')
      }
    })

    app.listen(8000, function(err) {
      if (err) throw err
      console.log('listening at http://localhost:8000/')
    })


# Example (session)
    // server.js
    const express = require('express')
    const session = require('express-session')
    const modernizrServer = require('modernizr-server')

    const app = express()

    app.use(session({
      secret: 'MY_SECRET',
      resave: false,
      saveUninitialized: false
    }))
    
    app.use(modernizrServer({
      storageMethod: 'session',
      config: {
        "minify": true,
        "options": [
          "hasEvent",
          "html5shiv"
        ],
        "feature-detects": [
          "canvas",
          "webanimations"
        ]
      },
    }))
  
    app.get('/', function(req, res) {
      let Modernizr = req.session.modernizr // NOT 'req.cookies'
      if (!Modernizr.canvas) {
        console.log('The client does not support canvas!')
        res.send('You should get a better web browser. :(')
      } else {
	    console.log('The client supports canvas!')
        res.send('Yay, you  support canvas! :)')
      }
    })

    app.listen(8000, function(err) {
      if (err) throw err
      console.log('listening at http://localhost:8000/')
    })

# Using the same modernizr on the client
This is not currently supported with sessions. Add this to the beginning of your javascript to gain access to modernizr.

	  var Modernizr = document.cookies.modernizr

# Why?
Sometimes, it is necessary to have client data on the server.  If your website heavily relies on your client having a certain feature, it might be better to handle this on the server instead of loading the whole app to a client who can't run it.

# How it works
modernizr-server will load a modernizr build onto the client.  It will detect the functionality that you desire, then set a JSON cookie of that data.  Once this is complete, the page will refresh and the server will then have access to this cookie (i.e. req.cookies.modernizr).  As long as the client has the modernizr cookie, the server will never load modernizr to the client ever again.

# Credit
This was inspired by [rack-modernizr](https://github.com/marshally/rack-modernizr)
