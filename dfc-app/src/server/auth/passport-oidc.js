const Issuer = require('openid-client').Issuer;
const Strategy = require('openid-client').Strategy;
const passport = require('passport');
const base64url = require('base64url');
const fs = require('fs');
const jose = require('node-jose');
const middlware_express_oidc = require('./middlware-express-oidc.js');
const request = require('request');
const {UserService,singletonUserService}=require("../service/user.js")

let addOidcLesCommunsPassportToApp = async function(router) {

  let config = require("../../../configuration.js")

  let lesCommunsIssuer = await Issuer.discover(config.OIDC.lesCommuns.issuer);
  const client = new lesCommunsIssuer.Client({
    client_id: config.OIDC.lesCommuns.client_id, // Data Food Consoritum in Hex
    client_secret: config.OIDC.lesCommuns.client_secret,
    redirect_uri: config.OIDC.lesCommuns.redirect_uri
  }); // => Client
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
    userinfo.accesstoken = tokenset.access_token;
    userinfo.idtoken = tokenset.id_token;
          // var components = userinfo.accesstoken.split('.');
          // var header = JSON.parse(base64url.decode(components[0]));
          // var payload = JSON.parse(base64url.decode(components[1]));
          // var signature = components[2];
          // var decodedSignature = base64url.decode(components[2])

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
      // referer=referer+'#'+req.query.app_referer;
      req.session.app_referer = req.query.app_referer
    }


    next()
  });

  router.get('/auth', passport.authenticate('oidc', {
    session: false
  }));

  router.get('/auth/cb', passport.authenticate('oidc', {
    failureRedirect: 'http://proto.datafoodconsortium.org/#/x-profil',
    session: false
  }), async (req, res) => {



    await singletonUserService.connectUser(res.req.user.preferred_username,res.req.user.accesstoken,res.req.user.idtoken);

    let redirect_url = req.session.referer + '?token=' + res.req.user.accesstoken;
    if (req.session.app_referer != undefined) {
      redirect_url = redirect_url + '#' + req.session.app_referer
    }
    res.redirect(redirect_url);
  });


  router.get('/auth/me', middlware_express_oidc, async function(req, res, next) {
    let config = require("../../../configuration.js");
    res.json({
      oidcPayload: req.oidcPayload,
      user: req.user
    });
  });

  router.get('/auth/logout', middlware_express_oidc, async function(req, res, next) {
    let user = req.user

    req.logout(); // Passport logout


    let options = {
        post_logout_redirect_uri:req.query.redirectUri,
    }


    if(user['ontosec:idToken']!=undefined){
      options.id_token_hint=user['ontosec:idToken']
    }

    // res.redirect(client.endSessionUrl(options));
    // let urlRedirect = client.endSessionUrl({
    //   post_logout_redirect_uri:encodeURIComponent(req.query.redirectUri),
    //   client_id:config.OIDC.lesCommuns.client_id
    // })


    res.redirect(client.endSessionUrl(options));

    // res.redirect(
    //   `${lesCommunsIssuer.end_session_endpoint}?post_logout_redirect_uri=${encodeURIComponent(req.query.redirectUri)}`,{
    //     client_id:config.OIDC.lesCommuns.client_id
    //   }
    // );
    next();
  });

}
module.exports = addOidcLesCommunsPassportToApp;
