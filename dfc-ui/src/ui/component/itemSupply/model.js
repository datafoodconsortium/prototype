import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';

// import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
// import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
// import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
// import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

import 'devextreme/integration/jquery';
import TreeList from "devextreme/ui/tree_list";
import DataGrid from "devextreme/ui/data_grid";
import TabPanel from "devextreme/ui/tab_panel";
import dxcss from 'devextreme/dist/css/dx.light.css';

export default class ItemSupply extends GenericElement {
  constructor() {
    super(view);

    this.dxGridDom = this.shadowRoot.querySelector('#dxGrid');
    this.dxGridOffersDom = this.shadowRoot.querySelector('#dxGridOffers');
    console.log("this.dxGridOffersDom",this.dxGridOffersDom);
    this.elements = {
      name: this.shadowRoot.querySelector('[name="name"]'),
      description: this.shadowRoot.querySelector('[name="description"]'),
      unit: this.shadowRoot.querySelector('[name="unit"]'),
      type : this.shadowRoot.querySelector('[name="type"]'),
      quantity: this.shadowRoot.querySelector('[name="quantity"]'),
      source: this.shadowRoot.querySelector('[name="source"]'),
      sku: this.shadowRoot.querySelector('[name="sku"]'),
      stockLimitation: this.shadowRoot.querySelector('[name="stockLimitation"]'),
      totalTheoriticalStock: this.shadowRoot.querySelector('[name="totalTheoriticalStock"]'),
      id: this.shadowRoot.querySelector('[name="id"]'),
      uriButton: this.shadowRoot.querySelector('#uri'),
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
    // this.shadowRoot.querySelector('#unlink').addEventListener('click', e => {
    //   this.unlink();
    // })
    // this.shadowRoot.querySelector('#referer').addEventListener('click', e => {
    //   this.referer();
    // })
    //
    // this.gridDom = $(this.shadowRoot.querySelector("#grid"));
    //
    // let grid = this.gridDom.datagrid({
    //   fit: true,
    //   singleSelect:true,
    //   autoLoad: false,
    //   onSelect: (id,rowData) => {
    //     this.selectedImport = rowData.raw
    //   },
    //   columns: [
    //     [{
    //         field: 'description',
    //         title: 'description',
    //         width: 300
    //       },
    //       {
    //           field: 'type',
    //           title: 'type',
    //           width: 300
    //       },
    //       {
    //         field: 'quantity',
    //         title: 'quantity',
    //         width: 100
    //       }, {
    //         field: 'unit',
    //         title: 'unit',
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
    //         field: 'source',
    //         title: 'source',
    //         width: 200
    //       }
    //     ]
    //   ]
    // });
    // this.publish({
    //   channel: 'supply',
    //   topic: 'loadAll'
    // });

    // this.gridDom.datagrid('getPanel').find('.datagrid-header .datagrid-htable').css('height', '');
    // this.gridDom.datagrid('getPanel').find('.datagrid-header').css('height', '');
    // this.gridDom.datagrid('resize');

    // let injectedStyle = document.createElement('style');
    // injectedStyle.appendChild(document.createTextNode(easyuiCss.toString()));
    // this.shadowRoot.appendChild(injectedStyle);
    // let injectedStyle2 = document.createElement('style');
    // injectedStyle2.appendChild(document.createTextNode(easyuiCssIcons.toString()));
    // this.shadowRoot.appendChild(injectedStyle2);
    // let injectedStyle3 = document.createElement('style');
    // injectedStyle3.appendChild(document.createTextNode(easyuiCssColors.toString()));
    // this.shadowRoot.appendChild(injectedStyle3);

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

    this.elements.uriButton.addEventListener('click', e => {
      window.alert(this.item['@id'])
    })

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

  setDataGrid(data) {
    // console.log('data received Tree', data);
    // let counter = 0;
    // let dataEasyUi = data.map(d => {
    //   counter++;
    //   let type = d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasType'];
    //   if(type&&!Array.isArray(type)){
    //     type=[type];
    //   }
    //   return {
    //     id: counter,
    //     source: d['dfc-t:hostedBy']['rdfs:label'],
    //     raw:d,
    //     description: d['dfc-b:references']&& d['dfc-b:references']['dfc-b:description'],
    //     quantity: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:quantity'],
    //     unit: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasUnit']?d['dfc-b:references']['dfc-b:hasUnit']['rdfs:label']:'',
    //     type: type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'',
    //     sku: d['dfc-b:sku'],
    //     stockLimitation: d['dfc-b:stockLimitation'],
    //     totalTheoriticalStock: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:totalTheoriticalStock'],
    //     '@id': d['@id']
    //   }
    // })
    // // console.log('gridDom', this.gridDom, dataEasyUi);
    // this.gridDom.datagrid('loadData', dataEasyUi);

    let counter = 0;
    const dxData = data.map(d => {
      counter++;
      let type = d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasType'];
      if(type&&!Array.isArray(type)){
        type=[type];
      }
      return {
        id: counter,
        name: d['dfc-b:references']['dfc-b:name'],
        description: d['dfc-b:references']['dfc-b:description'],
        quantity:d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasQuantity']?d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value']:'',
        sku: d['dfc-b:sku'],
        stockLimitation : d['dfc-b:stockLimitation'],
        unit: d['dfc-b:references']&&d['dfc-b:references']['dfc-b:hasQuantity']&&d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']&&d['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value'],
        totalTheoriticalStock : d['dfc-b:references']['dfc-b:totalTheoriticalStock'],
        type: type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'',
        source: d['dfc-t:hostedBy']?d['dfc-t:hostedBy']['rdfs:label']:'',
        raw :d
      }
    })

    this.dxGrid = new DataGrid(this.dxGridDom, {
      "autoExpandAll": true,
      "showBorders": true,
        masterDetail: {
          enabled: true,
          template: function (container, info) {
              console.log('info',info);
              let dataOffers = info.data.raw['dfc-b:offeredThrough'].map(d=>({
                price:d['dfc-b:hasPrice']?.['dfc-b:value'],
                stockLimitation:d['dfc-b:stockLimitation'],
                description:d['dfc-b:offersTo']?.['dfc-b:description'],
                children:d['dfc-b:listedIn']// continue  https://github.com/datafoodconsortium/ontology/issues/118 ?.map(saleSession=>saleSession?.)
              }));



              const tabPanelItems = [{
                ID: 1,
                title: 'Offers',
                data: dataOffers,
                template: function (itemData, itemIndex, element) {
                  console.log(itemData, itemIndex, element);
                  let offersGrid = new DataGrid(element, {
                    "columns": [
                      "description",
                      "stockLimitation",
                      "price",
                    ],
                    "dataSource": itemData.data
                  })
                },
              }];


              const panel =$("<div></div>").dxTabPanel({
                  itemTitleTemplate:  function (data,index,container){
                    // console.log('template',data,index,container);
                    const title=$(`<span>${data.title}</span>`);
                    container.append(title);
                  },
                  dataSource:tabPanelItems
              });

              container.append(panel);


          }
      },
      "columns": [
          {
            dataField: 'name',
            caption: 'Name',
            minWidth: 400,
          },
          {
            dataField: 'description',
            caption: 'Description',
            minWidth: 400,
          },
          "type",
          "quantity",
          "unit",
          // "sku",
          "stockLimitation",
          // "totalTheoriticalStock",

          "source",
          {
              type: "buttons",
              width:200,
              buttons: [{
                  // text: "Edit",
                  // cssClass: "button-dx",
                  // icon : "https://img.icons8.com/windows/32/000000/edit--v1.png",
                  template: function (element, data) {
                    // console.log('ALLO TEMPLATE',data, element);
                    const item = $(`<div class="button-dx"><image src="https://img.icons8.com/windows/32/000000/delete-link.png"/></div>`)
                    // const item = $(`<div>Unconsolidate</div>`)
                    element.append(item);
                    // return "edit template"
                  },
                  onClick: (e)=>{
                      console.log(e);
                      const raw = e.row.data.raw;
                      this.selectedImport=raw;
                      this.unlink();
                  }
              },
              {
                  // text: "Edit",
                  // cssClass: "button-dx",
                  // icon : "https://img.icons8.com/windows/32/000000/edit--v1.png",
                  template: function (element, data) {
                    // console.log('ALLO TEMPLATE',data, element);
                    const item = $(`<div class="button-dx"><image src="https://img.icons8.com/plumpy/32/000000/reorder.png"/></div>`)
                    // const item = $(`<div>referer</div>`)
                    element.append(item);
                    // return "edit template"
                  },
                  onClick: (e)=>{
                    const raw = e.row.data.raw;
                    this.selectedImport=raw;
                    this.referer();
                  }
              },
              {
                  // text: "Edit",
                  // cssClass: "button-dx",
                  // icon : "https://img.icons8.com/windows/32/000000/edit--v1.png",
                  template: function (element, data) {
                    const raw = data.data.raw;
                    let hostedBy = raw['dfc-t:hostedBy']['@id']||raw['dfc-t:hostedBy'];

                      const item = $(`<div class="button-dx"><image src="https://img.icons8.com/windows/32/000000/edit--v1.png"/></div>`)
                      element.append(item);

                    // return "edit template"
                  },
                  onClick: (e)=>{
                      const raw = e.row.data.raw;
                      let hostedBy = raw['dfc-t:hostedBy']['@id']||raw['dfc-t:hostedBy'];

                        this.publish({
                          channel: 'main',
                          topic: 'navigate',
                          data: '/x-item-supply-platform/' + encodeURIComponent(raw['@id'])
                        })

                  }
              }]
          }
      ],
      "dataSource": dxData,
      "showRowLines": true
    });

  }

  setData(data) {
    console.log(data);
    let type = data['dfc-b:references']&&data['dfc-b:references']['dfc-b:hasType'];
    if(type&&!Array.isArray(type)){
      type=[type];
    }
    this.item = data
    this.elements.quantity.textContent = data['dfc-b:references']['dfc-b:hasQuantity']&&data['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value'];
    // this.elements.id.textContent = data['@id'];
    this.elements.description.textContent = data['dfc-b:references']['dfc-b:description'];
    this.elements.name.textContent = data['dfc-b:references']['dfc-b:name'];
    this.elements.type.textContent = type?type.map(t=>t['skos:prefLabel'].find(l=>l['@language']=='fr')['@value']):'';
    // this.elements.unit.textContent = data['dfc:hasUnit']['@id'];
    this.elements.quantity.value = data['dfc-b:references']['dfc-b:hasQuantity']&& data['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value'];
    this.elements.unit.textContent = data['dfc-b:references']['dfc-b:hasQuantity']&&data['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value'];
    this.elements.stockLimitation.textContent = data['dfc-b:stockLimitation'];
    // this.elements.totalTheoriticalStock.textContent = data['dfc-b:references']['dfc-b:totalTheoriticalStock'];
    // this.elements.sku.textContent = data['dfc-b:sku'];
    // const represents = Array.isArray(data['dfc-t:hasPivot']['dfc-t:represent'])?data['dfc-b:references']:[data['dfc-b:references']]
    // console.log(data['dfc-t:hasPivot']['dfc-t:represent']);
    let represent= data['dfc-t:hasPivot']['dfc-t:represent'];
    represent=Array.isArray(represent)?represent:[represent];
    represent= represent.filter(r=>r['@id']!=data['@id'])
    this.setDataGrid(represent);

    // this.elements.quantity.textContent = data['dfc:quantity'];
    // this.elements.source.textContent = data['source'];

    // let offers = data['dfc-b:offeredThrough'].map(o=>({
    //   price:o['dfc-b:price'],
    //   stockLimitation:o['dfc-b:stockLimitation'],
    //   description:o['dfc-b:offeres']['dfc-b:description']
    // }))
    // console.log('offers',offers);


    // this.dxGridOffers = new DataGrid(this.dxGridOffersDom, {
    //   "autoExpandAll": true,
    //   "showBorders": true,
    //   "columns": [
    //     "description",
    //     "price",
    //     "stockLimitation"
    //   ],
    //   "dataSource": offers,
    // })

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
        const {'@id':idReference,'@context':contextReference,'dfc-t:hasPivot':pivotReference,'dfc-t:hostedBy':hostedReference,...cleanReferences} = this.selectedImport['dfc-b:references'];
        // console.log("cleanReferences",cleanReferences);
        // console.log("this.item['dfc-b:references']",this.item['dfc-b:references']);
        // console.log({
        //   ...this.item['dfc-b:references'],
        //   ...cleanReferences
        // });
        // this.item['dfc-b:references']={...cleanReferences,"@id":this.item['dfc-b:references']["@id"]};

        const {'@id':id,'@context':context,'dfc-t:hasPivot':pivot,'dfc-t:hostedBy':hosted,...cleanItem} = this.selectedImport;


        // console.log("this.item['dfc-b:references']",this.item['dfc-b:references']);
        this.item={
          ...this.item,
          ...cleanItem,
          'dfc-b:references':{
            ...this.item['dfc-b:references'],
            ...cleanReferences
          }
        };
        // console.log('final item', this.item);
        // this.item['dfc-b:sku']=this.selectedImport['dfc-b:sku'];
        // this.item['dfc-b:stockLimitation']=this.selectedImport['dfc-b:stockLimitation'];

        this.publish({
          channel: 'supply',
          topic: 'update',
          data : this.item
        });
      }


  }
}
window.customElements.define('x-item-supply', ItemSupply);
