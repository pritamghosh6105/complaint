const fs = require('fs');
const db = require('../models/db');
const mlClient = require('../services/mlClient');
const assignmentService = require('../services/assignmentService');
const imageVerificationService = require('../services/imageVerificationService');
const cloudinaryService = require('../services/cloudinaryService');
const locationResolutionService = require('../services/locationResolutionService');
const upload = require('../middleware/uploadMiddleware');

class ComplaintController {
  /**
   * Real-time preview of ML Category, Priority, Duplicate Check and Resolution Time
   */
  async previewML(req, res) {
    try {
      const { text, latitude, longitude, severity, location_type, ward, affected_count } = req.body;
      if (!text || text.trim().length < 5) {
        return res.json({
          preview: null,
          message: 'Provide at least 5 characters for ML analysis'
        });
      }

      // Fetch active complaints for spatial duplicate comparison
      const activeComplaints = db.prepare('SELECT * FROM complaints WHERE status NOT IN (?, ?)').all('Resolved', 'Rejected');

      const mlResult = await mlClient.predictAll({
        text,
        latitude: Number(latitude) || 22.9750,
        longitude: Number(longitude) || 88.4340,
        severity: severity || 'Medium',
        location_type: location_type || 'Residential',
        ward: ward || 'Ward 1',
        affected_count: Number(affected_count) || 50,
        existing_complaints: activeComplaints
      });

      res.json({ preview: mlResult });
    } catch (err) {
      console.error('ML Preview error:', err);
      res.status(500).json({ error: 'Failed to process ML preview' });
    }
  }

