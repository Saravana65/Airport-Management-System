/**
 * Module 6: Baggage Management Controller
 */

const baggageService = require('../services/baggage.service');
const { successResponse, errorResponse } = require('../utils/response.util');

async function getBaggage(req, res, next) {
    try {
        const bags = await baggageService.getAllBaggage(req.user, req.query);
        return successResponse(res, bags, 'Baggage records retrieved.');
    } catch (error) {
        next(error);
    }
}

async function getBaggageByTag(req, res, next) {
    try {
        const bag = await baggageService.getBaggageByTag(req.params.tagNumber, req.user);
        if (!bag) return errorResponse(res, 'Baggage tag not found.', 404);
        return successResponse(res, bag, 'Baggage tracking details retrieved.');
    } catch (error) {
        next(error);
    }
}

async function registerBaggage(req, res, next) {
    try {
        const bag = await baggageService.registerBaggage(req.body);
        return successResponse(res, bag, 'Baggage registered with barcode tag.', 201);
    } catch (error) {
        next(error);
    }
}

async function updateBaggageStatus(req, res, next) {
    try {
        const { status, carouselNumber } = req.body;
        const bag = await baggageService.updateBaggageStatus(req.params.id, status, carouselNumber);
        return successResponse(res, bag, 'Baggage status updated.');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getBaggage,
    getBaggageByTag,
    registerBaggage,
    updateBaggageStatus,
};
