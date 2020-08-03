const FusekiAdminService = require('@semapps/fuseki-admin');

module.exports = {
  mixins: [FusekiAdminService],
  settings: {
    sparqlEndpoint: process.env.SEMAPPS_SPARQL_ENDPOINT,
    jenaUser: process.env.SEMAPPS_JENA_USER,
    jenaPassword: process.env.SEMAPPS_JENA_PASSWORD
  },
  async started() {
    await this.actions.initDataset({
      dataset: process.env.SEMAPPS_MAIN_DATASET
    });
  }
};
