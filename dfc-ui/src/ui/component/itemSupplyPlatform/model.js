import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import TreeList from "devextreme/ui/tree_list";

import dxcss from 'devextreme/dist/css/dx.light.css';

// import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
// import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
// import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
// import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

export default class ItemSupplyPlatform extends GenericElement {
  constructor() {
    super(view);

    this.dxGridDomNutrients = this.shadowRoot.querySelector('#dxGridNutrients');
    this.dxGridDomPhysical = this.shadowRoot.querySelector('#dxGridPhysical');
    this.dxGridDomAllergens = this.shadowRoot.querySelector('#dxGridAllergens');

    this.elements = {
      name: this.shadowRoot.querySelector('[name="name"]'),
      origin: this.shadowRoot.querySelector('[name="origin"]'),
      labelCertification: this.shadowRoot.querySelector('[name="labelCertification"]'),
      certification: this.shadowRoot.querySelector('[name="certification"]'),
      magnesium : this.shadowRoot.querySelector('[name="magnesium"]'),
      weight : this.shadowRoot.querySelector('[name="weight"]'),
      allergens : this.shadowRoot.querySelector('[name="allergens"]'),
      expirationDate : this.shadowRoot.querySelector('[name="expirationDate"]'),
      producerName: this.shadowRoot.querySelector('[name="producerName"]'),
      description: this.shadowRoot.querySelector('[name="description"]'),
      title: this.shadowRoot.querySelector('[name="title"]'),
      unit: this.shadowRoot.querySelector('[name="unit"]'),
      type : this.shadowRoot.querySelector('[name="type"]'),
      quantity: this.shadowRoot.querySelector('[name="quantity"]'),
      source: this.shadowRoot.querySelector('[name="source"]'),
      sku: this.shadowRoot.querySelector('[name="sku"]'),
      stockLimitation: this.shadowRoot.querySelector('[name="stockLimitation"]'),
      totalTheoriticalStock: this.shadowRoot.querySelector('[name="totalTheoriticalStock"]'),
      id: this.shadowRoot.querySelector('[name="id"]'),
      id_catalog: this.shadowRoot.querySelector('[name="id_catalog"]'),
      id_supply: this.shadowRoot.querySelector('[name="id_supply"]'),
      update: this.shadowRoot.querySelector('#update'),
      refresh: this.shadowRoot.querySelector('#refresh'),
      sameAs: this.shadowRoot.querySelector('#sameAs'),
      sameAsSimple: this.shadowRoot.querySelector('#sameAsSimple'),
      curl: this.shadowRoot.querySelector('[name="curl"]'),
    };

    this.subscribe({
      channel: 'supply',
      topic: 'changeOne',
      callback: (data) => {
        // console.log('supply changeOne',data);
        this.setData(data)
      }
    });

    this.subscribe({
      channel: 'user',
      topic: 'changeOne',
      callback: (data) => {
        // console.log('screen', data);
        this.setUser(data);
      }
    });

  }
  connectedCallback() {
    super.connectedCallback();
    this.elements.update.addEventListener('click', e => {
      this.update();
    })
    this.elements.refresh.addEventListener('click', e => {
      this.refresh();
    })

    this.elements.sameAs.addEventListener('click', e => {
      this.sameAs();
    })

    this.elements.sameAsSimple.addEventListener('click', e => {
      this.sameAsSimple();
    })

    let injectedStyle4 = document.createElement('style');
    injectedStyle4.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle4);


    // this.shadowRoot.querySelector('#update').addEventListener('click', e => {
    //   this.update();
    // })
    // this.shadowRoot.querySelector('#referer').addEventListener('click', e => {
    //   this.referer();
    // })

    // this.gridDom = $(this.shadowRoot.querySelector("#grid"));

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
    // // this.publish({
    // //   channel: 'supply',
    // //   topic: 'loadAll'
    // // });
    //
    // this.gridDom.datagrid('getPanel').find('.datagrid-header .datagrid-htable').css('height', '');
    // this.gridDom.datagrid('getPanel').find('.datagrid-header').css('height', '');
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

    let regex = /\#\/x-item-supply-platform\/(.+)\/?/ig;
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

