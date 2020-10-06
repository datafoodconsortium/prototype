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
        const out = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Platform"
        });

        resolve(out);
      } catch (e) {
        reject(e);
      }
    })
  }

  getOnePlatformBySlug(slug) {
    return new Promise(async (resolve, reject) => {
      try {
        resolve ( await this.getOnePlatform(`http://dfc-middleware:3000/ldp/platform/${slug}`) );
      } catch (e) {
        reject(e);
      }
    })
  }

  getOnePlatform(id) {
    return new Promise(async (resolve, reject) => {
      try {
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
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Platform"
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
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
            },
            '@type':'dfc:Platform',
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
  initDFCPlatform() {

    return new Promise(async (resolve, reject) => {
      try {

        try {
          let platform = await this.getOnePlatformBySlug('dfc');

          this.DFCPlaform = platform;
        } catch (e){
          let platformId = await this.createOnePlatform('dfc',{
            'rdfs:label':'Data Food Consortium'
          })
          let platform = await this.getOnePlatform(platformId);
          this.DFCPlaform = platform;
        }

        resolve();

      } catch (e) {
        reject(e);
      }
    })
  }

  updatePlatformsFromConfig() {
    return new Promise(async (resolve, reject) => {
      try {
        for (let source of config.sources){
          try {
            let platform =await this.getOnePlatformBySlug(source.slug);
          } catch (e){
            await this.createOnePlatform(source.slug,{
              'rdfs:label':source.name
            })
          }
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
