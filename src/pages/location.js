import { initializeMap } from './map.js';

const mapDiv = document.querySelector('.map');
const selectedLocationIndex = sessionStorage.getItem('selectedLocationIndex');
const line1Element = document.querySelector('#line1');
const line2Element = document.querySelector('#line2');

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

