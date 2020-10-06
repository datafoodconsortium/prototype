'use strict';
// const userModel = require('../ORM/user');
// const entrepriseModel = require('../ORM/entreprise');
const fetch = require('node-fetch');
const request = require('request');
const config = require('./../../../configuration.js');

class UserService {
  constructor() {}

  getOneUser(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await userModel.model.findOne(id);
        // console.log('products', products);
        resolve(user);
      } catch (e) {
        reject(e);
      }
    })
  }

  async connectUser(login, accessToken) {
    // console.log('CONNECT');
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX ontosec: <http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#>
          PREFIX dfc: <http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#>

          CONSTRUCT  {
            ?s1 ?p1 ?o1 .
          }
          WHERE {
            ?s1 ?p1 ?o1 ;
              rdf:type dfc:Person;
              dfc:email '${login}'.
          }
          `,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let user = await response.json();
        // console.log('user',user);


        if (!(user['@id'] || user['@graph'])) {

          if (this.UserCreationByConnect===true) {
            // console.log('DELAY UserCreationByConnect');
            user = await this.connectUser(login, accessToken)
          }else {
            this.UserCreationByConnect=true;
            user = await this.createOneUser({
              'login': login,
              'accessToken': accessToken
            });
            this.UserCreationByConnect=false;
          }

        } else {
          // TODO update token
          // user.accessToken = accessToken;
          // await user.save();
        }
        resolve(user);
      } catch (e) {
        reject(e);
      }
    })
  }

  async createEntreprise(userId, entreprise) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await userModel.model.findById(userId);
        let newEntreprise = await entrepriseModel.model.create(entreprise);
        user['dfc:Entreprise'] = newEntreprise;
        await user.save();
        resolve(user);
      } catch (e) {
        reject(e);
      }
    })
  }

  async updateOneUser(user) {
    return new Promise(async (resolve, reject) => {
      try {
        let userOld = await userModel.model.findById(user._id);
        Object.assign(userOld, user);
        await userOld.save();
        resolve(userOld);
      } catch (e) {
        reject(e);
      }
    })
  }

  async createOneUser(user) {
    return new Promise(async (resolve, reject) => {
      try {
        // TODO add token
        let data = {
          "@context": {
            "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
            "ontosec": "http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#"
          },
          "@type": "dfc:Person",
          "dfc:email": user.login,
          "ontosec:token": user.accessToken
        }

        const response = await fetch('http://dfc-middleware:3000/ldp/user', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });
        let location = response.headers.get('location');

        const response2 = await fetch(location, {
          method: 'GET',
          headers: {
            'accept': 'application/ld+json',
          }
        });
        const newUser = await response2.json();
        // console.log('response', response.headers.get('location'));
        resolve(newUser)
        // let newUser = await userModel.model.create(user)
        // resolve(newUser);
      } catch (e) {
        reject(e);
      }
    })
  }

}

module.exports = {
  UserService,
  singletonUserService: new UserService()
}
