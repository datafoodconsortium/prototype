'use strict';

const jsonld = require('jsonld');
const fetch = require('node-fetch');
var urljoin = require('url-join');
const isObject = require("fix-esm").require('isobject')
console.log('isObject',isObject);
const DataFactory = require('@rdfjs/data-model');
const {
  literal,
  namedNode,
  quad,
  variable
} = DataFactory;
const SparqlGenerator = require('sparqljs').Generator;
// const {SparqlAdapter,LDPNavigator} = require("fix-esm").require('ldp-navigator')
const {
  LDPNavigator_SparqlAndFetch_Factory
} = require("fix-esm").require('ldp-navigator')


class SparqlCrud {
  constructor(config) {
    this.config = config || {}
  }

  simplify(resource){
    // console.log('resource',resource);
    if(Array.isArray(resource)){
      // console.log('simplify array');
      return resource.map(r=>this.simplify(r));
    } else if (resource && isObject(resource)) {
      // console.log('simplify object');
      let clonedResource = {...resource};
      // console.log('clonedResource',clonedResource);
      for (let key of Object.keys(clonedResource)){
        // console.log('key',key,clonedResource[key]);
        if(clonedResource[key] && clonedResource[key]["@id"]){
          clonedResource[key]=clonedResource[key]["@id"];
        }else {
          clonedResource[key]=this.simplify(clonedResource[key])
        }
      }
      return clonedResource;
    } else{
      return resource
    }
  }

  async insert(resource) {
    // console.log('insert');
    // console.log('resource',resource);
    // console.log('-----------------------');
    resource['@context'] = {
      ...this.config.context,
      ...resource['@context']
    }

    const simplifiedRessource= this.simplify(resource)
    // console.log('simplifiedRessource',simplifiedRessource);

    const rdf = await jsonld.toRDF(simplifiedRessource, {
      format: 'application/n-quads'
    });

    // console.log('insert',`INSERT DATA { ${rdf} }`);
    const response = await fetch(urljoin('http://dfc-fuseki:3030/', 'localData', 'update'), {
      body: `INSERT DATA { ${rdf} }`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-update',
        Authorization: 'Basic ' + Buffer.from(process.env.SEMAPPS_JENA_USER + ':' + process.env.SEMAPPS_JENA_PASSWORD).toString('base64')
      }
    });

    // console.log('response',response);
    const data = await response.text();
    // console.log('data',data);
    // console.log('sparqlTool getOne cause by insert');
    const getOneObject = await this.getOne(resource['@id'])

    // console.log('getOneObject',getOneObject);

    return resource
  };

  async getOne(id) {
    const config = this.config;
    const navigator = new LDPNavigator_SparqlAndFetch_Factory({
      context: this.config.context,
      sparql: {
        query: {
          endpoint: 'http://dfc-middleware:3000/sparql',
          headers: {
            'accept': 'application/ld+json'
          },
          prefix: `
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX dfc: <http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#>
            PREFIX dfc-b: <http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#>
            PREFIX dfc-p: <http://static.datafoodconsortium.org/ontologies/DFC_ProductOntology.owl#>
            PREFIX dfc-t: <http://static.datafoodconsortium.org/ontologies/DFC_TechnicalOntology.owl#>
            PREFIX dfc-u: <http://static.datafoodconsortium.org/data/units.rdf#>
            PREFIX dfc-pt: <http://static.datafoodconsortium.org/data/productTypes.rdf#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            `
        },
        update: {
          endpoint: 'http://dfc-fuseki:3030/localData/update',
          headers: {
            'Content-Type': 'application/sparql-update',
            Authorization: 'Basic ' + Buffer.from(process.env.SEMAPPS_JENA_USER + ':' + process.env.SEMAPPS_JENA_PASSWORD).toString('base64')
          }
        }
      },
      fetch: {
        headers: {

        }
      }
    }).make();

    // await navigator.init(id);
    const data = await navigator.resolveById(id);
    // console.log('data',data);

    return data;
  }

  async remove(id) {
    console.log('REMOVE',id);
    const query = `
      DELETE
      WHERE {
        <${id}> ?p1 ?o1 .
      }
    `

    console.log('query',query);
    const response = await fetch(urljoin('http://dfc-fuseki:3030/', 'localData', 'update'), {
      body: query,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-update',
        Authorization: 'Basic ' + Buffer.from(process.env.SEMAPPS_JENA_USER + ':' + process.env.SEMAPPS_JENA_PASSWORD).toString('base64')
      }
    });

    // console.log(response.status);
    const raw = await response.text();
    // console.log('raw',raw);

  }

  async removeTriples(id, triples) {
    const navigator = new LDPNavigator_SparqlAndFetch_Factory({
      context: this.config.context,
    }).make();
    let where = '';
    let triplesString = triples.forEach((t, i) => {
      const expand = navigator.unPrefix(t);
      // console.log('unprefix', t, expand);
      where += `<${id}> <${expand}> ?o${i} .
      `
    });

    const query = `
      DELETE
      WHERE {
        ${where}
      }
    `

    // console.log('query', query);
    const response = await fetch(urljoin('http://dfc-fuseki:3030/', 'localData', 'update'), {
      body: query,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-update',
        Authorization: 'Basic ' + Buffer.from(process.env.SEMAPPS_JENA_USER + ':' + process.env.SEMAPPS_JENA_PASSWORD).toString('base64')
      }
    });

  }

  async getOneManual(id) {
    const sparqljsQuery = {
      "queryType": "CONSTRUCT",
      "template": [{
        "subject": {
          "termType": "Variable",
          "value": "subject"
        },
        "predicate": {
          "termType": "Variable",
          "value": "predicate"
        },
        "object": {
          "termType": "Variable",
          "value": "object"
        }
      }],
      "where": [{
          "type": "bind",
          "variable": {
            "termType": "Variable",
            "value": "subject"
          },
          "expression": {
            "termType": "NamedNode",
            "value": id
          }
        },
        {
          "type": "bgp",
          "triples": [{
            "subject": {
              "termType": "Variable",
              "value": "subject"
            },
            "predicate": {
              "termType": "Variable",
              "value": "predicate"
            },
            "object": {
              "termType": "Variable",
              "value": "object"
            }
          }]
        }
      ],
      "type": "query",
      "prefixes": {
        "dfc-b": "http://static.datafoodconsortium.org/ontologies/DFC_BusinessOntology.owl#"
      }
    }

    let generator = new SparqlGenerator({
      /* prefixes, baseIRI, factory, sparqlStar */
    });
    const query = generator.stringify(sparqljsQuery);

    // console.log('query',query);

    const response = await fetch(urljoin('http://dfc-fuseki:3030/', 'localData', 'query'), {
      body: query,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        Accept: "application/ld+json",
        Authorization: 'Basic ' + Buffer.from(process.env.SEMAPPS_JENA_USER + ':' + process.env.SEMAPPS_JENA_PASSWORD).toString('base64')
      }
    });

    // console.log('response getOne',response);
    const data = await response.json();
    // console.log('data getOne',data);
    const item = await jsonld.compact(data, this.config.context)
    // console.log('items',items);
    return item;
  }

}

module.exports = SparqlCrud;
