[![SemApps](https://badgen.net/badge/Powered%20by/SemApps/28CDFB)](https://semapps.org)

# my-project
This is a [SemApps](https://semapps.org/)-based semantic application

## Quick start

### Launch your local Jena Fuseki instance

Jena Fuseki is a semantic triple store. It is where your app's data will be stored.

You need [docker](https://docs.docker.com/install/) and [docker-compose](https://docs.docker.com/compose/install/) installed on your machine.

```bash
$ docker-compose up
```

Jena Fuseki is now available at the URL http://localhost:3030

Please start by creating a `localData` dataset. This is where your triples will go.

### Run Moleculer in dev mode

```bash
$ npm run dev
```

Your instance of SemApps is available at http://localhost:3030

## Testing the LDP server

Post an ActivityStreams Note to `/ldp/as:Note` LDP container:

```
POST /ldp/as:Note HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: */*
Content-Length: 97

{
 "@context": "https://www.w3.org/ns/activitystreams",
 "type": "Note",
 "name": "Hello World"
}
```

Retrieve the `/ldp/as:Note` LDP container:

```
GET /ldp/as:Note HTTP/1.1
Host: localhost:3000
Accept: application/ld+json
```

You should get this result:

```json
{
  "@context": {
    "ldp": "http://www.w3.org/ns/ldp#",
    "as": "https://www.w3.org/ns/activitystreams#"
  },
  "@id": "http://localhost:3000/ldp/as:Note",
  "@type": [
    "ldp:Container",
    "ldp:BasicContainer"
  ],
  "ldp:contains": [
    {
      "@id": "http://localhost:3000/ldp/as:Note/db78b000",
      "@type": "as:Note",
      "as:name": "Hello World"
    }
  ]
}
```

## Useful links

* SemApps website: https://semapps.org/
* SemApps github: https://github.com/assemblee-virtuelle/semapps

## NPM scripts

- `npm run dev`: Start development mode (with hot-reload & REPL)
- `npm run start`: Start production mode
