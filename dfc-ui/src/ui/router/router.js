import Navigo from 'navigo';
import GenericElement from '../core/genericElement.js';
export default class Router extends GenericElement {
  constructor() {
    super();
    this.firstRoute = false;
    var root = null;
    var useHash = true; // Defaults to: false
    var hash = '#'; // Defaults to: '#'
    this.router = new Navigo(root, useHash, hash);

    this.router.on('/:screen*', (params, query) => {
      if (params.screen == undefined) {
        this.firstRoute = true;
      }
      this.publish({
        channel: 'main',
        topic: 'screen',
        data: params.screen
      });

    }).resolve();

    this.subscribe({
      channel: 'main',
      topic: 'navigate',
      callback: (data) => {
        this.router.navigate(data);
      }
    })
  }
  connectedCallback() {
    super.connectedCallback();
    // if (this.firstRoute == false && this.getAttribute('default') != undefined) {
    //   this.router.navigate('/' + this.getAttribute('default'));
    // }

    //console.log(this.getAttribute('default'));
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
    switch (attrName) {
      case 'default':
        this.router.navigate('/' + newVal);
        break;
      default:

    }
  }
}
window.customElements.define('x-router', Router);
