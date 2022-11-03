const base64url = require('base64url');
const jose = require('node-jose');
const config=require("../../../configuration.js")
// const EntrepriseService=require("../service/entreprise.js")
const {UserService,singletonUserService}=require("../service/user.js")

async function middlware_express_oidc (req,res,next) {
  // console.log('MIDDLEWARE',req.originalUrl);
  var tokenRaw = req.headers.authorization||decodeURIComponent(req.query.token);
  // console.log('req',req.query.token);
  // console.log('req.headers',req.headers.authorization);
  if(tokenRaw==undefined){
    res.status(401)
    next(new Error('Missing Bearer Token'));
  }else {
    // console.log(req.headers.authorization);
    var token = tokenRaw.split(' ')[1];
    // console.log('token',tokenRaw.split(' '));
    if (token==null || token==undefined || token=='null') {
      res.status(401)
      next(new Error('Missing Bearer Token'));
    }else{
      var components = token.split('.');
      var header = JSON.parse(base64url.decode(components[0]));
      var payload = JSON.parse(base64url.decode(components[1]));
      var signature = components[2];
      var decodedSignature = base64url.decode(components[2])

      try {
        // console.log('token',token);
        let publicKey="-----BEGIN PUBLIC KEY-----"+config.OIDC.lesCommuns.public_key+"-----END PUBLIC KEY-----"
        // console.log('publicKey', publicKey);
        const key = await jose.JWK.asKey(publicKey, 'pem');
        const verifier = jose.JWS.createVerify(key);
        // console.log('BEFORE verify');
        const verified = await verifier
          .verify(token)
        // console.log('AFTER verify');
        req.oidcPayload=payload;
       // console.log('payload',payload);
        // let userService = new UserService();
        // console.log('middleware',req.protocol + '://' + req.get('host') + req.originalUrl);
        let user = await singletonUserService.connectUser(payload.preferred_username);
        req.user=user;
        // console.log('req.user',req.user);
        // req.accessToken=token;
        next()

      } catch (err) {
        console.log(err);
        res.status(401)
        next(new Error('Invalid Tocken'));
      }
    }
  }

}
module.exports = middlware_express_oidc
