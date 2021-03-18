import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class Catalog extends GenericElement {
  constructor() {
    super(view);
    this.subscribe({
      channel: 'catalog',
      topic: 'changeAll',
      callback: (data) => {
        this.setData(data)
      }
    })
  }
  connectedCallback() {
    super.connectedCallback();

    this.catalogList = this.shadowRoot.getElementById('catalogList');
    this.publish({
      channel: 'catalog',
      topic: 'loadAll'
    });
    this.addCell('source','header');
    this.addCell('desription','header');
    this.addCell('package','header');
    this.addCell('unit','header');
  }
  addCell(value,css){
    let div = document.createElement('div');
    this.catalogList.appendChild(div);
    if(css !=undefined){
      div.classList.add(css);
    }
    let text = document.createTextNode(value);
    div.appendChild(text);
  }

  setData(data) {
    let catalogList =this.shadowRoot.getElementById('catalogList');
    data.forEach(item=>{
      this.addCell(item['source']);
      this.addCell(item['dfc-b:description'],'cell');
      this.addCell(item['dfc-b:quantity'],'cell');
      this.addCell(item['dfc-b:hasUnit']['@id'],'cell')

    })
  }
}
window.customElements.define('x-catalog', Catalog);
