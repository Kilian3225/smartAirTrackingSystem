const checkbox = document.querySelector("#burger");
const menu = document.querySelector(".dropdown-menu");
const overlay = document.querySelector(".overlay");
const logo = document.querySelector('.logo');
checkbox.addEventListener('change', () => {
    if (checkbox.checked) {

        menu.style.height = "108px";
        overlay.style.display = "block";
    } else {
        menu.style.height = "0";
        overlay.style.display = "none";
    }})


logo.addEventListener('click', function()
{
    window.location.href = 'index.html';
});

document.getElementById('close-popup').addEventListener('click', function() {
    document.querySelector('.card').style.display = 'none';
});