import { initializeMap } from './map.js';

const mapDiv = document.querySelector('.map');
const selectedLocationIndex = sessionStorage.getItem('selectedLocationIndex');
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

document.addEventListener("DOMContentLoaded", function() {
    try {
        const aggregationTypeSelect = document.getElementById("aggregationType");
        if (!aggregationTypeSelect) {
            console.error("aggregationType Element nicht gefunden");
            return;
        }

        const iframes = document.querySelectorAll(".stat");
        if (iframes.length === 0) {
            console.error("Keine iframes gefunden");
            return;
        }

        console.log("aggregationTypeSelect", aggregationTypeSelect);
        console.log("iframes", iframes);

        aggregationTypeSelect.addEventListener("change", updateGrafanaURL);

        function updateGrafanaURL() {
            try {
                console.log("updateGrafanaURL wurde aufgerufen");
                const aggregationType = aggregationTypeSelect.value;
                console.log("aggregationstype:", aggregationType);

                iframes.forEach((iframe) => {
                    let url = new URL(iframe.src);
                    console.log(url);
                    url.searchParams.set("var-aggregationType", aggregationType);
                    iframe.src = url.toString();
                    console.log(url);
                });
            } catch (error) {
                console.error("Fehler in updateGrafanaURL:", error);
            }
        }
    } catch (error) {
        console.error("Fehler beim Initialisieren:", error);
    }
});
