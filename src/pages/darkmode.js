const darkmodeStatus = document.querySelector("#darkmode-status");
const body = document.body;
const logo = document.querySelector('.logo');

function initializeTheme() {
    const currentTheme = localStorage.getItem("theme"); // Fresh read!
    const isLightMode = currentTheme === 'light';

    // Update UI
    body.classList.toggle('light', isLightMode);
    body.classList.toggle('dark', !isLightMode);
    darkmodeStatus.checked = isLightMode;
    logo.src = isLightMode ? "../../images/Logo-black.png" : "../../images/Logo-white.png";

    // Update Grafana iframes (re-queried)
    const grafanaElements = document.querySelectorAll('.grafana');
    grafanaElements.forEach(iframe => {
        iframe.src = iframe.src.replace(
            isLightMode ? "dark" : "light",
            isLightMode ? "light" : "dark"
        );
    });
}

// Toggle handler
darkmodeStatus.addEventListener('change', () => {
    const isLightMode = darkmodeStatus.checked;
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
    initializeTheme(); // Explicitly update
});

// Initialize on load + listen for dynamic iframes
initializeTheme();
document.addEventListener('grafanaIframesUpdated', initializeTheme);