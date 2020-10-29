'use strict';
// const mongo_client = require('./mongo_client');
const json_ldSerializer = require('./JSON-LD.js');

class ldpSerializer {
  constructor() {

  }

  serialize(data, res) {

    let out = json_ldSerializer.serialize(data)
    out['@id'] = '/data/core/me/entrepriseLDP'
    // return out;


    return {
      "@context": {
        "dfc": "http://static.datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
      },
      "@id": "http://localhost:8080/data/core/entrepriseLDP/5da83c675417a50a1250ee08",
      "@type": "dfc:Entreprise",
      "dfc:description" : "maPetiteEntreprise",
      "dfc:supplies": [{
          "@id": "http://localhost:8080/data/core/suppliedProduct/item1",
          "dfc:hasUnit": {
            "@id": "/unit/unit"
          },
          "dfc:quantity": "1",
          "dfc:description": "Aillet botte 1 pièce"
        },
        {
          "@id": "http://localhost:8080/data/core/suppliedProduct/item2",
          "dfc:hasUnit": {
            "@id": "/unit/kg"
          },
          "dfc:quantity": "1",
          "dfc:description": "Blette 1 kg"
        }
      ]
    }
  }
}

module.exports = new ldpSerializer();
