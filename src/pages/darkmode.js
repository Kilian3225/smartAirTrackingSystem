const darkmodeStatus = document.querySelector("#darkmode-status");
const body = document.body;
const logo = document.querySelector('.logo');
const grafanaElements = document.querySelectorAll('.grafana')


darkmodeStatus.addEventListener('change', () => {
    body.classList.toggle('light', darkmodeStatus.checked);
    body.classList.toggle('dark', !darkmodeStatus.checked);
    console.log(darkmodeStatus.checked);

    grafanaElements.forEach(grafanaElement => {
        grafanaElement.src = darkmodeStatus.checked
            ? grafanaElement.src.replace("dark", "light")
            : grafanaElement.src.replace("light", "dark");

        console.log("grafanaElement: " + grafanaElement.src);
    });

    darkmodeStatus.checked
        ? logo.src = "../../images/Logo-black.png"
        : logo.src = "../../images/Logo-white.png";
});