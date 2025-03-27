const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

function initNearestModule()
{
    navigator.geolocation.getCurrentPosition(
        (position) =>
        {
            findNearestModule(
 {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }).then(() =>
            {
                // Only reload if we actually found a new nearest module
                if (sessionStorage.getItem('nearestModule') !== null)
                {
                    window.location.reload();
                }
            });
        },
        (error) =>
        {
            console.error("Geolocation error:", error.message);
            sessionStorage.removeItem('nearestModule');
            window.location.reload();
        }
    );
}
async function findNearestModule(userCoords)
{
    try
    {
        const nearestModuleId = sessionStorage.getItem('nearestModule');
        const response = await fetch('/data/locations.json');
        const modules = await response.json();

        let newNearestModuleId = nearestModuleId;
        let minDistance = Infinity;
        if (nearestModuleId !== null) {
            minDistance = getDistance(userCoords,
                {
                lat: modules[nearestModuleId].latitude,
                lng: modules[nearestModuleId].longitude
            });
        }

        modules.forEach(module =>
        {
            const distance = getDistance(userCoords,
{
                lat: module.latitude,
                lng: module.longitude
            });
            if (distance < minDistance)
            {
                minDistance = distance;
                newNearestModuleId = parseInt(module.topic.match(/modul-(\d+)/)[1]) - 1;
            }
        });

        sessionStorage.setItem('nearestModule', newNearestModuleId);
    } catch (error) {
        console.error("Failed to load modules:", error);
    }
}

// Haversine formula
function getDistance(userCoords, moduleCoords)
{
    const radius = 6371;
    const dLat = (moduleCoords.lat - userCoords.lat) * (Math.PI / 180);
    const dLng = (moduleCoords.lng - userCoords.lng) * (Math.PI / 180);
    const haversineComponent =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userCoords.lat * (Math.PI / 180)) *
        Math.cos(moduleCoords.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const centralAngle = 2 * Math.atan2(Math.sqrt(haversineComponent), Math.sqrt(1 - haversineComponent));
    return radius * centralAngle;
}

// Initialize
document.addEventListener('DOMContentLoaded', () =>
{
    // Check permission state on page load
    handlePermissionState(permissionStatus.state);

    // Listen for permission state changes
    permissionStatus.onchange = () => {
        console.log("Geolocation permission changed to:", permissionStatus.state);
        handlePermissionState(permissionStatus.state);
        window.location.reload();
    };
});

// Handle the reset-geo button click
document.getElementById('reset-geo').addEventListener('click', function() {
    sessionStorage.removeItem('nearestModule');
    initNearestModule();
});
document.getElementById('reset-geo-dropdown').addEventListener('click', function() {
    sessionStorage.removeItem('nearestModule');
    initNearestModule();
});

function handlePermissionState(state) {
    switch(state) {
        case 'granted':
            initNearestModule();
            break;
        case 'prompt':
            initNearestModule();
            break;
        case 'denied':
            sessionStorage.removeItem('nearestModule');
            break;
    }
}