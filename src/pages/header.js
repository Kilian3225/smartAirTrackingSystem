const checkbox = document.querySelector("#burger");
const menu = document.querySelector(".dropdown-menu");
const overlay = document.querySelector(".overlay");
const logo = document.querySelector('.logo');
checkbox.addEventListener('change', () => {
    if (checkbox.checked) {

        menu.style.height = "auto";
        overlay.style.display = "block";
    } else {
        menu.style.height = "0";
        overlay.style.display = "none";
    }})

logo.addEventListener('click', function()
{
    window.location.href = 'index.html';
});