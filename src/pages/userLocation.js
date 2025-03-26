let nearestModuleId = sessionStorage.getItem('nearestModule');

function initNearestModule()
{
        navigator.geolocation.getCurrentPosition(
            (position) =>
            {
                findNearestModule(
     {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) =>
            {
                console.error("Geolocation error:", error.message);
            },
        );
}

async function findNearestModule(userCoords)
{
    try
    {
        const response = await fetch('/data/locations.json');
        const modules = await response.json();

        let newNearestModuleId = nearestModuleId || null;
        let minDistance = Infinity;
        if (nearestModuleId !== null)
            minDistance = getDistance(userCoords, { lat: modules[newNearestModuleId].latitude, lng: modules[newNearestModuleId].longitude });

        modules.forEach(module =>
        {
            const distance = getDistance(userCoords, { lat: module.latitude, lng: module.longitude });
            if (distance < minDistance)
            {
                minDistance = distance;
                newNearestModuleId = parseInt(module.topic.match(/modul-(\d+)/)[1] ) -1;
            }
        });

        sessionStorage.setItem('nearestModule',newNearestModuleId);
    } catch (error) {
        console.error("Failed to load modules:", error);
    }
}

// Haversine formula (unchanged)
function getDistance(userCoords, moduleCoords) {
    const R = 6371;
    const dLat = (moduleCoords.lat - userCoords.lat) * (Math.PI / 180);
    const dLng = (moduleCoords.lng - userCoords.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userCoords.lat * (Math.PI / 180)) *
        Math.cos(moduleCoords.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('nearestModule')) {
        initNearestModule();
    }
    // if permissionStatus.state === 'granted' || permissionStatus.state === 'prompt'
});

document.getElementById('reset-geo').addEventListener('click', function() {
    sessionStorage.removeItem('nearestModule');
    nearestModuleId = null;
    initNearestModule();
});