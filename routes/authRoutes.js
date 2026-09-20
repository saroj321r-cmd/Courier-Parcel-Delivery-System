const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { guestOnly } = require('../middleware/auth');

// Public Guest Routes
router.get('/login', guestOnly, authController.getLogin);
router.post('/login', guestOnly, authController.postLogin);
router.get('/register', guestOnly, authController.getRegister);
router.post('/register', guestOnly, authController.postRegister);

// Logout
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
