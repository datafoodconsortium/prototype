import postal from 'postal';
export default class GenericElement extends HTMLElement {
  constructor(view,shadowRootActiv) {
    super();
    this.subscriptions = [];
    this.propagatedStyle=[];
    this.genericElementChildren=[];

    if(view!=undefined){
      this.appendView(view,shadowRootActiv)
    }

    new MutationObserver((mutationsList) => {
      mutationsList.forEach(mutation => {
        mutation.addedNodes.forEach(addedNode => {
          if (addedNode.tagName == "STYLE") {
            let injectedStyle = document.createElement('style');
            injectedStyle.appendChild(document.createTextNode(addedNode.innerText));
            this.appendPropagatedStyle(injectedStyle);
          }
          addedNode.remove();
        })
      })
    }).observe(this, {
      attributes: false,
      childList: true
    });

    this.host=this.getRootNode().host;
    if (this.host instanceof GenericElement){
      this.host.genericElementChildren.push(this);
    }
  }

  appendView(view,shadowRootActiv){
    // console.log('shadowRootActivBefore',shadowRootActiv);
    shadowRootActiv=shadowRootActiv==undefined?true:shadowRootActiv;
    // console.log('shadowRootActiv',shadowRootActiv);
    if (shadowRootActiv==true){
      this.attachShadow({
        mode: 'open'
      });
      this.shadowRoot.innerHTML = view;
    }else{
      this.innerHTML = view;
      // console.log('innerHTML',this.innerHTML);
    }

    // console.log('OK');
  }

  appendPropagatedStyle(injectedStyle){
    this.propagatedStyle.push(injectedStyle);
    if(this.shadowRoot!=undefined){
      this.shadowRoot.appendChild(injectedStyle);
    }else{
      // this.appendChild(injectedStyle);
    }

    this.genericElementChildren.forEach(child=>{
      child.appendPropagatedStyle(injectedStyle.cloneNode(true));
    })
  }

  connectedCallback() {
  }

  disconnectedCallback() {
    this.subscriptions.forEach(s => {
      s.unsubscribe();
    })
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
  }

  subscribe(options) {
    this.subscriptions.push(postal.subscribe(options))
  }

  publish(options) {
    postal.publish(options);
  }

}
