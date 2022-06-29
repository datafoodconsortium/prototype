import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';

// import easyui from '../../easyui/jquery-easyui-1.8.1/jquery.easyui.min.js';
// import easyuiCss from '../../easyui/jquery-easyui-1.8.1/themes/default/easyui.css';
// import easyuiCssIcons from '../../easyui/jquery-easyui-1.8.1/themes/icon.css';
// import easyuiCssColors from '../../easyui/jquery-easyui-1.8.1/themes/color.css';

export default class ItemSupplyPlatform extends GenericElement {
  constructor() {
    super(view);

    this.elements = {
      description: this.shadowRoot.querySelector('[name="description"]'),
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
  //       unit: d['dfc-b:references']['dfc-p:hasUnit']['rdfs:label'],
  //       type: d['dfc-b:references']['dfc-p:hasType']['rdfs:label'],
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


    this.elements.sku.value = data['dfc-b:sku'];
    this.elements.stockLimitation.value = data['dfc-b:stockLimitation'];
    // this.elements.id_catalog.textContent = data['@id'];

    this.elements.description.value = data['dfc-b:references']['dfc-b:description'];
    this.elements.type.textContent = data['dfc-b:references']['dfc-p:hasType']&&data['dfc-b:references']['dfc-p:hasType']['rdfs:label'];
    // this.elements.unit.textContent = data['dfc:hasUnit']['@id'];
    this.elements.quantity.value = data['dfc-b:references']['dfc-b:quantity'];
    this.elements.unit.textContent = data['dfc-b:references']['dfc-p:hasUnit']&&data['dfc-b:references']['dfc-p:hasUnit']['rdfs:label'];
    // this.elements.totalTheoriticalStock.value = data['dfc-b:references']['dfc-b:totalTheoriticalStock'];
    this.elements.id_supply.textContent = data['dfc-b:references']['@id'];

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
          'dfc-b:description':this.elements.description.value
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
  //       this.item['dfc-p:stockLimitation']=this.selectedImport['dfc-p:stockLimitation'];
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
