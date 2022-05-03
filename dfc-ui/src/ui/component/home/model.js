import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import 'devextreme/integration/jquery';
import 'devextreme/ui/button';
import { alert } from 'devextreme/ui/dialog';
import TreeList from "devextreme/ui/tree_list";
import dxcss from 'devextreme/dist/css/dx.light.css';


export default class Home extends GenericElement {
  constructor() {
    super(view);

    // go.hide();
    // this.shadowRoot.querySelector('[name="stockLimitation"]'),
  }
  connectedCallback() {
    super.connectedCallback();


    const sr=$(this.shadowRoot);

    // sr.find("#myButton").dxButton({
    //   text: "test devExtreme framework",
    //   onClick: function() {
    //     alert('devExtreme framework is well integrated', '', false);
    //   }
    // });

    // const employees = [
    //       {
    //           "id": 1,
    //           "parentId": 0,
    //           "fullName": "John Heart",
    //           "position": "CEO",
    //           "email": "jheart@dx-email.com"
    //       },
    //       {
    //           "id": 2,
    //           "parentId": 1,
    //           "fullName": "Samantha Bright",
    //           "position": "COO",
    //           "email": "samanthab@dx-email.com"
    //       },
    //       {
    //           "id": 3,
    //           "parentId": 1,
    //           "fullName": "Arthur Miller",
    //           "position": "CTO",
    //           "email": "arthurm@dx-email.com"
    //       },
    //       {
    //           "id": 4,
    //           "parentId": 1,
    //           "fullName": "Robert Reagan",
    //           "position": "CMO",
    //           "email": "robertr@dx-email.com"
    //       },
    //       {
    //           "id": 5,
    //           "parentId": 2,
    //           "fullName": "Greta Sims",
    //           "position": "HR Manager",
    //           "email": "gretas@dx-email.com"
    //       }
    //   ];
    //
    // const widget = this.shadowRoot.querySelector('#widget');
    // // console.log("widget",widget);
    //
    //
    // new TreeList(this.shadowRoot.getElementById("widget"), {
    // "autoExpandAll": true,
    // "columns": [
    //     "position",
    //     "fullName",
    //     "email"
    // ],
    // "dataSource": employees,
    //   "showRowLines": true
    // });
    //
    // sr.find("#treeList").dxTreeList({
    //     dataSource: employees,
    //     "autoExpandAll": true,
    //     "columns": [
    //         "position",
    //         "fullName",
    //         "email"
    //     ],
    //     "showRowLines": true
    // });


    let injectedStyle = document.createElement('style');
    injectedStyle.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle);

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
window.customElements.define('x-home', Home);



// export default class Menu extends GenericElement {
//   constructor() {
//     super(view);
//   }
//
//   connectedCallback() {
//     super.connectedCallback();
//     console.log('connectedCallback MENU');
//   }
//
//   disconnectedCallback() {
//     super.disconnectedCallback();
//   }
//
//   attributeChangedCallback(attrName, oldVal, newVal) {
//     super.attributeChangedCallback(attrName, oldVal, newVal);
//   }
//
// }
// window.customElements.define('x-menu', Menu);
