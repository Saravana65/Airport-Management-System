/**
 * Module 7: Gate Management Controller
 */

const gateService = require('../services/gate.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getGates(req, res, next) {
    try {
        const gates = await gateService.getAllGates(req.query);
        return successResponse(res, gates, 'Gates retrieved successfully.');
    } catch (error) {
        next(error);
    }
}

async function getGateById(req, res, next) {
    try {
        const gate = await gateService.getGateById(req.params.id);
        if (!gate) return errorResponse(res, 'Gate not found.', 404);
        return successResponse(res, gate, 'Gate details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function createGate(req, res, next) {
    try {
        const gate = await gateService.createGate(req.body);
        return successResponse(res, gate, 'Gate registered successfully.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateGate(req, res, next) {
    try {
        const gate = await gateService.updateGate(req.params.id, req.body);
        return successResponse(res, gate, 'Gate updated successfully.');
    } catch (error) {
        next(error);
    }
}

async function assignGate(req, res, next) {
    try {
        const result = await gateService.assignGateToFlight(req.body);
        return successResponse(res, result, 'Gate successfully assigned to flight instance.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getGates,
    getGateById,
    createGate,
    updateGate,
    assignGate,
};
