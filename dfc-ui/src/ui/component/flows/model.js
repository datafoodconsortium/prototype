import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import L from 'leaflet'; // Import Leaflet
import leafletcss from 'leaflet/dist/leaflet.css'; // Importer le CSS de Leaflet si nécessaire
// import 'leaflet-arrowheads'; // Importer la bibliothèque leaflet-arrowheads
import dayjs from 'dayjs';
import hash from 'hash.js';
// Importer la bibliothèque
import 'polyline-encoded';

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

    // Add event listener for the button
    // this.shadowRoot.querySelector('#optimizeRouteButton').addEventListener('click', () => {
    //   this.callOptimizeRouteAPI();
    // });

    // Add event listener for changes in hoursInput
    this.shadowRoot.querySelector('#hoursInput').addEventListener('input', () => {
      this.callOptimizeRouteAPI();
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

    // Définir la couche de tuiles en niveaux de gris
    var grayscale = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // Appliquer un filtre CSS pour le niveau de gris
      className: 'grayscale'
    });

    // Ajouter une couche de tuiles OpenStreetMap
    var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    let injectedStyle = document.createElement('style');
    injectedStyle.appendChild(document.createTextNode(leafletcss.toString()));
    this.shadowRoot.appendChild(injectedStyle);

    // Define base layers
    var baseLayers = {
      "Grayscale": grayscale,
      "Streets": streets
    };

    // Define the cities layer (example)
    var needsLayer = L.layerGroup(); // or any other layer definition
    let routesLLayer = L.layerGroup();
    let markersLayer = L.layerGroup(); // Nouveau calque pour les marqueurs

    // Define overlay layers
    var overlays = {
      "Besoin": needsLayer,
      "Solution": routesLLayer,
      "Marqueurs": markersLayer // Ajouter le nouveau calque
    };
    this.routesLayer = routesLLayer;
    this.needsLayer = needsLayer;
    this.markersLayer = markersLayer; // Assigner le nouveau calque

    // Add control to the map
    L.control.layers([], overlays).addTo(this.map);

    // Add needsLayer and markersLayer to the map by default
    this.needsLayer.addTo(this.map);
    this.markersLayer.addTo(this.map); // Afficher le calque des marqueurs par défaut

    // console.log('this.logisticsLayerGroup', this.logisticsLayerGroup);
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
          const destinationMarker = L.marker(destinationLatLng, { icon: this.destinationIcon })
            .bindPopup(`<b>${pickupAddress['dfc-b:city']}</b><br>${pickupAddress['dfc-b:street']}<br>${startDate} - ${endDate}`).openPopup();
          
          // Add destination marker to markersLayer
          this.markersLayer.addLayer(destinationMarker);
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
              const sourceMarker = L.marker(sourceLatLng, { icon: this.sourceIcon })
                .bindPopup(`<b>${address['dfc-b:city']}</b><br>${address['dfc-b:street']}<br>${quantity} ${unit} - ${productName} `).openPopup();
              
              // Add source marker to needsLayer
              this.markersLayer.addLayer(sourceMarker);

              if (pickupAddress) {
                const polyline = L.polyline([sourceLatLng, destinationLatLng], { color: 'blue' });

                // Add the polyline to the polyline group
                this.needsLayer.addLayer(polyline);

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

                // Add polyline to needsLayer
                this.needsLayer.addLayer(polyline);
              }
            }
          }
        });
      }
    });

    // Call the optimization API once the data is set
    this.callOptimizeRouteAPI();
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

  // Function to generate a simple hash from a string
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // Method to call the VERSO API
  async callOptimizeRouteAPI() {
    const apiUrl = 'https://api.verso-optim.com/vrp/v1/solve';
    const apiKey = 'vh61l1mw1b8doqnmjh397jtctq7em81n';

    // Initialize a counter for shipment IDs
    let shipmentIdCounter = 1;

    // Get the start and end of the current day in Unix timestamps
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

    // Get the number of hours from the input
    const hoursInput = this.shadowRoot.querySelector('#hoursInput').value.replace(',', '.'); // Remplacer la virgule par un point
    const hours = parseFloat(hoursInput) || 0; // Utiliser parseFloat pour gérer les décimales

    console.log('hours', hours);

    const endOfDay = startOfDay + (3600 * hours); // Calculate endOfDay based on input

    // Build shipments from orders
    const shipments = this.rawOrders.flatMap(order => {
      const pickupAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
      const sourceParts = order['dfc-b:hasPart']?.filter(part => part['dfc-b:fulfilledBy']?.['dfc-b:constitutedBy']?.['dfc-b:isStoredIn']);

      if (pickupAddress && sourceParts && sourceParts.length > 0) {
        return sourceParts.map(sourcePart => {
          const sourceAddress = sourcePart['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];

          return {
            pickup: {
              id: shipmentIdCounter++, // Use incremented ID for pickup
              location: [parseFloat(sourceAddress['dfc-b:longitude']), parseFloat(sourceAddress['dfc-b:latitude'])],
              time_windows: [[startOfDay, endOfDay]], // Add time window for pickup
              service: 1000
            },
            delivery: {
              id: shipmentIdCounter++, // Use incremented ID for delivery
              location: [parseFloat(pickupAddress['dfc-b:longitude']), parseFloat(pickupAddress['dfc-b:latitude'])],
              time_windows: [[startOfDay, endOfDay]], // Add time window for delivery
              service: 1000
            }
          };
        });
      }
      return [];
    });

    // Create a vehicle for each shipment
    const vehicles = shipments.map((shipment, index) => ({
      id: index + 1,
      start: shipment.pickup.location,
      end: shipment.pickup.location,
    }));

    const requestBody = {
      vehicles: vehicles,
      shipments: shipments
    };

    try {
      const response = await fetch(`${apiUrl}?api_key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      // console.log('API Result:', result);
      this.displayRouteResults(result);
    } catch (error) {
      console.error('Error calling API:', error);
    }
  }

  displayRouteResults(results) {
    // Clear existing routes
    if (this.currentRoutes) {
        this.currentRoutes.forEach(route => this.map.removeLayer(route));
    }
    this.currentRoutes = [];

    // Clear logistics needs when displaying new routes
    this.routesLayer.clearLayers();

    // Hide the needsLayer
    // this.map.removeLayer(this.needsLayer);

    if (results && results.routes && results.routes.length > 0) {
        results.routes.forEach((route, index) => {
            // console.log('route', route);

            // Utiliser L.PolylineUtil.decode pour décoder la géométrie
            const decodedPath = L.PolylineUtil.decode(route.geometry, 5);
            const routeColor = this.getRouteColor(index); // Obtenir la couleur de la route
            const polyline = L.polyline(decodedPath, {
                color: routeColor, // Utiliser la couleur de la route
                weight: 3,
                opacity: 0.7
            });

            this.routesLayer.addLayer(polyline);

            // Add a marker for the first step of the route
            if (route.steps && route.steps.length > 0) {
                const firstStep = route.steps[0];

                // Créer une icône DivIcon avec la couleur de la route
                const customIcon = L.divIcon({
                    html: `<div style="background-color: ${routeColor}; width: 25px; height: 25px; display: flex; justify-content: center; align-items: center; border-radius: 50%;"><span style="color: white; font-size: 16px;">${index + 1}</span></div>`,
                    iconSize: [25, 25],
                    iconAnchor: [12, 0],
                    popupAnchor: [1, -34]
                });

                const marker = L.marker([firstStep.location[1], firstStep.location[0]], { icon: customIcon })
                    .bindPopup(`<b>First Step:</b><br>Type: ${firstStep.type}<br>Arrival: ${new Date(firstStep.arrival * 1000).toLocaleString()}`);
                
                this.routesLayer.addLayer(marker);
            }
        });

        // Ensure the routesLayer is visible
        this.routesLayer.addTo(this.map);
    }
  }

  getRouteColor(index) {
    const colors = ['red', 'blue', 'green', 'orange', 'purple']; // Liste de couleurs
    return colors[index % colors.length]; // Retourner une couleur en fonction de l'index
  }
}

window.customElements.define('x-flows', Flows);
