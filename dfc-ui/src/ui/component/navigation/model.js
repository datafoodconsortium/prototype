import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import header from '../header/model.js';
import home from '../home/model.js';
import menu from '../menu/model.js';
// import screen1 from '../catalog/model.js';
// import screen3 from '../w2ui/model.js';
import catalogImport from '../catalogImport/model.js';
import catalogSupply from '../catalogSupply/model.js';
import itemImport from '../itemImport/model.js';
import itemSupply from '../itemSupply/model.js';
import profil from '../profil/model.js';
import importCatalog from '../importCatalog/model.js';
import oidc_test from '../OIDC-test/model.js';
import ldp_test from '../LDP-test/model.js';


export default class Navigation extends GenericElement {
  constructor() {
    super(view);

    this.elements = {
      loader: this.shadowRoot.querySelector('#containerLoaderDiv'),
    };

    this.subscribe({
      channel: 'main',
      topic: 'screen',
      callback: (data) => {
        // console.log('screen', data);
        this.loadComponent(data);
      }
    });

    this.subscribe({
      channel: 'ui',
      topic: 'activLoader',
      callback: () => {
        this.elements.loader.classList.remove('hide')
      }
    });
    this.subscribe({
      channel: 'ui',
      topic: 'hideLoader',
      callback: () => {
        this.elements.loader.classList.add('hide')
      }
    });
  }

  loadComponent(comp) {
    console.log(comp);
    let screen = this.shadowRoot.querySelector('#screen');
    let component = document.createElement(comp);
    component.setAttribute("style", "flex:1");
    component.classList.add('containerV')
    while (screen.firstChild != null) {
      screen.removeChild(screen.firstChild);
    }
    screen.appendChild(component);

    this.propagatedStyle.forEach(style => {
      component.appendChild(style.cloneNode(true));
    })
    return component;
  }

  connectedCallback() {
    super.connectedCallback();
    this.activAuth();
    // this.loadComponent('home-wc');
  }

  async activAuth() {
    let search = window.location.search.split('?')[1];
    let urlToken = undefined;
    if (search != undefined) {
      let params = search.split('&').map(param => {
        let terms = param.split('=')
        return {
          key: terms[0],
          value: terms[1]
        }
      });
      let urlToken = params.filter(r => r.key == 'token')[0];

      if (urlToken != undefined) {
        // console.log('urlToken', urlToken.value);
        localStorage.setItem('token', urlToken.value);
        let cleanurl=window.location.origin+window.location.pathname+window.location.hash;
        window.location=cleanurl;
        // console.log('location',window.location,window.origin.host+window.location.pathname+window.location.hash);
        // this.shadowRoot.getElementById('appLink').click();
      } else {

      }
    }
    if (urlToken == undefined) {
      let token = localStorage.getItem('token');

      if (token != undefined && token != 'undefined') {

        // console.log('existing token');

        // localStorage.removeItem('token');
        // document.getElementById('oidcLink').click();
      } else {


      }

      var myHeaders = new Headers();
      myHeaders.append("Authorization", 'JWT' + ' ' + token);
      // myHeaders.append("Referer",window.location)

      var myInit = {
        method: 'GET',
        headers: myHeaders,
        mode: 'cors'
      };

      try {
        let response = await fetch(`${url_server}/login/auth/me`, myInit);

        if (response.status == 200) {
          let jsonResponse = await response.json();

          // console.log('response', jsonResponse);
          this.publish({
            channel: 'profil',
            topic: 'set',
            data: jsonResponse
          });
          // document.getElementById('user').textContent = jsonResponse. preferred_username;

        } else {
          let text = await response.text();
          // document.getElementById('err').textContent = text + ' redirect to OIDC provider in 1 second';
          setTimeout(() => {
            // let oidcLink = this.shadowRoot.getElementById('oidcLink');
            // oidcLink.setAttribute('href', oidcLink.getAttribute('href-source') + '?app_referer=' + window.location.hash.substr(1));
            // oidcLink.click();
            window.location=`${url_server}/login/auth?app_referer=${window.location.hash.substr(1)}`

          }, 1);

        }
      } catch (e) {
        console.log('Request failed', e)
      } finally {

      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }


  removeParam(parameter) {
    var url = document.location.href;
    var urlparts = url.split('?');

    if (urlparts.length >= 2) {
      var urlBase = urlparts.shift();
      var queryString = urlparts.join("?");

      var prefix = encodeURIComponent(parameter) + '=';
      var pars = queryString.split(/[&;]/g);
      for (var i = pars.length; i-- > 0;)
        if (pars[i].lastIndexOf(prefix, 0) !== -1)
          pars.splice(i, 1);
      url = urlBase + '?' + pars.join('&');
      window.history.pushState('', document.title, url); // added this line to push the new url directly to url bar .

    }
    return url;
  }

}
window.customElements.define('x-navigation', Navigation);
