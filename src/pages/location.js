import { initializeMap } from './map.js';

const mapDiv = document.querySelector('.map');
let selectedLocationIndex = sessionStorage.getItem('selectedLocationIndex');
const detailsUrl = "location.html";

if (selectedLocationIndex === null) {
    console.error('Kein Standort ausgewählt');
}

const response = await fetch('/data/locations.json');

if (!response.ok)
{
    throw new Error('Fehler beim Laden der Locations');
}

const locations = await response.json();
const selectedLocation = locations[selectedLocationIndex];

console.log(selectedLocation);

if (selectedLocationIndex !== null) {
    initializeMap(mapDiv, parseInt(selectedLocationIndex), true);
}

window.navigateToLocation = function(locationIndex)
{
    sessionStorage.setItem('selectedLocationIndex', locationIndex);
    window.location.href = detailsUrl;  // Navigate to location.html
}

const timeRangeElement = document.getElementById('timeRange');
const aggregationTypeElement = document.getElementById('aggregationType');

timeRangeElement.addEventListener('change', updateGrafanaUrl)
aggregationTypeElement.addEventListener('change', updateGrafanaUrl)

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

function updateGrafanaUrl(event)
{
    const timeRange = timeRangeElement.value;
    const aggregationType = aggregationTypeElement.value;

    const fromTime = timeRangeToMilliseconds(timeRange);
    const toTime = Date.now();

    // const sessionStorage.getItem('selectedLocationIndex');
    let iframeSelector = '';
    if (event.target === aggregationTypeElement)
        iframeSelector = 'iframe.stat.grafana';
    else
        iframeSelector = 'iframe.grafana';

    const iframes = document.querySelectorAll(iframeSelector);

    iframes.forEach(iframe =>
    {
        console.log("alte src:",iframe.src);
        let url = new URL(iframe.src);

        url.searchParams.set('var-zeitbereich', timeRange);
        url.searchParams.set('var-aggregationsType', aggregationType);
        url.searchParams.set('var-locationId', (parseInt(selectedLocationIndex)+1).toString());
        url.searchParams.set('from', fromTime.toString());
        url.searchParams.set('to', toTime.toString());

        iframe.src = url.toString();
        console.log("neue src:", iframe.src);
    })
}

window.onload = () => {
    console.log("window.onload ausgelöst");

    if (!timeRangeElement || !aggregationTypeElement) {
        console.error("timeRangeElement oder aggregationTypeElement nicht gefunden");
        return;
    }

    console.log("updateGrafanaUrl wird aufgerufen...");
    updateGrafanaUrl(new Event('change'));
    console.log("updateGrafanaUrl wurde aufgerufen");
};

