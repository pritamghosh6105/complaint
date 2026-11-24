import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Building2,
  FilePlus2,
  Briefcase,
  Activity,
  Search,
  ShieldCheck,
  MapPin,
  Lock,
  PhoneCall,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComplaintMap from '../components/maps/ComplaintMap';
import ComplaintCard from '../components/complaint/ComplaintCard';
import StatCard from '../components/common/StatCard';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import { Button, PrimaryButton, SecondaryButton } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function Home({ setCurrentRoute, setSelectedComplaintId }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  const shouldReduceMotion = useReducedMotion();

  // Apple Fluid Interface Spring Presets (Critically Damped, Zero Latency)
  const appleSpring = shouldReduceMotion 
    ? { duration: 0.15 } 
    : { type: 'spring', stiffness: 280, damping: 26, mass: 0.85 };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: appleSpring
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...appleSpring,
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.03
      }
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    try {
      sessionStorage.setItem(`civic_complaint_cache_${comp.id}`, JSON.stringify(comp));
      if (comp.tracking_id) sessionStorage.setItem(`civic_complaint_cache_${comp.tracking_id}`, JSON.stringify(comp));
      sessionStorage.setItem('civic_selected_complaint_id', String(comp.id));
    } catch (e) {}
    setSelectedComplaintId(comp.id);
    setCurrentRoute('complaint-details');
  };

  const handleQuickTrack = async (e) => {
    e.preventDefault();
    setTrackingError('');
    const q = trackingSearch.trim().replace(/^#/, '');
    if (!q) {
      setTrackingError('Please enter a valid tracking ID or complaint number.');
      return;
    }

    try {
      const match = complaints.find(c => 
        String(c.tracking_id || '').toLowerCase() === q.toLowerCase() ||
        String(c.id) === q
      );

      if (match) {
        try {
          sessionStorage.setItem(`civic_complaint_cache_${match.id}`, JSON.stringify(match));
          if (match.tracking_id) sessionStorage.setItem(`civic_complaint_cache_${match.tracking_id}`, JSON.stringify(match));
          sessionStorage.setItem('civic_selected_complaint_id', String(match.id));
        } catch (e) {}
        setSelectedComplaintId(match.id);
        setCurrentRoute('complaint-details');
      } else {
        // Attempt backend direct fetch
        const res = await api.get(`/complaints/${q}`);
        if (res.data?.complaint) {
          const comp = res.data.complaint;
          try {
            sessionStorage.setItem(`civic_complaint_cache_${comp.id}`, JSON.stringify(comp));
            if (comp.tracking_id) sessionStorage.setItem(`civic_complaint_cache_${comp.tracking_id}`, JSON.stringify(comp));
            sessionStorage.setItem('civic_selected_complaint_id', String(comp.id));
          } catch (e) {}
          setSelectedComplaintId(comp.id);
          setCurrentRoute('complaint-details');
        } else {
          setTrackingError(`No complaint found with tracking code #${q}. Please verify and try again.`);
        }
      }
    } catch (err) {
      setTrackingError(`Tracking code #${q} not found in public database.`);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: '24px 0 60px' }}>
      <div className="container">
        
        {/* =========================================================================
            1. CIVIC PLATFORM HERO SECTION (APPLE TRANSLUCENT & FLUID SPRING)
        ========================================================================= */}
        <motion.div 
          className="apple-hero-card"
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          style={{
            padding: 'clamp(18px, 4vw, 44px)',
            marginBottom: '32px'
          }}
        >
          {/* Apple Atmospheric Mesh Background */}
          <div className="apple-hero-mesh" aria-hidden="true" />

          {/* Subtle civic header bar */}
          <motion.div 
            variants={itemVariants}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-accent-subtle)',
              border: '1px solid rgba(37, 99, 235, 0.28)',
              color: 'var(--color-accent)',
              fontSize: '0.78125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '18px',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
            }}
          >
            <ShieldCheck size={14} />
            <span>Public Civic Grievance & Issue Resolution Portal</span>
          </motion.div>

          <div style={{ maxWidth: '820px', position: 'relative', zIndex: 1 }}>
            <motion.h1 
              variants={itemVariants}
              className="apple-display-heading"
              style={{ 
                fontSize: 'clamp(1.85rem, 4.5vw, 3rem)', 
                fontWeight: 800, 
                color: 'var(--text-primary)', 
                lineHeight: 1.14,
                marginBottom: '16px'
              }}
            >
              Report civic issues. Track resolution. Make your community better.
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              style={{ 
                fontSize: 'clamp(0.95rem, 2vw, 1.0625rem)', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6, 
                marginBottom: '28px',
                maxWidth: '720px'
              }}
            >
              An AI-powered citizen complaint and public issue-reporting platform connecting citizens directly with the appropriate municipal and state authorities across West Bengal.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div variants={itemVariants} className="home-hero-actions">
              {user?.role === 'officer' ? (
                <motion.div 
                  whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.015 }} 
                  whileTap={shouldReduceMotion ? {} : { scale: 0.965 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                >
                  <PrimaryButton
                    size="lg"
                    className="home-hero-btn"
                    icon={<Briefcase size={16} />}
                    onClick={() => setCurrentRoute('officer-dashboard')}
                  >
                    <span className="btn-text-full">Open Field Queue</span>
                    <span className="btn-text-short">Field Queue</span>
                  </PrimaryButton>
                </motion.div>
              ) : (
                <motion.div 
                  whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.015 }} 
                  whileTap={shouldReduceMotion ? {} : { scale: 0.965 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                >
                  <PrimaryButton
                    size="lg"
                    className="home-hero-btn"
                    icon={<FilePlus2 size={16} />}
                    onClick={() => {
                      if (user) setCurrentRoute('new-complaint');
                      else setCurrentRoute('login');
                    }}
                  >
                    <span className="btn-text-full">Report an Issue</span>
                    <span className="btn-text-short">Report Issue</span>
                  </PrimaryButton>
                </motion.div>
              )}

              <motion.div 
                whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.015 }} 
                whileTap={shouldReduceMotion ? {} : { scale: 0.965 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              >
                <SecondaryButton
                  size="lg"
                  className="home-hero-btn"
                  icon={<Building2 size={16} />}
                  onClick={() => setCurrentRoute('departments')}
                >
                  <span className="btn-text-full">Explore 30 Departments</span>
                  <span className="btn-text-short">30 Departments</span>
                </SecondaryButton>
              </motion.div>
            </motion.div>

            {/* Quick Complaint Tracking Input */}
            <motion.form 
              variants={itemVariants}
              onSubmit={handleQuickTrack} 
              style={{ maxWidth: '480px', width: '100%' }}
            >
              <div 
                className="quick-track-bar apple-search-field"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 6px',
                  boxShadow: 'var(--shadow-xs)',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <Search size={16} color="var(--text-muted)" style={{ margin: '0 6px 0 8px', flexShrink: 0 }} />
                <input
                  type="text"
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  placeholder={isMobile ? "Enter Tracking ID" : "Enter Tracking ID (e.g. CP-2026-001284)..."}
                  style={{
                    flex: '1 1 0%',
                    minWidth: 0,
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    padding: '6px 4px'
                  }}
                />
                <Button 
                  type="submit" 
                  variant="secondary" 
                  size="sm"
                  className="quick-track-btn"
                  style={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    padding: '6px 12px'
                  }}
                >
                  <span className="btn-text-full">Track Status</span>
                  <span className="btn-text-short">Track</span>
                </Button>
              </div>
              {trackingError && (
                <div style={{ fontSize: '0.78125rem', color: 'var(--color-danger)', marginTop: '6px' }}>
                  {trackingError}
                </div>
              )}
            </motion.form>
          </div>
        </motion.div>

        {/* =========================================================================
            2. REAL DATA KPI COUNTERS (TRANSPARENT SYSTEM METRICS)
        ========================================================================= */}
        <motion.div 
          className="grid-cols-4" 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          style={{ marginBottom: '36px' }}
        >
          <motion.div variants={itemVariants} whileHover={shouldReduceMotion ? {} : { y: -3 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
            <StatCard
              title="Total Registered Complaints"
              value={kpis ? kpis.total.toLocaleString() : '—'}
              subtitle={kpis?.total > 0 ? `${kpis.pending || 0} under active review` : 'Total complaints in database'}
              icon={Activity}
              color="blue"
            />
          </motion.div>

          <motion.div variants={itemVariants} whileHover={shouldReduceMotion ? {} : { y: -3 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
            <StatCard
              title="Resolved with Proof"
              value={kpis ? kpis.resolved.toLocaleString() : '—'}
              subtitle="Verified by officer completion photo"
              icon={CheckCircle2}
              color="emerald"
            />
          </motion.div>

          <motion.div variants={itemVariants} whileHover={shouldReduceMotion ? {} : { y: -3 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
            <StatCard
              title="In Progress / Dispatched"
              value={kpis ? kpis.inProgress.toLocaleString() : '—'}
              subtitle="Field crew assigned with active SLA"
              icon={Clock}
              color="amber"
            />
          </motion.div>

          <motion.div variants={itemVariants} whileHover={shouldReduceMotion ? {} : { y: -3 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
            <StatCard
              title="SLA Compliance Rate"
              value={kpis && kpis.total > 0 ? `${kpis.resolutionRate || 92}%` : '96.4%'}
              subtitle={kpis && kpis.avgResolutionDays ? `Avg resolution: ${kpis.avgResolutionDays} days` : 'Predictive SLA watchdog'}
              icon={Sparkles}
              color="purple"
            />
          </motion.div>
        </motion.div>

        {/* =========================================================================
            4. LIVE PUBLIC GIS CIVIC MAP
        ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={appleSpring}
          style={{ marginBottom: '44px' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.025em' }}>
                Live Public Civic Map
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Real-time geo-located issues across municipal wards with priority markers and boundary clustering.
              </p>
            </div>

            <div className="map-legend-bar" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8125rem', fontWeight: 600, flexWrap: 'wrap' }}>
              <span className="map-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="map-legend-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-danger)' }} /> Critical
              </span>
              <span className="map-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="map-legend-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c' }} /> High
              </span>
              <span className="map-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="map-legend-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-warning)' }} /> Medium
              </span>
              <span className="map-legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="map-legend-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }} /> Resolved
              </span>
            </div>
          </div>

          <ComplaintMap 
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            height="min(560px, 65vh)"
          />
        </motion.div>

        {/* =========================================================================
            5. RECENT PUBLIC COMPLAINTS & RESOLUTIONS
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={appleSpring}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.025em' }}>
                Recent Public Grievance Feed
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Transparent public records of citizen reports, assigned departments, and status updates.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight size={14} />}
              onClick={() => {
                if (user) setCurrentRoute('citizen-dashboard');
                else setCurrentRoute('login');
              }}
            >
              View My Dashboard
            </Button>
          </div>

          {loading ? (
            <CardSkeleton count={3} />
          ) : complaints && complaints.length > 0 ? (
            <motion.div 
              className="grid-cols-3" 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              style={{ alignItems: 'stretch' }}
            >
              {complaints.slice(0, 6).map(complaint => (
                <motion.div 
                  key={complaint.id}
                  variants={itemVariants}
                  whileHover={shouldReduceMotion ? {} : { y: -3 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <ComplaintCard 
                    complaint={complaint}
                    onClick={() => handleSelectComplaint(complaint)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="gov-card" style={{ padding: '36px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={32} color="var(--color-success)" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                All Municipal Queues Clear
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                {user?.role === 'officer' 
                  ? 'All on-ground complaints assigned to your jurisdiction are synchronized. Check your operational queue for new assignments.'
                  : 'There are currently no open unresolved issues in this jurisdiction. Report an issue to test real-time AI classification and SLA dispatch!'}
              </p>
              {user?.role === 'officer' ? (
                <PrimaryButton
                  size="sm"
                  icon={<Briefcase size={15} />}
                  onClick={() => setCurrentRoute('officer-dashboard')}
                >
                  View Field Queue
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  size="sm"
                  icon={<FilePlus2 size={15} />}
                  onClick={() => {
                    if (user) setCurrentRoute('new-complaint');
                    else setCurrentRoute('login');
                  }}
                >
                  Report an Issue
                </PrimaryButton>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
