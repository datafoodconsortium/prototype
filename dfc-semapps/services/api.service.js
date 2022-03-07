const ApiGatewayService = require('moleculer-web');
module.exports = {
  mixins: [ApiGatewayService],
  settings: {
    cors: {
      origin: '*',
      methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
      exposedHeaders: '*'
    },
    requestTimeout:99
  },
  methods: {
    authenticate(ctx, route, req, res) {
      return Promise.resolve(ctx);
    },
    authorize(ctx, route, req, res) {
      return Promise.resolve(ctx);
    }
  }

};
