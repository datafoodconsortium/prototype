const { LdpService } = require('@semapps/ldp');
const ontologies = require('../ontologies');
const urlJoin = require('url-join');

module.exports = {
  mixins: [LdpService],
  settings: {
    baseUrl: process.env.SEMAPPS_HOME_URL + 'ldp/',
    ontologies,
    containers:[
      'product',
      {
        path: '/catalogItem',
        // acceptedTypes: ['dfc-b:CatalogItem'],
        dereference: ['dfc-b:hasQuantity'],
        // dereference: ['dfc-b:references/dfc-p:hasType','dfc-b:references/dfc-p:hasUnit','dfc-t:hostedBy'],
        // disassembly: [{path:'dfc-b:references',container:process.env.SEMAPPS_HOME_URL + 'ldp/product'}]
      },
      'user',
      'pivot',
      'platform'
    ],
    defaultContainerOptions: {
      jsonContext: urlJoin(process.env.SEMAPPS_HOME_URL, 'context.json'),
      allowAnonymousEdit: true,
      allowAnonymousDelete: true
    }
  }
};
