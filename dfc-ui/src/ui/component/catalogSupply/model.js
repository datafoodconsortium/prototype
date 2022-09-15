import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import 'devextreme/integration/jquery';
import TreeList from "devextreme/ui/tree_list";
import dxcss from 'devextreme/dist/css/dx.light.css';

export default class CatalogSupply extends GenericElement {
  constructor() {
    super(view);
    this.dxGridDom = this.shadowRoot.querySelector('#dxGrid');
    this.elements = {
      descriptionSearch: this.shadowRoot.querySelector('[name="descriptionSearch"]'),
    };

    this.subscribe({
      channel: 'supply',
      topic: 'changeAll',
      callback: (data) => {
        this.rawSupplies = data;
        this.setDataGrid(data)
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();

    this.publish({
      channel: 'supply',
      topic: 'loadAll'
    });

    let injectedStyle4 = document.createElement('style');
    injectedStyle4.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle4);

    this.shadowRoot.querySelector('#filter').addEventListener('click', e => {
      this.filter(this.elements.descriptionSearch.value);
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }

  normalize(value) {
    // return value
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  }

  filter(value) {
    let filteredData = this.rawSupplies.filter(record => {
      return this.normalize(record['dfc-b:references']['dfc-b:description'].toUpperCase()).includes(this.normalize(value.toUpperCase()));
    })
    this.setDataGrid(filteredData)
  }


  setDataGrid(data) {
    console.log('setDataGrid',data);

    let counter = 0;
    let dxData = data.map(d => {
      counter++;
      let type = d['dfc-b:references']&&d['dfc-b:references']['dfc-p:hasType'];
      if(type&&!Array.isArray(type)){
        type=[type];
      }
      return {
        id: counter,
        description: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:description'],
        source: d['dfc-t:hostedBy']['rdfs:label'],
        sku: d['dfc-b:sku'],
        stockLimitation : d['dfc-b:stockLimitation'],
        totalTheoriticalStock : d['dfc-b:references']&&d['dfc-b:references']['dfc-b:totalTheoriticalStock'],
        quantity: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value'],
        unit: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasQuantity']?d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']:'',
        type: type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'',
        children:d['dfc-t:hasPivot']['dfc-t:represent'],
        raw: d,
      }
    })

    const dxDataChildren =[];
    dxData.forEach((d, i) => {
      console.log(d);
      if (d.children){
        let children = d.children;
        if(!Array.isArray(children)){
          children=[children];
        }
        children.forEach((c, i) => {
          counter++;
          let type = c['dfc-b:references']&&c['dfc-b:references']['dfc-p:hasType'];
          if(type&&!Array.isArray(type)){
            type=[type];
          }
          dxDataChildren.push({
            id: counter,
            parentId:d.id,
            source: c['dfc-t:hostedBy']?c['dfc-t:hostedBy']['rdfs:label']:'',
            sku: c['dfc-b:sku'],
            stockLimitation : c['dfc-b:stockLimitation'],
            totalTheoriticalStock : c['dfc-b:references']&&c['dfc-b:references']['dfc-b:totalTheoriticalStock'],
            description: c['dfc-b:references']&&c['dfc-b:references']['dfc-b:description'],
            quantity: c['dfc-b:references']&&c['dfc-b:references']['dfc-b:hasQuantity']?c['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value']:'',
            unit: c['dfc-b:references']&&c['dfc-b:references']['dfc-b:hasQuantity']?c['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']:'',
            type: type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'',
            raw: c,
            parent: d,
          })
        });
      }
    });

    dxData=[...dxData,...dxDataChildren];


    this.dxGrid = new TreeList(this.dxGridDom, {
      "autoExpandAll": true,
      "columns": [
          {
            dataField: 'description',
            caption: 'description',
            minWidth: 400,
          },
          "quantity",
          "unit",
          "sku",
          "stockLimitation",
          "totalTheoriticalStock",
          "type",
          "source",
          {
              type: "buttons",
              buttons: [{
                  // text: "Edit",
                  // cssClass: "button-dx",
                  // icon : "https://img.icons8.com/windows/32/000000/edit--v1.png",
                  template: function (element, data) {
                    const raw = data.data.raw;
                    let hostedBy = raw['dfc-t:hostedBy']['@id']||raw['dfc-t:hostedBy'];
                    if (hostedBy.endsWith('dfc')){
                      const item = $(`<div class="button-dx"><image src="https://img.icons8.com/ios/32/000000/edit-link.png"/></div>`)
                      element.append(item);
                    }else {
                      const item = $(`<div class="button-dx"><image src="https://img.icons8.com/windows/32/000000/edit--v1.png"/></div>`)
                      element.append(item);
                    }
                    // return "edit template"
                  },
                  onClick: (e)=>{
                      const raw = e.row.data.raw;
                      let hostedBy = raw['dfc-t:hostedBy']['@id']||raw['dfc-t:hostedBy'];
                      if (hostedBy.endsWith('dfc')){
                        this.publish({
                          channel: 'main',
                          topic: 'navigate',
                          data: '/x-item-supply/' + encodeURIComponent(raw['@id'])
                        })
                      } else {
                        this.publish({
                          channel: 'main',
                          topic: 'navigate',
                          data: '/x-item-supply-platform/' + encodeURIComponent(raw['@id'])
                        })
                      }
                  }
              }]
          }
      ],
      "dataSource": dxData,
      "showRowLines": true
    });
  }
}
window.customElements.define('x-catalog-supply', CatalogSupply);
