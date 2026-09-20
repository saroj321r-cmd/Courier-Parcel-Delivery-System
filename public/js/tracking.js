/**
 * CourierX - Tracking Interaction Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const trackingInput = document.getElementById('trackingId');

    if (trackingInput) {
        // Automatically uppercase tracking ID on typing
        trackingInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Copy Tracking ID button
    const copyButtons = document.querySelectorAll('.btn-copy-tracking');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-code');
            if (code) {
                navigator.clipboard.writeText(code).then(() => {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✓ Copied!';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                    }, 2000);
                });
            }
        });
    });
});
