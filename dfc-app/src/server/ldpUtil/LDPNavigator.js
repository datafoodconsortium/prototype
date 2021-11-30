'use strict';

const jsonld = require('jsonld');
const sift = require('sift').default;
const fetch = require('node-fetch');

// import jsonld from 'jsonld';
// import sift from 'sift';
// import fetch from  'node-fetch';

class LDPNavigator {
  constructor(config) {
    this.config=config||{}
  }

  async init(contextData){
    this.context=contextData['@context'];
    this.flatten= await jsonld.flatten(contextData,this.context);
    this.graph = this.flatten['@graph'];
    this.expand = await jsonld.expand(this.flatten);
  }

  setAdapters(adapters){
    this.adapters=adapters;
  }

  //
  async filterInMemory(filter){

    const result = this.graph.filter(sift(filter));
    return result;
  }
  //
  async findInMemory(filter){
    // console.log('ALLLOOO');
    const filtered = await this.filterInMemory(filter);
    // console.log('filtered',filtered.length,filtered);
    if(filtered.length==1){
      return filtered[0];
    }else if (filtered.length>1) {
      throw new Error(`to many results applying filter`)
    } else {
      throw new Error(`no results applying filter`)
    }
  }

  async resolveById(id,noContext){
    console.log('resolveById',id);
    let result = undefined
    if (result==undefined){
      // let resultInMemory = await this.findInMemory({'@id':id})
      let resultInMemory = this.graph.find(f=>f["@id"]==id);
      if (resultInMemory) {
        result= resultInMemory;
      }
    }
    if (result==undefined){
      for (var adapter of this.adapters) {
        let resultAdapter = await adapter.resolveById(id);
        if (resultAdapter['@id']){
          resultAdapter = await jsonld.compact(resultAdapter,this.context);
          const {'@context':context,...noContext}= resultAdapter;
          this.flatten['@graph'].push(noContext);
          this.graph = this.flatten['@graph'];
          this.expand = await jsonld.expand(this.flatten);
          result= noContext?noContext:resultAdapter;
          break;
        }
      };
    }
    return result;
  }

  unPrefix(property){
    let out;
    let url;
    for (const [key, value] of Object.entries(this.context)) {
      const regex  = new RegExp(`${key}:(.*)`,'gm');
      // const regex = /`${key}:(.*)`/gm;
      const result = regex.exec(property);
      if (result!=null){
        // out = result[1];
        // url = value;
        out = value+result[1]
        break;
      }
    }

    return out;
  }

  async get(mainData, property,noContext) {
    console.log('GET',mainData,property);
    const unPrefixedProperty = this.unPrefix(property);
    // console.log('mainData',mainData);
    // console.log('expand',JSON.stringify(this.expand));
    const mainDataInNavigator = await this.expand.find(e=>e['@id']==mainData['@id']);
    const rawProperty = mainDataInNavigator[unPrefixedProperty];
    // let rawProperty = mainDataInNavigator[property];
    // console.log(mainDataInNavigator,property,unPrefixedProperty,rawProperty);
    if(rawProperty){
      if(!Array.isArray(rawProperty)){
        rawProperty=[rawProperty];
      }

      let out=[];
      for (var prop of rawProperty) {
        if(prop['@id']){
          // const dereference = this.graph.find(f=>f["@id"]==prop['@id']);
          const dereference = await this.resolveById(prop['@id'],true);
          out.push(dereference);
        }else if(prop['@value']){
          // return prop['@value'];
          out.push(prop['@value'])
        }
      }

      if(!(Array.isArray(mainData[property])) && out.length==1 && !(this.config.forceArray && this.config.forceArray.includes(property))){
        out=out[0];
      }
      return out
    }else{
      return undefined;
    }
  }

  async dereference(mainData, propertiesSchema) {
    console.log('dereference',mainData,propertiesSchema);

    if(Array.isArray(mainData)){
      let result = [];
      for (var mainDataIteration of mainData) {
        result.push(await this.dereference(mainDataIteration,propertiesSchema))
      }
      return result;
    }else{
      // console.log('dereference CALL',mainData,propertiesSchema);
      let resultData={...mainData};
      let propertiesSchemaArray=[];
      if (!Array.isArray(propertiesSchema)){
        propertiesSchemaArray=[propertiesSchema];
      }else {
        propertiesSchemaArray=[...propertiesSchema]
      }
      for (var propertySchema of propertiesSchemaArray) {
        const property= propertySchema.p;
        const reference = await this.get(mainData, property,true);
        if (propertySchema.n && reference!=undefined){
        // console.log('dereference NEXT',reference);
          const dereference = await this.dereference(reference,propertySchema.n);
          // console.log('dereference NEXT END');
          resultData[property] = dereference;
        }else {
          // console.log('dereference LAST',reference);
          resultData[property] = reference;
        }
      }
      return resultData;
    }
  }
}


// module.exports = {
//     default:LDPNavigator,
//     LDPNavigator
// };
module.exports = LDPNavigator;

// export default LDPNavigator
