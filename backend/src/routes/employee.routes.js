/**
 * Module 8: Employee Management Routes
 */

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticateUser, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateUser);

// Restricted to ADMIN only
router.get('/', authorizeRoles('ADMIN'), employeeController.getEmployees);
router.get('/:id', authorizeRoles('ADMIN'), employeeController.getEmployeeById);
router.post('/', authorizeRoles('ADMIN'), employeeController.createEmployee);
router.put('/:id', authorizeRoles('ADMIN'), employeeController.updateEmployee);

module.exports = router;
