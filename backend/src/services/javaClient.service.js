/**
 * Phase 09: Java OOP Microservice Client
 * Communicates with the embedded Java HTTP service (port 5050) with graceful offline fallback.
 */

class JavaClientService {
    constructor() {
        this.baseUrl = process.env.JAVA_SERVICE_URL || 'http://127.0.0.1:5050';
        
        // In-memory fallback repository when Java service is not running
        this.fallbackBookings = [
            {
                bookingId: 'BK-SAMPLE-01',
                bookingReference: 'CB1001',
                bookingType: 'COMMERCIAL',
                status: 'CONFIRMED',
                serviceFee: 15.0,
                totalAmount: 195.0,
                passenger: { id: 'PA-101', name: 'Aarav Sharma', email: 'aarav@example.com', passport: 'Z1234567' },
                flight: { flightNumber: 'AI-101', origin: 'DEL', destination: 'BOM', baseFare: 180.0, bookedSeats: 120, totalCapacity: 180 },
                ticket: { ticketNumber: 'TK-89A01B', seatNumber: '14B', cabinClass: 'ECONOMY', price: 180.0 },
                frequentFlyer: true
            },
            {
                bookingId: 'BK-SAMPLE-02',
                bookingReference: 'VIP5500',
                bookingType: 'VIP',
                status: 'CHECKED_IN',
                serviceFee: 120.0,
                totalAmount: 1770.0,
                passenger: { id: 'PA-102', name: 'Elena Rostova', email: 'elena@diplomat.org', passport: 'D9876543' },
                flight: { flightNumber: 'BA-1689', origin: 'DEL', destination: 'LHR', baseFare: 750.0, bookedSeats: 210, totalCapacity: 250 },
                ticket: { ticketNumber: 'TK-VIP-01', seatNumber: '1A', cabinClass: 'FIRST_CLASS', price: 1650.0 },
                loungeId: 'MAHARAJA-LOUNGE-T3',
                fastTrack: true
            }
        ];
    }

    /**
     * Checks if Java OOP microservice is running and healthy.
     */
    async checkHealth() {
        try {
            const res = await fetch(`${this.baseUrl}/health`, {
                signal: AbortSignal.timeout(2000)
            });
            if (res.ok) {
                const data = await res.json();
                return { connected: true, ...data };
            }
            return { connected: false, error: `HTTP ${res.status}` };
        } catch (err) {
            return {
                connected: false,
                service: 'airport-java-service',
                message: 'Java service is currently offline. Running in graceful local fallback mode.',
                hint: 'Run java-service/run.bat to launch live Java microservice on port 5050'
            };
        }
    }

    /**
     * Fetch all bookings
     */
    async getAllBookings() {
        try {
            const res = await fetch(`${this.baseUrl}/api/bookings`, {
                signal: AbortSignal.timeout(2500)
            });
            if (res.ok) {
                const data = await res.json();
                return { source: 'JAVA_MICROSERVICE', ...data };
            }
        } catch (err) {
            // Fallback
        }

        return {
            source: 'LOCAL_FALLBACK_STORE',
            success: true,
            count: this.fallbackBookings.length,
            bookings: this.fallbackBookings
        };
    }

    /**
     * Fetch booking by ID or Reference
     */
    async getBookingById(bookingId) {
        try {
            const res = await fetch(`${this.baseUrl}/api/bookings/${bookingId}`, {
                signal: AbortSignal.timeout(2500)
            });
            if (res.ok) {
                const data = await res.json();
                return { source: 'JAVA_MICROSERVICE', ...data };
            }
        } catch (err) {}

        const found = this.fallbackBookings.find(b => b.bookingId === bookingId || b.bookingReference === bookingId);
        if (found) {
            return { source: 'LOCAL_FALLBACK_STORE', success: true, booking: found };
        }
        return { success: false, message: `Booking ${bookingId} not found` };
    }

