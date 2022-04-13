import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class Home extends GenericElement {
  constructor() {
    super(view);
    const sr=$(this.shadowRoot);
    const go = sr.find("#go");
    console.log(go.get());
    // go.hide();
    // this.shadowRoot.querySelector('[name="stockLimitation"]'),
  }
  connectedCallback() {
    super.connectedCallback();


  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }


  setData(data) {

  }
}
window.customElements.define('x-home', Home);



// export default class Menu extends GenericElement {
//   constructor() {
//     super(view);
//   }
//
//   connectedCallback() {
//     super.connectedCallback();
//     console.log('connectedCallback MENU');
//   }
//
//   disconnectedCallback() {
//     super.disconnectedCallback();
//   }
//
//   attributeChangedCallback(attrName, oldVal, newVal) {
//     super.attributeChangedCallback(attrName, oldVal, newVal);
//   }
//
// }
// window.customElements.define('x-menu', Menu);
