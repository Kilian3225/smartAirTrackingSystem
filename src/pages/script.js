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
    const history = JSON.parse(localStorage.getItem('locationHistory') || []); // Default to location 0 if no history
    const response = await fetch('/data/locations.json');

    if (!response.ok)
    {
        throw new Error('Fehler beim Laden der Locations');
    }
    const locations = await response.json();

    const sensorInfo = document.querySelector(".sensor-info");
    if (history.length > 0)
    sensorInfo.innerHTML = '<h2>Zuletzt besucht:</h2> <div class="separator"  style="border-bottom: 2px solid var(--bg-nav)" ></div>';


    // Create a container for each location in history
    history.forEach((locationIndex, idx) => {
        const moduleName = locations[locationIndex].topic.split('/').filter(part => part.includes('modul'))[0];

        const locationContainer = document.createElement('div');
        locationContainer.className = 'location-container';

        const moduleElement = document.createElement('h3');
        moduleElement.textContent = moduleName;
        locationContainer.appendChild(moduleElement);

        // Add stats container with iframes
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
        sensorInfo.appendChild(locationContainer);

        document.dispatchEvent(new CustomEvent('grafanaIframesUpdated'));

        // Add separator except after last item
        if (idx < history.length - 1) {
            const separator = document.createElement('div');
            separator.className = 'separator';
            sensorInfo.appendChild(separator);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with default location if no history exists
    if (!localStorage.getItem('locationHistory')) {
        localStorage.setItem('locationHistory', JSON.stringify([]));
    }
    updateGrafanaUrls();
});