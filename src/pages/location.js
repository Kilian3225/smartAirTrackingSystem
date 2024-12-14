const selectedLocationIndex = sessionStorage.getItem('selectedLocationIndex');

if (selectedLocationIndex === null) {
    console.error('Kein Standort ausgewählt');
} else {
    // Lade die Standorte aus der JSON-Datei
    const response = await fetch('/data/locations.json');
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Locations');
    }

    const locations = await response.json();
    const selectedLocation = locations[selectedLocationIndex];

    if (!selectedLocation)
    {
        console.error('Ungültiger Standortindex');
    } else
    {
        // Zeige die Details des Standorts an
        document.querySelector('#locationName').textContent = selectedLocation.name;
        document.querySelector('#locationStatus').textContent = selectedLocation.status ? 'Aktiv' : 'Inaktiv';
        document.querySelector('#locationCoordinates').textContent = `${selectedLocation.latitude}, ${selectedLocation.longitude}`;
    }
}