    /**
     * Create a new commercial or VIP booking
     */
    async createBooking(payload) {
        try {
            const res = await fetch(`${this.baseUrl}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(3000)
            });
            if (res.ok) {
                const data = await res.json();
                return { source: 'JAVA_MICROSERVICE', ...data };
            }
        } catch (err) {}

        // Fallback simulation
        const isVip = payload.bookingType === 'VIP';
        const fee = isVip ? 120.0 : (payload.frequentFlyer ? 15.0 : 25.0);
        const baseFare = Number(payload.baseFare) || 200.0;
        const total = baseFare + fee;

        const newBooking = {
            bookingId: `BK-${Date.now().toString().slice(-6)}`,
            bookingReference: (isVip ? 'VIP' : 'CB') + Math.floor(1000 + Math.random() * 9000),
            bookingType: isVip ? 'VIP' : 'COMMERCIAL',
            status: 'PENDING',
            serviceFee: fee,
            totalAmount: total,
            passenger: {
                id: `PA-${Date.now().toString().slice(-4)}`,
                name: `${payload.firstName || 'Guest'} ${payload.lastName || 'Passenger'}`,
                email: payload.email || '',
                passport: payload.passport || ''
            },
            flight: {
                flightNumber: payload.flightNumber || 'AI-202',
                origin: payload.origin || 'DEL',
                destination: payload.destination || 'BOM',
                baseFare: baseFare,
                bookedSeats: 50,
                totalCapacity: Number(payload.totalCapacity) || 180
            },
            ticket: {
                ticketNumber: `TK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                seatNumber: payload.seatNumber || '14A',
                cabinClass: payload.cabinClass || 'ECONOMY',
                price: baseFare
            },
            ...(isVip ? { loungeId: payload.loungeId || 'EXECUTIVE-LOUNGE', fastTrack: true } : { frequentFlyer: Boolean(payload.frequentFlyer) })
        };

        this.fallbackBookings.push(newBooking);
        return {
            source: 'LOCAL_FALLBACK_STORE',
            success: true,
            message: 'Booking created successfully (Node.js Fallback Engine)',
            booking: newBooking
        };
    }

    /**
     * Transition booking lifecycle state
     */
    async transitionStatus(bookingId, targetStatus) {
        try {
            const res = await fetch(`${this.baseUrl}/api/bookings/${bookingId}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetStatus }),
                signal: AbortSignal.timeout(3000)
            });
            if (res.ok) {
                const data = await res.json();
                return { source: 'JAVA_MICROSERVICE', ...data };
            }
            const errData = await res.json();
            return { success: false, ...errData };
        } catch (err) {}

        const b = this.fallbackBookings.find(item => item.bookingId === bookingId || item.bookingReference === bookingId);
        if (!b) return { success: false, message: 'Booking not found' };

        // State machine rules check
        const validNext = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
            CHECKED_IN: ['BOARDED'],
            BOARDED: [],
            CANCELLED: []
        };

        if (!validNext[b.status] || !validNext[b.status].includes(targetStatus)) {
            return {
                success: false,
                errorCode: 'INVALID_STATE_TRANSITION',
                message: `Illegal booking state transition from '${b.status}' to '${targetStatus}'.`
            };
        }

        b.status = targetStatus;
        return {
            source: 'LOCAL_FALLBACK_STORE',
            success: true,
            message: `Transitioned state to ${targetStatus}`,
            booking: b
        };
    }

    /**
     * Dynamic Pricing Calculation using Java Strategies
     */
    async calculateDynamicPricing(payload) {
        try {
            const res = await fetch(`${this.baseUrl}/api/pricing/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(3000)
            });
            if (res.ok) {
                const data = await res.json();
                return { source: 'JAVA_MICROSERVICE', ...data };
            }
        } catch (err) {}

        // Fallback pricing calculation
        const base = Number(payload.baseFare) || 200.0;
        const capacity = Number(payload.totalCapacity) || 180;
        const booked = Number(payload.bookedSeats) || 140;
        const days = Number(payload.daysBeforeDeparture) || 5;
        const loadFactor = booked / capacity;

        let multiplier = 1.0;
        if (payload.useSurge) {
            if (loadFactor >= 0.9) multiplier *= 1.6;
            else if (loadFactor >= 0.75) multiplier *= 1.3;
            else if (loadFactor <= 0.3) multiplier *= 0.85;

            if (days <= 2) multiplier *= 1.4;
            else if (days <= 7) multiplier *= 1.15;
        }

        const classMultipliers = { ECONOMY: 1.0, PREMIUM_ECONOMY: 1.3, BUSINESS: 2.2, FIRST_CLASS: 3.5 };
        const classMult = classMultipliers[payload.cabinClass] || 1.0;
        const price = Math.round(base * classMult * multiplier * 100) / 100;

        return {
            source: 'LOCAL_FALLBACK_STORE',
            success: true,
            flightNumber: payload.flightNumber || 'AI-300',
            baseFare: base,
            cabinClass: payload.cabinClass || 'ECONOMY',
            bookedSeats: booked,
            totalCapacity: capacity,
            loadFactor: Math.round(loadFactor * 100) / 100,
            daysBeforeDeparture: days,
            strategy: payload.useSurge ? 'DYNAMIC_SURGE' : 'STANDARD',
            calculatedPrice: price
        };
    }
}

module.exports = new JavaClientService();
