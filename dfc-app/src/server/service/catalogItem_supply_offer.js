'use strict';
// const importModel = require('../ORM/import');
// const catalogModel = require('../ORM/catalog');
// const representationPivotModel = require('../ORM/representationPivot');

const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');
const {
  PlatformService,
  platformServiceSingleton
} = require('./platform.js')
// const LDPNavigator_SparqlAndFetch_Factory = require('./../ldpUtil/LDPNavigator_SparqlAndFetch_Factory')
const {
  SparqlAdapter,
  FetchAdapter,
  LDPNavigator,
  LDPNavigator_SparqlAndFetch_Factory
} = require("fix-esm").require('ldp-navigator')
// import {LDPNavigator_SparqlAndFetch_Factory} from 'ldp-navigator'
// const FetchAdapter = require('./../ldpUtil/adapter/FetchAdapter');
// const SparqlAdapter = require('./../ldpUtil/adapter/SparqlAdapter');
const SparqlTools = require('./../util/sparqlTools.js')

const PREFIX=`
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
  PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
  PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
  PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
  PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
  PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  `


class CatalogService {
  constructor() {
    this.init();
  }

  async init() {
    if (!this.context) {
      let contextConfigRaw = config.context;
      this.context = await this.resolveContext(contextConfigRaw);
      // console.log('this.context', this.context);
    }
  }

  async resolveContext(contextUrl){
    let contextConfigResponse = await fetch(contextUrl);
    // console.log('contextConfigResponse',contextConfigResponse);
    return (await contextConfigResponse.json())['@context']
  }

  cleanImport(user) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        console.log('cleanImport for user ',user['@id'],);
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `${PREFIX}
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
        console.log(datas);
        const sparqlTools = new SparqlTools({
          context: this.context
        });
        if(datas['@id'] && datas['@id'].includes('http') ){
            sparqlTools.remove(datas['@id']);
        }
        if (datas['@graph']) {
          for (const data of datas['@graph']) {
            // console.log(data['@id']);
            if (data['@id'].includes('http')) {
              sparqlTools.remove(data['@id']);
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
          body: `${PREFIX}
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

        // console.log('------------1');
        let items = await response.json();

        items = await jsonld.compact(items, contextConfig)

        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory({
          sparql: {
            query: {
              endpoint: 'http://dfc-middleware:3000/sparql',
              headers: {
                'accept': 'application/ld+json'
              },
              prefix: PREFIX
            },
            update: {
              endpoint: 'http://dfc-fuseki:3030/localData/update',
              headers: {
                'Content-Type': 'application/sparql-update',
                Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
              }
            }
          },
          forceArray: ['dfc-t:represent']
        }).make();
        // console.log('BEFORE app init');
        await ldpNavigator.init(items);
        // console.log('AFTER app init');
        const importItemsRaw = await ldpNavigator.filterInMemory({});
        // console.log('importItemsRaw',importItemsRaw);
        let importItems = [];
        for (var importItem of importItemsRaw) {
          // console.log('before',importItem);
          // catalogItem = await ldpNavigator.dereference(catalogItem,['dfc-t:hostedBy','dfc-t:hasPivot']);
          console.log('BEFORE app derefrence');
          importItem = await ldpNavigator.dereference(importItem, [{
              p: 'dfc-t:hostedBy'
            },
            {
              p: 'dfc-b:references',
              n: [{
                  p: 'dfc-b:hasQuantity',
                  n:[{
                    p:'dfc-b:hasUnit'
                  }]
                },
                {
                  p: 'dfc-p:hasType'
                }
              ]
            }
          ]);

          importItems.push(importItem);
        }
        // console.log('------------2');
        // console.log('importItems',importItems);

