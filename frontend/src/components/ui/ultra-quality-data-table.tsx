import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Plane,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Calendar,
  ArrowRight,
  Eye,
  Radio,
  Layers,
  ShieldCheck,
  Building2,
  CreditCard,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import operationsService from '../../services/operations.service';
import './UltraQualityDataTable.css';

/**
 * Format timestamp into display time 'HH:MM'
 */
function formatTime(isoString) {
  if (!isoString) return '--:--';
  const cleanStr = String(isoString).replace('T', ' ');
  if (cleanStr.length >= 16) {
    return cleanStr.substring(11, 16);
  }
  return cleanStr;
}

/**
 * Format timestamp into display date 'YYYY-MM-DD'
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const cleanStr = String(isoString).replace('T', ' ');
  if (cleanStr.length >= 10) {
    return cleanStr.substring(0, 10);
  }
  return cleanStr;
}

/**
 * Calculate dynamic countdown to target timestamp
 */
function calculateCountdown(targetTimestamp) {
  if (!targetTimestamp) return null;
  const target = new Date(String(targetTimestamp).replace(' ', 'T')).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diffMs = target - now;
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < -120) return null; // Far in past
  if (diffMins < 0) return 'Just departed / arrived';
  if (diffMins < 60) return `In ~${diffMins} min${diffMins === 1 ? '' : 's'}`;
  const hours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  return `In ~${hours}h ${remainingMins}m`;
}

/**
 * Map status to color theme
 */
function getStatusTheme(status) {
  const norm = (status || '').toUpperCase();
  switch (norm) {
    case 'ON_TIME':
    case 'LANDED':
    case 'ARRIVED':
      return {
        className: 'uq-status-green',
        label: norm === 'ON_TIME' ? 'On Time' : (norm === 'LANDED' ? 'Landed' : 'Arrived'),
        dotColor: '#16A34A',
      };
    case 'DELAYED':
      return {
        className: 'uq-status-yellow',
        label: 'Delayed',
        dotColor: '#D97706',
      };
    case 'BOARDING':
    case 'IN_AIR':
    case 'LANDING_SOON':
    case 'CHECK_IN':
    case 'DEPARTED':
      return {
        className: 'uq-status-blue',
        label: norm.replace('_', ' '),
        dotColor: '#2563EB',
      };
    case 'CANCELLED':
    case 'DIVERTED':
    case 'GATE_CLOSED':
      return {
        className: 'uq-status-red',
        label: norm.replace('_', ' '),
        dotColor: '#DC2626',
      };
    case 'SCHEDULED':
    default:
      return {
        className: 'uq-status-grey',
        label: norm.replace('_', ' ') || 'Scheduled',
        dotColor: '#64748B',
      };
  }
}

/**
 * Build dynamic operational narrative
 */
function getDynamicMessage(flight) {
  if (!flight) return 'Scheduled operations';
  const depTime = formatTime(flight.scheduledDeparture);
  const estDepTime = flight.estimatedDeparture ? formatTime(flight.estimatedDeparture) : null;
  const arrTime = formatTime(flight.scheduledArrival);
  const actArrTime = flight.actualArrival ? formatTime(flight.actualArrival) : null;
  const gateStr = flight.departureGate || `${flight.terminal || 'T2'}-${flight.gate || 'G01'}`;

  switch (flight.status) {
    case 'ON_TIME':
      return `On Time — Scheduled departure at ${depTime}`;
    case 'SCHEDULED':
      return `Scheduled — Standard timetable departure at ${depTime}`;
    case 'DELAYED':
      return estDepTime
        ? `Delayed — Estimated departure at ${estDepTime} (+${flight.delayMinutes || 45}m)`
        : `Delayed — Estimate unavailable`;
    case 'BOARDING':
      return `Boarding — Gate ${gateStr}`;
    case 'GATE_CLOSED':
      return `Gate Closed — Final call closed`;
    case 'CHECK_IN':
      return `Check-In Open — Terminal ${flight.terminal || 'T2'}`;
    case 'DEPARTED':
      return `Departed — Airborne on flight path`;
    case 'IN_AIR':
      return `In Flight — En route to ${flight.destAirport || 'Destination'}`;
    case 'LANDING_SOON':
      return `Landing in approximately 25 minutes`;
    case 'LANDED':
    case 'ARRIVED':
      return `Landed — Actual arrival at ${actArrTime || arrTime}`;
    case 'CANCELLED':
      return `Cancelled — Contact airline customer care`;
    case 'DIVERTED':
      return `Diverted — Weather rerouting in progress`;
    default:
      return flight.remarks || 'Standard operations';
  }
}

