const { LdpService } = require('@semapps/ldp');
const ontologies = require('../ontologies');

module.exports = {
  mixins: [LdpService],
  settings: {
    baseUrl: process.env.SEMAPPS_HOME_URL + 'ldp/',
    ontologies,
    containers:[
      'product',
      {
        path: '/catalogItem',
        acceptedTypes: ['dfc-b:CatalogItem'],
        // dereference: ['dfc-b:references/dfc-p:hasType','dfc-b:references/dfc-p:hasUnit','dfc-t:hostedBy'],
        // dereference: ['dfc-b:references/dfc-p:hasType','dfc-b:references/dfc-p:hasUnit','dfc-t:hostedBy'],
        // disassembly: [{path:'dfc-b:references',container:process.env.SEMAPPS_HOME_URL + 'ldp/product'}]
      },
      'user',
      'pivot',
      'platform'
    ],
    defaultContainerOptions: {
      allowAnonymousEdit: true,
      allowAnonymousDelete: true
    }
  }
};
