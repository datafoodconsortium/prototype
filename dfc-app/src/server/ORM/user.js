'use strict';
const mongo_client = require('./mongo_client');
const mongoose = require('mongoose');

class UserModel {
  constructor() {
    let mongoclient = mongo_client.getInstance();
    this._model = mongoclient.connection.model('user', new mongoose.Schema({
      "login": {
        type: String,
        //required: true
      },
      "accessToken": {
        type: String,
        //required: true
      },
      "dfc:Entreprise": {
        type: mongoose.Schema.Types.ObjectId,
        ref: "entreprise"
      },
    }, {
      strict: false
    }))
  }

  get model() {
    return this._model;
  }
}

module.exports = new UserModel();
