import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import L from 'leaflet'; // Import Leaflet
import leafletcss from 'leaflet/dist/leaflet.css'; // Importer le CSS de Leaflet si nécessaire
// import 'leaflet-arrowheads'; // Importer la bibliothèque leaflet-arrowheads
import dayjs from 'dayjs';
import 'polyline-encoded';
import config from '../../../../configuration.js';
import DataGrid from 'devextreme/ui/data_grid';
import dxcss from 'devextreme/dist/css/dx.light.css';

export default class Flows extends GenericElement {
  constructor() {
    super(view);
    this.subscribe({
      channel: 'order',
      topic: 'changeAll',
      callback: (data) => {
        this.rawOrders = data;
        this.setDataOrders(data)
      }
    });

    this.subscribe({
      channel: 'route',
      topic: 'changeAll',
      callback: (data) => {
        this.routes = data;
        this.setRoutes(data);
      }
    }); 

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

    // Add button click event listener
    this.shadowRoot.querySelector('#optimizeButton').addEventListener('click', () => {
      this.callOptimizeRouteAPI();
    });

    // Define opacity variables
    this.defaultOpacity = 0.8;
    this.transparentOpacity = 0.4;

    this.platformColorMap = {}; // Map to store platform-color associations
    this.platformColorIndex = 0; // Index to track the next color to use for platforms

    this.routeColorMap = {}; // Map to store route-color associations
    this.routeColorIndex = 0; // Index to track the next color to use for routes

    this.colors = ['red', 'blue', 'green', 'orange', 'purple']; // Common list of colors
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

    let injectedStyle2   = document.createElement('style');
    injectedStyle2.appendChild(document.createTextNode(dxcss.toString()));
    this.shadowRoot.appendChild(injectedStyle2);

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
    this.markersLayer.addTo(this.map); // Afficher le calque des marqueurs par défaut

    // Generate the legend
    this.generateLegend();


    // Nouveau calque pour les éléments temporaires
    this.tempLayer = L.layerGroup().addTo(this.map);
  }


