'use strict';
// const importModel = require('../ORM/import');
// const supplyModel = require('../ORM/supply');
// const representationPivotModel = require('../ORM/representationPivot');
const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');
const {PlatformService,platformServiceSingleton} = require ('./platform.js')

class SupplyAndImport {
  constructor() {}

  cleanImport(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
          PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
          PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
          PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
          PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
          }
          WHERE {
            ?s1 ?p1 ?o1 ;
              dfc-t:owner <${user['@id']}>.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });

        let datas = await response.json();
        // console.log(datas);
        if(datas['@graph']){
          for(const data of datas['@graph']){
            const responseDelete = await fetch(data['@id'], {
              method: 'DELETE',
              headers: {
                'accept': 'application/ld+json',
                'content-type': 'application/ld+json'
              }
            });
          }
        }

        resolve({});
      } catch (e) {
        reject(e);
      }
    })
  }

  getAllImport(user) {
    // console.log('ALLLO');
    return new Promise(async (resolve, reject) => {
      try {
        // console.warn('getAllImport');

        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
          PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
          PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
          PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
          PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
            ?s3 ?p3 ?o3 .
            ?s4 ?p4 ?o4 .
          }
          WHERE {
            ?s1 ?p1 ?o1 ;
              rdf:type dfc-b:Product ;
              dfc-t:hostedBy ?s3 ;
              dfc-b:hasUnit ?s4 ;
              dfc-t:owner <${user['@id']}> .
            ?s3 ?p3 ?o3.
            ?s4 ?p4 ?o4.
            NOT EXISTS {
              ?s1 dfc-t:hasPivot ?o2.
              ?o2 a dfc-t:RepresentationPivot.
            }
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();
        console.log(supplies);
        const out = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc-b:Product"
        });

        console.log("out", out);
        resolve(out);
      } catch (e) {
        reject(e);
      }
    })

  }

  getOneImport(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
          PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
          PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
          PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
          PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            <${id}> ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
            ?s3 ?p3 ?o3 .
          }
          WHERE {
            <${id}> ?p1 ?o1;
                dfc-t:hostedBy ?s2;
                dfc-b:hasUnit ?s3.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();

        const framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc-b:Product"
        });
        // console.log('getOneImport',framed);
        const root = framed['@graph']?framed['@graph']:framed['@type']?framed:{}
        // console.log('root',root);
        const out={
          '@context':framed['@context'],
          ...root
        }

        resolve(out);


      } catch (e) {
        reject(e);
      }
    })
  }

  getAllSupply(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
          PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
          PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
          PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
          PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
            ?s3 ?p3 ?o3 .
            ?s4 ?p4 ?o4 .
            ?s5 ?p5 ?o5 .
            ?s6 ?p6 ?o6 .
            ?s7 ?p7 ?o7 .
          }
          WHERE {
            ?s1 ?p1 ?o1;
                a dfc-b:Product ;
                dfc-t:hostedBy <${(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']}> ;
                dfc-t:hasPivot ?s3;
                dfc-t:owner <${user['@id']}>;
                dfc-b:hasUnit ?s6.
            ?s1 dfc-t:hostedBy ?s2.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3;
                dfc-t:represent ?s4.
            ?s4 ?p4 ?o4;
                dfc-t:hostedBy ?s5;
                dfc-b:hasUnit ?s7.
            ?s5 ?p5 ?o5.
            ?s6 ?p6 ?o6.
            ?s7 ?p7 ?o7.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();

        let framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "dfc-t:hostedBy":{
              "@type":"@id"
            },
            "dfc-t:represent":{
              "@type":"@id"
            },
            "dfc-t:owner":{
              "@type":"@id"
            },
            "dfc-t:hasPivot":{
              "@type":"@id"
            },
            "dfc-b:hasUnit":{
              "@type":"@id"
            }
          },
          "@type": "dfc-b:Product",
          "dfc-t:hostedBy": (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']

        });


        framed={
          '@context':framed['@context'],
          '@graph':framed['@graph']?framed['@graph'].filter(p=>p['dfc-t:hostedBy']&&p['dfc-t:hostedBy']['rdfs:label']):[]
        }

        framed['@graph'].forEach(f=>{
          const represent=f['dfc-t:hasPivot']['dfc-t:represent']
          represent.forEach(r=>{
            if(r['@id']&&r['dfc-b:hasUnit']){
              let unitId=r['dfc-b:hasUnit']['@id']||r['dfc-b:hasUnit']
              let unit = supplies['@graph'].find(s2=>s2['@id']===unitId);
              if(unit){
                if (unit['label']&&!unit['rdfs:label']){
                  unit['rdfs:label']=unit['label'];
                }
                r['dfc-b:hasUnit']= unit;
              }
            }
          })
        })

        resolve(framed);

      } catch (e) {
        reject(e);
      }
    })
  }

  getOneSupply(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
          PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
          PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
          PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
          PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
            ?s3 ?p3 ?o3 .
            ?s4 ?p4 ?o4 .
            ?s5 ?p5 ?o5 .
            ?s6 ?p6 ?o6 .
            ?s7 ?p7 ?o7 .
          }
          WHERE {
            <${id}> ?p1 ?o1;
                dfc-t:hostedBy ?s2;
            		dfc-t:hasPivot ?s3;
                dfc-b:hasUnit ?s6.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3;
                dfc-t:represent ?s4.
            ?s4 ?p4 ?o4;
               	dfc-t:hostedBy ?s5;
                dfc-b:hasUnit ?s7.
            ?s5 ?p5 ?o5.
            ?s6 ?p6 ?o6.
            ?s7 ?p7 ?o7.

          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();
        // console.log(platformServiceSingleton.DFCPlaform['@id']);
        console.log('getOneSupply',supplies);
        let framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc-b:Product",
          "dfc-t:hostedBy":{
            "@id":(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']
          }
        });
        // console.log('getOneSupply framed',framed);
        // const root = framed['@graph']?framed['@graph'].filter(p=>p['dfc-t:hostedBy']&&p['dfc-t:hostedBy']['rdfs:label'])[0]:{}
        // // console.log('root',root);

        framed={
          '@context':framed['@context'],
          '@graph':framed['@graph']?framed['@graph'].filter(p=>p['dfc-t:hostedBy']&&p['dfc-t:hostedBy']['rdfs:label']):[]
        }

        framed['@graph'].forEach(f=>{
          const represent=f['dfc-t:hasPivot']['dfc-t:represent']
          represent.forEach(r=>{
            if(r['@id']&&r['dfc-b:hasUnit']){
              let unitId=r['dfc-b:hasUnit']['@id']||r['dfc-b:hasUnit']
              let unit = supplies['@graph'].find(s2=>s2['@id']===unitId);
              if(unit){
                if (unit['label']&&!unit['rdfs:label']){
                  unit['rdfs:label']=unit['label'];
                }
                r['dfc-b:hasUnit']= unit;
              }
            }
          })
        })

        framed={
          '@context':framed['@context'],
          ...framed['@graph'][0]
        }
        // console.log('getOneSupply framed 2',framed);
        // const out={
        //   '@context':framed['@context'],
        //   ...root
        // }

        resolve(framed);


      } catch (e) {
        reject(e);
      }
    })
  }

  updateOneSupply(supply) {
    return new Promise(async (resolve, reject) => {
      try {

        let product = await this.getOneSupply(supply['@id']);
        // console.log('product["dfc-t:hasPivot"]["dfc-t:represent"]',product["dfc-t:hasPivot"]["dfc-t:represent"]);
        let oldRepresent = product["dfc-t:hasPivot"]["dfc-t:represent"].filter(i => {
          if (i["@id"] == product["@id"]) {
            return false;
          } else {
            return supply["dfc-t:hasPivot"]["dfc-t:represent"].filter(i2 => i2['@id'] == i['@id']).length == 0
          }
        });

        // console.log('oldRepresent',oldRepresent);
        oldRepresent.forEach(async r => {
          const responseProductPlatform = await fetch(r['@id'], {
            method: 'Put',
            body: JSON.stringify({
              ...r,
              "@context": {
                "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
              },
              "dfc-t:hasPivot": undefined
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
        })

        const responsePivotPatch = await fetch(product["dfc-t:hasPivot"]['@id'], {
          method: 'Patch',
          body: JSON.stringify({
            "@context": {
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
            },
            "dfc-t:represent": supply["dfc-t:hasPivot"]["dfc-t:represent"]
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        const responseProductPlatform = await fetch(product['@id'], {
          method: 'Patch',
          body: JSON.stringify({
            "@context": {
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
            },
            'dfc-b:description' : supply['dfc-b:description'],
            'dfc-b:quantity' : supply['dfc-b:quantity'],
            'dfc-b:hasUnit' : supply['dfc-b:hasUnit'],
            // product['dfc-b:hasUnit'] : supply['dfc-b:hasUnit'];
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        resolve(supply);
      } catch (e) {
        reject(e);
      }
    })
  }

  convertAllImportToSupply(importsToConvert, user) {
    return new Promise(async (resolve, reject) => {
      try {

        let promisesConvert = importsToConvert.map(async importToConvert => {
          await this.convertImportToSupply(importToConvert, undefined, user);
        })
        let inserted = await Promise.all(promisesConvert);


        resolve(inserted)
      } catch (e) {
        reject(e);
      }
    })
  }

  convertImportIdToSupplyId(importId, supplyId, user) {
    return new Promise(async (resolve, reject) => {
      let importItem = await this.getOneImport(importId);

      let supplyItem = await this.getOneSupply(supplyId);
      // console.log('convertImportIdToSupplyId', importItem, supplyItem);

      let newSupply = await this.convertImportToSupply(importItem, supplyItem, user);
      resolve(newSupply);
    })
  }

  convertImportToSupply(importToConvert, supply, user) {
    // console.log('convertImportToSupply',importToConvert,supply);
    return new Promise(async (resolve, reject) => {
      try {
        if (supply == undefined || supply == null) {
          // let representationPivotInstance = await representationPivotModel.model.create({
          //   "dfc-t:represent": [importToConvert._id]
          // });
          const body = {
            '@context': {
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
            },
            '@type': 'dfc-t:RepresentationPivot',
            "dfc-t:owner": {
              "@id": user['@id'],
              "@type": "@id"
            }
          }
          const responsePivot = await fetch('http://dfc-middleware:3000/ldp/pivot', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
          // console.log('XXXXXXXXXX PIVOT',responsePivot.headers.get('location'));

          const dfcProduct = {
            ...importToConvert,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
            },
            "dfc-t:hostedBy": {
              "@type": "@id",
              "@id": (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'],
            },
            "dfc-t:owner": {
              "@id": user['@id'],
              "@type": "@id"
            },
            "dfc-t:hasPivot": {
              "@id": responsePivot.headers.get('location'),
              "@type": "@id"
            },
            // "dfc-b:hasUnit": {
            //   "@id": importToConvert['dfc-b:hasUnit'],
            //   "@type": "@id"
            // },
          };


          const responseProductDFC = await fetch('http://dfc-middleware:3000/ldp/product', {
            method: 'POST',
            body: JSON.stringify(dfcProduct),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          // console.log('pivot', responsePivot.headers.get('location'));
          const responsePivotPatch = await fetch(responsePivot.headers.get('location'), {
            method: 'Patch',
            body: JSON.stringify({
              "@context": {
                "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
              },
              "dfc-t:represent": [
                { "@id": importToConvert['@id'], "@type": "@id" },
                { "@id": responseProductDFC.headers.get('location'), "@type": "@id" }
              ]
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
          const responseProductPlatform = await fetch(importToConvert['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": {
                "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
              },
              "dfc-t:hasPivot": { "@id": responsePivot.headers.get('location'), "@type": "@id" }
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          const out = {
            "dfc-t:hasPivot": { "@id": responsePivot.headers.get('location')},
            ...importToConvert
          };


          resolve(out);

        } else {
          // let representationPivot = await representationPivotInstance.findById(supply['dfc-t:hasPivot'])
          // await supply.populate("dfc-t:hasPivot");
          // console.log('CONVERT',supply,importToConvert);
          let pivot = supply["dfc-t:hasPivot"];
          pivot["dfc-t:represent"].push({ "@id":  importToConvert['@id'], "@type": "@id" });
          const responsePivotPatch = await fetch(pivot['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": {
                "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
              },
              "dfc-t:represent":pivot["dfc-t:represent"]
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });



          const responseProductPlatform = await fetch(importToConvert['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": {
                "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
              },
              "dfc-t:hasPivot": { "@id": pivot['@id'], "@type": "@id" }
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          importToConvert["dfc-t:hasPivot"] = { "@id": pivot['@id'], "@type": "@id" };
          // await pivot.save();

          // await importToConvert.save();
          resolve(importToConvert);
        }
      } catch (e) {
        reject(e);
      }
    })
  }

  importSource(source, user) {
    return new Promise(async (resolve, reject) => {
      // console.log(user);
      // console.log(await platformServiceSingleton.getOnePlatformBySlug('dfc'))
      try {
        // console.log(user['dfc:importInProgress']);
        if(user['dfc:importInProgress']==true){
          reject(new Error("import in progress. Not possible to process an other"))
        }else {
          const responseProgressOn = await fetch(user['@id'], {
            method: 'PATCH',
            body: JSON.stringify({
              "@context": {
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
              },
              "dfc:importInProgress":true
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });


          let sourceObject = config.sources.filter(so => source.includes(so.url))[0];
          const sourceResponse = await fetch(source, {
            method: 'GET',
            headers: {
              'authorization': 'JWT ' + user.token
            }
          })

          let sourceResponseRaw = await sourceResponse.text();

          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');

          const sourceResponseObject = JSON.parse(sourceResponseRaw);

          let supplies;
          if (sourceObject.version == "1.1") {
            supplies = sourceResponseObject['dfc:Entreprise']['dfc:supplies'];
          } else if (sourceObject.version == "1.2") {
            supplies = sourceResponseObject['dfc:supplies'];
          } else if (sourceObject.version == "1.3") {
            supplies = sourceResponseObject['dfc:affiliates'][0]['dfc:supplies'];
          }else if (sourceObject.version == "1.4") {
            supplies = sourceResponseObject['dfc-b:affiliates'][0]['dfc-b:supplies'];
          }else if (sourceObject.version == "1.5") {
            supplies = sourceResponseObject['dfc-b:affiliates'][0]['dfc-b:supplies'];
          }

          supplies = supplies.map(supply=>({
            ...supply,
            'dfc-b:hasUnit': supply['dfc-b:hasUnit']||supply['dfc:hasUnit'],
            'dfc-b:quantity': supply['dfc-b:quantity']||supply['dfc:quantity'],
            'dfc-b:description': supply['dfc-b:description']||supply['dfc:description'],
            'dfc-b:totalTheoriticalStock': supply['dfc-b:totalTheoriticalStock']||supply['dfc:totalTheoriticalStock'],
            'dfc-b:brand': supply['dfc-b:brand']||supply['dfc:brand'],
            'dfc-b:claim': supply['dfc-b:claim']||supply['dfc:claim'],
            'dfc-b:image': supply['dfc-b:image']||supply['dfc:image'],
            'dfc-b:lifeTime': supply['dfc-b:lifeTime']||supply['dfc:lifeTime'],
            'dfc-b:physicalCharacterisctics': supply['dfc-b:physicalCharacterisctics']||supply['dfc:physicalCharacterisctics']
          }))

          // console.log(supplies);
          const response = await fetch('http://dfc-middleware:3000/sparql', {
            method: 'POST',
            body: `
              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
              PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
              PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
              PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
              PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
              PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
              PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
              PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
              CONSTRUCT  {
                ?s1 ?p1 ?o1 .
              }
              WHERE {
                 ?s1 ?p1 ?o1;
                   rdf:type dfc-b:Product;
                   dfc-t:owner <${user['@id']}>;
                   dfc-t:hostedBy <${(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']}>.
               }
              `,
            headers: {
              'accept': 'application/ld+json'
            }
          });
          let everExistDfcProducts = await response.json();
          let existing = false;
          if (everExistDfcProducts['@graph'] && everExistDfcProducts['@graph'].length > 0) {
            existing = true;
          }
          // console.log('existing',existing);
          let context = sourceResponseObject['@context'] || sourceResponseObject['@Context']
          let out=[];
          // let promises=[]
          try {
            let promises = supplies.map(s=>this.importSupply(s,user,sourceObject,existing));
            out = await Promise.all(promises);
          } catch (e) {
            console.log(e);
            throw new Error('error during import')
          } finally {
            const responseProgressOff = await fetch(user['@id'], {
              method: 'PATCH',
              body: JSON.stringify({
                "@context": {
                  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                  "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                  "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
                  "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
                  "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
                  "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
                  "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
                },
                "dfc:importInProgress":false
              }),
              headers: {
                'accept': 'application/ld+json',
                'content-type': 'application/ld+json'
              }
            });
          }
          // let promises = supplies.map(s=>this.importSupply(s,user,sourceObject,existing));
          // out = await Promise.all(promises);



          resolve(out);
        }
      } catch (e) {
        reject(e);
      }
    })
  }

  importSupply(supply, user, plateformConfig, convert) {

    return new Promise(async (resolve, reject) => {
      try {
        console.log('supply',supply);
        let unit = supply['dfc-b:hasUnit']?supply['dfc-b:hasUnit']['@id']||supply['dfc-b:hasUnit']:undefined;
        // console.log('unit',unit);
        if (unit){
          if (unit.includes('dfc-u:') || unit.includes('http://static.datafoodconsortium.org/data/units.rdf')){
            supply['dfc-b:hasUnit']={
              "@id":unit,
              "@type":"@id"
            }
          }
          else{
            const regex = /.*\/(\w*)/gm;
            const unitFragment=regex.exec(unit)[1];
            // console.log('unitFragment',unitFragment);
            const unitId = `http://static.datafoodconsortium.org/data/units.rdf#${unitFragment}`;
            supply['dfc-b:hasUnit']={
              "@id":unitId,
              "@type":"@id"
            }
          }
        }
        // console.log('supply',supply);
        const responsePost = await fetch('http://dfc-middleware:3000/ldp/product', {
          method: 'POST',
          body: JSON.stringify({
            ...supply,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#"
            },
            "@type": "dfc-b:Product",
            "dfc-t:hostedBy": {
              '@type': '@id',
              '@id': `${(await platformServiceSingleton.getOnePlatformBySlug(plateformConfig.slug))['@id']}`
            },
            "dfc-t:owner": {
              "@id": user['@id'],
              "@type": "@id"
            }
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        const responseGet = await fetch(responsePost.headers.get('location'), {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        });
        const importedItem=await responseGet.json()

        if (convert === false) {
          await this.convertImportToSupply(importedItem,undefined, user);
        }

        resolve(responseGet);
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = SupplyAndImport;

