import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  FilePlus2,
  Activity,
  Flame,
  Sparkles,
  Search,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComplaintMap from '../components/maps/ComplaintMap';
import ComplaintCard from '../components/complaint/ComplaintCard';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

// Simulated sample complaints for the interactive AI Hero visualizer
const AI_SIMULATION_STEPS = [
  {
    text: "Deep pothole on Station Road causing two-wheelers to slip near school gate.",
    category: "Road Damage",
    confidence: "94%",
    department: "Public Works Department",
    priority: "CRITICAL",
    risk: "School Zone Hazard",
    duplicate: "No (R > 350m)",
    sla: "24 Hours"
  },
  {
    text: "Massive garbage pile overflowing from municipal bin near main market.",
    category: "Garbage & Waste",
    confidence: "98%",
    department: "Solid Waste Management",
    priority: "HIGH",
    risk: "Public Health Risk",
    duplicate: "No (R > 350m)",
    sla: "48 Hours"
  },
  {
    text: "High-mast streetlight pole sparking and dark corridor on 5th Avenue.",
    category: "Streetlight",
    confidence: "96%",
    department: "Electrical & Lighting",
    priority: "MEDIUM",
    risk: "Night Visibility",
    duplicate: "No (R > 350m)",
    sla: "72 Hours"
  }
];

