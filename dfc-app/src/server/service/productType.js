'use strict';
// const importModel = require('../ORM/import');
// const supplyModel = require('../ORM/supply');
// const representationPivotModel = require('../ORM/representationPivot');
const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');

class ProductType {
  constructor() {}

  getAll() {
    return new Promise(async (resolve, reject) => {
      try {

        const response = await fetch("http://dfc-fuseki:3030/localData/query", {
          method: 'POST',
          headers: {
            'Authorization': 'Basic YWRtaW46YWRtaW4=',
            'content-Type':'application/sparql-query',
            'accept':'application/ld+json'
          },
          body:`
          PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
          PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
          }
          WHERE {
            GRAPH ?g {
              ?s1 a skos:Concept ;
                        ?p1 ?o1 .
            }
          }
          `
        });
        let products = await response.json();

        const framed = await jsonld.frame(products, {
          "@context": {
            "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#",
            "dfc-p": "http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#",
            "dfc-t": "http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#",
            "dfc-u": "http://static.datafoodconsortium.org/data/units.rdf#",
            "dfc-pt": "http://static.datafoodconsortium.org/data/productTypes.rdf#",
            "skos": "http://www.w3.org/2004/02/skos/core#"

          }
        });
        // const out=framed
        resolve(framed);

      } catch (e) {
        reject(e);
      }
    })
  }


  getOneById(id) {
    return new Promise(async (resolve, reject) => {
      try {

        const response = await fetch("http://dfc-fuseki:3030/localData/query", {
          method: 'POST',
          headers: {
            'Authorization': 'Basic YWRtaW46YWRtaW4=',
            'content-Type':'application/sparql-query',
            'accept':'application/ld+json'
          },
          body:`
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
          }
          WHERE {
          	<${id}> ?p1 ?o1 .
          }
          `
        });
        let productRaw = await response.json();
        // console.log('productRaw',productRaw);
        let product;
        if (productRaw['@id']){
          product=productRaw;
        }else if(productRaw['@graph']) {
          product={
            '@context':productRaw['@context'],
            ...productRaw['@graph'][0]
          }
        }else{
          throw new Error('unit not found')
        }

        const framed = await jsonld.frame(product, {
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
          "@type": "dfc-p:ProductType"
        });

        resolve(framed);

      } catch (e) {
        reject(e);
      }
    })
  }

  // createOne(data) {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const response = await fetch("http://dfc-fuseki:3030/localData/update", {
  //         method: 'POST',
  //         headers: {
  //           'Authorization': 'Basic YWRtaW46YWRtaW4=',
  //           'Content-Type':'application/sparql-update'
  //         },
  //         body:`
  //         INSERT DATA {
  //           <${data['@id']}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://static.datafoodconsortium.org/ontologies/DFC_ProductGlossary.owl#ProductType> .
  //           <${data['@id']}> <http://www.w3.org/2000/01/rdf-schema#label> "${data['rdfs:label']}" .
  //         }
  //         `
  //       });
  //
  //       if(!response.ok){
  //         throw new Error(`SPARQL INSERT PRODUCT FAILED : ${await response.text()}`)
  //       }
  //       resolve(data['@id']);
  //
  //     } catch (e) {
  //       reject(e);
  //     }
  //   })
  // }

  updateProductsFromReference() {
    return new Promise(async (resolve, reject) => {
      try {

        // const typesResponse = await fetch('http://static.datafoodconsortium.org/data/productTypes.json');
        // const types= (await typesResponse.json())['@graph'];
        // // console.log('types',types);
        //
        // for (let productTypeConf of types){
        //   console.log('productTypeConf',productTypeConf);
        //   let frLabel = productTypeConf['description'].find(l=>l['@language']==='fr')['@value'];
        //   if(frLabel){
        //     productTypeConf['rdfs:label']=frLabel
        //   }
        //   // console.log(productTypeConf);
        //   try {
        //     // console.log(productTypeConf['@id']);
        //     let productType =await this.getOneById(productTypeConf['@id']);
        //     // console.log('exist type');
        //     // console.log('productType',unit);
        //   } catch (e){
        //     // console.log(e);
        //     await this.createOne(productTypeConf);
        //     // console.log('create type');
        //   }
        // }

        resolve();

      } catch (e) {
        reject(e);
      }
    })
  }
}

module.exports ={
  ProducTypeService : ProductType,
  productTypeServiceSingleton : new ProductType()
}
