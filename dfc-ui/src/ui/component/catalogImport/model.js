import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';

import 'devextreme/integration/jquery';
import TreeList from "devextreme/ui/tree_list";
import dxcss from 'devextreme/dist/css/dx.light.css';

export default class CatalogImport extends GenericElement {
  constructor() {
    super(view);

    this.dxGridDom = this.shadowRoot.querySelector('#dxGrid');

    this.subscribe({
      channel: 'import',
      topic: 'changeAll',
      callback: (data) => {
        this.setDataGrid(data)
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();

    this.publish({
      channel: 'import',
      topic: 'loadAll'
    });

    let injectedStyle4 = document.createElement('style');
    injectedStyle4.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle4);

    const editElement = this.shadowRoot.querySelector('#edit');
    if(editElement){
      this.shadowRoot.querySelector('#edit').addEventListener('click', e => {
      this.edit();
    })}
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }

  edit(){
    this.publish({
      channel: 'main',
      topic: 'navigate',
      data : '/x-item-import/'+encodeURIComponent(this.selected['@id'])
    })
  }

  setDataGrid(data) {
    // let catalogList =this.shadowRoot.getElementById('catalogList');
    console.log('data received', data);

    let counter = 0;
    const dxData = data.map(d => {
      counter++;
      return {
        id: counter,
        name: d['dfc-b:references']['dfc-b:name'],
        description: d['dfc-b:references']['dfc-b:description'],
        quantity: d['dfc-b:references']['dfc-b:hasQuantity']&&d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value'],
        sku: d['dfc-b:sku'],
        stockLimitation : d['dfc-b:stockLimitation'],
        unit: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasQuantity']&&d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']?d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']:'',
        totalTheoriticalStock : d['dfc-b:references']['dfc-b:totalTheoriticalStock'],
        type: d['dfc-b:references']['dfc-p:hasType']?d['dfc-b:references']['dfc-p:hasType']['skos:prefLabel'][0]['@value']:'',
        source: d['dfc-t:hostedBy']?d['dfc-t:hostedBy']['rdfs:label']:'',
        raw :d
      }
    })

    this.dxGrid = new TreeList(this.dxGridDom, {
      "autoExpandAll": true,
      "columns": [
          {
            dataField: 'name',
            caption: 'Name',
            minWidth: 500,
          },
          {
            dataField: 'desription',
            caption: 'Description',
            minWidth: 500,
          },
          "type",
          // "quantity",
          {
            dataField: 'quantity',
            caption: 'Quantity',
            width: 100,
          },
          "unit",
          // "sku",
          // "stockLimitation",
          {
            dataField: 'stockLimitation',
            caption: 'Stock'
          },
          {
              type: "buttons",
              buttons: [{
                  // text: "Edit",
                  // cssClass: "button-dx",
                  // icon : "https://img.icons8.com/windows/32/000000/edit--v1.png",
                  template: function (element, data) {
                    // console.log('ALLO TEMPLATE',data, element);
                    const item = $(`<div class="button-dx"><image src="https://img.icons8.com/windows/32/000000/link--v1.png"/></div>`)
                    element.append(item);
                    // return "edit template"
                  },
                  onClick: (e)=>{
                      console.log(e);
                      this.publish({
                        channel: 'main',
                        topic: 'navigate',
                        data : '/x-item-import/'+encodeURIComponent(e.row.data.raw['@id'])
                      })
                  }
              }]
          }
      ],
      "dataSource": dxData,
      "showRowLines": true
    });
    // this.dxGrid.dataSource= dataEasyUi;
  }
}
window.customElements.define('x-catalog-import', CatalogImport);
