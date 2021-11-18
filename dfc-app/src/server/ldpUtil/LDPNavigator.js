'use strict';

const jsonld = require('jsonld');
const sift = require('sift').default;

class LDPNavigator {
  constructor(contextData) {
    this.context=contextData['@context'];

    jsonld.flatten(contextData,this.context).then(flatten=>{
      // console.log('CONTEXT',this.context);
      this.flatten= flatten;
      this.graph = flatten['@graph'];
      jsonld.expand(this.flatten).then(expand=>{
        this.expand=expand;
      });
    });
  }
  //
  async filter(filter){
    // console.log('BEFORE',contextData,filter);
    // const flat = await jsonld.flatten(contextData,this.config.context);
    // console.log('flat',flat);
    // console.log('graph',this.graph);
    // console.log('filter',filter);
    const result = this.graph.filter(sift(filter));
    return result;
  }
  //
  async find(filter){
    // console.log('ALLLOOO');
    const filtered = await this.filter(filter);
    // console.log('filtered',filtered.length,filtered);
    if(filtered.length==1){
      return filtered[0];
    }else if (filtered.length>1) {
      throw new Error(`to many results applying filter`)
    } else {
      throw new Error(`no results applying filter`)
    }
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

  // async normalise(polyform){
  //   const flat = await jsonld.flatten(contextData,this.config.context);
  //   return flat['@graph'].filter(g=>g['@id']==polyform['@id']);
  // }

  async get(mainData, property,forceArray) {
    // console.log(mainData,property);
    const unPrefixedProperty = this.unPrefix(property);
    // console.log('mainData',mainData);
    console.log('expand',this.expand);
    const mainDataInNavigator = await this.expand.find(e=>e['@id']==mainData['@id']);
    const rawProperty = mainDataInNavigator[unPrefixedProperty];
    // let rawProperty = mainDataInNavigator[property];
    // console.log(mainDataInNavigator,property,rawProperty);
    if(rawProperty){
      if(!Array.isArray(rawProperty)){
        rawProperty=[rawProperty];
      }

      let out=rawProperty.map(prop=>{
        if(prop['@id']){
          const dereference = this.graph.find(f=>f["@id"]==prop['@id']);
          return dereference
        }else if(prop['@value']){
          return prop['@value'];
        }
      })

      if(!(Array.isArray(mainData[property])) && out.length==1 && forceArray!=true){
        out=out[0];
      }
      return out
    }else{
      return undefined;
    }
  }
}

module.exports = LDPNavigator;