  // setDataGrid(data) {
  //   // console.log('data received Tree', data);
  //   let counter = 0;
  //   let dataEasyUi = data.map(d => {
  //     counter++;
  //     return {
  //       id: counter,
  //       source: d['dfc-t:hostedBy']['rdfs:label'],
  //       raw:d,
  //       description: d['dfc-b:references']['dfc-b:description'],
  //       quantity: d['dfc-b:references']['dfc-b:quantity'],
  //       unit: d['dfc-b:references']['dfc-b:hasUnit']['rdfs:label'],
  //       type: d['dfc-b:references']['dfc-b:hasType']['rdfs:label'],
  //       sku: d['dfc-b:sku'],
  //       stockLimitation: d['dfc-b:stockLimitation'],
  //       totalTheoriticalStock: d['dfc-b:references']['dfc-b:totalTheoriticalStock'],
  //       '@id': d['@id']
  //     }
  //   })
  //   // console.log('gridDom', this.gridDom, dataEasyUi);
  //   this.gridDom.datagrid('loadData', dataEasyUi);
  // }

  setData(data) {
    console.log(data);
    this.item = data

    // array nutrientCharacteristics
    let nutrients = data['dfc-b:references'] && data['dfc-b:references']['dfc-b:hasNutrientCharacteristic'];
    if(nutrients && !Array.isArray(nutrients)){
      nutrients=[nutrients];
    }
    //console.log("nutrients : ",nutrients);
    // array physicalCharacteristics
    let physicalCharacteristics = data['dfc-b:references'] && data['dfc-b:references']['dfc-b:hasPhysicalCharacteristic'];
    if(physicalCharacteristics && !Array.isArray(physicalCharacteristics)){
      physicalCharacteristics=[physicalCharacteristics];
    }
    //console.log("physicalCharacteristics : ",physicalCharacteristics);
    // array allergenCharacteristics
    let allergens = data['dfc-b:references'] && data['dfc-b:references']['dfc-b:hasAllergenCharacteristic'];
    if(allergens && !Array.isArray(allergens)){
      allergens=[allergens];
    }
    //console.log("allergens : ",allergens);    

    this.elements.sku.value = data['dfc-b:sku'];
    this.elements.stockLimitation.value = data['dfc-b:stockLimitation'];

    this.elements.title.textContent = data['dfc-b:references']['dfc-b:name']+data['dfc-b:references']['dfc-b:description'];
    this.elements.description.value = data['dfc-b:references']['dfc-b:description'];
    this.elements.name.value = data['dfc-b:references']['dfc-b:name'];
    // this.elements.producerName.textContent = data['dfc-b:references']['dfc-b:description'];

    this.elements.origin.textContent = data['dfc-b:references']['dfc-b:hasGeographicalOrigin'] && data['dfc-b:references']['dfc-b:hasGeographicalOrigin']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value'];
    this.elements.expirationDate.textContent = data['dfc-b:references']['dfc-b:lifeTime'];
    this.elements.labelCertification.textContent =  data['dfc-b:references']['dfc-b:hasCertification'] && data['dfc-b:references']['dfc-b:hasCertification']['skos:prefLabel'] && data['dfc-b:references']['dfc-b:hasCertification']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value'] ;
    
    this.elements.type.textContent = data['dfc-b:references']['dfc-b:hasType']&& data['dfc-b:references']['dfc-b:hasType']['skos:prefLabel'].find(l=>l['@language']=='fr')['@value'];
    this.elements.quantity.value = data['dfc-b:references']['dfc-b:hasQuantity'] && data['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:value'];
    this.elements.unit.textContent = data['dfc-b:references']['dfc-b:hasQuantity']&& data['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit'] && data['dfc-b:references']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l =>l['@language']=='fr')['@value'];
    this.elements.id_supply.textContent = data['dfc-b:references']['@id'];

    console.log('---------------- BEFORE setDataGrid');

