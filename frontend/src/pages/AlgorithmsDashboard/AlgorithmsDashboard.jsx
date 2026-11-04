import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Boxes,
  Compass,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  Tag,
  DollarSign,
  Shield,
  Plane,
  Server
} from 'lucide-react';
import integrationService from '../../services/integration.service';
import './AlgorithmsDashboard.css';

export default function AlgorithmsDashboard() {
  const [activeTab, setActiveTab] = useState('gates');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // C Engine Data
  const [gateData, setGateData] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [routeData, setRouteData] = useState(null);

  // Java OOP Data
  const [bookings, setBookings] = useState([]);
  const [pricingInput, setPricingInput] = useState({
    flightNumber: 'AI-202',
    baseFare: 200,
    totalCapacity: 180,
    bookedSeats: 155,
    daysBeforeDeparture: 2,
    cabinClass: 'ECONOMY',
    useSurge: true
  });
  const [pricingResult, setPricingResult] = useState(null);

  // Load Integration Status
  const loadStatus = async () => {
    try {
      const res = await integrationService.getStatus();
      setStatus(res);
    } catch (err) {
      console.warn('Status fetch error:', err);
    }
  };

  // Load C Gate Allocation
  const loadGateAllocation = async () => {
    setLoading(true);
    try {
      const res = await integrationService.getGateAllocation();
      setGateData(res.data);
    } catch (err) {
      setMessage('Error loading gate allocation');
    } finally {
      setLoading(false);
    }
  };

  // Load C Runway Priority Queue
  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await integrationService.getRunwayQueue();
      setQueueData(res.data);
    } catch (err) {
      setMessage('Error loading runway queue');
    } finally {
      setLoading(false);
    }
  };

  // Load C Baggage Routing
  const loadRoute = async () => {
    setLoading(true);
    try {
      const res = await integrationService.getBaggageRouting();
      setRouteData(res.data);
    } catch (err) {
      setMessage('Error loading baggage routing');
    } finally {
      setLoading(false);
    }
  };

  // Load Java Bookings
  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await integrationService.getJavaBookings();
      if (res.bookings) setBookings(res.bookings);
    } catch (err) {
      setMessage('Error loading Java bookings');
    } finally {
      setLoading(false);
    }
  };

  // Calculate Dynamic Price
  const handleCalculatePrice = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await integrationService.calculatePricing(pricingInput);
      setPricingResult(res);
    } catch (err) {
      setMessage('Pricing calculation failed');
    } finally {
      setLoading(false);
    }
  };

  // Transition Java Booking Status
  const handleTransition = async (bookingId, targetStatus) => {
    try {
      const res = await integrationService.transitionJavaBooking(bookingId, targetStatus);
      if (res.success) {
        setMessage(`Success: ${res.message}`);
        loadBookings();
      } else {
        setMessage(`Transition Rejected: ${res.message || 'Illegal State Transition'}`);
      }
    } catch (err) {
      setMessage(`Transition Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => {
    loadStatus();
    loadGateAllocation();
    loadQueue();
    loadRoute();
    loadBookings();
  }, []);

  return (
    <div className="algorithms-container">
      {/* Header */}
      <div className="algorithms-header">
        <h1 className="algorithms-title">
          <Cpu className="w-7 h-7 text-sky-400" />
          Multi-Language Engine & OOP Services Lab
        </h1>
        <p className="algorithms-subtitle">
          Phase 09: ANSI C99 High-Performance Data Structures & Java 17 Object-Oriented Domain Microservice.
        </p>
      </div>

      {/* System Status Ribbon */}
      <div className="status-ribbon">
        <div className="status-box">
          <div>
            <div className="status-box-title">
              <Cpu size={16} className="text-sky-400" />
              C Algorithm Engine (CLI Harness)
            </div>
            <div className="status-box-desc">
              {status?.cEngine?.available ? 'Compiled MSVC Native Binary (c-engine.exe)' : 'Node.js Fallback Engine'}
            </div>
          </div>
          <span className={status?.cEngine?.available ? 'badge-online' : 'badge-fallback'}>
            {status?.cEngine?.available ? 'NATIVE C COMPILED' : 'FALLBACK ACTIVE'}
          </span>
        </div>

        <div className="status-box">
          <div>
            <div className="status-box-title">
              <Server size={16} className="text-emerald-400" />
              Java 17 OOP Microservice
            </div>
            <div className="status-box-desc">
              {status?.javaService?.connected ? 'Live HTTP Service (Port 5050)' : 'Node.js Simulation Layer'}
            </div>
          </div>
          <span className={status?.javaService?.connected ? 'badge-online' : 'badge-fallback'}>
            {status?.javaService?.connected ? 'PORT 5050 CONNECTED' : 'OFFLINE FALLBACK'}
          </span>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div className="algo-explanation" style={{ marginBottom: 16, borderColor: '#f59e0b' }}>
          <strong>Notice:</strong> {message}
          <button style={{ float: 'right', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }} onClick={() => setMessage('')}>✕</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="algo-tabs">
        <button
          className={`algo-tab-btn ${activeTab === 'gates' ? 'active' : ''}`}
          onClick={() => setActiveTab('gates')}
        >
          <Layers size={16} />
          Algorithm A: Gate Allocation (O(F·G))
        </button>
        <button
          className={`algo-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <Plane size={16} />
          Algorithm B: Runway Priority Queue (Min-Heap)
        </button>
        <button
          className={`algo-tab-btn ${activeTab === 'routing' ? 'active' : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          <Compass size={16} />
          Algorithm C: Baggage Conveyor (Dijkstra)
        </button>
        <button
          className={`algo-tab-btn ${activeTab === 'java' ? 'active' : ''}`}
          onClick={() => setActiveTab('java')}
        >
          <Boxes size={16} />
          Java OOP: State Machine & Pricing
        </button>
      </div>

      {/* TAB 1: C GATE ALLOCATION */}
      {activeTab === 'gates' && (
        <div className="algo-card">
          <div className="algo-card-title">
            <span>Stand & Gate Assignment Optimization</span>
            <button className="btn-primary" onClick={loadGateAllocation} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Re-run C Allocation
            </button>
          </div>

          <div className="algo-explanation">
            <strong>Theoretical Concept for Viva:</strong> Greedy Bipartite Matching algorithm in ANSI C.
            It evaluates aircraft wingspan physical compatibility (Narrow-body vs Wide-body) and enforces a
            <strong> 30-minute turnaround safety buffer</strong> between consecutive flight movements to prevent tarmac collisions.
            Time Complexity: <code>O(Flights × Gates)</code>.
          </div>

          {gateData && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.85rem' }}>
                <div><strong>Algorithm:</strong> {gateData.algorithm}</div>
                <div><strong>Complexity:</strong> <code>{gateData.timeComplexity}</code></div>
                <div><strong>Execution Mode:</strong> <span style={{ color: '#38bdf8' }}>{gateData.executionMode || 'NATIVE_C_BINARY'}</span></div>
                <div><strong>Allocated:</strong> {gateData.allocatedCount} / {gateData.totalFlights} Flights</div>
              </div>

              <table className="algo-table">
                <thead>
                  <tr>
                    <th>Flight No</th>
                    <th>Assigned Stand</th>
                    <th>Stand Code</th>
                    <th>Allocation Status</th>
                    <th>Operational Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {gateData.allocations?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.flightNumber}</td>
                      <td>Gate #{item.assignedGateId > 0 ? item.assignedGateId : 'N/A'}</td>
                      <td><span className="badge-online">{item.gateCode || 'UNASSIGNED'}</span></td>
                      <td>{item.isAllocated ? '✔ Assigned' : '✖ Unassigned'}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: C RUNWAY PRIORITY QUEUE */}
      {activeTab === 'queue' && (
        <div className="algo-card">
          <div className="algo-card-title">
            <span>Runway Takeoff Priority Queue (Binary Min-Heap)</span>
            <button className="btn-primary" onClick={loadQueue} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Re-evaluate Runway Queue
            </button>
          </div>

          <div className="algo-explanation">
            <strong>Theoretical Concept for Viva:</strong> Implemented via an array-backed <strong>Binary Min-Heap</strong> in C.
            Urgency score formula: <code>Departure_Minute - (Delay_Minutes × 2) - (Emergency ? 10000 : 0)</code>.
            Air Ambulance/Medical Emergencies instantly pre-empt regular commercial flights to position #1.
            Time Complexity: <code>Insert O(log N)</code>, <code>Extract-Min O(log N)</code>, <code>Peek O(1)</code>.
          </div>

          {queueData && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.85rem' }}>
                <div><strong>Data Structure:</strong> {queueData.dataStructure}</div>
                <div><strong>Queue Size:</strong> {queueData.queueSize} flights in queue</div>
                <div><strong>Takeoff Sequence Complexity:</strong> <code>O(log N) per slot</code></div>
              </div>

              <div className="queue-grid">
                {queueData.sequencedTakeoffs?.map((item, idx) => (
                  <div key={idx} className={`queue-card ${item.isEmergency ? 'emergency' : ''}`}>
                    <div className="queue-rank">#{item.sequenceRank}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                      {item.flightNumber}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
                      <div>Status: {item.isEmergency ? <span style={{ color: '#ef4444', fontWeight: 700 }}>🚨 MEDICAL EMERGENCY</span> : 'Scheduled Flight'}</div>
                      <div>Scheduled Time: {Math.floor(item.scheduledDepartureMinute / 60).toString().padStart(2, '0')}:{(item.scheduledDepartureMinute % 60).toString().padStart(2, '0')}</div>
                      <div>Delay: {item.delayMinutes} mins</div>
                      <div>Heap Score: <code>{item.calculatedUrgencyScore}</code></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: C BAGGAGE DIJKSTRA ROUTING */}
      {activeTab === 'routing' && (
        <div className="algo-card">
          <div className="algo-card-title">
            <span>Baggage Conveyor Shortest Path (Dijkstra)</span>
            <button className="btn-primary" onClick={loadRoute} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Re-calculate Conveyor Path
            </button>
          </div>

          <div className="algo-explanation">
            <strong>Theoretical Concept for Viva:</strong> Models the airport conveyor network as a <strong>Directed Weighted Graph</strong>.
            Nodes represent Check-in Desks, Security X-Ray Scanners, Automated Sorters, Ramp Loading Stations, and Aircraft Holds.
            Edge weights represent physical transit time in seconds.
            Time Complexity: <code>O(V²)</code>.
          </div>

          {routeData && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: '0.85rem' }}>
                <div><strong>Source:</strong> {routeData.sourceNode}</div>
                <div><strong>Target:</strong> {routeData.targetNode}</div>
                <div><strong>Total Transit Time:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>{routeData.totalTransitTimeSeconds} seconds ({Math.round(routeData.totalTransitTimeSeconds / 60)} mins)</span></div>
                <div><strong>Route Status:</strong> {routeData.routeFound ? <span className="badge-online">OPTIMAL ROUTE FOUND</span> : <span className="badge-fallback">NO PATH</span>}</div>
              </div>

              <div className="route-flow">
                {routeData.pathCheckpoints?.map((cp, idx) => (
                  <React.Fragment key={idx}>
                    <div className="checkpoint-node">
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>STOP #{cp.order}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', margin: '4px 0' }}>{cp.name}</div>
                      <span className="badge-online" style={{ fontSize: '0.7rem' }}>{cp.type}</span>
                    </div>
                    {idx < routeData.pathCheckpoints.length - 1 && (
                      <ArrowRight className="checkpoint-arrow" size={24} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: JAVA OOP SERVICES & DYNAMIC PRICING */}
      {activeTab === 'java' && (
        <div>
          {/* Dynamic Pricing Strategy */}
          <div className="algo-card">
            <div className="algo-card-title">
              <span>Java Strategy Pattern: Dynamic Flight Pricing</span>
            </div>

            <div className="algo-explanation">
              <strong>OOP Concepts for Viva:</strong> Demonstrates <strong>Polymorphism</strong> and <strong>Strategy Pattern</strong>.
              The <code>PricingStrategy</code> interface decouples algorithm from execution.
              <code>StandardPricingStrategy</code> applies fixed cabin multipliers, while <code>SurgePricingStrategy</code>
              analyzes flight load factor (&gt;75%, &gt;90%) and urgency countdown (&le;2 days) to dynamically adjust ticket prices.
            </div>

            <form onSubmit={handleCalculatePrice}>
              <div className="pricing-form-grid">
                <div className="form-group">
                  <label>Flight Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pricingInput.flightNumber}
                    onChange={(e) => setPricingInput({ ...pricingInput, flightNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Base Fare ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={pricingInput.baseFare}
                    onChange={(e) => setPricingInput({ ...pricingInput, baseFare: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Aircraft Capacity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={pricingInput.totalCapacity}
                    onChange={(e) => setPricingInput({ ...pricingInput, totalCapacity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Currently Booked Seats</label>
                  <input
                    type="number"
                    className="form-control"
                    value={pricingInput.bookedSeats}
                    onChange={(e) => setPricingInput({ ...pricingInput, bookedSeats: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Days Before Departure</label>
                  <input
                    type="number"
                    className="form-control"
                    value={pricingInput.daysBeforeDeparture}
                    onChange={(e) => setPricingInput({ ...pricingInput, daysBeforeDeparture: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Cabin Class</label>
                  <select
                    className="form-control"
                    value={pricingInput.cabinClass}
                    onChange={(e) => setPricingInput({ ...pricingInput, cabinClass: e.target.value })}
                  >
                    <option value="ECONOMY">Economy (1.0x)</option>
                    <option value="PREMIUM_ECONOMY">Premium Economy (1.3x)</option>
                    <option value="BUSINESS">Business (2.2x)</option>
                    <option value="FIRST_CLASS">First Class (3.5x)</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input
                    type="checkbox"
                    id="surgeCheck"
                    checked={pricingInput.useSurge}
                    onChange={(e) => setPricingInput({ ...pricingInput, useSurge: e.target.checked })}
                  />
                  <label htmlFor="surgeCheck" style={{ margin: 0, cursor: 'pointer', color: '#f1f5f9' }}>
                    Enable Dynamic Surge Strategy
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                <DollarSign size={14} />
                Calculate Strategy Price
              </button>
            </form>

            {pricingResult && (
              <div className="price-result-box">
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Calculated via Strategy: <strong>{pricingResult.strategy}</strong> | Load Factor: <strong>{Math.round(pricingResult.loadFactor * 100)}%</strong>
                </div>
                <div className="price-display">
                  ${pricingResult.calculatedPrice.toFixed(2)}
                </div>
                <div style={{ color: '#38bdf8', fontSize: '0.8rem' }}>
                  {pricingResult.strategy === 'DYNAMIC_SURGE' ? '⚡ High demand load & urgency multipliers applied' : 'Standard fixed tier rate applied'}
                </div>
              </div>
            )}
          </div>

          {/* Booking State Machine Management */}
          <div className="algo-card">
            <div className="algo-card-title">
              <span>Java State Machine: Booking Lifecycle Workflow</span>
              <button className="btn-secondary" onClick={loadBookings} disabled={loading}>
                <RefreshCw size={14} /> Refresh Bookings
              </button>
            </div>

            <div className="algo-explanation">
              <strong>State Machine Rules for Viva:</strong> Enforces valid state transitions:
              <code>PENDING &rarr; CONFIRMED &rarr; CHECKED_IN &rarr; BOARDED</code>.
              Only <code>PENDING</code> or <code>CONFIRMED</code> bookings may be cancelled.
              Illegal transitions (e.g. attempting to cancel after boarding, or jumping from PENDING to BOARDED)
              throw custom Java exceptions: <code>InvalidBookingStateException</code> and <code>InvalidCancellationException</code>.
            </div>

            <table className="algo-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Type & Fee</th>
                  <th>Passenger</th>
                  <th>Flight & Seat</th>
                  <th>Lifecycle Status</th>
                  <th>Advance State (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td style={{ fontWeight: 600, color: '#38bdf8' }}>{b.bookingReference}</td>
                    <td>
                      <div><strong>{b.bookingType}</strong></div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fee: ${b.serviceFee}</div>
                    </td>
                    <td>{b.passenger?.name || 'Guest'}</td>
                    <td>
                      <div>{b.flight?.flightNumber} ({b.ticket?.seatNumber || 'Unassigned'})</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{b.ticket?.cabinClass || 'ECONOMY'}</div>
                    </td>
                    <td>
                      <span className={b.status === 'CANCELLED' ? 'badge-fallback' : 'badge-online'}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {b.status === 'PENDING' && (
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleTransition(b.bookingId, 'CONFIRMED')}>
                            Confirm
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleTransition(b.bookingId, 'CHECKED_IN')}>
                            Check-In
                          </button>
                        )}
                        {b.status === 'CHECKED_IN' && (
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleTransition(b.bookingId, 'BOARDED')}>
                            Board Flight
                          </button>
                        )}
                        {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#ef4444' }} onClick={() => handleTransition(b.bookingId, 'CANCELLED')}>
                            Cancel
                          </button>
                        )}
                        {b.status === 'BOARDED' && (
                          <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>✔ Journey Complete</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
