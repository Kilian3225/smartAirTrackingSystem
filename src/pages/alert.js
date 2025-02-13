// Frontend JavaScript für die Alert-Funktionalität
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.querySelector('.alert input');
    const submitButton = document.querySelector('.alert .button');

    submitButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();

        // E-Mail-Validierung
        if (!isValidEmail(email)) {
            showMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3002/api/alert/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Sie wurden erfolgreich für Benachrichtigungen angemeldet!', 'success');
                emailInput.value = '';
            } else {
                showMessage(data.error || 'Ein Fehler ist aufgetreten', 'error');
            }
        } catch (error) {
            showMessage('Der Server ist derzeit nicht erreichbar', 'error');
            console.error('Fehler:', error);
        }
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showMessage(message, type) {
        // Prüfe ob bereits eine Nachricht existiert und entferne sie
        const existingMessage = document.querySelector('.alert-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Erstelle neue Nachricht
        const messageElement = document.createElement('div');
        messageElement.className = `alert-message ${type}`;
        messageElement.textContent = message;

        // Füge die Nachricht nach dem Button ein
        submitButton.insertAdjacentElement('afterend', messageElement);

        // Entferne die Nachricht nach 5 Sekunden
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }
});