const Parcel = require('../models/Parcel');
const StatusHistory = require('../models/StatusHistory');
const DeliveryZone = require('../models/DeliveryZone');
const generateTrackingId = require('../utils/generateTrackingId');
const calculateCharge = require('../utils/calculateCharge');
const { STATUS_DETAILS } = require('../utils/statusFlow');

/**
 * Customer Dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const customerId = req.session.user._id;

        // Aggregate parcel counts for this customer
        const [
            totalParcels,
            bookedCount,
            inTransitCount,
            deliveredCount,
            failedCount,
            recentParcels
        ] = await Promise.all([
            Parcel.countDocuments({ customerId }),
            Parcel.countDocuments({ customerId, status: 'BOOKED' }),
            Parcel.countDocuments({ customerId, status: { $in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } }),
            Parcel.countDocuments({ customerId, status: 'DELIVERED' }),
            Parcel.countDocuments({ customerId, status: 'FAILED' }),
            Parcel.find({ customerId })
                .sort({ createdAt: -1 })
                .limit(6)
                .populate('agentId', 'name phone vehicleNumber')
        ]);

        res.render('customer/dashboard', {
            title: 'Customer Dashboard | CourierX',
            stats: {
                total: totalParcels,
                booked: bookedCount,
                inTransit: inTransitCount,
                delivered: deliveredCount,
                failed: failedCount
            },
            recentParcels,
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Render Book Parcel Page
 */
const getBookParcel = async (req, res, next) => {
    try {
        const activeZones = await DeliveryZone.find({ isActive: true }).sort({ name: 1 });
        res.render('customer/book-parcel', {
            title: 'Book a Parcel | CourierX',
            formData: {},
            activeZones,
            currentUser: req.session.user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle Parcel Booking Submission
 */
const postBookParcel = async (req, res, next) => {
    try {
        const {
            senderName,
            senderPhone,
            senderAddress,
            senderPincode,
            receiverName,
            receiverPhone,
            receiverAddress,
            receiverPincode,
            weight,
            parcelType,
            description,
            pickupAddress,
            pickupPincode,
            dropAddress,
            dropPincode
        } = req.body;

        // Validation
        if (!senderName || !senderPhone || !senderAddress || !senderPincode ||
            !receiverName || !receiverPhone || !receiverAddress || !receiverPincode ||
            !weight || !pickupAddress || !pickupPincode || !dropAddress || !dropPincode) {
            req.session.errorMessage = 'Please complete all required fields.';
            const activeZones = await DeliveryZone.find({ isActive: true }).sort({ name: 1 });
            return res.render('customer/book-parcel', {
                title: 'Book a Parcel | CourierX',
                formData: req.body,
                activeZones,
                currentUser: req.session.user
            });
        }

        const numWeight = parseFloat(weight);
        if (isNaN(numWeight) || numWeight <= 0) {
            req.session.errorMessage = 'Please enter a valid positive weight in kg.';
            const activeZones = await DeliveryZone.find({ isActive: true }).sort({ name: 1 });
            return res.render('customer/book-parcel', {
                title: 'Book a Parcel | CourierX',
                formData: req.body,
                activeZones,
                currentUser: req.session.user
            });
        }

        // Calculate delivery charge
        const chargeDetails = await calculateCharge(numWeight, pickupPincode, dropPincode);

        // Generate unique tracking ID
        const trackingId = await generateTrackingId();

        // Create parcel
        const parcel = new Parcel({
            trackingId,
            customerId: req.session.user._id,
            senderName: senderName.trim(),
            senderPhone: senderPhone.trim(),
            senderAddress: senderAddress.trim(),
            senderPincode: senderPincode.trim(),
            receiverName: receiverName.trim(),
            receiverPhone: receiverPhone.trim(),
            receiverAddress: receiverAddress.trim(),
            receiverPincode: receiverPincode.trim(),
            weight: numWeight,
            parcelType: parcelType || 'Package',
            description: (description || '').trim(),
            pickupAddress: pickupAddress.trim(),
            pickupPincode: pickupPincode.trim(),
            dropAddress: dropAddress.trim(),
            dropPincode: dropPincode.trim(),
            estimatedCharge: chargeDetails.estimatedCharge,
            zoneMultiplier: chargeDetails.multiplier,
            status: 'BOOKED'
        });

        await parcel.save();

        // Create initial StatusHistory entry
        const history = new StatusHistory({
            parcelId: parcel._id,
            status: 'BOOKED',
            location: 'Order Placed Online',
            remarks: 'Parcel registered. Awaiting pickup assignment.',
            updatedBy: req.session.user._id,
            timestamp: new Date()
        });

        await history.save();

        req.session.successMessage = `Parcel booked successfully! Tracking ID: ${trackingId}`;
        res.redirect(`/customer/parcels/${parcel._id}`);
    } catch (error) {
        next(error);
    }
};

/**
 * List all Parcels for the Customer
 */
const getParcels = async (req, res, next) => {
    try {
        const customerId = req.session.user._id;
        const statusFilter = req.query.status;

        const query = { customerId };
        if (statusFilter && statusFilter !== 'ALL') {
            query.status = statusFilter;
        }

        const parcels = await Parcel.find(query)
            .sort({ createdAt: -1 })
            .populate('agentId', 'name phone vehicleNumber');

        res.render('customer/parcels', {
            title: 'My Parcels | CourierX',
            parcels,
            currentStatus: statusFilter || 'ALL',
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Parcel Details & Live Timeline for Customer
 */
const getParcelDetails = async (req, res, next) => {
    try {
        const customerId = req.session.user._id;
        const parcelId = req.params.id;

        const parcel = await Parcel.findOne({ _id: parcelId, customerId })
            .populate('customerId', 'name email phone')
            .populate('agentId', 'name phone vehicleNumber');

        if (!parcel) {
            const err = new Error('Parcel not found or you do not have permission to view it.');
            err.status = 404;
            return next(err);
        }

        const history = await StatusHistory.find({ parcelId: parcel._id })
            .sort({ timestamp: 1 })
            .populate('updatedBy', 'name role');

        res.render('customer/parcel-details', {
            title: `Parcel ${parcel.trackingId} | CourierX`,
            parcel,
            history,
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * AJAX helper to calculate charges live on the booking form
 */
const apiCalculateCharge = async (req, res) => {
    try {
        const { weight, pickupPincode, dropPincode } = req.body;
        const result = await calculateCharge(weight, pickupPincode, dropPincode);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getDashboard,
    getBookParcel,
    postBookParcel,
    getParcels,
    getParcelDetails,
    apiCalculateCharge
};
