const db = require('../models/db');
const mlClient = require('../services/mlClient');

class AnalyticsController {
  /**
   * Overall System KPIs
   */
  async getDashboardKPIs(req, res) {
    try {
      const complaints = db.prepare('SELECT * FROM complaints').all();
      const feedback = db.prepare('SELECT * FROM feedback').all();

      const total = complaints.length;
      const pending = complaints.filter(c => ['Submitted', 'Verified'].includes(c.status)).length;
      const inProgress = complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
      const resolved = complaints.filter(c => c.status === 'Resolved').length;
      const critical = complaints.filter(c => c.priority === 'CRITICAL').length;
      const slaViolations = complaints.filter(c => c.is_escalated === 1 || c.escalation_level > 0).length;

      // Calculate Average Resolution Time (in days)
      const resolvedList = complaints.filter(c => c.status === 'Resolved' && c.resolved_at && c.created_at);
      let totalResolutionHours = 0;
      for (const r of resolvedList) {
        const diffMs = new Date(r.resolved_at) - new Date(r.created_at);
        totalResolutionHours += Math.max(1, diffMs / (1000 * 60 * 60));
      }
      const avgResolutionDays = resolvedList.length > 0 ? Number((totalResolutionHours / (resolvedList.length * 24)).toFixed(1)) : 0;

      // Citizen Satisfaction Average Rating (out of 5)
      const avgRating = feedback.length > 0
        ? Number((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1))
        : 0;

      res.json({
        kpis: {
          total,
          pending,
          inProgress,
          resolved,
          critical,
          slaViolations,
          avgResolutionDays,
          citizenSatisfaction: avgRating,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
        }
      });
    } catch (err) {
      console.error('KPI error:', err);
      res.status(500).json({ error: 'Failed to calculate KPIs' });
    }
  }

  /**
   * Category and Priority Breakdown Charts
   */
  getCategoryAndPriorityBreakdown(req, res) {
    try {
      const complaints = db.prepare('SELECT * FROM complaints').all();

      const catCounts = {};
      const prioCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      const wardCounts = {};

      for (const c of complaints) {
        catCounts[c.category] = (catCounts[c.category] || 0) + 1;
        if (prioCounts[c.priority] !== undefined) {
          prioCounts[c.priority]++;
        }
        if (c.ward) {
          wardCounts[c.ward] = (wardCounts[c.ward] || 0) + 1;
        }
      }

      const categoryData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));
      const priorityData = Object.entries(prioCounts).map(([name, value]) => ({ name, value }));
      const wardData = Object.entries(wardCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      res.json({
        categoryData,
        priorityData,
        wardData
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch breakdown' });
    }
  }

  /**
   * Department Performance Ranking
   */
  getDepartmentPerformance(req, res) {
    try {
      const departments = db.prepare('SELECT * FROM departments').all();
      const complaints = db.prepare('SELECT * FROM complaints').all();
      const feedback = db.prepare('SELECT * FROM feedback').all();

      const performance = departments.map(d => {
        const deptComplaints = complaints.filter(c => c.department_id === d.id);
        const total = deptComplaints.length;
        const resolved = deptComplaints.filter(c => c.status === 'Resolved').length;
        const slaBreaches = deptComplaints.filter(c => c.is_escalated === 1 || c.escalation_level > 0).length;

        // Feedback average for department
        const deptComplaintIds = new Set(deptComplaints.map(c => c.id));
        const deptFeedbacks = feedback.filter(f => deptComplaintIds.has(f.complaint_id));
        const rating = deptFeedbacks.length > 0
          ? Number((deptFeedbacks.reduce((s, f) => s + f.rating, 0) / deptFeedbacks.length).toFixed(1))
          : 4.5;

        return {
          id: d.id,
          name: d.name,
          code: d.code,
          head_name: d.head_name,
          totalAssigned: total,
          resolved,
          pending: total - resolved,
          resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
          slaBreaches,
          satisfactionRating: rating
        };
      });

      res.json({ performance });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch department performance' });
    }
  }

  /**
   * GIS Heatmap Points & Location Filtering with Crime Shielding
   */
  getGISHeatmap(req, res) {
    try {
      const {
        district,
        district_id,
        subdivision,
        subdivision_id,
        municipality,
        ulb_id,
        ward,
        block,
        block_id,
        gram_panchayat,
        gram_panchayat_id,
        village,
        police_station,
        police_station_id,
        department_id,
        category,
        priority,
        status,
        view_type, // 'all', 'crime', 'civic'
        timeframe // '7d', '30d', '6m', 'all'
      } = req.query;

      // Check authorization for crime data unmasking
      let isAuthorizedLawEnforcement = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const { JWT_SECRET } = require('../middleware/authMiddleware');
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && (decoded.role === 'admin' || decoded.role === 'officer')) {
            isAuthorizedLawEnforcement = true;
          }
        } catch (e) {
          // unauthenticated or expired, fallback to public masked mode
        }
      }