        const out = {
          '@context': items['@context'],
          '@graph': importItems
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
        await this.init();
        // let item;
        // let item = await (await fetch(id, {
        //   method: 'GET',
        //   headers: {
        //     'accept': 'application/ld+json'
        //   }
        // })).json() ;
        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory({
          sparql: {
            query: {
              endpoint: 'http://dfc-middleware:3000/sparql',
              headers: {
                'accept': 'application/ld+json'
              },
              prefix: PREFIX
            },
            update: {
              endpoint: 'http://dfc-fuseki:3030/localData/update',
              headers: {
                'Content-Type': 'application/sparql-update',
                Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
              }
            }
          },
          forceArray: ['dfc-t:represent'],
          context: this.context
        }).make();
        // console.log('ldpNavigator init', id);
        let item = await ldpNavigator.resolveById(id);
        // console.log('item', item);
        item = await ldpNavigator.dereference(item, [{
            p: 'dfc-t:hostedBy'
          },
          {
            p: 'dfc-b:references',
            n: [{
                p: 'dfc-b:hasQuantity',
                n:[{
                  p:'dfc-b:hasUnit'
                }]
              },
              {
                p: 'dfc-p:hasType'
              }
            ]
          }
        ]);
        // console.log('item', item);
        resolve(item);


      } catch (e) {
        reject(e);
      }
    })
  }

  getAllItem(user) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const uriDfcPlatform = (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
        const query = ` ${PREFIX}
                        CONSTRUCT  {
                          ?sDFC ?p ?o.
                        }
                        WHERE {
                            ?sDFC a dfc-b:CatalogItem ;
                                dfc-t:hostedBy <${uriDfcPlatform}> ;
                                dfc:owner <${user['@id']}>;
                                ?p ?o.
                        }
                        `
        // console.log('query',query);
        // console.log('uriDfcPlatform',uriDfcPlatform);
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: query,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();

        // console.log('items',items);

        items = await jsonld.compact(items, this.context);

        console.log('items',items);

        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory({
          sparql: {
            query: {
              endpoint: 'http://dfc-middleware:3000/sparql',
              headers: {
                'accept': 'application/ld+json'
              },
              prefix: PREFIX
            },
            update: {
              endpoint: 'http://dfc-fuseki:3030/localData/update',
              headers: {
                'Content-Type': 'application/sparql-update',
                Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
              }
            }
          },
          forceArray: ['dfc-t:represent']
        }).make();
        await ldpNavigator.init(items);
        const catalogItemsRaw = await ldpNavigator.filterInMemory({});
        let catalogItems = [];
        for (var catalogItem of catalogItemsRaw) {
          // console.log('before',catalogItem);
          // catalogItem = await ldpNavigator.dereference(catalogItem,['dfc-t:hostedBy','dfc-t:hasPivot']);
          // console.log('BEFORE');
          catalogItem = await ldpNavigator.dereference(catalogItem, [{
              p: 'dfc-t:hostedBy'
            },
            {
              p: 'dfc-t:hasPivot',
              n: {
                p: 'dfc-t:represent',
                n: [{
                    p: 'dfc-t:hostedBy'
                  },
                  {
                    p: 'dfc-b:references',
                    n: [{
                        p: 'dfc-b:hasQuantity',
                        n:[{
                          p:'dfc-b:hasUnit'
                        }]
                      },
                      {
                        p: 'dfc-p:hasType'
                      }
                    ]
                  }
                ]
              }
            },
            {
              p: 'dfc-b:references',
              n: [{
                  p: 'dfc-b:hasQuantity',
                  n:[{
                    p:'dfc-b:hasUnit'
                  }]
                },
                {
                  p: 'dfc-p:hasType'
                }
              ]
            }
          ]);
          console.log('AFTER', catalogItem);
          catalogItems.push(catalogItem);
        }

        for (let ci of catalogItems) {

          // console.log(ci['dfc-t:hasPivot']['dfc-t:represent']);
          if (ci['dfc-t:hasPivot']) {
            if(ci['dfc-t:hasPivot']['dfc-t:represent']){
              ci['dfc-t:hasPivot']['dfc-t:represent'] = ci['dfc-t:hasPivot']['dfc-t:represent'].filter(r => {
                // console.log('represent hosted by',r['dfc-t:hostedBy'],uriDfcPlatform);
                if(r==undefined){
                  console.error('Pivot with un represents',ci['dfc-t:hasPivot']);
                }

                return r&&r['dfc-t:hostedBy']&&r['dfc-t:hostedBy']['@id'] != uriDfcPlatform
              })
            }else{
              console.error('ORPHAN PIVOT',ci['dfc-t:hasPivot']);
            }

          }
        }

        resolve({
          '@context': items['@context'],
          '@graph': catalogItems
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
        await this.init();
        const uriDfcPlatform = (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
        // console.log('ID',id);
        // let item = await (await fetch(id, {
        //   method: 'GET',
        //   headers: {
        //     'accept': 'application/ld+json'
        //   }
        // })).json() ;
        // console.log('getOneItem',id);

        const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory({
          sparql: {
            query: {
              endpoint: 'http://dfc-middleware:3000/sparql',
              headers: {
                'accept': 'application/ld+json'
              },
              prefix: PREFIX
            },
            update: {
              endpoint: 'http://dfc-fuseki:3030/localData/update',
              headers: {
                'Content-Type': 'application/sparql-update',
                Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
              }
            }
          },
          context: this.context,
          forceArray: ['dfc-t:represent']
        }).make();
        // console.log('resolveById', id);
        let item = await ldpNavigator.resolveById(id);

        // console.log('item',item);

        item = await ldpNavigator.dereference(item, [{
            p: 'dfc-t:hostedBy'
          },
          {
            p: 'dfc-t:hasPivot',
            n: {
              p: 'dfc-t:represent',
              n: [{
                  p: 'dfc-t:hostedBy'
                },
                {
                  p: 'dfc-b:references',
                  n: [{
                      p: 'dfc-p:hasQuantity',
                      n:[{
                        p:'dfc-b:hasUnit'
                      }]
                    },
                    {
                      p: 'dfc-p:hasType'
                    }
                  ]
                }
              ]
            }
          },
          {
            p: 'dfc-b:references',
            n: [{
                p: 'dfc-p:hasQuantity',
                n:[{
                  p:'dfc-b:hasUnit'
                }]
              },
              {
                p: 'dfc-p:hasType'
              }
            ]
          }
        ]);

        // console.log('item',item['dfc-t:hasPivot']);

        if (item['dfc-t:hasPivot'] && item['dfc-t:hasPivot']['dfc-t:represent'] && item['dfc-t:hasPivot']['dfc-t:represent'].filter) {

          if(item['dfc-t:hasPivot']['dfc-t:represent']){
            item['dfc-t:hasPivot']['dfc-t:represent'] = item['dfc-t:hasPivot']['dfc-t:represent'].filter(r => {
              // console.log('represent hosted by',r['dfc-t:hostedBy'],uriDfcPlatform);
              return r&&r['dfc-t:hostedBy']&&r['dfc-t:hostedBy']['@id'] != uriDfcPlatform
            })
          }else{
            console.log('ORPHAN PIVOT',ci['dfc-t:hasPivot']);
          }

        }


        resolve(item);


      } catch (e) {
        reject(e);
      }
    })
  }

  updateOneItem(item, user) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        // console.log('item',item);
        let oldItem = await this.getOneItem(item['@id']);

        let oldRepresent = oldItem["dfc-t:hasPivot"]["dfc-t:represent"].filter(i => {
          if (i["@id"] == oldItem["@id"]) {
            return false;
          } else {
            //representation existing in old but not new catalog
            return item["dfc-t:hasPivot"]["dfc-t:represent"].filter(i2 => i2['@id'] == i['@id']).length == 0
          }
        });

        const sparqlTools = new SparqlTools({
          context: this.context
        });
        // console.log('oldRepresent',oldRepresent);
        oldRepresent.forEach(async r => {
          // console.log('REMOVE Triples',r['@id'],'dfc-t:hasPivot');
          sparqlTools.removeTriples(r['@id'], ['dfc-t:hasPivot'])
        })

        // console.log('AFTER remove');
        let newRepresent = item["dfc-t:hasPivot"]["dfc-t:represent"];
        newRepresent = Array.isArray(newRepresent) ? newRepresent : [newRepresent];
        newRepresent = newRepresent.map(r => r['@id'] ? r['@id'] : r);
        const updatePivotBody = {
          ...item["dfc-t:hasPivot"],
          "@context": this.context,
          "dfc-t:represent": newRepresent.map(r => ({
            '@id': r,
            '@type': '@id'
          }))
        }
        // console.log('UPDATE Catalog Item',updatePivotBody);
        const responsePivotPatch = await fetch(item["dfc-t:hasPivot"]['@id'], {
          method: 'Put',
          body: JSON.stringify(updatePivotBody),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        // console.log('RESPONSE', responsePivotPatch.status);

        const dfcPlaform = await platformServiceSingleton.getOnePlatformBySlug('dfc');

        const isDfcPlatform=item['dfc-t:hostedBy']['@id']==dfcPlaform['@id'];
        // console.log('IS DFC PLATFORM',isDfcPlatform);

        if (item['dfc-b:references']) {
          //update remote data
          // console.log('UPDATE supply', item['dfc-b:references']['@id'],item['dfc-b:references']);
          let data= {
            'dfc-b:description': item['dfc-b:references']['dfc-b:description'],
            'dfc-b:totalTheoriticalStock': item['dfc-b:references']['dfc-b:totalTheoriticalStock'],
            'dfc-b:quantity': item['dfc-b:references']['dfc-b:quantity']
          }


          // NOT supported by socleo
          if (isDfcPlatform){
            data={
              'dfc-p:hasType': item['dfc-b:references']['dfc-p:hasType'],
              'dfc-b:hasUnit': item['dfc-b:references']['dfc-b:hasUnit'],
              ...data
            }
          }
          // console.log('data',data);

          await fetch(item['dfc-b:references']['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": this.context,
              ...data
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json',
              'Authorization': 'JWT ' + user['ontosec:token']
            }
          });

          // console.log(item['dfc-b:references']);
          if(!isDfcPlatform){
            // console.log('REMOVE CALL');
            // console.log(referencesSlimplified);
            await sparqlTools.remove(item['dfc-b:references']['@id'])
            // console.log('UPDATE supply',item);
            await sparqlTools.insert(item['dfc-b:references'])
            // console.log('UPDATE supply DONE');
          }
        }

        //update remote data
        // console.log('UPDATE product ', item['@id']);
        await fetch(item['@id'], {
          method: 'Patch',
          body: JSON.stringify({
            "@context": this.context,
            'dfc-b:stockLimitation': item['dfc-b:stockLimitation'],
            'dfc-b:sku': item['dfc-b:sku'],
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json',
            'Authorization': 'JWT ' + user['ontosec:token']
          }
        });

        if(!isDfcPlatform){

          await sparqlTools.remove(item['@id'])
          // console.log('UPDATE item',item);
          await sparqlTools.insert(item)
          // console.log('UPDATE item DONE');
        }


        resolve(item);
      } catch (e) {
        reject(e);
      }
    })
  }

  convertImportIdToReconciledId(importId, reconciledId, user) {
    return new Promise(async (resolve, reject) => {
      // console.log("convertImportIdToReconciledId",convertImportIdToReconciledId);
      let importItem = await this.getOneImport(importId);

      let reconciled = reconciledId ? await this.getOneItem(reconciledId) : undefined;
      // console.log('convertImportIdToCatalogId', importItem, catalogItem);

      let newItem = await this.convertImportToReconciled(importItem, reconciled, user);
      resolve(newItem);
    })
  }

  convertImportToReconciled(importToConvert, reconciled, user) {
    // console.log('convertImportToCatalog',importToConvert,reconciled);
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        if (reconciled == undefined || reconciled == null) {
          // console.log('NOT reconciled');
          // let representationPivotInstance = await representationPivotModel.model.create({
          //   "dfc-t:represent": [importToConvert._id]
          // });
          const body = {
            '@context': this.context,
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

          const dfcPlaform = await platformServiceSingleton.getOnePlatformBySlug('dfc');
          const {
            '@id': uri,
            ...noUriImportToConvert
          } = importToConvert;
          let dfcItem = {
            ...noUriImportToConvert,
            "@context": this.context,
            "dfc-t:hostedBy": dfcPlaform['@id'],
            "dfc:owner": user['@id'],
            "dfc-t:hasPivot": responsePivot.headers.get('location'),
          };

          // if(importToConvert['dfc-b:references']){
          //   dfcItem['dfc-b:references']{
          //     ...importToConvert['dfc-b:references'],
          //     "dfc-t:hostedBy": dfcPlaform['@id'],
          //     "dfc:owner":user['@id']
          //   }
          // }

          // console.log('dfcItem',dfcItem);

          const responseItemDFC = await fetch('http://dfc-middleware:3000/ldp/catalogItem', {
            method: 'POST',
            body: JSON.stringify(dfcItem),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          })

          // console.log('responseItemDFC',responseItemDFC.status);
          const responsePivotPatch = await fetch(responsePivot.headers.get('location'), {
            method: 'Patch',
            body: JSON.stringify({
              "@context": this.context,
              "dfc-t:represent": [importToConvert['@id'], responseItemDFC.headers.get('location')]
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          const sparqlTools = new SparqlTools({
            context: this.context
          });

          // console.log('* service insert hasPivot');
          await sparqlTools.insert({
            "@context": this.context,
            "@id": importToConvert['@id'],
            "dfc-t:hasPivot": {
              "@id": responsePivot.headers.get('location'),
              "@type": "@id"
            }
          });


          const out = {
            "dfc-t:hasPivot": {
              "@id": responsePivot.headers.get('location')
            },
            ...importToConvert
          };


          resolve(responseItemDFC.headers.get('location'));

        } else {
          let pivot = reconciled["dfc-t:hasPivot"];
          // console.log('pivot BEFORE',pivot);
          pivot["dfc-t:represent"].push({
            "@id": importToConvert['@id'],
            "@type": "@id"
          });
          // console.log('pivot AFTER',pivot);
          const responsePivotPatch = await fetch(pivot['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": this.context,
              "dfc-t:represent": pivot["dfc-t:represent"]
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          // const importToConvertBody= {
          //   "@context": this.context,
          //   "dfc-t:hasPivot": { "@id": pivot['@id'], "@type": "@id" }
          // };
          // console.log('importToConvertBody',importToConvertBody);
          //
          // // const responseReconciledPlatform = await fetch(importToConvert['@id'], {
          //   method: 'Patch',
          //   body: JSON.stringify(importToConvertBody),
          //   headers: {
          //     'accept': 'application/ld+json',
          //     'content-type': 'application/ld+json'
          //   }
          // });

          const sparqlTools = new SparqlTools({
            context: this.context
          });
          // console.log('* service insert hasPivot');
          await sparqlTools.insert({
            "@context": this.context,
            "@id": importToConvert['@id'],
            "dfc-t:hasPivot": {
              "@id": pivot['@id'],
              "@type": "@id"
            }
          });

          importToConvert["dfc-t:hasPivot"] = {
            "@id": pivot['@id'],
            "@type": "@id"
          };

          resolve(importToConvert['@id']);
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
        await this.init();
        // console.log(user['dfc:importInProgress']);
        if (user['dfc:importInProgress'] == true) {
          reject(new Error("import in progress. Not possible to process an other"))
        } else {
          const responseProgressOn = await fetch(user['@id'], {
            method: 'PATCH',
            body: JSON.stringify({
              "@context": this.context,
              "dfc:importInProgress": true
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });


          let sourceObject = config.sources.filter(so => source.includes(so.url))[0];

          // console.log('sourceObject', sourceObject);


          const sourceResponse = await fetch(source, {
            method: 'GET',
            headers: {
              'authorization': 'JWT ' + user['ontosec:token'],
              'accept': 'application/ld+json'
            }
          })

          if (sourceResponse.status != 200) {
            throw new Error(`connexion to serveur return status ${sourceResponse.status}, try new authentification`)
          }

          let sourceResponseRaw = await sourceResponse.text();

          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');

          // console.log('sourceResponseRaw',sourceResponseRaw);

          let sourceResponseObject = JSON.parse(sourceResponseRaw);
          // console.log('sourceResponseObject',JSON.stringify(sourceResponseObject));


          let contextConfig = this.context

          let sourceContext=sourceResponseObject['@context'];
          // console.log('sourceContext',sourceContext);
          if ((typeof sourceContext === 'string' || sourceContext instanceof String)&&sourceContext.includes('http')){
            sourceContext = await this.resolveContext(sourceContext);
          }

          sourceResponseObject = await jsonld.compact(sourceResponseObject, sourceContext);

          // console.log('sourceResponseObject 1',sourceResponseObject);

          // sourceResponseObject['@context'] = {
          //   ...sourceContext,
          //   ...contextConfig
          // }

          // console.log('sourceResponseObject 2',sourceResponseObject);
          // console.log('contextConfig',contextConfig);

          sourceResponseObject = await jsonld.compact(sourceResponseObject, contextConfig)

          // console.log('sourceResponseObject 3',JSON.stringify(sourceResponseObject));

          // console.log('NEW for IMPORT');



          const ldpNavigator = new LDPNavigator({
            forceArray: [
              'dfc-b:manages',
              'dfc-t:represent'
            ]
          });
          ldpNavigator.setAdapters([
            new SparqlAdapter({
              query: {
                endpoint: 'http://dfc-middleware:3000/sparql',
                headers: {
                  'accept': 'application/ld+json'
                },
                prefix: PREFIX
              },
              update: {
                endpoint: 'http://dfc-fuseki:3030/localData/update',
                headers: {
                  'Content-Type': 'application/sparql-update',
                  Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
                }
              },
              skipResolveById: true
            }),
            new FetchAdapter({
              headers: {
                'authorization': 'JWT ' + user['ontosec:token'],
                'accept': 'application/ld+json'
              }
            })
          ]);

          // console.log('sourceResponseObject',sourceResponseObject);
          // console.log('sourceResponseObject stringify',JSON.stringify(sourceResponseObject));


          await ldpNavigator.init(sourceResponseObject)
          // console.log('persist BEFORE');
          await ldpNavigator.persist();
          console.log('persist AFTER');
          // if (sourceResponseObject['@graph']){
          //   let person = sourceResponseObject['@graph'].find(r=>r['@type'].includes('Person'));
          //   console.log('person',person);
          // }

          //
          let itemsToImport = [];
          const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceObject.slug);

          if (sourceObject.version == "1.5" || sourceObject.version == "1.6" || sourceObject.version == "1.7") {
            // const affiliates = Array.isArray(sourceResponseObject['dfc-b:affiliates'])?sourceResponseObject['dfc-b:affiliates'][0]:sourceResponseObject['dfc-b:affiliates']
            const platformUser = await ldpNavigator.findInMemory({
              '@type': 'dfc-b:Person'
            });
            // console.log('platformUser',platformUser);
            console.log('dereference BEFORE');
            const platformUserDereferences = await ldpNavigator.dereference(platformUser, {
              p: 'dfc-b:affiliates',
              n: {
                p: 'dfc-b:manages',
                n: {
                  p: 'dfc-b:references',
                  n: {
                    p: 'dfc-b:hasQuantity'
                  }
                }
              }
            })
            // console.log('dereference AFTER');

            // console.log('platformUserDereferences',platformUserDereferences);
            console.log("platformUserDereferences['dfc-b:affiliates']['dfc-b:manages']",JSON.stringify(platformUserDereferences['dfc-b:affiliates']['dfc-b:manages']));

            for (var manage of platformUserDereferences['dfc-b:affiliates']['dfc-b:manages']) {
              // console.log('manage',manage);
              itemsToImport.push({
                ...manage,
              })
            }

            // console.log('itemsToImport',itemsToImport);

          } else {
            throw new Error("version not supported")
          }

          const response = await fetch('http://dfc-middleware:3000/sparql', {
            method: 'POST',
            body: `${PREFIX}
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
          // console.log('everExistDfcItems',everExistDfcItems);
          let existing = false;
          if (everExistDfcItems['@id'] || (everExistDfcItems['@graph'] && everExistDfcItems['@graph'].length > 0)) {
            existing = true;
          }

          let out = [];
          try {
            // existing = true;
            //TODO remove / test
            // itemsToImport=[itemsToImport[0]]

            let promises = itemsToImport.map(item => this.importItem(item, user, platform, existing));
            out = await Promise.all(promises);
          } catch (e) {
            console.log(e);
            throw new Error('error during import')
          } finally {
            const responseProgressOff = await fetch(user['@id'], {
              method: 'PATCH',
              body: JSON.stringify({
                "@context": this.context,
                "dfc:importInProgress": false
              }),
              headers: {
                'accept': 'application/ld+json',
                'content-type': 'application/ld+json'
              }
            });
          }

          resolve(out)
          // resolve([]);
        }
      } catch (e) {
        const responseProgressOn = await fetch(user['@id'], {
          method: 'PATCH',
          body: JSON.stringify({
            "@context": this.context,
            "dfc:importInProgress": false
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

  importItem(item, user, platform, convert) {

    return new Promise(async (resolve, reject) => {
      try {

        console.log('INIT importItem');
        await this.init();

        // //TODO : convert to Generic
        // item['dfc-b:offeredThrough'] = undefined;



        const sparqlTools = new SparqlTools({
          context: this.context
        });

        let itemToInsert = {
          // ...item,
          "@id":item['@id'],
          'dfc-b:offeredThrough':undefined,
          "dfc-t:hostedBy": platform['@id'],
          "dfc:owner": user['@id'],
          "@context": this.context,
        }
        // console.log('INSERT');
        // console.log('* service insert owner and hostedBy');
        // console.log(item);
        let importedItem = await sparqlTools.insert(itemToInsert)
        // // console.log('post insert');
        //
        let references = item['dfc-b:references']
        let dfcReferences;
        if (references) {
          // console.log('------------------------- IMPORT references',references);
          // references=[references[0]];
          dfcReferences = await this.importItem(references, user, platform, convert)
          // dfcReferences = await this.importItem(references, user, platform, convert);
          // console.log('dfcReferences',dfcReferences);
          // item['dfc-b:references']=newReference;
        }
        let idDFC;
        if (convert === false) {
          if (dfcReferences) {
            importedItem['dfc-b:references'] = dfcReferences
          }
          idDFC = await this.convertImportToReconciled(importedItem, undefined, user);
        }

        resolve(idDFC);
        resolve();
      } catch (e) {
        console.error(e);
        reject(e)
      }
    })
  }

  async refreshItem(id, user) {
    await this.init();
    const ldpNavigator = new LDPNavigator({
      forceArray: [
        'dfc-b:manages',
        'dfc-t:represent'
      ],
      context: this.context
    });
    ldpNavigator.setAdapters([
      new SparqlAdapter({
        query: {
          endpoint: 'http://dfc-middleware:3000/sparql',
          headers: {
            'accept': 'application/ld+json'
          },
          prefix: PREFIX
        },
        update: {
          endpoint: 'http://dfc-fuseki:3030/localData/update',
          headers: {
            'Content-Type': 'application/sparql-update',
            Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
          }
        },
        skipResolveById: true
      }),
      new FetchAdapter({
        headers: {
          'authorization': 'JWT ' + user['ontosec:token'],
          'accept': 'application/ld+json'
        }
      })
    ]);
    // console.log('RESOLVE', id);
    let result = await ldpNavigator.resolveById(id);
    if (result) {
      // console.log('BEFORE dereference', result);
      result = await ldpNavigator.dereference(result, {
        p: 'dfc-b:references'
      })
      // console.log('AFTER dereference', result);
      return result;
    } else {
      throw new Error("refresh error")
    }


  }

  async getOneLinkedItem(id, user) {
    let contextConfigRaw = config.context;
    let contextConfigResponse = await fetch(contextConfigRaw);
    let contextConfig = await contextConfigResponse.json();
    const ldpNavigator = new LDPNavigator_SparqlAndFetch_Factory({
      sparql: {
        query: {
          endpoint: 'http://dfc-middleware:3000/sparql',
          headers: {
            'accept': 'application/ld+json'
          },
          prefix: PREFIX
        },
        update: {
          endpoint: 'http://dfc-fuseki:3030/localData/update',
          headers: {
            'Content-Type': 'application/sparql-update',
            Authorization: 'Basic ' + Buffer.from('admin' + ':' + 'admin').toString('base64')
          }
        }
      },
      context: contextConfig,
      forceArray: ['dfc-t:represent']
    }).make();
    // await ldpNavigator.init(id);
    const root = await ldpNavigator.resolveById(id);
    let linked = await ldpNavigator.dereference(root, [{
      p: 'dfc-t:hasPivot',
      n: [{
        p: 'dfc-t:represent'
      }]
    }]);
    linked['@context'] = contextConfig;
    return linked;
  }

  async getOneLinkedItemSimple(id, user) {
    const linked = await this.getOneLinkedItem(id, user);
    // console.log(linked);
    const shorter = {
      '@id': linked['@id'],
      'dfc-t:hostedBy' : linked['dfc-t:hostedBy'],
      'owl:sameAs': linked['dfc-t:hasPivot']['dfc-t:represent'].map(
          r => ({"@id":r['@id'],"dfc-t:hostedBy":r['dfc-t:hostedBy']})
        ).filter(
          r => !(r['@id'].includes(linked['@id']))
        )
    }
    return shorter;

  }
}

module.exports = CatalogService;
