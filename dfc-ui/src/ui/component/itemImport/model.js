import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';

// import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
// import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
// import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
// import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

import 'devextreme/integration/jquery';
import TreeList from "devextreme/ui/tree_list";
import dxcss from 'devextreme/dist/css/dx.light.css';


export default class ItemImport extends GenericElement {
  constructor() {
    super(view);
    this.dxGridDom = this.shadowRoot.querySelector('#dxGrid');
    this.elements = {
      description: this.shadowRoot.querySelector('[name="description"]'),
      unit: this.shadowRoot.querySelector('[name="unit"]'),
      type: this.shadowRoot.querySelector('[name="type"]'),
      quantity: this.shadowRoot.querySelector('[name="quantity"]'),
      source: this.shadowRoot.querySelector('[name="source"]'),
      sku: this.shadowRoot.querySelector('[name="sku"]'),
      stockLimitation: this.shadowRoot.querySelector('[name="stockLimitation"]'),
      totalTheoriticalStock: this.shadowRoot.querySelector('[name="totalTheoriticalStock"]'),
      descriptionSearch: this.shadowRoot.querySelector('[name="descriptionSearch"]'),
      id: this.shadowRoot.querySelector('[name="id"]'),
    };

    this.subscribe({
      channel: 'import',
      topic: 'changeOne',
      callback: (data) => {
        this.setData(data)
      }
    });

    this.subscribe({
      channel: 'supply',
      topic: 'changeAll',
      callback: (data) => {
        this.setDataGrid(data)
        this.rawSupplies=data;
      }
    });
    this.subscribe({
      channel: 'import',
      topic: 'convert.done',
      callback: (data) => {
        this.publish({
          channel: 'main',
          topic: 'navigate',
          data: '/x-catalog-supply'
        })
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();
    // this.shadowRoot.querySelector('#link').addEventListener('click', e => {
    //   this.consolidate();
    // })
    this.shadowRoot.querySelector('#linkEmpty').addEventListener('click', e => {
      this.consolidate(true);
    })
    this.shadowRoot.querySelector('#filter').addEventListener('click', e => {
      this.filter(this.elements.descriptionSearch.value);
    })
    //
    // this.gridDomTree = $(this.shadowRoot.querySelector("#treeGrid"));
    //
    // let treegrid = this.gridDomTree.treegrid({
    //   fit: true,
    //   autoLoad: false,
    //   idField: 'id',
    //   treeField: 'description',
    //   onSelect: (rowData) => {
    //     this.selectedSupply = rowData.raw
    //   },
    //   columns: [
    //     [{
    //         field: 'description',
    //         title: 'description',
    //         width: 300
    //       },
    //       {
    //         field: 'quantity',
    //         title: 'quantity',
    //         width: 100
    //       },
    //       {
    //         field: 'sku',
    //         title: 'sku',
    //         width: 100
    //       },
    //       {
    //         field: 'stockLimitation',
    //         title: 'stock limitation (catalog)',
    //         width: 100
    //       },
    //       {
    //         field: 'totalTheoriticalStock',
    //         title: 'total theoritical stock (supply)',
    //         width: 100
    //       },
    //       {
    //         field: 'quantity',
    //         title: 'quantity',
    //         width: 100
    //       },
    //       {
    //         field: 'unit',
    //         title: 'unit',
    //         width: 100
    //       },
    //       {
    //         field: 'type',
    //         title: 'type',
    //         width: 100
    //       },
    //       {
    //         field: 'source',
    //         title: 'source',
    //         width: 200
    //       }
    //     ]
    //   ]
    // });
    this.publish({
      channel: 'supply',
      topic: 'loadAll'
    });
    //
    // this.gridDomTree.datagrid('getPanel').find('.datagrid-header .datagrid-htable').css('height', '');
    // this.gridDomTree.datagrid('getPanel').find('.datagrid-header').css('height', '');
    // // this.gridDom.datagrid('resize');
    //
    // let injectedStyle = document.createElement('style');
    // injectedStyle.appendChild(document.createTextNode(easyuiCss.toString()));
    // this.shadowRoot.appendChild(injectedStyle);
    // let injectedStyle2 = document.createElement('style');
    // injectedStyle2.appendChild(document.createTextNode(easyuiCssIcons.toString()));
    // this.shadowRoot.appendChild(injectedStyle2);
    // let injectedStyle3 = document.createElement('style');
    // injectedStyle3.appendChild(document.createTextNode(easyuiCssColors.toString()));
    // this.shadowRoot.appendChild(injectedStyle3);

    let regex = /\#\/x-item-import\/(.+)\/?/ig;
    // console.log('document.location.hash',document.location.hash);
    let regExec = regex.exec(document.location.hash);
    let id;
    // console.log('regExec',regExec);
    if (regExec != null) {
      id = regExec[1];
    }
    this.publish({
      channel: 'import',
      topic: 'loadOne',
      data: id
    });

    let injectedStyle4 = document.createElement('style');
    injectedStyle4.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle4);
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

  filter(value){
    let filteredData = this.rawSupplies.filter(record=>{
      return this.normalize(record['dfc-b:references']['dfc-b:description'].toUpperCase()).includes(this.normalize(value.toUpperCase()));
    })
    this.setDataGrid(filteredData)
  }

  setDataGrid(data) {
    // let counter = 0;
    // let dataEasyUi = data.map(d => {
    //   counter++;
    //   // console.log(d);
    //   let type = d['dfc-b:references']&&d['dfc-b:references']['dfc-p:hasType'];
    //   if(type&&!Array.isArray(type)){
    //     type=[type];
    //   }
    //   return {
    //     id: counter,
    //     source: d['dfc-t:hostedBy']['rdfs:label'],
    //     raw:d,
    //     description: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:description'],
    //     quantity: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:quantity'],
    //     unit: d['dfc-b:references']&&d['dfc-b:references']['dfc-p:hasUnit']?d['dfc-b:references']['dfc-p:hasUnit']['rdfs:label']:'',
    //     type: type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'',
    //     sku: d['dfc-b:sku'],
    //     stockLimitation: d['dfc-b:stockLimitation'],
    //     totalTheoriticalStock: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:totalTheoriticalStock'],
    //     // 'id': d['@id'],
    //     children: d['dfc-t:hasPivot']['dfc-t:represent'].filter(c=>c['@type']!=undefined).map(c => {
    //       counter++;
    //       return {
    //         id: counter,
    //         raw: {DFCid:d['@id'],...c},
    //         source: c['dfc-t:hostedBy']['rdfs:label'],
    //         sku: c['dfc-b:sku'],
    //         stockLimitation : c['dfc-b:stockLimitation'],
    //         totalTheoriticalStock : c['dfc-b:references']&&c['dfc-b:references']['dfc-b:totalTheoriticalStock'],
    //         description: c['dfc-b:references']&& c['dfc-b:references']['dfc-b:description'],
    //         quantity: c['dfc-b:references']&&c['dfc-b:references']['dfc-b:quantity'],
    //         unit: c['dfc-b:references']&&c['dfc-b:references']['dfc-p:hasUnit']?c['dfc-b:references']['dfc-p:hasUnit']['rdfs:label']:'',
    //         type: c['dfc-b:references']&&c['dfc-b:references']['dfc-p:hasType']?c['dfc-b:references']['dfc-p:hasType']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']:'',
    //
    //       }
    //     })
    //   }
    // })
    // this.gridDomTree.treegrid('loadData', dataEasyUi);


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
        quantity: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:quantity'],
        unit: d['dfc-b:references']&&d['dfc-b:references']['dfc-p:hasUnit']?d['dfc-b:references']['dfc-p:hasUnit']['rdfs:label']:'',
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
            quantity: c['dfc-b:references']&&c['dfc-b:references']['dfc-b:quantity'],
            unit: c['dfc-b:references']&&c['dfc-b:references']['dfc-p:hasUnit']?c['dfc-b:references']['dfc-p:hasUnit']['rdfs:label']:'',
            type: type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'',
            raw: c,
            parent: d,
          })
        });
      }
    });

    dxData=[...dxData,...dxDataChildren];


    this.dxGrid = new TreeList(this.dxGridDom, {
      "autoExpandAll": false,
      "columns": [
          {
            dataField: 'description',
            caption: 'Name',
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
                      const item = $(`<div class="button-dx"><image src="https://img.icons8.com/windows/32/000000/link--v1.png"/></div>`)
                      element.append(item);
                    }else {
                      // const item = $(`<div class="button-dx"><image src="https://img.icons8.com/windows/32/000000/edit--v1.png"/></div>`)
                      // element.append(item);
                    }
                    // return "edit template"
                  },
                  onClick: (e)=>{
                      const raw = e.row.data.raw;
                      // let hostedBy = raw['dfc-t:hostedBy']['@id']||raw['dfc-t:hostedBy'];
                      this.selectedSupply=raw;
                      this.consolidate();
                      // if (hostedBy.endsWith('dfc')){
                      //   this.publish({
                      //     channel: 'main',
                      //     topic: 'navigate',
                      //     data: '/x-item-supply/' + encodeURIComponent(raw['@id'])
                      //   })
                      // } else {
                      //   this.publish({
                      //     channel: 'main',
                      //     topic: 'navigate',
                      //     data: '/x-item-supply-platform/' + encodeURIComponent(raw['@id'])
                      //   })
                      // }
                  }
              }]
          }
      ],
      "dataSource": dxData,
      "showRowLines": true
    });

  }

  setData(data) {
    console.log('setData',data);
    this.item = data
    this.elements.description.textContent = data['dfc-b:references']['dfc-b:description'];
    this.elements.unit.textContent = data['dfc-b:references']['dfc-p:hasUnit']?data['dfc-b:references']['dfc-p:hasUnit']['rdfs:label']:'';
    this.elements.type.textContent = data['dfc-b:references']&&data['dfc-b:references']['dfc-p:hasType']?data['dfc-b:references']['dfc-p:hasType']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']:'';
    this.elements.quantity.textContent = data['dfc-b:references']['dfc-b:quantity'];
    this.elements.source.textContent = data['dfc-t:hostedBy']['rdfs:label'];
    this.elements.stockLimitation.textContent = data['dfc-b:stockLimitation'];
    this.elements.totalTheoriticalStock.textContent = data['dfc-b:references']['dfc-b:totalTheoriticalStock'];
    this.elements.sku.textContent = data['dfc-b:sku'];
    this.elements.id.textContent = data['@id'];
    // this.elements.descriptionSearch.value = data['dfc-b:references']['dfc-b:description'];
  }

  consolidate(newSupply) {
    let supplyId;
    // console.log('this.selectedSupply',newSupply,this.selectedSupply);
    if(newSupply!==true){
      if (this.selectedSupply.DFCid != undefined) {
        supplyId = this.selectedSupply.DFCid;
      } else {
        supplyId = this.selectedSupply['@id'];
      }
    }

    // console.log('consolidate',this.item['@id'],supplyId);
    this.publish({
      channel: 'import',
      topic: 'convert',
      data :{
        importId:this.item['@id'],
        supplyId:supplyId,
      }
    });
  }
}
window.customElements.define('x-item-import', ItemImport);
