const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
    trackingId: {
        type: String,
        required: [true, 'Tracking ID is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer reference is required']
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Sender Information
    senderName: {
        type: String,
        required: [true, 'Sender name is required'],
        trim: true
    },
    senderPhone: {
        type: String,
        required: [true, 'Sender phone is required'],
        trim: true
    },
    senderAddress: {
        type: String,
        required: [true, 'Sender address is required'],
        trim: true
    },
    senderPincode: {
        type: String,
        required: [true, 'Sender pincode is required'],
        trim: true
    },
    // Receiver Information
    receiverName: {
        type: String,
        required: [true, 'Receiver name is required'],
        trim: true
    },
    receiverPhone: {
        type: String,
        required: [true, 'Receiver phone is required'],
        trim: true
    },
    receiverAddress: {
        type: String,
        required: [true, 'Receiver address is required'],
        trim: true
    },
    receiverPincode: {
        type: String,
        required: [true, 'Receiver pincode is required'],
        trim: true
    },
    // Parcel Specifications
    weight: {
        type: Number,
        required: [true, 'Weight is required'],
        min: [0.1, 'Weight must be at least 0.1 kg']
    },
    parcelType: {
        type: String,
        enum: ['Document', 'Package', 'Fragile', 'Electronics', 'Other'],
        default: 'Package'
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    // Pickup and Drop Locations
    pickupAddress: {
        type: String,
        required: [true, 'Pickup address is required'],
        trim: true
    },
    pickupPincode: {
        type: String,
        required: [true, 'Pickup pincode is required'],
        trim: true
    },
    dropAddress: {
        type: String,
        required: [true, 'Drop address is required'],
        trim: true
    },
    dropPincode: {
        type: String,
        required: [true, 'Drop pincode is required'],
        trim: true
    },
    // Pricing
    estimatedCharge: {
        type: Number,
        required: true,
        min: 0
    },
    zoneMultiplier: {
        type: Number,
        default: 1.0
    },
    // Status Flow
    status: {
        type: String,
        enum: ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
        default: 'BOOKED',
        index: true
    },
    failureReason: {
        type: String,
        enum: [
            null,
            '',
            'Customer unavailable',
            'Wrong address',
            'Receiver refused',
            'Address inaccessible',
            'Other'
        ],
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Parcel', parcelSchema);
