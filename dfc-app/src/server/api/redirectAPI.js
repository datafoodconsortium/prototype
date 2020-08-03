// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');
// const importModel = require('../ORM/importModel');
const request = require('request');

module.exports = function(router) {
  // this.config = require('./../../configuration.js');

  // let entreprise = new Entreprise();

  router.get('/redirectAPI', async (req, res, next) => {
    try {
      console.log(req.query.url);
      request({
        url: req.query.url,
        json: true,
        headers: {
          'authorization': req.headers.authorization
        }
      }, (err, result, body) => {
        if (err == undefined) {
          res.json(result.body);
        }
      })
    } catch (e) {
      next(e);
    } finally {

    }


  })
}
