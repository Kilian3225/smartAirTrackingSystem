import { initializeMap } from './map.js';

const detailsUrl = "location.html";
window.navigateToLocation = function(locationIndex)
{
    sessionStorage.setItem('selectedLocationIndex', locationIndex);
    localStorage.setItem('lastLocationIndex', locationIndex);
    window.location.href = detailsUrl;  // Navigate to location.html
}

const mapDiv = document.querySelector('.map');
const mapInitializer = function ()
{
    initializeMap(mapDiv, 0);
    mapDiv.removeEventListener('click', mapInitializer);
};

mapDiv.addEventListener('click', mapInitializer);


function updateGrafanaUrls()
{
    const iframes = document.querySelectorAll('.stat');

    iframes.forEach(iframe =>
    {
        let url = new URL(iframe.src);
        url.searchParams.set('var-locationId', (parseInt(localStorage.getItem('lastLocationIndex'))+1).toString());
        iframe.src = url.toString();
    })
}

document.addEventListener('DOMContentLoaded', function() {
    updateGrafanaUrls();
});


async function setLastLocationIndex() {
    if (localStorage.getItem('lastLocationIndex') === null)
    {
        localStorage.setItem('lastLocationIndex', "0");
        console.log(localStorage.getItem('lastLocationIndex'));
    }

    const response = await fetch('/data/locations.json');
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Locations');
    }
    const locations = await response.json();

    const moduleName = locations[localStorage.getItem('lastLocationIndex')].topic.split('/').filter(part => part.includes('modul'))[0];

    document.querySelector(".sensor-info").insertAdjacentHTML('afterbegin', `<h2>${moduleName}</h2>`);
}

setLastLocationIndex();

