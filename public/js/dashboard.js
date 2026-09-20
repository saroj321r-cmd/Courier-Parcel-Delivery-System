/**
 * CourierX - Dashboard & Interactive Forms Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Estimated Delivery Charge Calculation on Booking Form
    const bookingForm = document.getElementById('book-parcel-form');
    const weightInput = document.getElementById('weight');
    const pickupPincodeInput = document.getElementById('pickupPincode');
    const dropPincodeInput = document.getElementById('dropPincode');
    const estimateDisplay = document.getElementById('live-estimate-amount');
    const estimateBreakdown = document.getElementById('live-estimate-breakdown');

    if (bookingForm && weightInput && pickupPincodeInput && dropPincodeInput && estimateDisplay) {
        let debounceTimer;

        const updateEstimate = async () => {
            const weight = parseFloat(weightInput.value);
            const pickup = pickupPincodeInput.value.trim();
            const drop = dropPincodeInput.value.trim();

            if (isNaN(weight) || weight <= 0) {
                estimateDisplay.textContent = '₹0';
                if (estimateBreakdown) estimateBreakdown.textContent = 'Enter weight & pincodes to calculate';
                return;
            }

            try {
                const response = await fetch('/customer/calculate-charge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ weight, pickupPincode: pickup, dropPincode: drop })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        estimateDisplay.textContent = `₹${data.estimatedCharge}`;
                        if (estimateBreakdown) {
                            estimateBreakdown.textContent = `Base ₹${data.baseCharge} × ${data.multiplier}x (${data.zoneType})`;
                        }
                    }
                }
            } catch (err) {
                console.error('Estimate preview error:', err);
            }
        };

        const handleInput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateEstimate, 300);
        };

        weightInput.addEventListener('input', handleInput);
        pickupPincodeInput.addEventListener('input', handleInput);
        dropPincodeInput.addEventListener('input', handleInput);

        // Run initial calculation if fields are pre-filled
        if (weightInput.value) {
            updateEstimate();
        }
    }

    // 2. Agent Status Update - Dynamic Failure Reason Toggle
    const nextStatusSelect = document.getElementById('nextStatus');
    const failureReasonGroup = document.getElementById('failure-reason-group');
    const failureReasonSelect = document.getElementById('failureReason');

    if (nextStatusSelect && failureReasonGroup) {
        nextStatusSelect.addEventListener('change', () => {
            if (nextStatusSelect.value === 'FAILED') {
                failureReasonGroup.style.display = 'block';
                if (failureReasonSelect) failureReasonSelect.setAttribute('required', 'required');
            } else {
                failureReasonGroup.style.display = 'none';
                if (failureReasonSelect) {
                    failureReasonSelect.removeAttribute('required');
                    failureReasonSelect.value = '';
                }
            }
        });
    }

    // 3. Status Filter Redirection for Tables
    const statusFilterSelect = document.getElementById('table-status-filter');
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', (e) => {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('status', e.target.value);
            window.location.href = currentUrl.toString();
        });
    }
});
