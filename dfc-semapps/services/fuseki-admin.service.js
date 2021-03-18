const FusekiAdminService = require('@semapps/fuseki-admin');

module.exports = {
  mixins: [FusekiAdminService],
  settings: {
    url: process.env.SEMAPPS_SPARQL_ENDPOINT,
    user: process.env.SEMAPPS_JENA_USER,
    password: process.env.SEMAPPS_JENA_PASSWORD
  },
  async started() {
    await this.actions.createDataset({
      dataset: process.env.SEMAPPS_MAIN_DATASET
    });
  }
};
