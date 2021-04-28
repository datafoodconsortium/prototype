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
      if(req.query.url){
        request({
          url: req.query.url,
          json: true,
          headers: {
            'authorization': req.headers.authorization
          }
        }, (err, result, body) => {
          if (err == undefined) {
            console.log('result',result.statusCode);
            res.json(result.body);
          }
        })
      }else{
        throw (new Error('no URL'))
      }
    } catch (e) {
      next(e);
    } finally {

    }


  })
}
