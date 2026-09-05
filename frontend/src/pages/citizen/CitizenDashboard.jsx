import React, { useState, useEffect } from 'react';
import { 
  FilePlus2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Eye, 
  Star,
  Search
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FeedbackModal from '../../components/complaint/FeedbackModal';

export default function CitizenDashboard({ setCurrentRoute, setSelectedComplaintId }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFeedbackComplaint, setActiveFeedbackComplaint] = useState(null);

  const fetchMyComplaints = async () => {
    try {
      const res = await api.get('/complaints/my');
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error('Fetch my complaints error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const filtered = complaints.filter(c => {
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      return (
        (c.title || '').toLowerCase().includes(s) ||
        (c.description || '').toLowerCase().includes(s) ||
        (c.tracking_id || '').toLowerCase().includes(s) ||
        (c.category || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'CRITICAL') return 'badge-critical';
    if (priority === 'HIGH') return 'badge-high';
    if (priority === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Resolved') return 'badge-resolved';
    if (status === 'In Progress') return 'badge-inprogress';
    if (status === 'Assigned' || status === 'Verified') return 'badge-assigned';
    return 'badge-submitted';
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Citizen Dashboard</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Welcome back, <strong>{user?.name}</strong>! Track all your registered issues and municipal responses.
            </p>
          </div>

          <button 
            className="btn btn-primary btn-mobile-full"
            onClick={() => setCurrentRoute('new-complaint')}
          >
            <FilePlus2 size={18} /> Report New Issue
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 'min(100%, 260px)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by ticket ID, title, or keyword..."
              style={{ padding: '8px 12px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tabs-scroll-row" style={{ margin: 0, padding: 0 }}>
            {['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading your complaints...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <CheckCircle2 size={48} color="var(--accent-emerald)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No Complaints Found</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
              {filterStatus !== 'All' || searchQuery
                ? 'No issues match your current filters.'
                : 'You have not submitted any complaints yet. Report any local civic problem to get it resolved!'}
            </p>
            <button className="btn btn-primary" onClick={() => setCurrentRoute('new-complaint')}>
              <FilePlus2 size={16} /> Report an Issue
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(comp => (
              <div 
                key={comp.id} 
                className="glass-card"
                style={{ padding: 'clamp(14px, 3vw, 20px)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ flex: 1, minWidth: 'min(100%, 260px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                      #{comp.tracking_id}
                    </span>
                    <span className={`badge ${getPriorityBadgeClass(comp.priority)}`}>
                      {comp.priority}
                    </span>
                    <span className={`badge badge-status ${getStatusBadgeClass(comp.status)}`}>
                      {comp.status}
                    </span>
                    {comp.is_escalated === 1 && (
                      <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
                        Escalated (Level {comp.escalation_level})
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {comp.title}
                  </h3>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
                    {comp.description?.length > 130 ? `${comp.description.substring(0, 130)}...` : comp.description}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--accent-primary)" /> {comp.address || comp.ward}
                    </span>
                    <span>
                      Dept: <strong style={{ color: '#cbd5e1' }}>{comp.department_name || comp.category}</strong>
                    </span>
                    <span>
                      Est. Resolution: <strong style={{ color: '#cbd5e1' }}>{comp.predicted_resolution_days || 2.5} Days</strong>
                    </span>
                  </div>
                </div>

                <div className="complaint-card-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSelectedComplaintId(comp.id);
                      setCurrentRoute('complaint-details');
                    }}
                  >
                    <Eye size={15} /> Track Timeline
                  </button>

                  {comp.status === 'Resolved' && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
                      onClick={() => setActiveFeedbackComplaint(comp)}
                    >
                      <Star size={14} /> Rate Resolution
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={!!activeFeedbackComplaint}
          onClose={() => setActiveFeedbackComplaint(null)}
          complaint={activeFeedbackComplaint}
          onFeedbackSubmitted={fetchMyComplaints}
        />
      </div>
    </div>
  );
}
