module.exports = {
  "mongoConnection": "mongodb://mongodb:27017",
  "sources": [{
    "name": "cagette",
    "url": "https://app.cagette.net/api/pro/dfc/V1.2/catalog/1326",
    "version": "1.2"
  }, {
    "name": "panier local",
    "url": "https://www.circuitouvert.fr/api/dfc/entreprise",
    "version": "1.2"
  }, {
    "name": "la ruche qui dit oui",
    "url": "https://api.thefoodassembly.com/dfc/catalog/21518",
    "version": "1.1"
  }, {
    "name": "Open Food Fact",
    "url": "https://grappe.io/data/api/5e3d67de8d4440002a74d390-OFF-DFC-Producer",
    "version": "1.2",
    "options": [{
      "label": "Brands / Packager-Code",
      "param": "producer",
      "info": "si vous disposez de produit referencés sur Open FoodFact, vous devriez avoir la marque ('brands') ou votre code emaballeur/estampille sanitaire ('packager-code') de renseigné sur ces produits."
    }]
  }],
  "express": {
    "session_secret": "4751c8b3-3a15-4ba9-8186-94c0fd330f30"
  },
  "OIDC": {
    "lesCommuns": {
      "issuer": "https://login.lescommuns.org/auth/realms/master/",
      "client_id": "4461746120466f6f6420436f6e736f727469756d",
      "client_id_comment": "Data Food Consoritum in Hex",
      "client_secret": "4751c8b3-3a15-4ba9-8186-94c0fd330f30",
      "redirect_uri": "http://localhost:8080/login/auth/cb",
      "public_key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnL0KaRkAKtWcc0TnwtlNVQ58PsB8guPirh1OCnNUqr71q3zyAqh5t6oWIRCTS5eqr2zhb/Je3QOeX2l0tGZ2YVQIBhvIGHcYfpMvrT+Loqsh3rHYiRLXs+YvUIM0tyWeQlpDMeqQ/t1G61FcF+HsiOBRvhaho7e+cV1hO1QvzcoxeMleexPdK+dnL4qHGKELf1oZmvFKcUAHG8IOcoxJn3KYdJsEbRj3jTAliTCXxGXmY++0c48pSV2iaOhxxlgR4AZTH+fSveAosGSPSYDYL9xVCyrRHFRgkHlIcw61hF6YyEE5G5b4MEumafBiLKZ9HJfjAhZv3kcD72nTGgJrMQIDAQAB"
    }
  }
}
