'use strict';
const mongo_client = require('./mongo_client');
const mongoose = require('mongoose');

class SupplyModel {
  constructor() {
    let mongoclient = mongo_client.getInstance();
    this._model = mongoclient.connection.model('supply', new mongoose.Schema({
      "dfc:description": {
        type: String,
        //required: true
      },
      "dfc:suppliedBy":{
        type: mongoose.Schema.Types.ObjectId,
        ref: "entreprise"
      },
      "dfc:quantity": {
        type: Number,
        //required: true
      },
      "dfc:hasUnit": {
        type: mongoose.Schema.Types.Mixed,
        //required: true
      },
      "dfc:hasPivot": {
        type: mongoose.Schema.Types.ObjectId,
        ref: "representationPivot",
      },
      "dfc:hostedBy": {
        "dfc:name":{
          type: String,
          required: true
        }
      },
      "@type": {
        type: String,
        default: "dfc:SuppliedProduct",
        required: true
      },
      "user":{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      "@id": {
        type: String,
      }
    }, {
      strict: false
    }))
  }

  get model() {
    return this._model;
  }
}

module.exports = new SupplyModel();
