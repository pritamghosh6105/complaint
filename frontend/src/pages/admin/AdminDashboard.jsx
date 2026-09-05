import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  Filter, 
  RotateCw, 
  Edit3, 
  UserPlus, 
  Eye, 
  Flame, 
  BrainCircuit, 
  Download,
  AlertTriangle,
  MapPin,
  Compass,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Layers,
  ChevronRight,
  Shield,
  Building,
  TreePine,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import api from '../../services/api';
import KPICards from '../../components/dashboard/KPICards';
import AnalyticsCharts from '../../components/dashboard/AnalyticsCharts';
import Modal from '../../components/common/Modal';

export default function AdminDashboard({ setCurrentRoute, setSelectedComplaintId }) {
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'geographic' | 'registry'
  const [kpis, setKpis] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [deptPerformance, setDeptPerformance] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Complaints Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [onlyEscalated, setOnlyEscalated] = useState(false);

  // Geographic Analytics Data
  const [geoAnalytics, setGeoAnalytics] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Location Registry Management (Super Admin)
  const [registryType, setRegistryType] = useState('district');
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryItems, setRegistryItems] = useState([]);
  const [registryTotal, setRegistryTotal] = useState(0);
  const [registryLoading, setRegistryLoading] = useState(false);

  // Add / Edit Location Modals
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [editLocationItem, setEditLocationItem] = useState(null);
  const [newLocationForm, setNewLocationForm] = useState({
    name: '',
    division: 'Presidency',
    headquarters: '',
    type: 'Municipality',
    district_id: 1,
    subdivision_id: 1,
    block_id: 1,
    gram_panchayat_id: 1,
    ulb_id: 1,
    commissionerate: 'Barasat Police Commissionerate',
    pincode: '',
    post_office: '',
    lat: 22.5726,
    lng: 88.3639
  });

  // Override Department Modal
  const [overrideComplaint, setOverrideComplaint] = useState(null);
  const [overrideDeptId, setOverrideDeptId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Assign Officer Modal
  const [assignComplaint, setAssignComplaint] = useState(null);
  const [assignOfficerId, setAssignOfficerId] = useState('');

  const fetchAdminData = async () => {
    try {
      const [kpiRes, compRes, deptRes, offRes, breakRes, perfRes, hotRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/admin/complaints'),
        api.get('/admin/departments'),
        api.get('/admin/officers'),
        api.get('/analytics/breakdown'),
        api.get('/analytics/departments'),
        api.get('/analytics/hotspots').catch(() => ({ data: { hotspots: [] } }))
      ]);

      setKpis(kpiRes.data.kpis);
      setComplaints(compRes.data.complaints || []);
      setDepartments(deptRes.data.departments || []);
      setOfficers(offRes.data.officers || []);
      setBreakdown(breakRes.data);
      setDeptPerformance(perfRes.data.performance || []);
      setHotspots(hotRes.data?.hotspots || []);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExecutiveSummary = async () => {
    setIsSummaryOpen(true);
    setSummaryLoading(true);
    try {
      const res = await api.get('/analytics/ai-summary');
      setSummaryData(res.data);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchGeographicAnalytics = async () => {
    setGeoLoading(true);
    try {
      const res = await api.get('/analytics/geographic');
      setGeoAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load geographic analytics:', err);
    } finally {
      setGeoLoading(false);
    }
  };

  const fetchRegistryEntities = useCallback(async () => {
    setRegistryLoading(true);
    try {
      const res = await api.get(`/location/admin/entities?type=${registryType}&search=${encodeURIComponent(registrySearch)}&limit=100`);
      setRegistryItems(res.data.items || []);
      setRegistryTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch registry entities:', err);
    } finally {
      setRegistryLoading(false);
    }
  }, [registryType, registrySearch]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'geographic') {
      fetchGeographicAnalytics();
    } else if (activeTab === 'registry') {
      fetchRegistryEntities();
    }
  }, [activeTab, fetchRegistryEntities]);

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideComplaint || !overrideDeptId) return;
    try {
      await api.patch(`/admin/complaints/${overrideComplaint.id}/department`, {
        department_id: Number(overrideDeptId),
        reason: overrideReason
      });
      setOverrideComplaint(null);
      setOverrideReason('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to override department');
    }
  };

  const handleAssignOfficerSubmit = async (e) => {
    e.preventDefault();
    if (!assignComplaint || !assignOfficerId) return;
    try {
      await api.patch(`/admin/complaints/${assignComplaint.id}/officer`, {
        officer_id: Number(assignOfficerId)
      });
      setAssignComplaint(null);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign officer');
    }
  };

  const handleTriggerSLA = async () => {
    try {
      const res = await api.post('/admin/sla/evaluate');
      alert(`SLA Evaluation Complete! ${res.data.escalated} overdue tickets escalated.`);
      fetchAdminData();
    } catch (err) {
      alert('Failed to trigger SLA evaluation');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const res = await api.patch(`/location/admin/${registryType}/${item.id}/toggle`);
      setRegistryItems(prev => prev.map(x => x.id === item.id ? { ...x, is_active: res.data.entity.is_active } : x));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleAddLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/location/admin/add', {
        entity_type: registryType,
        data: newLocationForm
      });
      setIsAddLocationOpen(false);
      setNewLocationForm({
        name: '',
        division: 'Presidency',
        headquarters: '',
        type: 'Municipality',
        district_id: 1,
        subdivision_id: 1,
        block_id: 1,
        gram_panchayat_id: 1,
        ulb_id: 1,
        commissionerate: 'Barasat Police Commissionerate',
        pincode: '',
        post_office: '',
        lat: 22.5726,
        lng: 88.3639
      });
      fetchRegistryEntities();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add location entity');
    }
  };

  const handleEditLocationSubmit = async (e) => {
    e.preventDefault();
    if (!editLocationItem) return;
    try {
      await api.put(`/location/admin/${registryType}/${editLocationItem.id}`, editLocationItem);
      setEditLocationItem(null);
      fetchRegistryEntities();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update location entity');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (selectedDept !== 'all' && c.department_id !== Number(selectedDept)) return false;
    if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
    if (onlyEscalated && c.is_escalated !== 1) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = [
        c.title,
        c.tracking_id,
        c.district,
        c.subdivision,
        c.municipality,
        c.ward,
        c.block,
        c.gram_panchayat,
        c.village,
        c.police_station,
        c.address,
        c.category
      ].filter(Boolean).join(' ').toLowerCase();

      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'CRITICAL') return 'badge-critical';
    if (priority === 'HIGH') return 'badge-high';
    if (priority === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Admin Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '2.1rem', color: 'var(--text-primary)', margin: 0 }}>
              West Bengal Municipal & Rural Administration Portal
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              State-wide governance oversight across all 23 districts, ULB municipalities, Gram Panchayats, and Police Commissionerates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleGenerateExecutiveSummary}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontWeight: 700, borderColor: '#8b5cf6' }}
            >
              <BrainCircuit size={15} /> 📑 Generate AI Executive Summary
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleTriggerSLA}
              style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.4)' }}
            >
              <ShieldAlert size={15} /> Run SLA Watchdog
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setCurrentRoute('gis-heatmap')}
            >
              <Flame size={15} /> Open GIS Heatmap
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentRoute('ml-inspector')}
              style={{ color: 'var(--accent-cyan)' }}
            >
              <BrainCircuit size={15} /> Inspect ML Engine
            </button>
          </div>
        </div>

        {/* Top Executive Tabs Navigation */}
        <div className="tabs-scroll-row" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('complaints')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Layers size={16} /> Master Complaints Register
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'geographic' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('geographic')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Compass size={16} /> Geographic & Hotspot Analytics
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'registry' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('registry')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MapPin size={16} /> Super Admin Location Registry
          </button>
        </div>

        {/* TAB 1: MASTER COMPLAINTS REGISTER */}
        {activeTab === 'complaints' && (
          <>
            {/* Civic Problem Hotspot Alerts (Spatial Clustering) */}
            {hotspots && hotspots.length > 0 && (
              <div style={{ marginBottom: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={18} color="#ef4444" />
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      Active Civic Vulnerability Hotspots ({hotspots.length} Detected)
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Automated Geospatial Recurrence Clustering
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px'
                }}>
                  {hotspots.map((h, idx) => (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        padding: '16px 18px',
                        borderLeft: `4px solid ${h.badge_color}`,
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          📍 {h.area}
                        </strong>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: `${h.badge_color}22`,
                          color: h.badge_color,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {h.risk_level} RISK
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {h.municipality} • {h.district}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '4px' }}>
                        <span>Top Category: <strong style={{ color: 'var(--accent-cyan)' }}>{h.top_category}</strong></span>
                        <span>Recurrence: <strong>{h.total_complaints}</strong> tickets</span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        ⚡ Action: {h.recommended_intervention}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <KPICards kpis={kpis} />

            {/* Analytics Charts */}
            <div style={{ marginBottom: '32px' }}>
              <AnalyticsCharts breakdownData={breakdown} departmentData={deptPerformance} />
            </div>

            {/* Master Complaints Register */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                    West Bengal Civic & Law Enforcement Complaints
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Showing {filteredComplaints.length} of {complaints.length} total municipal & rural tickets
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Search location / title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '36px' }}
                    />
                  </div>

                  <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>

                  <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }} value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                    <option value="all">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>

                  <button 
                    className={`btn btn-sm ${onlyEscalated ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setOnlyEscalated(!onlyEscalated)}
                  >
                    <ShieldAlert size={14} /> Escalated Only
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 14px' }}>Ticket #</th>
                      <th style={{ padding: '12px 14px' }}>Title & Normalized Location</th>
                      <th style={{ padding: '12px 14px' }}>Jurisdiction Details</th>
                      <th style={{ padding: '12px 14px' }}>Priority</th>
                      <th style={{ padding: '12px 14px' }}>Department</th>
                      <th style={{ padding: '12px 14px' }}>Officer Assigned</th>
                      <th style={{ padding: '12px 14px' }}>Status / SLA</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.slice(0, 20).map(c => {
                      const isBreached = (c.sla_deadline && new Date(c.sla_deadline) < new Date() && c.status !== 'Resolved') || c.is_escalated === 1;

                      return (
                        <tr 
                          key={c.id} 
                          style={{ 
                            borderBottom: '1px solid var(--border-subtle)',
                            background: isBreached ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            #{c.tracking_id}
                          </td>

                          <td style={{ padding: '12px 14px', maxWidth: '230px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{c.title}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              📍 {c.district || 'West Bengal'} 
                              {c.municipality ? ` • ${c.municipality}` : c.block ? ` • ${c.block}` : ''}
                            </div>
                          </td>

                          <td style={{ padding: '12px 14px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {c.ward && <div>🏛️ {c.ward}</div>}
                            {c.gram_panchayat && <div>🌾 GP: {c.gram_panchayat}</div>}
                            {c.police_station && <div style={{ color: '#c084fc' }}>🚓 PS: {c.police_station}</div>}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span className={`badge ${getPriorityBadgeClass(c.priority)}`}>
                              {c.priority}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                            {c.department_name || 'Public Works'}
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: c.officer_name ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                              {c.officer_name || 'Unassigned'}
                            </span>
                          </td>

                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span className={`badge badge-status ${
                                c.status === 'Resolved' ? 'badge-resolved' : 'badge-inprogress'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                            {isBreached ? (
                              <div style={{ 
                                fontSize: '0.72rem', 
                                color: '#ef4444', 
                                fontWeight: 800, 
                                background: 'rgba(239, 68, 68, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}>
                                🚨 SLA BREACHED (L{c.escalation_level || 1})
                              </div>
                            ) : c.status === 'Resolved' ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--status-low)' }}>✓ Completed</span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-purple)' }}>
                                SLA: {c.priority === 'CRITICAL' ? '24h' : c.priority === 'HIGH' ? '48h' : c.priority === 'MEDIUM' ? '3d' : '7d'}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                title="Override Department"
                                style={{ padding: '4px 8px' }}
                                onClick={() => {
                                  setOverrideComplaint(c);
                                  setOverrideDeptId(c.department_id || '');
                                }}
                              >
                                <Edit3 size={13} /> Dept
                              </button>

                              <button 
                                className="btn btn-secondary btn-sm"
                                title="Assign Officer"
                                style={{ padding: '4px 8px' }}
                                onClick={() => {
                                  setAssignComplaint(c);
                                  setAssignOfficerId(c.officer_id || '');
                                }}
                              >
                                <UserPlus size={13} /> Officer
                              </button>

                              <button 
                                className="btn btn-primary btn-sm"
                                title="View Details"
                                style={{ padding: '4px 8px' }}
                                onClick={() => {
                                  setSelectedComplaintId(c.id);
                                  setCurrentRoute('complaint-details');
                                }}
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: GEOGRAPHIC & HOTSPOT ANALYTICS */}
        {activeTab === 'geographic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '35px' }}>
            {geoLoading || !geoAnalytics ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading West Bengal geographic incident breakdown...
              </div>
            ) : (
              <>
                {/* Geographic Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>State-Wide Total Incidents</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {geoAnalytics.summary.total}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                      Active across 23 Districts
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Civic Municipal & Panchayat</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                      {geoAnalytics.summary.civicCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Water, Roads, Waste, Drainage
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Police & Law Enforcement</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
                      {geoAnalytics.summary.crimeCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '2px' }}>
                      Shielded Jurisdiction Beats
                    </div>
                  </div>
                </div>

                {/* Grid: Districts Distribution & ULB vs Block */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                  
                  {/* Complaints by District */}
                  <div className="glass-card" style={{ padding: '22px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={18} color="var(--accent-primary)" />
                      Incident Breakdown by West Bengal District
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {geoAnalytics.byDistrict.map(d => (
                        <div key={d.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.name}</span>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{d.count} tickets</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, Math.max(8, (d.count / (geoAnalytics.summary.total || 1)) * 100))}%`, 
                              height: '100%', 
                              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
                              borderRadius: '3px'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Urban ULB Municipalities vs Rural Blocks */}
                  <div className="glass-card" style={{ padding: '22px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} color="var(--accent-emerald)" />
                      Top Municipalities (ULBs) & CD Blocks
                    </h3>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                        URBAN MUNICIPAL CORPORATIONS / ULBs
                      </div>
                      {geoAnalytics.byULB.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No urban incidents recorded yet.</div>
                      ) : (
                        geoAnalytics.byULB.slice(0, 5).map(u => (
                          <div key={u.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                            <span>🏛️ {u.name}</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{u.count} issues</strong>
                          </div>
                        ))
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px' }}>
                        RURAL CD BLOCKS
                      </div>
                      {geoAnalytics.byBlock.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No rural block incidents recorded yet.</div>
                      ) : (
                        geoAnalytics.byBlock.slice(0, 5).map(b => (
                          <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                            <span>🌾 {b.name}</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{b.count} issues</strong>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Hotspot Wards, Gram Panchayats & Police Stations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  
                  {/* Top Hotspot Wards */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      🔥 Top Hotspot Wards
                    </h4>
                    {geoAnalytics.byWard.slice(0, 6).map(w => (
                      <div key={w.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                        <span>{w.name}</span>
                        <strong style={{ color: 'var(--status-critical)' }}>{w.count}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Top Hotspot Gram Panchayats */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      🌾 Rural Gram Panchayats
                    </h4>
                    {geoAnalytics.byGramPanchayat.slice(0, 6).map(g => (
                      <div key={g.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                        <span>GP {g.name}</span>
                        <strong style={{ color: 'var(--accent-emerald)' }}>{g.count}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Police Station Jurisdictions */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      🚓 Police Station Jurisdictions
                    </h4>
                    {geoAnalytics.byPoliceStation.slice(0, 6).map(p => (
                      <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                        <span>{p.name}</span>
                        <strong style={{ color: '#c084fc' }}>{p.count}</strong>
                      </div>
                    ))}
                  </div>

                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: SUPER ADMIN LOCATION REGISTRY */}
        {activeTab === 'registry' && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '35px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
                  West Bengal State Administrative Location Registry
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Super Admin Management: Add, edit, soft-deactivate boundaries, and inspect official census datasets.
                </div>
              </div>

              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddLocationOpen(true)}
              >
                <Plus size={15} /> Add Location Entity
              </button>
            </div>

            {/* Entity Type Selector & Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div className="tabs-scroll-row" style={{ margin: 0, padding: '2px 0 6px' }}>
                {[
                  { key: 'district', label: 'Districts (23)' },
                  { key: 'subdivision', label: 'Subdivisions (65)' },
                  { key: 'ulb', label: 'ULBs / Municipalities (54)' },
                  { key: 'ward', label: 'Wards (1,650)' },
                  { key: 'block', label: 'CD Blocks (56)' },
                  { key: 'gram_panchayat', label: 'Gram Panchayats (54)' },
                  { key: 'village', label: 'Villages / Mouzas (33)' },
                  { key: 'police_station', label: 'Police Stations (62)' },
                  { key: 'postcode', label: 'PIN Codes (34)' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setRegistryType(tab.key);
                      setRegistrySearch('');
                    }}
                    className="btn btn-sm"
                    style={{
                      fontSize: '0.74rem',
                      padding: '5px 10px',
                      background: registryType === tab.key ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                      color: registryType === tab.key ? '#fff' : 'var(--text-secondary)',
                      border: registryType === tab.key ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      borderRadius: '4px'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  className="form-input"
                  placeholder={`Search ${registryType}...`}
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '34px' }}
                />
              </div>
            </div>

            {/* Registry Datatable */}
            {registryLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                Loading registry records...
              </div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 12px' }}>ID</th>
                      <th style={{ padding: '10px 12px' }}>Name / Identifier</th>
                      <th style={{ padding: '10px 12px' }}>Classification & Hierarchy</th>
                      <th style={{ padding: '10px 12px' }}>Centroid Coordinates</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registryItems.slice(0, 30).map(item => {
                      const isActive = item.is_active !== 0;

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: isActive ? 1 : 0.5 }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            #{item.id}
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {item.name || item.pincode || item.ward_name}
                            </strong>
                            {item.post_office && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>PO: {item.post_office}</div>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                            {item.division && <span>Division: {item.division} • </span>}
                            {item.headquarters && <span>HQ: {item.headquarters} • </span>}
                            {item.type && <span>Type: {item.type} • </span>}
                            {item.commissionerate && <span>{item.commissionerate}</span>}
                            {item.jl_number && <span>JL #{item.jl_number}</span>}
                          </td>

                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                            {item.lat || item.center_lat ? (
                              `${(item.lat || item.center_lat).toFixed(4)}, ${(item.lng || item.center_lng).toFixed(4)}`
                            ) : (
                              'Parent Geocoded'
                            )}
                          </td>

                          <td style={{ padding: '10px 12px' }}>
                            {isActive ? (
                              <span style={{ 
                                background: 'rgba(16, 185, 129, 0.15)', 
                                color: '#10b981', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.72rem', 
                                fontWeight: 700 
                              }}>
                                Active
                              </span>
                            ) : (
                              <span style={{ 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                color: '#ef4444', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.72rem', 
                                fontWeight: 700 
                              }}>
                                Deactivated
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                onClick={() => setEditLocationItem(item)}
                              >
                                <Edit3 size={13} /> Edit
                              </button>

                              <button 
                                className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-secondary'}`}
                                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                onClick={() => handleToggleActive(item)}
                                title={isActive ? 'Soft-Deactivate Entity' : 'Reactivate Entity'}
                              >
                                {isActive ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal 1: Add New Location Entity */}
        <Modal
          isOpen={isAddLocationOpen}
          onClose={() => setIsAddLocationOpen(false)}
          title={`Add New ${registryType.toUpperCase().replace('_', ' ')} Entity`}
        >
          <form onSubmit={handleAddLocationSubmit}>
            <div className="form-group">
              <label className="form-label">Entity Name / Identifier:</label>
              <input 
                type="text"
                className="form-input"
                required
                value={newLocationForm.name}
                onChange={(e) => setNewLocationForm({ ...newLocationForm, name: e.target.value })}
                placeholder={`e.g. New ${registryType}`}
              />
            </div>

            {registryType === 'district' && (
              <>
                <div className="form-group">
                  <label className="form-label">Administrative Division:</label>
                  <select 
                    className="form-select"
                    value={newLocationForm.division}
                    onChange={(e) => setNewLocationForm({ ...newLocationForm, division: e.target.value })}
                  >
                    {['Presidency', 'Burdwan', 'Medinipur', 'Malda', 'Jalpaiguri'].map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">District Headquarters:</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={newLocationForm.headquarters}
                    onChange={(e) => setNewLocationForm({ ...newLocationForm, headquarters: e.target.value })}
                    placeholder="Headquarters City"
                  />
                </div>
              </>
            )}

            {registryType === 'ulb' && (
              <div className="form-group">
                <label className="form-label">ULB Type:</label>
                <select 
                  className="form-select"
                  value={newLocationForm.type}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, type: e.target.value })}
                >
                  <option value="Municipal Corporation">Municipal Corporation</option>
                  <option value="Municipality">Municipality</option>
                  <option value="Notified Area">Notified Area</option>
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Centroid Latitude:</label>
                <input 
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={newLocationForm.lat}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, lat: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Centroid Longitude:</label>
                <input 
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={newLocationForm.lng}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, lng: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '12px' }}>
              Save Location Entity to West Bengal Registry
            </button>
          </form>
        </Modal>

        {/* Modal 2: Edit Location Entity */}
        <Modal
          isOpen={!!editLocationItem}
          onClose={() => setEditLocationItem(null)}
          title={`Edit ${registryType.toUpperCase().replace('_', ' ')} #${editLocationItem?.id}`}
        >
          {editLocationItem && (
            <form onSubmit={handleEditLocationSubmit}>
              <div className="form-group">
                <label className="form-label">Name / Title:</label>
                <input 
                  type="text"
                  className="form-input"
                  value={editLocationItem.name || editLocationItem.ward_name || ''}
                  onChange={(e) => setEditLocationItem({ ...editLocationItem, name: e.target.value })}
                  required
                />
              </div>

              {editLocationItem.headquarters !== undefined && (
                <div className="form-group">
                  <label className="form-label">Headquarters:</label>
                  <input 
                    type="text"
                    className="form-input"
                    value={editLocationItem.headquarters || ''}
                    onChange={(e) => setEditLocationItem({ ...editLocationItem, headquarters: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude:</label>
                  <input 
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={editLocationItem.lat || editLocationItem.center_lat || 0}
                    onChange={(e) => setEditLocationItem({ ...editLocationItem, lat: parseFloat(e.target.value), center_lat: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude:</label>
                  <input 
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={editLocationItem.lng || editLocationItem.center_lng || 0}
                    onChange={(e) => setEditLocationItem({ ...editLocationItem, lng: parseFloat(e.target.value), center_lng: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '12px' }}>
                Update Registry Record
              </button>
            </form>
          )}
        </Modal>

        {/* Modal 3: Department Override Modal */}
        <Modal 
          isOpen={!!overrideComplaint}
          onClose={() => setOverrideComplaint(null)}
          title={`Override Department #${overrideComplaint?.tracking_id}`}
        >
          <form onSubmit={handleOverrideSubmit}>
            <div style={{ marginBottom: '14px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Currently categorized as: <strong>{overrideComplaint?.category}</strong> <br />
              Current Department: <strong>{overrideComplaint?.department_name || 'N/A'}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Select New Department:</label>
              <select 
                className="form-select" 
                value={overrideDeptId} 
                onChange={(e) => setOverrideDeptId(e.target.value)}
                required
              >
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Override Justification / Reason:</label>
              <textarea 
                className="form-textarea" 
                rows={3}
                placeholder="Explain why this complaint was re-routed..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Save & Reassign Department
            </button>
          </form>
        </Modal>

        {/* Modal 4: Officer Assignment Modal */}
        <Modal 
          isOpen={!!assignComplaint}
          onClose={() => setAssignComplaint(null)}
          title={`Assign Field Officer #${assignComplaint?.tracking_id}`}
        >
          <form onSubmit={handleAssignOfficerSubmit}>
            <div className="form-group">
              <label className="form-label">Select Field Officer:</label>
              <select 
                className="form-select" 
                value={assignOfficerId} 
                onChange={(e) => setAssignOfficerId(e.target.value)}
                required
              >
                <option value="">Select Officer...</option>
                {officers.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.name} • {o.department_name || 'General Operations'} ({o.ward})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Confirm Officer Assignment
            </button>
          </form>
        </Modal>

        {/* Modal 5: AI Executive Administration Briefing Modal */}
        <Modal 
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          title="🏛️ AI Executive Administration Briefing"
        >
          {summaryLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <RotateCw className="spin" size={36} color="var(--accent-primary)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Synthesizing Executive Governance Briefing...
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Analyzing statewide complaint volume, SLA turnaround, recurring geographic clusters, and departmental load.
              </p>
            </div>
          ) : summaryData ? (
            <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Header Meta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    West Bengal State Municipal & Rural Oversight
                  </span>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Generated: <strong>{summaryData.generated_at}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const blob = new Blob([summaryData.summary_markdown], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `CivicPulse-Executive-Briefing-${new Date().toISOString().slice(0,10)}.md`;
                    a.click();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Download Briefing (.md)
                </button>
              </div>

              {/* KPI Quick Glance */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '22px' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Tickets</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {summaryData.metrics.total_complaints}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolution Rate</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    {summaryData.metrics.resolution_rate}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Urgent Emergencies</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                    {summaryData.metrics.unresolved_critical_emergencies}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Escalations</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                    {summaryData.metrics.sla_breach_escalations}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Citizen Rating</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ec4899', marginTop: '4px' }}>
                    ⭐ {summaryData.metrics.citizen_satisfaction}
                  </div>
                </div>
              </div>

              {/* Key Observations */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={16} color="var(--accent-cyan)" /> Key Operational Findings
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {summaryData.key_findings.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '10px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderLeft: '3px solid var(--accent-primary)',
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Interventions */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} color="#10b981" /> Recommended Strategic Interventions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {summaryData.strategic_recommendations.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '10px',
                        background: 'rgba(16, 185, 129, 0.06)',
                        borderLeft: '3px solid #10b981',
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ color: '#10b981', fontWeight: 800 }}>⚡</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSummaryOpen(false)}
                >
                  Close Briefing
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              No summary report data available.
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}
