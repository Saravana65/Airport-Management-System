import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  RefreshCw,
  Play,
  Check,
  X,
  Layers,
  Database,
  ArrowRight,
  TrendingUp,
  FileText,
  DoorOpen,
  Plane,
  Ticket,
  Luggage,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import DashboardCard from '../../components/DashboardCard/DashboardCard';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import aadeService from '../../services/aade.service';
import './AadeDashboard.css';

export function AadeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [error, setError] = useState(null);

  // Live Telemetry State
  const [status, setStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [conflicts, setConflicts] = useState({ conflicts: [], duplicates: [] });
  const [utilization, setUtilization] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [events, setEvents] = useState([]);

  const loadAadeTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        st,
        hlth,
        alrts,
        confs,
        util,
        recs,
        apprs,
        audits,
        evts,
      ] = await Promise.all([
        aadeService.getStatus().catch(() => null),
        aadeService.getHealth().catch(() => null),
        aadeService.getAlerts().catch(() => []),
        aadeService.getConflicts().catch(() => ({ conflicts: [], duplicates: [] })),
        aadeService.getUtilization().catch(() => null),
        aadeService.getRecommendations().catch(() => []),
        aadeService.getApprovals().catch(() => []),
        aadeService.getAuditLogs().catch(() => []),
        aadeService.getEvents().catch(() => []),
      ]);

      setStatus(st);
      setHealth(hlth);
      setAlerts(alrts);
      setConflicts(confs || { conflicts: [], duplicates: [] });
      setUtilization(util);
      setRecommendations(recs);
      setApprovals(apprs);
      setAuditLogs(audits);
      setEvents(evts);
    } catch (err) {
      setError(err.message || 'Failed to load AADE telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAadeTelemetry();
  }, []);

  const handleRunCycleNow = async () => {
    setRunningCycle(true);
    try {
      const result = await aadeService.runCycle();
      setActionSuccess(`Monitoring cycle #${result.cycleNumber} executed successfully in ${result.durationMs}ms!`);
      loadAadeTelemetry();
    } catch (err) {
      alert(`Monitoring cycle failed: ${err.message}`);
    } finally {
      setRunningCycle(false);
    }
  };

  const handleApproveAction = async (approvalId, title) => {
    const remarks = window.prompt(`Approve Action: "${title}"?\nEnter optional operational remarks:`, 'Approved by station operations lead.');
    if (remarks === null) return;

    try {
      await aadeService.approveAction(approvalId, remarks);
      setActionSuccess(`Action proposal #${approvalId} approved and executed in database!`);
      loadAadeTelemetry();
    } catch (err) {
      alert(`Approval execution failed: ${err.message}`);
    }
  };

  const handleRejectAction = async (approvalId, title) => {
    const remarks = window.prompt(`Reject proposal: "${title}"?\nEnter reason for rejection:`, 'Rejected by operator discretion.');
    if (remarks === null) return;

    try {
      await aadeService.rejectAction(approvalId, remarks);
      setActionSuccess(`Proposal #${approvalId} marked as REJECTED.`);
      loadAadeTelemetry();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await aadeService.resolveAlert(alertId);
      setActionSuccess(`Alert #${alertId} marked as RESOLVED.`);
      loadAadeTelemetry();
    } catch (err) {
      alert(`Failed to resolve alert: ${err.message}`);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const pendingApprovals = approvals.filter(a => a.decision === 'PENDING');

  return (
    <div className="aade-container">
      {/* Banner */}
      <div className="dashboard-welcome-banner aade-banner">
        <div className="banner-left">
          <div className="banner-icon-box aade-icon-box">
            <Cpu size={26} className="banner-aade-icon text-amber" />
          </div>
          <div>
            <h2 className="banner-title">
              Autonomous Airport Data Engine (AADE)
            </h2>
            <p className="banner-description">
              Intelligent monitoring layer: Real-time invariant inspection, gate overlap detection, duplicate booking sentinels, rule-based recommendations, and human approval queue.
            </p>
          </div>
        </div>
        <div className="banner-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleRunCycleNow}
            disabled={runningCycle}
          >
            <Play size={15} className={runningCycle ? 'animate-spin' : ''} />
            <span>{runningCycle ? 'Inspecting Data...' : 'Run Monitoring Cycle'}</span>
          </button>
          <StatusBadge status="ACTIVE" label="ENGINE ONLINE (30S INTERVAL)" />
        </div>
      </div>

      {actionSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
          <button className="close-btn" onClick={() => setActionSuccess('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* 1. Core Engine Telemetry Cards */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">AADE Operations Telemetry</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadAadeTelemetry}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Engine</span>
          </button>
        </div>

        <div className="metrics-grid">
          <DashboardCard
            title="Monitoring Cycles Run"
            icon={Activity}
            value={status?.totalCyclesRun || 0}
            subtitle={`Last executed: ${status?.lastCycleTime ? status.lastCycleTime.split('T')[1].substring(0, 8) : 'Awaiting start'}`}
            badgeStatus="OPERATIONAL"
            badgeLabel="SCHEDULED"
          />

          <DashboardCard
            title="Active Operational Alerts"
            icon={AlertTriangle}
            value={activeAlerts.length}
            subtitle="Deduplicated active issues"
            badgeStatus={activeAlerts.length > 0 ? 'WARNING' : 'OPERATIONAL'}
            badgeLabel="SENTINEL"
          />

          <DashboardCard
            title="Pending Human Approvals"
            icon={Shield}
            value={pendingApprovals.length}
            subtitle="Corrective actions awaiting review"
            badgeStatus={pendingApprovals.length > 0 ? 'WARNING' : 'OPERATIONAL'}
            badgeLabel="APPROVAL QUEUE"
          />

          <DashboardCard
            title="Database Invariant State"
            icon={Database}
            value={health?.overallStatus || 'HEALTHY'}
            subtitle={health?.isOracleOnline ? 'Oracle XE 1521 Active' : 'Resilient In-Memory Mode'}
            badgeStatus={health?.overallStatus === 'HEALTHY' ? 'OPERATIONAL' : 'ACTIVE'}
            badgeLabel="STORAGE"
          />
        </div>
      </section>

      {/* 2. AADE Multi-Section Console Tabs */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">AADE Autonomous Command Console</h3>
          <div className="console-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Cpu size={14} />
              <span>Active Alerts ({activeAlerts.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'conflicts' ? 'active' : ''}`}
              onClick={() => setActiveTab('conflicts')}
            >
              <AlertTriangle size={14} />
              <span>Conflicts & Collisions ({conflicts.conflicts.length + conflicts.duplicates.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <Shield size={14} />
              <span>Approval Queue ({pendingApprovals.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'utilization' ? 'active' : ''}`}
              onClick={() => setActiveTab('utilization')}
            >
              <TrendingUp size={14} />
              <span>Resource Utilization</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <FileText size={14} />
              <span>Audit History ({auditLogs.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              <Activity size={14} />
              <span>Event Stream ({events.length})</span>
            </button>
          </div>
        </div>

        <div className="operations-console-panel">
          {/* TAB 1: ACTIVE ALERTS */}
          {activeTab === 'overview' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Real-time operational alerts with cryptographic hash key deduplication (prevents duplicate alert spamming).
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="activity-stream-empty">
                  <CheckCircle2 size={36} className="text-emerald" />
                  <h4 className="empty-title">Zero Active Anomalies</h4>
                  <p className="empty-desc">
                    The Autonomous Airport Data Engine inspected all 12 operational entities and detected zero relational or scheduling violations.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Alert Category</th>
                        <th>Title & Description</th>
                        <th>Occurrences</th>
                        <th>Last Detected</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((a) => (
                        <tr key={a.alertId}>
                          <td>
                            <StatusBadge status={a.severity} label={a.severity} size="sm" />
                          </td>
                          <td className="mono font-bold text-amber">{a.alertType}</td>
                          <td>
                            <div className="font-medium text-white">{a.title}</div>
                            <div className="text-muted" style={{ fontSize: '12px' }}>{a.message}</div>
                          </td>
                          <td className="mono font-bold text-white">x{a.occurrenceCount || 1}</td>
                          <td className="mono text-muted">{a.lastDetectedAt ? a.lastDetectedAt.split('T')[1].substring(0, 8) : '--'}</td>
                          <td>
                            <StatusBadge status={a.status} label={a.status} size="sm" />
                          </td>
                          <td>
                            {a.status === 'ACTIVE' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleResolveAlert(a.alertId)}
                              >
                                <Check size={13} />
                                <span>Resolve</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFLICTS & COLLISION SENTINEL */}
          {activeTab === 'conflicts' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Aerobridge gate overlaps, flights assigned to closed stands, and duplicate seat allocation collisions.
                </span>
              </div>

              {conflicts.conflicts.length === 0 && conflicts.duplicates.length === 0 ? (
                <div className="activity-stream-empty">
                  <DoorOpen size={36} className="text-emerald" />
                  <h4 className="empty-title">All Apron Stands & Seats Clear</h4>
                  <p className="empty-desc">
                    No overlapping gate allocations or duplicate passenger seat collisions currently exist in the database.
                  </p>
                </div>
              ) : (
                <div>
                  {conflicts.conflicts.map((c, idx) => (
                    <div key={`conf-${idx}`} className="conflict-card">
                      <div className="conflict-header">
                        <div className="conflict-title">
                          <AlertTriangle size={16} className="text-red" />
                          <span>{c.conflictType.replace(/_/g, ' ')}: {c.gateIdentifier}</span>
                        </div>
                        <StatusBadge status={c.severity} label={c.severity} size="sm" />
                      </div>
                      <p className="conflict-desc">{c.message}</p>
                      <div className="conflict-meta">
                        Affected Movements: {c.flightNumbers?.join(' vs ') || 'Flight instance'}
                      </div>
                    </div>
                  ))}

                  {conflicts.duplicates.map((d, idx) => (
                    <div key={`dup-${idx}`} className="conflict-card warning-card">
                      <div className="conflict-header">
                        <div className="conflict-title">
                          <Ticket size={16} className="text-amber" />
                          <span>{d.issueCode.replace(/_/g, ' ')}</span>
                        </div>
                        <StatusBadge status={d.severity} label={d.severity} size="sm" />
                      </div>
                      <p className="conflict-desc">{d.message}</p>
                      <div className="conflict-meta">
                        Entity Key: {d.entityId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECOMMENDATIONS & HUMAN APPROVAL QUEUE */}
          {activeTab === 'recommendations' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Rule-based corrective actions generated by AADE. Critical operational changes require authorized operator approval.
                </span>
              </div>

              {approvals.length === 0 ? (
                <div className="activity-stream-empty">
                  <Shield size={36} className="text-emerald" />
                  <h4 className="empty-title">Approval Queue Empty</h4>
                  <p className="empty-desc">
                    No corrective actions currently awaiting operator intervention.
                  </p>
                </div>
              ) : (
                <div>
                  {approvals.map((appr) => {
                    const rec = recommendations.find(r => r.recommendationId === appr.recommendationId);
                    return (
                      <div key={appr.approvalId} className="recommendation-card">
                        <div className="rec-header">
                          <div className="rec-title-group">
                            <span className="rec-category-tag">{appr.actionType}</span>
                            <h4 className="rec-title">{appr.title}</h4>
                          </div>
                          <span className={`rec-status-tag rec-status-${appr.decision.toLowerCase()}`}>
                            {appr.decision}
                          </span>
                        </div>

                        <div className="rec-body-grid">
                          <div className="rec-block">
                            <span className="rec-label">What Was Detected</span>
                            <p className="rec-text">{rec?.detectedIssue || appr.description}</p>
                          </div>
                          <div className="rec-block">
                            <span className="rec-label">Engineering Rationale</span>
                            <p className="rec-text">{rec?.rationale || 'Corrects operational scheduling violation.'}</p>
                          </div>
                          <div className="rec-block" style={{ gridColumn: '1 / -1' }}>
                            <span className="rec-label">Suggested Corrective Action</span>
                            <p className="rec-text rec-action-highlight">
                              {rec?.suggestedAction || appr.description}
                            </p>
                          </div>
                        </div>

                        <div className="rec-footer">
                          <div className="mono text-muted" style={{ fontSize: '11px' }}>
                            Requested at: {appr.requestedAt} {appr.decisionRemarks ? `• Remarks: ${appr.decisionRemarks}` : ''}
                          </div>

                          {appr.decision === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleRejectAction(appr.approvalId, appr.title)}
                              >
                                <X size={13} />
                                <span>Reject Proposal</span>
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApproveAction(appr.approvalId, appr.title)}
                              >
                                <Check size={13} />
                                <span>Approve & Execute</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RESOURCE UTILIZATION */}
          {activeTab === 'utilization' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Calculated resource metrics: Aerobridge gate occupancy, fleet deployment, and runway congestion.
                </span>
              </div>

              {utilization && (
                <div>
                  <div className="utilization-summary-grid">
                    <div className="util-card">
                      <div className="util-card-header">
                        <span className="util-card-title">Gate Stand Utilization</span>
                        <DoorOpen size={18} className="text-amber" />
                      </div>
                      <div className="util-card-stat">{utilization.gates?.utilizationRate}</div>
                      <div className="util-progress-bar-bg">
                        <div
                          className="util-progress-bar-fill"
                          style={{ width: utilization.gates?.utilizationRate || '0%' }}
                        ></div>
                      </div>
                      <span className="mono text-muted" style={{ fontSize: '11px' }}>
                        {utilization.gates?.occupied} of {utilization.gates?.total} Gates in active use ({utilization.gates?.available} Available)
                      </span>
                    </div>

                    <div className="util-card">
                      <div className="util-card-header">
                        <span className="util-card-title">Commercial Fleet Deployment</span>
                        <Plane size={18} className="text-amber" />
                      </div>
                      <div className="util-card-stat">{utilization.fleet?.utilizationRate}</div>
                      <div className="util-progress-bar-bg">
                        <div
                          className="util-progress-bar-fill"
                          style={{ width: utilization.fleet?.utilizationRate || '0%' }}
                        ></div>
                      </div>
                      <span className="mono text-muted" style={{ fontSize: '11px' }}>
                        {utilization.fleet?.deployedAircraft} of {utilization.fleet?.totalAircraft} Aircraft flying rotations
                      </span>
                    </div>

                    <div className="util-card">
                      <div className="util-card-header">
                        <span className="util-card-title">Baggage Conveyance</span>
                        <Luggage size={18} className="text-amber" />
                      </div>
                      <div className="util-card-stat">{utilization.baggage?.totalTracked} Units</div>
                      <span className="mono text-muted" style={{ fontSize: '11px' }}>
                        Bottlenecks in screening: {utilization.baggage?.bottlenecks || 0}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '13px', color: '#FFFFFF', marginBottom: '8px' }}>
                    Flight Movement Congestion by 4-Hour Time Window
                  </h4>
                  <div className="congestion-grid">
                    {utilization.congestion?.timeSlots?.map((slot, idx) => (
                      <div
                        key={idx}
                        className={`congestion-slot ${slot.label === utilization.congestion?.peakWindow ? 'peak-slot' : ''}`}
                      >
                        <span className="slot-time">{slot.label}</span>
                        <span className="slot-count">{slot.departures + slot.arrivals}</span>
                        <span className="slot-label">Movements</span>
                        {slot.label === utilization.congestion?.peakWindow && (
                          <span className="mono text-amber" style={{ fontSize: '9px', fontWeight: 700 }}>
                            PEAK RUSH
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: IMMUTABLE AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Append-only audit trail: Tracks every human-approved autonomous action with before-and-after state diffs.
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="activity-stream-empty">
                  <FileText size={36} className="text-amber" />
                  <h4 className="empty-title">Audit History Clean</h4>
                  <p className="empty-desc">
                    No approved autonomous actions have been executed yet.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Audit ID</th>
                        <th>Action Type</th>
                        <th>Approved By</th>
                        <th>Details</th>
                        <th>Before State</th>
                        <th>After State</th>
                        <th>Execution Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((aud) => (
                        <tr key={aud.auditId}>
                          <td className="mono font-bold text-amber">#{aud.auditId}</td>
                          <td className="mono font-bold text-white">{aud.actionType}</td>
                          <td className="mono text-muted">{aud.executedByEmail}</td>
                          <td>{aud.details}</td>
                          <td>
                            <pre className="state-diff-box">
                              {aud.beforeState ? JSON.stringify(aud.beforeState, null, 2) : 'None'}
                            </pre>
                          </td>
                          <td>
                            <pre className="state-diff-box" style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                              {aud.afterState ? JSON.stringify(aud.afterState, null, 2) : 'None'}
                            </pre>
                          </td>
                          <td className="mono text-muted">{aud.executedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EVENT STREAM */}
          {activeTab === 'events' && (
            <div>
              <div className="panel-actions-bar">
                <span className="panel-subtitle">
                  Chronological event log emitted by autonomous monitoring daemons and detectors.
                </span>
              </div>

              <div className="table-responsive">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>Event ID</th>
                      <th>Event Type</th>
                      <th>Severity</th>
                      <th>Description</th>
                      <th>Entity Ref</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((evt) => (
                      <tr key={evt.eventId}>
                        <td className="mono">#{evt.eventId}</td>
                        <td className="mono font-bold text-amber">{evt.eventType}</td>
                        <td>
                          <StatusBadge status={evt.severity} label={evt.severity} size="sm" />
                        </td>
                        <td>{evt.description}</td>
                        <td className="mono text-muted">{evt.entityType ? `${evt.entityType} (#${evt.entityId})` : '--'}</td>
                        <td className="mono text-muted">{evt.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AadeDashboard;
