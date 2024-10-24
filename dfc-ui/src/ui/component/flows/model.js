import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import L from 'leaflet'; // Import Leaflet
import leafletcss from 'leaflet/dist/leaflet.css'; // Importer le CSS de Leaflet si nécessaire
// import 'leaflet-arrowheads'; // Importer la bibliothèque leaflet-arrowheads
import dayjs from 'dayjs';

export default class Flows extends GenericElement {
  constructor() {
    super(view);
    this.subscribe({
      channel: 'order',
      topic: 'changeAll',
      callback: (data) => {
        console.log('data', data);
        this.rawOrders = data;
        this.setDataOrders(data)
      }
    });

    console.log('L.Icon.Default.prototype.options', L.Icon.Default.prototype.options);
    // Utiliser les icônes par défaut de Leaflet
    this.sourceIcon = L.icon({
      iconUrl: "assets/Up.png", // Icône par défaut
      iconSize: [30, 30], // Taille de l'icône
      iconAnchor: [15, 32], // Point d'ancrage de l'icône
      popupAnchor: [1, -34] // Point d'ancrage du popup
    });

    this.destinationIcon = L.icon({
      iconUrl: "assets/Down.png", // Icône par défaut pour la destination
      iconSize: [30, 30],
      iconAnchor: [15, 32],
      popupAnchor: [1, -34]
    });
  }

  setDataOrders(data) {
    console.log('setData', data);

    data.forEach(order => {
      let sourceLatLng, destinationLatLng;
      let pickupAddress = undefined;
      let startDate, endDate;
      const hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];
      if (order['dfc-b:selects'] && order['dfc-b:selects']['dfc-b:pickedUpAt']) {
        const shippinOption = order['dfc-b:selects'];
        console.log('shippinOption', shippinOption);
        startDate = dayjs(shippinOption['dfc-b:startDate']).format('DD/MM/YYYY');
        endDate = dayjs(shippinOption['dfc-b:endDate']).format('DD/MM/YYYY');
        pickupAddress = order['dfc-b:selects']['dfc-b:pickedUpAt']['dfc-b:hasAddress'];
        if (pickupAddress) {
          const lat = parseFloat(pickupAddress['dfc-b:latitude']);
          const lng = parseFloat(pickupAddress['dfc-b:longitude']);
          destinationLatLng = [lat, lng];
          L.marker(destinationLatLng, { icon: this.destinationIcon }).addTo(this.map)
            .bindPopup(`<b>${pickupAddress['dfc-b:city']}</b><br>${pickupAddress['dfc-b:street']}<br>${startDate} - ${endDate}`).openPopup();
        }
      }

      if (order['dfc-b:hasPart']) {
        console.log('order hasPart', order['dfc-b:hasPart']);
        order['dfc-b:hasPart'].forEach(part => {
          console.log('part', part);
          if (part!=null &&  part['dfc-b:fulfilledBy'] && part['dfc-b:fulfilledBy']['dfc-b:constitutedBy'] && part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']) {
            const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
            const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
            const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
            const address = part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];
            if (address) {
              const lat = parseFloat(address['dfc-b:latitude']);
              const lng = parseFloat(address['dfc-b:longitude']);
              sourceLatLng = [lat, lng];
              L.marker(sourceLatLng, { icon: this.sourceIcon }).addTo(this.map)
                .bindPopup(`<b>${address['dfc-b:city']}</b><br>${address['dfc-b:street']}<br>${quantity} ${unit} - ${productName} `).openPopup();

              if (pickupAddress) {
                const polyline = L.polyline([sourceLatLng, destinationLatLng], { color: 'blue' }).addTo(this.map);

                // Create the popup content
                const popupContent = `
                  <b>Source:</b><br>
                  ${address['dfc-b:city']}<br>
                  ${address['dfc-b:street']}<br>
                  ${quantity} ${unit} - ${productName}<br>
                  <br>
                  <b>Destination:</b><br>
                  ${pickupAddress['dfc-b:city']}<br>
                  ${pickupAddress['dfc-b:street']}<br>
                  ${startDate} - ${endDate}<br>
                  <br>
                  <b>Platforme:</b><br>
                  ${hostedBy}
                `;

                // Bind the popup to the polyline
                polyline.bindPopup(popupContent);
              }

            }
          }
        });
      }

    });
  }

  connectedCallback() {
    super.connectedCallback();

    this.publish({
      channel: 'order',
      topic: 'loadAll'
    });

    // Initialiser la carte Leaflet
    this.map = L.map(this.shadowRoot.getElementById('map')).setView([46.603354, 1.888334], 6); // Centré sur la France

    // Ajouter une couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    let injectedStyle = document.createElement('style');
    injectedStyle.appendChild(document.createTextNode(leafletcss.toString()));
    this.shadowRoot.appendChild(injectedStyle);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal);
  }

  setData(data) {
    // Méthode pour définir les données si nécessaire
  }
}

window.customElements.define('x-flows', Flows);
