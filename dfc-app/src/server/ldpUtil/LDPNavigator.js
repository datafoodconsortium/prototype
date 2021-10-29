'use strict';

const jsonld = require('jsonld');
const sift = require('sift').default;

class LDPNavigator {
  constructor(config) {
    this.congig=config;
  }

  async filter(filter,contextData){
    console.log('BEFORE',contextData,filter);
    const flat = await jsonld.flatten(contextData,contextData['@context']);
    console.log('flat',flat);
    const result = flat['@graph'].filter(sift(filter));
    return result;
  }

  async find(filter,contextData){
    const filtered = await this.filter(filter,contextData);
        console.log('filtered',filtered.length,filtered);
    if(filtered.length==1){
      return filtered[0];
    }else if (filtered.length>1) {
      throw new Error(`to many results applying filter`)
    } else {
      throw new Error(`no results applying filter`)
    }
  }

  async get(mainData,contextData, property) {
    const rawProprty = mainData[property];
    if(typeof rawProprty === 'string' || rawProprty instanceof String){
        return await this.find({'@id':rawProprty},contextData);
    } else if(rawProprty!=undefined) {
      return rawProprty;
    } else {
      throw new Error(`mainData not contain property ${property}`)
    }
  }
}

module.exports = LDPNavigator;
