/**
 * Parcel Lifecycle Status Workflow State Machine
 */

const STATUSES = {
    BOOKED: 'BOOKED',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    FAILED: 'FAILED'
};

const STATUS_TRANSITIONS = {
    [STATUSES.BOOKED]: [STATUSES.PICKED_UP],
    [STATUSES.PICKED_UP]: [STATUSES.IN_TRANSIT],
    [STATUSES.IN_TRANSIT]: [STATUSES.OUT_FOR_DELIVERY],
    [STATUSES.OUT_FOR_DELIVERY]: [STATUSES.DELIVERED, STATUSES.FAILED],
    [STATUSES.DELIVERED]: [],
    [STATUSES.FAILED]: []
};

const STATUS_DETAILS = {
    [STATUSES.BOOKED]: {
        label: 'Booked',
        badgeClass: 'badge-booked',
        color: '#EAB308',
        description: 'Shipment registered and pickup scheduled'
    },
    [STATUSES.PICKED_UP]: {
        label: 'Picked Up',
        badgeClass: 'badge-picked-up',
        color: '#0284C7',
        description: 'Parcel collected from sender by delivery agent'
    },
    [STATUSES.IN_TRANSIT]: {
        label: 'In Transit',
        badgeClass: 'badge-in-transit',
        color: '#F97316',
        description: 'Parcel is on the move between sorting hubs'
    },
    [STATUSES.OUT_FOR_DELIVERY]: {
        label: 'Out for Delivery',
        badgeClass: 'badge-out-for-delivery',
        color: '#8B5CF6',
        description: 'Agent is on the way to the receiver destination'
    },
    [STATUSES.DELIVERED]: {
        label: 'Delivered',
        badgeClass: 'badge-delivered',
        color: '#10B981',
        description: 'Successfully handed over to recipient'
    },
    [STATUSES.FAILED]: {
        label: 'Delivery Failed',
        badgeClass: 'badge-failed',
        color: '#EF4444',
        description: 'Delivery could not be completed'
    }
};

const FAILURE_REASONS = [
    'Customer unavailable',
    'Wrong address',
    'Receiver refused',
    'Address inaccessible',
    'Other'
];

/**
 * Check if transition from currentStatus to nextStatus is permitted
 */
const isValidTransition = (currentStatus, nextStatus) => {
    if (!currentStatus || !nextStatus) return false;
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
};

/**
 * Get the list of allowed next status values from currentStatus
 */
const getNextAvailableStatuses = (currentStatus) => {
    return STATUS_TRANSITIONS[currentStatus] || [];
};

module.exports = {
    STATUSES,
    STATUS_TRANSITIONS,
    STATUS_DETAILS,
    FAILURE_REASONS,
    isValidTransition,
    getNextAvailableStatuses
};
