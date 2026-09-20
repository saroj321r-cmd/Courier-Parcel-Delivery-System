const DeliveryZone = require('../models/DeliveryZone');

/**
 * Calculate estimated delivery charge based on weight and delivery zones.
 * 
 * Weight pricing:
 * 0–1 kg:  ₹50
 * 1–3 kg:  ₹80
 * 3–5 kg:  ₹120
 * 5+ kg:   ₹160 (plus ₹20 per additional kg over 5)
 * 
 * Zone Multipliers:
 * Local (same zone/pincode cluster): 1.0
 * Nearby (both pincodes found in active zones): 1.25
 * Other (inter-zone / unmapped): 1.5
 * 
 * @param {number} weight - Weight of the parcel in kg
 * @param {string} pickupPincode - 6-digit pickup pincode
 * @param {string} dropPincode - 6-digit drop pincode
 * @returns {Promise<{ estimatedCharge: number, baseCharge: number, multiplier: number, zoneType: string }>}
 */
const calculateCharge = async (weight, pickupPincode, dropPincode) => {
    const numWeight = parseFloat(weight) || 1;

    // Determine Base Weight Charge
    let baseCharge = 50;
    if (numWeight <= 1) {
        baseCharge = 50;
    } else if (numWeight <= 3) {
        baseCharge = 80;
    } else if (numWeight <= 5) {
        baseCharge = 120;
    } else {
        const extraWeight = Math.ceil(numWeight - 5);
        baseCharge = 160 + (extraWeight * 20);
    }

    let multiplier = 1.0;
    let zoneType = 'Local';

    try {
        if (pickupPincode && dropPincode) {
            const cleanPickup = String(pickupPincode).trim();
            const cleanDrop = String(dropPincode).trim();

            if (cleanPickup === cleanDrop) {
                multiplier = 1.0;
                zoneType = 'Intra-City Local';
            } else {
                // Check if either or both are in registered delivery zones
                const pickupZone = await DeliveryZone.findOne({ pincodes: cleanPickup, isActive: true });
                const dropZone = await DeliveryZone.findOne({ pincodes: cleanDrop, isActive: true });

                if (pickupZone && dropZone) {
                    if (pickupZone._id.equals(dropZone._id)) {
                        multiplier = pickupZone.baseMultiplier || 1.0;
                        zoneType = `Local (${pickupZone.name})`;
                    } else {
                        multiplier = Math.max(pickupZone.baseMultiplier, dropZone.baseMultiplier, 1.25);
                        zoneType = `Nearby (${pickupZone.name} to ${dropZone.name})`;
                    }
                } else if (pickupZone || dropZone) {
                    const activeZone = pickupZone || dropZone;
                    multiplier = activeZone.baseMultiplier || 1.25;
                    zoneType = `Regional (${activeZone.name})`;
                } else {
                    multiplier = 1.5;
                    zoneType = 'Standard Inter-State';
                }
            }
        }
    } catch (err) {
        console.error('Error calculating zone multiplier:', err);
        multiplier = 1.0;
        zoneType = 'Default Rate';
    }

    const estimatedCharge = Math.round(baseCharge * multiplier);

    return {
        estimatedCharge,
        baseCharge,
        multiplier,
        zoneType
    };
};

module.exports = calculateCharge;
