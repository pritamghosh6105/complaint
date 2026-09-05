const db = require('../models/db');

const DEPT_MAP = {
  'Police & Law Enforcement': 'Police & Law Enforcement',
  'Cyber Crime': 'Cyber Crime',
  'Women & Child Safety': 'Women & Child Safety',
  'Traffic & Road Safety': 'Traffic & Road Safety',
  'Roads & Public Works': 'Roads & Public Works',
  'Drainage & Sewerage': 'Drainage & Sewerage',
  'Water Supply': 'Water Supply',
  'Solid Waste Management': 'Solid Waste Management',
  'Street Lighting & Electrical': 'Street Lighting & Electrical',
  'Public Health & Sanitation': 'Public Health & Sanitation',
  'Fire & Emergency Services': 'Fire & Emergency Services',
  'Disaster Management': 'Disaster Management',
  'Environment & Pollution': 'Environment & Pollution',
  'Parks & Public Spaces': 'Parks & Public Spaces',
  'Building & Municipal Engineering': 'Building & Municipal Engineering',
  'Land & Land Records': 'Land & Land Records',
  'Housing & Urban Development': 'Housing & Urban Development',
  'Electricity & Power': 'Electricity & Power',
  'Public Transport': 'Public Transport',
  'Railway-related Public Complaints': 'Railway-related Public Complaints',
  'Health & Hospitals': 'Health & Hospitals',
  'Food & Public Distribution': 'Food & Public Distribution',
  'Consumer Affairs': 'Consumer Affairs',
  'Education - Schools': 'Education - Schools',
  'Education – Schools': 'Education - Schools',
  'Higher Education': 'Higher Education',
  'Labour & Employment': 'Labour & Employment',
  'Agriculture': 'Agriculture',
  'Animal Resources': 'Animal Resources',
  'Forest & Wildlife': 'Forest & Wildlife',
  'Public Grievance / General Administration': 'Public Grievance / General Administration',
  // Backward compatibility
  'Road Damage': 'Roads & Public Works',
  'Garbage & Waste': 'Solid Waste Management',
  'Streetlight': 'Street Lighting & Electrical',
  'Drainage & Sewage': 'Drainage & Sewerage',
  'Electricity': 'Electricity & Power',
  'Traffic & Signals': 'Traffic & Road Safety',
  'Public Parks': 'Parks & Public Spaces',
  'Healthcare': 'Health & Hospitals',
  'Sanitation': 'Public Health & Sanitation'
};

class AssignmentService {
  /**
   * Finds the appropriate department ID for a predicted category and location jurisdiction
   */
  getDepartmentForCategory(category, location = {}) {
    let deptName = DEPT_MAP[category] || category || 'Roads & Public Works';

    // Location-aware routing overrides:
    const isAdminRural = location.administrative_type === 'Rural' || Boolean(location.block);
    const isAdminUrban = location.administrative_type === 'Urban' || Boolean(location.municipality);

    // 1. Water supply routing
    if (category === 'Water Supply' || category === 'Water') {
      deptName = isAdminRural ? 'Public Health & Sanitation' : 'Water Supply';
    }

    // 2. Drainage & Sewage routing
    if (category === 'Drainage & Sewerage' || category === 'Drainage & Sewage') {
      deptName = isAdminUrban ? 'Drainage & Sewerage' : 'Public Health & Sanitation';
    }

    // 3. Roads routing
    if (category === 'Roads & Public Works' || category === 'Road Damage') {
      deptName = isAdminUrban ? 'Building & Municipal Engineering' : 'Roads & Public Works';
    }

    // 4. Crime & Law Enforcement routing
    if (['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(category)) {
      deptName = category;
    }

    const dept = db.prepare('SELECT id, name FROM departments WHERE name = ?').get(deptName);
    if (dept) return dept.id;

    // Fallback to standard mapping or first department
    const fallbackDept = db.prepare('SELECT id, name FROM departments WHERE name = ?').get(DEPT_MAP[category] || 'Roads & Public Works');
    if (fallbackDept) return fallbackDept.id;

    const firstDept = db.prepare('SELECT id, name FROM departments LIMIT 1').get();
    return firstDept ? firstDept.id : 1;
  }

  /**
   * Automatically picks the best available officer in that department & location jurisdiction
   */
  findBestOfficer(departmentId, location = {}) {
    if (!departmentId) return null;

    // 1. Get all officers assigned to this specific department
    const deptOfficers = db.prepare('SELECT * FROM users WHERE department_id = ?').all(departmentId);
    
    if (!deptOfficers || deptOfficers.length === 0) {
      // Fallback: check any officer with matching department
      const anyOfficers = db.prepare("SELECT * FROM users WHERE role = 'officer' AND department_id = ?").all(departmentId);
      if (anyOfficers && anyOfficers.length > 0) return anyOfficers[0].id;
      return null;
    }

    // 2. Fetch active complaints to count workload
    const activeComplaints = db.prepare("SELECT * FROM complaints WHERE status IN ('Assigned', 'In Progress')").all();

    const targetWard = (location.ward || '').toLowerCase().trim();
    const targetDistrict = (location.district || '').toLowerCase().trim();
    const targetMunicipality = (location.municipality || '').toLowerCase().trim();
    const targetBlock = (location.block || '').toLowerCase().trim();
    const targetGP = (location.gram_panchayat || '').toLowerCase().trim();
    const targetPS = (location.police_station || '').toLowerCase().trim();

    // 3. Calculate match score based on location jurisdiction
    const officersWithScore = deptOfficers.map(officer => {
      const activeCount = activeComplaints.filter(c => c.officer_id === officer.id).length;
      const offWard = (officer.ward || '').toLowerCase().trim();

      let locationScore = 0;
      if (offWard) {
        if (targetWard && offWard.includes(targetWard)) locationScore += 10;
        if (targetGP && offWard.includes(targetGP)) locationScore += 8;
        if (targetMunicipality && offWard.includes(targetMunicipality)) locationScore += 6;
        if (targetBlock && offWard.includes(targetBlock)) locationScore += 6;
        if (targetPS && offWard.includes(targetPS)) locationScore += 8;
        if (targetDistrict && offWard.includes(targetDistrict)) locationScore += 4;
      }

      return {
        id: officer.id,
        name: officer.name,
        activeCount,
        locationScore
      };
    });

    // Sort: highest location score first, then lowest active workload
    officersWithScore.sort((a, b) => {
      if (b.locationScore !== a.locationScore) return b.locationScore - a.locationScore;
      return a.activeCount - b.activeCount;
    });

    return officersWithScore[0]?.id || deptOfficers[0].id;
  }
}

module.exports = new AssignmentService();
