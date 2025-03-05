import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class Profil extends GenericElement {
  constructor() {
    super(view);
    this.elements = {
        email: this.shadowRoot.querySelector('[name="email"]'),
        token: this.shadowRoot.querySelector('[name="token"]'),
        role: this.shadowRoot.querySelector('[name="role"]'),
        logout: this.shadowRoot.querySelector('#logout'),
        update: this.shadowRoot.querySelector('#update'),
    };
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

    this.elements.logout.addEventListener('click', e => {
      this.publish({
        channel: 'user',
        topic: 'logout'
      });
    });

    this.elements.update.addEventListener('click', e => {
      this.handleUpdate();
    }); 
;
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

    this.user = user;

    this.elements.email.textContent = user['dfc:email'] || '';
    this.elements.token.value = user['ontosec:token'] || '';
    this.elements.role.value = user['dfc:role'] || '';
  }

  handleUpdate() {
    delete this.user.role;
    const newData = {
      ...this.user,
      'dfc:role': this.elements.role.value,
    };
    this.publish({
      channel: 'user',
      topic: 'update',
      data: newData
    });
  }

}
window.customElements.define('x-profil', Profil);