    // DataGrid for the allergens, the nutrients and physical characteristics
    this.setDataGrid(this.dxGridNutrients,this.dxGridDomNutrients,nutrients);
    this.setDataGrid(this.dxGridPhysical,this.dxGridDomPhysical,physicalCharacteristics);
    this.setDataGrid(this.dxGridAllergens,this.dxGridDomAllergens,allergens);
  }

  setDataGrid(domElement,shadowRootElement,data) {

    if(data.length != 0){
      // if no data we don't show anything
      let counter = 0;
      const dxData = data.map(d => {
        counter++;
        return {
          id: counter,
          value: d['dfc-b:value'],
          notation : d['dfc-b:hasUnit']?.['skos:notation'],
          unit: d['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l =>l['@language']=='fr')?.['@value'],
          type: (d['dfc-b:hasNutrientDimension']?.['skos:prefLabel'].find(l =>l['@language']=='fr')['@value'])
           || d['dfc-b:hasPhysicalDimension']?.['skos:prefLabel']?.find(l =>l['@language']=='fr')?.['@value']
           || d['dfc-b:hasAllergenDimension']?.['skos:prefLabel']?.find(l =>l['@language']=='fr')?.['@value']
        }
      })
  
      domElement = new TreeList(shadowRootElement, {
        "autoExpandAll": true,
        "columns": [
            {
              dataField: 'type',
              caption: 'Type',
            },
            {
              dataField: 'value',
              caption: 'Value',
            },
            {
              dataField: 'unit',
              caption: 'Unit',
            }
        ],
        "dataSource": dxData,
        "showRowLines": true
      });
    }
    // this.dxGrid.dataSource= dataEasyUi;
  }

  setDataGridPhysicalCharacteristics(data){
     let counter = 0;
    const dxData = data.map(d => {
      counter++;
      return {
        id: counter,
        value: d['dfc-b:value'],
        notation : d['dfc-b:hasUnit']['skos:notation'],
        unit: d['dfc-b:hasUnit']['skos:prefLabel'].find(l =>l['@language']=='fr')['@value'],
        nutrientType: d['dfc-b:hasNutrientDimension']['skos:prefLabel'].find(l =>l['@language']=='fr')['@value']
      }
    })

    this.dxGrid = new TreeList(this.dxGridDom, {
      "autoExpandAll": true,
      "columns": [
          {
            dataField: 'nutrientType',
            caption: 'Nutrient Type',
          },
          {
            dataField: 'value',
            caption: 'Value',
          },
          {
            dataField: 'unit',
            caption: 'Unit',
          }
      ],
      "dataSource": dxData,
      "showRowLines": true
    });
  }

  setUser(user) {
    console.log('setUser',user);
    this.token =  user.token;
  }

  update(){

      // console.log(this.elements.description.value);
      console.log('this.item',this.item);
      const updated ={...(this.item),...{
        'dfc-b:stockLimitation':this.elements.stockLimitation.value,
        'dfc-b:sku':this.elements.sku.value,
        'dfc-b:references':{...(this.item['dfc-b:references']),...{
          'dfc-b:description':this.elements.description.value,
          'dfc-b:name':this.elements.name.value
        }}
      }}
      // console.log(updated);
      this.publish({
        channel: 'supply',
        topic: 'update',
        data :updated
      });
  }


  sameAs(){
    // this.elements.sameAs.setAttribute('href',`${url_server}/data/core/catalog/link/${data['@id']}`);
    const url=`${url_server}/data/core/catalog/link/${encodeURIComponent(this.item['@id'])}`

    const curl = `curl --request GET \\
    --url ${url} \\
    --header 'authorization: JWT ${this.token}'`

    // window.alert(curl);

    this.elements.curl.value = curl;
  }

  sameAsSimple(){
    const url=`${url_server}/data/core/catalog/linkSimple/${encodeURIComponent(this.item['@id'])}`

    const curl = `curl --request GET \\
    --url ${url} \\
    --header 'authorization: JWT ${this.token}'`

    // window.alert(curl);

    this.elements.curl.value = curl;
  }


  refresh(){

      // console.log(this.elements.description.value);
      console.log('this.item',this.item);
      // const updated ={...(this.item),...{
      //   'dfc-b:stockLimitation':this.elements.stockLimitation.value,
      //   'dfc-b:sku':this.elements.sku.value,
      //   'dfc-b:references':{...(this.item['dfc-b:references']),...{
      //     'dfc-b:description':this.elements.description.value
      //   }}
      // }}
      // console.log(updated);
      this.publish({
        channel: 'supply',
        topic: 'refresh',
        data :this.item
      });
  }

  //
  // referer(){
  //     if(this.selectedImport!=undefined){
  //       const {'@id':id,'@context':context,...cleanReferences} = this.selectedImport['dfc-b:references'];
  //       console.log(cleanReferences);
  //       this.item['dfc-b:references']=cleanReferences;
  //       this.item['dfc-b:sku']=this.selectedImport['dfc-b:sku'];
  //       this.item['dfc-b:stockLimitation']=this.selectedImport['dfc-b:stockLimitation'];
  //
  //       this.publish({
  //         channel: 'supply',
  //         topic: 'update',
  //         data : this.item
  //       });
  //     }
  // }
}
window.customElements.define('x-item-supply-platform', ItemSupplyPlatform);
