const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Guard all admin routes
router.use(requireAuth, requireRole('ADMIN'));

// Admin Dashboard
router.get('/dashboard', adminController.getDashboard);

// Parcels Management & Assignment
router.get('/parcels', adminController.getParcels);
router.get('/parcels/:id/assign', adminController.getAssignParcel);
router.post('/parcels/:id/assign', adminController.postAssignParcel);

// Delivery Agents Management
router.get('/agents', adminController.getAgents);
router.get('/agents/new', adminController.getAddAgent);
router.post('/agents', adminController.postAddAgent);
router.post('/agents/:id/toggle', adminController.postToggleAgent);

// Delivery Zones Management
router.get('/zones', adminController.getZones);
router.post('/zones', adminController.postAddZone);
router.post('/zones/:id/toggle', adminController.postToggleZone);

module.exports = router;
