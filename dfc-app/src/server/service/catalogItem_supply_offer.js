'use strict';
// const importModel = require('../ORM/import');
// const catalogModel = require('../ORM/catalog');
// const representationPivotModel = require('../ORM/representationPivot');

const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');
const {PlatformService,platformServiceSingleton} = require ('./platform.js')
// const LDPNavigator_SparqlAndFetch_Factory = require('./../ldpUtil/LDPNavigator_SparqlAndFetch_Factory')
const {LDPNavigator_SparqlAndFetch_Factory} = require("fix-esm").require('ldp-navigator')
// import {LDPNavigator_SparqlAndFetch_Factory} from 'ldp-navigator'
// const FetchAdapter = require('./../ldpUtil/adapter/FetchAdapter');
// const SparqlAdapter = require('./../ldpUtil/adapter/SparqlAdapter');


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
        let contextConfigRaw = config.context;
        let contextConfigResponse = await fetch(contextConfigRaw);
        let contextConfig = await contextConfigResponse.json();
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
            ?sPlatform ?p ?o.
          }
          WHERE {
            ?sPlatform a dfc-b:CatalogItem;
                      dfc:owner <${user['@id']}>;
                      ?p ?o.
            NOT EXISTS {
              ?sPlatform dfc-t:hasPivot ?o2
            }
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();

        items = await jsonld.compact(items,contextConfig)

        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory(
          {
            sparql:{
              endpoint:'http://dfc-middleware:3000/sparql',
              prefix:`
              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
              PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
              PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
              PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
              PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
              PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
              PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
              PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
              `,
              headers:{
                'accept': 'application/ld+json'
              }
            }
          }
        ).make();
        await ldpNavigator.init(items);
        const importItemsRaw = await ldpNavigator.filterInMemory({});
        let importItems=[];
        for (var importItem of importItemsRaw) {
          // console.log('before',importItem);
          // catalogItem = await ldpNavigator.dereference(catalogItem,['dfc-t:hostedBy','dfc-t:hasPivot']);
          importItem = await ldpNavigator.dereference(importItem,[
            {
              p:'dfc-t:hostedBy'
            },
            {
              p:'dfc-b:references',
              n: [
                {
                  p:'dfc-p:hasUnit'
                },
                {
                  p:'dfc-p:hasType'
                }
              ]
            }
            ]);

          importItems.push(importItem);
        }

        const out={
          '@context':items['@context'],
          '@graph':importItems
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
        let item = await (await fetch(id, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        })).json() ;
        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory(
          {
            sparql:{
              endpoint:'http://dfc-middleware:3000/sparql',
              prefix:`
              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
              PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
              PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
              PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
              PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
              PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
              PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
              PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
              `,
              headers:{
                'accept': 'application/ld+json'
              }
            }
          }
        ).make();
        await ldpNavigator.init(item);
        item = await ldpNavigator.dereference(item,[
          {
            p:'dfc-t:hostedBy'
          },
          {
            p:'dfc-b:references',
            n: [
              {
                p:'dfc-p:hasUnit'
              },
              {
                p:'dfc-p:hasType'
              }
            ]
          }
        ]);

        resolve(item);


      } catch (e) {
        reject(e);
      }
    })
  }

  getAllItem(user) {
    return new Promise(async (resolve, reject) => {
      try {

        const uriDfcPlatform =  (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
        let contextConfigRaw = config.context;
        let contextConfigResponse = await fetch(contextConfigRaw);
        let contextConfig = await contextConfigResponse.json();
        // console.log('uriDfcPlatform',uriDfcPlatform);
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
            ?sDFC ?p ?o.
          }
          WHERE {
              ?sDFC a dfc-b:CatalogItem ;
                  dfc-t:hostedBy <${uriDfcPlatform}> ;
                  dfc:owner <${user['@id']}>;
                  ?p ?o.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();

        items = await jsonld.compact(items,contextConfig)

        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory(
          {
            sparql:{
              endpoint:'http://dfc-middleware:3000/sparql',
              prefix:`
              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
              PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
              PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
              PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
              PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
              PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
              PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
              PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
              `,
              headers:{
                'accept': 'application/ld+json'
              }
            }
          }
        ).make();
        await ldpNavigator.init(items);
        const catalogItemsRaw = await ldpNavigator.filterInMemory({});
        let catalogItems=[];
        for (var catalogItem of catalogItemsRaw) {
          // console.log('before',catalogItem);
          // catalogItem = await ldpNavigator.dereference(catalogItem,['dfc-t:hostedBy','dfc-t:hasPivot']);
          catalogItem = await ldpNavigator.dereference(catalogItem,[
            {
              p:'dfc-t:hostedBy'
            },
            {
              p:'dfc-t:hasPivot',
              n: {
                    p:'dfc-t:represent',
                    n:[
                      {
                        p:'dfc-t:hostedBy'
                      },
                      {
                        p:'dfc-b:references',
                        n: [
                          {
                            p:'dfc-p:hasUnit'
                          },
                          {
                            p:'dfc-p:hasType'
                          }
                        ]
                      }
                    ]
                  }
            },
            {
              p:'dfc-b:references',
              n: [
                {
                  p:'dfc-p:hasUnit'
                },
                {
                  p:'dfc-p:hasType'
                }
              ]
            }
            ]);

          catalogItems.push(catalogItem);
        }

        for (let ci of catalogItems) {
          ci['dfc-t:hasPivot']['dfc-t:represent']=ci['dfc-t:hasPivot']['dfc-t:represent'].filter(r=>{
            return r['dfc-t:hostedBy']['@id']!= uriDfcPlatform
          })
        }

        resolve ({
          '@context':items['@context'],
          '@graph':catalogItems
        })

      } catch (e) {
        console.log(e);
        reject(e);
      }
    })
  }

  getOneItem(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const uriDfcPlatform =  (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
        // console.log('ID',id);
        let item = await (await fetch(id, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        })).json() ;

        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory(
          {
            sparql:{
              endpoint:'http://dfc-middleware:3000/sparql',
              prefix:`
              PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
              PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
              PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
              PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
              PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
              PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
              PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
              PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
              `,
              headers:{
                'accept': 'application/ld+json'
              }
            }
          }
        ).make();
        await ldpNavigator.init(item);

        item = await ldpNavigator.dereference(item,[
          {
            p:'dfc-t:hostedBy'
          },
          {
            p:'dfc-t:hasPivot',
            n: {
                  p:'dfc-t:represent',
                  n:[
                    {
                      p:'dfc-t:hostedBy'
                    },
                    {
                      p:'dfc-b:references',
                      n: [
                        {
                          p:'dfc-p:hasUnit'
                        },
                        {
                          p:'dfc-p:hasType'
                        }
                      ]
                    }
                  ]
                }
          },
          {
            p:'dfc-b:references',
            n: [
              {
                p:'dfc-p:hasUnit'
              },
              {
                p:'dfc-p:hasType'
              }
            ]
          }
        ]);

        item['dfc-t:hasPivot']['dfc-t:represent']=item['dfc-t:hasPivot']['dfc-t:represent'].filter(r=>{
          return r['dfc-t:hostedBy']['@id']!= uriDfcPlatform
        })

        resolve(item);


      } catch (e) {
        reject(e);
      }
    })
  }
  //
  // getOneLinkedItem(id) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //         // console.log('id',id);
  //        let item = await (await fetch('http://dfc-middleware:3000/sparql', {
  //          method: 'POST',
  //          body : `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  //           PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
  //           PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
  //           PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
  //           PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
  //           PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
  //           PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
  //           PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  //           CONSTRUCT {
  //             ?s1 dfc-t:sameAs <${id}>;
  //                 dfc-t:hasPivot ?s2.
  //             ?s2 dfc-t:represent ?s3.
  //             ?s3 dfc-t:sameAs ?s4.
  //             ?s3 dfc-t:hostedBy ?s5.
  //             ?s5 rdfs:label ?s6.
  //           }
  //           WHERE {
  //             ?s1 dfc-t:sameAs <${id}>;
  //                 dfc-t:hasPivot ?s2.
  //             ?s2 dfc-t:represent ?s3.
  //             ?s3 dfc-t:sameAs ?s4.
  //             ?s3 dfc-t:hostedBy ?s5.
  //             ?s5 rdfs:label ?s6.
  //           }`,
  //          headers: {
  //            'accept': 'application/ld+json'
  //          }
  //        })).json() ;
  //        // console.log('item before',item);
  //        item = await jsonld.frame(item, {
  //          "@context": {
  //            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
  //            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
  //            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
  //            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
  //            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
  //            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
  //            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  //            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  //            "dfc-t:sameAs": {
  //             "@id": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#sameAs",
  //             "@type": "@id"
  //            },
  //
  //          },
  //          "dfc-t:sameAs":id
  //        });
  //        resolve(item);
  //     } catch (e) {
  //       reject(e);
  //     }
  //   })
  // }
  //
  // getOneLinkedItemSimple(id) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const item = await this.getOneLinkedItem(id);
  //       let sameAs = item['dfc-t:hasPivot']['dfc-t:represent'].map(r=>r['dfc-t:sameAs']).filter(r=>r!=undefined);
  //       console.log('sameAs',sameAs);
  //       item['dfc-t:sameAs']=sameAs;
  //       item['dfc-t:hasPivot']=undefined;
  //       item['dfc-t:hostedBy']=undefined;
  //       resolve(item);
  //     } catch (e) {
  //       reject(e);
  //     }
  //   })
  // }

  updateOneItem(item, user) {
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


        try {
          if(item['dfc-b:references']['dfc-t:sameAs']){

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
                'dfc-b:description' : item['dfc-b:references']['dfc-b:description'],
              }),
              headers: {
                'accept': 'application/ld+json',
                'content-type': 'application/ld+json',
                'Authorization' : 'JWT ' + user['ontosec:token']
              }
            });

          }
        } catch (e) {
          console.error(e);
        }



        resolve(item);
      } catch (e) {
        reject(e);
      }
    })
  }

  // convertAllImportToReconciled(importsToConvert, user) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //
  //       let promisesConvert = importsToConvert.map(async importToConvert => {
  //         await this.convertImportToReconciled(importToConvert, undefined, user);
  //       })
  //       let inserted = await Promise.all(promisesConvert);
  //
  //
  //       resolve(inserted)
  //     } catch (e) {
  //       reject(e);
  //     }
  //   })
  // }

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

          const responseItemDFC = await fetch('http://dfc-middleware:3000/ldp/catalogItem', {
            method: 'POST',
            body: JSON.stringify(dfcItem),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          })

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


          const sourceResponse = await fetch(source, {
            method: 'GET',
            headers: {
              'authorization': 'JWT ' + user['ontosec:token'],
              'accept': 'application/ld+json'
            }
          })

          if (sourceResponse.status!=200){
            throw new Error(`connexion to serveur return status ${sourceResponse.status}, try new authentification`)
          }

          let sourceResponseRaw = await sourceResponse.text();

          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');

          let sourceResponseObject = JSON.parse(sourceResponseRaw);
          console.log('sourceResponseObject',JSON.stringify(sourceResponseObject));

          let contextConfigRaw = config.context;
          let contextConfigResponse = await fetch(contextConfigRaw);
          let contextConfig = await contextConfigResponse.json();


          sourceResponseObject['@context']={...sourceResponseObject['@context'],...contextConfig['@context']}

          sourceResponseObject = await jsonld.compact(sourceResponseObject,contextConfig)

          console.log('sourceResponseObject',sourceResponseObject);

          // console.log('NEW for IMPORT');
          const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory(
            {
              sparql:{
                endpoint:'http://dfc-middleware:3000/sparql',
                prefix:`
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
                PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
                PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
                PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
                PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
                PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                `,
                headers:{
                  'accept': 'application/ld+json'
                }
              }
            ,
            fetch:{
              headers:{
                'authorization': 'JWT ' + user['ontosec:token'],
                'accept': 'application/ld+json'
              }
            },
            forceArray:[
              'dfc-b:manages'
            ]
          }).make();
          ldpNavigator.init(sourceResponseObject)


          // if (sourceResponseObject['@graph']){
          //   let person = sourceResponseObject['@graph'].find(r=>r['@type'].includes('Person'));
          //   console.log('person',person);
          // }


          let itemsToImport=[];
          const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceObject.slug);

          if (sourceObject.version == "1.5" || sourceObject.version == "1.6" || sourceObject.version == "1.7") {
            // const affiliates = Array.isArray(sourceResponseObject['dfc-b:affiliates'])?sourceResponseObject['dfc-b:affiliates'][0]:sourceResponseObject['dfc-b:affiliates']
            const platformUser = await ldpNavigator.findInMemory({'@type':'dfc-b:Person'});
            console.log('platformUser',platformUser);
            const platformUserDereferences = await ldpNavigator.dereference(platformUser,{
              p: 'dfc-b:affiliates',
              n: {
                p: 'dfc-b:manages',
                n:{
                  p :'dfc-b:references'
                }
              }
            })

            console.log(platformUserDereferences);

            for (var manage of platformUserDereferences['dfc-b:affiliates']['dfc-b:manages']) {
              console.log('manage',manage);
              itemsToImport.push( {
                      ...manage,
              })
            }

          } else {
            throw new Error("version not supported")
          }

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

          let out=[];
          try {
            let promises = itemsToImport.map(item=>this.importItem(item,user,platform,existing,ldpNavigator));
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

  importItem(item, user, platform, convert, ldpNavigator) {

    return new Promise(async (resolve, reject) => {
      try {

        //TODO : convert to Generic
        item['dfc-b:offeredThrough']=undefined;
        // let references = item['dfc-b:references'];
        console.log('item',item);
        // let references= await ldpNavigator.get(item,'dfc-b:references',true);
        let references=item['dfc-b:references']
        if(references){
          let newReference = await this.importItem(references,user,platform,false,ldpNavigator);
          item['dfc-b:references']=newReference;
        }



        // console.log('import item',item);

        const responsePost = await fetch('http://dfc-middleware:3000/ldp/catalogItem', {
          method: 'POST',
          body: JSON.stringify({
            ...item,
            "@id":undefined,
            "dfc-t:hostedBy": platform['@id'],
            "dfc:owner": user['@id'],
            "@context": ldpNavigator.context,
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });


        const location = responsePost.headers.get('location');
        // console.log('location',location,responsePost.status);
        const responseGet = await fetch(location, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let importedItem=await responseGet.json()

        // console.log('importedItem',importedItem);

        if (convert === false) {
          await this.convertImportToReconciled(importedItem,undefined, user);
        }

        resolve(importedItem);
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports = CatalogService;
