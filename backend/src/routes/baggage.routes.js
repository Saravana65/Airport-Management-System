/**
 * Module 6: Baggage Management Routes
 */

const express = require('express');
const router = express.Router();
const baggageController = require('../controllers/baggage.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.get('/', baggageController.getBaggage);
router.get('/:tagNumber', baggageController.getBaggageByTag);
router.post('/', authorizeRoles('ADMIN', 'AIRPORT_STAFF', 'AIRLINE_STAFF'), baggageController.registerBaggage);
router.patch('/:id/status', authorizeRoles('ADMIN', 'AIRPORT_STAFF'), baggageController.updateBaggageStatus);

module.exports = router;
