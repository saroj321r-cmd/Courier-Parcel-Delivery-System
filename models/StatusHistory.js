const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    parcelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parcel',
        required: [true, 'Parcel reference is required'],
        index: true
    },
    status: {
        type: String,
        enum: ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
        required: [true, 'Status is required']
    },
    location: {
        type: String,
        trim: true,
        default: 'Operations Center'
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
