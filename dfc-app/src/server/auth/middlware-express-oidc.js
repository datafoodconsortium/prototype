const base64url = require('base64url');
const jose = require('node-jose');
const config=require("../../../configuration.js")
// const EntrepriseService=require("../service/entreprise.js")
const {UserService,singletonUserService}=require("../service/user.js")

async function middlware_express_oidc (req,res,next) {
  var tokenRaw = req.headers.authorization||decodeURIComponent(req.query.token);
  if(tokenRaw==undefined){
    res.status(401)
    next(new Error('Missing Bearer Token'));
  }else {
    var token = tokenRaw.split(' ')[1];
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
        let publicKey="-----BEGIN PUBLIC KEY-----"+config.OIDC.lesCommuns.public_key+"-----END PUBLIC KEY-----"
        const key = await jose.JWK.asKey(publicKey, 'pem');
        const verifier = jose.JWS.createVerify(key);
        const verified = await verifier
          .verify(token)
        req.oidcPayload=payload;
        // let userService = new UserService();
        let user = await singletonUserService.connectUser(payload.preferred_username);
        req.user=user;
        // req.accessToken=token;
        next()

      } catch (err) {
        res.status(401)
        next(new Error('Invalid Tocken'));
      }
    }
  }

}
module.exports = middlware_express_oidc
