'use strict';
const fetch = require('node-fetch');
const request = require('request');
const config = require('./../../../configuration.js');
const jsonld = require('jsonld');

class UserService {
  constructor() { }

  getOneUser(id) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await userModel.model.findOne(id);
        resolve(user);
      } catch (e) {
        reject(e);
      }
    })
  }

  async connectUser(login, accessToken, idToken) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX ontosec: <http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#>
        PREFIX dfc: <https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_FullModel.owl#>
        CONSTRUCT  {
          ?s1 ?p1 ?o1 .
        }
        WHERE {
          ?s1 ?p1 ?o1 ;
            rdf:type dfc:Person;
            dfc:email '${login}'.
        }
        `;

        const response = await fetch('http://dfc-middleware:3000/sparql', {
          method: 'POST',
          body: query,
          headers: {
            'accept': 'application/ld+json'
          }
        });
        let user = await response.json();
        user = await jsonld.compact(user, { '@context': config.contextBody });

        if (accessToken || idToken) {
          if (!(user['@id'] || user['@graph'])) {
            if (this.UserCreationByConnect === true) {
              user = await this.connectUser(login, accessToken);
              user = await jsonld.compact(user, { '@context': config.contextBody });
            } else {
              this.UserCreationByConnect = true;
              user = await this.createOneUser({
                "@context": {
                  "dfc": "https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_FullModel.owl#",
                  "ontosec": "http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#"
                },
                'dfc:email': login,
                'ontosec:token': accessToken,
                'ontosec:idToken': idToken,
              });
              this.UserCreationByConnect = false;
            }

          } else {
            // TODO update token
            // user.accessToken = accessToken;
            let data = {
              "@context": {
                "dfc": "https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_FullModel.owl#",
                "ontosec": "http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#"
              },
              '@id': user['@id'],
              'dfc:email': login,
              'ontosec:token': accessToken,
              'ontosec:idToken': idToken || user['idToken'],
            }
            user = await this.updateOneUser(data);
            user = await jsonld.compact(user, { '@context': config.contextBody });
          }
        } else {
          if (!(user['@id'] || user['@graph'])){
            throw new Error('User not found');
          }
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

  async mergeOneUser(user) {
    return new Promise(async (resolve, reject) => {
      try {


        // let oldResponse = await fetch(user['@id'], { headers: { 'accept': 'application/ld+json' } }).then(response => response.text())
        let userOld = await fetch(user['@id'], { headers: { 'accept': 'application/ld+json' } }).then(response => response.json())
        let oldUserSimpleContext = {};
        if (typeof userOld['@context'] === 'string') {
          oldUserSimpleContext = await fetch(userOld['@context']).then(response => response.json())
          oldUserSimpleContext = oldUserSimpleContext['@context'];
        } else if (typeof userOld['@context'] === 'object') {
          oldUserSimpleContext = { ...(userOld['@context']) };
        }

        for (const key in oldUserSimpleContext) {
          if (oldUserSimpleContext[key].hasOwnProperty('@id')) {
            delete oldUserSimpleContext[key];
          }
          if (oldUserSimpleContext[key]=='@id') {
            delete oldUserSimpleContext[key];
          }
          if (oldUserSimpleContext[key]=='@type') {
            delete oldUserSimpleContext[key];
          }
        }

        let oldUserWithPrefix = await jsonld.compact(userOld, { '@context': oldUserSimpleContext });
        oldUserWithPrefix = await jsonld.compact(oldUserWithPrefix, { '@context': config.contextBody });


        // Apply the same treatment to user as for oldUser
        let userSimpleContext = {};
        if (typeof user['@context'] === 'string') {
          userSimpleContext = await fetch(user['@context']).then(response => response.json())
          userSimpleContext = userSimpleContext['@context'];
        } else if (typeof user['@context'] === 'object') {
          userSimpleContext = { ...(user['@context']) };
        }



        for (const key in userSimpleContext) {
          if (userSimpleContext[key].hasOwnProperty('@id')) {
            delete userSimpleContext[key];
          }
          if (userSimpleContext[key]=='@id') {
            delete userSimpleContext[key];
          }
          if (userSimpleContext[key]=='@type') {
            delete userSimpleContext[key];
          }
        }


        let userWithPrefix = await jsonld.compact(user, { '@context': userSimpleContext});
 
        userWithPrefix = await jsonld.compact(userWithPrefix, { '@context': config.contextBody });

        delete userWithPrefix['@id'];

        const newUser = {...oldUserWithPrefix, ...userWithPrefix};

        const response = await fetch(newUser['@id'], {
          method: 'PUT',
          body: JSON.stringify(newUser),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });
        let updatedUser = await fetch(newUser['@id'],{headers: { 'accept': 'application/ld+json' }}).then(response => response.json())
        updatedUser = await jsonld.compact(updatedUser, { '@context': config.contextBody });
        resolve(updatedUser); 
        // resolve(userOld);
      } catch (e) {
        reject(e);
      }
    })
  }

  async updateOneUser(user) {
    return new Promise(async (resolve, reject) => {
      try {
        let data = {
          "@context": {
            "dfc": "https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_FullModel.owl#",
            "ontosec": "http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#"
          },
          "@type": "dfc:Person",
          "ontosec:token": user['ontosec:token'],
          "dfc:email": user['dfc:email']
        }
        if (user['ontosec:idToken']) {
          data['ontosec:idToken'] = user['ontosec:idToken'];
        }

        const response = await fetch(user['@id'], {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: {
            'accept': 'application/ld+json',
            'content-type': 'application/ld+json'
          }
        });
        let location = response.headers.get('location');


        resolve({
          ...user,
          'ontosec:token': user['ontosec:token'],
          'ontosec:idToken': user['ontosec:idToken']
        });
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
            "dfc": "https://github.com/datafoodconsortium/ontology/releases/latest/download/DFC_FullModel.owl#",
            "ontosec": "http://www.semanticweb.org/ontologies/2008/11/OntologySecurity.owl#"
          },
          "@type": "dfc:Person",
          "dfc:email": user['dfc:email'],
          "ontosec:token": user['ontosec:token'],

        }
        if (user['ontosec:idToken']) {
          data['ontosec:idToken'] = user['ontosec:idToken'];
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