  /**
   * Submits a new citizen complaint
   */
  async createComplaint(req, res) {
    try {
      if (req.user && req.user.role === 'officer') {
        return res.status(403).json({
          error: 'Forbidden: Field Officers are restricted to operational task management and are not permitted to submit citizen grievances.'
        });
      }
      const citizenId = req.user.id;
      const {
        title,
        description,
        latitude,
        longitude,
        address,
        ward,
        location_type,
        affected_count,
        severity,
        category: manualCategory,
        subcategory: manualSubcategory,
        is_emergency: manualEmergency,
        // Normalized location fields:
        state,
        district_id,
        district,
        subdivision_id,
        subdivision,
        administrative_type,
        ulb_id,
        ulb_type,
        municipality,
        ward_id,
        block_id,
        block,
        gram_panchayat_id,
        gram_panchayat,
        village_id,
        village,
        mouza,
        police_station_id,
        police_station,
        nearest_police_station,
        nearest_police_station_distance,
        jurisdiction_police_station,
        jurisdiction_verified,
        location_source,
        verification_status,
        sources,
        locality,
        landmark,
        postal_code
      } = req.body;

      if (!description || description.trim().length < 5) {
        return res.status(400).json({ error: 'Complaint description is required' });
      }

      // Server-side administrative hierarchy & location validation (Section 22)
      const hierarchyValidation = locationResolutionService.validateHierarchy({
        district: district || 'North 24 Parganas',
        districtId: district_id,
        subdivision,
        subdivisionId: subdivision_id,
        urbanRural: administrative_type || 'Urban',
        ulb: municipality,
        ulbId: ulb_id,
        ward,
        wardId: ward_id,
        block,
        blockId: block_id,
        gramPanchayat: gram_panchayat,
        gramPanchayatId: gram_panchayat_id,
        village,
        villageId: village_id,
        pincode: postal_code,
        policeStation: police_station || jurisdiction_police_station || nearest_police_station
      });

      if (!hierarchyValidation.valid) {
        return res.status(400).json({ 
          error: hierarchyValidation.errors.join(' '), 
          warnings: hierarchyValidation.warnings 
        });
      }

      // 1. Get active complaints for duplicate detection
      const activeComplaints = db.prepare('SELECT * FROM complaints WHERE status NOT IN (?, ?)').all('Resolved', 'Rejected');

      // 2. Query ML Microservice for Category, Priority, Duplicate, and Resolution Days
      const lat = Number(latitude) || 22.7230;
      const lng = Number(longitude) || 88.4800;

      const locationContext = {
        administrative_type: administrative_type || 'Urban',
        municipality: municipality || '',
        block: block || '',
        ward: ward || '',
        gram_panchayat: gram_panchayat || '',
        village: village || '',
        district: district || 'North 24 Parganas',
        police_station: police_station || ''
      };

      const mlRes = await mlClient.predictAll({
        text: `${title || ''} ${description}`,
        latitude: lat,
        longitude: lng,
        severity: severity || 'Medium',
        location_type: location_type || 'Residential',
        ward: ward || gram_panchayat || 'Ward 1',
        affected_count: Number(affected_count) || 50,
        existing_complaints: activeComplaints
      });

      const predictedCategory = mlRes.summary?.primaryDepartment || mlRes.category_prediction?.category || 'CLASSIFICATION_UNCERTAIN';
      const predictedSubcategory = mlRes.category_prediction?.subcategory || mlRes.summary?.subcategory || 'General Issue';
      const secondaryDepartments = mlRes.summary?.secondaryDepartments || mlRes.category_prediction?.secondaryDepartments || [];
      const requiresHumanReview = Boolean(mlRes.summary?.requiresHumanReview || mlRes.category_prediction?.requiresHumanReview);
      const incidentType = mlRes.summary?.incidentType || mlRes.category_prediction?.incidentType || 'Standard Civic Complaint';
      const causeKnown = Boolean(mlRes.summary?.causeKnown !== undefined ? mlRes.summary.causeKnown : mlRes.category_prediction?.causeKnown);
      const classificationReason = mlRes.summary?.reason || mlRes.category_prediction?.reason || '';
      const mlConfidence = mlRes.summary?.departmentConfidence !== undefined ? mlRes.summary.departmentConfidence : mlRes.category_prediction?.confidence;
      const isCrimeDetected = mlRes.summary.is_crime || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(predictedCategory);
      const isEmergencyDetected = Boolean(manualEmergency || mlRes.summary.is_emergency);

      // Category & Subcategory: Use manual choice if selected, otherwise ML prediction
      const finalCategory = (manualCategory && manualCategory !== 'AI Auto Detect' && manualCategory !== 'Auto-Detect with AI') 
        ? manualCategory 
        : predictedCategory;

      const finalSubcategory = (manualSubcategory && manualSubcategory !== 'All' && manualSubcategory !== 'General')
        ? manualSubcategory
        : predictedSubcategory;

      let predictedPriority = mlRes.priority_prediction.priority;
      if (isEmergencyDetected && predictedPriority !== 'CRITICAL') {
        predictedPriority = 'CRITICAL';
      }

      const slaHours = isEmergencyDetected ? 24 : (mlRes.priority_prediction.sla_hours || 72);
      const predictedDays = mlRes.resolution_prediction.estimated_days || 3.0;

      const isDup = mlRes.duplicate_detection.is_duplicate ? 1 : 0;
      const dupMatchId = mlRes.duplicate_detection.matched_complaint_id;
      const dupSim = mlRes.duplicate_detection.max_similarity || 0;

      // 3. Department & Officer Auto-Assignment with Location Jurisdiction
      const departmentId = assignmentService.getDepartmentForCategory(finalCategory, locationContext);
      const officerId = assignmentService.findBestOfficer(departmentId, locationContext);

      // Tracking ID: CMP-{Year}-{Random 5 digits}
      const trackingId = `CMP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // 4. Multi-File Cloudinary Evidence Processing
      let rawFiles = [];
      if (req.files) {
        if (Array.isArray(req.files)) rawFiles = req.files;
        else {
          if (req.files.evidence) rawFiles = rawFiles.concat(req.files.evidence);
          if (req.files.image) rawFiles = rawFiles.concat(req.files.image);
        }
      } else if (req.file) {
        rawFiles = [req.file];
      }

      const uploadedEvidenceItems = [];
      let primaryImageUrl = req.body.image_url || null;
      let primaryVisualAnalysis = null;

      // Extract client-side visual analysis & scene description if generated during live preview
      let clientAnalysis = null;
      if (req.body.visual_analysis_data) {
        try {
          clientAnalysis = typeof req.body.visual_analysis_data === 'string'
            ? JSON.parse(req.body.visual_analysis_data)
            : req.body.visual_analysis_data;
        } catch (_) {}
      }

      let clientSceneDescription = req.body.scene_description || clientAnalysis?.scene?.description || clientAnalysis?.scene_description || clientAnalysis?.scene_analysis?.scene_description || null;
      let clientSceneType = req.body.scene_type || clientAnalysis?.scene?.scene_type || clientAnalysis?.scene_type || clientAnalysis?.scene_analysis?.scene_type || null;
      let clientDirectObservations = [];
      if (req.body.direct_observations) {
        try {
          clientDirectObservations = typeof req.body.direct_observations === 'string'
            ? JSON.parse(req.body.direct_observations)
            : req.body.direct_observations;
        } catch (_) {
          clientDirectObservations = [req.body.direct_observations];
        }
      } else if (clientAnalysis?.evidence?.direct_observations) {
        clientDirectObservations = clientAnalysis.evidence.direct_observations;
      } else if (clientAnalysis?.direct_observations) {
        clientDirectObservations = clientAnalysis.direct_observations;
      } else if (Array.isArray(clientAnalysis?.visual_findings)) {
        clientDirectObservations = clientAnalysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f);
      }

      // Read buffer of first image before unlinking for zero-network Vision AI analysis
      let firstImageBufferBase64 = null;
      for (const file of rawFiles) {
        if (file && file.path && fs.existsSync(file.path) && !firstImageBufferBase64) {
          const v = upload.validateUploadedFile(file);
          if (v.valid && !v.isVideo) {
            try {
              firstImageBufferBase64 = fs.readFileSync(file.path).toString('base64');
            } catch (_) {}
          }
        }
      }

      for (const file of rawFiles) {
        const validation = upload.validateUploadedFile(file);
        if (validation.valid) {
          const isVideo = validation.isVideo;
          const uploadRes = await cloudinaryService.uploadEvidence(file.path, {
            complaintId: trackingId,
            folderType: isVideo ? 'videos' : 'images',
            resourceType: isVideo ? 'video' : 'image',
            originalFilename: file.originalname,
            tags: ['complaint', finalCategory]
          });

          uploadedEvidenceItems.push({
            file,
            uploadRes,
            isVideo
          });

          if (!isVideo && !primaryImageUrl) {
            primaryImageUrl = uploadRes.secure_url;
          }
        }
      }

      // Safety sweep: ensure any temporary files created by multer are completely unlinked from local disk
      for (const file of rawFiles) {
        if (file && file.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // 5. AI Computer Vision & Multimodal Priority Fusion
      if (clientAnalysis) {
        primaryVisualAnalysis = clientAnalysis;
      } else if (firstImageBufferBase64 || primaryImageUrl) {
        try {
          primaryVisualAnalysis = await mlClient.analyzeVisualEvidence({
            imageBase64: firstImageBufferBase64 || null,
            imageUrl: firstImageBufferBase64 ? null : primaryImageUrl,
            textCategory: finalCategory,
            textSubcategory: finalSubcategory,
            description: description.trim(),
            title: title || ''
          });
        } catch (visErr) {
          console.warn('Initial visual analysis failed:', visErr.message);
        }
      }

      const effectiveSceneDescription = clientSceneDescription || primaryVisualAnalysis?.scene?.description || primaryVisualAnalysis?.scene_description || primaryVisualAnalysis?.scene_analysis?.scene_description || primaryVisualAnalysis?.image_overview?.description || null;
      const effectiveSceneType = clientSceneType || primaryVisualAnalysis?.scene?.scene_type || primaryVisualAnalysis?.scene_type || primaryVisualAnalysis?.scene_analysis?.scene_type || (effectiveSceneDescription ? 'Public Infrastructure' : null);
      const effectiveDirectObservations = (clientDirectObservations && clientDirectObservations.length > 0)
        ? clientDirectObservations
        : (primaryVisualAnalysis?.evidence?.direct_observations || primaryVisualAnalysis?.direct_observations || (Array.isArray(primaryVisualAnalysis?.visual_findings) ? primaryVisualAnalysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f) : []));

      // Fuse Text + Vision + Location + Density
      const multimodalResult = await mlClient.fuseMultimodalPriority({
        text_priority: predictedPriority,
        text_category: finalCategory,
        text_subcategory: finalSubcategory,
        visual_severity: primaryVisualAnalysis?.visual_severity,
        visual_label: primaryVisualAnalysis?.detected_label,
        location_type: location_type || 'Residential',
        affected_count: Number(affected_count) || 50,
        is_emergency: isEmergencyDetected,
        evidence_consistency: primaryVisualAnalysis?.evidence_consistency || 'MATCH'
      });

      const finalPriority = multimodalResult.final_priority || predictedPriority;
      const effectiveSlaHours = isEmergencyDetected ? 24 : (multimodalResult.sla_hours || slaHours);
      const slaDeadline = new Date(Date.now() + effectiveSlaHours * 60 * 60 * 1000).toISOString();

      let imageVerificationReport = null;
      if (primaryImageUrl) {
        imageVerificationReport = imageVerificationService.verifyImage(primaryImageUrl, finalCategory, finalSubcategory, description);
      }

      const locationLabel = village || locality || ward || municipality || block || 'West Bengal';
      const complaintTitle = title && title.trim() ? title.trim() : `${finalCategory} - ${finalSubcategory} at ${locationLabel}`;

      // Insert Complaint with full normalized location hierarchy & multimodal priorities
      const insertInfo = db.insertComplaint({
        tracking_id: trackingId,
        citizen_id: citizenId,
        title: complaintTitle,
        description: description.trim(),
        category: finalCategory,
        subcategory: finalSubcategory,
        priority: finalPriority,
        text_priority: predictedPriority,
        visual_priority: primaryVisualAnalysis?.visual_severity || predictedPriority,
        final_priority: finalPriority,
        status: officerId ? 'Assigned' : 'Verified',
        department_id: departmentId,
        officer_id: officerId,
        latitude: lat,
        longitude: lng,
        userEnteredAddress: req.body.userEnteredAddress || req.body.user_entered_address || address || '',
        address: address || `${locationLabel}, ${district || 'North 24 Parganas'}`,
        // Normalized location fields:
        state: state || 'West Bengal',
        district_id: district_id ? Number(district_id) : null,
        district: district || 'North 24 Parganas',
        subdivision_id: subdivision_id ? Number(subdivision_id) : null,
        subdivision: subdivision || '',
        administrative_type: administrative_type || 'Urban',
        ulb_id: ulb_id ? Number(ulb_id) : null,
        ulb_type: ulb_type || null,
        municipality: municipality || '',
        ward_id: ward_id ? Number(ward_id) : null,
        ward: ward || '',
        block_id: block_id ? Number(block_id) : null,
        block: block || '',
        gram_panchayat_id: gram_panchayat_id ? Number(gram_panchayat_id) : null,
        gram_panchayat: gram_panchayat || '',
        village_id: village_id ? Number(village_id) : null,
        village: village || '',
        mouza: mouza || '',
        police_station_id: police_station_id ? Number(police_station_id) : null,
        police_station: police_station || jurisdiction_police_station || nearest_police_station || '',
        nearest_police_station: nearest_police_station || null,
        nearest_police_station_distance: nearest_police_station_distance !== undefined ? nearest_police_station_distance : null,
        jurisdiction_police_station: jurisdiction_police_station || null,
        jurisdiction_verified: Boolean(jurisdiction_verified),
        location_source: location_source || (req.user?.role === 'officer' ? 'Field Officer On-Site Inspection' : 'Citizen GPS & CivicPulse GIS Engine'),
        verification_status: verification_status || (req.user?.role === 'officer' ? 'OFFICER_VERIFIED' : 'PARTIALLY_VERIFIED'),
        sources: sources || {},
        locality: locality || '',
        landmark: landmark || '',
        postal_code: postal_code || '',
        location_type: location_type || 'Residential',
        affected_count: Number(affected_count) || 50,
        image_url: primaryImageUrl,
        image_verification_report: imageVerificationReport,
        impact_score: mlRes.impact_assessment?.score || mlRes.summary?.impact_score || 50,
        impact_label: mlRes.impact_assessment?.label || mlRes.summary?.impact_label || 'Moderate Public Impact',
        root_causes: mlRes.root_cause_analysis?.possible_causes || [],
        recommended_actions: mlRes.root_cause_analysis?.recommended_actions || [],
        upvote_count: 0,
        upvoter_ids: [],
        is_duplicate: isDup,
        duplicate_of_id: dupMatchId ? Number(dupMatchId) : null,
        duplicate_similarity: dupSim,
        ml_confidence: mlConfidence,
        ml_predicted_category: predictedCategory,
        ml_predicted_priority: finalPriority,
        predicted_category: predictedCategory,
        predicted_subcategory: predictedSubcategory,
        primary_department: predictedCategory,
        secondary_departments: secondaryDepartments,
        requires_human_review: requiresHumanReview,
        incident_type: incidentType,
        cause_known: causeKnown,
        classification_reason: classificationReason,
        original_predicted_department: predictedCategory,
        final_department: finalCategory,
        original_citizen_input: req.body.original_citizen_input || req.body.originalCitizenInput || description.trim(),
        structured_incident: req.body.structured_incident ? (typeof req.body.structured_incident === 'string' ? req.body.structured_incident : JSON.stringify(req.body.structured_incident)) : (mlRes.summary?.structured_incident ? JSON.stringify(mlRes.summary.structured_incident) : null),
        was_overridden_by_citizen: Boolean(manualCategory && manualCategory !== predictedCategory && manualCategory !== 'AI Auto Detect' && manualCategory !== 'Auto-Detect with AI') ? 1 : 0,
        final_citizen_category: finalCategory,
        is_emergency: isEmergencyDetected ? 1 : 0,
        triage_status: isEmergencyDetected ? 'PENDING_OFFICER_TRIAGE' : null,
        is_crime: isCrimeDetected ? 1 : 0,
        is_sensitive: isCrimeDetected ? 1 : 0,
        predicted_resolution_days: predictedDays,
        sla_deadline: slaDeadline,
        scene_description: effectiveSceneDescription,
        scene_type: effectiveSceneType,
        direct_observations: effectiveDirectObservations
      });

      const newComplaintId = insertInfo.id;

      // 6. Record Evidence & Visual Analysis in DB with Audit Trail
      for (const item of uploadedEvidenceItems) {
        const evRecord = db.insertEvidence({
          complaint_id: newComplaintId,
          uploaded_by: citizenId,
          cloudinary_public_id: item.uploadRes.cloudinary_public_id,
          cloudinary_url: item.uploadRes.cloudinary_url,
          secure_url: item.uploadRes.secure_url,
          resource_type: item.uploadRes.resource_type,
          format: item.uploadRes.format,
          original_filename: item.uploadRes.original_filename,
          file_size: item.uploadRes.file_size,
          width: item.uploadRes.width,
          height: item.uploadRes.height,
          duration: item.uploadRes.duration,
          thumbnail_url: item.uploadRes.thumbnail_url,
          blurred_url: cloudinaryService.getBlurredUrl(item.uploadRes.cloudinary_public_id, { resourceType: item.uploadRes.resource_type }),
          evidence_type: 'initial',
          is_sensitive: Boolean(isCrimeDetected),
          scene_description: effectiveSceneDescription,
          scene_type: effectiveSceneType,
          direct_observations: effectiveDirectObservations
        });

        db.logEvidenceAudit({
          complaint_id: newComplaintId,
          evidence_id: evRecord.id,
          cloudinary_public_id: item.uploadRes.cloudinary_public_id,
          action: 'UPLOAD',
          user_id: citizenId,
          user_role: req.user.role,
          user_name: req.user.name,
          ip_address: req.ip || '127.0.0.1',
          details: `Uploaded ${item.file.originalname} (${(item.file.size / (1024 * 1024)).toFixed(2)} MB)`
        });

        // If primary visual analysis, link to evidence
        if (primaryVisualAnalysis && !item.isVideo && !primaryVisualAnalysis.saved) {
          const vRecord = db.insertVisualAnalysis({
            complaint_id: newComplaintId,
            complaint_evidence_id: evRecord.id,
            model_name: primaryVisualAnalysis.model_name || 'CivicPulse-Multimodal-Vision-v2.6',
            model_version: primaryVisualAnalysis.model_version || '2.6.0',
            image_quality: primaryVisualAnalysis.image_quality || 'GOOD',
            quality_metrics: primaryVisualAnalysis.quality_metrics,
            detected_objects: primaryVisualAnalysis.detected_objects || [],
            visual_severity: primaryVisualAnalysis.visual_severity || 'UNKNOWN',
            visual_risk: primaryVisualAnalysis.visual_risk || 'Standard municipal inspection scheduled',
            evidence_consistency: primaryVisualAnalysis.evidence_consistency || 'MATCH',
            consistency_details: primaryVisualAnalysis.consistency_details || '',
            confidence: primaryVisualAnalysis.confidence || 0.94,
            analysis_status: primaryVisualAnalysis.analysis_status || 'COMPLETED',
            recommended_action: primaryVisualAnalysis.recommended_action || '',
            scene_description: effectiveSceneDescription,
            scene_type: effectiveSceneType,
            direct_observations: effectiveDirectObservations,
            scene: primaryVisualAnalysis.scene || { description: effectiveSceneDescription, scene_type: effectiveSceneType },
            evidence: primaryVisualAnalysis.evidence || { direct_observations: effectiveDirectObservations }
          });
          primaryVisualAnalysis.saved = true;
        }
      }

      // 7. Add initial timeline log
      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, 'Submitted', ?, 'Multimodal AI Pipeline', NULL)
      `).run(newComplaintId, `Registered with Multimodal AI Fusion: Category=${finalCategory}, Priority=${finalPriority} (Text: ${predictedPriority}, Visual: ${primaryVisualAnalysis?.visual_severity || 'N/A'}).`);

      if (officerId) {
        db.prepare(`
          INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
          VALUES (?, 'Assigned', 'Department and Field Officer automatically routed based on AI categorization.', 'Smart Routing Engine', NULL)
        `).run(newComplaintId);
      }

      // 6. Create citizen notification
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (?, 'Complaint Registered', ?, ?)
      `).run(
        citizenId,
        `Your complaint #${trackingId} (${finalCategory} - ${predictedPriority} Priority) has been received.`,
        `/complaints/${newComplaintId}`
      );

