'use strict';
// const importModel = require('../ORM/import');
// const supplyModel = require('../ORM/supply');
// const representationPivotModel = require('../ORM/representationPivot');
const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');

class Platform {
  constructor() {}

  getAll() {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/ldp/platform', {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let platforms = await response.json();
        const out = await jsonld.frame(platforms, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc-t:Platform"
        });

        resolve(out);
      } catch (e) {
        reject(e);
      }
    })
  }

  getOnePlatformBySlug(slug,platformStored) {
    return new Promise(async (resolve, reject) => {
      try {
        // console.log('getOnePlatformBySlug',slug);
        let platform = this.configPlatforms['id']

        if (!platform){
          if(!platformStored){
            platformStored=await this.getAll();
          }

          platform=platformStored['@graph'].filter(p=>{
            const regexSlug = /.*\/(.*)/gm;
            const slugFragment=regexSlug.exec(p['@id']);
            return slugFragment[1]&&slugFragment[1].includes(slug);
          });

        }
        if(platform.length>0){
          resolve ( platform[0]);
        }else {
          reject (new Error('Platform not fonded by slug'))
        }
        // console.log('out',platform[0]);

      } catch (e) {
        reject(e);
      }
    })
  }

  getOnePlatform(id) {
    return new Promise(async (resolve, reject) => {
      try {
        // console.log('getOnePlatform',id);
        const response = await fetch(id, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        });
        if (response.status==404){
          throw new Error(`platform not found ${id}`)
        }
        let platform = await response.json();
        const framed = await jsonld.frame(platform, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc-t:Platform"
        });
        const out=framed

        resolve(out);

      } catch (e) {
        reject(e);
      }
    })
  }

  createOnePlatform(slug,data) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`http://dfc-middleware:3000/ldp/platform`, {
          method: 'POST',
          body:JSON.stringify({
            "@context": {
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
            },
            '@type':'dfc-t:Platform',
            ...data
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type':'application/ld+json',
            'slug':slug
          },
        });


        resolve(response.headers.get('location'));

      } catch (e) {
        reject(e);
      }
    })
  }

  initConfigPlatformBySlug(source,platformStored){
    return new Promise(async (resolve, reject) => {
      try {
        // console.log('source',source);
        try {
          let platform =await this.getOnePlatformBySlug(source.slug,platformStored);
          // console.log('FINDED',platform);
          this.configPlatforms[source.slug]=platform;
        } catch (e){
          // console.log('NOT FINDED');
          let newPlaformId = await this.createOnePlatform(source.slug,{
            'rdfs:label':source.name
          });
          console.log('_____________ newPlaformId',newPlaformId)
          let newPlaform = await this.getOnePlatform(newPlaformId);
          // console.log('newPlaform',newPlaform);
          this.configPlatforms[source.slug]=newPlaform;
        }
        resolve();
      } catch(e){
        reject (e);
      }
    })
  }

  updatePlatformsFromConfig() {
    return new Promise(async (resolve, reject) => {
      try {
        this.configPlatforms={};
        const existingPlatform = await this.getAll()
        let platformStored={
          '@context':existingPlatform['@context'],
          '@graph':existingPlatform['@graph']||[]
        };
        // console.log('INIT');
        await this.initConfigPlatformBySlug(
          {slug:'dfc','name':'Data Food Consortium'},
          platformStored
        )
        for (let source of config.sources){
          await this.initConfigPlatformBySlug(source,platformStored)
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    })
  }
}

module.exports ={
  PlatformService : Platform,
  platformServiceSingleton : new Platform()
}
