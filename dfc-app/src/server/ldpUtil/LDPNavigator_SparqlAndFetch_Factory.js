'use strict';
const LDPNavigator = require('./LDPNavigator');
const FetchAdapter = require('./adapter/FetchAdapter');
const SparqlAdapter = require('./adapter/SparqlAdapter');

class LDPNavigator_SparqlAndFetch_Factory {
  constructor(config) {
    this.ldpNavigator=new LDPNavigator(config);
    this.config=config;

  }

  make(adapterClasses){
    const config =this.config;
    let adapters=[
      new SparqlAdapter(config?config.sparql:undefined),
      new FetchAdapter(config?config.fetch:undefined)
    ];
    // for (var adapterClasse of adapterClasses) {
    //   adapters.push(new adapterClasse(this.config));
    // }
    this.ldpNavigator.setAdapters(adapters)
    return this.ldpNavigator;
  }
}

module.exports = LDPNavigator_SparqlAndFetch_Factory;
