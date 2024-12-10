import GenericElement from '../../core/genericElement.js';
import view from 'html-loader!./view.html';
import L from 'leaflet'; // Import Leaflet
import leafletcss from 'leaflet/dist/leaflet.css'; // Importer le CSS de Leaflet si nécessaire
// import 'leaflet-arrowheads'; // Importer la bibliothèque leaflet-arrowheads
import dayjs from 'dayjs';
import 'polyline-encoded';
import config from '../../../../configuration.js';

export default class Flows extends GenericElement {
  constructor() {
    super(view);
    this.subscribe({
      channel: 'order',
      topic: 'changeAll',
      callback: (data) => {
        // console.log('data', data);
        this.rawOrders = data;
        this.setDataOrders(data)
      }
    });

    // console.log('L.Icon.Default.prototype.options', L.Icon.Default.prototype.options);
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

    // console.log('this.logisticsLayerGroup', this.logisticsLayerGroup);

    // Nouveau calque pour les éléments temporaires
    this.tempLayer = L.layerGroup().addTo(this.map);
  }


  setDataOrders(data) {
    // console.log('setData', data);

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
        console.log('shippinOption', shippinOption);
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
        // console.log('order hasPart', order['dfc-b:hasPart']);
        order['dfc-b:hasPart'].forEach(part => {
          console.log('__part', part);
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
    this.callOptimizeRouteAPI();

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
    
    const apiUrl = 'https://api.verso-optim.com/vrp/v1/solve';
    const apiKey = config.verso.apiKey;

    // Initialize a counter for shipment IDs
    let shipmentIdCounter = 1;

    // Get the start and end of the current day in Unix timestamps
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

    // Get the number of hours from the input
    const hoursInput = this.shadowRoot.querySelector('#hoursInput').value.replace(',', '.'); // Remplacer la virgule par un point
    const hours = parseFloat(hoursInput) || 0; // Utiliser parseFloat pour gérer les décimales

    // console.log('hours', hours);

    const endOfDay = startOfDay + (3600 * hours); // Calculate endOfDay based on input

    // Build shipments from orders
    const shipments = this.rawOrders.flatMap(order => {
      const pickupAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
      const sourceParts = order['dfc-b:hasPart']?.filter(part => part['dfc-b:fulfilledBy']?.['dfc-b:constitutedBy']?.['dfc-b:isStoredIn']);

      if (pickupAddress && sourceParts && sourceParts.length > 0) {
        return sourceParts.map(sourcePart => {
          const sourceAddress = sourcePart['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];

          // Create shipment and add shipmentId to the order line
          const pickupId = shipmentIdCounter++;
          const deliveryId = shipmentIdCounter++;
          sourcePart.pickupShipmentId = pickupId; // Add pickupShipmentId to the part
          sourcePart.deliveryShipmentId = deliveryId; // Add deliveryShipmentId to the part

          return {
            pickup: {
              id: pickupId, // Use incremented ID for pickup
              location: [parseFloat(sourceAddress['dfc-b:longitude']), parseFloat(sourceAddress['dfc-b:latitude'])],
              time_windows: [[startOfDay, endOfDay]], // Add time window for pickup
              service: 1000
            },
            delivery: {
              id: deliveryId, // Use incremented ID for delivery
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

      // Generate the legend dynamically after routes are processed
      this.generateLegend();
    } catch (error) {
      console.error('Error calling API:', error);
    }
  }

  displayRouteResults(results) {
    // Clear existing routes
    if (this.currentRoutes) {
        this.currentRoutes.forEach(route => this.map.removeLayer(route.polyline));
    }
    this.currentRoutes = [];

    // Clear logistics needs when displaying new routes
    this.routesLayer.clearLayers();

    if (results && results.routes && results.routes.length > 0) {
        results.routes.forEach((route, index) => {
            const decodedPath = L.PolylineUtil.decode(route.geometry, 5);
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

            if (route.steps && route.steps.length > 0) {
                const firstStep = route.steps[0];
                const lastStep = route.steps[route.steps.length - 1]; // Get the last step
                const customIcon = L.divIcon({
                    html: `<div style="background-color: ${routeColor}; width: 25px; height: 25px; display: flex; justify-content: center; align-items: center; border-radius: 50%; box-shadow: none;"><span style="color: white; font-size: 16px;">${index + 1}</span></div>`,
                    iconSize: [25, 25],
                    iconAnchor: [12, 0],
                    popupAnchor: [1, -34],
                    className: '' // Ensure no default class is applied
                });

                const marker = L.marker([firstStep.location[1], firstStep.location[0]], { icon: customIcon })
                    .bindPopup(`<b>Route:</b><br>Start: ${new Date(firstStep.arrival * 1000).toLocaleString()}<br>End: ${new Date(lastStep.arrival * 1000).toLocaleString()}`)
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
    const legendContainer = this.shadowRoot.getElementById('legendContainer');
    legendContainer.innerHTML = ''; // Clear existing legend content

    // Create a legend for platforms
    const platformLegend = document.createElement('div');
    const platformTitle = document.createElement('h3');
    platformTitle.textContent = 'Platform';
    platformLegend.appendChild(platformTitle);

    Object.entries(this.platformColorMap).forEach(([platform, color]) => {
        const item = document.createElement('div');

        const colorSpan = document.createElement('span');
        colorSpan.style.backgroundColor = color;
        colorSpan.style.width = '20px';
        colorSpan.style.height = '20px';
        colorSpan.style.display = 'inline-block';
        item.appendChild(colorSpan);

        const platformText = document.createElement('span');
        platformText.textContent = ` ${platform}`;
        item.appendChild(platformText);

        // Create a button to toggle details
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Details';
        toggleButton.style.marginLeft = '10px';

        // Create a container for details
        const details = this.getPlatformDetails(platform);
        details.style.display = 'none'; // Hide details by default

        // Add event listener to toggle button
        toggleButton.addEventListener('click', () => {
            if (details.style.display === 'none') {
                details.style.display = 'block';
                toggleButton.textContent = 'Hide Details';
            } else {
                details.style.display = 'none';
                toggleButton.textContent = 'Show Details';
            }
        });

        // Add click event to fit map bounds on colorSpan and platformText
        [colorSpan, platformText].forEach(element => {
            element.addEventListener('click', () => {
                const allLatLngs = this.getPlatformLatLngs(platform);
                if (allLatLngs.length > 0) {
                    const bounds = L.latLngBounds(allLatLngs);
                    this.map.fitBounds(bounds);
                }
            });
        });

        item.appendChild(toggleButton);
        item.appendChild(details);
        platformLegend.appendChild(item);
    });
    legendContainer.appendChild(platformLegend);

    // Create a legend for routes
    const routeLegend = document.createElement('div');
    const routeTitle = document.createElement('h3');
    routeTitle.textContent = 'Route';
    routeLegend.appendChild(routeTitle);

    Object.entries(this.routeColorMap).forEach(([route, color]) => {
        const item = document.createElement('div');

        const colorSpan = document.createElement('span');
        colorSpan.style.backgroundColor = color;
        colorSpan.style.width = '20px';
        colorSpan.style.height = '20px';
        colorSpan.style.display = 'inline-block';
        item.appendChild(colorSpan);

        const routeText = document.createElement('span');
        routeText.textContent = ` Route ${parseInt(route) + 1}`;
        item.appendChild(routeText);

        // Create a button to toggle route details
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Details';
        toggleButton.style.marginLeft = '10px';

        // Create a container for route details
        const stepsDetails = this.getRouteStepsDetails(route);
        stepsDetails.style.display = 'none'; // Hide details by default

        // Add event listener to toggle button
        toggleButton.addEventListener('click', () => {
            if (stepsDetails.style.display === 'none') {
                stepsDetails.style.display = 'block';
                toggleButton.textContent = 'Hide Details';
            } else {
                stepsDetails.style.display = 'none';
                toggleButton.textContent = 'Show Details';
            }
        });

        // Add click event to fit map bounds on colorSpan and routeText
        [colorSpan, routeText].forEach(element => {
            element.addEventListener('click', () => {
                const allLatLngs = this.getRouteLatLngs(route);
                if (allLatLngs.length > 0) {
                    const bounds = L.latLngBounds(allLatLngs);
                    this.map.fitBounds(bounds);
                }
            });
        });

        item.appendChild(toggleButton);
        item.appendChild(stepsDetails);
        routeLegend.appendChild(item);
    });
    legendContainer.appendChild(routeLegend);
  }

  // Helper method to get all LatLngs for a platform
  getPlatformLatLngs(platform) {
    const allLatLngs = [];
    this.rawOrders.forEach(order => {
        const hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];
        if (hostedBy === platform) {
            const deliveryAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
            order['dfc-b:hasPart'].forEach(part => {
                const pickupAddress = part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];
                if (pickupAddress && deliveryAddress) {
                    allLatLngs.push(
                        [parseFloat(pickupAddress['dfc-b:latitude']), parseFloat(pickupAddress['dfc-b:longitude'])],
                        [parseFloat(deliveryAddress['dfc-b:latitude']), parseFloat(deliveryAddress['dfc-b:longitude'])]
                    );
                }
            });
        }
    });
    return allLatLngs;
  }

  // Helper method to get all LatLngs for a route
  getRouteLatLngs(routeIndex) {
    const allLatLngs = [];
    const route = this.currentRoutes[routeIndex];
    if (route && route.details.steps) {
        route.details.steps.forEach(step => {
            const locationInfo = this.getLocationInfoByShipmentId(step);
            if (locationInfo.lat && locationInfo.lng) {
                allLatLngs.push([locationInfo.lat, locationInfo.lng]);
            }
        });
    }
    return allLatLngs;
  }

  getPlatformDetails(platform) {
    const detailsContainer = document.createElement('div');
    const detailsTable = document.createElement('table');
    detailsTable.style.borderCollapse = 'collapse';
    detailsTable.style.width = '100%';

    const headerRow = document.createElement('tr');
    ['Pickup', 'Delivery', 'Order Lines'].forEach(headerText => {
      const th = document.createElement('th');
      th.style.border = '1px solid black';
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    detailsTable.appendChild(headerRow);

    // Array to store all marker positions
    const allLatLngs = [];

    this.rawOrders.forEach(order => {
      const hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];
      if (hostedBy === platform) {
        const deliveryAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];

        for (const part of order['dfc-b:hasPart']) {
          const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
          const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
          const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
          const pickupAddress = part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];

          const row = document.createElement('tr');
          row.style.borderBottom = '1px solid black';

          // Collect marker positions
          if (pickupAddress && deliveryAddress) {
            const pickupLatLng = [parseFloat(pickupAddress['dfc-b:latitude']), parseFloat(pickupAddress['dfc-b:longitude'])];
            const deliveryLatLng = [parseFloat(deliveryAddress['dfc-b:latitude']), parseFloat(deliveryAddress['dfc-b:longitude'])];
            allLatLngs.push(pickupLatLng, deliveryLatLng);
          }

          row.addEventListener('mouseover', (e) => {
            if (pickupAddress && deliveryAddress) {
              const pickupLatLng = [parseFloat(pickupAddress['dfc-b:latitude']), parseFloat(pickupAddress['dfc-b:longitude'])];
              const deliveryLatLng = [parseFloat(deliveryAddress['dfc-b:latitude']), parseFloat(deliveryAddress['dfc-b:longitude'])];

              // Add markers for pickup and delivery
              const markerPickup = L.marker(pickupLatLng, { icon: this.sourceIcon });
              this.tempLayer.addLayer(markerPickup);
              row.markerPickup = markerPickup;

              const markerDelivery = L.marker(deliveryLatLng, { icon: this.destinationIcon });
              this.tempLayer.addLayer(markerDelivery);
              row.markerDelivery = markerDelivery;
            }

            row.style.backgroundColor = '#f0f0f0';
          });

          row.addEventListener('mouseout', (e) => {
            if (row.markerPickup) {
              this.tempLayer.removeLayer(row.markerPickup);
              row.markerPickup = null;
            }
            if (row.markerDelivery) {
              this.tempLayer.removeLayer(row.markerDelivery);
              row.markerDelivery = null;
            }
            row.style.backgroundColor = '';
          });

          const pickupCell = document.createElement('td');
          pickupCell.textContent = pickupAddress['dfc-b:city'];
          row.appendChild(pickupCell);

          const deliveryCell = document.createElement('td');
          deliveryCell.textContent = deliveryAddress['dfc-b:city'];
          row.appendChild(deliveryCell);

          const orderLineCell = document.createElement('td');
          orderLineCell.textContent = `${quantity} ${unit} - ${productName}`;
          row.appendChild(orderLineCell);

          detailsTable.appendChild(row);
        }
      }
    });

    // Fit the map to the bounds of all markers on table mouseover
    detailsTable.addEventListener('mouseover', () => {
      if (allLatLngs.length > 0) {
        const bounds = L.latLngBounds(allLatLngs);
        this.map.fitBounds(bounds);
      }
    });

    detailsContainer.appendChild(detailsTable);
    return detailsContainer;
  }

  getRouteStepsDetails(routeIndex) {
    const detailsTable = document.createElement('table');
    detailsTable.style.borderCollapse = 'collapse';
    detailsTable.style.width = '100%';

    const headerRow = document.createElement('tr');
    ['Type', 'City', 'Order Lines','platform', 'Origin'].forEach(headerText => {
        const th = document.createElement('th');
        th.style.border = '1px solid black';
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    detailsTable.appendChild(headerRow);

    const route = this.currentRoutes[routeIndex];
    const allLatLngs = []; // Array to store all marker positions

    if (route && route.details.steps) {
        route.details.steps.forEach(step => {
            const locationInfo = this.getLocationInfoByShipmentId(step);
            const orderLines = locationInfo.orderLines.map(line => `${line.quantity} ${line.unit} - ${line.productName}`).join('<br>');
            const hostedBy = locationInfo.hostedBy;
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid black';

            [step.type, locationInfo.city, orderLines,hostedBy, locationInfo.cityPickup].forEach(cellText => {
                const td = document.createElement('td');
                td.style.border = '1px solid black';
                td.textContent = cellText;
                row.appendChild(td);
            });

            // Collect marker positions
            if (locationInfo.lat && locationInfo.lng) {
                allLatLngs.push([locationInfo.lat, locationInfo.lng]);
            }

            row.addEventListener('mouseover', () => {
                if (locationInfo.cityPickup) {
                    const markerPickup = L.marker([locationInfo.cityPickupLat, locationInfo.cityPickupLng], { icon: this.sourceIcon });
                    this.tempLayer.addLayer(markerPickup);
                    row.markerPickup = markerPickup; 
                     
                    const markerDelivery = L.marker([locationInfo.lat, locationInfo.lng], { icon: this.destinationIcon });
                    this.tempLayer.addLayer(markerDelivery);
                    row.markerDelivery = markerDelivery; 
                } else if (locationInfo.city) {
                    const markerPickup = L.marker([locationInfo.lat, locationInfo.lng], { icon: this.sourceIcon });
                    this.tempLayer.addLayer(markerPickup);
                    row.markerPickup = markerPickup;
                }
                row.style.backgroundColor = '#f0f0f0';
            });

            row.addEventListener('mouseout', () => {
                if (row.markerPickup) {
                    this.tempLayer.removeLayer(row.markerPickup);
                    row.markerPickup = null;
                }
                if (row.markerDelivery) {
                    this.tempLayer.removeLayer(row.markerDelivery);
                    row.markerDelivery = null;
                }
                row.style.backgroundColor = '';
            });

            detailsTable.appendChild(row);
        });
    }

    // Fit the map to the bounds of all markers on table mouseover
    detailsTable.addEventListener('mouseover', () => {
        if (allLatLngs.length > 0) {
            const bounds = L.latLngBounds(allLatLngs);
            this.map.fitBounds(bounds);
        }
    });

    return detailsTable;
  }

  getLocationInfoByShipmentId(step) {
    const { id: shipmentId, type } = step;
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

    this.rawOrders.forEach(order => {
      const pickupAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
      const sourceParts = order['dfc-b:hasPart']?.filter(part => part['dfc-b:fulfilledBy']?.['dfc-b:constitutedBy']?.['dfc-b:isStoredIn']);

      // console.log('order', order);  
      if (type === 'delivery' && pickupAddress) {
        order['dfc-b:hasPart'].forEach(part => {
          // console.log('part', part);
          if (part.deliveryShipmentId === shipmentId) {
            info.hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];
            info.city = pickupAddress['dfc-b:city'];
            info.street = pickupAddress['dfc-b:street'];
            info.lat = parseFloat(pickupAddress['dfc-b:latitude']);
            info.lng = parseFloat(pickupAddress['dfc-b:longitude']);
            info.cityPickup = part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress']['dfc-b:city'];
            info.cityPickupLat = parseFloat(part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress']['dfc-b:latitude']);
            info.cityPickupLng = parseFloat(part['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress']['dfc-b:longitude']);
            const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
            const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
            const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
            info.orderLines.push({ quantity, unit, productName });
          }
        });
      }

      if (type === 'pickup' && sourceParts) {
        sourceParts.forEach(sourcePart => {
          if (sourcePart.pickupShipmentId === shipmentId) {
            info.hostedBy = order['dfc-t:hostedBy']?.['rdfs:label'];
            const sourceAddress = sourcePart['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];
            info.city = sourceAddress['dfc-b:city'];
            info.street = sourceAddress['dfc-b:street'];
            info.lat = parseFloat(sourceAddress['dfc-b:latitude']);
            info.lng = parseFloat(sourceAddress['dfc-b:longitude']);
            const productName = sourcePart['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
            const quantity = sourcePart['dfc-b:hasQuantity']?.['dfc-b:value'];
            const unit = sourcePart['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
            info.orderLines.push({ quantity, unit, productName });
          }
        });
      }
    });
    return info;
  }

  // Add a new method to get order line information
  getOrderLineInfo(location, type) {
    let info = '';
    this.rawOrders.forEach(order => {
      const pickupAddress = order['dfc-b:selects']?.['dfc-b:pickedUpAt']?.['dfc-b:hasAddress'];
      const sourceParts = order['dfc-b:hasPart']?.filter(part => part['dfc-b:fulfilledBy']?.['dfc-b:constitutedBy']?.['dfc-b:isStoredIn']);

      if (type === 'pickup' && pickupAddress) {
        const lat = parseFloat(pickupAddress['dfc-b:latitude']);
        const lng = parseFloat(pickupAddress['dfc-b:longitude']);
        if (lat === location[1] && lng === location[0]) {
          // Add orderLine details
          order['dfc-b:hasPart'].forEach(part => {
            const productName = part['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
            const quantity = part['dfc-b:hasQuantity']?.['dfc-b:value'];
            const unit = part['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
            info += `${quantity} ${unit} - ${productName}<br>`;
          });
        }
      }

      if (type === 'destination' && sourceParts) {
        sourceParts.forEach(sourcePart => {
          const sourceAddress = sourcePart['dfc-b:fulfilledBy']['dfc-b:constitutedBy']['dfc-b:isStoredIn']['dfc-b:hasAddress'];
          const lat = parseFloat(sourceAddress['dfc-b:latitude']);
          const lng = parseFloat(sourceAddress['dfc-b:longitude']);
          if (lat === location[1] && lng === location[0]) {
            // Add orderLine details
            const productName = sourcePart['dfc-b:concerns']?.['dfc-b:offers']?.['dfc-b:references']?.['dfc-b:name'];
            const quantity = sourcePart['dfc-b:hasQuantity']?.['dfc-b:value'];
            const unit = sourcePart['dfc-b:hasQuantity']?.['dfc-b:hasUnit']?.['skos:prefLabel']?.find(l => l['@language'] == 'fr')?.['@value'];
            info += `${quantity} ${unit} - ${productName}<br>`;
          }
        });
      }
    });
    return info;
  }


}

window.customElements.define('x-flows', Flows);
