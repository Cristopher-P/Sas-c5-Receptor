document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const errorText = document.getElementById('error-text');

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // UI Helpers
    function showError(message) {
        errorText.textContent = message;
        loginMessage.style.display = 'flex';
        
        // Restart animation
        loginMessage.style.animation = 'none';
        loginMessage.offsetHeight; /* trigger reflow */
        loginMessage.style.animation = 'shake 0.5s';
    }

    function hideError() {
        loginMessage.style.display = 'none';
    }

    // Input Listeners
    usernameInput.addEventListener('input', () => {
        usernameInput.style.borderColor = ''; // Reset to CSS default
        hideError();
    });

    passwordInput.addEventListener('input', () => {
        passwordInput.style.borderColor = '';
        hideError();
    });

    // Form Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const btn = loginForm.querySelector('button');

        // Validation
        if (!username) {
            showError('El usuario es requerido');
            usernameInput.style.borderColor = '#ef4444';
            usernameInput.focus();
            return;
        }

        if (!password) {
            showError('La contraseña es requerida');
            passwordInput.style.borderColor = '#ef4444';
            passwordInput.focus();
            return;
        }

        // Loading State
        const originalBtnContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Validando credenciales...';
        btn.disabled = true;
        hideError();

        try {
            // API Call
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Success State
                btn.innerHTML = '<i class="fas fa-check"></i> Acceso concedido';
                btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #166534 100%)';
                
                await new Promise(resolve => setTimeout(resolve, 800));
                window.location.href = '/'; // Redirect to Dashboard
            } else {
                throw new Error(data.message || 'Credenciales incorrectas');
            }

        } catch (error) {
            // Reset Button
            btn.innerHTML = originalBtnContent;
            btn.disabled = false;
            btn.style.background = ''; // Reset to CSS default verification

            showError(error.message);
            
            // Shake inputs on error (visual feedback)
            usernameInput.style.borderColor = '#ef4444';
            passwordInput.style.borderColor = '#ef4444';
        }
    });
});