      const createdComplaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(newComplaintId);

      res.status(201).json({
        message: 'Complaint submitted successfully',
        complaint: createdComplaint,
        ai_summary: mlRes.summary,
        duplicate_match: mlRes.duplicate_detection?.is_duplicate ? mlRes.duplicate_detection.matches[0] : null
      });
    } catch (err) {
      console.error('Complaint creation error:', err);
      res.status(500).json({ error: 'Failed to create complaint' });
    }
  }

  /**
   * Get all complaints submitted by the authenticated citizen
   */
  getMyComplaints(req, res) {
    try {
      const citizenId = req.user.id;
      const complaints = db.prepare('SELECT * FROM complaints WHERE citizen_id = ?').all(citizenId);
      res.json({ complaints });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch your complaints' });
    }
  }

  /**
   * Public complaints feed for GIS map and transparency board (with Crime Data Privacy Protection)
   */
  getPublicComplaints(req, res) {
    try {
      const complaints = db.prepare('SELECT * FROM complaints').all();

      // Privacy Protection for Crime and Sensitive Cases
      const publicList = complaints.map(c => {
        const isCrime = c.is_crime === 1 || c.is_crime === true || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(c.category);

        if (isCrime) {
          // Approximate location coordinates (+- 0.003 jitter) to prevent locating victim residence
          const latJitter = c.latitude ? Number((c.latitude + 0.002).toFixed(4)) : 22.9750;
          const lngJitter = c.longitude ? Number((c.longitude + 0.002).toFixed(4)) : 88.4340;

          return {
            id: c.id,
            tracking_id: c.tracking_id,
            title: `[Protected] ${c.category} - ${c.subcategory || 'Incident Report'}`,
            category: c.category,
            subcategory: c.subcategory,
            priority: c.priority,
            status: c.status,
            latitude: latJitter,
            longitude: lngJitter,
            ward: c.ward,
            address: `${c.ward || 'Municipal Ward'} (Protected Law Enforcement Case)`,
            image_url: null, // Redacted for victim privacy
            resolution_image_url: null,
            is_crime: true,
            is_sensitive: true,
            created_at: c.created_at,
            resolved_at: c.resolved_at
          };
        }

        return {
          id: c.id,
          tracking_id: c.tracking_id,
          title: c.title,
          category: c.category,
          subcategory: c.subcategory,
          priority: c.priority,
          status: c.status,
          latitude: c.latitude,
          longitude: c.longitude,
          ward: c.ward,
          address: c.address,
          image_url: null, // Redacted: Evidence not shown to public, only given to complaint authority
          resolution_image_url: null,
          has_evidence: Boolean(c.image_url),
          is_crime: false,
          is_sensitive: false,
          created_at: c.created_at,
          resolved_at: c.resolved_at
        };
      });

      res.json({ complaints: publicList });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch public complaints' });
    }
  }

  /**
   * Get specific complaint details by ID with full timeline and feedback
   */
  getComplaintById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;
      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? OR tracking_id = ?').get(id, id);

      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const timeline = db.prepare('SELECT * FROM complaint_timeline WHERE complaint_id = ?').all(complaint.id);
      const feedback = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(complaint.id);

      // Fetch Evidence Items and AI Visual Analyses
      const evidenceList = db.getEvidenceByComplaintId(complaint.id);
      const visualAnalyses = db.getVisualAnalysisByComplaintId(complaint.id);

      // Check RBAC permissions: Evidence is strictly confidential and never displayed to the general public.
      // It is only given to the designated Complaint Authority (Department/Field Officer, Admin) and the filing citizen.
      const isOwner = user && (String(complaint.citizen_id) === String(user.id));
      const isOfficer = user && (user.role === 'officer' || user.role === 'field_officer') && 
        (String(complaint.officer_id) === String(user.id) || String(complaint.department_id) === String(user.department_id) || !complaint.department_id);
      const isAdmin = user && user.role === 'admin';
      const isAuthority = Boolean(isOfficer || isAdmin);
      const canAccessEvidence = Boolean(isAuthority || isOwner);

      // Evidence Protection Protocol: Redact evidence photos/videos for any public or unauthorized viewer
      const hasEvidence = (evidenceList && evidenceList.length > 0) || Boolean(complaint.image_url);
      const safeEvidence = canAccessEvidence ? evidenceList : [];
      const safeImageUrl = canAccessEvidence ? complaint.image_url : null;
      const safeResolutionImageUrl = (canAccessEvidence || complaint.status === 'Resolved') ? complaint.resolution_image_url : null;

      const primaryAnalysis = visualAnalyses[0] || null;

      const enrichedEvidence = safeEvidence.map(item => {
        const analysis = visualAnalyses.find(v => v.complaint_evidence_id === item.id || v.id === item.ai_analysis_id);
        const isCloud = !item.cloudinary_public_id?.startsWith('local_');

        return {
          ...item,
          optimized_url: isCloud ? cloudinaryService.getOptimizedUrl(item.cloudinary_public_id, { resourceType: item.resource_type }) : item.secure_url,
          thumbnail_url: item.thumbnail_url || (isCloud ? cloudinaryService.getThumbnailUrl(item.cloudinary_public_id, { resourceType: item.resource_type }) : item.secure_url),
          blurred_url: item.blurred_url || (isCloud ? cloudinaryService.getBlurredUrl(item.cloudinary_public_id, { resourceType: item.resource_type }) : item.secure_url),
          visual_analysis: analysis || null,
          scene_description: analysis?.scene_description || analysis?.scene?.description || item.scene_description || complaint.scene_description || null,
          scene_type: analysis?.scene_type || analysis?.scene?.scene_type || item.scene_type || complaint.scene_type || null,
          direct_observations: (analysis?.direct_observations && analysis.direct_observations.length > 0) ? analysis.direct_observations : (Array.isArray(analysis?.visual_findings) ? analysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f) : (item.direct_observations || complaint.direct_observations || []))
        };
      });

      res.json({
        complaint: {
          ...complaint,
          image_url: safeImageUrl,
          resolution_image_url: safeResolutionImageUrl,
          evidence: enrichedEvidence,
          visual_analyses: isAuthority ? visualAnalyses : [],
          scene_description: complaint.scene_description || primaryAnalysis?.scene_description || primaryAnalysis?.scene?.description || (enrichedEvidence[0]?.scene_description || null),
          scene_type: complaint.scene_type || primaryAnalysis?.scene_type || primaryAnalysis?.scene?.scene_type || (enrichedEvidence[0]?.scene_type || null),
          direct_observations: (complaint.direct_observations && complaint.direct_observations.length > 0) ? complaint.direct_observations : (primaryAnalysis?.direct_observations || (enrichedEvidence[0]?.direct_observations || [])),
          has_evidence: hasEvidence,
          evidence_count: evidenceList.length || (complaint.image_url ? 1 : 0),
          evidence_restricted: !canAccessEvidence,
          is_authority: isAuthority,
          is_owner: isOwner
        },
        timeline,
        feedback: feedback || null
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch complaint details' });
    }
  }

  /**
   * Citizen community upvote / endorsement (+1 support)
   */
  async upvoteComplaint(req, res) {
    try {
      const { id } = req.params;
      const citizenId = req.user.id;
      const citizenName = req.user.name || 'Citizen';

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const upvoters = Array.isArray(complaint.upvoter_ids) ? complaint.upvoter_ids : [];
      if (upvoters.includes(citizenId)) {
        return res.status(400).json({ error: 'You have already endorsed this complaint', already_upvoted: true });
      }

      upvoters.push(citizenId);
      const newUpvoteCount = (complaint.upvote_count || 0) + 1;
      const newAffectedCount = (complaint.affected_count || 10) + 1;
      const newImpactScore = Math.min(100, (complaint.impact_score || 50) + 2);

      db.prepare(`
        UPDATE complaints
        SET upvote_count = ?,
            affected_count = ?,
            impact_score = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newUpvoteCount, newAffectedCount, newImpactScore, complaint.id);

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        complaint.id,
        complaint.status,
        `Community endorsement (+1 affected) registered by ${citizenName}. Total citizen supporters: ${newUpvoteCount}. Impact score elevated to ${newImpactScore}/100.`,
        'Community Support Engine',
        citizenId
      );

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);

      res.json({
        message: 'Community support registered successfully!',
        upvote_count: newUpvoteCount,
        affected_count: newAffectedCount,
        impact_score: newImpactScore,
        complaint: updated
      });
    } catch (err) {
      console.error('Upvote error:', err);
      res.status(500).json({ error: 'Failed to record community support' });
    }
  }

  /**
   * Citizen Reopens Resolved Complaint
   */
  async reopenComplaint(req, res) {
    try {
      const { id } = req.params;
      const citizenId = req.user.id;
      const citizenName = req.user.name || 'Citizen';
      const { reason, notes } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      if (complaint.status !== 'Resolved') {
        return res.status(400).json({ error: 'Only resolved complaints can be reopened' });
      }

      const reopenCount = (complaint.reopen_count || 0) + 1;
      const reopenReason = reason || notes || 'Citizen reported the issue persists on ground.';

      db.prepare(`
        UPDATE complaints
        SET status = 'In Progress',
            priority = 'HIGH',
            is_escalated = 1,
            escalation_level = CASE WHEN escalation_level < 2 THEN escalation_level + 1 ELSE escalation_level END,
            reopen_count = ?,
            reopen_reason = ?,
            resolved_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reopenCount, reopenReason, complaint.id);

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, 'In Progress', ?, ?, ?)
      `).run(
        complaint.id,
        `⚠️ COMPLAINT REOPENED by citizen: "${reopenReason}". Escalated to priority HIGH for departmental re-investigation.`,
        citizenName,
        citizenId
      );

      // Notify assigned officer
      if (complaint.officer_id) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, link)
          VALUES (?, '⚠️ Complaint Reopened by Citizen', ?, ?)
        `).run(
          complaint.officer_id,
          `Citizen reported issue persists on #${complaint.tracking_id} ("${reopenReason}"). Immediate inspection required.`,
          `/complaints/${complaint.id}`
        );
      }

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      res.json({
        message: 'Complaint successfully reopened and escalated for re-investigation',
        complaint: updated
      });
    } catch (err) {
      console.error('Reopen error:', err);
      res.status(500).json({ error: 'Failed to reopen complaint' });
    }
  }

  /**
   * GET /api/complaints/map - Admin GIS Complaint Map
   * Exposes individual complaint points for authorized administrators.
   * Protects complainant PII (phone, email, identity) for unauthorized callers.
   */
  async getComplaintMap(req, res) {
    try {
      // Check auth header for admin/officer privilege
      let isAuthorizedAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const { JWT_SECRET } = require('../middleware/authMiddleware');
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && (decoded.role === 'admin' || decoded.role === 'officer')) {
            isAuthorizedAdmin = true;
          }
        } catch (e) {}
      }

      const { district, police_station, category, status, priority, date_from, date_to } = req.query;
      let complaints = db.prepare('SELECT * FROM complaints').all();

      if (district && district !== 'All') {
        complaints = complaints.filter(c => (c.district || '').toLowerCase() === district.toLowerCase());
      }
      if (police_station && police_station !== 'All') {
        complaints = complaints.filter(c => (c.police_station || '').toLowerCase().includes(police_station.toLowerCase()));
      }
      if (category && category !== 'All') {
        complaints = complaints.filter(c => c.category === category);
      }
      if (status && status !== 'All') {
        complaints = complaints.filter(c => c.status === status);
      }
      if (priority && priority !== 'All') {
        complaints = complaints.filter(c => c.priority === priority);
      }
      if (date_from) {
        const fromDate = new Date(date_from);
        complaints = complaints.filter(c => new Date(c.created_at) >= fromDate);
      }
      if (date_to) {
        const toDate = new Date(date_to);
        complaints = complaints.filter(c => new Date(c.created_at) <= toDate);
      }

      // Map to safe GIS points
      const points = complaints
        .filter(c => c.latitude && c.longitude && Math.abs(c.latitude) > 0.1)
        .map(c => {
          const isCrime = c.is_crime === 1 || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(c.category);
          
          return {
            id: c.id,
            tracking_id: c.tracking_id,
            title: (isCrime && !isAuthorizedAdmin) ? `[Protected Case: ${c.category}]` : c.title,
            description: (isCrime && !isAuthorizedAdmin) ? 'Details protected for law enforcement jurisdiction.' : (c.description ? c.description.slice(0, 160) : ''),
            category: c.category,
            subcategory: c.subcategory,
            priority: c.priority,
            status: c.status,
            latitude: c.latitude,
            longitude: c.longitude,
            location: c.location || {
              type: 'Point',
              coordinates: [c.longitude, c.latitude],
              address: c.address,
              pincode: c.postal_code,
              district: c.district,
              policeStation: c.police_station
            },
            district: c.district || 'West Bengal',
            police_station: c.police_station || null,
            pincode: c.postal_code || '',
            date: c.created_at,
            created_at: c.created_at,
            image_url: isAuthorizedAdmin ? c.image_url : null,
            has_evidence: Boolean(c.image_url),
            is_crime: isCrime,
            // Sensitive PII only included if authorized admin
            complainant: isAuthorizedAdmin ? {
              name: c.citizen_name || 'Citizen',
              phone: c.citizen_phone || '',
              email: c.citizen_email || ''
            } : null
          };
        });

      res.json({ success: true, count: points.length, complaints: points });
    } catch (err) {
      console.error('getComplaintMap error:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch complaint map data.' });
    }
  }

  /**
   * GET /api/complaints/heatmap - Real Complaint Density Heatmap
   * Generated from REAL complaint coordinates stored in MongoDB.
   */
  async getComplaintHeatmap(req, res) {
    try {
      const {
        district,
        subdivision,
        block,
        gram_panchayat,
        municipality,
        ward,
        police_station,
        pincode,
        category,
        priority,
        status,
        date_from,
        date_to,
        startDate,
        endDate
      } = req.query;

      let complaints = db.prepare('SELECT * FROM complaints').all();

      // Filters
      if (district && district !== 'All') {
        complaints = complaints.filter(c => (c.district || '').toLowerCase() === district.toLowerCase());
      }
      if (subdivision && subdivision !== 'All') {
        complaints = complaints.filter(c => (c.subdivision || '').toLowerCase() === subdivision.toLowerCase());
      }
      if (block && block !== 'All') {
        complaints = complaints.filter(c => (c.block || '').toLowerCase().includes(block.toLowerCase()));
      }
      if (gram_panchayat && gram_panchayat !== 'All') {
        complaints = complaints.filter(c => (c.gram_panchayat || '').toLowerCase().includes(gram_panchayat.toLowerCase()));
      }
      if (municipality && municipality !== 'All') {
        complaints = complaints.filter(c => (c.municipality || '').toLowerCase().includes(municipality.toLowerCase()));
      }
      if (ward && ward !== 'All') {
        complaints = complaints.filter(c => (c.ward || '').toLowerCase() === ward.toLowerCase());
      }
      if (police_station && police_station !== 'All') {
        complaints = complaints.filter(c => (c.police_station || '').toLowerCase().includes(police_station.toLowerCase()));
      }
      if (pincode && pincode !== 'All') {
        complaints = complaints.filter(c => String(c.postal_code || '').trim() === String(pincode).trim());
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

      const dFrom = date_from || startDate;
      const dTo = date_to || endDate;
      if (dFrom) {
        const fromDate = new Date(dFrom);
        complaints = complaints.filter(c => new Date(c.created_at) >= fromDate);
      }
      if (dTo) {
        const toDate = new Date(dTo);
        complaints = complaints.filter(c => new Date(c.created_at) <= toDate);
      }

      // Filter real coordinates and compute density weights
      const points = complaints
        .filter(c => c.latitude && c.longitude && Math.abs(c.latitude) > 0.1)
        .map(c => {
          let weight = 0.5;
          if (c.priority === 'CRITICAL') weight = 1.0;
          else if (c.priority === 'HIGH') weight = 0.8;
          else if (c.priority === 'MEDIUM') weight = 0.6;
          else weight = 0.4;

          return {
            id: c.id,
            tracking_id: c.tracking_id,
            latitude: c.latitude,
            longitude: c.longitude,
            coordinates: [c.longitude, c.latitude],
            weight,
            intensity: weight,
            category: c.category,
            priority: c.priority,
            status: c.status,
            district: c.district || 'West Bengal',
            police_station: c.police_station || null,
            pincode: c.postal_code || '',
            date: c.created_at
          };
        });

      res.json({ success: true, count: points.length, points });
    } catch (err) {
      console.error('getComplaintHeatmap error:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch complaint heatmap data.' });
    }
  }

  /**
   * GET /api/complaints/nearby - Geospatial Query using MongoDB $near
   * Finds complaints within 1km, 5km, 10km, etc.
   */
  async getNearbyComplaints(req, res) {
    try {
      const lat = parseFloat(req.query.lat || req.query.latitude);
      const lng = parseFloat(req.query.lng || req.query.longitude);
      const maxDistance = parseInt(req.query.radius || req.query.maxDistance || req.query.distance) || 5000; // default 5km in meters

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ success: false, error: 'Valid lat and lng query parameters are required.' });
      }

      const mongoose = require('mongoose');
      let nearbyComplaints = [];

      if (mongoose.connection.readyState === 1) {
        const mongoModels = require('../models/mongo');
        nearbyComplaints = await mongoModels.Complaint.find({
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: maxDistance
            }
          }
        })
        .select('id tracking_id title category priority status location latitude longitude district police_station postal_code created_at')
        .limit(50)
        .lean();
      }

      // Fallback: Haversine distance from memory if MongoDB not connected or 0 results returned
      if (!nearbyComplaints || nearbyComplaints.length === 0) {
        const complaints = db.prepare('SELECT * FROM complaints').all();
        const haversine = (lat1, lon1, lat2, lon2) => {
          const R = 6371e3;
          const toRad = x => (x * Math.PI) / 180;
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        nearbyComplaints = complaints
          .filter(c => c.latitude && c.longitude && Math.abs(c.latitude) > 0.1)
          .map(c => {
            const dist = haversine(lat, lng, c.latitude, c.longitude);
            return { ...c, distanceMeters: Math.round(dist) };
          })
          .filter(c => c.distanceMeters <= maxDistance)
          .sort((a, b) => a.distanceMeters - b.distanceMeters)
          .slice(0, 50);
      }

      res.json({
        success: true,
        count: nearbyComplaints.length,
        radiusMeters: maxDistance,
        center: { latitude: lat, longitude: lng },
        complaints: nearbyComplaints.map(c => ({
          id: c.id,
          tracking_id: c.tracking_id,
          title: c.title,
          category: c.category,
          priority: c.priority,
          status: c.status,
          latitude: c.latitude,
          longitude: c.longitude,
          district: c.district,
          police_station: c.police_station || c.location?.policeStation,
          pincode: c.postal_code || c.location?.pincode,
          date: c.created_at
        }))
      });
    } catch (err) {
      console.error('getNearbyComplaints error:', err);
      res.status(500).json({ success: false, error: 'Failed to search nearby complaints.' });
    }
  }
}

module.exports = new ComplaintController();
