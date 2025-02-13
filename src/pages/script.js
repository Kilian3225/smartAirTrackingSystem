import { initializeMap } from './map.js';

const detailsUrl = "location.html";
window.navigateToLocation = function(locationIndex)
{
    sessionStorage.setItem('selectedLocationIndex', locationIndex);
    window.location.href = detailsUrl;  // Navigate to location.html
}


const mapDiv = document.querySelector('.map');
const mapInitializer = function ()
{
    initializeMap(mapDiv, 0);
    mapDiv.removeEventListener('click', mapInitializer);
};

mapDiv.addEventListener('click', mapInitializer);



