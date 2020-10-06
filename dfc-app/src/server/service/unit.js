'use strict';
// const importModel = require('../ORM/import');
// const supplyModel = require('../ORM/supply');
// const representationPivotModel = require('../ORM/representationPivot');
const request = require('request');
const config = require('./../../../configuration.js');
const fetch = require('node-fetch');
const jsonld = require('jsonld');

class Unit {
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
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
          	?s1 ?p1 ?o1 .
          }
          WHERE {
          	?s1 a dfc:Unit ;
              ?s1 ?p1 ?o1 .
          }
          `
        });
        let units = await response.json();

        const framed = await jsonld.frame(units, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          }
        });
        // const out=framed

        resolve(framed);

      } catch (e) {
        reject(e);
      }
    })
  }


  getOneUnitById(id) {
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
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          CONSTRUCT  {
          	<${id}> ?p1 ?o1 .
          }
          WHERE {
          	<${id}> ?p1 ?o1 .
          }
          `
        });
        let unitRaw = await response.json();
        let unit;
        if (unitRaw['@id']){
          unit=unitRaw;
        }else if(unitRaw['@graph']) {
          unit={
            '@context':unitRaw['@context'],
            ...unitRaw['@graph'][0]
          }
        }else{
          throw new Error('unit not found')
        }

        const framed = await jsonld.frame(unit, {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
          },
          "@type": "dfc:Unit"
        });
        // const out=framed

        resolve(framed);

      } catch (e) {
        reject(e);
      }
    })
  }

  createOneUnit(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch("http://dfc-fuseki:3030/localData/update", {
          method: 'POST',
          headers: {
            'Authorization': 'Basic YWRtaW46YWRtaW4=',
            'Content-Type':'application/sparql-update'
          },
          body:`
          INSERT DATA {
            <${data['@id']}> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#Unit> .
            <${data['@id']}> <http://www.w3.org/2000/01/rdf-schema#label> "${data['rdfs:label']}" .
          }
          `
        });

        if(!response.ok){
          throw new Error(`SPARQL INSERT UNIT FAILED : ${await response.text()}`)
        }
        resolve(data['@id']);

      } catch (e) {
        reject(e);
      }
    })
  }

  updateUnitsFromConfig() {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('config',config.data);
        for (let unitConf of config.data.units){
          try {
            let unit =await this.getOneUnitById(unitConf['@id']);
            // console.log('UNIT',unit);
          } catch (e){
            console.log(e);
            await this.createOneUnit(unitConf)
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
  UnitService : Unit,
  unitServiceSingleton : new Unit()
}
