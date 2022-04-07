import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class Profil extends GenericElement {
  constructor() {
    super(view);
    this.elements = {
        email: this.shadowRoot.querySelector('[name="email"]'),
        token: this.shadowRoot.querySelector('[name="token"]'),
        logout: this.shadowRoot.querySelector('#logout'),

    };
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
    this.publish({
      channel: 'user',
      topic: 'get',
    });

    this.elements.logout.addEventListener('click', e => {
      this.publish({
        channel: 'user',
        topic: 'logout'
      });
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }


  setData(data) {

  }

  setUser(user) {

    this.elements.email.textContent = user.email;
    this.elements.token.value = user.token;
  }
}
window.customElements.define('x-profil', Profil);
