import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

export default class CatalogImport extends GenericElement {
  constructor() {
    super(view);
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
    $(this.shadowRoot.querySelector("#panel")).panel({
      fit: true
    });
    this.gridDom = $(this.shadowRoot.querySelector("#grid"));

    let datagrid = this.gridDom.datagrid({
      fit: true,
      singleSelect:true,
      autoLoad: false,
      onSelect: (id,rowData) => {
        this.selected = rowData.raw
      },
      columns: [
        [{
            field: 'description',
            title: 'description',
            width: 300,
            sortable: true,
          },
          {
            field: 'quantity',
            title: 'quantity',
            width: 100,
            sortable: true
          }, {
            field: 'unit',
            title: 'unit',
            width: 100,
            sortable: true
          },
          {
            field: 'source',
            title: 'source',
            width: 200,
            sortable: true
          },
          // {
          //   field: 'action',
          //   title: 'Action',
          //   width: 80,
          //   align: 'center',
          //   formatter: function(value, row, index) {
          //     return '<a href="./#/x-item-import/' + encodeURIComponent(row['@id'] )+ '">Edit</a> ';
          //   }
          // }
        ]
      ]
    });

    this.publish({
      channel: 'import',
      topic: 'loadAll'
    });

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

    this.shadowRoot.querySelector('#edit').addEventListener('click', e => {
      this.edit();
    })
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
    let dataEasyUi = data.map(d => {
      return {
        id: counter,
        source: d['dfc-t:hostedBy']?d['dfc-t:hostedBy']['rdfs:label']:'',
        unit: d['dfc-b:hasUnit']?d['dfc-b:hasUnit']['rdfs:label']:'',
        raw:d,
        description: d['dfc-b:description'],
        quantity: d['dfc-b:quantity'],
        // unit: d['dfc:hasUnit']['@id'],
        '@id': d['@id']
      }
    })
    // console.log('dataEasyUi', dataEasyUi);
    this.gridDom.datagrid('loadData', dataEasyUi);
  }
}
window.customElements.define('x-catalog-import', CatalogImport);
