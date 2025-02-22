export async function initializeMap(mapDiv, locationViewParameter = 0, singleLocation = false)
{
    const response = await fetch('/data/locations.json');
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Locations');
    }
    const locations = await response.json();

    function createMap() {
        const map = L.map(mapDiv);

        L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        locations.forEach((location, index) => {
            try {
                const markerPos = L.latLng(location.latitude, location.longitude);
                const marker = L.marker(markerPos);

                if (index === locationViewParameter && singleLocation) {
                    // Icon für diesen Marker ändern
                    marker.setIcon(L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
                        shadowSize: [41, 41],
                        shadowAnchor: [12, 41]
                    }));
                }

                marker.addTo(map);

                const popupContent = createPopupContent(location, index);
                marker.bindPopup(popupContent);
            } catch (error) {
                console.error(`Error creating marker for location ${location.name}:`, error);
            }
        });



        map.setView([locations[locationViewParameter].latitude, locations[locationViewParameter].longitude], 13);
    }

    function createPopupContent(location, index) {
        return `
            <div class="popup">
                <div id="line1" class="line">
                    <h4>${location.topic}</h4>
                </div>
                <div id="line2" class="line">
                    <a href="#" onclick="navigateToLocation(${index})">mehr details</a>
                </div>
            </div>
        `;
    }

    createMap();
}

