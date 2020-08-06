import Navigo from 'navigo';
import GenericElement from '../core/genericElement.js';
// import config from '../../configuration.json';
import Util from './util.js'
export default class Catalog extends GenericElement {
  constructor() {
    super();
    this.util = new Util();
    this.subscribe({
      channel: 'supply',
      topic: 'loadAll',
      callback: (data) => {
        this.loadAllSupply();
      }
    });
    this.subscribe({
      channel: 'supply',
      topic: 'loadOne',
      callback: (data) => {
        this.loadOneSupply(data);
      }
    });

    this.subscribe({
      channel: 'supply',
      topic: 'unlink',
      callback: (data) => {
        this.unlinkSupply(data.supply, data.import);
      }
    });

    this.subscribe({
      channel: 'supply',
      topic: 'update',
      callback: (data) => {
        this.updateSupply(data);
      }
    });

    this.subscribe({
      channel: 'import',
      topic: 'convert',
      callback: (data) => {
        this.convertImportToSupply(data.importId, data.supplyId);
      }
    });

    this.subscribe({
      channel: 'import',
      topic: 'loadAll',
      callback: (data) => {
        this.loadAllImport();
      }
    });
    this.subscribe({
      channel: 'import',
      topic: 'loadOne',
      callback: (data) => {
        this.loadOneImport(data);
      }
    });
    this.subscribe({
      channel: 'source',
      topic: 'getAll',
      callback: (data) => {
        this.getSources();
      }
    });

    this.subscribe({
      channel: 'source',
      topic: 'importOne',
      callback: (data) => {
        this.importOne(data.source,data.name);
      }
    });

    this.subscribe({
      channel: 'source',
      topic: 'clean',
      callback: (data) => {
        this.cleanAll();
      }
    });
  }

  cleanAll(source) {
    let url = `${url_server}/data/core/clean`;
    let option = {
      method: 'POST'
    };
    this.util.ajaxCall(url, option).then(data => {
      console.log('resolve ajaxCall', data);
      this.publish({
        channel: 'main',
        topic: 'navigate',
        data : '/x-catalog-supply'
      });
    })
  }

  importOne(source,name) {
    // let sourceObject = config.sources.filter(so => so.name == source)[0];
    // console.log('importOne',sourceObject);
    let url = `${url_server}/data/core/import/importSource?source=${source}`;
    let option = {
      method: 'POST'
    };
    this.util.ajaxCall(url, option).then(data => {
      // console.log('resolve ajaxCall', data);
      alert(name + ' bien importé')
    }).catch(e=>{
      alert(e)
    });
  }

  convertImportToSupply(importId, supplyId) {
    let url = `${url_server}/data/core/import/${importId}/convert/${supplyId==undefined?'':supplyId}`;
    let option = {
      method: 'POST'
    };
    this.util.ajaxCall(url, option).then(data => {
      // console.log('import converti', data);
      this.publish({
        channel: 'import',
        topic: 'convert.done',
        data: data.body
      });
    })
  }

  async getSources() {
    // console.log('getSources',this.util);
    let config = await this.util.getConfig();
    this.publish({
      channel: 'source',
      topic: 'changeAll',
      data: config.sources,
    });
  }
  loadAllImport() {
    let url = `${url_server}/data/core/import`;
    this.catalogs = [];
    this.catalogsTree = [];
    this.util.ajaxCall(url).then(data => {

      let newRecords = (data.body['@graph']?data.body['@graph']:[]).map(record => {
        return {
          '@id': record['@id'],
          'source': record['source']||record.source,
          'dfc:description': record['dfc:description']||record.description,
          'dfc:quantity': record['dfc:quantity']||record.quantity,
          // 'dfc:hasUnit': {
          //   '@id': record['dfc:hasUnit']['@id']
          // },
          'dfc:hostedBy': record['dfc:hostedBy']||record.hostedBy,
        }
      })
      console.log('newRecords',newRecords);
      this.catalogs = newRecords;
      this.catalogs.sort((a, b) => {
        // console.log(a['dfc:description'],'---',b['dfc:description']);
        let dif = a['dfc:description'].localeCompare(b['dfc:description']);
        // console.log(dif);
        return dif;
      });

      this.publish({
        channel: 'import',
        topic: 'changeAll',
        data: this.catalogs
      });

    })
  }

  loadOneImport(id) {
    let url = `${url_server}/data/core/import/${id}`;
    this.util.ajaxCall(url).then(data => {
      this.selectedImport = data.body;
      // console.log('loadOneImport', this.selectedImport);
      this.publish({
        channel: 'import',
        topic: 'changeOne',
        data: this.selectedImport
      });
    })
  }



  loadAllSupply() {
    let url = `${url_server}/data/core/supply`;
    this.catalogs = [];
    this.catalogsTree = [];
    this.util.ajaxCall(url).then(data => {
      console.log(data);
      if(data.body['@graph']){
        let newRecords = data.body['@graph'].map(record => {
          return {
            '@id': record['@id'],
            'imports': record['imports'],
            'dfc:description': record['dfc:description'],
            'dfc:hasPivot': record['dfc:hasPivot'],
            'dfc:hostedBy': record['dfc:hostedBy'],

          }
        })
        // console.log(newRecords);

        this.catalogs = newRecords;
        this.catalogs.sort((a, b) => {
          let dif = a['dfc:description'].localeCompare(b['dfc:description']);
          // console.log(dif);
          return dif;
        });

        // console.log('this.catalogsTree',this.catalogsTree);
        this.publish({
          channel: 'supply',
          topic: 'changeAll',
          data: this.catalogs
        });
      }else{
        this.publish({
          channel: 'supply',
          topic: 'changeAll',
          data: []
        });
      }

    })
  }

  loadOneSupply(id) {
    let url = `${url_server}/data/core/supply/${id}`;
    this.util.ajaxCall(url).then(data => {
      this.selectedSupply = data.body;
      // console.log('loadOneSupply',this.selectedSupply);
      this.publish({
        channel: 'supply',
        topic: 'changeOne',
        data: this.selectedSupply
      });
    })
  }

  unlinkSupply(supply, importItem) {
    supply["dfc:hasPivot"]["dfc:represent"] = supply["dfc:hasPivot"]["dfc:represent"].filter(r => r['@id'] != importItem['@id']);
    let url = `${url_server}/data/core/supply/`;
    let option = {
      method: 'POST',
      body: JSON.stringify(supply)
    };
    this.util.ajaxCall(url, option).then(data => {
      this.selectedSupply = data.body;
      // console.log('loadOneSupply',this.selectedSupply);
      this.publish({
        channel: 'supply',
        topic: 'changeOne',
        data: this.selectedSupply
      });
    })
  }

  updateSupply(supply) {
    let url = `${url_server}/data/core/supply/`;
    let option = {
      method: 'POST',
      body: JSON.stringify(supply)
    };
    this.util.ajaxCall(url, option).then(data => {
      this.selectedSupply = data.body;
      // console.log('loadOneSupply',this.selectedSupply);
      this.publish({
        channel: 'supply',
        topic: 'changeOne',
        data: this.selectedSupply
      });
    })
  }

}
window.customElements.define('x-service-catalog', Catalog);
