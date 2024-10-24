import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import 'devextreme/integration/jquery';
import 'devextreme/ui/button';
import dxcss from 'devextreme/dist/css/dx.light.css';
import DataGrid from "devextreme/ui/data_grid";
import dayjs from 'dayjs'; // Import dayjs library


export default class Orders extends GenericElement {
  constructor() {
    super(view);
    this.dxTreeGridDom = this.shadowRoot.querySelector('#dxGrid');
    this.subscribe({
      channel: 'order',
      topic: 'changeAll',
      callback: (data) => {
        this.rawOrders = data;
        this.setDataGrid(data)
      }
    });


  }
  connectedCallback() {
    super.connectedCallback();

    this.publish({
      channel: 'order',
      topic: 'loadAll'
    });

    let injectedStyle = document.createElement('style');
    injectedStyle.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }

  setDataGrid(data) {
    console.log('setDataGrid',data);

    let counter = 0;
    let dxData = data.map(d => {
      console.log('order',d);
      counter++;
      return {
        id: counter,
        orderNumber: d['dfc-b:orderNumber'],
        hasAddress: d['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress']?.['dfc-b:city'],
        startDate: dayjs(d['dfc-b:selects']?.['dfc-b:startDate']).format('DD/MM/YYYY'), // Format startDate
        endDate: dayjs(d['dfc-b:selects']?.['dfc-b:endDate']).format('DD/MM/YYYY'), // Format endDate
        hostedBy: d['dfc-t:hostedBy']?.['rdfs:label'],
        raw: d,
      }
    })

    this.dxTreeGrid = new DataGrid(this.dxTreeGridDom, {
      masterDetail: {
        enabled: true,
        template: function (container, info) {
            try {
              console.log('marker1.0');
              let OrderLines=[];
                OrderLines = info.data.raw['dfc-b:hasPart'].map(d=>{
                  // console.log('allo');
                      console.log('in',d)
                      let part = {
                        quantity:d['dfc-b:hasQuantity']?.['dfc-b:value'],
                        unitOrderLine:d['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l=>l['@language']=='fr')?.['@value'],
                        name:d['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'],
                        quantityProduct:d['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:hasQuantity']?.['dfc-b:value'],
                        unitProduct:d['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l=>l['@language']=='fr')?.['@value'],
                        description:d['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:description'],
                        type: d['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:hasType']?.['skos:prefLabel']?.find(l=>l['@language']=='fr')?.['@value'],
                        hasAddress: d['dfc-b:fulfilledBy']?.['dfc-b:constitutedBy']?.['dfc-b:isStoredIn']?.['dfc-b:hasAddress']?.['dfc-b:city'],
                      }
                      // console.log(part);
                      return part;


                  }
                );

              const tabPanelItems = [{
                ID: 1,
                title: 'OrderLines',
                data: OrderLines,
                template: function (itemData, itemIndex, element) {
                  console.log(itemData, itemIndex, element);
                  let offersGrid = new DataGrid(element, {
                    "columns": [
                      "quantity",
                      "unitOrderLine",
                      "quantityProduct",
                      "unitProduct",
                      "name",
                      "description",
                      'type',
                      'hasAddress'
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
            } catch (error) {
              // console.log('error2')
              console.error(error);
            }
        }
    },
      "columns": [
          {
            dataField: 'orderNumber',
            caption: 'orderNumber',
          },
          {
            dataField: 'hasAddress',
            caption: 'shipping Address',
          },
          {
            dataField: 'hostedBy',
            caption: 'hostedBy',
          },
          {
            dataField: 'startDate',
            caption: 'startDate',
          },
          {
            dataField: 'endDate',
            caption: 'endDate',
          }
      ],
      "dataSource": dxData,
      "showRowLines": true,
      paging: { enabled: false },
      "height" : "80vh",
      "scrolling": {
        useNative: true,
        mode: "standard"
       },
    });
  }



}
window.customElements.define('x-orders', Orders);
