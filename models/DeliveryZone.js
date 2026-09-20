const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Zone name is required'],
        unique: true,
        trim: true
    },
    pincodes: [{
        type: String,
        trim: true
    }],
    baseMultiplier: {
        type: Number,
        required: true,
        default: 1.0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
