'use strict';
// const importModel = require('../ORM/import');
// const supplyModel = require('../ORM/supply');
// const representationPivotModel = require('../ORM/representationPivot');
const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');

class SupplyAndImport {
  constructor() {}

  cleanImport(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
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
        for(const data of datas['@graph']){
          const responseDelete = await fetch(data['@id'], {
            method: 'DELETE',
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
        }

        // let supplies = await supplyModel.model.find({
        //   user: user._id
        // }).populate("dfc:hasPivot");
        // supplies.forEach(async s => {
        //   await importModel.model.deleteMany({
        //     'dfc:represent': s._id
        //   });
        // })
        // await supplyModel.model.remove({
        //   user: user._id
        // });
        resolve({});
      } catch (e) {
        reject(e);
      }
    })
  }

  getAllImport(user) {
    return new Promise(async (resolve, reject) => {
      try {
        // console.warn('getAllImport');

        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
          }
          WHERE {
            ?s1 ?p1 ?o1 ;
              rdf:type dfc:Product ;
              dfc:owner <${user['@id']}> .
            NOT EXISTS {
              ?s1 dfc:hasPivot ?o2.
            	?o2 a dfc:RepresentationPivot.
            }
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();
        const out = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product"
        });

        // console.log("supplies", supplies);
        resolve(out);
      } catch (e) {
        reject(e);
      }
    })
    // return new Promise(async (resolve, reject) => {
    //   try {
    //     let products = await importModel.model.find({
    //       supply: {
    //         $exists: false
    //       }
    //     });
    //     // console.log('products', products);
    //     resolve(products);
    //   } catch (e) {
    //     reject(e);
    //   }
    // })
  }

  getOneImport(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            <${id}> ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
          }
          WHERE {
            <${id}> ?p1 ?o1;
                dfc:hostedBy ?s2.
            ?s2 ?p2 ?o2.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();

        const framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product"
        });
        // console.log(framed);
        const root = framed['@graph']?framed['@graph']:framed['@type']?framed:{}
        // console.log('root',root);
        const out={
          '@context':framed['@context'],
          ...root
        }
        // let product = await supplyModel.model.findOne({
        //   '@id': id
        // });
        // console.log('products', products);
        resolve(out);



        // let response = await fetch(id, {
        //   method: 'GET',
        //   headers: {
        //     'accept': 'application/ld+json'
        //   }
        // });
        // let product = await response.json();
        // // let product = await supplyModel.model.findOne({
        // //   '@id': id
        // // });
        // // console.log('products', products);
        // resolve(product);
      } catch (e) {
        reject(e);
      }
    })
  }

  getAllSupply(user) {
    return new Promise(async (resolve, reject) => {
      try {
        // console.warn('getAllSupply');

        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
            ?s3 ?p3 ?o3 .
            ?s4 ?p4 ?o4 .
            ?s5 ?p5 ?o5 .
          }
          WHERE {
            ?s1 ?p1 ?o1;
                a dfc:Product ;
                dfc:hostedBy ?s2 ;
            		dfc:hasPivot ?s3 ;
                dfc:owner <${user['@id']}> .
            ?s2 ?p2 ?o2;
            		rdfs:label 'DFC'.
            ?s3 ?p3 ?o3;
                dfc:represent ?s4.
            ?s4 ?p4 ?o4;
               	dfc:hostedBy ?s5.
            ?s5 ?p5 ?o5.

          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();
        const framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product",
          "dfc:hostedBy": {
            "rdfs:label": "DFC"
          }
        });
        const out={
          '@context':framed['@context'],
          '@graph':framed['@graph']?framed['@graph'].filter(p=>p['dfc:hostedBy']&&p['dfc:hostedBy']['rdfs:label']):[]
        }
        // console.log("supplies", supplies);
        resolve(out);
        //
        // let supplies = await supplyModel.model.find({
        //   "dfc:hostedBy": {
        //     "dfc:name": "DFC"
        //   },
        //   user: user._id
        // }).populate({
        //   path: 'dfc:hasPivot',
        //   populate: {
        //     path: 'dfc:represent'
        //   }
        // });
        //
        //
        // // console.log("supplies", supplies);
        // supplies.forEach(async s => {
        //   s["dfc:hasPivot"]["dfc:represent"] = s["dfc:hasPivot"]["dfc:represent"].filter(s => s["dfc:hostedBy"]["dfc:name"] !== "DFC")
        // });
        //
        // resolve(supplies);
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
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
            ?s3 ?p3 ?o3 .
            ?s4 ?p4 ?o4 .
            ?s5 ?p5 ?o5 .
          }
          WHERE {
            <${id}> ?p1 ?o1;
                dfc:hostedBy ?s2;
            		dfc:hasPivot ?s3.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3;
                dfc:represent ?s4.
            ?s4 ?p4 ?o4;
               	dfc:hostedBy ?s5.
            ?s5 ?p5 ?o5.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let supplies = await response.json();
        // console.log(supplies);
        const framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product",
          "dfc:hostedBy": {
            "rdfs:label": "DFC"
          }
        });
        const root = framed['@graph']?framed['@graph'].filter(p=>p['dfc:hostedBy']&&p['dfc:hostedBy']['rdfs:label'])[0]:{}
        // console.log('root',root);
        const out={
          '@context':framed['@context'],
          ...root
        }
        // let product = await supplyModel.model.findOne({
        //   '@id': id
        // });
        // console.log('products', products);
        resolve(out);

        // let product = await supplyModel.model.findById(id).populate({
        //   path: 'dfc:hasPivot',
        //   populate: {
        //     path: 'dfc:represent'
        //   }
        // });
        // product["dfc:hasPivot"]["dfc:represent"] = product["dfc:hasPivot"]["dfc:represent"].filter(s => s["dfc:hostedBy"]["dfc:name"] !== product["dfc:hostedBy"]["dfc:name"])
        // resolve(product);
      } catch (e) {
        reject(e);
      }
    })
  }

  updateOneSupply(supply) {
    return new Promise(async (resolve, reject) => {
      try {
        // let product = await supplyModel.model.findById(supply._id).populate({
        //   path: 'dfc:hasPivot',
        //   populate: {
        //     path: 'dfc:represent'
        //   }
        // });
        // console.log(supply);
        let product = await this.getOneSupply(supply['@id']);
        console.log('product["dfc:hasPivot"]["dfc:represent"]',product["dfc:hasPivot"]["dfc:represent"]);
        let oldRepresent = product["dfc:hasPivot"]["dfc:represent"].filter(i => {
          if (i["@id"] == product["@id"]) {
            return false;
          } else {
            return supply["dfc:hasPivot"]["dfc:represent"].filter(i2 => i2['@id'] == i['@id']).length == 0
          }
        });

        console.log('oldRepresent',oldRepresent);
        oldRepresent.forEach(async r => {
          // let unlinkProduct = await getOneSupply(r['@id']);
          // unlinkProduct["dfc:hasPivot"] = undefined;
          // unlinkProduct.save();
          //

          const responseProductPlatform = await fetch(r['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": {
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
              },
              "dfc:hasPivot": {}
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
        })

        // let pivot = product["dfc:hasPivot"];
        // pivot["dfc:represent"] = supply["dfc:hasPivot"]["dfc:represent"];
        // await pivot.save();


        const responsePivotPatch = await fetch(product["dfc:hasPivot"]['@id'], {
          method: 'Patch',
          body: JSON.stringify({
            "@context": {
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
            },
            "dfc:represent": supply["dfc:hasPivot"]["dfc:represent"]
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
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
            },
            'dfc:description' : supply['dfc:description'],
            'dfc:quantity' : supply['dfc:quantity'],
            // product['dfc:hasUnit'] : supply['dfc:hasUnit'];
          }),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });

        // product['dfc:description'] = supply['dfc:description'];
        // product['dfc:quantity'] = supply['dfc:quantity'];
        // product['dfc:hasUnit'] = supply['dfc:hasUnit'];
        // product.imports = supply.imports;
        // await product.save();

        resolve(supply);
      } catch (e) {
        reject(e);
      }
    })
  }

  convertAllImportToSupply(importsToConvert, user) {
    return new Promise(async (resolve, reject) => {
      try {
        let inserted = []
        for (const importToConvert of importsToConvert) {
          inserted.push(await this.convertImportToSupply(importToConvert, undefined, user));
        }

        // let promisesConvert = importsToConvert.map(async importToConvert => {
        //   this.convertImportToSupply(importToConvert, undefined, user);
        // })
        // let inserted = await Promise.all(promisesConvert);


        resolve(inserted)
      } catch (e) {
        reject(e);
      }
    })
  }

  convertImportIdToSupplyId(importId, supplyId, user) {
    return new Promise(async (resolve, reject) => {
      let importItem = await this.getOneImport(importId);
      // let importItem = await supplyModel.model.findOne({
      //   '@id': importId
      // });
      // let supplyItem = await supplyModel.model.findById(supplyId).populate("dfc:hasPivot");
      // console.log('getOneSupply',supplyId);
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
          //   "dfc:represent": [importToConvert._id]
          // });
          const body = {
            '@context': {
              'dfc': 'http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#'
            },
            '@type': 'dfc:RepresentationPivot',
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

          const dfcProduct = {
            ...importToConvert,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
            },
            "dfc:hostedBy": {
              "@type": "dfc:platform",
              "rdfs:label": "DFC"
            },
            "dfc:owner": {
              "@id": user['@id'],
              "@type": "@id"
            },
            "dfc:hasPivot": { "@id": responsePivot.headers.get('location'), "@type": "@id" },
          };
          // dfcProduct['dfc:hostedBy'] = {
          //   '@type':'dfc:platform',
          //   'rdfs:label': 'DFC'
          // };
          // dfcProduct['dfc:hasPivot'] = responsePivot.headers.get('location');

          // console.log('dfcProduct', dfcProduct);

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
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
              },
              "dfc:represent": [
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
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
              },
              "dfc:hasPivot": { "@id": responsePivot.headers.get('location'), "@type": "@id" }
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          const out = {
            "dfc:hasPivot": { "@id": responsePivot.headers.get('location')},
            ...importToConvert
          };
          // console.log( await responseProductPlatform.text());

          // const responseProductPlatformObject = await responseProductPlatform.json()
          // console.log('out',out)
          // console.log(response.headers.get('location'));

          resolve(out);

          // representationPivotInstance = await representationPivotInstance.save();
          // importToConvert['dfc:hasPivot'] = representationPivotInstance._id;
          // await importToConvert.save();
          // let DFCSupply = {
          //   "dfc:description": importToConvert["dfc:description"],
          //   "dfc:suppliedBy": importToConvert["dfc:suppliedBy"],
          //   "dfc:quantity": importToConvert["dfc:quantity"],
          //   "dfc:hasUnit": importToConvert["dfc:hasUnit"],
          //   "dfc:hasPivot": importToConvert["dfc:hasPivot"],
          //   "dfc:hostedBy": {
          //     "dfc:name": "DFC"
          //   },
          //   user: user._id
          // }
          // DFCSupply = await supplyModel.model.create(DFCSupply);
          // DFCSupply['@id'] = `http://datafoodconsortium.org/${DFCSupply._id}`;
          // await DFCSupply.save();
          // representationPivotInstance["dfc:represent"].push(DFCSupply._id);
          // await representationPivotInstance.save();
          // resolve(importToConvert);
        } else {
          // let representationPivot = await representationPivotInstance.findById(supply['dfc:hasPivot'])
          // await supply.populate("dfc:hasPivot");
          console.log('CONVERT',supply,importToConvert);
          let pivot = supply["dfc:hasPivot"];
          pivot["dfc:represent"].push({ "@id":  importToConvert['@id'], "@type": "@id" });
          const responsePivotPatch = await fetch(pivot['@id'], {
            method: 'Patch',
            body: JSON.stringify({
              "@context": {
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
              },
              "dfc:represent":pivot["dfc:represent"]
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
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
              },
              "dfc:hasPivot": { "@id": pivot['@id'], "@type": "@id" }
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });

          importToConvert["dfc:hasPivot"] = { "@id": pivot['@id'], "@type": "@id" };
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
      try {
        // let user = user['dfc:Entreprise'];
        // console.log('source', source, config.sources);
        let sourceObject = config.sources.filter(so => source.includes(so.url))[0];
        // console.log('url', source, sourceObject);
        const sourceResponse = await fetch(source, {
          method: 'GET',
          headers: {
            'authorization': 'JWT ' + user.token
          }
        })

        let sourceResponseRaw = await sourceResponse.text();

        sourceResponseRaw = sourceResponseRaw.replace(new RegExp('DFC:', 'gi'), 'dfc:').replace(new RegExp('\"DFC\":', 'gi'), '\"dfc\":');
        // console.log(sourceResponseRaw);
        const sourceResponseObject = JSON.parse(sourceResponseRaw);


        // console.log('result.body', result.body);
        // await importModel.model.remove({
        //   'dfc:hostedBy': {
        //     'dfc:name': sourceObject.name
        //   }
        // });
        let supplies;
        if (sourceObject.version == "1.1") {
          supplies = sourceResponseObject['dfc:Entreprise']['dfc:supplies'];
        } else if (sourceObject.version == "1.2") {
          supplies = sourceResponseObject['dfc:supplies'];
        }

        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            CONSTRUCT  {
              ?s1 ?p1 ?o1 .
            }
            WHERE {
               ?s1 ?p1 ?o1;
                 rdf:type dfc:Product;
                 dfc:hostedBy ?s2.
               ?s2 rdfs:label 'DFC'.
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
        // console.log('EXISTING',existing);

        let out = [];
        let context = sourceResponseObject['@context'] || sourceResponseObject['@Context']
        for (const s of supplies) {
          // s['dfc:hostedBy'] = {
          //   '@type': 'dfc:platform',
          //   'rdfs:label': sourceObject.name
          // };
          // //TODO not exist in Ontology
          // s['dfc:owner'] = user['@id'];
          // console.log({
          //   "@type": "dfc:Product",
          //   ...s
          // });
          const responsePost = await fetch('http://dfc-middleware:3000/ldp/product', {
            method: 'POST',
            body: JSON.stringify({
              ...s,
              "@context": {
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
              },
              "@type": "dfc:Product",
              "dfc:hostedBy": {
                '@type': 'dfc:platform',
                'rdfs:label': sourceObject.name
              },
              "dfc:owner": {
                "@id": user['@id'],
                "@type": "@id"
              }
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
          // console.log(responsePost.headers);
          const responseGet = await fetch(responsePost.headers.get('location'), {
            method: 'GET',
            headers: {
              'accept': 'application/ld+json'
            }
          });
          out.push(await responseGet.json());
          // s['@id'] = `${context['@base']}${s['@id']}`
        }



        // let exinsting = await supplyModel.model.find({user:user._id});
        // let inserted = await supplyModel.model.insertMany(supplies);


        // TODO convert if not data exist for this user
        // console.log("exinsting", exinsting);

        if (existing === false) {
          out = this.convertAllImportToSupply(out, user);
        }

        resolve(out)


        // request({
        //   url: source,
        //   json: true,
        //   headers: {
        //     'authorization': 'JWT ' + user.token
        //   }
        // }, async (err, result, body) => {
        //
        // })
      } catch (e) {
        reject(e);
      }
    })
  }
}

module.exports = SupplyAndImport;
