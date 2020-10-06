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
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
            ?s3 ?p3 ?o3 .
            ?s4 ?p4 ?o4 .
          }
          WHERE {
            ?s1 ?p1 ?o1 ;
              rdf:type dfc:Product ;
              dfc:hostedBy ?s3 ;
              dfc:hasUnit ?s4 ;
              dfc:owner <${user['@id']}> .
            ?s3 ?p3 ?o3.
            ?s4 ?p4 ?o4.
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
        // console.log(supplies);
        const out = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product"
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
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
            <${id}> ?p1 ?o1 .
            ?s2 ?p2 ?o2 .
            ?s3 ?p3 ?o3 .
          }
          WHERE {
            <${id}> ?p1 ?o1;
                dfc:hostedBy ?s2;
                dfc:hasUnit ?s3.
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
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product"
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

        let owner = user['@id'];

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
            ?s6 ?p6 ?o6 .
            ?s7 ?p7 ?o7 .
          }
          WHERE {
            ?s1 ?p1 ?o1;
                a dfc:Product ;
                dfc:hostedBy <${platformServiceSingleton.DFCPlaform['@id']}> ;
                dfc:hasPivot ?s3;
                dfc:owner <${owner}>;
                dfc:hasUnit ?s6.
            ?s1 dfc:hostedBy ?s2.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3;
                dfc:represent ?s4.
            ?s4 ?p4 ?o4;
                dfc:hostedBy ?s5;
                dfc:hasUnit ?s7.
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
        // console.log('supplies',JSON.stringify(supplies));
        // console.log('supplies',supplies);

        let framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "dfc:hostedBy":{
              "@type":"@id"
            },
            "dfc:represent":{
              "@type":"@id"
            },
            "dfc:owner":{
              "@type":"@id"
            },
            "dfc:hasPivot":{
              "@type":"@id"
            },
            "dfc:hasUnit":{
              "@type":"@id"
            }
          },
          "@type": "dfc:Product",
          "dfc:hostedBy": platformServiceSingleton.DFCPlaform['@id']

        });


        // console.log('platforms',framed['@graph'].map(g=>g['dfc:hostedBy']));
        // console.log('ids',framed['@graph'].map(g=>g['@id']));
        // console.log('pivot',framed['@graph'].map(g=>g['dfc:hasPivot']['dfc:represent']));
        // console.log('framed',framed);
        framed={
          '@context':framed['@context'],
          '@graph':framed['@graph']?framed['@graph'].filter(p=>p['dfc:hostedBy']&&p['dfc:hostedBy']['rdfs:label']):[]
        }

        // console.log("framed 1", JSON.stringify(framed));

        framed['@graph'].forEach(f=>{
          // console.log('hasUnit',f['dfc:hasUnit']);
          if(!f['dfc:hasUnit']['rdfs:label']){
            const unitEntity = supplies['@graph'].filter(s=>s['@id']===f['dfc:hasUnit'])[0];
            // console.log(unitEntity);
            f['dfc:hasUnit']={'@id':unitEntity['@id'],'rdfs:label':unitEntity['label'],'@type':unitEntity['@type']};
          }
        })
        // console.log("framed 2", framed);
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
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
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
                dfc:hostedBy ?s2;
            		dfc:hasPivot ?s3;
                dfc:hasUnit ?s6.
            ?s2 ?p2 ?o2.
            ?s3 ?p3 ?o3;
                dfc:represent ?s4.
            ?s4 ?p4 ?o4;
               	dfc:hostedBy ?s5;
                dfc:hasUnit ?s7.
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
        // console.log('getOneSupply',supplies);
        let framed = await jsonld.frame(supplies, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Product",
          "dfc:hostedBy":{
            "@id":platformServiceSingleton.DFCPlaform['@id']
          }
        });
        // console.log('getOneSupply framed',framed);
        // const root = framed['@graph']?framed['@graph'].filter(p=>p['dfc:hostedBy']&&p['dfc:hostedBy']['rdfs:label'])[0]:{}
        // // console.log('root',root);

        framed={
          '@context':framed['@context'],
          '@graph':framed['@graph']?framed['@graph'].filter(p=>p['dfc:hostedBy']&&p['dfc:hostedBy']['rdfs:label']):[]
        }

        framed['@graph'].forEach(f=>{
          // console.log('f',f);
          const unitEntity = supplies['@graph'].filter(s=>s['@id']===f['dfc:hasUnit']['@id'])[0];
          // console.log(unitEntity);
          f['dfc:hasUnit']={'@id':unitEntity['@id'],'rdfs:label':unitEntity['label'],'@type':unitEntity['@type'],};
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
        // console.log('product["dfc:hasPivot"]["dfc:represent"]',product["dfc:hasPivot"]["dfc:represent"]);
        let oldRepresent = product["dfc:hasPivot"]["dfc:represent"].filter(i => {
          if (i["@id"] == product["@id"]) {
            return false;
          } else {
            return supply["dfc:hasPivot"]["dfc:represent"].filter(i2 => i2['@id'] == i['@id']).length == 0
          }
        });

        // console.log('oldRepresent',oldRepresent);
        oldRepresent.forEach(async r => {
          const responseProductPlatform = await fetch(r['@id'], {
            method: 'Put',
            body: JSON.stringify({
              ...r,
              "@context": {
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
              },
              "dfc:hasPivot": undefined
            }),
            headers: {
              'accept': 'application/ld+json',
              'content-type': 'application/ld+json'
            }
          });
        })

        const responsePivotPatch = await fetch(product["dfc:hasPivot"]['@id'], {
          method: 'Patch',
          body: JSON.stringify({
            "@context": {
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
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
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
            },
            'dfc:description' : supply['dfc:description'],
            'dfc:quantity' : supply['dfc:quantity'],
            'dfc:hasUnit' : supply['dfc:hasUnit'],
            // product['dfc:hasUnit'] : supply['dfc:hasUnit'];
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
          // console.log('XXXXXXXXXX PIVOT',responsePivot.headers.get('location'));

          const dfcProduct = {
            ...importToConvert,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
            },
            "dfc:hostedBy": {
              "@type": "@id",
              "@id": platformServiceSingleton.DFCPlaform['@id'],
            },
            "dfc:owner": {
              "@id": user['@id'],
              "@type": "@id"
            },
            "dfc:hasPivot": {
              "@id": responsePivot.headers.get('location'),
              "@type": "@id"
            },
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


          resolve(out);

        } else {
          // let representationPivot = await representationPivotInstance.findById(supply['dfc:hasPivot'])
          // await supply.populate("dfc:hasPivot");
          // console.log('CONVERT',supply,importToConvert);
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
        // console.log(user['dfc:importInProgress']);
        if(user['dfc:importInProgress']==true){
          reject(new Error("import in progress. Not possible to process an other"))
        }else {
          const responseProgressOn = await fetch(user['@id'], {
            method: 'PATCH',
            body: JSON.stringify({
              "@context": {
                "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
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
          }

          // console.log(supplies);
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
                   dfc:hostedBy <${platformServiceSingleton.DFCPlaform['@id']}>.
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
                  "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
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
        // console.log(supply['dfc:hasUnit']);
        let unit = supply['dfc:hasUnit']?supply['dfc:hasUnit']['@id']||supply['dfc:hasUnit']:undefined;
        // console.log('unit',unit);
        if (unit){
          const regex = /.*\/(\w*)/gm;
          const unitFragment=regex.exec(unit)[1];
          console.log('unitFragment',unitFragment);
          const unitId = `http://datafoodconsortium.org/data/unit#${unitFragment}`;
          supply['dfc:hasUnit']={
            "@id":unitId,
            "@type":"@id"
          }
        }
        // console.log('supply',supply);
        const responsePost = await fetch('http://dfc-middleware:3000/ldp/product', {
          method: 'POST',
          body: JSON.stringify({
            ...supply,
            "@context": {
              "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
              "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#"
            },
            "@type": "dfc:Product",
            "dfc:hostedBy": {
              '@type': '@id',
              '@id': `http://dfc-middleware:3000/ldp/platform/${plateformConfig.slug}`
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
