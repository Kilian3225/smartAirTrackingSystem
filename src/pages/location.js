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



function updateGrafanaUrl(event)
{
    const timeRange = timeRangeElement.value;
    const aggregationType = aggregationTypeElement.value;

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

        iframe.src = url.toString();
        console.log("neue src:", iframe.src);
    })
}


