'use strict';
const mongo_client = require('./mongo_client');
const mongoose = require('mongoose');

class ImportModel {
  constructor() {
    let mongoclient = mongo_client.getInstance();
    this._model = mongoclient.connection.model('import', new mongoose.Schema({
      supply: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "supply"
      },
      "dfc:description": {
        type: String,
        //required: true
      },
      "dfc:quantity": {
        type: Number,
        //required: true
      },
      "dfc:hasUnit": {
        type: mongoose.Schema.Types.Mixed,
        //required: true
      },
      "@type": {
        type: String,
        default: "dfc:SuppliedProduct",
        required: true
      },
      "source": {
        type: String,
        //required: true
      },
      "@id": {
        type: String,
        //required: true
      },
    }, {
      strict: false
    }))
  }

  get model() {
    return this._model;
  }
}

module.exports = new ImportModel();
