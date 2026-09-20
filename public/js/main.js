/**
 * CourierX - Main Client Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Management System
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    const getStoredTheme = () => {
        return localStorage.getItem('theme') || 'light';
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (themeIcon && themeText) {
            if (theme === 'dark') {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark';
            } else {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light';
            }
        }

        // Trigger chart color refresh if charts exist
        if (typeof window.updateChartsTheme === 'function') {
            window.updateChartsTheme(theme);
        }
    };

    // Apply saved theme on page load
    const currentTheme = getStoredTheme();
    applyTheme(currentTheme);

    // Toggle button handler
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = activeTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });
    }

    // 2. Mobile Navigation Hamburger Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 3. Alert Close Buttons
    const alertCloseButtons = document.querySelectorAll('.alert-close');
    alertCloseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alert = e.target.closest('.alert');
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 250);
            }
        });
    });

    // 4. Viva Presentation: Quick Demo Credentials Fill
    const demoButtons = document.querySelectorAll('.demo-fill-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    demoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            const password = btn.getAttribute('data-password');

            if (emailInput && email) emailInput.value = email;
            if (passwordInput && password) passwordInput.value = password;
        });
    });
});
