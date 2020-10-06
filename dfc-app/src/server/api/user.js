// const mongo_client = require('./mongo_client');
// const mongoose = require('mongoose');
// const importModel = require('../ORM/importModel');
const request = require('request');
const {singletonUserService} = require('./../service/user.js');

module.exports = function (router) {
  // this.config = require('./../../configuration.js');

  // let user = new User();

  router.post('/user/:id/entreprise', async (req, res, next)=>{
    let out= await singletonUserService.createEntreprise(req.params.id,req.body);
    res.json(out)
  })
}
