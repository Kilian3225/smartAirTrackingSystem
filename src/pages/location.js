import { initializeMap } from './map.js';

const mapDiv = document.querySelector('.map');
let selectedLocationIndex = sessionStorage.getItem('selectedLocationIndex');
const detailsUrl = "location.html";

if (selectedLocationIndex === null) {
    console.error('Kein Standort ausgewählt');
}

// Use an immediately invoked async function to set up the page
(async function initializePage() {
    try {
        const response = await fetch('/data/locations.json');

        if (!response.ok) {
            throw new Error('Fehler beim Laden der Locations');
        }

        const locations = await response.json();
        const selectedLocation = locations[selectedLocationIndex];

        console.log(selectedLocation);

        if (selectedLocationIndex !== null) {
            initializeMap(mapDiv, parseInt(selectedLocationIndex), true);
        }

        // Initialize Grafana URLs with current parameters instead of reloading
        updateGrafanaUrlInitial();
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
})();

window.navigateToLocation = function(locationIndex) {
    sessionStorage.setItem('selectedLocationIndex', locationIndex);
    window.location.href = detailsUrl;  // Navigate to location.html
}

const timeRangeElement = document.getElementById('timeRange');
const aggregationTypeElement = document.getElementById('aggregationType');

// Only add event listeners if elements exist
if (timeRangeElement) {
    timeRangeElement.addEventListener('change', function(event) {
        updateGrafanaUrl(event, 'iframe.grafana');
    });
}

if (aggregationTypeElement) {
    aggregationTypeElement.addEventListener('change', function(event) {
        updateGrafanaUrl(event, 'iframe.stat.grafana');
    });
}

function timeRangeToMilliseconds(range) {
    const now = Date.now();
    const timeMap = {
        '1h': 3600000,
        '6h': 21600000,
        '12h': 43200000,
        '24h': 86400000,
        '2d': 172800000,
        '7d': 604800000,
        '30d': 2592000000
    };
    return timeMap[range] ? now - timeMap[range] : now - 86400000; // Standard: 1 Tag
}

// Initial URL setup without triggering reload
function updateGrafanaUrlInitial() {
    if (!timeRangeElement || !aggregationTypeElement) {
        console.error("timeRangeElement oder aggregationTypeElement nicht gefunden");
        return;
    }

    const timeRange = timeRangeElement.value;
    const aggregationType = aggregationTypeElement.value;

    updateIframeUrls('iframe.grafana', timeRange, aggregationType);
    updateIframeUrls('iframe.stat.grafana', timeRange, aggregationType);

    console.log("Grafana URLs wurden initial konfiguriert");
}

// Update function used for both initial setup and change events
function updateGrafanaUrl(event, iframeSelector) {
    const timeRange = timeRangeElement.value;
    const aggregationType = aggregationTypeElement.value;

    updateIframeUrls(iframeSelector, timeRange, aggregationType);
}

// Helper function to update iframe URLs
function updateIframeUrls(iframeSelector, timeRange, aggregationType) {
    const fromTime = timeRangeToMilliseconds(timeRange);
    const toTime = Date.now();

    const iframes = document.querySelectorAll(iframeSelector);

    iframes.forEach(iframe => {
        // Check if the iframe already has a src attribute
        if (iframe.getAttribute('src')) {
            console.log("Aktualisiere src:", iframe.src);
            let url = new URL(iframe.src);

            url.searchParams.set('var-zeitbereich', timeRange);
            url.searchParams.set('var-aggregationsType', aggregationType);
            url.searchParams.set('var-locationId', (parseInt(selectedLocationIndex)+1).toString());
            url.searchParams.set('from', fromTime.toString());
            url.searchParams.set('to', toTime.toString());

            iframe.src = url.toString();
            console.log("Neue src:", iframe.src);
        } else {
            console.log("Iframe hat noch keine src, wird übersprungen");
        }
    });
}