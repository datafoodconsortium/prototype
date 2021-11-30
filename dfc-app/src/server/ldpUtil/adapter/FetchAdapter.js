'use strict';


class FetchAdapter {
  constructor(config) {
    this.config=config;
  }

  async resolveById(id){
    const response = await fetch(id,{headers:this.config.headers});
    const result = await response.json();
    return result;
  }
}

module.exports = FetchAdapter;
