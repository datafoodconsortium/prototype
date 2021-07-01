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
            // console.log(data['@id']);
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
          CONSTRUCT{
            ?sPlatform a dfc-b:CatalogItem
          }
          WHERE {
            ?sPlatform a dfc-b:CatalogItem;
                      dfc:owner <${user['@id']}>.
            NOT EXISTS {
              ?sPlatform dfc-t:hasPivot ?o2
            }
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let responseObject = await response.json();

        const items=responseObject['@graph']?responseObject['@graph']:responseObject['@id']?[responseObject]:[]

        const graph=[];
        for (const i of items) {
          const response= await fetch(i['@id'],{ headers: {
                      'accept': 'application/ld+json'
                    }});
          const ldpResource=await response.json();
          let graphItem={};
          // console.log('ldpResource',ldpResource);
          for(const keyLdpResource in ldpResource){
            if(!keyLdpResource.includes('@context')){
              graphItem[keyLdpResource]=ldpResource[keyLdpResource];
            }
          }
          graph.push(graphItem);
        }



        const out={
          '@context':responseObject['@context'],
          '@graph':graph
        }
        // console.log('out',out);

        resolve(out);
      } catch (e) {
        reject(e);
      }
    })

  }

  getOneImport(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await (await fetch(id, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        })).json() ;

        resolve(item);


      } catch (e) {
        reject(e);
      }
    })
  }

  getAllItem(user) {
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

        let single;
        if (framedRaw['@id']){
          single={};
          for(const keyFramedResource in framedRaw){
            if(!keyFramedResource.includes('@context')){
              single[keyFramedResource]=framedRaw[keyFramedResource];
            }
          }
        }


        let framed={
          '@context':framedRaw['@context'],
          '@graph':framedRaw['@graph']?framedRaw['@graph']:single?[single]:[]}

        for(let dfcItem of framed['@graph']){
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
          // console.log('dfcItem',dfcItem);
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
        // console.log('ID',id);
        const item = await (await fetch(id, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        })).json() ;

        const pivot = await (await fetch(item['dfc-t:hasPivot']['@id'], {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        })).json() ;

        item['dfc-t:hasPivot']=pivot;

        let represents = Array.isArray(pivot['dfc-t:represent'])?pivot['dfc-t:represent']:[pivot['dfc-t:represent']];
        represents = represents.filter(r=>r['@id']!=item['@id']);
        pivot['dfc-t:represent']=[];
        for (let represent of represents) {
          const representObj =  await (await fetch(represent['@id'], {
            method: 'GET',
            headers: {
              'accept': 'application/ld+json'
            }
          })).json() ;
          pivot['dfc-t:represent'].push(representObj);
        }



        resolve(item);


      } catch (e) {
        reject(e);
      }
    })
  }

  getOneLinkedItem(id) {
    return new Promise(async (resolve, reject) => {
      try {
          console.log('id',id);
         let item = await (await fetch('http://dfc-middleware:3000/sparql', {
           method: 'POST',
           body : `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
            PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
            PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
            PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
            PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
            PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            CONSTRUCT {
              ?s1 dfc-t:sameAs <${id}>;
                  dfc-t:hasPivot ?s2.
              ?s2 dfc-t:represent ?s3.
              ?s3 dfc-t:sameAs ?s4.
              ?s3 dfc-t:hostedBy ?s5.
              ?s5 rdfs:label ?s6.
            }
            WHERE {
              ?s1 dfc-t:sameAs <${id}>;
                  dfc-t:hasPivot ?s2.
              ?s2 dfc-t:represent ?s3.
              ?s3 dfc-t:sameAs ?s4.
              ?s3 dfc-t:hostedBy ?s5.
              ?s5 rdfs:label ?s6.
            }`,
           headers: {
             'accept': 'application/ld+json'
           }
         })).json() ;
         console.log('item before',item);
         item = await jsonld.frame(item, {
           "@context": {
             "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
             "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
             "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
             "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
             "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
             "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
             "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
             "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
             "dfc-t:sameAs": {
              "@id": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#sameAs",
              "@type": "@id"
             },

           },
           "dfc-t:sameAs":id
         });
         resolve(item);
      } catch (e) {
        reject(e);
      }
    })
  }

  getOneLinkedItemSimple(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await this.getOneLinkedItem(id);
        let sameAs = item['dfc-t:hasPivot']['dfc-t:represent'].map(r=>r['dfc-t:sameAs']).filter(r=>r!=undefined);
        console.log('sameAs',sameAs);
        item['dfc-t:sameAs']=sameAs;
        item['dfc-t:hasPivot']=undefined;
        item['dfc-t:hostedBy']=undefined;
        resolve(item);
      } catch (e) {
        reject(e);
      }
    })
  }

  updateOneItem(item) {
    return new Promise(async (resolve, reject) => {
      try {

        let oldItem= await this.getOneItem(item['@id']);
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
            "dfc-t:represent": item["dfc-t:hasPivot"]["dfc-t:represent"]
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        // const responseItemPlatform = await fetch(item['@id'], {
        //   method: 'Patch',
        //   body: JSON.stringify({
        //     "@context": {
        //       "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
        //       "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
        //       "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
        //       "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
        //       "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
        //       "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
        //       "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        //       "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
        //     },
        //     'dfc-b:references' : item['dfc-b:references'],
        //     // 'dfc-b:desription' : item['dfc-b:desription'],
        //     'dfc-b:sku' : item['dfc-b:sku'],
        //     'dfc-b:stockLimitation' : item['dfc-b:stockLimitation'],
        //     // product['dfc-b:hasUnit'] : catalog['dfc-b:hasUnit'];
        //   }),
        //   headers: {
        //     'accept': 'application/ld+json',
        //     'content-type': 'application/ld+json'
        //   }
        // });
        //

        console.log('url',item['dfc-b:references']['dfc-t:sameAs']['@id']);

        const responseSupplyPlatformSource = await fetch(item['dfc-b:references']['dfc-t:sameAs']['@id'], {
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
            'dfc-b:desription' : item['dfc-b:references']['dfc-b:desription'],
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });
        console.log(responseSupplyPlatformSource);
        console.log(await responseSupplyPlatformSource.text());

        resolve(item);
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
      // console.log("convertImportIdToReconciledId",convertImportIdToReconciledId);
      let importItem = await this.getOneImport(importId);

      let reconciled = reconciledId?await this.getOneItem(reconciledId):undefined;
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
              "dfc-t:sameAs": {
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
            "dfc-t:sameAs":undefined,
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
          // console.log('SOURCE',sourceObject);
          // console.log('TOKEN',user.token);
          const sourceResponse = await fetch(source, {
            method: 'GET',
            headers: {
              'authorization': 'JWT ' + user.token
            }
          })

          let sourceResponseRaw = await sourceResponse.text();
          // console.log('sourceResponseRaw',sourceResponseRaw);

          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');

          let sourceResponseObject = JSON.parse(sourceResponseRaw);
          // console.log('sourceResponseObject',JSON.stringify(sourceResponseObject));
          let context = sourceResponseObject['@context'] || sourceResponseObject['@Context']
          // const {'@base':base,...noBaseContext}= context;
          sourceResponseObject = await jsonld.compact(sourceResponseObject,context)
          // console.log('compactedItem',sourceResponseObject);
          let itemsToImport;
          const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceObject.slug);

          if (sourceObject.version == "1.5") {
            const affiliates = Array.isArray(sourceResponseObject['dfc-b:affiliates'])?sourceResponseObject['dfc-b:affiliates'][0]:sourceResponseObject['dfc-b:affiliates']
            itemsToImport = affiliates['dfc-b:manages'].map(i=>{
              const idSupply = i['dfc-b:references']['@id']||i['dfc-b:references']
              const supply = affiliates['dfc-b:supplies'].find(sp=>sp['@id']==idSupply)
              // console.log('supply',supply);
              return {
                ...i,
                'dfc-b:references': {
                  ...supply,
                  "dfc-t:hostedBy": platform['@id'],
                  "dfc:owner": user['@id'],
                  //embended data instead references
                  "@id":idSupply
                }
              }
            });
          } else {
            throw new Error("version not supported")
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
          if (everExistDfcItems['@id'] || (everExistDfcItems['@graph'] && everExistDfcItems['@graph'].length > 0)) {
            existing = true;
          }
          // console.log('existing',existing);


          let out=[];
          // let promises=[]
          try {
            // let compacted=[];
            //
            // for (var item of itemsToImport) {
            //               console.log('item',item);
            //   const compactedItem = await jsonld.compact(item,context)
            //   compacted.push(compactedItem);
            // }
            // const compacted= itemsToImport.map(async s=>{return await jsonld.compact(s,context)});
            // console.log('COMPACTED',compacted);
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
        console.log('import item',item['@id']);
        //TODO : deleted this. only for webinar
        item['dfc-b:offeredThrough']=undefined;
        item['dfc-t:sameAs']=item['@id'];
        item['dfc-b:references']['dfc-t:sameAs']=item['dfc-b:references']['@id'];

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
              "dfc-t:sameAs": {
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
