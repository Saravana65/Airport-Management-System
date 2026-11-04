/**
 * Phase 09: Multi-Language Integration Controller
 * Exposes C Algorithm Engine & Java OOP Services to frontend and API consumers.
 */

const cEngineService = require('../services/cEngine.service');
const javaClientService = require('../services/javaClient.service');

class IntegrationController {
    /**
     * Overall Integration Health & Status
     */
    async getIntegrationStatus(req, res) {
        try {
            const isCBinaryReady = cEngineService.isBinaryAvailable();
            const javaHealth = await javaClientService.checkHealth();

            return res.json({
                success: true,
                phase: 'Phase 09 — Polyglot Integration',
                cEngine: {
                    name: 'C Algorithm Engine',
                    available: isCBinaryReady,
                    binaryPath: cEngineService.binaryPath,
                    algorithms: ['Greedy Bipartite Gate Allocation', 'Binary Min-Heap Runway Queue', 'Dijkstra Shortest Conveyor Route']
                },
                javaService: {
                    name: 'Java OOP Microservice',
                    connected: javaHealth.connected,
                    url: javaClientService.baseUrl,
                    details: javaHealth
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // --- C Algorithm Engine Endpoints ---

    async getGateAllocation(req, res) {
        try {
            const result = await cEngineService.getGateAllocation();
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async getRunwayPriorityQueue(req, res) {
        try {
            const result = await cEngineService.getRunwayPriorityQueue();
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async getBaggageRouting(req, res) {
        try {
            const result = await cEngineService.getBaggageRouting();
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // --- Java OOP Microservice Endpoints ---

    async getJavaBookings(req, res) {
        try {
            const result = await javaClientService.getAllBookings();
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async getJavaBookingById(req, res) {
        try {
            const { id } = req.params;
            const result = await javaClientService.getBookingById(id);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async createJavaBooking(req, res) {
        try {
            const result = await javaClientService.createBooking(req.body);
            return res.status(201).json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async transitionJavaBooking(req, res) {
        try {
            const { id } = req.params;
            const { targetStatus } = req.body;
            const result = await javaClientService.transitionStatus(id, targetStatus);
            if (!result.success) {
                return res.status(400).json(result);
            }
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async calculateJavaPricing(req, res) {
        try {
            const result = await javaClientService.calculateDynamicPricing(req.body);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new IntegrationController();
