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
      channel: 'supply',
      topic: 'refresh',
      callback: (data) => {
        this.refreshSupply(data);
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
      topic: 'export',
      callback: (data) => {
        this.exportToSource(data.sourceSlug,data.items);
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
    let url = `${url_server}/data/core/catalog/clean`;
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
    let url = `${url_server}/data/core/catalog/importSource?source=${source}`;
    let option = {
      method: 'POST'
    };
    this.util.ajaxCall(url, option).then(data => {
      // console.log('resolve ajaxCall', data);
      alert(name + ' import is completed')
    }).catch(e=>{
      alert(name + ' import has failed')
      alert(e)
    });
  }

  convertImportToSupply(importId, supplyId) {
    let url = `${url_server}/data/core/catalog/import/${importId}/convert/${supplyId==undefined?'':supplyId}`;
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

  exportToSource(sourceSlug, items) {
    let url = `${url_server}/data/core/catalog/exportSource`;
    console.log('EXPORT',sourceSlug, items);
    let option = {
      method: 'POST',
      body: JSON.stringify({
        sourceSlug : sourceSlug,
        data : items
      })
    };
    this.util.ajaxCall(url, option).then(data => {
      // console.log('import converti', data);
      this.publish({
        channel: 'source',
        topic: 'export.done',
        data: data.body
      });
    }).catch(e=>{
      alert(name + ' export has failed')
      alert(e)
    });
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
    let url = `${url_server}/data/core/catalog/import`;
    this.catalogs = [];
    this.catalogsTree = [];
    this.util.ajaxCall(url).then(data => {

      let newRecords = (data.body['@graph']?data.body['@graph']:[data.body]).map(record => {
        // return {
        //   '@id': record['@id'],
        //   'source': record['source']||record.source,
        //   'dfc-b:description': record['dfc-b:references']['dfc-b:description']||record.description,
        //   'dfc-b:quantity': record['dfc-b:quantity']||record.quantity,
        //   'dfc-b:hasUnit': record['dfc-b:hasUnit']||record.hasUnit,
        //   'dfc-t:hostedBy': record['dfc-t:hostedBy']||record.hostedBy,
        // }
        return {...record}
      })
      console.log('newRecords',newRecords);
      this.catalogs = newRecords;
      this.catalogs.sort((a, b) => {
        // console.log(a['dfc:description'],'---',b['dfc:description']);
        let dif = a['dfc-b:references']['dfc-b:description'].localeCompare(b['dfc-b:references']['dfc-b:description']);
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
    let url = `${url_server}/data/core/catalog/import/${id}`;
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
    let url = `${url_server}/data/core/catalog/reconciled`;
    this.catalogs = [];
    this.catalogsTree = [];
    this.util.ajaxCall(url).then(data => {
      // console.log(data);
      if(data.body['@graph']){
        let newRecords = (data.body['@graph']?data.body['@graph']:[data.body]).map(record => {
          return {...record}
        })
        // console.log('newRecords',newRecords);

        this.catalogs = newRecords;


        // console.log('this.catalogs',this.catalogs);
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
    let url = `${url_server}/data/core/catalog/reconciled/${id}`;
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
    console.log('supply',supply);
    supply["dfc-t:hasPivot"]["dfc-t:represent"] = supply["dfc-t:hasPivot"]["dfc-t:represent"].filter(r => r['@id'] != importItem['@id']);
    let url = `${url_server}/data/core/catalog/reconciled/`;
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
    let url = `${url_server}/data/core/catalog/reconciled/`;
    let option = {
      method: 'POST',
      body: JSON.stringify(supply)
    };
    console.log('---------------- SEND UPDATE',supply);
    this.util.ajaxCall(url, option).then(data => {
      this.selectedSupply = data.body;
      // console.log('loadOneSupply',this.selectedSupply);
      console.log('---------------- WELL UPDATE',this.selectedSupply);
      this.publish({
        channel: 'supply',
        topic: 'changeOne',
        data: this.selectedSupply
      });
      alert(this.selectedSupply['@id'] + ' well updated')
    }).catch(e=>{
      alert(supply['@id']  + ' update has failed')
      alert(e)
    })
  }

  refreshSupply(supply) {
    console.log('refreshSupply');
    let url = `${url_server}/data/core/catalog/reconciled/${supply['@id']}/refresh`;
    let option = {
      method: 'POST',
    };
    this.util.ajaxCall(url, option).then(data => {
      console.log('refreshSupply ajax',data);
      if(data.body['@id'] || data.body['@graph']){
        this.selectedSupply = data.body;
        // console.log('ALLO',data.body);
        this.publish({
          channel: 'supply',
          topic: 'changeOne',
          data: this.selectedSupply
        });
      }
    })
  }

}
window.customElements.define('x-service-catalog', Catalog);
