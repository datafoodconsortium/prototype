const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const safeRouter = express.Router();
const unsafeRouter = express.Router();
const bodyParser = require('body-parser');
const request = require('request');
const env = process.env;
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
let url = env.CONFIG_URL;

// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');
// console.log('ENV',env);
if(url==undefined || url==''){
  url = "https://simonlouvet.github.io/config-private/DFC-Proto/config.json"
}

app.use(cors())
app.use(bodyParser.json({
  limit: '10mb'
}))
app.use(bodyParser.urlencoded({
  limit: '10mb',
  extended: true
}))

request(url, {
  json: true
}, (err, result, body) => {
  if (err == undefined) {
    const configJson = result.body
    const content = 'module.exports = ' + JSON.stringify(result.body)
    fs.writeFile('./configuration.js', content, 'utf8', function(err) {
      if (err) {
        throw err
      } else {
        const config = require("../../configuration.js")
        const middlware_express_oidc = require('./auth/middlware-express-oidc.js');
        const productAPI = require('./api/product.js');
        const entrepriseAPI = require('./api/entreprise.js');
        const entrepriseUnsafe = require('./api/entrepriseUnsafe.js');
        const redirectAPI = require('./api/redirectAPI.js');
        const userAPI = require('./api/user.js');
        const configAPI = require('./api/config.js');
        console.log('config',config);
        app.use(session({
          secret: config.express.session_secret,
          maxAge: null
        })); //session secret
        safeRouter.use(middlware_express_oidc);
        app.use('/login/', unsafeRouter);
        app.use('/data/core', unsafeRouter);
        app.use('/data/core', safeRouter);
        app.use(passport.initialize());
        app.use(passport.session());
        let addOidcLesCommunsPassportToApp = require('./auth/passport-oidc.js');
        addOidcLesCommunsPassportToApp(unsafeRouter);
        entrepriseUnsafe(unsafeRouter);
        redirectAPI(safeRouter);
        productAPI(safeRouter);
        userAPI(safeRouter);
        configAPI(unsafeRouter,config);
        entrepriseAPI(safeRouter);

        const port = process.env.APP_PORT || 8080
        app.listen(port, function(err) {
          console.log('serveur started at port', port);
        })
        app.use((_err, req, res, next) => {
          if (_err) {
            console.log('error',_err);
            if (res.statusCode==undefined){
                res.status(500);
            }
            res.send({
              message: _err.message
            })
          }
        })
      }
    })
  } else {
    throw err;
  }

})
