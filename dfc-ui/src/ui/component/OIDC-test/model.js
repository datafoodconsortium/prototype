import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';

export default class OIDC_test extends GenericElement {
  constructor() {
    super(view);
    this.elements = {
      urlInit: this.shadowRoot.querySelector('#urlInit'),
      urlInit2: this.shadowRoot.querySelector('#urlInit2'),
      urlInit3: this.shadowRoot.querySelector('#urlInit3'),
      result: this.shadowRoot.querySelector('[name="result"]'),
      header: this.shadowRoot.querySelector('[name="header"]'),
      urlTest: this.shadowRoot.querySelector('#urlTest'),
      urlInput: this.shadowRoot.querySelector('[name="urlInput"]'),
    };
    this.subscribe({
      channel: 'testAPI',
      topic: 'testApiHeaderResponse',
      callback: (data) => {
        // console.log('testApiHeaderResponse',data);
        this.setResult(data);
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();

    this.elements.urlTest.addEventListener('click', e => {
      let url = this.elements.urlInput.value;
      // console.log(url);
      this.publish({
        channel: 'testAPI',
        topic: 'testApiHeaderCall',
        data: url
      })
    })

    this.elements.urlInit.addEventListener('click', e => {
      let url = window.location.origin + '/login/auth/me';
      this.elements.urlInput.value = url;
    })
    this.elements.urlInit2.addEventListener('click', e => {
      let url = window.location.origin + '/data/core/me/entrepriseJSONLD';
      this.elements.urlInput.value = url;
    })
    this.elements.urlInit3.addEventListener('click', e => {
      let url = window.location.origin + '/data/core/me/entrepriseLDP';
      this.elements.urlInput.value = url;
    })
  }
  setResult(result) {
    this.elements.result.value = JSON.stringify(result.body);
    this.elements.header.value = result.headers;
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
window.customElements.define('x-oidc-test', OIDC_test);
