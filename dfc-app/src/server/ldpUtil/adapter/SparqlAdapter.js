'use strict';


class SparqlAdapter {
  constructor(config) {
    this.config=config;
  }

  async resolveById(id){
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      body: `
      ${this.config.prefix}
      CONSTRUCT  {
        ?s1 ?p1 ?o1 .
      }
      WHERE {
        BIND(<${id}> AS ?s1) .
        ?s1 ?p1 ?o1 .
      }
      `,
      headers: this.config.headers
    });
    const result =await response.json();
    // console.log('result',result);
    return  result;
  }
}

module.exports = SparqlAdapter;
