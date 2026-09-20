const User = require('../models/User');
const Parcel = require('../models/Parcel');
const StatusHistory = require('../models/StatusHistory');
const DeliveryZone = require('../models/DeliveryZone');
const { STATUS_DETAILS } = require('../utils/statusFlow');

/**
 * Admin Dashboard with Live Statistics & Chart Data
 */
const getDashboard = async (req, res, next) => {
    try {
        const [
            totalParcels,
            totalCustomers,
            totalAgents,
            unassignedParcels,
            inTransitParcels,
            deliveredParcels,
            failedParcels,
            recentParcels,
            activeAgents
        ] = await Promise.all([
            Parcel.countDocuments(),
            User.countDocuments({ role: 'CUSTOMER' }),
            User.countDocuments({ role: 'AGENT' }),
            Parcel.countDocuments({ agentId: null, status: { $nin: ['DELIVERED', 'FAILED'] } }),
            Parcel.countDocuments({ status: { $in: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } }),
            Parcel.countDocuments({ status: 'DELIVERED' }),
            Parcel.countDocuments({ status: 'FAILED' }),
            Parcel.find()
                .sort({ createdAt: -1 })
                .limit(6)
                .populate('customerId', 'name')
                .populate('agentId', 'name'),
            User.find({ role: 'AGENT', isActive: true }).select('name')
        ]);

        // Status Distribution for Chart.js
        const statusDistribution = await Parcel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusMap = {
            BOOKED: 0,
            PICKED_UP: 0,
            IN_TRANSIT: 0,
            OUT_FOR_DELIVERY: 0,
            DELIVERED: 0,
            FAILED: 0
        };
        statusDistribution.forEach(item => {
            if (statusMap[item._id] !== undefined) {
                statusMap[item._id] = item.count;
            }
        });

        // Daily bookings for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyBookingsRaw = await Parcel.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Build 7-day chronological labels
        const dailyLabels = [];
        const dailyCounts = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const formattedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailyLabels.push(formattedLabel);

            const found = dailyBookingsRaw.find(item => item._id === dateStr);
            dailyCounts.push(found ? found.count : 0);
        }

        // Agent-wise Parcel Load
        const agentLoads = await Parcel.aggregate([
            { $match: { agentId: { $ne: null } } },
            { $group: { _id: '$agentId', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'agent'
                }
            },
            { $unwind: '$agent' },
            { $project: { name: '$agent.name', count: 1 } }
        ]);

        const agentLabels = agentLoads.map(a => a.name);
        const agentCounts = agentLoads.map(a => a.count);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard | CourierX',
            stats: {
                totalParcels,
                totalCustomers,
                totalAgents,
                unassignedParcels,
                inTransitParcels,
                deliveredParcels,
                failedParcels
            },
            recentParcels,
            statusDetails: STATUS_DETAILS,
            chartData: {
                statusLabels: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'],
                statusValues: [
                    statusMap.BOOKED,
                    statusMap.PICKED_UP,
                    statusMap.IN_TRANSIT,
                    statusMap.OUT_FOR_DELIVERY,
                    statusMap.DELIVERED,
                    statusMap.FAILED
                ],
                dailyLabels,
                dailyCounts,
                agentLabels: agentLabels.length > 0 ? agentLabels : ['No Active Assignments'],
                agentCounts: agentCounts.length > 0 ? agentCounts : [0]
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * View All Parcels with Filter & Search
 */
const getParcels = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        if (status && status !== 'ALL') {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { trackingId: { $regex: search.trim(), $options: 'i' } },
                { receiverName: { $regex: search.trim(), $options: 'i' } },
                { senderName: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const parcels = await Parcel.find(filter)
            .sort({ createdAt: -1 })
            .populate('customerId', 'name email phone')
            .populate('agentId', 'name phone vehicleNumber');

        res.render('admin/parcels', {
            title: 'Manage Parcels | CourierX',
            parcels,
            statusDetails: STATUS_DETAILS,
            currentStatus: status || 'ALL',
            searchQuery: search || ''
        });
    } catch (error) {
        next(error);
    }
};

/**
 * View Parcel Details / Assign Agent Page
 */
const getAssignParcel = async (req, res, next) => {
    try {
        const parcelId = req.params.id;
        const parcel = await Parcel.findById(parcelId)
            .populate('customerId', 'name email phone')
            .populate('agentId', 'name email phone vehicleNumber zone');

        if (!parcel) {
            const err = new Error('Parcel not found.');
            err.status = 404;
            return next(err);
        }

        // Fetch only active agents for assignment
        const agents = await User.find({ role: 'AGENT', isActive: true }).sort({ name: 1 });
        const history = await StatusHistory.find({ parcelId: parcel._id })
            .sort({ timestamp: 1 })
            .populate('updatedBy', 'name role');

        res.render('admin/assign-parcel', {
            title: `Assign Agent - ${parcel.trackingId} | CourierX`,
            parcel,
            agents,
            history,
            statusDetails: STATUS_DETAILS
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle Agent Assignment
 */
const postAssignParcel = async (req, res, next) => {
    try {
        const parcelId = req.params.id;
        const { agentId } = req.body;

        const parcel = await Parcel.findById(parcelId);
        if (!parcel) {
            req.session.errorMessage = 'Parcel not found.';
            return res.redirect('/admin/parcels');
        }

        if (!agentId) {
            req.session.errorMessage = 'Please select a delivery agent.';
            return res.redirect(`/admin/parcels/${parcelId}/assign`);
        }

        // Verify agent is active
        const agent = await User.findOne({ _id: agentId, role: 'AGENT', isActive: true });
        if (!agent) {
            req.session.errorMessage = 'Selected agent is either invalid or inactive.';
            return res.redirect(`/admin/parcels/${parcelId}/assign`);
        }

        parcel.agentId = agent._id;
        await parcel.save();

        // Record in status history as assignment note
        const historyEntry = new StatusHistory({
            parcelId: parcel._id,
            status: parcel.status,
            location: 'Admin Dispatch Hub',
            remarks: `Assigned to delivery agent ${agent.name} (${agent.phone || 'N/A'})`,
            updatedBy: req.session.user._id,
            timestamp: new Date()
        });
        await historyEntry.save();

        req.session.successMessage = `Parcel ${parcel.trackingId} successfully assigned to ${agent.name}!`;
        res.redirect(`/admin/parcels/${parcelId}/assign`);
    } catch (error) {
        next(error);
    }
};

/**
 * Manage Agents List
 */
const getAgents = async (req, res, next) => {
    try {
        const agents = await User.find({ role: 'AGENT' }).sort({ createdAt: -1 });

        // Calculate load for each agent
        const agentIds = agents.map(a => a._id);
        const parcelCounts = await Parcel.aggregate([
            { $match: { agentId: { $in: agentIds } } },
            { $group: { _id: '$agentId', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        parcelCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

        const agentsWithLoad = agents.map(agent => ({
            ...agent.toObject(),
            assignedCount: countMap[agent._id.toString()] || 0
        }));

        res.render('admin/agents', {
            title: 'Delivery Agents | CourierX',
            agents: agentsWithLoad
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Render Add Agent Form
 */
const getAddAgent = (req, res) => {
    res.render('admin/add-agent', {
        title: 'Add Delivery Agent | CourierX',
        formData: {}
    });
};

/**
 * Handle Add Agent Form Submission
 */
const postAddAgent = async (req, res, next) => {
    try {
        const { name, email, phone, password, vehicleNumber, zone } = req.body;

        if (!name || !email || !phone || !password) {
            req.session.errorMessage = 'Name, email, phone, and password are required.';
            return res.render('admin/add-agent', {
                title: 'Add Delivery Agent | CourierX',
                formData: req.body
            });
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            req.session.errorMessage = 'An account with this email already exists.';
            return res.render('admin/add-agent', {
                title: 'Add Delivery Agent | CourierX',
                formData: req.body
            });
        }

        const agent = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password,
            role: 'AGENT',
            vehicleNumber: (vehicleNumber || '').trim(),
            zone: (zone || '').trim(),
            isActive: true
        });

        await agent.save();

        req.session.successMessage = `Delivery agent ${agent.name} added successfully!`;
        res.redirect('/admin/agents');
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle Agent Active/Inactive Status
 */
const postToggleAgent = async (req, res, next) => {
    try {
        const agentId = req.params.id;
        const agent = await User.findOne({ _id: agentId, role: 'AGENT' });

        if (!agent) {
            req.session.errorMessage = 'Agent not found.';
            return res.redirect('/admin/agents');
        }

        agent.isActive = !agent.isActive;
        await agent.save();

        req.session.successMessage = `Agent ${agent.name} has been ${agent.isActive ? 'activated' : 'deactivated'}.`;
        res.redirect('/admin/agents');
    } catch (error) {
        next(error);
    }
};

/**
 * Manage Delivery Zones
 */
const getZones = async (req, res, next) => {
    try {
        const zones = await DeliveryZone.find().sort({ name: 1 });
        res.render('admin/zones', {
            title: 'Delivery Zones | CourierX',
            zones,
            formData: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle Add Zone
 */
const postAddZone = async (req, res, next) => {
    try {
        const { name, pincodes, baseMultiplier } = req.body;

        if (!name) {
            req.session.errorMessage = 'Zone name is required.';
            return res.redirect('/admin/zones');
        }

        const existing = await DeliveryZone.findOne({ name: name.trim() });
        if (existing) {
            req.session.errorMessage = `A zone with the name "${name}" already exists.`;
            return res.redirect('/admin/zones');
        }

        const pincodeArray = (pincodes || '')
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0);

        const zone = new DeliveryZone({
            name: name.trim(),
            pincodes: pincodeArray,
            baseMultiplier: parseFloat(baseMultiplier) || 1.0,
            isActive: true
        });

        await zone.save();

        req.session.successMessage = `Delivery Zone "${zone.name}" created successfully!`;
        res.redirect('/admin/zones');
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle Zone Active / Inactive
 */
const postToggleZone = async (req, res, next) => {
    try {
        const zoneId = req.params.id;
        const zone = await DeliveryZone.findById(zoneId);

        if (!zone) {
            req.session.errorMessage = 'Zone not found.';
            return res.redirect('/admin/zones');
        }

        zone.isActive = !zone.isActive;
        await zone.save();

        req.session.successMessage = `Zone "${zone.name}" ${zone.isActive ? 'activated' : 'deactivated'}.`;
        res.redirect('/admin/zones');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getParcels,
    getAssignParcel,
    postAssignParcel,
    getAgents,
    getAddAgent,
    postAddAgent,
    postToggleAgent,
    getZones,
    postAddZone,
    postToggleZone
};