  setDataOrders(data) {

    // Array to store all marker positions
    const allLatLngs = [];

    data.forEach(order => {
      let sourceLatLng, destinationLatLng;
      let pickupAddress = undefined;
      let startDate, endDate;
      const hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];

      // Define color based on platform
      const platformColor = this.getPlatformColor(hostedBy);

      if (order['dfc-b:selects'] && order['dfc-b:selects']['dfc-b:pickedUpAt']) {
        const shippinOption = order['dfc-b:selects'];
        startDate = dayjs(shippinOption['dfc-b:startDate']).format('DD/MM/YYYY');
        endDate = dayjs(shippinOption['dfc-b:endDate']).format('DD/MM/YYYY');
        pickupAddress = order['dfc-b:selects']['dfc-b:pickedUpAt']['dfc-b:hasAddress'];
        if (pickupAddress) {
          const lat = parseFloat(pickupAddress['dfc-b:latitude']);
          const lng = parseFloat(pickupAddress['dfc-b:longitude']);
          destinationLatLng = [lat, lng];
          allLatLngs.push(destinationLatLng); // Add destination to array

          // Create a custom icon for the destination marker
          const destinationMarkerIcon = L.divIcon({
            html: `<div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 20px solid ${platformColor}; background-color: transparent; box-shadow: none;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 20],
            popupAnchor: [0, -20],
            className: '' // Ensure no default class is applied
          });

          const destinationMarker = L.marker(destinationLatLng, { icon: destinationMarkerIcon })
            .bindPopup(`<b>${pickupAddress['dfc-b:city']}</b><br>${pickupAddress['dfc-b:street']}<br>${startDate} - ${endDate}`).openPopup();

          // Add a unique ID to the marker
          // destinationMarker._leaflet_id = `delivery-${order.id}`;
          this.markersLayer.addLayer(destinationMarker);
        }
      }

      if (order['dfc-b:hasPart']) {
        order['dfc-b:hasPart'].forEach(part => {
          if (part!=null &&  part['dfc-b:fulfilledBy'] && part['dfc-b:fulfilledBy']['dfc-b:constitutedBy'] && part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']) {
            const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
            const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
            const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
            const address = part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];
            if (address) {
              const lat = parseFloat(address['dfc-b:latitude']);
              const lng = parseFloat(address['dfc-b:longitude']);
              sourceLatLng = [lat, lng];
              allLatLngs.push(sourceLatLng); // Add source to array

              // Create a custom icon for the source marker
              const sourceMarkerIcon = L.divIcon({
                html: `<div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid ${platformColor}; background-color: transparent; box-shadow: none;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 20],
                popupAnchor: [0, -20],
                className: '' // Ensure no default class is applied
              });

              const sourceMarker = L.marker(sourceLatLng, { icon: sourceMarkerIcon })
                .bindPopup(`<b>${address['dfc-b:city']}</b><br>${address['dfc-b:street']}<br>${quantity} ${unit} - ${productName} `).openPopup();

              // Add a unique ID to the marker
              // sourceMarker._leaflet_id = `pickup-${order.id}`;
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

    // Fit the map to the bounds of all markers
    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      this.map.fitBounds(bounds);
    }

    // Call the optimization API once the data is set
    // this.callOptimizeRouteAPI();

    // Generate the legend dynamically
    this.generateLegend();
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
    // Clear the platform and route color maps to avoid rendering obsolete data
    this.routeColorMap = {};

    const optimisationTimeWindow = this.shadowRoot.querySelector('#hoursInput').value;

    this.publish({
      channel: 'order',
      topic: 'optimize',
      data: {
        optimisationTimeWindow
      }
    }); 

  }

  async setRoutes(data) {

    this.displayRouteResults(data);

    this.generateLegend();
  }

  displayRouteResults(results) {
    // Clear existing routes
    if (this.currentRoutes) {
        this.currentRoutes.forEach(route => this.map.removeLayer(route.polyline));
    }
    this.currentRoutes = [];

    // Clear logistics needs when displaying new routes
    this.routesLayer.clearLayers();
    const routes = Array.isArray(results) ? results : [results];

    if (routes) {
      routes.forEach((route, index) => {
          const decodedPath = L.PolylineUtil.decode(route['dfc-b:geometry'], 5);
          const routeColor = this.getRouteColor(index);
          const polyline = L.polyline(decodedPath, {
                color: routeColor,
                weight: 3,
                opacity: this.defaultOpacity
            });

            this.routesLayer.addLayer(polyline);

            // Store the polyline and route details
            this.currentRoutes.push({
                polyline: polyline,
                details: route // Store the entire route details
            });

            if (route['dfc-b:steps'] && route['dfc-b:steps'].length > 0) {
                const firstStep = route['dfc-b:steps'][0];
                const lastStep = route['dfc-b:steps'][route['dfc-b:steps'].length - 1]; // Get the last step
                const customIcon = L.divIcon({
                    html: `<div style="background-color: ${routeColor}; width: 25px; height: 25px; display: flex; justify-content: center; align-items: center; border-radius: 50%; box-shadow: none;"><span style="color: white; font-size: 16px;">${index + 1}</span></div>`,
                    iconSize: [25, 25],
                    iconAnchor: [12, 0],
                    popupAnchor: [1, -34],
                    className: '' // Ensure no default class is applied
                });

                const marker = L.marker([firstStep['dfc-b:geo'][1], firstStep['dfc-b:geo'][0]], { icon: customIcon })
                    .bindPopup(`<b>Route:</b><br>Start: ${new Date(firstStep['dfc-b:arrival'] * 1000).toLocaleString()}<br>End: ${new Date(lastStep['dfc-b:arrival']  * 1000).toLocaleString()}`)
                    .on('click', () => {
                        const isAnyTransparent = this.currentRoutes.some(r => r.polyline.options.opacity === this.transparentOpacity);
                        const isCurrentTransparent = polyline.options.opacity === this.transparentOpacity;

                        if (!isAnyTransparent) {
                            this.currentRoutes.forEach((r, i) => {
                                if (i !== index) {
                                    r.polyline.setStyle({ opacity: this.transparentOpacity });
                                }
                            });
                        } else if (!isCurrentTransparent) {
                            this.currentRoutes.forEach(r => r.polyline.setStyle({ opacity: this.defaultOpacity }));
                        } else {
                            this.currentRoutes.forEach((r, i) => {
                                if (i === index) {
                                    r.polyline.setStyle({ opacity: this.defaultOpacity });
                                } else {
                                    r.polyline.setStyle({ opacity: this.transparentOpacity });
                                }
                            });
                        }
                    });

                this.routesLayer.addLayer(marker);
            }
        });

        // Ensure the routesLayer is visible
        this.routesLayer.addTo(this.map);
    }
  }

  getRouteColor(route) {
    if (!this.routeColorMap[route]) {
      // Assign the next color in the list to the route
      this.routeColorMap[route] = this.colors[this.routeColorIndex % this.colors.length];
      this.routeColorIndex++; // Move to the next color for routes
    }
    return this.routeColorMap[route]; // Return the assigned color
  }

  getPlatformColor(platform) {
    if (!this.platformColorMap[platform]) {
      // Assign the next color in the list to the platform
      this.platformColorMap[platform] = this.colors[this.platformColorIndex % this.colors.length];
      this.platformColorIndex++; // Move to the next color for platforms
    }
    return this.platformColorMap[platform]; // Return the assigned color
  }

  generateLegend() {
    // Clear existing items in legend sections
    this.shadowRoot.querySelector('#platformLegend .legend-items').innerHTML = '';
    this.shadowRoot.querySelector('#routeLegend .legend-items').innerHTML = '';

    // Generate Platform Legend
    Object.entries(this.platformColorMap).forEach(([platform, color]) => {
      const item = this.createLegendItem(platform, color);
      this.shadowRoot.querySelector('#platformLegend .legend-items').appendChild(item);
    });

    // Show optimization section if we have data
    const optimizationSection = this.shadowRoot.getElementById('optimizationSection');
    if (this.rawOrders && this.rawOrders.length > 0) {
      optimizationSection.style.display = 'block';
    }

    // Generate Route Legend
    Object.entries(this.routeColorMap).forEach(([route, color]) => {
      const item = this.createLegendItem(`Route ${parseInt(route) + 1}`, color);
      this.shadowRoot.querySelector('#routeLegend .legend-items').appendChild(item);
    });
  }

  createLegendItem(label, color) {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const legendContent = document.createElement('div');
    legendContent.className = 'legend-content';

    const colorSpan = document.createElement('span');
    colorSpan.style.backgroundColor = color;
    colorSpan.style.width = '20px';
    colorSpan.style.height = '20px';
    colorSpan.style.display = 'inline-block';
    legendContent.appendChild(colorSpan);

    const labelText = document.createElement('span');
    labelText.textContent = ` ${label}`;
    labelText.style.marginLeft = '10px';
    legendContent.appendChild(labelText);

    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Details';
    toggleButton.style.marginLeft = '10px';
    legendContent.appendChild(toggleButton);

    item.appendChild(legendContent);

    const detailsContainer = document.createElement('div');
    detailsContainer.style.display = 'none';
    detailsContainer.style.marginTop = '10px';
    item.appendChild(detailsContainer);

    toggleButton.addEventListener('click', () => {
      if (detailsContainer.style.display === 'none') {
        detailsContainer.style.display = 'block';
        toggleButton.textContent = 'Hide Details';
        if (label.startsWith('Route')) {
          this.createRouteDetailsGrid(detailsContainer, parseInt(label.split(' ')[1]) - 1, toggleButton);
        } else {
          this.createPlatformDetailsGrid(detailsContainer, label, toggleButton);
        }
      } else {
        detailsContainer.style.display = 'none';
        toggleButton.textContent = 'Show Details';
        detailsContainer.innerHTML = '';
      }
    });

    return item;
  }

  createPlatformDetailsGrid(container, platform, toggleButton) {
    const gridContainer = document.createElement('div');
    gridContainer.style.marginTop = '10px';

    const detailsData = [];
    // Collect all coordinates for the platform
    const allCoordinates = [];

    this.rawOrders.forEach(order => {
        const hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];
        if (hostedBy === platform) {
            const deliveryAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
            order['dfc-b:hasPart'].forEach(part => {
                const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
                const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
                const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
                const pickupAddress = part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];

                const pickupLatLng = [parseFloat(pickupAddress['dfc-b:latitude']), parseFloat(pickupAddress['dfc-b:longitude'])];
                const deliveryLatLng = [parseFloat(deliveryAddress['dfc-b:latitude']), parseFloat(deliveryAddress['dfc-b:longitude'])];
                
                allCoordinates.push(pickupLatLng, deliveryLatLng);

                detailsData.push({
                    pickup: pickupAddress['dfc-b:city'],
                    delivery: deliveryAddress['dfc-b:city'],
                    orderLine: `${quantity} ${unit} - ${productName}`,
                    pickupLatLng,
                    deliveryLatLng
                });
            });
        }
    });

