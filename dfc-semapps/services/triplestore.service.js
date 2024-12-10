const { TripleStoreService } = require('@semapps/triplestore');

module.exports = {
  mixins: [TripleStoreService],
  settings: {
    url: process.env.SEMAPPS_SPARQL_ENDPOINT,
    mainDataset: process.env.SEMAPPS_MAIN_DATASET,
    user: process.env.SEMAPPS_JENA_USER,
    password: process.env.SEMAPPS_JENA_PASSWORD
  },
  async started() {
    await this.broker.call('triplestore.dataset.create', {
      dataset: this.settings.mainDataset,
      secure: false
    });
  }
};
