import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
// import {
//   PathFactory
// } from 'ldflex';
// import {
//   default as ComunicaEngine
// } from '@ldflex/comunica';
// import {
//   namedNode
// } from '@rdfjs/data-model';

// const { PathFactory } = require('ldflex');
// const { default: ComunicaEngine } = require('ldflex-comunica');
// const { namedNode } = require('@rdfjs/data-model');

export default class LDP_test extends GenericElement {
  constructor() {
    super(view);
    this.elements = {
      urlInit: this.shadowRoot.querySelector('#urlInit'),
      urlInit2: this.shadowRoot.querySelector('#urlInit2'),
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

    this.elements.urlTest.addEventListener('click', async e => {
      let url = this.elements.urlInput.value;

      const context = {
        "@context": {
          // "@vocab": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
          "dfc": "http://datafoodconsortium.org/ontologies/DFC_FullModel.owl#",
          "label": "http://www.w3.org/2000/01/rdf-schema#label",
        }
      };
      // // The query engine and its source
      // const queryEngine = new ComunicaEngine('http://localhost:8080/data/core/entrepriseLDP/5da83c675417a50a1250ee08');
      // // The object that can create new paths
      // let param = {
      //   context,
      //   queryEngine
      // };
      // // console.log('param',param);
      // const path = new PathFactory({
      //   context,
      //   queryEngine
      // });
      //
      // const proxy = path.create({
      //   subject: namedNode('http://localhost:8080/data/core/entrepriseLDP/5da83c675417a50a1250ee08')
      // });
      // let description = await proxy['dfc:description'];
      //
      //
      // (async document => {
      //   for await (const subject of document.subjects)
      //   console.log(`subject ${subject}`);
      // })(proxy);
      //
      // (async subject => {
      //   for await (const property of subject.properties)
      //   console.log(`property ${property}`);
      // })(proxy);

    })

    // this.elements.urlInit.addEventListener('click',e=>{
    //   let url = window.location.origin+'/login/auth/me';
    //   this.elements.urlInput.value=url;
    // })
    this.elements.urlInit2.addEventListener('click', e => {
      let url = window.location.origin + '/data/core/me/entrepriseLDP';
      this.elements.urlInput.value = url;
    })
  }
  setResult(result) {
    console.log('result', result);
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
window.customElements.define('x-ldp-test', LDP_test);
