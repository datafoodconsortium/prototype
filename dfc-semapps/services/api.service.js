const ApiGatewayService = require('moleculer-web');
const { Routes: SparqlEndpointRoutes } = require('@semapps/sparql-endpoint');

module.exports = {
  mixins: [ApiGatewayService],
  settings: {
    cors: {
      origin: '*',
      exposedHeaders: '*'
    }
  },
  dependencies: ['ldp', 'sparqlEndpoint'],
  async started() {
    const routes = [
      ...(await this.broker.call('ldp.getApiRoutes')),
      ...(await this.broker.call('sparqlEndpoint.getApiRoutes')),
    ];
    routes.forEach(route => this.addRoute(route));
  }
};
