import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';

import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

export default class ItemSupply extends GenericElement {
  constructor() {
    super(view);

    this.elements = {
      description: this.shadowRoot.querySelector('[name="description"]'),
      unit: this.shadowRoot.querySelector('[name="unit"]'),
      quantity: this.shadowRoot.querySelector('[name="quantity"]'),
      source: this.shadowRoot.querySelector('[name="source"]'),
      id: this.shadowRoot.querySelector('[name="id"]'),
    };

    this.subscribe({
      channel: 'supply',
      topic: 'changeOne',
      callback: (data) => {
        // console.log('supply changeOne',data);
        this.setData(data)
      }
    });

  }
  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.querySelector('#unlink').addEventListener('click', e => {
      this.unlink();
    })
    this.shadowRoot.querySelector('#referer').addEventListener('click', e => {
      this.referer();
    })

    this.gridDom = $(this.shadowRoot.querySelector("#grid"));

    let grid = this.gridDom.datagrid({
      fit: true,
      singleSelect:true,
      autoLoad: false,
      onSelect: (id,rowData) => {
        this.selectedImport = rowData.raw
      },
      columns: [
        [{
            field: 'description',
            title: 'description',
            width: 300
          },
          {
            field: 'quantity',
            title: 'quantity',
            width: 100
          }, {
            field: 'unit',
            title: 'unit',
            width: 100
          },
          {
            field: 'source',
            title: 'source',
            width: 200
          }
        ]
      ]
    });
    // this.publish({
    //   channel: 'supply',
    //   topic: 'loadAll'
    // });

    this.gridDom.datagrid('getPanel').find('.datagrid-header .datagrid-htable').css('height', '');
    this.gridDom.datagrid('getPanel').find('.datagrid-header').css('height', '');
    // this.gridDom.datagrid('resize');

    let injectedStyle = document.createElement('style');
    injectedStyle.appendChild(document.createTextNode(easyuiCss.toString()));
    this.shadowRoot.appendChild(injectedStyle);
    let injectedStyle2 = document.createElement('style');
    injectedStyle2.appendChild(document.createTextNode(easyuiCssIcons.toString()));
    this.shadowRoot.appendChild(injectedStyle2);
    let injectedStyle3 = document.createElement('style');
    injectedStyle3.appendChild(document.createTextNode(easyuiCssColors.toString()));
    this.shadowRoot.appendChild(injectedStyle3);

    let regex = /\#\/x-item-supply\/(.+)\/?/ig;
    // console.log('document.location.hash',document.location.hash);
    let regExec = regex.exec(document.location.hash);
    let id;
    // console.log('regExec',regExec);
    if (regExec != null) {
      id = regExec[1];
    }
    this.publish({
      channel: 'supply',
      topic: 'loadOne',
      data: id
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }

  setDataGrid(data) {
    // console.log('data received Tree', data);
    let counter = 0;
    let dataEasyUi = data.map(d => {
      counter++;
      return {
        id: counter,
        source: d['dfc-t:hostedBy']['rdfs:label'],
        raw:d,
        description: d['dfc-b:description'],
        quantity: d['dfc-b:quantity'],
        unit: d['dfc-b:hasUnit']['rdfs:label'],
        '@id': d['@id']
      }
    })
    // console.log('gridDom', this.gridDom, dataEasyUi);
    this.gridDom.datagrid('loadData', dataEasyUi);
  }

  setData(data) {
    // console.log(data);
    this.item = data
    this.elements.description.textContent = data['dfc-b:description'];
    // this.elements.unit.textContent = data['dfc:hasUnit']['@id'];
    this.elements.quantity.textContent = data['dfc-b:quantity'];
    this.elements.id.textContent = data['@id'];
    this.setDataGrid(data["dfc-t:hasPivot"]["dfc-t:represent"].filter(c=>c['@type']!=undefined))
    this.elements.unit.textContent = data['dfc-b:hasUnit']['rdfs:label'];
    // this.elements.quantity.textContent = data['dfc:quantity'];
    // this.elements.source.textContent = data['source'];
  }

  unlink(){
      this.publish({
        channel: 'supply',
        topic: 'unlink',
        data :{
          supply:this.item,
          import:this.selectedImport,
        }
      });
  }

  referer(){
      if(this.selectedImport!=undefined){
        this.item['dfc-b:description']=this.selectedImport['dfc-b:description'];
        this.item['dfc-b:quantity']=this.selectedImport['dfc-b:quantity'];
        this.item['dfc-b:hasUnit']=this.selectedImport['dfc-b:hasUnit'];
      }

      this.publish({
        channel: 'supply',
        topic: 'update',
        data : this.item
      });
  }
}
window.customElements.define('x-item-supply', ItemSupply);
