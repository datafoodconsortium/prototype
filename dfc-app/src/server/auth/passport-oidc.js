const Issuer = require('openid-client').Issuer;
const Strategy = require('openid-client').Strategy;
const passport = require('passport');
const base64url = require('base64url');
let clientGlobal = undefined;
const fs = require('fs');
const jose = require('node-jose');
const middlware_express_oidc = require('./middlware-express-oidc.js');
const request = require('request');

let addOidcLesCommunsPassportToApp = async function(router) {
  let config = require("../../../configuration.js")
  // console.log('------------config',config);

  let lesCommunsIssuer = await Issuer.discover(config.OIDC.lesCommuns.issuer);
  //console.log('Les Communs Discovered issuer %s', JSON.stringify(lesCommunsIssuer));
  const client = new lesCommunsIssuer.Client({
    client_id: config.OIDC.lesCommuns.client_id, // Data Food Consoritum in Hex
    client_secret: config.OIDC.lesCommuns.client_secret,
    redirect_uri: config.OIDC.lesCommuns.redirect_uri
  }); // => Client
  clientGlobal = client;
  // console.log('client',client);
  const params = {
    // ... any authorization params
    // client_id defaults to client.client_id
    // redirect_uri defaults to client.redirect_uris[0]
    // response type defaults to client.response_types[0], then 'code'
    // scope defaults to 'openid'
  }


  passport.use('oidc', new Strategy({
    client,
    params
  }, (tokenset, userinfo, done) => {
    // console.log('OIDC CallBack success');
    // console.log('tokenset', tokenset);
    // console.log('userinfo', userinfo);
    // console.log('claims', tokenset.claims());
    // console.log('tokenset',tokenset);
    userinfo.accesstoken = tokenset.access_token;
          var components = userinfo.accesstoken.split('.');
          // console.log(components);
          // var header = JSON.parse(base64url.decode(components[0]));
          // var payload = JSON.parse(base64url.decode(components[1]));
          // var signature = components[2];
          // var decodedSignature = base64url.decode(components[2])
          // console.log('header', header);
          // console.log('payload', payload);
          // console.log('resource_access', payload.resource_access);
          // console.log('signature', signature);
          // console.log('decoded signature', decodedSignature);

    // User.findOne({
    //   id: tokenset.claims().sub
    // }, function(err, user) {
    //   if (err) return done(err);
    //   return done(null, user);
    // });
    done(null, userinfo);
  }));


  // start authentication request
  // options [optional], extra authentication parameters

  router.get('/auth?app_referer=:app_referer', async function(req, res, next) {
    next()
  });
  router.get('/auth', async function(req, res, next) {
    let referer = req.headers.referer;
    req.session.referer = referer;
    if (req.query.app_referer != undefined && req.query.app_referer != '' && req.query.app_referer != null) {
      // console.log('req.query.app_referer',req.query.app_referer);
      // referer=referer+'#'+req.query.app_referer;
      req.session.app_referer = req.query.app_referer
    }


    // console.log('auth headers', req.session.referer, req.session.app_referer);
    next()
  });

  router.get('/auth', passport.authenticate('oidc', {
    session: false
  }));

  router.get('/auth/cb', passport.authenticate('oidc', {
    failureRedirect: '/ui/login.html',
    session: false
  }), (req, res) => {

    // console.log('/auth/cb',res,req);
    // console.log('req.session.referer',req.session.referer);
    let redirect_url = req.session.referer + '?token=' + res.req.user.accesstoken;
    if (req.session.app_referer != undefined) {
      redirect_url = redirect_url + '#' + req.session.app_referer
    }
    // console.log('callback referer', req.session.referer, req.session.app_referer)
    res.redirect(redirect_url);
  });


  router.get('/auth/me', middlware_express_oidc, async function(req, res, next) {
    let config = require("../../../configuration.js");
    res.json({
      oidcPayload: req.oidcPayload,
      user: req.user
    });
  });

  router.get('/auth/logout', async function(req, res, next) {
    // console.log(req.query.redirectUri);
    req.logout(); // Passport logout
    res.redirect(
      `${lesCommunsIssuer.end_session_endpoint}?post_logout_redirect_uri=${encodeURIComponent(req.query.redirectUri)}`
    );
    next();
  });

}
module.exports = addOidcLesCommunsPassportToApp;