      let complaints = db.prepare('SELECT * FROM complaints').all();

      // Geographic filters
      if (district && district !== 'All') {
        complaints = complaints.filter(c => (c.district || '').toLowerCase() === district.toLowerCase());
      }
      if (district_id && district_id !== 'All') {
        complaints = complaints.filter(c => c.district_id === Number(district_id));
      }
      if (subdivision && subdivision !== 'All') {
        complaints = complaints.filter(c => (c.subdivision || '').toLowerCase() === subdivision.toLowerCase());
      }
      if (subdivision_id && subdivision_id !== 'All') {
        complaints = complaints.filter(c => c.subdivision_id === Number(subdivision_id));
      }
      if (municipality && municipality !== 'All') {
        complaints = complaints.filter(c => (c.municipality || '').toLowerCase().includes(municipality.toLowerCase()));
      }
      if (ulb_id && ulb_id !== 'All') {
        complaints = complaints.filter(c => c.ulb_id === Number(ulb_id));
      }
      if (ward && ward !== 'All') {
        complaints = complaints.filter(c => (c.ward || '').toLowerCase() === ward.toLowerCase());
      }
      if (block && block !== 'All') {
        complaints = complaints.filter(c => (c.block || '').toLowerCase().includes(block.toLowerCase()));
      }
      if (block_id && block_id !== 'All') {
        complaints = complaints.filter(c => c.block_id === Number(block_id));
      }
      if (gram_panchayat && gram_panchayat !== 'All') {
        complaints = complaints.filter(c => (c.gram_panchayat || '').toLowerCase().includes(gram_panchayat.toLowerCase()));
      }
      if (gram_panchayat_id && gram_panchayat_id !== 'All') {
        complaints = complaints.filter(c => c.gram_panchayat_id === Number(gram_panchayat_id));
      }
      if (village && village !== 'All') {
        complaints = complaints.filter(c => (c.village || '').toLowerCase().includes(village.toLowerCase()));
      }
      if (police_station && police_station !== 'All') {
        complaints = complaints.filter(c => (c.police_station || '').toLowerCase().includes(police_station.toLowerCase()));
      }
      if (department_id && department_id !== 'All') {
        complaints = complaints.filter(c => c.department_id === Number(department_id));
      }
      if (category && category !== 'All') {
        complaints = complaints.filter(c => c.category === category);
      }
      if (priority && priority !== 'All') {
        complaints = complaints.filter(c => c.priority === priority);
      }
      if (status && status !== 'All') {
        complaints = complaints.filter(c => c.status === status);
      }

