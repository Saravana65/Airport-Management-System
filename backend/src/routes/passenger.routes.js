/**
 * Module 3: Passenger Management Routes
 */

const express = require('express');
const router = express.Router();
const passengerController = require('../controllers/passenger.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.get('/me', passengerController.getMyProfile);
router.get('/', authorizeRoles('ADMIN', 'AIRLINE_STAFF'), passengerController.getPassengers);
router.get('/:id', passengerController.getPassengerById);
router.post('/', passengerController.createPassenger);
router.put('/:id', passengerController.updatePassenger);

module.exports = router;
