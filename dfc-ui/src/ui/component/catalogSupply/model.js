import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

export default class CatalogSupply extends GenericElement {
  constructor() {
    super(view);

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
    $(this.shadowRoot.querySelector("#panel")).panel({
      fit: true
    });

    this.gridDomTree = $(this.shadowRoot.querySelector("#treeGrid"));

    let treegrid = this.gridDomTree.treegrid({
      fit: true,
      autoLoad: false,
      idField: 'id',
      treeField: 'description',
      onSelect: (rowData) => {
        this.selectedSupply = rowData.raw
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
            field: 'type',
            title: 'type',
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
    // this.gridDom.datagrid('loadData', dataEasyUi);
    // console.warn('ALLO');

    this.publish({
      channel: 'supply',
      topic: 'loadAll'
    });

    this.gridDomTree.datagrid('getPanel').find('.datagrid-header .datagrid-htable').css('height', '');
    this.gridDomTree.datagrid('getPanel').find('.datagrid-header').css('height', '');
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

    this.shadowRoot.querySelector('#edit').addEventListener('click', e => {
      this.edit();
    })

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

  edit() {
    // console.log(this.selectedSupply);
    this.publish({
      channel: 'main',
      topic: 'navigate',
      data: '/x-item-supply/' + encodeURIComponent(this.selectedSupply['@id'])
    })
  }

  normalize(value) {
    // return value
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
  }

  filter(value) {
    let filteredData = this.rawSupplies.filter(record => {
      return this.normalize(record['dfc-b:description'].toUpperCase()).includes(this.normalize(value.toUpperCase()));
    })
    this.setDataGrid(filteredData)
  }


  setDataGrid(data) {
    console.log('setDataGrid',data);
    let counter = 0;
    let dataEasyUi = data.map(d => {
      counter++;
      console.log(d);
      return {
        id: counter,
        description: d['dfc-b:references']['dfc-b:description'],
        source: d['dfc-t:hostedBy']['rdfs:label'],
        quantity: d['dfc-b:references']['dfc-b:quantity'],
        unit: d['dfc-b:references']['dfc-p:hasUnit']['rdfs:label'],
        type: d['dfc-b:references']['dfc-p:hasType']['rdfs:label'],
        raw: d,
        children: d['dfc-t:hasPivot']['dfc-t:represent'].filter(c=>c['@type']!=undefined).map(c => {
          counter++;
          return {
            id: counter,
            source: c['dfc-t:hostedBy']['rdfs:label'],
            raw: d,
            description: c['dfc-b:references']['dfc-b:description'],
            quantity: c['dfc-b:references']['dfc-b:quantity'],
            unit: c['dfc-b:references']['dfc-p:hasUnit']['rdfs:label'],
            type: c['dfc-b:references']['dfc-p:hasType']['rdfs:label'],
          }
        })
      }
    })
    this.gridDomTree.treegrid('loadData', dataEasyUi);
  }
}
window.customElements.define('x-catalog-supply', CatalogSupply);
