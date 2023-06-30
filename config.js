module.exports = {
  "mongoConnection": "mongodb://mongodb:27017",
  "appUrl": "https://localhost:8080",
  "data": {
    "units": [
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#Piece",
        "rdfs:label": "unité"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#piece",
        "rdfs:label": "unité"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#Kilogram",
        "rdfs:label": "kilogramme"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#kilogram",
        "rdfs:label": "kilogramme"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#KG",
        "rdfs:label": "kilogramme"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#Gram",
        "rdfs:label": "gramme"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#G",
        "rdfs:label": "gramme"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#U",
        "rdfs:label": "unité"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#Unit",
        "rdfs:label": "unité"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#gram",
        "rdfs:label": "gramme"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#unit",
        "rdfs:label": "unité"
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#kg",
        "rdfs:label": "kilogramme",
        "official": true
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#u",
        "rdfs:label": "unité",
        "official": true
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#g",
        "rdfs:label": "gramme",
        "official": true
      },
      {
        "@id": "http://static.datafoodconsortium.org/data/units.rdf#l",
        "rdfs:label": "litre",
        "official": true
      }
    ]
  },
  "sources": [{
    "name": "cagette",
    "slug": "cagette",
    "url": "https://app.cagette.net/api/pro/dfc/V1.2/catalog/1326",
    "version": "1.2"
  },
  {
    "name": "OFN FR staging",
    "slug": "ofn",
    "url": "https://staging.coopcircuits.fr/api/dfc-v1.6/enterprises/default/catalog_items.json",
    "version": "1.6",
    "supporWrite": "true"
  },
  {
    "name": "OFN UK Staging",
    "slug": "ofn-uk",
    "url": "https://staging.openfoodnetwork.org.uk/api/dfc-v1.6/enterprises/default/catalog_items.json",
    "version": "1.6",
    "supporWrite": "true"
  },
  {
    "name": "Elzeard",
    "slug": "elzeard",
    "url": "https://dfc.dev.elzeard.co/api/dfc/catalog",
    "version": "1.7"
  },
  {
    "name": "Socleo",
    "slug": "socleo",
    "url": "https://demo.socleo.org/api/dfc/person/",
    "urlExportSuppliedProduct": "https://demo.socleo.org/api/dfc/suppliedProduct/",
    "urlExportCatalogItem": "https://demo.socleo.org/api/dfc/catalogItem/",
    "version": "1.7",
    "supporWrite": "true"
  }, {
    "name": "la ruche qui dit oui",
    "slug": "la-ruche-qui-dit-oui",
    "url": "https://api.thefoodassembly.com/dfc/catalog/21518",
    "version": "1.1"
  }, {
    "name": "Open Food Fact",
    "slug": "open-food-fact",
    "url": "https://grappe.io/data/api/5e3d67de8d4440002a74d390-OFF-DFC-Producer",
    "version": "1.2",
    "options": [
      {
        "label": "Brands / Packager-Code",
        "param": "producer",
        "info": "si vous disposez de produit referencés sur Open FoodFact, vous devriez avoir la marque ('brands') ou votre code emaballeur/estampille sanitaire ('packager-code') de renseigné sur ces produits."
      }
    ]
  },
  {
    "name": "test v1.5",
    "slug": "test_v1-5",
    "url": "http://static.datafoodconsortium.org/businessAPI/user_1_5.json",
    "version": "1.5"
  },
  {
    "name": "test v1.6.1",
    "slug": "test_v1-6",
    "url": "http://static.datafoodconsortium.org/businessAPI/user_1_6.json",
    "version": "1.6"
  },
  {
    "name": "test v1.6.2",
    "slug": "test_v1-6",
    "url": "http://static.datafoodconsortium.org/businessAPI/user_1_6_2.json",
    "version": "1.6"
  },
  {
    "name": "test v1.7",
    "slug": "test_v1-7",
    "url": "http://static.datafoodconsortium.org/businessAPI/user_1_7.json",
    "version": "1.7"
  },
  {
    "name": "test v1.7.2",
    "slug": "test_v1-7-2",
    "url": "https://github.com/datafoodconsortium/business-api/releases/download/v1.7.2/user.json",
    "version": "1.7"
  },
  {
    "name": "test v1.7 flat blanck socleo",
    "slug": "test_v1-7_flat_blanck_socleo",
    "url": "http://static.datafoodconsortium.org/businessAPI/user_1_7_flatblanck.json",
    "version": "1.7"
  },
  {
    "name": "Garethe v1.6",
    "slug": "garethe_v1-6",
    "url": "https://raggedstaff.github.io/data/en_user_1_6.json",
    "version": "1.6"
  },
  {
    "name": "lecoqlibreTest1_6",
    "slug": "lecoqlibretest1_6",
    "url": "https://dfc.lecoqlibre.fr/1.6/",
    "version": "1.6"
  },
  {
    "name": "lecoqlibre",
    "slug": "lecoqlibre",
    "url": "https://dfc.lecoqlibre.fr/api/dfc/person/617434aeda56d67eb07d1198",
    "version": "1.5",
    "supporWrite": "true"
  },
  {
    "name": "shopify",
    "slug": "shopify",
    "url": "https://0f44-92-18-223-75.eu.ngrok.io/api/products",
    "urlExportSuppliedProduct": "https://0f44-92-18-223-75.eu.ngrok.io/api/products",
    "version": "1.7",
    "supporWrite": "true"
  }
  ],
  "context": "https://github.com/datafoodconsortium/ontology/releases/latest/download/context.json",
  "express": {
    "session_secret": "4751c8b3-3a15-4ba9-8186-94c0fd330f30"
  },
  "OIDC": {
    "lesCommuns": {
      "issuer": "https://login.lescommuns.org/auth/realms/data-food-consortium/",
      "client_id": "proto-dfc",
      "client_secret": "0ed79cdb-81fb-4ae1-b77d-2a61f010a4f7",
      "redirect_uri": "http://localhost:8080/login/auth/cb",
      "public_key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAl68JGqAILFzoi/1+6siXXp2vylu+7mPjYKjKelTtHFYXWVkbmVptCsamHlY3jRhqSQYe6M1SKfw8D+uXrrWsWficYvpdlV44Vm7uETZOr1/XBOjpWOi1vLmBVtX6jFeqN1BxfE1PxLROAiGn+MeMg90AJKShD2c5RoNv26e20dgPhshRVFPUGru+0T1RoKyIa64z/qcTcTVD2V7KX+ANMweRODdoPAzQFGGjTnL1uUqIdUwSfHSpXYnKxXOsnPC3Mowkv8UIGWWDxS/yzhWc7sOk1NmC7pb+Cg7G8NKj+Pp9qQZnXF39Dg95ZsxJrl6fyPFvTo3zf9CPG/fUM1CkkwIDAQAB"
    }
  }
}
