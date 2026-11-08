import React, { useState, useEffect } from 'react';
import { 
  FilePlus2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Eye, 
  Star,
  Search,
  Activity,
  ArrowRight,
  Map,
  Filter,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FeedbackModal from '../../components/complaint/FeedbackModal';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PrimaryButton, SecondaryButton, Button } from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

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
    if (user && user.role === 'officer') {
      setCurrentRoute('officer-dashboard');
      return;
    }
    fetchMyComplaints();
  }, [user]);

  const totalCount = complaints.length;
  const underReviewCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'AI Analyzed').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Verified').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const filtered = complaints.filter(c => {
    if (filterStatus !== 'All') {
      const s = String(c.status || '').toLowerCase();
      if (filterStatus === 'Under Review') {
        if (s !== 'submitted' && s !== 'under review' && s !== 'under_review') return false;
      } else if (filterStatus === 'In Progress') {
        if (s !== 'in progress' && s !== 'in_progress' && s !== 'assigned' && s !== 'verified') return false;
      } else if (filterStatus === 'Resolved') {
        if (s !== 'resolved' && s !== 'closed') return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.tracking_id || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort complaints so Critical / Emergency life hazards always appear FIRST on citizen dashboard
  const priorityWeights = { 'CRITICAL': 400, 'HIGH': 300, 'MEDIUM': 200, 'LOW': 100 };
  const sortedComplaints = [...filtered].sort((a, b) => {
    const aResolved = (a.status === 'Resolved' || a.status === 'Closed') ? 1 : 0;
    const bResolved = (b.status === 'Resolved' || b.status === 'Closed') ? 1 : 0;
    if (aResolved !== bResolved) return aResolved - bResolved;

    const aWeight = priorityWeights[a.priority] || 100;
    const bWeight = priorityWeights[b.priority] || 100;
    const aEmergency = (a.is_emergency || a.priority === 'CRITICAL') ? 50 : 0;
    const bEmergency = (b.is_emergency || b.priority === 'CRITICAL') ? 50 : 0;

    const aTotal = aWeight + aEmergency;
    const bTotal = bWeight + bEmergency;
    if (aTotal !== bTotal) return bTotal - aTotal;

    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-wrapper" style={{ padding: '24px 0 60px' }}>
      <div className="container">
        
        {/* Page Header */}
        <PageHeader
          title={`${getGreeting()}, ${user?.name || 'Citizen'}`}
          subtitle="Track your civic complaints and community issues with real-time transparent SLA watchdog updates."
          badge={
            <span style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              border: '1px solid rgba(37, 99, 235, 0.25)'
            }}>
              Citizen Resident Portal
            </span>
          }
          actions={
            <PrimaryButton 
              icon={<FilePlus2 size={16} />}
              onClick={() => setCurrentRoute('new-complaint')}
            >
              Report New Issue
            </PrimaryButton>
          }
        />

        {/* Top KPI Summary Stats */}
        <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
          <StatCard
            title="Total Complaints"
            value={totalCount}
            subtitle="Registered in your profile"
            icon={Activity}
            color="blue"
          />

          <StatCard
            title="Under Review"
            value={underReviewCount}
            subtitle="Initial verification & routing"
            icon={Clock}
            color="purple"
          />

          <StatCard
            title="In Progress"
            value={inProgressCount}
            subtitle="Assigned to department crew"
            icon={AlertTriangle}
            color="amber"
          />

          <StatCard
            title="Resolved"
            value={resolvedCount}
            subtitle="Verified with photo evidence"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>

        {/* Quick Actions Strip */}
        <div className="citizen-quick-actions">
          <div className="citizen-quick-actions-label">
            <strong className="quick-actions-title">Quick Actions:</strong>
            <span className="quick-actions-subtitle">Direct citizen shortcuts</span>
          </div>

          <div className="citizen-quick-actions-btns">
            <Button 
              variant="secondary" 
              size="sm" 
              className="quick-action-btn"
              icon={<FilePlus2 size={13} />}
              onClick={() => setCurrentRoute('new-complaint')}
            >
              <span className="btn-text-full">Report Issue</span>
              <span className="btn-text-short">Report</span>
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="quick-action-btn"
              icon={<Map size={13} />}
              onClick={() => setCurrentRoute('home')}
            >
              <span className="btn-text-full">View Public Map</span>
              <span className="btn-text-short">Map</span>
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="quick-action-btn"
              icon={<Eye size={13} />}
              onClick={() => setCurrentRoute('departments')}
            >
              <span className="btn-text-full">30 Departments</span>
              <span className="btn-text-short">30 Depts</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="gov-card citizen-filter-card" style={{ padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="citizen-search-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 'min(100%, 280px)' }}>
            <Search size={16} color="var(--text-muted)" className="citizen-search-icon" />
            <input 
              type="text" 
              className="form-input citizen-search-input" 
              placeholder="Search by ticket ID, category, keyword, or district..."
              style={{ padding: '8px 12px', fontSize: '0.84rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="citizen-filter-pills" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'All', label: 'All', short: 'All' },
              { id: 'Under Review', label: 'Under Review', short: 'Review' },
              { id: 'In Progress', label: 'In Progress', short: 'Progress' },
              { id: 'Resolved', label: 'Resolved', short: 'Resolved' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`btn btn-sm citizen-filter-btn ${filterStatus === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                <span className="citizen-pill-full">{tab.label}</span>
                <span className="citizen-pill-short">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Listing */}
        {loading ? (
          <CardSkeleton count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No complaints found"
            description={searchQuery || filterStatus !== 'All' 
              ? 'No issues match your current filters. Try resetting the search or filter criteria.' 
              : "You haven't submitted any civic complaints yet. If there's an issue in your neighborhood, submit a complaint with photo and GPS location."}
            actionLabel="Report an Issue"
            onAction={() => setCurrentRoute('new-complaint')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sortedComplaints.map(comp => {
              const trackingCode = comp.tracking_id || `CP-${comp.id}`;
              const isResolved = comp.status === 'Resolved';

              return (
                <div 
                  key={comp.id} 
                  className="gov-card gov-card-interactive"
                  onClick={() => {
                    setSelectedComplaintId(comp.id);
                    setCurrentRoute('complaint-details');
                  }}
                  style={{ 
                    padding: '18px 20px', 
                    display: 'flex', 
                    gap: '16px', 
                    flexWrap: 'wrap', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}
                >
                  <div style={{ flex: 1, minWidth: 'min(100%, 280px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 700, 
                        color: 'var(--color-accent)', 
                        fontSize: '0.8125rem',
                        background: 'var(--color-accent-subtle)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid rgba(37, 99, 235, 0.2)'
                      }}>
                        #{trackingCode}
                      </span>
                      <PriorityBadge priority={comp.priority} />
                      <StatusBadge status={comp.status} />
                      {comp.triage_status === 'CONFIRMED_CRITICAL' && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldAlert size={12} /> Emergency Verified (24h Rapid SLA)
                        </span>
                      )}
                      {comp.triage_status === 'RECALIBRATED_NORMAL' && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          Priority Recalibrated ({comp.priority === 'HIGH' ? '48h' : '72h'} SLA)
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {comp.title || comp.category}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="var(--color-accent)" /> 
                        {comp.district ? `${comp.district} • ` : ''}{comp.ward || comp.police_station || 'Municipal Area'}
                      </span>
                      <span>•</span>
                      <span>Category: <strong style={{ color: 'var(--text-primary)' }}>{comp.category}</strong></span>
                      {comp.created_at && (
                        <>
                          <span>•</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Filed: {new Date(comp.created_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isResolved && !comp.has_feedback && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Star size={13} color="#f59e0b" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFeedbackComplaint(comp);
                        }}
                      >
                        Rate Resolution
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight size={13} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComplaintId(comp.id);
                        setCurrentRoute('complaint-details');
                      }}
                    >
                      Track
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Modal */}
        {activeFeedbackComplaint && (
          <FeedbackModal
            complaint={activeFeedbackComplaint}
            onClose={() => setActiveFeedbackComplaint(null)}
            onFeedbackSubmitted={() => {
              setActiveFeedbackComplaint(null);
              fetchMyComplaints();
            }}
          />
        )}

      </div>
    </div>
  );
}
