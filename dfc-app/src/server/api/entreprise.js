// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');
// const importModel = require('../ORM/importModel');
const request = require('request');
const SupplyAndImport = require('./../service/supplyAndImport.js');
const Entreprise = require('./../service/entreprise.js');
// const json_ldSerializer =require('./../serializer/JSON-LD.js');
// const ldpSerializer =require('./../serializer/LDP.js');

module.exports = function(router) {
  // this.config = require('./../../configuration.js');

  // let entreprise = new Entreprise();

  // router.get('/me/entrepriseJSONLD', async (req, res, next) => {
  //   try {
  //     let entrepriseMongo = await entreprise.getOneEntreprise(req.user['dfc:Entreprise']._id);
  //     let out = json_ldSerializer.serialize(entrepriseMongo);
  //
  //     res.json(out);
  //   } catch (e) {
  //     next(e);
  //   } finally {
  //
  //   }
  // })
}