export default function Home({ setCurrentRoute, setSelectedComplaintId }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simIndex, setSimIndex] = useState(0);

  // Rotate simulated complaints in the Hero Visualizer every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSimIndex(prev => (prev + 1) % AI_SIMULATION_STEPS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, kpiRes] = await Promise.all([
          api.get('/complaints/public'),
          api.get('/analytics/kpis')
        ]);
        setComplaints(compRes.data.complaints || []);
        setKpis(kpiRes.data.kpis || null);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectComplaint = (comp) => {
    setSelectedComplaintId(comp.id);
    setCurrentRoute('complaint-details');
  };

  const activeSim = AI_SIMULATION_STEPS[simIndex];

  return (
    <div className="page-wrapper">
      <div className="container">
        
        {/* =========================================================================
            1. HERO SECTION (TWO-COLUMN WITH ANIMATED AI PROCESSING VISUALIZATION)
        ========================================================================= */}
        <div className="hero-split-grid">
          {/* Left Column: Text & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Top Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '18px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              AI/ML-POWERED MUNICIPAL GOVERNANCE & GEOSPATIAL RESOLUTION
            </div>

            {/* Main Headline */}
            <h1 style={{ 
              fontSize: 'clamp(1.85rem, 5.2vw, 3rem)', 
              fontWeight: 900, 
              lineHeight: 1.15, 
              marginBottom: '18px', 
              color: 'var(--text-primary)' 
            }}>
              Empowering Citizens. <br />
              <span style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Resolving Civic Issues Faster with AI.
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: '1.08rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Report road damage, overflowing waste, streetlight failures, drainage hazards and other civic issues in seconds.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '30px' }}>
              <button 
                className="btn btn-primary btn-lg btn-mobile-full"
                onClick={() => {
                  if (user) setCurrentRoute('new-complaint');
                  else setCurrentRoute('login');
                }}
              >
                <FilePlus2 size={18} /> Report an Issue Now <ArrowRight size={18} />
              </button>

              <button 
                className="btn btn-secondary btn-lg btn-mobile-full"
                onClick={() => setCurrentRoute('gis-heatmap')}
              >
                <MapPin size={18} /> View City GIS Heatmap
              </button>
            </div>
          </motion.div>

          {/* Right Column: Animated AI Complaint Processing Visualizer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'relative' }}
          >
            {/* Ambient Background Glow */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '320px',
              height: '320px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
              zIndex: 0
            }} />

            <div className="glass-card" style={{
              position: 'relative',
              zIndex: 1,
              padding: '26px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden'
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <BrainCircuit size={16} />
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Live AI Complaint Processing</strong>
                </div>
                <span style={{ 
                  fontSize: '0.72rem', 
                  color: '#10b981', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  padding: '2px 8px', 
                  borderRadius: 'var(--radius-full)', 
                  fontWeight: 700 
                }}>
                  ● Inference Engine Active
                </span>
              </div>

              {/* Citizen Raw Text Input Simulation */}
              <div style={{ 
                background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '12px 14px', 
                marginBottom: '16px',
                border: '1px solid var(--border-subtle)',
                minHeight: '68px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Citizen Description (Input):
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={simIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.4 }}
                  >
                    "{activeSim.text}"
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Scanning Laser Beam Effect */}
              <div style={{
                height: '2px',
                width: '100%',
                background: 'linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent)',
                marginBottom: '16px',
                animation: 'pulseGlow 2s infinite ease-in-out'
              }} />

              {/* ML Output Badges Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={simIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}
                >
                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✓ Predicted Category</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {activeSim.category} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({activeSim.confidence})</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✓ Urgency & Priority</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: activeSim.priority === 'CRITICAL' ? 'var(--status-critical)' : 'var(--status-high)' }}>
                      {activeSim.priority} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({activeSim.risk})</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✓ Duplicate Incident?</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                      {activeSim.duplicate}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✓ Dynamic SLA</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                      {activeSim.sla} Deadline
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Auto-Assigned Department Routing Box */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Auto-Routed Department:</span>
                <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building2 size={14} color="var(--accent-primary)" /> {activeSim.department}
                </strong>
              </div>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            DYNAMIC AI RESOLUTION FLOW (FLOWING GLOWING LINES & PARTICLES)
        ========================================================================= */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: '16px 20px',
          marginBottom: '45px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glowing animated line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6, #10b981)',
            opacity: 0.8
          }} />

          <div className="resolution-flow-strip no-scrollbar" style={{
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            <span style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6' }} />
              Citizen Complaint
            </span>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
            <span style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <BrainCircuit size={14} /> AI Analysis
            </span>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
            <span style={{ color: 'var(--text-primary)', flexShrink: 0 }}>Category Prediction</span>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
            <span style={{ color: 'var(--status-critical)', flexShrink: 0 }}>Priority Prediction</span>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
            <span style={{ color: 'var(--accent-purple)', flexShrink: 0 }}>Duplicate Detection</span>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
            <span style={{ color: 'var(--status-high)', flexShrink: 0 }}>Department Assignment</span>
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>
            <span style={{ color: 'var(--status-low)', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <CheckCircle2 size={14} /> Resolution
            </span>
          </div>
        </div>

        {/* =========================================================================
            STATISTICS SECTION (4 ANIMATED COUNTERS)
        ========================================================================= */}
        <div style={{ marginBottom: '55px' }}>
          <div className="kpi-grid-4">
            <Card style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Complaints
                </span>
                <Activity size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {kpis ? kpis.total.toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {kpis?.total > 0 ? `${kpis.pending} pending verification` : 'Active database count'}
              </div>
            </Card>

            <Card style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Resolved
                </span>
                <CheckCircle2 size={18} color="var(--status-low)" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--status-low)' }}>
                {kpis ? kpis.resolved.toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {kpis?.resolved > 0 ? 'Verified with photo proof' : '0 resolved so far'}
              </div>
            </Card>

            <Card style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  In Progress
                </span>
                <Clock size={18} color="var(--status-high)" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--status-high)' }}>
                {kpis ? kpis.inProgress.toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {kpis?.inProgress > 0 ? 'Assigned to field taskforce' : 'No active dispatches'}
              </div>
            </Card>

            <Card style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Resolution Rate
                </span>
                <Sparkles size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                {kpis && kpis.total > 0 ? `${kpis.resolutionRate}%` : '0%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {kpis && kpis.total > 0 ? `Avg resolution: ${kpis.avgResolutionDays} days` : 'Real-time database metric'}
              </div>
            </Card>
          </div>
        </div>



        {/* =========================================================================
            LIVE GIS CITY MAP SECTION
        ========================================================================= */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '5px', fontWeight: 800 }}>
                Live Public Civic Map
              </h2>
              <div style={{ fontSize: '0.925rem', color: 'var(--text-muted)' }}>
                Real-time geo-located issues across municipal wards with priority markers.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}></span> Critical
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)' }}></span> High
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#eab308', boxShadow: '0 0 8px rgba(234, 179, 8, 0.6)' }}></span> Medium
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}></span> Resolved
              </span>
            </div>
          </div>

          <ComplaintMap 
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            height="min(680px, 75vh)"
          />
        </div>

        {/* =========================================================================
            5. RECENT VERIFIED COMPLAINT CARDS (POLISHED CARDS)
        ========================================================================= */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              Recent Public Complaints & Resolutions
            </h2>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => {
                if (user) setCurrentRoute('citizen-dashboard');
                else setCurrentRoute('login');
              }}
            >
              View All Complaints <ArrowRight size={14} />
            </button>
          </div>

          {complaints && complaints.length > 0 ? (
            <div className="grid-cols-3">
              {complaints.slice(0, 6).map(complaint => (
                <ComplaintCard 
                  key={complaint.id}
                  complaint={complaint}
                  onClick={() => handleSelectComplaint(complaint)}
                />
              ))}
            </div>
          ) : (
            <Card style={{ padding: '36px 24px', textAlign: 'center', background: 'var(--bg-glass)', border: '1px dashed var(--border-subtle)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>No Active Complaints</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 18px' }}>
                The municipal grievance queue is currently completely clear. Report a new issue to see real-time AI classification, SLA tracking, and GIS mapping!
              </p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (user) setCurrentRoute('new-complaint');
                  else setCurrentRoute('login');
                }}
              >
                <FilePlus2 size={15} /> Report New Civic Issue
              </button>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
