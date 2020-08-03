// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');
// const importModel = require('../ORM/importModel');
const request = require('request');
const SupplyAndImport = require('./../service/supplyAndImport.js');
const Entreprise = require('./../service/entreprise.js');

module.exports = function(router) {
  // this.config = require('./../../configuration.js');
  // Get workspaces
  let supplyAndImport = new SupplyAndImport();
  router.post('/clean', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      let out = await supplyAndImport.cleanImport(req.user);
      res.json(out)
    }
  })

  router.get('/import', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      let out = await supplyAndImport.getAllImport(req.user);
      res.json(out)
    }
  })
  router.post('/import/:idImport(*)/convert/:idSupply(*)?', async (req, res, next) => {
    // console.log('API',req.params);
    let idImport = req.params.idImport;
    let idSupply = req.params.idSupply;
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      let out = await supplyAndImport.convertImportIdToSupplyId(idImport, idSupply, req.user);
      res.json(out)
    }

  })

  router.get('/import/:id(*)', async (req, res, next) => {
    let out = await supplyAndImport.getOneImport(req.params.id);
    res.json(out)
  })

  router.get('/supply', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      let out = await supplyAndImport.getAllSupply(req.user);
      res.json(out)
    }

  })

  router.post('/supply', async (req, res, next) => {
    try {
      let out = await supplyAndImport.updateOneSupply(req.body);
      res.json(out);
    } catch (e) {
      next(e)
    }
  })

  router.get('/supply/:id', async (req, res, next) => {
    let out = await supplyAndImport.getOneSupply(req.params.id);
    res.json(out);
  })

  router.post('/import/importSource', async (req, res, next) => {
    let source = decodeURI(req.query.source);
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      let out = await supplyAndImport.importSource(source, req.user);
      res.json(out);

    }
  })

}
