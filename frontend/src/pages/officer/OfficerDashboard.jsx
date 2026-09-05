import React, { useState, useEffect } from 'react';
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
  Navigation
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';

export default function OfficerDashboard({ setCurrentRoute, setSelectedComplaintId }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Active');
  
  // Resolve Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionFilePreview, setResolutionFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/officer/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await api.patch(`/officer/tasks/${complaintId}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', 'Resolved');
      formData.append('notes', resolutionNotes || 'Work verified and resolved on ground.');
      if (resolutionFile) {
        formData.append('resolution_image', resolutionFile);
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

  const filtered = tasks.filter(t => {
    if (filter === 'Active') return t.status !== 'Resolved' && t.status !== 'Rejected';
    if (filter === 'Resolved') return t.status === 'Resolved';
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
        {/* Officer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>Field Taskforce Queue</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Logged in as: <strong>{user?.name}</strong> • Department: <span style={{ color: 'var(--accent-cyan)' }}>{user?.department_name || 'Municipal Field Operations'}</span>
            </p>
          </div>

          <div className="tabs-scroll-row" style={{ margin: 0, padding: 0 }}>
            <button 
              className={`btn btn-sm ${filter === 'Active' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Active')}
            >
              Active Tasks ({tasks.filter(t => t.status !== 'Resolved').length})
            </button>
            <button 
              className={`btn btn-sm ${filter === 'Resolved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('Resolved')}
            >
              Resolved ({tasks.filter(t => t.status === 'Resolved').length})
            </button>
            <button 
              className={`btn btn-sm ${filter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('All')}
            >
              All Tasks ({tasks.length})
            </button>
          </div>
        </div>

        {/* Task Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Loading assigned field tasks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <CheckCircle2 size={48} color="var(--accent-emerald)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No Pending Tasks</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              All tickets assigned to your department are up to date.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filtered.map(task => {
              const isOverdue = task.sla_deadline && new Date(task.sla_deadline) < new Date() && task.status !== 'Resolved';

              return (
                <div 
                  key={task.id} 
                  className="glass-card"
                  style={{
                    padding: '22px',
                    borderLeft: task.priority === 'CRITICAL' ? '4px solid #ef4444' : task.priority === 'HIGH' ? '4px solid #f97316' : '4px solid #3b82f6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                        #{task.tracking_id}
                      </span>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="badge badge-status badge-assigned">
                        {task.status}
                      </span>
                      {isOverdue && (
                        <span className="badge badge-critical">
                          <ShieldAlert size={12} /> SLA Overdue
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> SLA Deadline: {task.sla_deadline ? new Date(task.sla_deadline).toLocaleString() : '72 Hours'}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
                    {task.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {task.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="var(--accent-rose)" /> {task.address || task.ward}
                      </span>
                      <span>
                        Citizen: <strong>{task.citizen_name || 'Anonymous'}</strong> ({task.citizen_phone || 'N/A'})
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {task.status === 'Assigned' && (
                        <button 
                          className="btn btn-secondary btn-sm btn-mobile-full"
                          style={{ color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.4)' }}
                          onClick={() => handleStatusUpdate(task.id, 'In Progress')}
                        >
                          <Navigation size={14} /> Mark In Progress
                        </button>
                      )}

                      {task.status !== 'Resolved' && (
                        <button 
                          className="btn btn-success btn-sm btn-mobile-full"
                          onClick={() => setResolvingComplaint(task)}
                        >
                          <CheckCircle2 size={15} /> Complete & Resolve Issue
                        </button>
                      )}

                      <button 
                        className="btn btn-secondary btn-sm btn-mobile-full"
                        onClick={() => {
                          setSelectedComplaintId(task.id);
                          setCurrentRoute('complaint-details');
                        }}
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolution Completion Modal */}
        <Modal 
          isOpen={!!resolvingComplaint} 
          onClose={() => setResolvingComplaint(null)} 
          title={`Mark Complaint Resolved #${resolvingComplaint?.tracking_id}`}
        >
          <form onSubmit={handleResolveSubmit}>
            <div className="form-group">
              <label className="form-label">Field Resolution Work Description:</label>
              <textarea 
                className="form-textarea" 
                placeholder="Describe the physical work done (e.g. pothole filled with hot asphalt and compacted, manhole cover replaced, streetlight bulb replaced)..."
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Resolution Proof Photo (After Work):</label>
              <input 
                type="file" 
                accept="image/*"
                className="form-input"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setResolutionFile(f);
                    setResolutionFilePreview(URL.createObjectURL(f));
                  }
                }}
              />
              {resolutionFilePreview && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={resolutionFilePreview} 
                    alt="Proof" 
                    style={{ maxHeight: '140px', borderRadius: '6px', border: '1px solid var(--accent-emerald)' }} 
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-success btn-lg" 
              style={{ width: '100%', marginTop: '10px' }}
              disabled={submitting}
            >
              <CheckCircle2 size={18} /> {submitting ? 'Verifying & Submitting...' : 'Submit Resolution Proof'}
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
