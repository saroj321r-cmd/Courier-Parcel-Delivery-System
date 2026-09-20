const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Guard all customer routes
router.use(requireAuth, requireRole('CUSTOMER'));

// Customer Dashboard
router.get('/dashboard', customerController.getDashboard);

// Customer Parcels
router.get('/parcels', customerController.getParcels);
router.get('/parcels/book', customerController.getBookParcel);
router.post('/parcels/book', customerController.postBookParcel);
router.get('/parcels/:id', customerController.getParcelDetails);

// Live Charge Calculation API
router.post('/calculate-charge', customerController.apiCalculateCharge);

module.exports = router;
