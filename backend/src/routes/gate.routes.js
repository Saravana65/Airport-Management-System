/**
 * Module 7: Gate Management Routes
 */

const express = require('express');
const router = express.Router();
const gateController = require('../controllers/gate.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.get('/', gateController.getGates);
router.get('/:id', gateController.getGateById);
router.post('/', authorizeRoles('ADMIN', 'AIRPORT_STAFF'), gateController.createGate);
router.put('/:id', authorizeRoles('ADMIN', 'AIRPORT_STAFF'), gateController.updateGate);
router.post('/assign', authorizeRoles('ADMIN', 'AIRPORT_STAFF'), gateController.assignGate);

module.exports = router;
