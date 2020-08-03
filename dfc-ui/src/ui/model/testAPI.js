import Navigo from 'navigo';
import GenericElement from '../core/genericElement.js';
import Util from './util.js'
export default class TestAPI extends GenericElement {
  constructor() {
    super();
    this.util = new Util();
    this.subscribe({
      channel: 'testAPI',
      topic: 'testApiHeaderCall',
      callback: (data) => {
        this.testApiHeader(data);
      }
    });

  }

  testApiHeader(url) {
    url=window.location.origin +'/data/core/redirectAPI?url='+url;
    this.util.ajaxCall(url).then(data => {
      this.publish({
        channel: 'testAPI',
        topic: 'testApiHeaderResponse',
        data: data
      })
    })
  }
}
window.customElements.define('x-test-api', TestAPI);
