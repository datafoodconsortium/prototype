import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class Menu extends GenericElement {
  constructor() {
    super(view);
    this.subscribe({
      channel: 'main',
      topic: 'screen',
      callback: (data) => {
        // console.log('supply changeOne',data);
        this.changeMenu(data)
      }
    });
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

  toggleScreen(screen){
    let menuAnchor = this.shadowRoot.querySelector('[href*='+screen+']');
    if (menuAnchor!=undefined){
      menuAnchor.classList.toggle('current');
    }

  }

  changeMenu(screen){
    if(this.currentScreen!=undefined){
      this.toggleScreen(this.currentScreen);
    }
    this.currentScreen = screen;
    this.toggleScreen(this.currentScreen);

  }
  setData(data) {

  }
}
window.customElements.define('x-menu', Menu);
