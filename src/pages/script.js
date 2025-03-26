import { initializeMap } from './map.js';

const detailsUrl = "location.html";
window.navigateToLocation = function(locationIndex)
{
    sessionStorage.setItem('selectedLocationIndex', locationIndex);
    updateLocationHistory(locationIndex);
    window.location.href = detailsUrl;  // Navigate to location.html
}

const mapDiv = document.querySelector('.map');
const mapInitializer = function ()
{
    initializeMap(mapDiv, 0);
    mapDiv.removeEventListener('click', mapInitializer);
};

mapDiv.addEventListener('click', mapInitializer);


function updateLocationHistory(locationIndex) {
    let history = JSON.parse(localStorage.getItem('locationHistory') || '[]');

    history = history.filter(item => item !== locationIndex); //prevents duplicate entries

    history.unshift(locationIndex); //adds the new location to the start of the Array


    if (history.length >= 5) {
        history.pop(); //Remove the oldest entry
    }

    localStorage.setItem('locationHistory', JSON.stringify(history));
    localStorage.setItem('lastLocationIndex', locationIndex); // Keep for backward compatibility
}

async function updateGrafanaUrls() {
    // Get both history and nearest location
    const history = JSON.parse(localStorage.getItem('locationHistory') || '[]');
    const nearestModuleId = sessionStorage.getItem('nearestModule');
    const response = await fetch('/data/locations.json');

    if (!response.ok) {
        throw new Error('Fehler beim Laden der Locations');
    }
    const locations = await response.json();

    const sensorInfo = document.querySelector(".sensor-info");
    sensorInfo.innerHTML = '';

    // Add nearest module section if available
    if (nearestModuleId !== null) {
        const nearestContainer = document.createElement('div');
        nearestContainer.innerHTML = '<h2>nächstgelegenes Modul:</h2><div class="separator" style="border-bottom: 2px solid var(--bg-nav)"></div>';
        sensorInfo.appendChild(nearestContainer);

        addLocationToUI(nearestModuleId, locations, sensorInfo);
    }

    // Add history section if available
    if (history.length > 0) {
        const historyContainer = document.createElement('div');
        historyContainer.innerHTML = '<h2>Zuletzt besucht:</h2><div class="separator" style="border-bottom: 2px solid var(--bg-nav)"></div>';
        sensorInfo.appendChild(historyContainer);

        history.forEach((locationIndex, idx) => {
            addLocationToUI(locationIndex, locations, sensorInfo);
            if (idx < history.length - 1) {
                const separator = document.createElement('div');
                separator.className = 'separator';
                sensorInfo.appendChild(separator);
            }
        });
    }
}

function addLocationToUI(locationIndex, locations, parentElement) {
    const moduleName = locations[locationIndex].topic.split('/').filter(part => part.includes('modul'))[0];

    const locationContainer = document.createElement('div');
    locationContainer.className = 'location-container';

    const moduleElement = document.createElement('h3');
    moduleElement.textContent = moduleName;
    locationContainer.appendChild(moduleElement);

    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-container';

    const iframe1 = document.createElement('iframe');
    iframe1.className = 'stat grafana';
    let url1 = new URL("https://grafana.smartairtracking.click:3000/d-solo/cedv7ewwt2k8wd/statistiken?orgId=1&timezone=browser&var-query0=&var-zeitbereich=30d&var-query0-2=&var-aggregationsType=last&theme=dark&panelId=1&__feature.dashboardSceneSolo");
    url1.searchParams.set('var-locationId', (parseInt(locationIndex)+1).toString());
    iframe1.src = url1.toString();

    const iframe2 = document.createElement('iframe');
    iframe2.className = 'stat grafana';
    let url2 = new URL("https://grafana.smartairtracking.click:3000/d-solo/cedv7ewwt2k8wd/statistiken?orgId=1&timezone=browser&var-query0=&var-zeitbereich=30d&var-query0-2=&var-aggregationsType=last&theme=dark&panelId=2&__feature.dashboardSceneSolo");
    url2.searchParams.set('var-locationId', (parseInt(locationIndex)+1).toString());
    iframe2.src = url2.toString();

    statsContainer.appendChild(iframe1);
    statsContainer.appendChild(iframe2);
    locationContainer.appendChild(statsContainer);
    parentElement.appendChild(locationContainer);

    document.dispatchEvent(new CustomEvent('grafanaIframesUpdated'));
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with default location if no history exists
    if (!localStorage.getItem('locationHistory')) {
        localStorage.setItem('locationHistory', JSON.stringify([]));
    }
    updateGrafanaUrls();
});