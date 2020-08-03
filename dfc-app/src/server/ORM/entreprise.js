'use strict';
const mongo_client = require('./mongo_client');
const mongoose = require('mongoose');

class EntrepriseModel {
  constructor() {
    let mongoclient = mongo_client.getInstance();
    this._model = mongoclient.connection.model('entreprise', new mongoose.Schema({
      "dfc:description": {
        type: String,
        //required: true
      },
      "dfc:supplies": [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "supply"
      }],
      "@type":{
        type: String,
        default: "dfc:Entreprise",
        required: true
      }
    }, {
      strict: false
    }))
  }

  get model() {
    return this._model;
  }
}

module.exports = new EntrepriseModel();
