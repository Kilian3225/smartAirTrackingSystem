

const detailsUrl = "location.html";
const mapDiv = document.querySelector('.map');

window.navigateToLocation = function(locationIndex)
{
    sessionStorage.setItem('selectedLocationIndex', locationIndex);
    window.location.href = detailsUrl;  // Navigate to location.html

}

function createPopupContent(location, index)
{
    return `
        <div class="popup">
            <div id="line1" class="line">
                <h4>${location.name}</h4>
            </div>
            <div id="line2" class="line">
                <div class="circle"></div>
                <p></p>
            </div>
            <div id="line3" class="line">
                <a href="#" onclick="navigateToLocation(${index})">>mehr details</a>
            </div>
        </div>
    `;
}

function updatePopupStatus(popup, location)
{
    const circle = popup.querySelector('.circle');
    const p = popup.querySelector('p');

    if (location.status)
    {
        circle.style.backgroundColor = 'green';
        p.textContent = 'Aktiv';
    } else
    {
        circle.style.backgroundColor = 'red';
        p.textContent = 'Inaktiv';
    }
}

const response = await fetch('/data/locations.json');
if (!response.ok) {
    throw new Error('Fehler beim Laden der Locations');
}
const locations = await response.json();

function createMap()
{
    // Create map instance
    const map = L.map(mapDiv);

    // Add OSM tile layer to the Leaflet map
    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'})
        .addTo(map);

    // Iterate over each location and create markers
    locations.forEach((location, index) =>
    {
        try {
            // Create marker
            const markerPos = L.latLng(location.latitude, location.longitude);
            const marker = L.marker(markerPos);

            // Add marker to map
            marker.addTo(map);

            // Create and bind popup
            const popupContent = createPopupContent(location, index);
            marker.bindPopup(popupContent);

            // Add popup open event listener
            marker.on('popupopen', (e) =>
            {
                const popupElement = e.popup.getElement();
                if (popupElement) {
                    updatePopupStatus(popupElement, location);
                }
            });
        } catch (error) {
            console.error(`Error creating marker for location ${location.name}:`, error);
        }
    });

    // Set map view to first location's position
    map.setView([locations[0].latitude, locations[0].longitude], 13);
    mapDiv.removeEventListener('click', createMap);
}

mapDiv.addEventListener('click', createMap);
createMap();




