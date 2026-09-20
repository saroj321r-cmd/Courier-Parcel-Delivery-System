const crypto = require('crypto');
const Parcel = require('../models/Parcel');

/**
 * Generate a unique tracking ID in the format CRX-XXXXXX
 * (e.g., CRX-8F4K29, CRX-4A72B9)
 * Checks the database to ensure absolute uniqueness.
 */
const generateTrackingId = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like 0, O, 1, I
    let unique = false;
    let trackingId = '';

    while (!unique) {
        let code = '';
        const randomBytes = crypto.randomBytes(6);
        for (let i = 0; i < 6; i++) {
            code += chars[randomBytes[i] % chars.length];
        }
        trackingId = `CRX-${code}`;

        const existing = await Parcel.findOne({ trackingId });
        if (!existing) {
            unique = true;
        }
    }

    return trackingId;
};

module.exports = generateTrackingId;
