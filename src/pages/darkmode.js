const darkmodeStatus = document.querySelector("#darkmode-status");
const theme = localStorage.getItem("theme");
const body = document.body;
const logo = document.querySelector('.logo');
const grafanaElements = document.querySelectorAll('.grafana');

// Initialisierungsfunktion
function initializeTheme() {
    const isLightMode = theme === 'light';

    // Setze das Theme auf Basis des LocalStorage
    body.classList.toggle('light', isLightMode);
    body.classList.toggle('dark', !isLightMode);
    darkmodeStatus.checked = isLightMode;

    // Aktualisiere die Grafana-Elemente
    grafanaElements.forEach(grafanaElement => {
        grafanaElement.src = grafanaElement.src.replace(
            isLightMode ? "dark" : "light",
            isLightMode ? "light" : "dark"
        );
    });

    // Setze das korrekte Logo
    logo.src = isLightMode ? "../../images/Logo-black.png" : "../../images/Logo-white.png";
}

// Event-Listener für Änderungen des Darkmode-Status
darkmodeStatus.addEventListener('change', () => {
    const isLightMode = darkmodeStatus.checked;

    // Aktualisiere Klassen für das Theme
    body.classList.toggle('light', isLightMode);
    body.classList.toggle('dark', !isLightMode);

    // Aktualisiere Grafana-Elemente
    grafanaElements.forEach(grafanaElement => {
        grafanaElement.src = grafanaElement.src.replace(
            isLightMode ? "dark" : "light",
            isLightMode ? "light" : "dark"
        );
    });

    // Speichere das aktuelle Theme in LocalStorage
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');

    // Aktualisiere das Logo
    logo.src = isLightMode ? "../../images/Logo-black.png" : "../../images/Logo-white.png";
});

// Initialisiere das Theme bei Seiten-Neuladen
initializeTheme();
