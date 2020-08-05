import Navigo from 'navigo';
import GenericElement from '../core/genericElement.js';
import Util from './util.js'
export default class User extends GenericElement {
  constructor() {
    super();
    this.util = new Util();

    this.subscribe({
      channel: 'profil',
      topic: 'set',
      callback: (data) => {
        this.setProfil(data);
      }
    });

    this.subscribe({
      channel: 'user',
      topic: 'get',
      callback: (data) => {

        this.getUser();
      }
    });
    this.subscribe({
      channel: 'user',
      topic: 'createEntreprise',
      callback: (data) => {
        this.createEntrepriseForUser(data);
      }
    });
    this.subscribe({
      channel: 'user',
      topic: 'logout',
      callback: () => {
        this.logout();
      }
    });
  }

  setProfil(data){
    this.profil=data;
    this.publish({
      channel: 'user',
      topic: 'changeOne',
      data: this.profil.user
    });
  }
  createEntrepriseForUser(data){
    // this.user['dfc:Entreprise']=data;
    let url = `${url_server}/data/core/user/${this.profil.user._id}/entreprise`;
    let option = {
      method: 'POST',
      body:JSON.stringify(data)
    };
    this.util.ajaxCall(url, option).then(data => {
      this.profil.user=data.body;
      // console.log('loadOneSupply',this.selectedSupply);
      this.publish({
        channel: 'user',
        topic: 'changeOne',
        data: this.profil.user
      });
    })
  }

  logout(){
    localStorage.removeItem('token');
    console.log(window.location.href);
    let redirectUrl = `${url_server}/login/auth/logout?redirectUri=${window.location.href}`;
    window.location.href = redirectUrl;
    // this.util.ajaxCall("/auth/logout, option")
  }

  getUser(data){
    if(this.profil !=undefined  &&  this.profil.user!=undefined){
      this.publish({
        channel: 'user',
        topic: 'changeOne',
        data: this.profil.user
      });
    }
  }


}
window.customElements.define('x-service-user', User);