    const grid = new DataGrid(gridContainer, {
        dataSource: detailsData,
        columns: [
            { dataField: 'pickup', caption: 'Pickup' },
            { dataField: 'delivery', caption: 'Delivery' },
            { dataField: 'orderLine', caption: 'Order Lines' }
        ],
        showRowLines: true,
        showBorders: true,
        hoverStateEnabled: true,
        onCellHoverChanged: (e) => {
            if (e.rowType === 'data') {
                const data = e.data;
                if (e.eventType === 'mouseover') {
                    this.tempLayer.clearLayers();
                    const markerPickup = L.marker(data.pickupLatLng, { icon: this.sourceIcon });
                    const markerDelivery = L.marker(data.deliveryLatLng, { icon: this.destinationIcon });
                    this.tempLayer.addLayer(markerPickup);
                    this.tempLayer.addLayer(markerDelivery);
                    e.component.markers = [markerPickup, markerDelivery];
                } else {
                    this.tempLayer.clearLayers();
                    if (e.component.markers) {
                        e.component.markers.forEach(marker => this.tempLayer.removeLayer(marker));
                        e.component.markers = null;
                    }
                }
            }
        }
    });

    // Add hover events for the entire grid container
    gridContainer.addEventListener('mouseenter', () => {
        if (allCoordinates.length > 0) {
            const bounds = L.latLngBounds(allCoordinates);
            this.map.fitBounds(bounds, {
                padding: [10, 10],
                maxZoom: 15
            });
        }
    });

