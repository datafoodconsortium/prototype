'use strict';

const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');
const urlJoin = require('url-join');
const dayjs = require('dayjs');
const {
  PlatformService,
  platformServiceSingleton
} = require('./platform.js')
const {
  SparqlAdapter,
  FetchAdapter,
  LDPNavigator,
  LDPNavigator_SparqlAndFetch_Factory
} = require("fix-esm").require('ldp-navigator')

const SparqlTools = require('./../util/sparqlTools.js')
const LinkHeader = require('http-link-header');

const PREFIX = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dfc: <https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_FullModel.owl#>
PREFIX dfc-b: <https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_BusinessOntology.owl#>
PREFIX dfc-p: <https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_ProductOntology.owl#>
PREFIX dfc-t: <https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_TechnicalOntology.owl#>
PREFIX dfc-u: <https://github.com/datafoodconsortium/taxonomies/releases/latest/download/units.rdf#>
PREFIX dfc-pt: <https://github.com/datafoodconsortium/taxonomies/releases/latest/download/productTypes.rdf#>
PREFIX dfc-f: <hhttps://github.com/datafoodconsortium/taxonomies/releases/latest/download/facets.rdf#>
PREFIX dfc-m: <https://github.com/datafoodconsortium/taxonomies/releases/latest/download/measures.rdf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dc: <http://purl.org/dc/elements/1.1/#>
`

class CatalogService {
  constructor() {
    this.init();
  }

  static async getInstance() {
    const instance = new CatalogService();
    await instance.init();
    return instance;
  }

  async init() {
    if (!this.context) {
      let contextConfigRaw = config.context;
      this.context = await this.resolveContext(contextConfigRaw);
    }
  }

  async resolveContext(contextUrl) {
    let contextConfigResponseRoot = await fetch(contextUrl);
    const link = contextConfigResponseRoot.headers.get('link');
    let body;
    try {
      body = await contextConfigResponseRoot.json()
    } catch (error) {

    }
    let context
    if (body && body['@context']) {
      context = body;
    } else if (link) {
      const linkHeader = LinkHeader.parse(link);
      const alternates = linkHeader.get('rel', 'alternate');
      for (const alternate of alternates) {
        let contextConfigResponseAlternate = await fetch(urlJoin(contextUrl, alternate.uri));
        try {
          const bodyAlternate = await contextConfigResponseAlternate.json();
          if (bodyAlternate['@context']) {
            context = bodyAlternate;
          }
          break;
        } catch (error) {

        }
      }
    } else {
      throw new Error('context config not retrun json with @©ontext or link header')
    }

    if (context) {
      return context['@context']
    } else {
      throw new Error('no solution to obtain context with context config')
    }
  }

  cleanImport(user) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `${PREFIX}
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
        const sparqlTools = new SparqlTools({
          context: this.context
        });
        if (datas['@id'] && datas['@id'].includes('http')) {
          sparqlTools.remove(datas['@id']);
        }
        if (datas['@graph']) {
          for (const data of datas['@graph']) {
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
    return new Promise(async (resolve, reject) => {
      try {
        // let contextConfigRaw = config.context;
        // let contextConfigResponse = await fetch(contextConfigRaw);
        // let contextConfig = await contextConfigResponse.json();
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `${PREFIX}
          CONSTRUCT  {
            ?sPlatform ?p ?o.
          }
          WHERE {
            ?sPlatform a dfc-b:CatalogItem;
                      dfc-t:owner <${user['@id']}>;
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



        items = await jsonld.compact(items, { '@context': this.context })

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
            },
            dereference: ['dfc-b:hasQuantity']
          },
          forceArray: ['dfc-t:represent']
        }).make();
        await ldpNavigator.init(items);
        const importItemsRaw = await ldpNavigator.filterInMemory({});
        let importItems = [];
        for (var importItem of importItemsRaw) {
          // catalogItem = await ldpNavigator.dereference(catalogItem,['dfc-t:hostedBy','dfc-t:hasPivot']);
          importItem = await ldpNavigator.dereference(importItem, [{
            p: 'dfc-t:hostedBy'
          },
          {
            p: 'dfc-b:references',
            n: [{
              p: 'dfc-b:hasQuantity',
              n: {
                p: 'dfc-b:hasUnit'
              }
            },
            {
              p: 'dfc-b:hasType'
            }
            ]
          }
          ]);

          importItems.push(importItem);
        }

        const out = {
          '@context': items['@context'],
          '@graph': importItems
        }

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
            },
            dereference: ['dfc-b:hasQuantity']
          },
          forceArray: ['dfc-t:represent'],
          context: this.context
        }).make();
        let item = await ldpNavigator.resolveById(id);
        item = await ldpNavigator.dereference(item, [{
          p: 'dfc-t:hostedBy'
        },
        {
          p: 'dfc-b:references',
          n: [{
            p: 'dfc-b:hasQuantity',
            n: {
              p: 'dfc-b:hasUnit'
            }
          },
          {
            p: 'dfc-b:hasType'
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

  getAllOrder(user) {
    return new Promise(async (resolve, reject) => {
      try {
        let SPARQL_QUERY;
        if (user['dfc:role'] == 'logistician') {
          SPARQL_QUERY = `${PREFIX}
          CONSTRUCT  {
            ?s ?p ?o.
          }
          WHERE {
            ?s a dfc-b:Order;
                      ?p ?o.
          }`
        } else {
          SPARQL_QUERY = `${PREFIX}
          CONSTRUCT  {
            ?s ?p ?o.
          }
          WHERE {
            ?s a dfc-b:Order;
                      dfc-t:owner <${user['@id']}>;
                      ?p ?o.
          }
          `
        }
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: SPARQL_QUERY,
          headers: {
            'accept': 'application/ld+json'
          }
        });

        let items = await response.json();



        items = await jsonld.compact(items, { '@context': this.context })

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
            },
            dereference: ['dfc-b:hasPrice', 'dfc-b:hasQuantity', 'dfc-b:hasAddress']
          },
          forceArray: ['dfc-b:hasPart']
        }).make();

        await ldpNavigator.init(items);

        const importItemsRaw = await ldpNavigator.filterInMemory({});

        const dereferenceSchema = [{
          p: 'dfc-b:hasPart',
          n: [
            {
              p: 'dfc-b:concerns',
              n: [
                {
                  p: 'dfc-b:offers',
                  n: [{
                    p: 'dfc-b:references',
                    n: [{
                      p: 'dfc-b:hasType'
                    }, {
                      p: 'dfc-b:hasQuantity',
                      n: {
                        p: 'dfc-b:hasUnit'
                      }
                    }
                    ]
                  }]
                }
              ]
            }, {
              p: 'dfc-b:hasPrice',
              n: [{
                p: 'dfc-b:hasUnit'
              }]
            },
            {
              p: 'dfc-b:hasQuantity',
              n: [{
                p: 'dfc-b:hasUnit'
              }]
            },
            {
              p: 'dfc-b:fulfilledBy',
              n: [{
                p: 'dfc-b:constitutedBy',
                n: [{
                  p: 'dfc-b:isStoredIn',
                  n: [{
                    p: 'dfc-b:hasAddress',
                  }]
                }]
              }]
            }
          ]
        },
        {
          p: 'dfc-b:selects',
          n: [{
            p: 'dfc-b:pickedUpAt',
            n: [{
              p: 'dfc-b:hasAddress',
            }]
          }]
        },
        {
          p: 'dfc-t:hostedBy'
        }
        ];


        const dereferencedImportItems = await ldpNavigator.dereference(importItemsRaw, dereferenceSchema, { flat: false });
        // const jsonldDereferencedImportItems = {
        //   "@context": items['@context'],
        //   "@graph": dereferencedImportItems
        // }



        resolve(dereferencedImportItems);
      } catch (e) {
        reject(e);
      }
    })

  }

  optimizeOrders(user, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          optimisationTimeWindow = 4,
        } = options;

        let SPARQL_QUERY;
        if (user['dfc:role'] == 'logistician') {
          SPARQL_QUERY = `${PREFIX}
          CONSTRUCT  {
            ?s ?p ?o.
          }
          WHERE {
            ?s a dfc-b:Order;
                      ?p ?o.
          }`
        } else {
          SPARQL_QUERY = `${PREFIX}
          CONSTRUCT  {
            ?s ?p ?o.
          }
          WHERE {
            ?s a dfc-b:Order;
                      dfc-t:owner <${user['@id']}>;
                      ?p ?o.
          }
          `
        }
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: SPARQL_QUERY,
          headers: {
            'accept': 'application/ld+json'
          }
        });

        let items = await response.json();

        items = await jsonld.compact(items, { '@context': this.context })

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
            },
            dereference: ['dfc-b:hasPrice', 'dfc-b:hasQuantity', 'dfc-b:hasAddress']
          },
          forceArray: ['dfc-b:hasPart']
        }).make();
        await ldpNavigator.init(items);
        const importItemsRaw = await ldpNavigator.filterInMemory({});
        let importItems = [];
        const dereferencePartToSupplieProduct = [
          {
            p: 'dfc-b:concerns',
            n: [
              {
                p: 'dfc-b:offers',
                n: [{
                  p: 'dfc-b:references',
                  n: [{
                    p: 'dfc-b:hasType'
                  }, {
                    p: 'dfc-b:hasQuantity',
                    n: {
                      p: 'dfc-b:hasUnit'
                    }
                  }
                  ]
                }]
              }
            ]
          }, {
            p: 'dfc-b:hasPrice',
            n: [{
              p: 'dfc-b:hasUnit'
            }]
          },
          {
            p: 'dfc-b:hasQuantity',
            n: [{
              p: 'dfc-b:hasUnit'
            }]
          }
        ];
        const dereferencePartToPhysicalProduct = [
          {
            p: 'dfc-b:fulfilledBy',
            n: [{
              p: 'dfc-b:constitutedBy',
              n: [{
                p: 'dfc-b:isStoredIn',
                n: [{
                  p: 'dfc-b:hasAddress',
                }]
              }]
            }]
          }
        ]

        const dereferencePart = [...dereferencePartToSupplieProduct, ...dereferencePartToPhysicalProduct];

        const dereferenceSchema = [{
          p: 'dfc-b:hasPart',
          n: dereferencePart
        },
        {
          p: 'dfc-b:selects',
          n: [{
            p: 'dfc-b:pickedUpAt',
            n: [{
              p: 'dfc-b:hasAddress',
            }]
          }]
        },
        {
          p: 'dfc-t:hostedBy'
        }
        ];

        const flatImportItems = await ldpNavigator.dereference(importItemsRaw, dereferenceSchema, { flat: true });
        const isOpeningDuring =
        {
          "@type": "dfc-b:IsOpeningDuring",
          "dfc-b:start": (new Date()).toISOString(),
          "dfc-b:end": dayjs().add(optimisationTimeWindow, 'hour').toISOString()
        }



        for (let item of flatImportItems) {
          if (item['@type'] == 'dfc-b:PhysicalPlace') {
            item['dfc-b:isOpeningDuring'] = isOpeningDuring;
          }
        }



        const jsonldFlatImportItems = {
          "@context": items['@context'],
          "@graph": flatImportItems
        }

        const urlOptim = config.verso.apiMiddleware + '/optim';


        console.log('__call verso');

        const requestBody = JSON.stringify(jsonldFlatImportItems);
        const responseOptimized = await fetch(urlOptim, {
          method: 'POST',
          body: requestBody,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!responseOptimized.ok) {
          const errorBody = await responseOptimized.text();

          // Generate curl command for debugging
          const curlCommand = `curl -X POST "${urlOptim}" \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody}'`;
          console.error('__error - Verso middleware returned status', responseOptimized.status);
          console.error('__error - Response body:', errorBody);
          console.error('__error - Curl command to reproduce:\n', curlCommand);

          throw new Error(`Verso middleware returned ${responseOptimized.status}: ${errorBody}`);
        }

        const responseOptimizedJson = await responseOptimized.json();
        const ldpNavigatorOut = new LDPNavigator({
          forceArray: ['dfc-b:hasPart']
        });
        await ldpNavigatorOut.init(responseOptimizedJson);


        const routesRoot = await jsonld.frame(responseOptimizedJson, {
          "@context": responseOptimizedJson['@context'],
          "@type": "dfc-b:Route",
          "dfc-b:steps": {
            "@embed": "@never"
          },
          "dfc-b:vehicle": {
            "@embed": "@never"
          }
        });

        let routes;
        if (routesRoot['@graph']) {
          routes = routesRoot['@graph'];
        } else {
          const {
            "@context": contextOfRoutesRoot,
            ...routesRootWithoutContext
          } = routesRoot;
          routes = routesRootWithoutContext;
        }


        const dereferencePartWhithOfferAndSuppliedProduct = [
          ...dereferencePartToSupplieProduct,
          {
            p: 'dfc-b:partOf',
            n: [{
              p: 'dfc-t:hostedBy',
            }]
          }
        ]

        const extendedRoutes = await ldpNavigatorOut.dereference(routes, [{
          p: 'dfc-b:vehicle',
          n: [{
            p: 'dfc-b:ships',
            n: [{
              p: 'dfc-b:transports',
              n: [{
                p: 'dfc-b:constitutes',
                n: [
                  {
                    p: 'dfc-b:fulfills',
                    n: dereferencePartWhithOfferAndSuppliedProduct
                  }
                ]
              }, {
                p: 'dfc-b:isStoredIn',
              }]
            }]
          }]
        }, {
          p: 'dfc-b:steps',
          n: [{
            p: 'dfc-b:pickup',
            n: [{
              p: 'dfc-b:transports',
              n: [{
                p: 'dfc-b:constitutes',
                n: [
                  {
                    p: 'dfc-b:fulfills',
                    n: dereferencePartWhithOfferAndSuppliedProduct
                  }
                ]
              }, {
                p: 'dfc-b:isStoredIn',
              }]
            }]
          },
          {
            p: 'dfc-b:delivery',
            n: [{
              p: 'dfc-b:transports',
              n: [{
                p: 'dfc-b:constitutes',
                n: [
                  {
                    p: 'dfc-b:fulfills',
                    n: dereferencePartWhithOfferAndSuppliedProduct
                  }
                ]
              }, {
                p: 'dfc-b:isStoredIn',
              }]
            }]
          }
          ]
        }]);

        // const optimizedGraph = await ldpNavigatorOut.filterInMemory({});




        // for (let order of responseOptimizedJson['@graph']) {
        // }

        resolve(extendedRoutes);
      } catch (e) {
        reject(e);
      }
    })

  }

  getOneOrder(id) {
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
            },
            dereference: ['dfc-b:hasQuantity']
          },
          forceArray: ['dfc-t:represent'],
          context: this.context
        }).make();
        let item = await ldpNavigator.resolveById(id);
        item = await ldpNavigator.dereference(item, [{
          p: 'dfc-t:hostedBy'
        },
        {
          p: 'dfc-b:references',
          n: [{
            p: 'dfc-b:hasQuantity',
            n: {
              p: 'dfc-b:hasUnit'
            }
          },
          {
            p: 'dfc-b:hasType'
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
        await this.init();
        const uriDfcPlatform = (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
        const query = ` ${PREFIX}
                        CONSTRUCT  {
                          ?sDFC ?p ?o.
                        }
                        WHERE {
                            ?sDFC a dfc-b:CatalogItem ;
                                dfc-t:hostedBy <${uriDfcPlatform}> ;
                                dfc-t:owner <${user['@id']}>;
                                ?p ?o.
                        }
                        `

        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: query,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let items = await response.json();


        items = await jsonld.compact(items, this.context);


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
            },
            dereference: ['dfc-b:hasQuantity']
          },
          forceArray: ['dfc-t:represent']
        }).make();
        await ldpNavigator.init(items);
        const catalogItemsRaw = await ldpNavigator.filterInMemory({});
        let catalogItems = [];
        for (var catalogItem of catalogItemsRaw) {
          // catalogItem = await ldpNavigator.dereference(catalogItem,['dfc-t:hostedBy','dfc-t:hasPivot']);
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
                  n: [{
                    p: 'dfc-b:hasUnit'
                  }]
                },
                {
                  p: 'dfc-b:hasType'
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
              n: [{
                p: 'dfc-b:hasUnit'
              }]
            },
            {
              p: 'dfc-b:hasType'
            }
            ]
          }
          ]);
          catalogItems.push(catalogItem);
        }

        for (let ci of catalogItems) {

          if (ci['dfc-t:hasPivot']) {
            if (ci['dfc-t:hasPivot']['dfc-t:represent']) {
              ci['dfc-t:hasPivot']['dfc-t:represent'] = ci['dfc-t:hasPivot']['dfc-t:represent'].filter(r => {
                if (r == undefined) {
                  console.error('Pivot with un represents', ci['dfc-t:hasPivot']);
                }

                return r && (r['dfc-t:hostedBy'] == undefined || (r['dfc-t:hostedBy'] && r['dfc-t:hostedBy']['@id'] != uriDfcPlatform))
              })
            } else {
              console.error('ORPHAN PIVOT', ci['dfc-t:hasPivot']);
            }

          }
        }

        resolve({
          '@context': items['@context'],
          '@graph': catalogItems
        })

      } catch (e) {
        reject(e);
      }
    })
  }

  getOneItem(id) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const uriDfcPlatform = (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
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
            },
            dereference: ['dfc-b:hasQuantity', 'dfc-b:hasAllergenCharacteristic', 'dfc-b:hasCertification',
              'dfc-b:hasPhysicalCharacteristic', 'dfc-b:hasNutrientCharacteristic', 'dfc-b:hasPrice']
          },
          context: this.context,
          forceArray: ['dfc-t:represent', 'dfc-b:offeredThrough', 'dfc-b:hasAllergenCharacteristic',
            'dfc-b:hasPhysicalCharacteristic', 'dfc-b:hasNutrientCharacteristic'
          ]
        }).make();
        let item = await ldpNavigator.resolveById(id);



        item = await ldpNavigator.dereference(item, [{
          p: 'dfc-t:hostedBy'
        }, {
          p: 'dfc-b:offeredThrough',
          n: {
            p: 'dfc-b:offers'
          }
        },
        {
          p: 'dfc-t:hasPivot',
          n: {
            p: 'dfc-t:represent',
            n: [{
              p: 'dfc-t:hostedBy'
            },
            {
              p: 'dfc-b:offeredThrough',
              n: [{
                p: 'dfc-b:offersTo'
              }, {
                p: 'dfc-b:hasPrice'
              }
              ]
            },
            {
              p: 'dfc-b:references',
              n: [{
                p: 'dfc-b:hasQuantity',
                n: [{
                  p: 'dfc-b:hasUnit'
                }]
              },
              {
                p: 'dfc-b:hasType'
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
            n: [{
              p: 'dfc-b:hasUnit'
            }]
          },
          {
            p: 'dfc-b:hasType'
          },
          {
            p: 'dfc-b:hasGeographicalOrigin'
          },
          {
            p: 'dfc-b:hasCertification'
          },
          {
            p: 'dfc-b:hasPhysicalCharacteristic',
            n: [{
              p: 'dfc-b:hasUnit'
            },
            {
              p: 'dfc-b:hasPhysicalDimension'
            }
            ]
          },
          {
            p: 'dfc-b:hasNutrientCharacteristic',
            n: [
              {
                p: 'dfc-b:hasUnit'
              },
              {
                p: 'dfc-b:hasNutrientDimension'
              }
            ]
          },
          {
            p: 'dfc-b:hasAllergenCharacteristic',
            n: [{
              p: 'dfc-b:hasUnit'
            },
            {
              p: 'dfc-b:hasAllergenDimension'
            }
            ]
          }
          ]
        }
        ]);


        if (item['dfc-t:hasPivot'] && item['dfc-t:hasPivot']['dfc-t:represent'] && item['dfc-t:hasPivot']['dfc-t:represent'].filter) {

          if (item['dfc-t:hasPivot']['dfc-t:represent']) {
            item['dfc-t:hasPivot']['dfc-t:represent'] = item['dfc-t:hasPivot']['dfc-t:represent'].filter(r => {
              return r && r['dfc-t:hostedBy'] && r['dfc-t:hostedBy']['@id'] != uriDfcPlatform
            })
          } else {
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
        oldRepresent.forEach(async r => {
          sparqlTools.removeTriples(r['@id'], ['dfc-t:hasPivot'])
        })

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
        const responsePivotPatch = await fetch(item["dfc-t:hasPivot"]['@id'], {
          method: 'Put',
          body: JSON.stringify(updatePivotBody),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });


        const dfcPlaform = await platformServiceSingleton.getOnePlatformBySlug('dfc');

        const isDfcPlatform = item['dfc-t:hostedBy']['@id'] == dfcPlaform['@id'];

        if (item['dfc-b:references']) {
          //update remote data
          let dataReferences = JSON.parse(JSON.stringify(item['dfc-b:references']));

          //TODO item provide to updateOneItem param should by in good context: not @id but direct uri
          dataReferences['dfc-b:hasBrand'] = dataReferences['dfc-b:hasBrand'] ? dataReferences['dfc-b:hasBrand']['@id'] : undefined;
          dataReferences['dfc-b:hasGeographicalOrigin'] = dataReferences['dfc-b:hasGeographicalOrigin'] ? dataReferences['dfc-b:hasGeographicalOrigin']['@id'] : undefined;
          dataReferences['dfc-b:hasType'] = dataReferences['dfc-b:hasType'] ? dataReferences['dfc-b:hasType']['@id'] : undefined;
          dataReferences['dfc-b:hasQuantity']['dfc-b:hasUnit'] = dataReferences['dfc-b:hasQuantity'] && dataReferences['dfc-b:hasQuantity']['dfc-b:hasUnit'] ? dataReferences['dfc-b:hasQuantity']['dfc-b:hasUnit']['@id'] : undefined;



          for (const key of Object.keys(dataReferences)) {
            if (key.includes('dfc-t')) {
              delete dataReferences[key];
            }
          }
          dataReferences = {
            "@context": this.context,
            ...dataReferences
          }



          const platformReferenceResponse = await fetch(item['dfc-b:references']['@id'], {
            method: 'PUT',
            body: JSON.stringify(dataReferences),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json',
              'Authorization': 'JWT ' + user['token']
            }
          });

          if (platformReferenceResponse.status == 403) {
            throw new Error("Authentification failed");
          }
          if (Math.floor(platformReferenceResponse.status / 100) != 2) {
            console.error(await platformReferenceResponse.text())
            throw new Error(`statuts have to be 2xx and is ${platformReferenceResponse.status}`);
          } else {
          }


          if (!isDfcPlatform) {
            await sparqlTools.remove(item['dfc-b:references']['@id'])
            await sparqlTools.insert(item['dfc-b:references'])
          }
        }
        let data = JSON.parse(JSON.stringify(item));

        delete data['dfc-b:offeredThrough'];
        data['dfc-b:references'] = data['dfc-b:references']['@id']

        for (const key of Object.keys(data)) {
          if (key.includes('dfc-t')) {
            delete data[key];
          }
        }
        data = { "@context": this.context, ...data };

        //update remote data
        const platformCatalogItemResponse = await fetch(item['@id'], {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json',
            'Authorization': 'JWT ' + user['token']
          }
        });

        if (platformCatalogItemResponse.status == 403) {
          throw new Error("Authentification failed");
        }
        if (Math.floor(platformCatalogItemResponse.status / 100) != 2) {
          console.error(await platformCatalogItemResponse.text())
          throw new Error(`statuts have to be 2xx and is ${platformCatalogItemResponse.status}`);
        } else {
        }

        if (!isDfcPlatform) {
          await sparqlTools.remove(item['@id'])
          await sparqlTools.insert(item)
        }



        resolve(item);
      } catch (e) {
        reject(e);
      }
    })
  }

  convertImportIdToReconciledId(importId, reconciledId, user) {
    return new Promise(async (resolve, reject) => {
      let importItem = await this.getOneImport(importId);

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
          },
          dereference: ['dfc-b:hasQuantity', 'dfc-b:hasAllergenCharacteristic', 'dfc-b:hasCertification',
            'dfc-b:hasPhysicalCharacteristic', 'dfc-b:hasNutrientCharacteristic']
        },
        forceArray: ['dfc-t:represent'],
        context: this.context
      }).make();

      let item = await ldpNavigator.resolveById(importId);
      let reconciled = reconciledId ? await ldpNavigator.resolveById(reconciledId) : undefined;

      // let reconciled = reconciledId ? await this.getOneItem(reconciledId) : undefined;

      let newItem = await this.convertImportToReconciled(item, reconciled, user);
      resolve(newItem);
    })
  }

  convertImportToReconciled(importToConvert, reconciled, user) {

    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        if (reconciled == undefined || reconciled == null) {
          // let representationPivotInstance = await representationPivotModel.model.create({
          //   "dfc-t:represent": [importToConvert._id]
          // });
          const body = {
            '@context': this.context,
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

          const dfcPlaform = await platformServiceSingleton.getOnePlatformBySlug('dfc');
          const {
            '@id': uri,
            ...noUriImportToConvert
          } = importToConvert;
          let dfcItem = {
            ...noUriImportToConvert,
            "@context": this.context,
            "dfc-t:hostedBy": dfcPlaform['@id'],
            "dfc-t:owner": user['@id'],
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


          if (importToConvert['dfc-b:references']) {
            //   await this.convertImportToReconciled({
            //     '@context':this.context,
            //     ...(importToConvert['dfc-b:references'])
            //   },
            //   undefined,
            //   user
            // )
            const referenceId = importToConvert['dfc-b:references']['@id'] || importToConvert['dfc-b:references']
            await this.convertImportIdToReconciledId(referenceId, undefined, user)
          }

          resolve(responseItemDFC.headers.get('location'));

        } else {

          const sparqlTools = new SparqlTools({
            context: this.context
          });


          await sparqlTools.insert({
            "@context": this.context,
            "@id": reconciled['dfc-t:hasPivot']['@id'] || reconciled['dfc-t:hasPivot'],
            "dfc-t:represent": {
              "@id": importToConvert['@id'],
              "@type": "@id"
            }
          });

          await sparqlTools.insert({
            "@context": this.context,
            "@id": importToConvert['@id'],
            "dfc-t:hasPivot": {
              "@id": reconciled['dfc-t:hasPivot']['@id'] || reconciled['dfc-t:hasPivot'],
              "@type": "@id"
            }
          });


          if (importToConvert['dfc-b:references'] && reconciled['dfc-b:references']) {
            const referenceImportId = importToConvert['dfc-b:references']['@id'] || importToConvert['dfc-b:references'];
            const referenceReconciledId = reconciled['dfc-b:references']['@id'] || reconciled['dfc-b:references'];
            await this.convertImportIdToReconciledId(referenceImportId, referenceReconciledId, user)
          }

          resolve(importToConvert['@id']);
        }

      } catch (e) {
        reject(e);
      }
    })
  }

  importSource(source, user) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        // throw new Error('force progress OFF');
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


          const sourceResponse = await fetch(source, {
            method: 'GET',
            headers: {
              'authorization': 'JWT ' + user['token'],
              'accept': 'application/ld+json'
            }
          })

          if (sourceResponse.status == 403) {
            throw new Error(`connexion to serveur return status ${sourceResponse.status}, try new authentification`)
          }


          if (Math.floor(sourceResponse.status / 100) != 2) {
            console.error(await sourceResponse.text())
            throw new Error(`connexion to serveur return status ${sourceResponse.status}`)
          }

          let sourceResponseRaw = await sourceResponse.text();

          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');
          //TODO to remove when all platform not use dfc:p
          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('dfc-p:', 'gi'), 'dfc-b:');
          //TODO remove when OFN not use ontology root url in type and othe 
          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#', 'gi'), 'dfc-b:');
          sourceResponseRaw = sourceResponseRaw.replace(new RegExp('http://static.datafoodconsortium.org/data/productTypes.rdf#', 'gi'), 'dfc-pt:');

          let sourceResponseObject = JSON.parse(sourceResponseRaw);
          let contextConfig = this.context
          let base;

          if (Array.isArray(sourceResponseObject['@context'])) {
            base = sourceResponseObject['@context'].find(c => c['@base'] != undefined)['@base'];
          } else {
            base = sourceResponseObject['@context']['@base'];
          }
          if (base) {
            sourceResponseObject['@context'] = {
              ...contextConfig,
              "@base": base
            }
          } else {
            sourceResponseObject['@context'] = contextConfig
          }

          //remove @base to context and inject into predicate
          sourceResponseObject = await jsonld.compact(sourceResponseObject, contextConfig)

          const ldpNavigator = new LDPNavigator({
            forceArray: [
              'dfc-b:manages',
              'dfc-t:represent',
              'dfc-b:affiliates',
              'dfc-b:affiliatedBy'
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
              skipResolveById: true,
              dereference: ['dfc-b:hasQuantity', 'dfc-b:hasPrice', 'dfc-b:hasAdress', 'dfc-b:hasPhoneNumber', 'dfc-b:hasSocialMedia', 'dfc-b:hasSocialMedia', 'dfc-b:hasAllergenCharacteristic', 'dfc-b:hasNutrientCharacteristic', 'dfc-b:hasPhysicalCharacteristic']
            }),
            new FetchAdapter({
              headers: {
                'authorization': 'JWT ' + user['token'],
                'accept': 'application/ld+json'
              }
            })
          ]);


          await ldpNavigator.init(sourceResponseObject)
          await ldpNavigator.persist();

          let itemsToImport = [];
          const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceObject.slug);

          const response = await fetch('http://dfc-middleware:3000/sparql', {
            method: 'POST',
            body: `${PREFIX}
              CONSTRUCT  {
                ?s1 ?p1 ?o1 .
              }
              WHERE {
                 ?s1 ?p1 ?o1;
                   rdf:type dfc-b:CatalogItem;
                   dfc-t:owner <${user['@id']}>;
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
          const catalogItemsSource = await ldpNavigator.filterInMemory({
            '@type': 'dfc-b:CatalogItem'
          });

          const catalogItemsSourceDereferenced = await ldpNavigator.dereference(catalogItemsSource,
            {
              p: 'dfc-b:references',
              n: {
                p: 'dfc-b:hasQuantity'
              }
            }
          );

          const ordersSource = await ldpNavigator.filterInMemory({
            '@type': 'dfc-b:Order'
          });



          let out = [];
          try {
            let catalogItemsSourcePromises = catalogItemsSourceDereferenced.map(item => this.importItem(item, user, platform, !existing));
            out.push(await Promise.all(catalogItemsSourcePromises));
            let ordersSourcePromises = ordersSource.map(item => this.importItem(item, user, platform, false));
            out.push(await Promise.all(ordersSourcePromises));
          } catch (e) {
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
          // throw new Error ('fake')
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

  importItem(item, user, platform, claimConvert) {

    return new Promise(async (resolve, reject) => {
      try {

        await this.init();

        const sparqlTools = new SparqlTools({
          context: this.context
        });

        let itemToInsert = {
          // ...item,
          "@id": item['@id'],
          'dfc-b:offeredThrough': undefined,
          "dfc-t:hostedBy": platform['@id'],
          "dfc-t:owner": user['@id'],
          "@context": this.context,
        }

        let importedItem = await sparqlTools.insert(itemToInsert)

        let references = item['dfc-b:references']
        // let dfcReferences;
        if (references) {
          await this.importItem(references, user, platform, false)
        }

        let idDFC;
        if (claimConvert) {
          // if (dfcReferences) {
          //   importedItem['dfc-b:references'] = dfcReferences
          // }
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

  async exportAllToSource(sourceSlug, dataToExport, user) {

    for (var oneDataToExport of dataToExport) {
      await this.exportOneToSource(sourceSlug, oneDataToExport, user)
    }
    return true;
  }

  async exportSuppliedProduct(sourceSlug, dataToExport, user) {
    let sourceObject = config.sources.find(so => sourceSlug.includes(so.slug));
    const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceSlug);
    let createdItem;
    if (sourceObject.urlExportSuppliedProduct) {
      const newDataSuppliedProduct = {
        "@context": [
          this.context
        ],
        "@type": "dfc-b:SuppliedProduct",
        "dfc-b:hasQuantity": {
          "dfc-b:hasUnit": dataToExport['dfc-b:hasQuantity'] && dataToExport['dfc-b:hasQuantity']['dfc-b:hasUnit'] ? dataToExport['dfc-b:hasQuantity']['dfc-b:hasUnit']['@id'] : undefined,
          "dfc-b:value": dataToExport['dfc-b:hasQuantity'] ? dataToExport['dfc-b:hasQuantity']['dfc-b:value'] : undefined,
          "@type": "dfc-b:QuantitiveValue",
        },
        "dfc-b:hasType": dataToExport['dfc-b:hasType'] ? dataToExport['dfc-b:hasType']['@id'] : undefined,
        "dfc-b:description": dataToExport['dfc-b:description'],
        "dfc-b:name": dataToExport['dfc-b:name'],
        "dfc-b:totalTheoriticalStock": dataToExport['dfc-b:totalTheoriticalStock']
      };

      const sourceResponse = await fetch(sourceObject.urlExportSuppliedProduct, {
        method: 'POST',
        headers: {
          'authorization': 'JWT ' + user['token'],
          'accept': 'application/ld+json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(newDataSuppliedProduct)
      });


      if (sourceResponse.status == 403) {
        throw new Error("Authentification failed");
      }

      if (sourceResponse.status != 201) {
        throw new Error(`Platform have to return 201 status on creation; Platform return ${sourceResponse.status} status for ${sourceObject.urlExportCatalogItem}`);

      }

      const location = sourceResponse.headers.get('location');
      if (location == undefined) {
        throw new Error("Platform have to return location header on creation");
      }

      const createdItemResponse = await fetch(location, {
        headers: {
          'authorization': 'JWT ' + user['token'],
          'accept': 'application/ld+json',
        },
      });
      createdItem = await createdItemResponse.json();

      createdItem = await jsonld.frame(createdItem, {
        "@context": {
          ...createdItem['@context'],
          '@base': null
        },
        "@type": "dfc-b:SuppliedProduct"
      })
      createdItem['dfc-t:hostedBy'] = platform['@id'];
      createdItem['dfc-t:owner'] = user['@id'];
      const sparqlTools = new SparqlTools({
        context: this.context
      });

      await sparqlTools.insert(createdItem)


    } else {
      throw new Error("Platform api is not configured to create supply product");
    }
    return createdItem;
  }

  async exportCatalogItem(sourceSlug, dataToExport, user, suppliedProduct) {
    let sourceObject = config.sources.find(so => sourceSlug.includes(so.slug));
    const platform = await platformServiceSingleton.getOnePlatformBySlug(sourceSlug);
    let createdItem;
    if (sourceObject.urlExportCatalogItem) {

      const newDataCatalogItem = {
        "@context": [
          this.context
        ],
        "@type": "dfc-b:CatalogItem",
        "dfc-b:sku": dataToExport['dfc-b:sku'],
        "dfc-b:references": suppliedProduct['@id'],
        "dfc-b:stockLimitation": dataToExport['dfc-b:stockLimitation'],
      };

      const sourceResponse = await fetch(sourceObject.urlExportCatalogItem, {
        method: 'POST',
        headers: {
          'authorization': 'JWT ' + user['token'],
          'accept': 'application/ld+json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(newDataCatalogItem)
      });

      if (sourceResponse.status == 403) {
        throw new Error("Authentification failed");
      }

      if (sourceResponse.status != 201) {

        throw new Error(`Platform have to return 201 status on creation; Platform return ${sourceResponse.status} status for ${sourceObject.urlExportCatalogItem}`);

      }
      const location = sourceResponse.headers.get('location');
      if (location == undefined) {
        throw new Error("Platform have to return location header on creation");
      }

      const createdItemResponse = await fetch(location, {
        headers: {
          'authorization': 'JWT ' + user['token'],
          'accept': 'application/ld+json',
        },
      });

      createdItem = await createdItemResponse.json();

      createdItem = await jsonld.frame(createdItem, {
        "@context": {
          ...createdItem['@context'],
          '@base': null
        },
        "@type": "dfc-b:CatalogItem"
      })
      createdItem['dfc-t:hostedBy'] = platform['@id'];
      createdItem['dfc-t:owner'] = user['@id'];
      const sparqlTools = new SparqlTools({
        context: this.context
      });
      await sparqlTools.insert(createdItem)


    } else {
      throw new Error("Platform api is not configured to create supply product");
    }
    return createdItem;
  }


  async exportOneToSource(sourceSlug, dataToExport, user) {

    const product = await this.exportSuppliedProduct(sourceSlug, dataToExport['dfc-b:references'], user);
    await this.convertImportToReconciled(product, dataToExport['dfc-b:references'], user);


    const catalog = await this.exportCatalogItem(sourceSlug, dataToExport, user, product);
    await this.convertImportToReconciled(catalog, dataToExport, user);

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
        skipResolveById: true,
        dereference: ['dfc-b:hasQuantity']
      }),
      new FetchAdapter({
        headers: {
          'authorization': 'JWT ' + user['token'],
          'accept': 'application/ld+json'
        },
        forceContext: this.context
      })
    ]);

    let result = await ldpNavigator.resolveById(id);
    if (result) {
      const fullResult = this.getOneItem(id);
      return fullResult;
    } else {
      throw new Error("refresh error")
    }


  }

  async getOneLinkedItem(id, user) {
    let contextConfig = this.context;
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
        },
        dereference: ['dfc-b:hasQuantity']
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
    const shorter = {
      '@id': linked['@id'],
      'dfc-t:hostedBy': linked['dfc-t:hostedBy'],
      'owl:sameAs': linked['dfc-t:hasPivot']['dfc-t:represent'].map(
        r => ({
          "@id": r['@id'],
          "dfc-t:hostedBy": r['dfc-t:hostedBy']
        })
      ).filter(
        r => !(r['@id'].includes(linked['@id']))
      )
    }
    return shorter;

  }

  async getOnePlatformData(id, user) {
    const linked = await this.getOneLinkedItem(id, user);
    const shorter = {
      ...linked,
      'owl:sameAs': linked['dfc-t:hasPivot']['dfc-t:represent'].map(
        r => r['@id']
      ).filter(
        r => !(r.includes(linked['@id']))
      )
    }
    delete shorter['dfc-t:hasPivot'];
    delete shorter['dfc-t:hostedBy'];
    delete shorter['dfc-t:owner'];
    return shorter;

  }





  async impactOneLinked(data, user) {
    const ldpNavigatorFactory = new LDPNavigator_SparqlAndFetch_Factory({
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
        },
        dereference: ['dfc-b:hasQuantity', 'dfc-b:hasAllergenCharacteristic', 'dfc-b:hasCertification',
          'dfc-b:hasPhysicalCharacteristic', 'dfc-b:hasNutrientCharacteristic']
      },
      context: this.context,
      forceArray: ['dfc-t:represent', 'dfc-b:offeredThrough', 'dfc-b:hasAllergenCharacteristic',
        'dfc-b:hasPhysicalCharacteristic', 'dfc-b:hasNutrientCharacteristic']
    })

    const ldpNavigatorOrigin = ldpNavigatorFactory.make();
    const oldData = await ldpNavigatorOrigin.resolveById(data['@id']);
    const newData = { ...oldData, ...data }

    await ldpNavigatorOrigin.addToMemory(newData);
    await ldpNavigatorOrigin.persist();


    const uriDfcPlatform = (await platformServiceSingleton.getOnePlatformBySlug('dfc'))['@id'];
    const sameAsList = await this.getOneLinkedItemSimple(data['@id'], user);
    let impactOk = []
    let impactKo = []


    for (const sameAs of sameAsList['owl:sameAs']) {
      if (sameAs['dfc-t:hostedBy'] != uriDfcPlatform && sameAs['dfc-t:hostedBy'] != data['dfc-t:hostedBy']) {
        const ldpNavigatorOther = ldpNavigatorFactory.make();
        const oldData = await ldpNavigatorOther.resolveById(sameAs['@id']);

        const keptData = {
          '@id': oldData['@id'],
          'dfc-b:offeredThrough': oldData['dfc-b:offeredThrough'],
          'dfc-b:referencedBy': oldData['dfc-b:referencedBy'],
          'dfc-b:references': oldData['dfc-b:references'],
          'dfc-b:hasBrand': oldData['dfc-b:hasBrand'],
          'dfc-b:hasProcess': oldData['dfc-b:hasProcess'],
        }

        try {

          const newOtherPlatformData = {
            ...data,
            ...keptData
          }

          if (newOtherPlatformData['dfc-b:offeredThrough'] == undefined) delete newOtherPlatformData['dfc-b:offeredThrough'];
          if (newOtherPlatformData['dfc-b:references'] == undefined) delete newOtherPlatformData['dfc-b:references'];
          if (newOtherPlatformData['dfc-b:offers'] == undefined) delete newOtherPlatformData['dfc-b:offers'];
          if (newOtherPlatformData['dfc-b:referencedBy'] == undefined) delete newOtherPlatformData['dfc-b:referencedBy'];
          if (newOtherPlatformData['dfc-b:hasBrand'] == undefined) delete newOtherPlatformData['dfc-b:hasBrand'];
          if (newOtherPlatformData['dfc-b:hasProcess'] == undefined) delete newOtherPlatformData['dfc-b:hasProcess'];


          //TODO remove this line only temp for socle suport
          delete newOtherPlatformData['dfc-b:offeredThrough'];

          const sourceResponse = await fetch(sameAs['@id'], {
            method: 'PATCH',
            headers: {
              'authorization': 'JWT ' + user['token'],
              'accept': 'application/ld+json',
              'content-type': 'application/json'
            },
            body: JSON.stringify(newOtherPlatformData)
          });

          if (sourceResponse.status == 403) {
            throw new Error("Authentification failed");
          }

          if (sourceResponse.status == 404) {
            throw new Error(`uri 404 for ${sameAs['@id']}`);
          }

          if (Math.floor(sourceResponse.status / 100) != 2) {
            throw new Error(`Platform have to return 2xx status on update; Platform return ${sourceResponse.status} status for ${sameAs['@id']}`);

          }
          impactOk.push(sameAs['dfc-t:hostedBy']);

          const newData = {
            ...oldData,
            ...data,
            ...keptData
          }

          await ldpNavigatorOther.addToMemory(newData)
          await ldpNavigatorOther.persist();

        } catch (error) {
          console.error(`impact platform ${sameAs['dfc-t:hostedBy']} failed`);
          impactKo.push(sameAs['dfc-t:hostedBy']);
          console.error(error)
        }
      }
    }

    return {
      impactOk,
      impactKo
    };

  }
}

module.exports = CatalogService;


