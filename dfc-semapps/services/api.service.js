const ApiGatewayService = require('moleculer-web');
const { Routes: SparqlEndpointRoutes } = require('@semapps/sparql-endpoint');

module.exports = {
  mixins: [ApiGatewayService],
  settings: {
    cors: {
      origin: '*',
      exposedHeaders: '*'
    },
    routes: [...SparqlEndpointRoutes]
  },
  async started() {
    const routes = [
      ...(await this.broker.call('ldp.getApiRoutes')),
    ];
    routes.forEach(route => this.addRoute(route));
  }
};
