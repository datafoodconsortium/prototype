// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');
// const importModel = require('../ORM/importModel');
const request = require('request');
const CatalogItem_Supply_Offer = require('./../service/catalogItem_supply_offer.js');
const Entreprise = require('./../service/entreprise.js');


module.exports = async function(router) {
  // this.config = require('./../../configuration.js');
  // Get workspaces
  let catalogItem_supply_offer = await CatalogItem_Supply_Offer.getInstance();
  router.post('/catalog/clean', async (req, res, next) => {
    if (req.user == undefined) {
      res.statusCode = 500;
      next(new Error('user not defined'))
    } else {
      let out = await catalogItem_supply_offer.cleanImport(req.user);
      res.json(out)
    }
  })

  router.get('/catalog/import', async (req, res, next) => {
    if (req.user == undefined) {
      res.statusCode = 500;
      next(new Error('user not defined'))
    } else {
      let out = await catalogItem_supply_offer.getAllImport(req.user);
      res.json(out)
    }
  })

  router.get('/catalog/import/:id(*)', async (req, res, next) => {
    let out = await catalogItem_supply_offer.getOneImport(req.params.id);
    res.json(out)
  })


  router.post('/catalog/import/:idImport(*)/convert/:idReconciled(*)?', async (req, res, next) => {
    // console.log('API',req.params);
    let idImport = req.params.idImport;
    let idReconciled = req.params.idReconciled;
    if (req.user == undefined) {
      res.statusCode = 500;
      next(new Error('user not defined'))
    } else {
      let out = await catalogItem_supply_offer.convertImportIdToReconciledId(idImport, idReconciled, req.user);
      res.json(out)
    }
  })


  router.get('/catalog/reconciled', async (req, res, next) => {
    if (req.user == undefined) {
      res.statusCode = 500;
      next(new Error('user not defined'))
    } else {
      let out = await catalogItem_supply_offer.getAllItem(req.user);
      // let out ={};
      res.json(out)
    }
  })


  router.get('/order', async (req, res, next) => {
    if (req.user == undefined) {
      res.statusCode = 500;
      next(new Error('user not defined'))
    } else {
      let out = await catalogItem_supply_offer.getAllOrder(req.user);
      // let out ={};
      res.json(out)
    }

  })

  router.post('/catalog/reconciled', async (req, res, next) => {
    try {
      let out = await catalogItem_supply_offer.updateOneItem(req.body, req.user);
      res.json(out);
    } catch (e) {
      res.statusCode = 500;
      next(e)
    }
  })

  router.get('/catalog/reconciled/:id', async (req, res, next) => {
    let out = await catalogItem_supply_offer.getOneItem(req.params.id);
    res.json(out);
  })

  router.post('/catalog/reconciled/:idImport(*)/refresh', async (req, res, next) => {
    // console.log('API',req.params);
    try {
      let idImport = req.params.idImport;
      // let idReconciled = req.params.idReconciled;
      if (req.user == undefined) {
        next(new Error('user not defined'))
      } else {
        let out = await catalogItem_supply_offer.refreshItem(idImport, req.user);
        res.json(out)
      }
    } catch (e) {
      res.statusCode = 500;
      next(e)
    }
  })

  router.post('/catalog/importSource', async (req, res, next) => {
    // console.log('IMPORT',req)
    // console.log('USER',req.user);
    let source = decodeURI(req.query.source);
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      try {
        let out = await catalogItem_supply_offer.importSource(source, req.user);
        res.json(out);
      } catch (e) {
        res.statusCode = 409;
        next(e);
      }
    }
  })

  router.post('/catalog/exportSource', async (req, res, next) => {
    // console.log('IMPORT',req)
    // console.log('USER',req.user);
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      try {
        console.log(req.body);
        let out = await catalogItem_supply_offer.exportAllToSource(req.body.sourceSlug,req.body.data, req.user);
        // console.log('END API');
        res.json({});
      } catch (e) {
        res.statusCode = 500;
        next(e);
      }
    }
  })

  router.get('/catalog/link/:id', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      try {
        let out = await catalogItem_supply_offer.getOneLinkedItem(req.params.id, req.user);
        res.json(out);
      } catch (e) {
        res.statusCode = 409;
        next(e);
      }
    }
  })

  router.get('/catalog/linkSimple/:id', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      try {
        let out = await catalogItem_supply_offer.getOneLinkedItemSimple(req.params.id, req.user);
        res.json(out);
      } catch (e) {
        res.statusCode = 409;
        next(e);
      }
    }
  })

  router.get('/catalog/my-data/:id', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      try {
        let out = await catalogItem_supply_offer.getOnePlatformData(req.params.id, req.user);
        res.json(out);
      } catch (e) {
        res.statusCode = 409;
        next(e);
      }
    }
  })

  router.post('/catalog/impact', async (req, res, next) => {
    if (req.user == undefined) {
      next(new Error('user not defined'))
    } else {
      try {
        let out = await catalogItem_supply_offer.impactOneLinked(req.body,req.user);
        res.json(out);
      } catch (e) {
        res.statusCode = 500;
        next(e);
      }
    }
  })

}
