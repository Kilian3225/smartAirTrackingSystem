// Email subscription handler with custom threshold settings
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email-input');
    const pm25Input = document.getElementById('pm25-input');
    const pm10Input = document.getElementById('pm10-input');
    const submitButton = document.querySelector('.alert .button');

    // Default threshold values
    const DEFAULT_PM25_THRESHOLD = 50;
    const DEFAULT_PM10_THRESHOLD = 80;

    submitButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();

        // Validate email
        if (!isValidEmail(email)) {
            showMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error');
            return;
        }

        // Get threshold values (use defaults if empty)
        const pm25 = pm25Input.value.trim() !== '' ? parseInt(pm25Input.value) : DEFAULT_PM25_THRESHOLD;
        const pm10 = pm10Input.value.trim() !== '' ? parseInt(pm10Input.value) : DEFAULT_PM10_THRESHOLD;

        // Validate thresholds are numbers
        if (isNaN(pm25) || isNaN(pm10)) {
            showMessage('Schwellenwerte müssen Zahlen sein.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    thresholds: {
                        pm25,
                        pm10
                    }
                })
            });

            const data = await response.json();
            console.log(data);
            if (data.success)
            {
                showMessage('Ihre E-Mail wurde erfolgreich registriert!', 'success');
                emailInput.value = '';
                pm25Input.value = '';
                pm10Input.value = '';
            } else
            {
                showMessage(data.message || 'Ein Fehler ist aufgetreten.', 'error');
            }
        } catch (error) {
            showMessage('Verbindungsfehler. Bitte versuchen Sie es später erneut.', 'error');
            console.error('Subscription error:', error);
        }
    });

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show message to user
    function showMessage(message, type) {
        // Create message element if it doesn't exist
        let messageEl = document.querySelector('.alert-message');
        if (!messageEl) {
            messageEl = document.createElement('p');
            messageEl.className = 'alert-message';
            document.querySelector('.alert').appendChild(messageEl);
        }

        // Set message content and style
        messageEl.textContent = message;
        messageEl.className = `alert-message ${type}`;

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'alert-message';
        }, 5000);
    }
});