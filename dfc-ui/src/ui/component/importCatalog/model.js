import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
export default class ImportCatalog extends GenericElement {
  constructor() {
    super(view);
    this.subscribe({
      channel: 'source',
      topic: 'changeAll',
      callback: (data) => {
        this.loadSources(data);
      }
    });
  }
  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.getElementById('import-button').addEventListener('click', e => {
      let sourceSelect = this.shadowRoot.getElementById("source-select");
      var optionSelected = sourceSelect.options[sourceSelect.selectedIndex];
      const sourceSelected = this.sources.filter(s => s.name == optionSelected.value)[0];
      let url = sourceSelected.url;
      const options = this.shadowRoot.getElementById("options").querySelectorAll("input");
      let firstOption=true;
      options.forEach(option=>{
        url=url.concat(firstOption?'?':'&');
        url=url.concat(`${option.getAttribute('url-param')}=${option.value}`)
      })
      this.publish({
        channel: 'source',
        topic: 'importOne',
        data: {
          source: url,
          name:sourceSelected.name
        }
      });
    });

    this.shadowRoot.getElementById('clean-button').addEventListener('click', e => {
      let cleandecision = confirm('êtes vous sur de vouloir supprimer le catalogue lié à cet utilisateur');
      if (cleandecision == true) {
        this.publish({
          channel: 'source',
          topic: 'clean',
        });
      }
    });

    this.shadowRoot.getElementById('source-select').addEventListener('change', e => {
      const sourceSelected = this.sources.filter(s => s.name == e.target.value)[0];
      const divOptions = this.shadowRoot.getElementById('options');
      while (divOptions.firstChild) {
        divOptions.removeChild(divOptions.firstChild);
      }
      if (sourceSelected.options != undefined) {
        sourceSelected.options.forEach(option => {
          let optionDiv = document.createElement('div');
          optionDiv.classList.add('field');
          let optionLabel = document.createElement('label');
          optionLabel.innerText = option.label;
          optionDiv.append(optionLabel);
          let optionInfo = document.createElement('span');
          optionInfo.innerText= option.info;
          optionDiv.append(optionInfo);
          let optionText = document.createElement('input');
          optionText.setAttribute('type', 'text');
          optionText.setAttribute('url-param', option.param);
          optionDiv.append(optionText);
          divOptions.append(optionDiv);
        })
      }

    });

    this.publish({
      channel: 'source',
      topic: 'getAll'
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }

  loadSources(data) {
    this.sources = data;
    let sourceSelect = this.shadowRoot.getElementById('source-select');
    for (let source of data) {
      let option = document.createElement("option");
      option.innerText = source.name;
      option.value = source.name;
      option.setAttribute('x-url',source.url);
      sourceSelect.append(option);
    }
  }

  setData(data) {

  }
}
window.customElements.define('x-import-catalog', ImportCatalog);
