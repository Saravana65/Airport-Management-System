/**
 * Component 5: Resource Utilization Analyzer
 * Computes live operational utilization statistics across terminal gates,
 * fleet aircraft, runway movement congestion, and baggage handling stages.
 */

const store = require('../operations.store');

async function analyzeResourceUtilization() {
    // 1. Gate Utilization
    const totalGates = store.gates.length;
    const occupiedGates = store.flightInstances.filter(
        f => f.departureGateId && ['SCHEDULED', 'BOARDING'].includes(f.status)
    ).length;
    const maintenanceGates = store.gates.filter(g => g.status === 'MAINTENANCE').length;
    const availableGates = Math.max(0, totalGates - occupiedGates - maintenanceGates);
    const gateUtilizationRate = totalGates > 0 ? Math.round((occupiedGates / totalGates) * 100) : 0;

    // 2. Fleet Utilization
    const totalAircraft = store.aircraft.length;
    const activeInstances = store.flightInstances.filter(f => ['SCHEDULED', 'BOARDING', 'DEPARTED'].includes(f.status));
    const activeAircraftIds = new Set(activeInstances.map(f => f.aircraftId).filter(Boolean));
    const fleetUtilizationRate = totalAircraft > 0 ? Math.round((activeAircraftIds.size / totalAircraft) * 100) : 0;

    // 3. Flight Congestion by Time Window
    const timeSlots = [
        { label: '00:00 - 04:00', departures: 0, arrivals: 0 },
        { label: '04:00 - 08:00', departures: 0, arrivals: 0 },
        { label: '08:00 - 12:00', departures: 0, arrivals: 0 },
        { label: '12:00 - 16:00', departures: 0, arrivals: 0 },
        { label: '16:00 - 20:00', departures: 0, arrivals: 0 },
        { label: '20:00 - 24:00', departures: 0, arrivals: 0 },
    ];

    for (const f of store.flights) {
        if (f.scheduledDepartureTime) {
            const hour = parseInt(f.scheduledDepartureTime.split(':')[0], 10);
            const slotIdx = Math.min(5, Math.floor(hour / 4));
            timeSlots[slotIdx].departures++;
        }
        if (f.scheduledArrivalTime) {
            const hour = parseInt(f.scheduledArrivalTime.split(':')[0], 10);
            const slotIdx = Math.min(5, Math.floor(hour / 4));
            timeSlots[slotIdx].arrivals++;
        }
    }

    // 4. Baggage Processing Throughput & Bottleneck Detection
    const baggageBreakdown = {
        CHECKED_IN: 0,
        SECURITY_CLEARED: 0,
        LOADED: 0,
        IN_TRANSIT: 0,
        CLAIM_READY: 0,
        COLLECTED: 0,
    };

    for (const bag of store.baggage) {
        if (baggageBreakdown[bag.status] !== undefined) {
            baggageBreakdown[bag.status]++;
        }
    }

    // 5. Check-in Processing Ratio
    const totalTickets = store.tickets.filter(t => t.status !== 'CANCELLED').length;
    const completedCheckIns = store.checkin.length;
    const checkInRatio = totalTickets > 0 ? Math.round((completedCheckIns / totalTickets) * 100) : 0;

    return {
        timestamp: new Date().toISOString(),
        datasetNote: 'Calculated directly from live Oracle SQL / in-memory operational tables.',
        gates: {
            total: totalGates,
            occupied: occupiedGates,
            available: availableGates,
            maintenance: maintenanceGates,
            utilizationRate: `${gateUtilizationRate}%`,
        },
        fleet: {
            totalAircraft,
            deployedAircraft: activeAircraftIds.size,
            utilizationRate: `${fleetUtilizationRate}%`,
        },
        congestion: {
            timeSlots,
            peakWindow: timeSlots.reduce((max, s) => (s.departures + s.arrivals > max.departures + max.arrivals ? s : max), timeSlots[0]).label,
        },
        baggage: {
            totalTracked: store.baggage.length,
            breakdown: baggageBreakdown,
            bottlenecks: store.baggage.filter(b => b.status === 'CHECKED_IN').length,
        },
        checkIn: {
            totalIssuedTickets: totalTickets,
            completedCheckIns,
            completionRate: `${checkInRatio}%`,
        },
    };
}

module.exports = {
    analyzeResourceUtilization,
};
