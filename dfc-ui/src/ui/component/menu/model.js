import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class Menu extends GenericElement {
  constructor() {
    super(view);
    this.elements = {
      userRole: this.shadowRoot.querySelector('.user-role'),
      importCatalogMenu: this.shadowRoot.querySelector('[href*=x-import-catalog]'),
      catalogImportMenu: this.shadowRoot.querySelector('[href*=x-catalog-import]'),
      catalogSupplyMenu: this.shadowRoot.querySelector('[href*=x-catalog-supply]'),
      ordersMenu: this.shadowRoot.querySelector('[href*=x-orders]'),
      flowsMenu: this.shadowRoot.querySelector('[href*=x-flows]'),
  };
    this.subscribe({
      channel: 'main',
      topic: 'screen',
      callback: (data) => {
        this.changeMenu(data)
      }
    });
    this.subscribe({
      channel: 'user',
      topic: 'changeOne',
      callback: (data) => {
        this.setUser(data);
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.publish({
      channel: 'user',
      topic: 'get',
    });

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

  setUser(user) {
    this.elements.userRole.textContent = user['dfc:role'];
    if (user['dfc:role']=='logistician'){
      this.elements.importCatalogMenu.classList.add('hide');
      this.elements.catalogImportMenu.classList.add('hide');
      this.elements.catalogSupplyMenu.classList.add('hide');
      this.elements.ordersMenu.classList.add('hide');
    }else{
      this.elements.importCatalogMenu.classList.remove('hide');
      this.elements.catalogImportMenu.classList.remove('hide');
      this.elements.catalogSupplyMenu.classList.remove('hide');
      this.elements.ordersMenu.classList.remove('hide');
    }
  }
}
window.customElements.define('x-menu', Menu);
