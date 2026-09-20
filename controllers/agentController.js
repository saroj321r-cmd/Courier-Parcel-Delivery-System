const Parcel = require('../models/Parcel');
const StatusHistory = require('../models/StatusHistory');
const {
    STATUS_DETAILS,
    FAILURE_REASONS,
    isValidTransition,
    getNextAvailableStatuses
} = require('../utils/statusFlow');

/**
 * Agent Dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const agentId = req.session.user._id;

        const [
            totalAssigned,
            pickedUpCount,
            inTransitCount,
            outForDeliveryCount,
            deliveredCount,
            failedCount,
            pendingParcels
        ] = await Promise.all([
            Parcel.countDocuments({ agentId }),
            Parcel.countDocuments({ agentId, status: 'PICKED_UP' }),
            Parcel.countDocuments({ agentId, status: 'IN_TRANSIT' }),
            Parcel.countDocuments({ agentId, status: 'OUT_FOR_DELIVERY' }),
            Parcel.countDocuments({ agentId, status: 'DELIVERED' }),
            Parcel.countDocuments({ agentId, status: 'FAILED' }),
            Parcel.find({
                agentId,
                status: { $in: ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] }
            })
                .sort({ updatedAt: -1 })
                .limit(8)
                .populate('customerId', 'name phone')
        ]);

        res.render('agent/dashboard', {
            title: 'Agent Dashboard | CourierX',
            stats: {
                total: totalAssigned,
                pickedUp: pickedUpCount,
                inTransit: inTransitCount,
                outForDelivery: outForDeliveryCount,
                delivered: deliveredCount,
                failed: failedCount
            },
            pendingParcels,
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List all Parcels Assigned to this Agent
 */
const getAssignedParcels = async (req, res, next) => {
    try {
        const agentId = req.session.user._id;
        const statusFilter = req.query.status;

        const query = { agentId };
        if (statusFilter && statusFilter !== 'ALL') {
            query.status = statusFilter;
        }

        const parcels = await Parcel.find(query)
            .sort({ updatedAt: -1 })
            .populate('customerId', 'name phone email');

        res.render('agent/assigned-parcels', {
            title: 'Assigned Parcels | CourierX',
            parcels,
            currentStatus: statusFilter || 'ALL',
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * View Parcel Details and Update Status Form for Agent
 */
const getParcelDetails = async (req, res, next) => {
    try {
        const agentId = req.session.user._id;
        const parcelId = req.params.id;

        const parcel = await Parcel.findOne({ _id: parcelId, agentId })
            .populate('customerId', 'name email phone');

        if (!parcel) {
            const err = new Error('Assigned parcel not found or you are not authorized to manage this parcel.');
            err.status = 404;
            return next(err);
        }

        const history = await StatusHistory.find({ parcelId: parcel._id })
            .sort({ timestamp: 1 })
            .populate('updatedBy', 'name role');

        const availableStatuses = getNextAvailableStatuses(parcel.status);

        res.render('agent/parcel-details', {
            title: `Update Parcel ${parcel.trackingId} | CourierX`,
            parcel,
            history,
            availableStatuses,
            failureReasons: FAILURE_REASONS,
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle Status Update by Agent
 */
const postUpdateStatus = async (req, res, next) => {
    try {
        const agentId = req.session.user._id;
        const parcelId = req.params.id;
        const { nextStatus, location, remarks, failureReason } = req.body;

        const parcel = await Parcel.findOne({ _id: parcelId, agentId });
        if (!parcel) {
            const err = new Error('Parcel not found or not assigned to you.');
            err.status = 404;
            return next(err);
        }

        // Validate transition
        if (!isValidTransition(parcel.status, nextStatus)) {
            req.session.errorMessage = `Invalid status transition: Cannot move from ${parcel.status} to ${nextStatus}.`;
            return res.redirect(`/agent/parcels/${parcelId}`);
        }

        // Validate failure reason if FAILED
        if (nextStatus === 'FAILED') {
            if (!failureReason || !FAILURE_REASONS.includes(failureReason)) {
                req.session.errorMessage = 'Please select a valid failure reason when marking a parcel as FAILED.';
                return res.redirect(`/agent/parcels/${parcelId}`);
            }
            parcel.failureReason = failureReason;
        }

        // Update Parcel status
        parcel.status = nextStatus;
        await parcel.save();

        // Create StatusHistory record
        const historyEntry = new StatusHistory({
            parcelId: parcel._id,
            status: nextStatus,
            location: (location || 'In Transit Hub').trim(),
            remarks: (remarks || `Status updated to ${nextStatus}${nextStatus === 'FAILED' ? ` (Reason: ${failureReason})` : ''}`).trim(),
            updatedBy: agentId,
            timestamp: new Date()
        });

        await historyEntry.save();

        req.session.successMessage = `Parcel ${parcel.trackingId} status updated to ${STATUS_DETAILS[nextStatus].label}!`;
        res.redirect(`/agent/parcels/${parcelId}`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getAssignedParcels,
    getParcelDetails,
    postUpdateStatus
};
