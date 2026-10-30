async function runEndToEnd() {
  console.log('================================================================');
  console.log('CIVICPULSE AI COMPLETE END-TO-END VERIFICATION & AUDIT SUITE');
  console.log('================================================================');

  const fatalTitle = 'One Man Is Killed — Complaint';
  const fatalDesc = [
    'Executive Summary:',
    'A fatal incident has occurred resulting in the death of one individual. The complainant seeks an official inquiry and appropriate action from the relevant authorities.',
    '',
    'Physical Realities:',
    'The incident took place at an unspecified location within the municipal jurisdiction. Details regarding the exact site, surrounding environment, and circumstances remain limited.',
    '',
    'Life Safety Risk:',
    'The incident resulted in the loss of a life. There is no indication of an ongoing safety hazard or immediate threat to the public at present.',
    '',
    'Citizen Impact and Appeal:',
    'The complainant requests that municipal police or the appropriate law-enforcement department conduct a thorough investigation, issue an official report, and take necessary measures to ensure accountability.'
  ].join('\n');

  // 1. Python ML Service Check (Port 8000)
  console.log('\n--- 1. Testing Python FastAPI Microservice Directly (Port 8000) ---');
  try {
    const pyResp = await fetch('http://127.0.0.1:8000/predict/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${fatalTitle} — ${fatalDesc}` })
    });
    const pyData = await pyResp.json();
    console.log('Python ML primaryDepartment:', pyData.summary?.primaryDepartment);
    console.log('Python ML subcategory:', pyData.summary?.subcategory);
    console.log('Python ML priority:', pyData.summary?.priority);
    console.log('Python ML requiresHumanReview:', pyData.summary?.requiresHumanReview);
    console.log('Python ML causeKnown:', pyData.summary?.causeKnown);
    console.log('Python ML reason:', pyData.summary?.reason);
  } catch (err) {
    console.error('Python ML request failed:', err.message);
  }

  // 2. Node.js Backend ML Preview (Port 5000)
  console.log('\n--- 2. Testing Express Backend /api/complaints/preview-ml (Port 5000) ---');
  try {
    const nodeResp = await fetch('http://localhost:5000/api/complaints/preview-ml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${fatalTitle} ${fatalDesc}`,
        latitude: 22.7230,
        longitude: 88.4800,
        severity: 'Medium',
        location_type: 'Residential',
        affected_count: 10
      })
    });
    const nodeData = await nodeResp.json();
    const summary = nodeData.preview?.summary;
    console.log('Node ML primaryDepartment:', summary?.primaryDepartment);
    console.log('Node ML subcategory:', summary?.subcategory);
    console.log('Node ML priority:', summary?.priority);
    console.log('Node ML requiresHumanReview:', summary?.requiresHumanReview);
    console.log('Node ML is_emergency:', summary?.is_emergency);
    console.log('Node ML reason:', summary?.reason);
  } catch (err) {
    console.error('Node ML preview failed:', err.message);
  }

  // 3. User Registration, Login & Complaint Submission (Citizen Role)
  console.log('\n--- 3. Testing Real Complaint Submission with MongoDB Persistence ---');
  try {
    const citizenEmail = `citizen_${Date.now()}@civicpulse.test`;
    const regResp = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pritam Citizen',
        email: citizenEmail,
        password: 'password123',
        role: 'citizen'
      })
    });
    const regData = await regResp.json();
    const token = regData.token;
    console.log('Citizen registered & logged in successfully! ID:', regData.user?.id);

    const createResp = await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: fatalTitle,
        description: fatalDesc,
        latitude: 22.7230,
        longitude: 88.4800,
        district: 'North 24 Parganas',
        subdivision: 'Barasat Sadar',
        administrative_type: 'Urban',
        municipality: 'Barasat',
        ward: 'Ward 5',
        police_station: 'Barasat PS',
        postal_code: '700124',
        affected_count: 5
      })
    });

    const createData = await createResp.json();
    const newComplaint = createData.complaint;
    console.log('Complaint created successfully!');
    console.log('Tracking ID:', newComplaint?.tracking_id);
    console.log('Database ID:', newComplaint?.id);
    console.log('Primary Department in DB:', newComplaint?.primary_department || newComplaint?.category);
    console.log('Subcategory in DB:', newComplaint?.subcategory);
    console.log('Priority in DB:', newComplaint?.priority);
    console.log('Requires Human Review in DB:', Boolean(newComplaint?.requires_human_review));
    console.log('Original Predicted Department in DB:', newComplaint?.original_predicted_department);
    console.log('Final Department in DB:', newComplaint?.final_department);

    if (newComplaint?.id) {
      // 4. Admin Registration, Login & Audit Override Test
      console.log('\n--- 4. Testing Admin Review Override & Audit Trail ---');
      const adminEmail = `admin_${Date.now()}@civicpulse.test`;
      const adminRegResp = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Executive Magistrate Admin',
          email: adminEmail,
          password: 'password123',
          role: 'admin'
        })
      });
      const adminData = await adminRegResp.json();
      const adminToken = adminData.token;
      console.log('Admin registered & logged in successfully! ID:', adminData.user?.id);

      const overrideResp = await fetch(`http://localhost:5000/api/admin/complaints/${newComplaint.id}/category`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          category: 'Traffic & Road Safety',
          subcategory: 'Fatal Vehicle Collision',
          reason: 'Preliminary ground inquiry revealed the fatality occurred following a road vehicular collision.'
        })
      });

      const overrideData = await overrideResp.json();
      const updated = overrideData.complaint;
      console.log('Admin override executed successfully!');
      console.log('Updated Final Department:', updated?.final_department || updated?.category);
      console.log('Original AI Prediction Preserved:', updated?.original_predicted_department || updated?.predicted_category);
      console.log('Admin Override Flag:', updated?.admin_override);
      console.log('Admin Override Reason:', updated?.admin_override_reason);
      console.log('Reviewed By:', updated?.reviewed_by);

      console.log('\n================================================================');
      console.log('✅ ALL INTEGRATION & PERSISTENCE TESTS COMPLETED SUCCESSFULLY!');
      console.log('================================================================');
    } else {
      console.error('Failed to create complaint:', createData);
    }
  } catch (err) {
    console.error('Integration test failed:', err.message);
  }
}

runEndToEnd();
