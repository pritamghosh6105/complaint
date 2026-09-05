const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'database.json');
const LOCATION_DATA_DIR = path.resolve(__dirname, '../../../location-data');

class RelationalStorage {
  constructor() {
    this.data = {
      departments: [],
      users: [],
      complaints: [],
      complaint_timeline: [],
      feedback: [],
      notifications: [],
      districts: [],
      subdivisions: [],
      ulbs: [],
      wards: [],
      blocks: [],
      gram_panchayats: [],
      villages_mouzas: [],
      police_stations: [],
      postcodes: [],
      _counters: {
        departments: 1,
        users: 1,
        complaints: 1,
        complaint_timeline: 1,
        feedback: 1,
        notifications: 1,
        districts: 1,
        subdivisions: 1,
        ulbs: 1,
        wards: 1,
        blocks: 1,
        gram_panchayats: 1,
        villages_mouzas: 1,
        police_stations: 1
      }
    };
    this.load();
  }

  seedLocationData() {
    try {
      if (!fs.existsSync(LOCATION_DATA_DIR)) return;

      const readJson = (filename) => {
        const fp = path.join(LOCATION_DATA_DIR, filename);
        if (fs.existsSync(fp)) {
          return JSON.parse(fs.readFileSync(fp, 'utf-8'));
        }
        return [];
      };

      console.log('\x1b[36m%s\x1b[0m', '📍 [Location Registry] Loading official West Bengal administrative data...');

      this.data.districts = readJson('districts.json');
      this.data.subdivisions = readJson('subdivisions.json');
      this.data.ulbs = readJson('urban_local_bodies.json');
      this.data.wards = readJson('wards.json');
      this.data.blocks = readJson('blocks.json');
      this.data.gram_panchayats = readJson('gram_panchayats.json');
      this.data.villages_mouzas = readJson('villages_mouzas.json');
      this.data.police_stations = readJson('police_stations.json');
      this.data.postcodes = readJson('postcodes.json');

      this.data._counters.districts = (Math.max(...this.data.districts.map(d => d.id || 0), 0) || 23) + 1;
      this.data._counters.subdivisions = (Math.max(...this.data.subdivisions.map(s => s.id || 0), 0) || 65) + 1;
      this.data._counters.ulbs = (Math.max(...this.data.ulbs.map(u => u.id || 0), 0) || 54) + 1;
      this.data._counters.wards = (Math.max(...this.data.wards.map(w => w.id || 0), 0) || 1650) + 1;
      this.data._counters.blocks = (Math.max(...this.data.blocks.map(b => b.id || 0), 0) || 56) + 1;
      this.data._counters.gram_panchayats = (Math.max(...this.data.gram_panchayats.map(g => g.id || 0), 0) || 54) + 1;
      this.data._counters.villages_mouzas = (Math.max(...this.data.villages_mouzas.map(v => v.id || 0), 0) || 33) + 1;
      this.data._counters.police_stations = (Math.max(...this.data.police_stations.map(p => p.id || 0), 0) || 62) + 1;

      this.save();
      console.log('\x1b[32m%s\x1b[0m', `✓ [Location Registry] Successfully initialized 23 Districts, ${this.data.ulbs.length} ULBs (${this.data.wards.length} Wards), ${this.data.blocks.length} CD Blocks (${this.data.gram_panchayats.length} GPs), and ${this.data.police_stations.length} Police Stations.`);
    } catch (err) {
      console.error('Error seeding location data:', err.message);
    }
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } catch (e) {
        console.error('Error loading database file, initializing fresh:', e);
      }
    }

    if (!this.data.districts || this.data.districts.length < 23) {
      this.seedLocationData();
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  // Helper SQL-like statement prepare
  prepare(query) {
    const trimmed = query.trim();
    const self = this;

    return {
      all(...params) {
        return self._executeSelect(trimmed, params);
      },
      get(...params) {
        const res = self._executeSelect(trimmed, params);
        return res.length > 0 ? res[0] : null;
      },
      run(...params) {
        return self._executeMutation(trimmed, params);
      }
    };
  }

  exec(sql) {
    return true;
  }

  pragma(p) {
    return true;
  }

  _executeSelect(query, params) {
    this.load();
    const qLower = query.toLowerCase();

    // 1. Departments Select
    if (qLower.includes('from departments')) {
      let list = [...this.data.departments];
      if (qLower.includes('where name = ?')) {
        const nameVal = params[0];
        list = list.filter(d => d.name === nameVal);
      } else if (qLower.includes('where id = ?')) {
        const idVal = Number(params[0]);
        list = list.filter(d => d.id === idVal);
      }
      return list;
    }

    // 2. Users Select
    if (qLower.includes('from users')) {
      let list = this.data.users.map(u => {
        const dept = this.data.departments.find(d => d.id === u.department_id);
        return { ...u, department_name: dept ? dept.name : null };
      });

      if (qLower.includes('where email = ?') || qLower.includes('where u.email = ?')) {
        const email = String(params[0]).toLowerCase().trim();
        list = list.filter(u => u.email.toLowerCase() === email);
      } else if (qLower.includes('where id = ?') || qLower.includes('where u.id = ?')) {
        const idVal = Number(params[0]);
        list = list.filter(u => u.id === idVal);
      } else if (qLower.includes('where department_id = ?') || qLower.includes('u.department_id = ?') || qLower.includes('where u.department_id = ?')) {
        const deptId = Number(params[0]);
        list = list.filter(u => u.department_id === deptId);
      } else if (qLower.includes("role = 'officer'") || qLower.includes("u.role in ('officer'")) {
        list = list.filter(u => u.role === 'officer' || u.role?.includes('officer'));
        if (params.length >= 1) {
          const deptId = Number(params[0]);
          list = list.filter(u => u.department_id === deptId);
        }
      }
      return list;
    }

    // 3. Notifications Select
    if (qLower.includes('from notifications')) {
      let list = [...this.data.notifications];
      if (qLower.includes('where user_id = ?')) {
        const uid = Number(params[0]);
        list = list.filter(n => n.user_id === uid);
      }
      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 4. Feedback Select
    if (qLower.includes('from feedback')) {
      let list = [...this.data.feedback];
      if (qLower.includes('where complaint_id = ?')) {
        const cid = Number(params[0]);
        list = list.filter(f => f.complaint_id === cid);
      }
      return list;
    }

    // 5. Timeline Select
    if (qLower.includes('from complaint_timeline')) {
      let list = [...this.data.complaint_timeline];
      if (qLower.includes('where complaint_id = ?')) {
        const cid = Number(params[0]);
        list = list.filter(t => t.complaint_id === cid);
      }
      return list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // 6. Complaints Select
    if (qLower.includes('from complaints')) {
      let list = this.data.complaints.map(c => {
        const dept = this.data.departments.find(d => d.id === c.department_id);
        const citizen = this.data.users.find(u => u.id === c.citizen_id);
        const officer = this.data.users.find(u => u.id === c.officer_id);
        const fb = this.data.feedback.find(f => f.complaint_id === c.id);
        return {
          ...c,
          department_name: dept ? dept.name : null,
          citizen_name: citizen ? citizen.name : 'Anonymous Citizen',
          citizen_phone: citizen ? citizen.phone : '',
          citizen_email: citizen ? citizen.email : '',
          officer_name: officer ? officer.name : 'Unassigned',
          feedback: fb || null
        };
      });

      // Filter: ID or tracking ID
      if (qLower.includes('where c.id = ?') || qLower.includes('where id = ?')) {
        const val = params[0];
        list = list.filter(c => c.id === Number(val) || c.tracking_id === String(val));
      } else if (qLower.includes('where tracking_id = ?')) {
        list = list.filter(c => c.tracking_id === String(params[0]));
      } else if (qLower.includes('where c.citizen_id = ?') || qLower.includes('where citizen_id = ?')) {
        const cid = Number(params[0]);
        list = list.filter(c => c.citizen_id === cid);
      } else if (qLower.includes('where c.officer_id = ?') || qLower.includes('where officer_id = ?')) {
        const oid = Number(params[0]);
        list = list.filter(c => c.officer_id === oid);
      } else if (qLower.includes('where status in')) {
        if (params.length > 0) {
          list = list.filter(c => params.includes(c.status));
        }
      } else if (qLower.includes('where status not in')) {
        if (params.length > 0) {
          list = list.filter(c => !params.includes(c.status));
        }
      }

      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 7. Location: Districts Select
    if (qLower.includes('from districts')) {
      let list = [...(this.data.districts || [])];
      if (qLower.includes('where id = ?')) {
        list = list.filter(d => d.id === Number(params[0]));
      } else if (qLower.includes('where code = ?')) {
        list = list.filter(d => d.code === String(params[0]));
      } else if (qLower.includes('where name = ?')) {
        list = list.filter(d => d.name.toLowerCase() === String(params[0]).toLowerCase());
      }
      return list;
    }

    // 8. Location: Subdivisions Select
    if (qLower.includes('from subdivisions')) {
      let list = [...(this.data.subdivisions || [])];
      if (qLower.includes('where district_id = ?')) {
        list = list.filter(s => s.district_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(s => s.id === Number(params[0]));
      }
      return list;
    }

    // 9. Location: ULBs Select
    if (qLower.includes('from ulbs')) {
      let list = [...(this.data.ulbs || [])];
      if (qLower.includes('where district_id = ?')) {
        list = list.filter(u => u.district_id === Number(params[0]));
      } else if (qLower.includes('where subdivision_id = ?')) {
        list = list.filter(u => u.subdivision_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(u => u.id === Number(params[0]));
      }
      return list;
    }

    // 10. Location: Wards Select
    if (qLower.includes('from wards')) {
      let list = [...(this.data.wards || [])];
      if (qLower.includes('where ulb_id = ?')) {
        list = list.filter(w => w.ulb_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(w => w.id === Number(params[0]));
      }
      return list;
    }

    // 11. Location: Blocks Select
    if (qLower.includes('from blocks')) {
      let list = [...(this.data.blocks || [])];
      if (qLower.includes('where district_id = ?')) {
        list = list.filter(b => b.district_id === Number(params[0]));
      } else if (qLower.includes('where subdivision_id = ?')) {
        list = list.filter(b => b.subdivision_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(b => b.id === Number(params[0]));
      }
      return list;
    }

    // 12. Location: Gram Panchayats Select
    if (qLower.includes('from gram_panchayats')) {
      let list = [...(this.data.gram_panchayats || [])];
      if (qLower.includes('where block_id = ?')) {
        list = list.filter(g => g.block_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(g => g.id === Number(params[0]));
      }
      return list;
    }

    // 13. Location: Villages/Mouzas Select
    if (qLower.includes('from villages_mouzas')) {
      let list = [...(this.data.villages_mouzas || [])];
      if (qLower.includes('where gram_panchayat_id = ?')) {
        list = list.filter(v => v.gram_panchayat_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(v => v.id === Number(params[0]));
      }
      return list;
    }

    // 14. Location: Police Stations Select
    if (qLower.includes('from police_stations')) {
      let list = [...(this.data.police_stations || [])];
      if (qLower.includes('where district_id = ?')) {
        list = list.filter(p => p.district_id === Number(params[0]));
      } else if (qLower.includes('where subdivision_id = ?')) {
        list = list.filter(p => p.subdivision_id === Number(params[0]));
      } else if (qLower.includes('where id = ?')) {
        list = list.filter(p => p.id === Number(params[0]));
      }
      return list;
    }

    // 15. Location: Postcodes Select
    if (qLower.includes('from postcodes')) {
      let list = [...(this.data.postcodes || [])];
      if (qLower.includes('where pincode = ?')) {
        list = list.filter(p => String(p.pincode) === String(params[0]));
      }
      return list;
    }

    return [];
  }

  insertComplaint(cData) {
    this.load();
    const id = this.data._counters.complaints++;
    const now = new Date().toISOString();
    const trackingId = cData.tracking_id || `CMP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const complaint = {
      id,
      tracking_id: trackingId,
      citizen_id: Number(cData.citizen_id),
      title: cData.title || `${cData.category} Issue`,
      description: cData.description || '',
      category: cData.category,
      subcategory: cData.subcategory || null,
      priority: cData.priority || 'MEDIUM',
      status: cData.status || (cData.officer_id ? 'Assigned' : 'Verified'),
      department_id: cData.department_id ? Number(cData.department_id) : null,
      officer_id: cData.officer_id ? Number(cData.officer_id) : null,
      latitude: Number(cData.latitude || 22.7230),
      longitude: Number(cData.longitude || 88.4800),
      address: cData.address || '',
      state: cData.state || 'West Bengal',
      district_id: cData.district_id ? Number(cData.district_id) : null,
      district: cData.district || 'North 24 Parganas',
      subdivision_id: cData.subdivision_id ? Number(cData.subdivision_id) : null,
      subdivision: cData.subdivision || '',
      administrative_type: cData.administrative_type || 'Urban',
      ulb_id: cData.ulb_id ? Number(cData.ulb_id) : null,
      ulb_type: cData.ulb_type || null,
      municipality: cData.municipality || '',
      ward_id: cData.ward_id ? Number(cData.ward_id) : null,
      ward: cData.ward || '',
      block_id: cData.block_id ? Number(cData.block_id) : null,
      block: cData.block || '',
      gram_panchayat_id: cData.gram_panchayat_id ? Number(cData.gram_panchayat_id) : null,
      gram_panchayat: cData.gram_panchayat || '',
      village_id: cData.village_id ? Number(cData.village_id) : null,
      village: cData.village || '',
      mouza: cData.mouza || '',
      police_station_id: cData.police_station_id ? Number(cData.police_station_id) : null,
      police_station: cData.police_station || '',
      locality: cData.locality || '',
      landmark: cData.landmark || '',
      postal_code: cData.postal_code || '',
      location_type: cData.location_type || 'Residential',
      affected_count: Number(cData.affected_count || 10),
      image_url: cData.image_url || null,
      resolution_image_url: null,
      resolution_notes: null,
      is_duplicate: Number(cData.is_duplicate || 0),
      duplicate_of_id: cData.duplicate_of_id ? Number(cData.duplicate_of_id) : null,
      duplicate_similarity: Number(cData.duplicate_similarity || 0),
      ml_confidence: Number(cData.ml_confidence || 0.95),
      ml_predicted_category: cData.ml_predicted_category || cData.category,
      ml_predicted_priority: cData.ml_predicted_priority || cData.priority || 'MEDIUM',
      predicted_category: cData.predicted_category || cData.category,
      predicted_subcategory: cData.predicted_subcategory || cData.subcategory || null,
      is_emergency: Number(cData.is_emergency || 0),
      is_crime: Number(cData.is_crime || 0),
      is_sensitive: Number(cData.is_sensitive || 0),
      predicted_resolution_days: Number(cData.predicted_resolution_days || 3.0),
      sla_deadline: cData.sla_deadline || null,
      is_escalated: 0,
      escalation_level: 0,
      impact_score: Number(cData.impact_score || 50),
      impact_label: cData.impact_label || 'Moderate Public Impact',
      root_causes: cData.root_causes || [],
      recommended_actions: cData.recommended_actions || [],
      image_verification_report: cData.image_verification_report || null,
      upvote_count: Number(cData.upvote_count || 0),
      upvoter_ids: cData.upvoter_ids || [],
      reopen_count: Number(cData.reopen_count || 0),
      reopen_reason: cData.reopen_reason || null,
      detected_language: cData.detected_language || 'en',
      created_at: now,
      updated_at: now,
      resolved_at: null
    };

    this.data.complaints.push(complaint);
    this.save();
    this.pushToMongo('Complaint', { id }, complaint);
    return { lastInsertRowid: id, id, tracking_id: trackingId };
  }

  _executeMutation(query, params) {
    const qLower = query.toLowerCase();
    const now = new Date().toISOString();

    // 1. INSERT users
    if (qLower.startsWith('insert into users')) {
      const id = this.data._counters.users++;
      const [name, email, password_hash, role, phone, ward, dept_id] = params;
      const user = {
        id,
        name,
        email,
        password_hash,
        role: role || 'citizen',
        phone: phone || '',
        ward: ward || 'Ward 1',
        department_id: dept_id || null,
        created_at: now
      };
      this.data.users.push(user);
      this.save();
      this.pushToMongo('User', { id }, user);
      return { lastInsertRowid: id, changes: 1 };
    }

    // 2. INSERT departments
    if (qLower.startsWith('insert into departments')) {
      const id = this.data._counters.departments++;
      const [name, code, head_name, contact_email, description] = params;
      const dept = {
        id,
        name,
        code,
        head_name: head_name || '',
        contact_email: contact_email || '',
        description: description || '',
        created_at: now
      };
      this.data.departments.push(dept);
      this.save();
      this.pushToMongo('Department', { id }, dept);
      return { lastInsertRowid: id, changes: 1 };
    }

    // 3. INSERT complaints
    if (qLower.startsWith('insert into complaints')) {
      const id = this.data._counters.complaints++;
      const hasSubcat = qLower.includes('subcategory');

      let complaint;
      if (hasSubcat) {
        complaint = {
          id,
          tracking_id: params[0],
          citizen_id: Number(params[1]),
          title: params[2],
          description: params[3],
          category: params[4],
          subcategory: params[5] || null,
          priority: params[6] || 'MEDIUM',
          status: params[7] || 'Submitted',
          department_id: params[8] ? Number(params[8]) : null,
          officer_id: params[9] ? Number(params[9]) : null,
          latitude: Number(params[10] || 0),
          longitude: Number(params[11] || 0),
          address: params[12] || '',
          ward: params[13] || 'Ward 1',
          location_type: params[14] || 'Residential',
          affected_count: Number(params[15] || 10),
          image_url: params[16] || null,
          resolution_image_url: null,
          resolution_notes: null,
          is_duplicate: Number(params[17] || 0),
          duplicate_of_id: params[18] ? Number(params[18]) : null,
          duplicate_similarity: Number(params[19] || 0),
          ml_confidence: Number(params[20] || 0.95),
          ml_predicted_category: params[21] || params[4],
          ml_predicted_priority: params[22] || params[6] || 'MEDIUM',
          predicted_category: params[23] || params[4],
          predicted_subcategory: params[24] || params[5] || null,
          is_emergency: Number(params[25] || 0),
          is_crime: Number(params[26] || 0),
          is_sensitive: Number(params[27] || 0),
          predicted_resolution_days: Number(params[28] || 3.0),
          sla_deadline: params[29] || null,
          is_escalated: 0,
          escalation_level: 0,
          created_at: now,
          updated_at: now,
          resolved_at: null
        };
      } else {
        complaint = {
          id,
          tracking_id: params[0],
          citizen_id: Number(params[1]),
          title: params[2],
          description: params[3],
          category: params[4],
          subcategory: null,
          priority: params[5],
          status: params[6] || 'Submitted',
          department_id: params[7] ? Number(params[7]) : null,
          officer_id: params[8] ? Number(params[8]) : null,
          latitude: Number(params[9] || 0),
          longitude: Number(params[10] || 0),
          address: params[11] || '',
          ward: params[12] || 'Ward 1',
          location_type: params[13] || 'Residential',
          affected_count: Number(params[14] || 10),
          image_url: params[15] || null,
          resolution_image_url: null,
          resolution_notes: null,
          is_duplicate: Number(params[16] || 0),
          duplicate_of_id: params[17] ? Number(params[17]) : null,
          duplicate_similarity: Number(params[18] || 0),
          ml_confidence: Number(params[19] || 0),
          ml_predicted_category: params[20] || params[4],
          ml_predicted_priority: params[21] || params[5],
          predicted_resolution_days: Number(params[22] || 3.0),
          sla_deadline: params[23] || null,
          is_escalated: 0,
          escalation_level: 0,
          created_at: now,
          updated_at: now,
          resolved_at: null
        };
      }

      this.data.complaints.push(complaint);
      this.save();
      this.pushToMongo('Complaint', { id }, complaint);
      return { lastInsertRowid: id, changes: 1 };
    }

    // 4. INSERT complaint_timeline
    if (qLower.startsWith('insert into complaint_timeline')) {
      const id = this.data._counters.complaint_timeline++;
      const [cid, status, notes, updated_by_name, uid] = params;
      const item = {
        id,
        complaint_id: Number(cid),
        status,
        notes: notes || '',
        updated_by_name: updated_by_name || 'System',
        updated_by_user_id: uid ? Number(uid) : null,
        timestamp: now
      };
      this.data.complaint_timeline.push(item);
      this.save();
      this.pushToMongo('ComplaintTimeline', { id }, item);
      return { lastInsertRowid: id, changes: 1 };
    }

    // 5. INSERT feedback
    if (qLower.startsWith('insert into feedback')) {
      const id = this.data._counters.feedback++;
      const [cid, uid, rating, comment] = params;
      const fb = {
        id,
        complaint_id: Number(cid),
        citizen_id: Number(uid),
        rating: Number(rating),
        comment: comment || '',
        created_at: now
      };
      this.data.feedback.push(fb);
      this.save();
      this.pushToMongo('Feedback', { id }, fb);
      return { lastInsertRowid: id, changes: 1 };
    }

    // 6. INSERT notifications
    if (qLower.startsWith('insert into notifications')) {
      const id = this.data._counters.notifications++;
      const [uid, title, message, link] = params;
      const notif = {
        id,
        user_id: Number(uid),
        title,
        message,
        link: link || null,
        is_read: 0,
        created_at: now
      };
      this.data.notifications.push(notif);
      this.save();
      this.pushToMongo('Notification', { id }, notif);
      return { lastInsertRowid: id, changes: 1 };
    }

    // 7. UPDATE complaints
    if (qLower.startsWith('update complaints')) {
      let targetId = null;
      if (qLower.includes('where id = ?')) {
        targetId = Number(params[params.length - 1]);
      }
      const c = this.data.complaints.find(comp => comp.id === targetId);
      if (c) {
        if (qLower.includes('set status = ?')) {
          c.status = params[0];
          c.updated_at = now;
          if (params[0] === 'Resolved') {
            c.resolved_at = now;
          }
        }
        if (qLower.includes('officer_id = ?')) {
          const offId = params.find((p, idx) => qLower.includes('officer_id = ?') && idx === 0);
          c.officer_id = offId ? Number(offId) : c.officer_id;
        }
        if (qLower.includes('resolution_notes = ?') || qLower.includes('resolution_image_url = ?')) {
          c.status = 'Resolved';
          c.resolution_notes = params[0];
          c.resolution_image_url = params[1] || null;
          c.resolved_at = now;
          c.updated_at = now;
        }
        if (qLower.includes('is_escalated = ?')) {
          c.is_escalated = Number(params[0]);
          c.escalation_level = Number(params[1]);
          c.escalated_to = params[2];
          c.updated_at = now;
        }
        if (qLower.includes('department_id = ?')) {
          c.department_id = Number(params[0]);
          c.officer_id = null;
          c.updated_at = now;
        }
        this.save();
        this.pushToMongo('Complaint', { id: c.id }, c);
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // 8. UPDATE notifications
    if (qLower.startsWith('update notifications')) {
      if (qLower.includes('set is_read = 1 where user_id = ?')) {
        const uid = Number(params[0]);
        this.data.notifications.forEach(n => {
          if (n.user_id === uid) n.is_read = 1;
        });
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // 9. DELETE complaints
    if (qLower.startsWith('delete from complaints')) {
      const id = Number(params[0]);
      this.data.complaints = this.data.complaints.filter(c => c.id !== id);
      this.save();
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  // Synchronize memory with MongoDB Atlas when connected
  async syncFromMongo() {
    try {
      const mongoModels = require('./mongo');
      const deptCount = await mongoModels.Department.countDocuments();
      
      if (deptCount > 0) {
        console.log('\x1b[36m%s\x1b[0m', '⚡ [MongoDB Atlas] Syncing collections from Cloud to memory...');
        const [depts, users, complaints, timeline, feedback, notifs] = await Promise.all([
          mongoModels.Department.find().lean(),
          mongoModels.User.find().lean(),
          mongoModels.Complaint.find().lean(),
          mongoModels.ComplaintTimeline.find().lean(),
          mongoModels.Feedback.find().lean(),
          mongoModels.Notification.find().lean()
        ]);

        if (depts.length) this.data.departments = depts.map(d => ({ ...d, id: d.id || d._id }));
        if (users.length) this.data.users = users.map(u => ({ ...u, id: u.id || u._id }));
        if (complaints.length) this.data.complaints = complaints.map(c => ({ ...c, id: c.id || c._id }));
        if (timeline.length) this.data.complaint_timeline = timeline.map(t => ({ ...t, id: t.id || t._id }));
        if (feedback.length) this.data.feedback = feedback.map(f => ({ ...f, id: f.id || f._id }));
        if (notifs.length) this.data.notifications = notifs.map(n => ({ ...n, id: n.id || n._id }));

        // Update counter sequences
        this.data._counters.departments = Math.max(...this.data.departments.map(d => d.id || 0), 0) + 1;
        this.data._counters.users = Math.max(...this.data.users.map(u => u.id || 0), 0) + 1;
        this.data._counters.complaints = Math.max(...this.data.complaints.map(c => c.id || 0), 0) + 1;
        this.data._counters.complaint_timeline = Math.max(...this.data.complaint_timeline.map(t => t.id || 0), 0) + 1;
        this.data._counters.feedback = Math.max(...this.data.feedback.map(f => f.id || 0), 0) + 1;
        this.data._counters.notifications = Math.max(...this.data.notifications.map(n => n.id || 0), 0) + 1;

        this.save();
        console.log('\x1b[32m%s\x1b[0m', `✓ [MongoDB Atlas] Synced ${complaints.length} complaints, ${users.length} users, ${depts.length} departments.`);
      } else {
        console.log('\x1b[36m%s\x1b[0m', '⚡ [MongoDB Atlas] Empty cluster detected. Uploading seed data to Atlas...');
        await this.syncAllToMongo();
        console.log('\x1b[32m%s\x1b[0m', '✓ [MongoDB Atlas] Initial seed uploaded to Atlas successfully.');
      }
    } catch (err) {
      console.error('MongoDB sync error:', err.message);
    }
  }

  async syncAllToMongo() {
    try {
      const mongoModels = require('./mongo');
      for (const d of this.data.departments) {
        await mongoModels.Department.updateOne({ id: d.id }, { $set: d }, { upsert: true });
      }
      for (const u of this.data.users) {
        await mongoModels.User.updateOne({ id: u.id }, { $set: u }, { upsert: true });
      }
      for (const c of this.data.complaints) {
        const doc = {
          ...c,
          location: {
            type: 'Point',
            coordinates: [c.longitude || 88.4800, c.latitude || 22.7230]
          }
        };
        await mongoModels.Complaint.updateOne({ id: c.id }, { $set: doc }, { upsert: true });
      }
      for (const t of this.data.complaint_timeline) {
        await mongoModels.ComplaintTimeline.updateOne({ id: t.id }, { $set: t }, { upsert: true });
      }
      for (const f of this.data.feedback) {
        await mongoModels.Feedback.updateOne({ id: f.id }, { $set: f }, { upsert: true });
      }
      for (const n of this.data.notifications) {
        await mongoModels.Notification.updateOne({ id: n.id }, { $set: n }, { upsert: true });
      }
    } catch (err) {
      console.error('Upload to Atlas error:', err.message);
    }
  }

  pushToMongo(modelName, filter, data) {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) return;
    try {
      const mongoModels = require('./mongo');
      const Model = mongoModels[modelName];
      if (Model) {
        Model.updateOne(filter, { $set: data }, { upsert: true }).catch(err => {
          console.error(`Atlas async write error on ${modelName}:`, err.message);
        });
      }
    } catch (e) {
      // silent catch
    }
  }
}

const db = new RelationalStorage();
db.mongoModels = require('./mongo');
module.exports = db;
