const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const StatusHistory = require('../models/StatusHistory');
const User = require('../models/User');
const DeliveryZone = require('../models/DeliveryZone');
const { STATUS_DETAILS } = require('../utils/statusFlow');

/**
 * Public Landing Page (Home)
 * Feeds live statistics from the MongoDB database
 */
router.get('/', async (req, res, next) => {
    try {
        const [
            deliveredCount,
            activeAgentsCount,
            activeZonesCount,
            totalShipments
        ] = await Promise.all([
            Parcel.countDocuments({ status: 'DELIVERED' }),
            User.countDocuments({ role: 'AGENT', isActive: true }),
            DeliveryZone.countDocuments({ isActive: true }),
            Parcel.countDocuments()
        ]);

        const successRate = totalShipments > 0
            ? Math.round((deliveredCount / totalShipments) * 100)
            : 99;

        res.render('home', {
            title: 'CourierX | Courier & Parcel Delivery Tracking System',
            stats: {
                delivered: deliveredCount,
                agents: activeAgentsCount,
                zones: activeZonesCount,
                total: totalShipments,
                successRate
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Public Tracking Page (GET)
 */
router.get('/track', async (req, res, next) => {
    try {
        const trackingId = req.query.id ? req.query.id.trim().toUpperCase() : null;

        if (!trackingId) {
            return res.render('tracking/track', {
                title: 'Track Your Parcel | CourierX',
                trackingId: '',
                parcel: null,
                history: [],
                statusDetails: STATUS_DETAILS,
                searched: false
            });
        }

        const parcel = await Parcel.findOne({ trackingId })
            .populate('agentId', 'name phone vehicleNumber');

        if (!parcel) {
            return res.render('tracking/track', {
                title: 'Track Your Parcel | CourierX',
                trackingId,
                parcel: null,
                history: [],
                statusDetails: STATUS_DETAILS,
                searched: true,
                errorMessage: `No shipment found matching tracking ID "${trackingId}". Please verify and try again.`
            });
        }

        const history = await StatusHistory.find({ parcelId: parcel._id })
            .sort({ timestamp: 1 })
            .populate('updatedBy', 'name role');

        res.render('tracking/track', {
            title: `Tracking ${parcel.trackingId} | CourierX`,
            trackingId,
            parcel,
            history,
            statusDetails: STATUS_DETAILS,
            searched: true,
            errorMessage: null
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Public Tracking Form (POST)
 */
router.post('/track', async (req, res, next) => {
    try {
        const trackingId = req.body.trackingId ? req.body.trackingId.trim().toUpperCase() : '';

        if (!trackingId) {
            return res.render('tracking/track', {
                title: 'Track Your Parcel | CourierX',
                trackingId: '',
                parcel: null,
                history: [],
                statusDetails: STATUS_DETAILS,
                searched: true,
                errorMessage: 'Please enter a valid Tracking ID.'
            });
        }

        const parcel = await Parcel.findOne({ trackingId })
            .populate('agentId', 'name phone vehicleNumber');

        if (!parcel) {
            return res.render('tracking/track', {
                title: 'Track Your Parcel | CourierX',
                trackingId,
                parcel: null,
                history: [],
                statusDetails: STATUS_DETAILS,
                searched: true,
                errorMessage: `No shipment found matching tracking ID "${trackingId}". Please verify and try again.`
            });
        }

        const history = await StatusHistory.find({ parcelId: parcel._id })
            .sort({ timestamp: 1 })
            .populate('updatedBy', 'name role');

        res.render('tracking/track', {
            title: `Tracking ${parcel.trackingId} | CourierX`,
            trackingId,
            parcel,
            history,
            statusDetails: STATUS_DETAILS,
            searched: true,
            errorMessage: null
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
