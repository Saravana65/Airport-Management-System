/**
 * Module 8: Employee Management Controller
 */

const employeeService = require('../services/employee.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getEmployees(req, res, next) {
    try {
        const employees = await employeeService.getAllEmployees(req.query);
        return successResponse(res, employees, 'Employees retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getEmployeeById(req, res, next) {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        if (!employee) return errorResponse(res, 'Employee record not found.', 404);
        return successResponse(res, employee, 'Employee details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createEmployee(req, res, next) {
    try {
        const employee = await employeeService.createEmployee(req.body);
        return successResponse(res, employee, 'Employee registered successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateEmployee(req, res, next) {
    try {
        const employee = await employeeService.updateEmployee(req.params.id, req.body);
        return successResponse(res, employee, 'Employee profile updated successfully.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
};