      // View type filter: Crime only vs Civic only
      if (view_type === 'crime') {
        complaints = complaints.filter(c => c.is_crime === 1 || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(c.category));
      } else if (view_type === 'civic') {
        complaints = complaints.filter(c => c.is_crime !== 1 && !['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(c.category));
      }

      // Timeframe filter
      if (timeframe && timeframe !== 'all') {
        const now = Date.now();
        let days = 30;
        if (timeframe === '7d') days = 7;
        else if (timeframe === '30d') days = 30;
        else if (timeframe === '6m') days = 180;
        const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
        complaints = complaints.filter(c => {
          if (!c.created_at) return true;
          return new Date(c.created_at) >= cutoff;
        });
      }

      const heatPoints = complaints
        .filter(c => c.latitude && c.longitude && Math.abs(c.latitude) > 0.1)
        .map(c => {
          let intensity = 0.5;
          if (c.priority === 'CRITICAL') intensity = 1.0;
          else if (c.priority === 'HIGH') intensity = 0.8;
          else if (c.priority === 'MEDIUM') intensity = 0.6;
          else intensity = 0.4;

          const isCrime = c.is_crime === 1 || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(c.category);

          // Crime Shielding: If public/unauthorized, mask sensitive title and blur GPS slightly
          let displayTitle = c.title;
          let displayLat = c.latitude;
          let displayLng = c.longitude;
          let isProtected = false;

          if (isCrime && !isAuthorizedLawEnforcement) {
            displayTitle = `[Protected Case: ${c.category}] - Police Jurisdiction`;
            displayLat = Number(c.latitude.toFixed(2));
            displayLng = Number(c.longitude.toFixed(2));
            isProtected = true;
          }

          return {
            id: c.id,
            tracking_id: c.tracking_id,
            title: displayTitle,
            category: c.category,
            priority: c.priority,
            status: c.status,
            lat: displayLat,
            lng: displayLng,
            intensity,
            district: c.district || 'West Bengal',
            subdivision: c.subdivision || '',
            administrative_type: c.administrative_type || 'Urban',
            municipality: c.municipality || '',
            ward: c.ward || '',
            block: c.block || '',
            gram_panchayat: c.gram_panchayat || '',
            village: c.village || '',
            police_station: c.police_station || '',
            is_crime: isCrime,
            is_protected: isProtected,
            is_escalated: c.is_escalated === 1
          };
        });

      res.json({ points: heatPoints, count: heatPoints.length });
    } catch (err) {
      console.error('Heatmap point error:', err);
      res.status(500).json({ error: 'Failed to fetch GIS heatmap points' });
    }
  }

