import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Upload,
  Camera,
  ShieldAlert,
  Send,
  Navigation,
  Film,
  Sparkles,
  Search,
  Filter,
  Check,
  Building2,
  PhoneCall,
  User,
  Sliders,
  Calendar,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw,
  ArrowDownCircle,
  HelpCircle,
  Info,
  Printer
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import SceneDescriptionCard from '../../components/complaint/SceneDescriptionCard';
import PrintableCaseDossier from '../../components/complaint/PrintableCaseDossier';
import { compressImage } from '../../utils/imageCompressor';

export default function OfficerDashboard({
  setCurrentRoute,
  setSelectedComplaintId,
  roleNotice
}) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printingTask, setPrintingTask] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => window.__OFFICER_FILTER__ || 'All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [slaFilter, setSlaFilter] = useState('All'); // 'All', 'Overdue', 'DueSoon'

  // Resolve Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionFilePreview, setResolutionFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Note Modal State
  const [noteComplaint, setNoteComplaint] = useState(null);
  const [internalNote, setInternalNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Evidence Preview Modal State
  const [previewMedia, setPreviewMedia] = useState(null);

  // Triage & Priority Recalibration State
  const [triagingId, setTriagingId] = useState(null);
  const [recalibratingTask, setRecalibratingTask] = useState(null);
  const [targetPriority, setTargetPriority] = useState('MEDIUM');
  const [recalibrationReason, setRecalibrationReason] = useState('');
  const [submittingTriage, setSubmittingTriage] = useState(false);

  // Transfer Department Modal State
  const [transferringTask, setTransferringTask] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const openTransferModal = (task) => {
    setTransferringTask(task);
    setTargetDeptId('');
    setTargetCategory('');
    setTransferReason('');
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferringTask) return;
    if (!targetDeptId) {
      alert('Please select a target civic department.');
      return;
    }
    if (!transferReason.trim() || transferReason.trim().length < 5) {
      alert('Please state an official transfer justification (at least 5 characters).');
      return;
    }
    setSubmittingTransfer(true);
    try {
      await api.post(`/officer/tasks/${transferringTask.id}/transfer`, {
        target_department_id: Number(targetDeptId),
        target_category: targetCategory || null,
        reason: transferReason.trim()
      });
      setTransferringTask(null);
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transfer complaint to target department');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const handleConfirmCritical = async (task) => {
    if (!window.confirm(`Confirm active life-safety emergency for #${task.tracking_id}? This locks the 24-hour response SLA.`)) {
      return;
    }
    setTriagingId(task.id);
    try {
      await api.patch(`/officer/tasks/${task.id}/triage`, {
        action: 'CONFIRM_CRITICAL',
        reason: 'Officer on-ground verification: active life-safety hazard confirmed. Rapid 24-hour emergency SLA locked.'
      });
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm emergency');
    } finally {
      setTriagingId(null);
    }
  };

  const openRecalibrateModal = (task) => {
    setRecalibratingTask(task);
    setTargetPriority('MEDIUM');
    setRecalibrationReason('');
  };

  const handleRecalibrateSubmit = async (e) => {
    e.preventDefault();
    if (!recalibratingTask) return;
    if (!recalibrationReason.trim() || recalibrationReason.trim().length < 5) {
      alert('Please provide an official audit reason (at least 5 characters) for recalibrating priority.');
      return;
    }
    setSubmittingTriage(true);
    try {
      await api.patch(`/officer/tasks/${recalibratingTask.id}/triage`, {
        action: 'RECALIBRATE_NORMAL',
        new_priority: targetPriority,
        reason: recalibrationReason.trim()
      });
      setRecalibratingTask(null);
      setRecalibrationReason('');
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to recalibrate priority');
    } finally {
      setSubmittingTriage(false);
    }
  };

  const fetchTasks = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/officer/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    api.get('/departments')
      .then(res => {
        if (res.data?.departments?.length) setDepartments(res.data.departments);
      })
      .catch(() => {
        setDepartments([
          { id: 1, name: 'Traffic & Road Safety' },
          { id: 2, name: 'Roads & Public Works' },
          { id: 3, name: 'Solid Waste Management' },
          { id: 4, name: 'Drainage & Sewerage' },
          { id: 5, name: 'Health & Hospitals' },
          { id: 6, name: 'Fire & Emergency Services' },
          { id: 7, name: 'Police & Law Enforcement' },
          { id: 8, name: 'Power & Electricity' },
          { id: 9, name: 'Water Supply' }
        ]);
      });
    if (window.__OFFICER_FILTER__) {
      setStatusFilter(window.__OFFICER_FILTER__);
      delete window.__OFFICER_FILTER__;
    }
  }, []);

  const handleStatusUpdate = async (complaintId, newStatus, customNotes) => {
    try {
      await api.patch(`/officer/tasks/${complaintId}/status`, {
        status: newStatus,
        notes: customNotes || `Task marked as ${newStatus} by field officer.`
      });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task status');
    }
  };

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteComplaint || !internalNote.trim()) return;
    setSubmittingNote(true);
    try {
      await api.patch(`/officer/tasks/${noteComplaint.id}/status`, {
        status: noteComplaint.status,
        notes: `[FIELD NOTE] ${internalNote.trim()}`
      });
      setNoteComplaint(null);
      setInternalNote('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record field note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'Resolved');
      formData.append('notes', resolutionNotes || 'On-ground remediation completed and verified.');
      if (resolutionFile) {
        // Fast client-side image compression down to ~150KB to eliminate upload delay
        const optimizedFile = await compressImage(resolutionFile);
        formData.append('resolution_image', optimizedFile);
      }

      await api.patch(`/officer/tasks/${resolvingComplaint.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResolvingComplaint(null);
      setResolutionNotes('');
      setResolutionFile(null);
      setResolutionFilePreview(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'Assigned' || t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const resolved = tasks.filter(t => t.status === 'Resolved').length;
    const now = new Date();
    const overdue = tasks.filter(t => t.status !== 'Resolved' && t.sla_deadline && new Date(t.sla_deadline) < now).length;
    const critical = tasks.filter(t => t.priority === 'CRITICAL' && t.status !== 'Resolved').length;
    const high = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'Resolved').length;
    const transferred = tasks.filter(t => Boolean(t.is_transferred || t.transferred_from_dept_id || t.status === 'Transferred')).length;

    return { total, pending, inProgress, resolved, overdue, critical, high, transferred };
  }, [tasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return tasks.filter(task => {
      // 1. Status Filter
      if (statusFilter === 'Active' && (task.status === 'Resolved' || task.status === 'Rejected')) return false;
      if (statusFilter === 'Pending' && task.status !== 'Assigned' && task.status !== 'Pending') return false;
      if (statusFilter === 'In Progress' && task.status !== 'In Progress') return false;
      if (statusFilter === 'Resolved' && task.status !== 'Resolved') return false;
      if (statusFilter === 'Overdue') {
        const isOverdue = task.status !== 'Resolved' && task.sla_deadline && new Date(task.sla_deadline) < now;
        if (!isOverdue) return false;
      }
      if (statusFilter === 'Transferred') {
        const isTransferred = Boolean(task.is_transferred || task.transferred_from_dept_id || task.status === 'Transferred' || task.transfer_reason);
        if (!isTransferred) return false;
      }
      if (statusFilter !== 'All' && statusFilter !== 'Active' && statusFilter !== 'Pending' && statusFilter !== 'In Progress' && statusFilter !== 'Resolved' && statusFilter !== 'Overdue' && statusFilter !== 'Transferred') {
        // Match specific department name filter from departments page
        if (task.department_name && !task.department_name.toLowerCase().includes(statusFilter.toLowerCase()) && !task.category?.toLowerCase().includes(statusFilter.toLowerCase())) {
          return false;
        }
      }

      // 2. Priority Filter
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;

      // 3. SLA Filter
      if (slaFilter === 'Overdue') {
        const isOverdue = task.status !== 'Resolved' && task.sla_deadline && new Date(task.sla_deadline) < now;
        if (!isOverdue) return false;
      } else if (slaFilter === 'DueSoon') {
        const isDueSoon = task.status !== 'Resolved' && task.sla_deadline && (new Date(task.sla_deadline) - now) > 0 && (new Date(task.sla_deadline) - now) < (24 * 3600 * 1000);
        if (!isDueSoon) return false;
      }

      // 4. Search Query
      if (query) {
        const trackingId = (task.tracking_id || '').toLowerCase();
        const title = (task.title || '').toLowerCase();
        const desc = (task.description || '').toLowerCase();
        const address = (task.address || '').toLowerCase();
        const ward = (task.ward || '').toLowerCase();
        const citizen = (task.citizen_name || '').toLowerCase();
        const cat = (task.category || '').toLowerCase();

        return trackingId.includes(query) ||
          title.includes(query) ||
          desc.includes(query) ||
          address.includes(query) ||
          ward.includes(query) ||
          citizen.includes(query) ||
          cat.includes(query);
      }

      return true;
    });

    // PRIORITY-FIRST SORTING:
    // 1. Unresolved complaints appear before Resolved complaints
    // 2. CRITICAL priority (life-safety hazard) complaints appear FIRST at the very top across all 30 departments
    // 3. Unverified triage emergencies (PENDING_OFFICER_TRIAGE) receive highest urgency
    // 4. Overdue SLA tasks
    // 5. HIGH > MEDIUM > LOW
    // 6. Tie-breaker: newest creation date
    const priorityWeights = {
      'CRITICAL': 400,
      'HIGH': 300,
      'MEDIUM': 200,
      'LOW': 100
    };

    return filtered.sort((a, b) => {
      const aResolved = (a.status === 'Resolved' || a.status === 'Closed') ? 1 : 0;
      const bResolved = (b.status === 'Resolved' || b.status === 'Closed') ? 1 : 0;
      if (aResolved !== bResolved) return aResolved - bResolved;

      const aWeight = priorityWeights[a.priority] || 100;
      const bWeight = priorityWeights[b.priority] || 100;

      const aEmergency = (a.is_emergency || a.triage_status === 'PENDING_OFFICER_TRIAGE' || a.priority === 'CRITICAL') ? 50 : 0;
      const bEmergency = (b.is_emergency || b.triage_status === 'PENDING_OFFICER_TRIAGE' || b.priority === 'CRITICAL') ? 50 : 0;

      const aTotal = aWeight + aEmergency;
      const bTotal = bWeight + bEmergency;

      if (aTotal !== bTotal) {
        return bTotal - aTotal; // Highest priority/emergency first
      }

      // Overdue SLA first
      const aOverdue = a.sla_deadline && new Date(a.sla_deadline) < now ? 1 : 0;
      const bOverdue = b.sla_deadline && new Date(b.sla_deadline) < now ? 1 : 0;
      if (aOverdue !== bOverdue) return bOverdue - aOverdue;

      // Newest first
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, slaFilter]);

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'CRITICAL') return 'badge-critical';
    if (priority === 'HIGH') return 'badge-high';
    if (priority === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '80px' }}>
      <div className="container">

        {/* Role Enforcement Notice (if routed incorrectly or role protected) */}
        {roleNotice && (
          <div style={{
            background: 'rgba(2, 132, 199, 0.12)',
            border: '1px solid rgba(2, 132, 199, 0.35)',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.86rem'
          }}>
            <ShieldCheck size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
            <div>
              <strong>Field Officer Jurisdiction Enforced:</strong> {roleNotice}
            </div>
          </div>
        )}

        {/* Officer Profile & Department Command Bar */}
        <div
          className="officer-command-bar"
          style={{
            background: 'var(--bg-surface-elevated, var(--bg-surface))',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <ShieldCheck size={12} />
                Authorized Field Officer
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                {user?.officer_id || `ID: #${user?.id || 1}`}
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.2rem, 2.8vw, 1.85rem)', color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>
              {user?.department_name || 'Departmental Field Taskforce'} Queue
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Officer: <strong>{user?.name || 'Field Officer'}</strong> • Jurisdiction: <span style={{ color: 'var(--accent-cyan)' }}>{user?.ward || 'West Bengal State Operations'}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => fetchTasks(true)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Refresh Task Queue"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Queue'}</span>
            </button>
          </div>
        </div>

        {/* 6-Metric KPI Stat Grid */}
        <div
          className="officer-kpi-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '26px'
          }}
        >
          <div className="glass-card officer-kpi-card" style={{ padding: '14px 16px', borderLeft: '3px solid #3b82f6' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Total Assigned
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {metrics.total}
            </div>
          </div>

          <div className="glass-card officer-kpi-card" style={{ padding: '14px 16px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Pending Action
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {metrics.pending}
            </div>
          </div>

          <div className="glass-card officer-kpi-card" style={{ padding: '14px 16px', borderLeft: '3px solid #06b6d4' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              In Progress
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
              {metrics.inProgress}
            </div>
          </div>

          <div className="glass-card officer-kpi-card" style={{ padding: '14px 16px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Resolved
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {metrics.resolved}
            </div>
          </div>

          <div className="glass-card officer-kpi-card" style={{ padding: '14px 16px', borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              SLA Overdue
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {metrics.overdue}
            </div>
          </div>

          <div className="glass-card officer-kpi-card" style={{ padding: '14px 16px', borderLeft: '3px solid #f43f5e' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Critical Cases
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
              {metrics.critical}
            </div>
          </div>

          <div
            className="glass-card officer-kpi-card"
            style={{
              padding: '14px 16px',
              borderLeft: '3px solid #8b5cf6',
              cursor: 'pointer',
              background: statusFilter === 'Transferred' ? 'rgba(139, 92, 246, 0.12)' : undefined
            }}
            onClick={() => setStatusFilter('Transferred')}
            title="Click to view cross-department transferred complaints"
          >
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Transferred Cases
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
              {metrics.transferred}
            </div>
          </div>
        </div>

        {/* Search, Filter & Tab Controls - STRICTLY OPERATIONAL */}
        <div
          className="officer-filters-box"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Top Search Input */}
          <div className="officer-filters-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: '220px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Search tracking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px', borderRadius: '8px', fontSize: '0.86rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns Container */}
            <div className="officer-filter-dropdowns" style={{ display: 'flex', gap: '10px' }}>
              {/* Priority Filter Dropdown */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '130px', fontSize: '0.84rem', borderRadius: '8px' }}
              >
                <option value="All">All Priorities</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              {/* SLA Filter Dropdown */}
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '130px', fontSize: '0.84rem', borderRadius: '8px' }}
              >
                <option value="All">All SLA Status</option>
                <option value="Overdue">Overdue SLA</option>
                <option value="DueSoon">Due in 24 Hours</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tab Pills */}
          <div className="tabs-scroll-row" style={{ margin: 0, padding: 0 }}>
            <button
              className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('All')}
            >
              All Queue ({tasks.length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Active' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Active')}
            >
              Active Working ({tasks.filter(t => t.status !== 'Resolved').length})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Pending')}
            >
              Pending ({metrics.pending})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'In Progress' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('In Progress')}
            >
              In Progress ({metrics.inProgress})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Overdue' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Overdue')}
              style={{ color: metrics.overdue > 0 ? '#f87171' : undefined }}
            >
              Overdue ({metrics.overdue})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Resolved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Resolved')}
            >
              Resolved ({metrics.resolved})
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'Transferred' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Transferred')}
              style={{
                borderColor: statusFilter === 'Transferred' ? '#8b5cf6' : undefined,
                background: statusFilter === 'Transferred' ? '#8b5cf6' : undefined,
                color: statusFilter === 'Transferred' ? '#fff' : (metrics.transferred > 0 ? '#a78bfa' : undefined)
              }}
            >
              🔁 Transferred ({metrics.transferred})
            </button>
          </div>
        </div>

        {/* Task Cards List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0284c7' }} />
            <div>Synchronizing department operational queue...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <CheckCircle2 size={44} color="var(--accent-emerald)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
              No Complaints Match Selected Filter
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
              All tickets assigned to your department are either clear or do not meet the selected search criteria.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setSlaFilter('All');
              }}
            >
              Reset Filters to All Complaints
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filteredTasks.map(task => {
              const now = new Date();
              const isOverdue = task.sla_deadline && new Date(task.sla_deadline) < now && task.status !== 'Resolved';
              const slaRemainingHours = task.sla_deadline
                ? Math.round((new Date(task.sla_deadline) - now) / (1000 * 3600))
                : 72;

              return (
                <div
                  key={task.id}
                  className="glass-card officer-task-card"
                  style={{
                    padding: '22px',
                    borderLeft: task.priority === 'CRITICAL' ? '4px solid #ef4444' : task.priority === 'HIGH' ? '4px solid #f97316' : '4px solid #3b82f6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* CROSS-DEPARTMENT TRANSFER PROVENANCE BANNER */}
                  {Boolean(task.is_transferred || task.transferred_from_dept_id) && (
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.10)',
                      border: '1.5px solid rgba(139, 92, 246, 0.35)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="#a78bfa" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                          Cross-Department Transfer:
                        </span>
                        <span style={{ color: '#c4b5fd', fontWeight: 600 }}>
                          {task.transferred_from_dept_name || 'Previous Department'} ➔ {task.category || task.department_name}
                        </span>
                      </div>
                      {task.transfer_reason && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <em>Reason: "{task.transfer_reason}"</em> {task.transferred_by_officer_name ? `• by ${task.transferred_by_officer_name}` : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* EMERGENCY TRIAGE & VERIFICATION BAR */}
                  {(task.priority === 'CRITICAL' || task.is_emergency === 1 || task.triage_status) && (
                    <div style={{
                      background: task.triage_status === 'CONFIRMED_CRITICAL'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : task.triage_status === 'RECALIBRATED_NORMAL'
                          ? 'rgba(59, 130, 246, 0.08)'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(245, 158, 11, 0.12) 100%)',
                      border: task.triage_status === 'CONFIRMED_CRITICAL'
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : task.triage_status === 'RECALIBRATED_NORMAL'
                          ? '1px solid rgba(59, 130, 246, 0.3)'
                          : '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 'min(100%, 280px)' }}>
                        {task.triage_status === 'CONFIRMED_CRITICAL' ? (
                          <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                        ) : task.triage_status === 'RECALIBRATED_NORMAL' ? (
                          <CheckCircle2 size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                        ) : (
                          <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
                        )}
                        <div>
                          <strong style={{
                            fontSize: '0.88rem',
                            display: 'block',
                            color: task.triage_status === 'CONFIRMED_CRITICAL' ? '#f87171' : task.triage_status === 'RECALIBRATED_NORMAL' ? '#60a5fa' : '#fbbf24'
                          }}>
                            {task.triage_status === 'CONFIRMED_CRITICAL'
                              ? 'Verified Life-Safety Emergency — 24h SLA Locked'
                              : task.triage_status === 'RECALIBRATED_NORMAL'
                                ? `Priority Recalibrated: ${task.priority} Priority (${task.priority === 'HIGH' ? '48h' : '72h'} SLA)`
                                : 'Action Required: Verify Life-Safety Emergency'}
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                            {task.triage_status === 'CONFIRMED_CRITICAL'
                              ? `Confirmed by ${task.triaged_by || 'Field Officer'}. ${task.triage_reason || 'Rapid 24-hour emergency response crew deployed.'}`
                              : task.triage_status === 'RECALIBRATED_NORMAL'
                                ? `Recalibrated by ${task.triaged_by || 'Officer'}. Reason: "${task.triage_reason}". Standard maintenance workflow active.`
                                : 'Citizen flagged this complaint with life-safety risk. Inspect photo evidence to confirm emergency or recalibrate to normal.'}
                          </div>
                        </div>
                      </div>

                      {/* Triage Action Buttons */}
                      {task.status !== 'Resolved' && (
                        <div className="officer-triage-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {task.triage_status !== 'CONFIRMED_CRITICAL' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{
                                background: '#dc2626',
                                borderColor: '#ef4444',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                padding: '6px 12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              disabled={triagingId === task.id}
                              onClick={() => handleConfirmCritical(task)}
                            >
                              <ShieldAlert size={13} /> {triagingId === task.id ? 'Confirming...' : '✓ Confirm Critical (24h SLA)'}
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{
                              borderColor: 'rgba(245, 158, 11, 0.45)',
                              color: '#fbbf24',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              padding: '6px 12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            onClick={() => openRecalibrateModal(task)}
                          >
                            <ArrowDownCircle size={13} /> Recalibrate to Normal
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Header Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.94rem' }}>
                        #{task.tracking_id}
                      </span>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority} PRIORITY
                      </span>
                      <span className="badge badge-status badge-assigned">
                        {task.status}
                      </span>
                      {isOverdue && (
                        <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldAlert size={12} /> SLA VIOLATION
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)'
                      }}>
                        {task.category || 'General Civic'}
                      </span>
                      {Boolean(task.is_transferred || task.transferred_from_dept_id) && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#c4b5fd',
                          border: '1px solid rgba(139, 92, 246, 0.4)'
                        }}>
                          🔁 TRANSFERRED
                        </span>
                      )}
                    </div>

                    {/* SLA Deadline Tracker */}
                    <div style={{
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: isOverdue ? '#f87171' : 'var(--text-muted)',
                      fontWeight: isOverdue ? 700 : 500
                    }}>
                      <Clock size={14} color={isOverdue ? '#ef4444' : 'currentColor'} />
                      <span>
                        {isOverdue
                          ? `Overdue by ${Math.abs(slaRemainingHours)} hours`
                          : task.status === 'Resolved'
                            ? `Resolved on ${new Date(task.resolved_at || task.updated_at || Date.now()).toLocaleDateString()}`
                            : `SLA: ${slaRemainingHours}h remaining (${new Date(task.sla_deadline).toLocaleDateString()})`}
                      </span>
                    </div>
                  </div>

                  {/* Citizen Title & Description */}
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 700 }}>
                      {task.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                      {task.description}
                    </p>
                  </div>

                  {/* Citizen Uploaded Evidence Preview Strip */}
                  {((task.evidence && task.evidence.length > 0) || task.image_url) && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.18)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                          Citizen Evidence ({task.evidence?.length || 1}):
                        </span>
                        <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                          Click thumbnail for full analysis
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                        {(task.evidence && task.evidence.length > 0 ? task.evidence : [{ secure_url: task.image_url, resource_type: 'image' }]).map((ev, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewMedia({ ...ev, task })}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid var(--border-subtle)',
                              background: '#0f172a',
                              flexShrink: 0,
                              cursor: 'pointer'
                            }}
                            title="Click to preview evidence"
                          >
                            {ev.resource_type === 'video' ? (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.2)' }}>
                                <Film size={20} color="var(--accent-cyan)" />
                              </div>
                            ) : (
                              <img src={ev.thumbnail_url || ev.optimized_url || ev.secure_url} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Vision AI Scene Description or Officer Inspection Notice in Case Card */}
                      <SceneDescriptionCard
                        sceneDescription={task.scene_description || task.evidence?.[0]?.scene_description || task.evidence?.[0]?.visual_analysis?.scene?.description || task.evidence?.[0]?.visual_analysis?.scene_description}
                        sceneType={task.scene_type || task.evidence?.[0]?.scene_type || task.evidence?.[0]?.visual_analysis?.scene?.scene_type || task.evidence?.[0]?.visual_analysis?.scene_type}
                        directObservations={task.direct_observations || task.evidence?.[0]?.direct_observations || task.evidence?.[0]?.visual_analysis?.evidence?.direct_observations || task.evidence?.[0]?.visual_analysis?.direct_observations}
                        isOfficer={true}
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Location & Citizen Contact Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.825rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} color="var(--accent-rose)" />
                        <strong>{task.address || task.ward || 'West Bengal'}</strong>
                        {task.district && ` (${task.district})`}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} />
                        Citizen: <strong>{task.citizen_name || 'Anonymous'}</strong>
                      </span>
                      {task.citizen_phone && (
                        <a
                          href={`tel:${task.citizen_phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10b981',
                            textDecoration: 'none',
                            fontWeight: 600
                          }}
                        >
                          <PhoneCall size={13} /> {task.citizen_phone}
                        </a>
                      )}
                    </div>

                    {/* Authorised Officer Action Controls */}
                    <div className="officer-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {task.status === 'Assigned' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.4)' }}
                          onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                        >
                          <Navigation size={14} /> Accept & Start Work
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setNoteComplaint(task);
                          setInternalNote('');
                        }}
                      >
                        <MessageSquare size={14} /> Add Note
                      </button>

                      {task.status !== 'Resolved' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)' }}
                          onClick={() => openTransferModal(task)}
                          title="Transfer this complaint to another municipal department"
                        >
                          <RefreshCw size={14} /> Transfer Dept
                        </button>
                      )}

                      {task.status !== 'Resolved' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => setResolvingComplaint(task)}
                        >
                          <CheckCircle2 size={15} /> Complete & Resolve
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedComplaintId(task.id);
                          setCurrentRoute('complaint-details');
                        }}
                      >
                        <Eye size={14} /> View Case File
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.4)' }}
                        onClick={() => setPrintingTask(task)}
                        title="Print complete official case dossier with all photographic evidence"
                      >
                        <Printer size={14} /> Print Case Dossier
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolution Completion Proof Modal */}
        <Modal
          isOpen={!!resolvingComplaint}
          onClose={() => setResolvingComplaint(null)}
          title={`Mark Complaint Resolved #${resolvingComplaint?.tracking_id}`}
        >
          <form onSubmit={handleResolveSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Original Citizen Evidence (Before):
                </label>
                <div style={{ height: '120px', background: '#090d16', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(resolvingComplaint?.image_url || resolvingComplaint?.evidence?.[0]?.secure_url) ? (
                    <img
                      src={resolvingComplaint.image_url || resolvingComplaint.evidence[0].secure_url}
                      alt="Before"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No before photo attached</span>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--accent-emerald)' }}>
                  Officer Resolution Proof (After):
                </label>
                <div style={{ height: '120px', background: '#090d16', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {resolutionFilePreview ? (
                    <img
                      src={resolutionFilePreview}
                      alt="After Proof"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select proof photo below</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remediation Work Details:</label>
              <textarea
                className="form-textarea"
                placeholder="Describe physical on-ground work conducted (e.g. road patched with hot mix asphalt, water pipeline leak sealed, transformer fuse replaced)..."
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Resolution Proof Image (After):</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={async (e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setResolutionFile(f);
                    setResolutionFilePreview(URL.createObjectURL(f));
                    compressImage(f).then(comp => {
                      if (comp) setResolutionFile(comp);
                    });
                  }
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-success btn-lg"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={submitting}
            >
              <CheckCircle2 size={18} /> {submitting ? 'Verifying & Submitting...' : 'Confirm Resolution'}
            </button>
          </form>
        </Modal>

        {/* Add Internal Note Modal */}
        <Modal
          isOpen={!!noteComplaint}
          onClose={() => setNoteComplaint(null)}
          title={`Append Field Note #${noteComplaint?.tracking_id}`}
        >
          <form onSubmit={handleAddNoteSubmit}>
            <div className="form-group">
              <label className="form-label">Internal Field Progress Note:</label>
              <textarea
                className="form-textarea"
                placeholder="Record inspection findings, dispatch team deployment notes, procurement status or coordination with local authorities..."
                required
                rows={4}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={submittingNote}
            >
              <Send size={16} /> {submittingNote ? 'Recording Note...' : 'Record to Timeline'}
            </button>
          </form>
        </Modal>

        {/* Full Media Preview Modal */}
        {previewMedia && (
          <Modal
            isOpen={!!previewMedia}
            onClose={() => setPreviewMedia(null)}
            title="Citizen Evidence Full Preview"
          >
            <div>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                {previewMedia.resource_type === 'video' ? (
                  <video
                    controls
                    src={previewMedia.secure_url || previewMedia.url}
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                  />
                ) : (
                  <img
                    src={previewMedia.secure_url || previewMedia.url}
                    alt="Full Evidence"
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'contain' }}
                  />
                )}
              </div>

              {/* Official Vision AI Scene Description or Officer Visual Inspection Directive */}
              <SceneDescriptionCard
                sceneDescription={previewMedia.scene_description || previewMedia.task?.scene_description || previewMedia.visual_analysis?.scene?.description || previewMedia.visual_analysis?.scene_description}
                sceneType={previewMedia.scene_type || previewMedia.task?.scene_type || previewMedia.visual_analysis?.scene?.scene_type || previewMedia.visual_analysis?.scene_type}
                directObservations={previewMedia.direct_observations || previewMedia.task?.direct_observations || previewMedia.visual_analysis?.evidence?.direct_observations || previewMedia.visual_analysis?.direct_observations}
                isOfficer={true}
                compact={false}
              />
            </div>
          </Modal>
        )}

        {/* Priority Recalibration Modal */}
        {recalibratingTask && (
          <Modal
            isOpen={!!recalibratingTask}
            onClose={() => setRecalibratingTask(null)}
            title={`Recalibrate Priority #${recalibratingTask.tracking_id}`}
          >
            <form onSubmit={handleRecalibrateSubmit}>
              {/* Context Summary */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.84rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, marginBottom: '4px' }}>
                  <ShieldAlert size={15} /> Current Priority: {recalibratingTask.priority} (24-Hour Rapid SLA)
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {recalibratingTask.title}
                </div>
              </div>

              {/* Target Priority Selector */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Select Normalized Priority Target:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTargetPriority('MEDIUM')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: targetPriority === 'MEDIUM' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                      background: targetPriority === 'MEDIUM' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                      color: targetPriority === 'MEDIUM' ? '#60a5fa' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      ● Medium Priority
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                      Standard 72-Hour SLA
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPriority('HIGH')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: targetPriority === 'HIGH' ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                      background: targetPriority === 'HIGH' ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-surface)',
                      color: targetPriority === 'HIGH' ? '#fb923c' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                      ● High Priority
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                      Urgent 48-Hour SLA
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Preset Reasons */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Quick-Fill Official Assessment Reason:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    "Visual evidence shows shallow surface damage (<5cm depth), no immediate risk to life or traffic.",
                    "Hazard is already cordoned off with safety barricades; standard repair schedule applies.",
                    "Misclassified as life-safety emergency; routed to regular municipal maintenance queue.",
                    "No exposed electrical or open shaft hazard verified upon on-ground inspection."
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRecalibrationReason(preset)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.76rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandatory Explanation Input */}
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Official Audit Reason <span style={{ color: '#ef4444' }}>*</span> (visible to citizen & supervisor):
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="Explain why this issue is not an active emergency and why the SLA is being adjusted..."
                  value={recalibrationReason}
                  onChange={(e) => setRecalibrationReason(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRecalibratingTask(null)}
                  disabled={submittingTriage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: '#2563eb',
                    borderColor: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  disabled={submittingTriage || !recalibrationReason.trim() || recalibrationReason.trim().length < 5}
                >
                  <ArrowDownCircle size={15} />
                  {submittingTriage ? 'Recalibrating...' : `Confirm Recalibration to ${targetPriority}`}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Cross-Department Transfer Modal */}
        {transferringTask && (
          <Modal
            isOpen={!!transferringTask}
            onClose={() => setTransferringTask(null)}
            title={`Transfer #${transferringTask.tracking_id} to Another Department`}
          >
            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.84rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontWeight: 700, marginBottom: '4px' }}>
                  <Building2 size={16} /> Current Dept: {transferringTask.department_name || transferringTask.category || 'General Department'}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {transferringTask.title}
                </div>
              </div>

              {/* Target Department Dropdown */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Select Target Civic Department <span style={{ color: '#ef4444' }}>*</span>:
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => {
                    setTargetDeptId(e.target.value);
                    const selected = departments.find(d => String(d.id) === e.target.value);
                    if (selected) setTargetCategory(selected.name);
                  }}
                  required
                  className="form-control"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.88rem' }}
                >
                  <option value="">-- Choose Competent Department --</option>
                  {departments
                    .filter(d => Number(d.id) !== Number(transferringTask.department_id))
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Quick Presets */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Quick-Fill Transfer Justification:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    "Accident on National / State Highway — rerouting to Traffic & Road Safety / PWD",
                    "Solid waste dump in hospital vicinity — rerouting to Solid Waste Management",
                    "Underground water pipeline rupture — rerouting to Water Supply",
                    "High-voltage electrical spark / open transformer — rerouting to Power & Electricity",
                    "Severe street flooding due to clogged canal — rerouting to Drainage & Sewerage"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTransferReason(preset)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.76rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Reason Textarea */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Official Audit Justification <span style={{ color: '#ef4444' }}>*</span>:
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="State why this complaint was misclassified and why it requires specialized action by the target department..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTransferringTask(null)}
                  disabled={submittingTransfer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    background: '#7c3aed',
                    borderColor: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  disabled={submittingTransfer || !targetDeptId || !transferReason.trim()}
                >
                  <Send size={15} />
                  {submittingTransfer ? 'Transferring...' : 'Transfer Complaint'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Official Printable Case Dossier Modal */}
        {printingTask && (
          <PrintableCaseDossier
            complaint={printingTask}
            onClose={() => setPrintingTask(null)}
            isOpen={!!printingTask}
          />
        )}

      </div>
    </div>
  );
}
