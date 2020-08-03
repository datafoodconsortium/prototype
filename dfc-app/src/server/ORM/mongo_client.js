'use strict';
class MongoClientSingleton {
  constructor() {
  }

  static getInstance() {
    if (this.instance == undefined) {
      this.instance = new MongoClient();
    }
    return this.instance;
  }
}

class MongoClient {
  constructor() {
    this.config = require('./../../../configuration.js');
    console.log('config',this.config);
    // console.log(this.config)
    this.mongoose = require('mongoose');
    this.mongoose.Promise = Promise;
    // const conStr = this.config.mlabDB;
    // const conStr ='mongodb://mongodb:27017'
    // console.log()
    const db = this.mongoose.createConnection(this.config.mongoConnection);
    // CONNECTION EVENTS
    // When successfully connected
    db.on('connected', ()=>{
      console.log('Mongoose default connection open to ' + this.config.mongoConnection);
    });

    // If the connection throws an error
    db.on('error', (err)=>{
      console.log('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    db.on('disconnected', function() {
      //console.log('Mongoose default connection disconnected');
    });
    this._connection = db;
  }

  get connection() {
    return this._connection;
  }
}
//export default MongoClient;
module.exports = MongoClientSingleton;