    container.appendChild(gridContainer);
  }

  createRouteDetailsGrid(container, routeIndex, toggleButton) {
    const gridContainer = document.createElement('div');
    container.appendChild(gridContainer);

    let detailsData = [];
    const allCoordinates = [];
    
    const route = this.currentRoutes[routeIndex];
    if (route && route.details['dfc-b:steps']) {
        route.details['dfc-b:steps'].forEach(step => {
            const locationInfo = this.getLocationInfoByShipmentId(step);
            if (locationInfo.lat && locationInfo.lng) {
                allCoordinates.push([locationInfo.lat, locationInfo.lng]);
            }
            if (locationInfo.cityPickupLat && locationInfo.cityPickupLng) {
                allCoordinates.push([locationInfo.cityPickupLat, locationInfo.cityPickupLng]);
            }
            
            detailsData.push({
                type: locationInfo.type,
                city: locationInfo.city,
                orderLines: locationInfo.orderLines.map(line => `${line.quantity} ${line.unit} - ${line.productName}`).join('\n'),
                hostedBy: locationInfo.hostedBy,
                origin: locationInfo.cityPickup,
                lat: locationInfo.lat,
                lng: locationInfo.lng,
                cityPickupLat: locationInfo.cityPickupLat,
                cityPickupLng: locationInfo.cityPickupLng
            });
        });
    }
    detailsData = detailsData.filter(step => step.type === 'pickup' || step.type === 'delivery');

    const grid = new DataGrid(gridContainer, {
        dataSource: detailsData,
        columns: [
            { dataField: 'type', caption: 'Type' },
            { dataField: 'city', caption: 'City' },
            { dataField: 'orderLines', caption: 'Order Lines' },
            { dataField: 'hostedBy', caption: 'Platform' },
            { dataField: 'origin', caption: 'Origin' }
        ],
        showRowLines: true,
        showBorders: true,
        hoverStateEnabled: true,
        onCellHoverChanged: (e) => {
            if (e.rowType === 'data') {
                const data = e.data;
                if (e.eventType === 'mouseover') {
                    this.tempLayer.clearLayers();
                    const markers = [];

                    if (data.cityPickupLat != null && data.cityPickupLng != null) {
                        const markerPickup = L.marker([data.cityPickupLat, data.cityPickupLng], { icon: this.sourceIcon });
                        markers.push(markerPickup);
                        this.tempLayer.addLayer(markerPickup);
                        
                        const markerDelivery = L.marker([data.lat, data.lng], { icon: this.destinationIcon });
                        markers.push(markerDelivery);
                        this.tempLayer.addLayer(markerDelivery);
                    } else {
                        const markerDelivery = L.marker([data.lat, data.lng], { icon: this.sourceIcon });
                        markers.push(markerDelivery);
                        this.tempLayer.addLayer(markerDelivery);
                    }

                    e.component.markers = markers;
                } else {
                    this.tempLayer.clearLayers();
                    e.component.markers = null;
                }
            }
        }
    });

    // Add hover events for the entire grid container
    gridContainer.addEventListener('mouseenter', () => {
        if (allCoordinates.length > 0) {
            const bounds = L.latLngBounds(allCoordinates);
            this.map.fitBounds(bounds, {
                padding: [10, 10],
                maxZoom: 15
            });
        }
    });
  }

  getLocationInfoByShipmentId(step) {
    // const { id: shipmentId, type } = step;
    let info = {
      city: '',
      street: '',
      lat: null,
      lng: null,
      cityPickup: '',
      cityPickupLat: null,
      cityPickupLng: null,
      orderLines: [],

    };

    let chipment;
    let type;
    if (step['dfc-b:pickup']){
      chipment = step['dfc-b:pickup'];
      info.type = 'pickup';
      info.city = chipment['dfc-b:startAt']['dfc-b:city'];
      info.street = chipment['dfc-b:startAt']['dfc-b:street'];
      info.lat = parseFloat(chipment['dfc-b:startAt']['dfc-b:latitude']);
      info.lng = parseFloat(chipment['dfc-b:startAt']['dfc-b:longitude']);
      info.hostedBy = chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:partOf']['dfc-t:hostedBy']['rdfs:label'];
      const orderLine = {
        quantity: chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:hasQuantity']['dfc-b:value'],
        unit: chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l => l['@language'] == 'fr')?.['@value'],
        productName: chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:concerns']['dfc-b:offers']['dfc-b:references']['dfc-b:name']
      }
      info.orderLines.push(orderLine);
    } else if (step['dfc-b:delivery']){
      chipment = step['dfc-b:delivery'];
      info.type = 'delivery';
      info.city = chipment['dfc-b:endAt']['dfc-b:city'];
      info.street = chipment['dfc-b:endAt']['dfc-b:street'];
      info.lat = parseFloat(chipment['dfc-b:endAt']['dfc-b:latitude']);
      info.lng = parseFloat(chipment['dfc-b:endAt']['dfc-b:longitude']);
      info.cityPickup = chipment['dfc-b:startAt']['dfc-b:city'];
      info.cityPickupLat = parseFloat(chipment['dfc-b:startAt']['dfc-b:latitude']);
      info.cityPickupLng = parseFloat(chipment['dfc-b:startAt']['dfc-b:longitude']); 
      info.hostedBy = chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:partOf']['dfc-t:hostedBy']['rdfs:label'];
      const orderLine = {
        quantity: chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:hasQuantity']['dfc-b:value'],
        unit: chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:hasQuantity']['dfc-b:hasUnit']['skos:prefLabel'].find(l => l['@language'] == 'fr')?.['@value'],
        productName: chipment['dfc-b:transports']['dfc-b:constitutes']['dfc-b:fulfills']['dfc-b:concerns']['dfc-b:offers']['dfc-b:references']['dfc-b:name']
      }
      info.orderLines.push(orderLine);
    }

    return info;
  }

  // // Add a new method to get order line information
  // getOrderLineInfo(location, type) {
  //   let info = '';
  //   this.rawOrders.forEach(order => {
  //     const pickupAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
  //     const sourceParts = order['dfc-b:hasPart']?.filter(part => part['dfc-b:fulfilledBy']?.['dfc-b:constitutedBy']?.['dfc-b:isStoredIn']);

  //     if (type === 'pickup' && pickupAddress) {
  //       const lat = parseFloat(pickupAddress['dfc-b:latitude']);
  //       const lng = parseFloat(pickupAddress['dfc-b:longitude']);
  //       if (lat === location[1] && lng === location[0]) {
  //         // Add orderLine details
  //         order['dfc-b:hasPart'].forEach(part => {
  //           const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
  //           const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
  //           const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
  //           info += `${quantity} ${unit} - ${productName}<br>`;
  //         });
  //       }
  //     }

  //     if (type === 'destination' && sourceParts) {
  //       sourceParts.forEach(sourcePart => {
  //         const sourceAddress = sourcePart['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];
  //         const lat = parseFloat(sourceAddress['dfc-b:latitude']);
  //         const lng = parseFloat(sourceAddress['dfc-b:longitude']);
  //         if (lat === location[1] && lng === location[0]) {
  //           // Add orderLine details
  //           const productName = sourcePart['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
  //           const quantity = sourcePart['dfc-b:hasQuantity']?.['dfc-b:value'];
  //           const unit = sourcePart['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
  //           info += `${quantity} ${unit} - ${productName}<br>`;
  //         }
  //       });
  //     }
  //   });
  //   return info;
  // }


}

window.customElements.define('x-flows', Flows);
