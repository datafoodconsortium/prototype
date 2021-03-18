'use strict';
// const importModel = require('../ORM/import');
// const catalogModel = require('../ORM/catalog');
// const representationPivotModel = require('../ORM/representationPivot');
const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');
const {PlatformService,platformServiceSingleton} = require ('./platform.js')

class CatalogService {
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
              dfc:owner <${user['@id']}>.
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
            console.log(data['@id']);
            if(data['@id'].includes('http')){
              const responseDelete = await fetch(data['@id'], {
                method: 'DELETE',
                headers: {
                  'accept': 'application/ld+json',
                  'content-type': 'application/ld+json'
                }
              });
            }

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
              rdf:type dfc-b:CatalogItem ;
              dfc-t:hostedBy ?s3 ;
              dfc-p:hasUnit ?s4 ;
              dfc:owner <${user['@id']}> .
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
        let items = await response.json();
        // console.log(items);
        const out = await jsonld.frame(items, {
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
          "@type": "dfc-b:CatalogItem"
        });

        // console.log("out", out);
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
                dfc-p:hasUnit ?s3.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();

        const framed = await jsonld.frame(items, {
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
          "@type": "dfc-b:CatalogItem"
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

  getAllItem(user) {
    return new Promise(async (resolve, reject) => {
      try {



        // console.log('QUERY',`
        //           PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        //           PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
        //           PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
        //           PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
        //           PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
        //           PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
        //           PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
        //           PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        //           CONSTRUCT  {
        //             ?sDFC dfc-t:hasPivot ?sPivot;
        //               dfc-t:hostedBy <http://dfc-middleware:3000/ldp/platform/dfc>.
        //             ?sPivot dfc-t:represent ?sPlatform.
        //           }
        //           WHERE {
        //               ?sDFC a dfc-b:CatalogItem ;
        //                 	dfc-t:hostedBy <${(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']}> ;
        //                   dfc:owner <${user['@id']}>;
        //             		dfc-t:hasPivot ?sPivot.
        //               ?sPivot dfc-t:represent ?sPlatform.
        //             	FILTER(?sDFC != ?sPlatform) .
        //           }
        //   `);

          // console.log('USER',user['@id']);
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
            ?sDFC dfc-t:hasPivot ?sPivot;
              dfc-t:hostedBy <${(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']}>.
            ?sPivot dfc-t:represent ?sPlatform.
          }
          WHERE {
              ?sDFC a dfc-b:CatalogItem ;
                  dfc-t:hostedBy <${(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']}> ;
                  dfc:owner <${user['@id']}>;
                dfc-t:hasPivot ?sPivot.
              ?sPivot dfc-t:represent ?sPlatform.
              FILTER(?sDFC != ?sPlatform) .
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();
        // console.log('items',items);

        let framedRaw = await jsonld.frame(items, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
          },
          "dfc-t:hostedBy": {
            "@id" :(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']
          }
        });


        let framed={};

        for(const keyFramedResource in framedRaw){
          if(!keyFramedResource.includes('@context')){
            framed[keyFramedResource]=framedRaw[keyFramedResource];
          }
        }

        framed={
          '@context':framedRaw['@context'],
          '@graph':framed['@graph']?framed['@graph']:[framed]
        }
                console.log('framed',framed);

        for(let dfcItem of framed['@graph']){
          console.log('ALLLO');
          const response= await fetch(dfcItem['@id'],{ headers: {
                      'accept': 'application/ld+json'
                    }});
          const ldpResource=await response.json();
          // console.log('ldpResource',ldpResource);
          for(const keyLdpResource in ldpResource){
            if(!keyLdpResource.includes('dfc-t:hasPivot') && !keyLdpResource.includes('@context')){
              dfcItem[keyLdpResource]=ldpResource[keyLdpResource];
            }
          }
          console.log('dfcItem',dfcItem);
          let represent =  dfcItem['dfc-t:hasPivot']['dfc-t:represent'];
          if (!Array.isArray(represent)){
            represent=[represent];
          }
          // console.log('represent',represent);
          for(let platformItem of represent){
            const response= await fetch(platformItem['@id'],{ headers: {
                        'accept': 'application/ld+json'
                      }});
            const ldpResource=await response.json();
            for(const keyLdpResource in ldpResource){
              if(!keyLdpResource.includes('dfc-t:hasPivot') && !keyLdpResource.includes('@context')){
                platformItem[keyLdpResource]=ldpResource[keyLdpResource];
              }
            }
          }
          dfcItem['dfc-t:hasPivot']['dfc-t:represent']=represent;
          // console.log('dfcItem AFTER',dfcItem);
        };


        resolve(framed);

      } catch (e) {
        reject(e);
      }
    })
  }

  getOneItem(id) {
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
                dfc-p:hasUnit ?s6.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3;
                dfc-t:represent ?s4.
            ?s4 ?p4 ?o4;
               	dfc-t:hostedBy ?s5;
                dfc-p:hasUnit ?s7.
            ?s5 ?p5 ?o5.
            ?s6 ?p6 ?o6.
            ?s7 ?p7 ?o7.

          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();
        // console.log(platformServiceSingleton.DFCPlaform['@id']);
        // console.log('getOneItem',items);
        let framed = await jsonld.frame(items, {
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
          "@type": "dfc-b:CatalogItem",
          "dfc-t:hostedBy":{
            "@id":(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']
          }
        });
        // console.log('getOneItem framed',framed);
        // const root = framed['@graph']?framed['@graph'].filter(p=>p['dfc-t:hostedBy']&&p['dfc-t:hostedBy']['rdfs:label'])[0]:{}
        // // console.log('root',root);

        framed={
          '@context':framed['@context'],
          '@graph':framed['@graph']?framed['@graph'].filter(p=>p['dfc-t:hostedBy']&&p['dfc-t:hostedBy']['rdfs:label']):[]
        }

        framed['@graph'].forEach(f=>{
          const represent=f['dfc-t:hasPivot']['dfc-t:represent']
          represent.forEach(r=>{
            if(r['@id']&&r['dfc-p:hasUnit']){
              let unitId=r['dfc-p:hasUnit']['@id']||r['dfc-p:hasUnit']
              let unit = catalogs['@graph'].find(s2=>s2['@id']===unitId);
              if(unit){
                if (unit['label']&&!unit['rdfs:label']){
                  unit['rdfs:label']=unit['label'];
                }
                r['dfc-p:hasUnit']= unit;
              }
            }
          })
        })

        framed={
          '@context':framed['@context'],
          ...framed['@graph'][0]
        }

        resolve(framed);


      } catch (e) {
        reject(e);
      }
    })
  }

  getupdateOneItem(item) {
    return new Promise(async (resolve, reject) => {
      try {

        let oldItem= await this.getOneItem(catalog['@id']);
        // console.log('product["dfc-t:hasPivot"]["dfc-t:represent"]',product["dfc-t:hasPivot"]["dfc-t:represent"]);
        let oldRepresent = oldItem["dfc-t:hasPivot"]["dfc-t:represent"].filter(i => {
          if (i["@id"] == oldItem["@id"]) {
            return false;
          } else {
            //representation existing in old but not new catalog
            return item["dfc-t:hasPivot"]["dfc-t:represent"].filter(i2 => i2['@id'] == i['@id']).length == 0
          }
        });

        // console.log('oldRepresent',oldRepresent);
        oldRepresent.forEach(async r => {
          const responseItemPlatform = await fetch(r['@id'], {
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

        const responsePivotPatch = await fetch(item["dfc-t:hasPivot"]['@id'], {
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
            "dfc-t:represent": catalog["dfc-t:hasPivot"]["dfc-t:represent"]
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        const responseItemPlatform = await fetch(item['@id'], {
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
            'dfc-b:description' : item['dfc-b:description'],
            'dfc-b:quantity' : item['dfc-b:quantity'],
            'dfc-p:hasUnit' : item['dfc-p:hasUnit'],
            // product['dfc-b:hasUnit'] : catalog['dfc-b:hasUnit'];
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        resolve(catalog);
      } catch (e) {
        reject(e);
      }
    })
  }

  convertAllImportToReconciled(importsToConvert, user) {
    return new Promise(async (resolve, reject) => {
      try {

        let promisesConvert = importsToConvert.map(async importToConvert => {
          await this.convertImportToReconciled(importToConvert, undefined, user);
        })
        let inserted = await Promise.all(promisesConvert);


        resolve(inserted)
      } catch (e) {
        reject(e);
      }
    })
  }

  convertImportIdToReconciledId(importId, reconciledId, user) {
    return new Promise(async (resolve, reject) => {
      let importItem = await this.getOneImport(importId);

      let reconciled = await this.getOneItem(reconciledId);
      // console.log('convertImportIdToCatalogId', importItem, catalogItem);

      let newItem = await this.convertImportToReconciled(importItem, reconciled, user);
      resolve(newItem);
    })
  }

  convertImportToReconciled(importToConvert, reconciled, user) {
    // console.log('convertImportToCatalog',importToConvert,reconciled);
    return new Promise(async (resolve, reject) => {
      try {
        if (reconciled == undefined || reconciled == null) {
          // console.log('NOT reconciled');
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
            "dfc:owner": {
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

          // console.log('importToConvert',importToConvert);
          const dfcPlaform=await platformServiceSingleton.getOnePlatformBySlug('dfc');
          let dfcItem = {
            ...importToConvert,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
              "dfc-t:hostedBy": {
                "@type": "@id",
              },
              "dfc:owner": {
                "@type": "@id"
              },
              "dfc-p:hasUnit": {
                "@type": "@id"
              },
              "dfc-p:hasType": {
                "@type": "@id"
              },
              "dfc-t:hasPivot": {
                "@type": "@id"
              },
              "dfc-b:references": {
                "@type": "@id"
              }
            },
            "dfc-b:references":{
              ...importToConvert['dfc-b:references'],
              "dfc-t:hostedBy": dfcPlaform['@id'],
              "dfc:owner":user['@id']
            },
            "dfc-t:hostedBy": dfcPlaform['@id'],
            "dfc:owner":user['@id'],
            "dfc-t:hasPivot": responsePivot.headers.get('location'),

          };



          // console.log("dfcItem",dfcItem);

          const responseItemDFC = await fetch('http://dfc-middleware:3000/ldp/catalogItem', {
            method: 'POST',
            body: JSON.stringify(dfcItem),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          })
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
                { "@id": responseItemDFC.headers.get('location'), "@type": "@id" }
              ]
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
          const responseItemPlatform = await fetch(importToConvert['@id'], {
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
          // let representationPivot = await representationPivotInstance.findById(catalog['dfc-t:hasPivot'])
          // await catalog.populate("dfc-t:hasPivot");
          // console.log('CONVERT',catalog,importToConvert);
          let pivot = reconciled["dfc-t:hasPivot"];
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



          const responseReconciledPlatform = await fetch(importToConvert['@id'], {
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
          console.log('SOURCE',sourceObject);
          // console.log('TOKEN',user.token);
          const sourceResponse = await fetch(source, {
            method: 'GET',
            headers: {
              'authorization': 'JWT ' + user.token
            }
          })

          let sourceResponseRaw = await sourceResponse.text();
          // console.log(sourceResponseRaw);

          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');

          const sourceResponseObject = JSON.parse(sourceResponseRaw);
          console.log(sourceResponseObject);

          let itemsToImport;
          const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceObject.slug);

          if (sourceObject.version == "1.5") {
            itemsToImport = sourceResponseObject['dfc-b:affiliates'][0]['dfc-b:manages'].map(i=>{
              const supply = sourceResponseObject['dfc-b:affiliates'][0]['dfc-b:supplies'].find(sp=>sp['@id']==i['dfc-b:references'])
              // console.log('supply',supply);
              return {
                ...i,
                'dfc-b:references': {
                  ...supply,
                  "dfc-t:hostedBy": platform['@id'],
                  "dfc:owner": user['@id'],
                  //embended data instead references
                  "@id":undefined
                }
              }
            });
          } else {
            return reject(new Error("version not supported"))
          }

          // console.log(JSON.stringify(itemsToImport));

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
                   rdf:type dfc-b:CatalogItem;
                   dfc:owner <${user['@id']}>;
                   dfc-t:hostedBy <${(await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id']}>.
               }
              `,
            headers: {
              'accept': 'application/ld+json'
            }
          });
          let everExistDfcItems = await response.json();
          let existing = false;
          if (everExistDfcItems['@graph'] && everExistDfcItems['@graph'].length > 0) {
            existing = true;
          }
          // console.log('existing',existing);
          let context = sourceResponseObject['@context'] || sourceResponseObject['@Context']
          let out=[];
          // let promises=[]
          try {
            let promises = itemsToImport.map(s=>this.importItem(s,user,sourceObject,existing));
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
          // let promises = catalogs.map(s=>this.importItem(s,user,sourceObject,existing));
          // out = await Promise.all(promises);



          resolve(out);
        }
      } catch (e) {
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
            "dfc:importInProgress":false
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });
        reject(e);
      }
    })
  }

  importItem(item, user, plateformConfig, convert) {

    return new Promise(async (resolve, reject) => {
      try {
        console.log('import item',item);

        const responsePost = await fetch('http://dfc-middleware:3000/ldp/catalogItem', {
          method: 'POST',
          body: JSON.stringify({
            ...item,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
              "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
              "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
              "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
              "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
              "dfc-t:hostedBy": {
                "@type": "@id",
              },
              "dfc:owner": {
                "@type": "@id"
              },
              "dfc-p:hasUnit": {
                "@type": "@id"
              },
              "dfc-p:hasType": {
                "@type": "@id"
              },
              "dfc-b:references": {
                "@type": "@id"
              },
            },
            "@type": "dfc-b:CatalogItem",
            "dfc-t:hostedBy": (await platformServiceSingleton.getOnePlatformBySlug(plateformConfig.slug))['@id'],
            "dfc:owner": user['@id']
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
        let importedItem=await responseGet.json()
        importedItem = await jsonld.frame(importedItem, {
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
          "@type": "dfc-b:CatalogItem"
        });

        if (convert === false) {
          await this.convertImportToReconciled(importedItem,undefined, user);
        }

        resolve(responseGet);
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = CatalogService;