  /**
   * Geographic Analytics Breakdown (Districts, ULBs, Blocks, Wards, GPs, Police Stations)
   */
  getGeographicAnalytics(req, res) {
    try {
      const complaints = db.prepare('SELECT * FROM complaints').all();

      const districtMap = {};
      const ulbMap = {};
      const blockMap = {};
      const wardMap = {};
      const gpMap = {};
      const psMap = {};
      let crimeCount = 0;
      let civicCount = 0;

      for (const c of complaints) {
        const dist = c.district || 'North 24 Parganas';
        districtMap[dist] = (districtMap[dist] || 0) + 1;

        if (c.municipality) {
          ulbMap[c.municipality] = (ulbMap[c.municipality] || 0) + 1;
        }
        if (c.block) {
          blockMap[c.block] = (blockMap[c.block] || 0) + 1;
        }
        if (c.ward) {
          wardMap[c.ward] = (wardMap[c.ward] || 0) + 1;
        }
        if (c.gram_panchayat) {
          gpMap[c.gram_panchayat] = (gpMap[c.gram_panchayat] || 0) + 1;
        }
        if (c.police_station) {
          psMap[c.police_station] = (psMap[c.police_station] || 0) + 1;
        }

        if (c.is_crime === 1 || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(c.category)) {
          crimeCount++;
        } else {
          civicCount++;
        }
      }

      const toSortedArray = (obj) => Object.entries(obj).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      res.json({
        byDistrict: toSortedArray(districtMap),
        byULB: toSortedArray(ulbMap),
        byBlock: toSortedArray(blockMap),
        byWard: toSortedArray(wardMap).slice(0, 15),
        byGramPanchayat: toSortedArray(gpMap).slice(0, 15),
        byPoliceStation: toSortedArray(psMap).slice(0, 15),
        summary: {
          total: complaints.length,
          crimeCount,
          civicCount
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch geographic analytics' });
    }
  }

  /**
   * ML Model Live Inspection & Metrics
   */
  async getMLModelInspection(req, res) {
    try {
      const metrics = await mlClient.getMetrics();
      res.json({ metrics });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch ML inspection metrics' });
    }
  }

  /**
   * Civic Problem Hotspot Detection Engine
   * Clusters recurring issues by Ward / Area and identifies acute civic vulnerability zones
   */
  getCivicHotspots(req, res) {
    try {
      const complaints = db.prepare('SELECT * FROM complaints WHERE status != ?').all('Rejected');

      // Cluster by location key (Ward or Municipality or Locality)
      const clusters = {};

      for (const c of complaints) {
        const areaKey = c.ward || c.village || c.locality || c.municipality || 'Central Ward';
        if (!clusters[areaKey]) {
          clusters[areaKey] = {
            area: areaKey,
            municipality: c.municipality || 'Urban Local Body',
            district: c.district || 'West Bengal',
            latitude: c.latitude,
            longitude: c.longitude,
            total_complaints: 0,
            critical_count: 0,
            active_count: 0,
            resolved_count: 0,
            categories: {},
            impact_scores: []
          };
        }

        const cluster = clusters[areaKey];
        cluster.total_complaints++;
        if (c.priority === 'CRITICAL') cluster.critical_count++;
        if (c.status === 'Resolved') cluster.resolved_count++;
        else cluster.active_count++;

        cluster.categories[c.category] = (cluster.categories[c.category] || 0) + 1;
        cluster.impact_scores.push(c.impact_score || 50);
      }

      const hotspots = Object.values(clusters)
        .map(c => {
          const sortedCats = Object.entries(c.categories).sort((a, b) => b[1] - a[1]);
          const topCategory = sortedCats[0] ? sortedCats[0][0] : 'General';
          const avgImpact = Math.round(c.impact_scores.reduce((a, b) => a + b, 0) / c.impact_scores.length);

          let riskLevel = 'MODERATE';
          let badgeColor = '#3b82f6';
          if (c.critical_count >= 2 || c.total_complaints >= 5 || avgImpact >= 75) {
            riskLevel = 'VERY HIGH';
            badgeColor = '#ef4444';
          } else if (c.total_complaints >= 3 || avgImpact >= 60) {
            riskLevel = 'HIGH';
            badgeColor = '#f97316';
          }

          return {
            area: c.area,
            municipality: c.municipality,
            district: c.district,
            latitude: c.latitude,
            longitude: c.longitude,
            total_complaints: c.total_complaints,
            active_count: c.active_count,
            resolved_count: c.resolved_count,
            critical_count: c.critical_count,
            top_category: topCategory,
            top_categories: sortedCats.slice(0, 3).map(([name, count]) => ({ name, count })),
            average_impact_score: avgImpact,
            risk_level: riskLevel,
            badge_color: badgeColor,
            recommended_intervention: `Deploy joint inspection taskforce for ${topCategory} in ${c.area}`
          };
        })
        .filter(h => h.total_complaints >= 2)
        .sort((a, b) => b.total_complaints - a.total_complaints);

      res.json({ hotspots, count: hotspots.length });
    } catch (err) {
      console.error('Hotspot detection error:', err);
      res.status(500).json({ error: 'Failed to compute civic hotspots' });
    }
  }

  /**
   * AI Executive Admin Summary Generator
   * Produces an automated high-level administrative briefing on civic health, SLA bottlenecks, and action items
   */
  async getAIExecutiveSummary(req, res) {
    try {
      const complaints = db.prepare('SELECT * FROM complaints').all();
      const feedback = db.prepare('SELECT * FROM feedback').all();
      const departments = db.prepare('SELECT * FROM departments').all();

      const total = complaints.length;
      const active = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length;
      const resolved = complaints.filter(c => c.status === 'Resolved').length;
      const critical = complaints.filter(c => c.priority === 'CRITICAL' && c.status !== 'Resolved').length;
      const escalated = complaints.filter(c => c.is_escalated === 1).length;

      // Category breakdown
      const catCount = {};
      complaints.forEach(c => { catCount[c.category] = (catCount[c.category] || 0) + 1; });
      const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

      // Ward breakdown
      const wardCount = {};
      complaints.forEach(c => { if (c.ward) wardCount[c.ward] = (wardCount[c.ward] || 0) + 1; });
      const topWards = Object.entries(wardCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

      // Resolution Rate
      const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      const avgRating = feedback.length > 0
        ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
        : '4.4';

      const timestamp = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const briefing = {
        generated_at: timestamp,
        metrics: {
          total_complaints: total,
          active_pipeline: active,
          resolved_count: resolved,
          resolution_rate: `${resRate}%`,
          unresolved_critical_emergencies: critical,
          sla_breach_escalations: escalated,
          citizen_satisfaction: `${avgRating} / 5.0`
        },
        key_findings: [
          `Active pipeline holds ${active} pending complaints across West Bengal civic bodies.`,
          `${topCats.map(([cat, count]) => `${cat} (${count} cases)`).join(', ')} constitute the primary civic demand volume.`,
          `${critical} critical priority issues remain under active emergency SLA clock.`,
          `Geographic complaint clusters are currently concentrated in: ${topWards.map(([w, c]) => `${w} (${c})`).join(', ') || 'Metropolitan Urban Local Bodies'}.`
        ],
        strategic_recommendations: [
          `Mobilize specialized rapid-response teams to ${topWards[0] ? topWards[0][0] : 'priority wards'} to address recurring ${topCats[0] ? topCats[0][0] : 'civic'} backlog.`,
          escalated > 0 ? `Enforce immediate Departmental Review for the ${escalated} SLA-breached tasks.` : 'SLA turnaround remains within acceptable municipal compliance thresholds.',
          'Review citizen upvote trends to prioritize high-impact community complaints over isolated issues.'
        ],
        summary_markdown: `### 🏛️ CivicPulse AI — Executive Administration Briefing\n**Report Generated:** ${timestamp}\n\n#### 📊 Executive Overview\n- **Total Submissions:** ${total} | **Resolved:** ${resolved} (**${resRate}%** resolution rate)\n- **Active Workload:** ${active} pending | **Critical Urgent Hazards:** ${critical}\n- **SLA Escalations:** ${escalated} cases escalated to Senior Authority\n- **Citizen Satisfaction Rating:** ⭐ ${avgRating} / 5.0\n\n#### 🔍 Hotspot & Domain Insights\n1. **Primary Demand Sectors:** ${topCats.map(([cat, count]) => `**${cat}** (${count})`).join(', ')}\n2. **Vulnerable Zones:** Complaints are heavily indexed around ${topWards.map(([w, c]) => `*${w}* (${c})`).join(', ') || 'urban transit nodes'}.\n\n#### 🎯 Recommended Administrative Action\n1. Dispatch emergency taskforce units to mitigate active critical hazards within the 24-hour SLA window.\n2. Prioritize high-impact community complaints with multiple citizen endorsements.\n3. Conduct bi-weekly municipal coordination review with departments falling below 85% SLA compliance.`
      };

      res.json(briefing);
    } catch (err) {
      console.error('AI Summary error:', err);
      res.status(500).json({ error: 'Failed to generate AI executive summary' });
    }
  }
}

module.exports = new AnalyticsController();
