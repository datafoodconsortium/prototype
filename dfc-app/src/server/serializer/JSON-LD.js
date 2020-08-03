'use strict';
// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');

class json_ldSerializer {
  constructor() {
    this.context = {
      "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
      "@base": "http://localhost:8080"
    };

    this.resourcePathMap={
      'dfc:Entreprise':'/entreprise/',
      'dfc:SuppliedProduct':'/supply/',
    }
  }

  serializeObject(data) {
    let out = {
      '@type': data['@type']
    };

    if (data['@id'] == undefined) {
      out['@id'] = this.resourcePathMap[data['@type']] + data._id;
    } else {
      out['@id'] = data['@id'];
    }

    switch (data['@type']) {
      case "dfc:Entreprise":
        out['dfc:description'] = data['dfc:description'];
        out['dfc:supplies'] = data['dfc:supplies'].map(s => this.serializeObject(s))
        break;
      case "dfc:SuppliedProduct":
        out['dfc:description'] = data['dfc:description'];
        out['dfc:hasUnit'] = data['dfc:hasUnit'];
        out['dfc:quantity'] = data['dfc:quantity'];
        break;
      default:
    }
    return out;
  }

  serialize(data) {

    let out = {
      "@context": this.context
    };
    let dataJson = this.serializeObject(data);
    Object.assign(out,dataJson);
    return out;
  }
}

module.exports = new json_ldSerializer();
