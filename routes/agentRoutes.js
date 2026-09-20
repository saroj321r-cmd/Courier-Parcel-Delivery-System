const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Guard all agent routes
router.use(requireAuth, requireRole('AGENT'));

// Agent Dashboard
router.get('/dashboard', agentController.getDashboard);

// Agent Assigned Parcels
router.get('/parcels', agentController.getAssignedParcels);
router.get('/parcels/:id', agentController.getParcelDetails);
router.post('/parcels/:id/status', agentController.postUpdateStatus);

module.exports = router;