export function UltraQualityDataTable({
  title = 'Live Flight Status & Operations Board',
  subtitle = 'Real-time telemetry, gate allocation, and autonomous flight tracking',
  initialRoleFilter = null,
  embedded = false,
  onSelectFlight = null,
  onBookFlight = null,
}) {
  const { user } = useAuth();
  const currentRole = user?.role || 'PASSENGER';

  // Core Data State
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isStale, setIsStale] = useState(false);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [airlineFilter, setAirlineFilter] = useState('ALL');
  const [airportFilter, setAirportFilter] = useState('ALL');
  const [movementPill, setMovementPill] = useState('ALL'); // ALL, DEPARTURES, ARRIVALS, DELAYED, BOARDING
  const [myAirlineOnly, setMyAirlineOnly] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState('scheduledDeparture');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Live Auto-Refresh Timer Setting
  const [refreshInterval, setRefreshInterval] = useState(30); // in seconds, 0 = off

  // Flight Detail Modal State
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Clock tick to force countdown updates every 30s
  const [clockTick, setClockTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClockTick(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Flight Data from Backend API
  const fetchFlights = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await operationsService.getFlights();
      const rawData = Array.isArray(result) ? result : (result.data || []);
      setFlights(rawData);
      setLastUpdated(new Date());
      setIsStale(false);
    } catch (err) {
      console.error('Failed to retrieve live flights:', err);
      setError('Unable to synchronize with flight telemetry gateway. Using cached flight manifest.');
      setIsStale(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFlights(false);
  }, [fetchFlights]);

  // Periodic Auto-Refresh
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const intervalId = setInterval(() => {
      fetchFlights(false);
    }, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchFlights]);

  // Derived filter options from live data
  const airlineOptions = useMemo(() => {
    const map = new Map();
    flights.forEach((f) => {
      if (f.airlineCode && !map.has(f.airlineCode)) {
        map.set(f.airlineCode, f.airlineName || f.airlineCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [flights]);

  const airportOptions = useMemo(() => {
    const set = new Set();
    flights.forEach((f) => {
      if (f.originAirport) set.add(f.originAirport);
      if (f.destAirport) set.add(f.destAirport);
    });
    return Array.from(set).sort();
  }, [flights]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter Pipeline
  const filteredFlights = useMemo(() => {
    return flights.filter((f) => {
      // 1. Text Search across multiple dimensions
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = f.flightNumber?.toLowerCase().includes(q);
        const matchAirline = f.airlineName?.toLowerCase().includes(q) || f.airlineCode?.toLowerCase().includes(q);
        const matchOrigin = f.originAirport?.toLowerCase().includes(q) || f.originCity?.toLowerCase().includes(q);
        const matchDest = f.destAirport?.toLowerCase().includes(q) || f.destCity?.toLowerCase().includes(q);
        const matchGate = f.departureGate?.toLowerCase().includes(q) || f.terminal?.toLowerCase().includes(q);
        const matchStatus = f.status?.toLowerCase().includes(q);
        if (!matchNumber && !matchAirline && !matchOrigin && !matchDest && !matchGate && !matchStatus) {
          return false;
        }
      }

      // 2. Status Dropdown Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ON_TIME' && f.status !== 'ON_TIME' && f.status !== 'SCHEDULED') return false;
        if (statusFilter === 'LANDED' && f.status !== 'LANDED' && f.status !== 'ARRIVED') return false;
        if (statusFilter !== 'ON_TIME' && statusFilter !== 'LANDED' && f.status !== statusFilter) return false;
      }

      // 3. Airline Dropdown Filter
      if (airlineFilter !== 'ALL' && f.airlineCode !== airlineFilter) {
        return false;
      }

      // 4. Airport Filter
      if (airportFilter !== 'ALL' && f.originAirport !== airportFilter && f.destAirport !== airportFilter) {
        return false;
      }

      // 5. Airline Staff Carrier Scope
      if (myAirlineOnly && user?.airlineCode && f.airlineCode !== user.airlineCode) {
        return false;
      }

      // 6. Quick Filter Movement Pills
      if (movementPill === 'DEPARTURES') {
        // Departures from primary hubs or specified origin
        if (airportFilter !== 'ALL') {
          if (f.originAirport !== airportFilter) return false;
        } else if (f.status === 'ARRIVED' || f.status === 'LANDED') {
          return false;
        }
      } else if (movementPill === 'ARRIVALS') {
        if (airportFilter !== 'ALL') {
          if (f.destAirport !== airportFilter) return false;
        } else if (f.status === 'DEPARTED' || f.status === 'BOARDING' || f.status === 'GATE_CLOSED') {
          return false;
        }
      } else if (movementPill === 'DELAYED') {
        if (f.status !== 'DELAYED' && (!f.delayMinutes || f.delayMinutes <= 0)) {
          return false;
        }
      } else if (movementPill === 'BOARDING') {
        if (f.status !== 'BOARDING' && f.status !== 'CHECK_IN') {
          return false;
        }
      }

      return true;
    });
  }, [flights, searchQuery, statusFilter, airlineFilter, airportFilter, movementPill, myAirlineOnly, user]);

  // Sorting Pipeline
  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle nulls
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // String comparison
      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(String(bVal));
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      // Numeric / timestamp comparison
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredFlights, sortField, sortDirection]);

  // Pagination Pipeline
  const totalItems = sortedFlights.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedFlights = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFlights.slice(start, start + pageSize);
  }, [sortedFlights, currentPage, pageSize]);

  // Adjust page if filters shrink total items
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Clear all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setAirlineFilter('ALL');
    setAirportFilter('ALL');
    setMovementPill('ALL');
    setMyAirlineOnly(false);
    setCurrentPage(1);
  };

  // Open modal
  const handleOpenDetails = (flight, e) => {
    if (e) e.stopPropagation();
    setSelectedFlight(flight);
    if (onSelectFlight) onSelectFlight(flight);
  };

  return (
    <div className={`uq-datatable-wrapper ${embedded ? 'embedded' : ''}`}>
      {/* 1. Header & Live Telemetry Bar */}
      <div className="uq-header-bar">
        <div className="uq-header-title-group">
          <div className="uq-radar-icon-box">
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="uq-header-title">
              <span>{title}</span>
              {currentRole && (
                <span className="uq-live-pulse-badge">
                  <ShieldCheck size={12} />
                  <span>{currentRole.replace('_', ' ')}</span>
                </span>
              )}
            </h2>
            <p className="uq-header-subtitle">{subtitle}</p>
          </div>
        </div>

        {/* Telemetry controls & Refresh */}
        <div className="uq-telemetry-controls">
          <div className="uq-live-pulse-badge" title="Live background polling status">
            <span className={`uq-pulse-dot ${isStale ? 'stale' : ''}`}></span>
            <span>{isStale ? 'Stale Manifest' : 'Telemetry Live'}</span>
          </div>

          {lastUpdated && (
            <span className="uq-time-sub" title={lastUpdated.toISOString()}>
              Synced: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <select
            className="uq-interval-select"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            title="Auto-refresh frequency"
          >
            <option value={15}>Every 15s</option>
            <option value={30}>Every 30s</option>
            <option value={60}>Every 60s</option>
            <option value={0}>Auto-refresh Off</option>
          </select>

          <button
            type="button"
            className="uq-refresh-btn"
            onClick={() => fetchFlights(true)}
            disabled={refreshing}
            title="Click to force immediate flight telemetry refresh"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error / Stale Notification Banner */}
      {error && (
        <div className="uq-modal-advisory">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Controls, Search, & Filters */}
      <div className="uq-controls-bar">
        <div className="uq-search-and-selects">
          {/* Live Search Input */}
          <div className="uq-search-box">
            <Search size={16} className="uq-search-icon" />
            <input
              type="text"
              className="uq-search-input"
              placeholder="Search flight #, airline, city, airport, gate..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="uq-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="uq-filter-group">
            <select
              className="uq-select-dropdown"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              title="Filter by flight status"
            >
              <option value="ALL">All Flight Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CHECK_IN">Check-in Open</option>
              <option value="BOARDING">Boarding</option>
              <option value="GATE_CLOSED">Gate Closed</option>
              <option value="DEPARTED">Departed</option>
              <option value="IN_AIR">In Flight / En Route</option>
              <option value="DELAYED">Delayed Flights</option>
              <option value="LANDING_SOON">Landing Soon</option>
              <option value="LANDED">Landed / Arrived</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DIVERTED">Diverted</option>
            </select>

            {/* Airline Filter */}
            <select
              className="uq-select-dropdown"
              value={airlineFilter}
              onChange={(e) => {
                setAirlineFilter(e.target.value);
                setCurrentPage(1);
              }}
              title="Filter by airline carrier"
            >
              <option value="ALL">All Airlines</option>
              {airlineOptions.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>

            {/* Airport Filter */}
            <select
              className="uq-select-dropdown"
              value={airportFilter}
              onChange={(e) => {
                setAirportFilter(e.target.value);
                setCurrentPage(1);
              }}
              title="Filter by airport station"
            >
              <option value="ALL">All Hubs & Stations</option>
              {airportOptions.map((code) => (
                <option key={code} value={code}>
                  Airport: {code}
                </option>
              ))}
            </select>

            {/* Airline Staff Dedicated Carrier Toggle */}
            {currentRole === 'AIRLINE_STAFF' && user?.airlineCode && (
              <button
                type="button"
                className={`uq-pill-btn ${myAirlineOnly ? 'active' : ''}`}
                onClick={() => setMyAirlineOnly((prev) => !prev)}
                title={`Filter exclusively for ${user.airlineCode} aircraft`}
              >
                <Plane size={12} />
                <span>My Fleet ({user.airlineCode})</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Movement Pills */}
        <div className="uq-pills-row">
          <button
            type="button"
            className={`uq-pill-btn ${movementPill === 'ALL' ? 'active' : ''}`}
            onClick={() => {
              setMovementPill('ALL');
              setCurrentPage(1);
            }}
          >
            <span>All Movements</span>
            <span className="uq-pill-count">{flights.length}</span>
          </button>
          <button
            type="button"
            className={`uq-pill-btn ${movementPill === 'DEPARTURES' ? 'active' : ''}`}
            onClick={() => {
              setMovementPill('DEPARTURES');
              setCurrentPage(1);
            }}
          >
            <span>Departures</span>
          </button>
          <button
            type="button"
            className={`uq-pill-btn ${movementPill === 'ARRIVALS' ? 'active' : ''}`}
            onClick={() => {
              setMovementPill('ARRIVALS');
              setCurrentPage(1);
            }}
          >
            <span>Arrivals</span>
          </button>
          <button
            type="button"
            className={`uq-pill-btn ${movementPill === 'DELAYED' ? 'active' : ''}`}
            onClick={() => {
              setMovementPill('DELAYED');
              setCurrentPage(1);
            }}
          >
            <span>Delayed Movements</span>
            <span className="uq-pill-count">
              {flights.filter((f) => f.status === 'DELAYED' || (f.delayMinutes && f.delayMinutes > 0)).length}
            </span>
          </button>
          <button
            type="button"
            className={`uq-pill-btn ${movementPill === 'BOARDING' ? 'active' : ''}`}
            onClick={() => {
              setMovementPill('BOARDING');
              setCurrentPage(1);
            }}
          >
            <span>Boarding Active</span>
            <span className="uq-pill-count">
              {flights.filter((f) => f.status === 'BOARDING' || f.status === 'CHECK_IN').length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div className="uq-table-container">
        <table className="uq-table">
          <thead>
            <tr>
              {/* 1. Flight Number */}
              <th className="sortable" onClick={() => handleSort('flightNumber')}>
                <div className="uq-th-content">
                  <span>Flight #</span>
                  {sortField === 'flightNumber' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 2. Airline */}
              <th className="sortable" onClick={() => handleSort('airlineName')}>
                <div className="uq-th-content">
                  <span>Airline</span>
                  {sortField === 'airlineName' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 3. Origin */}
              <th className="sortable" onClick={() => handleSort('originAirport')}>
                <div className="uq-th-content">
                  <span>Origin</span>
                  {sortField === 'originAirport' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 4. Destination */}
              <th className="sortable" onClick={() => handleSort('destAirport')}>
                <div className="uq-th-content">
                  <span>Destination</span>
                  {sortField === 'destAirport' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 5. Scheduled Departure */}
              <th className="sortable" onClick={() => handleSort('scheduledDeparture')}>
                <div className="uq-th-content">
                  <span>Sched. Dep</span>
                  {sortField === 'scheduledDeparture' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 6. Estimated Departure */}
              <th className="sortable" onClick={() => handleSort('estimatedDeparture')}>
                <div className="uq-th-content">
                  <span>Est. Dep</span>
                  {sortField === 'estimatedDeparture' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 7. Scheduled Arrival */}
              <th className="sortable" onClick={() => handleSort('scheduledArrival')}>
                <div className="uq-th-content">
                  <span>Sched. Arr</span>
                  {sortField === 'scheduledArrival' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 8. Estimated Arrival */}
              <th className="sortable" onClick={() => handleSort('estimatedArrival')}>
                <div className="uq-th-content">
                  <span>Est. Arr</span>
                  {sortField === 'estimatedArrival' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 9 & 10. Terminal & Gate */}
              <th>Terminal / Gate</th>

              {/* 11. Flight Status & Dynamic Info */}
              <th className="sortable" onClick={() => handleSort('status')}>
                <div className="uq-th-content">
                  <span>Status & Advisory</span>
                  {sortField === 'status' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} className="uq-sort-icon" /> : <ArrowDown size={12} className="uq-sort-icon" />
                  ) : (
                    <ArrowUpDown size={12} className="uq-sort-icon" />
                  )}
                </div>
              </th>

              {/* 12. Action / Details */}
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* Loading State: Skeleton Shimmer Rows */}
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="uq-skeleton-row">
                  <td colSpan={11}>
                    <div className="uq-skeleton-shimmer"></div>
                  </td>
                </tr>
              ))
            ) : paginatedFlights.length > 0 ? (
              /* Populated Flight Records */
              paginatedFlights.map((flight) => {
                const statusTheme = getStatusTheme(flight.status);
                const opMessage = getDynamicMessage(flight);
                const isDelayed = flight.status === 'DELAYED' || (flight.delayMinutes && flight.delayMinutes > 0);
                const countdown = calculateCountdown(flight.estimatedArrival || flight.scheduledArrival);

                return (
                  <tr
                    key={flight.flightInstanceId || flight.flightNumber}
                    onClick={() => handleOpenDetails(flight)}
                    title={`Click row to inspect complete flight telemetry for ${flight.flightNumber}`}
                  >
                    {/* 1. Flight Number */}
                    <td>
                      <div className="uq-flight-cell">
                        <div className="uq-flight-icon-box">
                          <Plane size={16} />
                        </div>
                        <div>
                          <span className="uq-flight-num">{flight.flightNumber}</span>
                          <span className="uq-flight-type">{flight.flightType || 'DIRECT'}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Airline */}
                    <td>
                      <div className="uq-airline-cell">
                        <span className="uq-airline-name">{flight.airlineName || flight.airlineCode}</span>
                        <span className="uq-airline-code">{flight.airlineCode}</span>
                      </div>
                    </td>

                    {/* 3. Origin */}
                    <td>
                      <div className="uq-route-cell">
                        <span className="uq-route-code">{flight.originAirport}</span>
                        <span className="uq-route-city">{flight.originCity || 'Origin'}</span>
                      </div>
                    </td>

                    {/* 4. Destination */}
                    <td>
                      <div className="uq-route-cell">
                        <span className="uq-route-code">{flight.destAirport}</span>
                        <span className="uq-route-city">{flight.destCity || 'Destination'}</span>
                      </div>
                    </td>

                    {/* 5. Scheduled Departure */}
                    <td>
                      <div className="uq-time-cell">
                        <span className="uq-time-main">{formatTime(flight.scheduledDeparture)}</span>
                        <span className="uq-time-sub">{formatDate(flight.scheduledDeparture)}</span>
                      </div>
                    </td>

                    {/* 6. Estimated Departure */}
                    <td>
                      <div className="uq-time-cell">
                        {flight.status === 'CANCELLED' ? (
                          <span className="uq-time-sub text-muted">N/A (Cancelled)</span>
                        ) : flight.estimatedDeparture ? (
                          <>
                            <span className={`uq-time-main ${isDelayed ? 'uq-time-delayed' : 'uq-time-ontime'}`}>
                              {formatTime(flight.estimatedDeparture)}
                            </span>
                            <span className="uq-time-sub">
                              {isDelayed ? `+${flight.delayMinutes || 45}m delay` : 'On time'}
                            </span>
                          </>
                        ) : (
                          <span className="uq-time-sub">Estimate unavailable</span>
                        )}
                      </div>
                    </td>

                    {/* 7. Scheduled Arrival */}
                    <td>
                      <div className="uq-time-cell">
                        <span className="uq-time-main">{formatTime(flight.scheduledArrival)}</span>
                        <span className="uq-time-sub">{formatDate(flight.scheduledArrival)}</span>
                      </div>
                    </td>

                    {/* 8. Estimated Arrival */}
                    <td>
                      <div className="uq-time-cell">
                        {flight.status === 'CANCELLED' ? (
                          <span className="uq-time-sub text-muted">N/A</span>
                        ) : flight.estimatedArrival ? (
                          <>
                            <span className={`uq-time-main ${isDelayed ? 'uq-time-delayed' : ''}`}>
                              {formatTime(flight.estimatedArrival)}
                            </span>
                            <span className="uq-time-sub">
                              {countdown || 'On schedule'}
                            </span>
                          </>
                        ) : (
                          <span className="uq-time-sub">Estimate unavailable</span>
                        )}
                      </div>
                    </td>

                    {/* 9 & 10. Terminal & Gate */}
                    <td>
                      <span className="uq-gate-badge">
                        <span>{flight.terminal || 'T2'}</span>
                        <span>•</span>
                        <span>{flight.gate || 'G01'}</span>
                      </span>
                    </td>

                    {/* 11. Flight Status & Dynamic Message */}
                    <td>
                      <span className={`uq-status-pill ${statusTheme.className}`}>
                        <span>{statusTheme.label}</span>
                      </span>
                      <span className="uq-op-message">{opMessage}</span>
                    </td>

                    {/* 12. Action / Details */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="uq-details-btn"
                          onClick={(e) => handleOpenDetails(flight, e)}
                          title="View comprehensive telemetry and routing modal"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {onBookFlight && (
                          <button
                            type="button"
                            className="uq-details-btn"
                            style={{ background: '#2563EB', color: '#ffffff', borderColor: '#2563EB' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookFlight(flight);
                            }}
                            title={`Book flight ${flight.flightNumber}`}
                          >
                            <CreditCard size={13} />
                            <span>Book</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : null}
          </tbody>
        </table>

        {/* Empty State */}
        {!loading && paginatedFlights.length === 0 && (
          <div className="uq-empty-box">
            <div className="uq-empty-icon">
              <Filter size={24} />
            </div>
            <h3 className="uq-empty-title">No matching flights found</h3>
            <p className="uq-empty-desc">
              No flights match your active search & filter parameters. Try adjusting your query or resetting all filters.
            </p>
            <button type="button" className="uq-btn-reset" onClick={handleResetFilters}>
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* 4. Pagination Footer */}
      <div className="uq-pagination-footer">
        <div className="uq-pagination-info">
          Showing{' '}
          <strong>
            {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalItems)}
          </strong>{' '}
          of <strong>{totalItems}</strong> tracked flights
        </div>

        <div className="uq-page-size-selector">
          <span>Rows per page:</span>
          <select
            className="uq-page-size-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="uq-pagination-controls">
          <button
            type="button"
            className="uq-page-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            type="button"
            className="uq-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = idx + 1;
            } else if (currentPage <= 3) {
              pageNum = idx + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + idx;
            } else {
              pageNum = currentPage - 2 + idx;
            }
            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                className={`uq-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            className="uq-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            className="uq-page-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>

      {/* 5. Comprehensive Flight Details Modal */}
      {selectedFlight && (
        <div className="uq-modal-backdrop" onClick={() => setSelectedFlight(null)}>
          <div className="uq-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="uq-modal-header">
              <div className="uq-modal-header-left">
                <div className="uq-radar-icon-box">
                  <Plane size={20} />
                </div>
                <div>
                  <div className="uq-modal-flight-code">{selectedFlight.flightNumber}</div>
                  <div className="uq-header-subtitle">
                    {selectedFlight.airlineName || selectedFlight.airlineCode} • {selectedFlight.flightType || 'Commercial Service'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`uq-status-pill ${getStatusTheme(selectedFlight.status).className}`}>
                  {getStatusTheme(selectedFlight.status).label}
                </span>
                <button
                  type="button"
                  className="uq-modal-close-btn"
                  onClick={() => setSelectedFlight(null)}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="uq-modal-body">
              {/* Route Visual Banner */}
              <div className="uq-modal-route-banner">
                <div className="uq-modal-airport">
                  <span className="uq-modal-iata">{selectedFlight.originAirport}</span>
                  <span className="uq-modal-city">{selectedFlight.originCity || 'Origin'}</span>
                  <span className="uq-modal-ap-name">{selectedFlight.originAirportName || 'Origin Airport'}</span>
                </div>

                <div className="uq-modal-plane-transit">
                  <Plane size={24} style={{ transform: 'rotate(90deg)' }} />
                  <div className="uq-modal-transit-line"></div>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Non-Stop Corridor</span>
                </div>

                <div className="uq-modal-airport" style={{ textAlign: 'right' }}>
                  <span className="uq-modal-iata">{selectedFlight.destAirport}</span>
                  <span className="uq-modal-city">{selectedFlight.destCity || 'Destination'}</span>
                  <span className="uq-modal-ap-name">{selectedFlight.destAirportName || 'Destination Airport'}</span>
                </div>
              </div>

              {/* 4-Quadrant Timing Grid */}
              <div className="uq-modal-timing-grid">
                <div className="uq-timing-card">
                  <span className="uq-timing-label">Scheduled Departure</span>
                  <span className="uq-timing-val">{formatTime(selectedFlight.scheduledDeparture)}</span>
                  <span className="uq-timing-note">{formatDate(selectedFlight.scheduledDeparture)} ({selectedFlight.originTimezone || 'UTC'})</span>
                </div>

                <div className="uq-timing-card">
                  <span className="uq-timing-label">Estimated / Actual Departure</span>
                  <span className={`uq-timing-val ${selectedFlight.status === 'DELAYED' ? 'uq-time-delayed' : ''}`}>
                    {selectedFlight.actualDeparture ? formatTime(selectedFlight.actualDeparture) : (selectedFlight.estimatedDeparture ? formatTime(selectedFlight.estimatedDeparture) : 'On schedule')}
                  </span>
                  <span className="uq-timing-note">
                    {selectedFlight.status === 'DELAYED' ? `Delayed by +${selectedFlight.delayMinutes || 45} mins` : 'Cleared for departure'}
                  </span>
                </div>

                <div className="uq-timing-card">
                  <span className="uq-timing-label">Scheduled Arrival</span>
                  <span className="uq-timing-val">{formatTime(selectedFlight.scheduledArrival)}</span>
                  <span className="uq-timing-note">{formatDate(selectedFlight.scheduledArrival)} ({selectedFlight.destTimezone || 'UTC'})</span>
                </div>

                <div className="uq-timing-card">
                  <span className="uq-timing-label">Estimated / Actual Arrival</span>
                  <span className="uq-timing-val">
                    {selectedFlight.actualArrival ? formatTime(selectedFlight.actualArrival) : (selectedFlight.estimatedArrival ? formatTime(selectedFlight.estimatedArrival) : 'On schedule')}
                  </span>
                  <span className="uq-timing-note">
                    {calculateCountdown(selectedFlight.estimatedArrival || selectedFlight.scheduledArrival) || 'Approaching destination'}
                  </span>
                </div>
              </div>

              {/* Logistics & Aircraft Information */}
              <div className="uq-modal-logistics-grid">
                <div className="uq-logistics-item">
                  <span className="uq-logistics-label">Departure Gate</span>
                  <span className="uq-logistics-val">{selectedFlight.departureGate || `${selectedFlight.terminal || 'T2'}-${selectedFlight.gate || 'G01'}`}</span>
                </div>
                <div className="uq-logistics-item">
                  <span className="uq-logistics-label">Aircraft Equipment</span>
                  <span className="uq-logistics-val">{selectedFlight.aircraftModel || 'Boeing 777-300ER'}</span>
                </div>
                <div className="uq-logistics-item">
                  <span className="uq-logistics-label">Registration Tail</span>
                  <span className="uq-logistics-val">{selectedFlight.aircraftReg || 'VT-ANX'}</span>
                </div>
                <div className="uq-logistics-item">
                  <span className="uq-logistics-label">Arrival Terminal</span>
                  <span className="uq-logistics-val">{selectedFlight.arrivalTerminal || 'T1'}</span>
                </div>
                <div className="uq-logistics-item">
                  <span className="uq-logistics-label">Arrival Gate</span>
                  <span className="uq-logistics-val">{selectedFlight.arrivalGate || 'A12'}</span>
                </div>
                <div className="uq-logistics-item">
                  <span className="uq-logistics-label">Baggage Reclaim</span>
                  <span className="uq-logistics-val">Carousel 04</span>
                </div>
              </div>

              {/* Live Operational Advisory Banner */}
              <div className="uq-modal-advisory">
                <Info size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Operational Dispatch Notice:</strong>
                  <div>{getDynamicMessage(selectedFlight)}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="uq-modal-footer">
              {onBookFlight && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#2563EB',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    onBookFlight(selectedFlight);
                    setSelectedFlight(null);
                  }}
                >
                  <CreditCard size={15} />
                  <span>Reserve Flight ({selectedFlight.flightNumber})</span>
                </button>
              )}
              <button
                type="button"
                className="uq-modal-btn-close"
                onClick={() => setSelectedFlight(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UltraQualityDataTable;
