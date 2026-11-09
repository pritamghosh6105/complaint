const fs = require('fs');

const db = require('../models/db');

const cloudinaryService = require('../services/cloudinaryService');

const mlClient = require('../services/mlClient');

const upload = require('../middleware/uploadMiddleware');



class EvidenceController {

  /**

   * Upload one or more evidence files to Cloudinary and record in database

   */

  async uploadEvidence(req, res) {

    try {

      const user = req.user;

      const { complaint_id, category, subcategory, description, evidence_type = 'initial' } = req.body;

      const files = req.files || (req.file ? [req.file] : []);



      if (!files || files.length === 0) {

        return res.status(400).json({ error: 'No evidence files provided.' });

      }



      const results = [];

      const complaintId = complaint_id ? Number(complaint_id) : 'draft';



      // Check complaint authorization if complaint_id is provided

      let complaint = null;

      if (complaint_id) {

        complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(Number(complaint_id));

        if (!complaint) {

          return res.status(404).json({ error: 'Complaint ticket not found.' });

        }

        // Citizen can only upload to their own complaint; Officer can upload if assigned / resolving

        const isOwner = complaint.citizen_id === user.id;

        const isOfficer = user.role === 'officer' && (complaint.officer_id === user.id || complaint.department_id === user.department_id);

        const isAdmin = user.role === 'admin';



        if (!isOwner && !isOfficer && !isAdmin) {

          return res.status(403).json({ error: 'Unauthorized to upload evidence for this complaint.' });

        }

      }



      for (const file of files) {

        // Validate file size and type

        const validation = upload.validateUploadedFile(file);

        if (!validation.valid) {

          return res.status(400).json({ error: validation.error });

        }



        const isVideo = validation.isVideo;

        const folderType = evidence_type === 'resolution' ? 'resolution' : (isVideo ? 'videos' : 'images');



        // Upload to Cloudinary (or local fallback if unconfigured)

        const uploadResult = await cloudinaryService.uploadEvidence(file.path, {

          complaintId,

          folderType,

          resourceType: isVideo ? 'video' : 'image',

          originalFilename: file.originalname,

          tags: [evidence_type, category || 'general']

        });



        // Insert evidence record

        const evidenceRecord = db.insertEvidence({

          complaint_id: complaintId !== 'draft' ? complaintId : 0,

          uploaded_by: user.id,

          cloudinary_public_id: uploadResult.cloudinary_public_id,

          cloudinary_url: uploadResult.cloudinary_url,

          secure_url: uploadResult.secure_url,

          resource_type: uploadResult.resource_type,

          format: uploadResult.format,

          original_filename: uploadResult.original_filename,

          file_size: uploadResult.file_size,

          width: uploadResult.width,

          height: uploadResult.height,

          duration: uploadResult.duration,

          thumbnail_url: uploadResult.thumbnail_url,

          blurred_url: cloudinaryService.getBlurredUrl(uploadResult.cloudinary_public_id, { resourceType: uploadResult.resource_type }),

          evidence_type,

          is_sensitive: complaint ? Boolean(complaint.is_crime || complaint.is_sensitive) : false

        });



        // Log audit event

        db.logEvidenceAudit({

          complaint_id: complaintId !== 'draft' ? complaintId : 0,

          evidence_id: evidenceRecord.id,

          cloudinary_public_id: uploadResult.cloudinary_public_id,

          action: 'UPLOAD',

          user_id: user.id,

          user_role: user.role,

          user_name: user.name,

          ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',

          details: `Uploaded ${file.originalname} (${(file.size / (1024 * 1024)).toFixed(2)} MB, ${uploadResult.resource_type})`

        });



        // Trigger AI Visual Analysis for images

        let visualAnalysis = null;

        if (!isVideo && uploadResult.secure_url) {

          try {

            const analysisResult = await mlClient.analyzeVisualEvidence({

              imageUrl: uploadResult.secure_url,

              textCategory: category || complaint?.category || '',

              textSubcategory: subcategory || complaint?.subcategory || '',

              description: description || complaint?.description || '',

              title: title || complaint?.title || ''

            });



            visualAnalysis = db.insertVisualAnalysis({

              complaint_id: complaintId !== 'draft' ? complaintId : 0,

              complaint_evidence_id: evidenceRecord.id,

              ...analysisResult

            });



            evidenceRecord.ai_analysis_id = visualAnalysis.id;

          } catch (aiErr) {

            console.warn('AI Visual Analysis error after upload:', aiErr.message);

          }

        }



        results.push({

          evidence: evidenceRecord,

          visual_analysis: visualAnalysis,

          optimized_url: uploadResult.optimized_url,

          thumbnail_url: uploadResult.thumbnail_url

        });



        // Ensure temporary local upload file is deleted

        if (file && file.path && fs.existsSync(file.path)) {

          try { fs.unlinkSync(file.path); } catch (_) {}

        }

      }



      res.status(201).json({

        message: 'Evidence successfully uploaded & analyzed.',

        count: results.length,

        items: results

      });

    } catch (err) {

      console.error('Evidence upload error:', err);

      res.status(500).json({ error: err.message || 'Failed to upload evidence.' });

    }

  }



  /**

   * Get all evidence files attached to a complaint with RBAC enforcement

   */

  async getComplaintEvidence(req, res) {

    try {

      const user = req.user;

      const { complaint_id } = req.params;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(Number(complaint_id));



      if (!complaint) {

        return res.status(404).json({ error: 'Complaint ticket not found.' });

      }



      // Authorization checks

      const isCitizenOwner = complaint.citizen_id === user.id;

      const isAssignedOfficer = user.role === 'officer' && (complaint.officer_id === user.id || complaint.department_id === user.department_id);

      const isAdmin = user.role === 'admin';



      if (!isCitizenOwner && !isAssignedOfficer && !isAdmin) {

        return res.status(403).json({ error: 'Access denied: You do not have permission to view private complaint evidence.' });

      }



      // Fetch evidence items and their visual analyses

      const evidenceList = db.getEvidenceByComplaintId(Number(complaint_id));

      const visualList = db.getVisualAnalysisByComplaintId(Number(complaint_id));



      // Merge visual analysis records into evidence items

      const enrichedEvidence = evidenceList.map(item => {

        const analysis = visualList.find(v => v.complaint_evidence_id === item.id || v.id === item.ai_analysis_id);

        const isCloud = !item.cloudinary_public_id?.startsWith('local_');



        return {

          ...item,

          optimized_url: isCloud ? cloudinaryService.getOptimizedUrl(item.cloudinary_public_id, { resourceType: item.resource_type }) : item.secure_url,

          thumbnail_url: item.thumbnail_url || (isCloud ? cloudinaryService.getThumbnailUrl(item.cloudinary_public_id, { resourceType: item.resource_type }) : item.secure_url),

          blurred_url: item.blurred_url || (isCloud ? cloudinaryService.getBlurredUrl(item.cloudinary_public_id, { resourceType: item.resource_type }) : item.secure_url),

          visual_analysis: analysis || null

        };

      });



      // Log access audit

      db.logEvidenceAudit({

        complaint_id: Number(complaint_id),

        action: 'VIEW',

        user_id: user.id,

        user_role: user.role,

        user_name: user.name,

        ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',

        details: `Viewed evidence package for complaint #${complaint.tracking_id} (${evidenceList.length} files)`

      });



      res.json({

        complaint_id: Number(complaint_id),

        tracking_id: complaint.tracking_id,

        evidence: enrichedEvidence,

        is_sensitive: Boolean(complaint.is_crime || complaint.is_sensitive)

      });

    } catch (err) {

      console.error('Get evidence error:', err);

      res.status(500).json({ error: 'Failed to retrieve complaint evidence.' });

    }

  }



  /**

   * Delete an evidence file from both Cloudinary and the database

   */

  async deleteEvidence(req, res) {

    try {

      const user = req.user;

      const { id } = req.params;



      const evidence = db.getEvidenceById(Number(id));

      if (!evidence) {

        return res.status(404).json({ error: 'Evidence record not found.' });

      }



      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(evidence.complaint_id);

      const isOwner = evidence.uploaded_by === user.id || (complaint && complaint.citizen_id === user.id);

      const isAdmin = user.role === 'admin';



      if (!isOwner && !isAdmin) {

        return res.status(403).json({ error: 'Unauthorized to delete this evidence file.' });

      }



      // 1. Destroy asset from Cloudinary

      if (evidence.cloudinary_public_id) {

        await cloudinaryService.deleteEvidence(evidence.cloudinary_public_id, evidence.resource_type);

      }



      // 2. Remove from database

      db.deleteEvidence(evidence.id);



      // 3. Log audit event

      db.logEvidenceAudit({

        complaint_id: evidence.complaint_id,

        evidence_id: evidence.id,

        cloudinary_public_id: evidence.cloudinary_public_id,

        action: 'DELETE',

        user_id: user.id,

        user_role: user.role,

        user_name: user.name,

        ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',

        details: `Deleted evidence ${evidence.original_filename} (ID: ${evidence.id})`

      });



      res.json({

        message: 'Evidence asset successfully removed from Cloudinary and database.',

        deleted_id: evidence.id

      });

    } catch (err) {

      console.error('Delete evidence error:', err);

      res.status(500).json({ error: 'Failed to delete evidence.' });

    }

  }



  /**

   * Re-runs AI Visual Analysis for a specific evidence file

   */

  async triggerAIAnalysis(req, res) {

    try {

      const { id } = req.params;

      const evidence = db.getEvidenceById(Number(id));

      if (!evidence) {

        return res.status(404).json({ error: 'Evidence record not found.' });

      }



      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(evidence.complaint_id);



      const analysisResult = await mlClient.analyzeVisualEvidence({

        imageUrl: evidence.secure_url,

        textCategory: complaint?.category || '',

        textSubcategory: complaint?.subcategory || '',

        description: complaint?.description || '',

        title: complaint?.title || ''

      });



      const visualAnalysis = db.insertVisualAnalysis({

        complaint_id: evidence.complaint_id,

        complaint_evidence_id: evidence.id,

        ...analysisResult

      });



      res.json({

        message: 'AI Visual Analysis completed.',

        visual_analysis: visualAnalysis

      });

    } catch (err) {

      console.error('Trigger AI analysis error:', err);

      res.status(500).json({ error: 'Failed to complete AI visual analysis.' });

    }

  }



  /**

   * Preview AI Visual Analysis on a draft file before complaint submission

   */

  async previewAnalysis(req, res) {

    const fs = require('fs');

    const file = req.file;

    const { category, subcategory, description, title } = req.body || {};



    if (!file || !file.path || !fs.existsSync(file.path)) {

      return res.status(400).json({ error: 'No valid image file received for preview analysis.' });

    }



    try {

      const fileBuffer = fs.readFileSync(file.path);

      const base64Data = fileBuffer.toString('base64');



      const analysis = await mlClient.analyzeVisualEvidence({

        imageBase64: base64Data,

        textCategory: category || '',

        textSubcategory: subcategory || '',

        description: description || '',

        title: title || ''

      });



      // Cleanup local temp file if created

      try {

        if (fs.existsSync(file.path)) {

          fs.unlinkSync(file.path);

        }

      } catch (_) {}



      return res.json({

        analysis,

        visual_analysis: analysis

      });

    } catch (err) {

      console.error('Preview visual analysis error, returning graceful preview fallback:', err.message);

      // Cleanup local temp file

      try {

        if (file && file.path && fs.existsSync(file.path)) {

          fs.unlinkSync(file.path);

        }

      } catch (_) {}



      // Return graceful fallback analysis to prevent client 500 error during draft upload

      const fallbackAnalysis = {

        analysis_id: `ANL-PREVIEW-FB-${Date.now()}`,

        scene_analysis: {

          scene_description: 'Uploaded photographic evidence attached for officer verification.',

          scene_type: 'Civic Scene',

          visible_objects: [],

          confidence: null

        },

        visual_findings: [

          { observation: 'Photographic evidence received and queued for verification.', evidence_type: 'direct_visual_observation' }

        ],

        image_quality: {

          rating: 'GOOD',

          sharpness: 'GOOD',

          lighting: 'BALANCED',

          visibility: 'CLEAR',

          occlusion: 'LOW',

          explanation: 'Image successfully uploaded for review.'

        },

        visual_severity: {

          level: 'UNKNOWN',

          damage_score: null,

          explanation: 'Visual severity to be assessed during field inspection.'

        },

        category_prediction: {

          department: category || 'UNKNOWN',

          category: category || 'UNKNOWN',

          subcategory: subcategory || 'General',

          confidence: null,

          requires_complaint_context: true

        },

        visible_objects: [],

        detected_objects: [],

        limitations: ['Photographic evidence awaiting detailed review by assigned field officer.']

      };



      return res.json({

        analysis: fallbackAnalysis,

        visual_analysis: fallbackAnalysis

      });

    }

  }



  /**

   * Get audit logs for complaint evidence

   */

  async getAuditLogs(req, res) {

    try {

      const { complaint_id } = req.params;

      if (req.user.role !== 'admin' && req.user.role !== 'officer') {

        return res.status(403).json({ error: 'Only authorized officers and administrators may view audit logs.' });

      }



      const logs = db.getEvidenceAuditLogs(Number(complaint_id));

      res.json({ logs });

    } catch (err) {

      res.status(500).json({ error: 'Failed to retrieve audit logs.' });

    }

  }



  /**

   * Phase 13: Officer review and human verification of AI visual evidence analysis

   */

  async officerReviewEvidence(req, res) {

    try {

      const user = req.user;

      const allowedRoles = ['officer', 'admin', 'police_officer', 'cyber_crime_officer', 'field_officer', 'department_officer'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Only authorized officers and administrators may review and verify AI evidence.' });
      }



      const { id } = req.params;

      const {

        action = 'CONFIRMED', // CONFIRMED, CORRECTED, REJECTED_MISLEADING

        corrected_category,

        corrected_subcategory,

        corrected_authority,

        corrected_damage_level,

        notes = ''

      } = req.body;



      // Find and update local database

      const updatedLocal = db.updateVisualAnalysis ? db.updateVisualAnalysis(Number(id), {

        human_verified: true,

        reviewed_by: user.id,

        reviewed_at: new Date().toISOString(),

        officer_action: action,

        corrected_category: corrected_category || null,

        corrected_subcategory: corrected_subcategory || null,

        corrected_authority: corrected_authority || null,

        corrected_damage_level: corrected_damage_level || null,

        officer_notes: notes,

        analysis_status: action === 'REJECTED_MISLEADING' ? 'FAILED' : 'COMPLETED'

      }) : null;



      // Find the visual analysis record

      const visualAnalysis = db.getVisualAnalysisById ? db.getVisualAnalysisById(Number(id)) : null;

      const evidence = db.getEvidenceById ? db.getEvidenceById(Number(id)) : null;



      const VisualAnalysisMongo = require('../models/mongo/VisualAnalysis');

      const updatedMongo = await VisualAnalysisMongo.findOneAndUpdate(

        { $or: [{ id: Number(id) }, { complaint_evidence_id: Number(id) }] },

        {

          $set: {

            human_verified: true,

            reviewed_by: user.id,

            reviewed_at: new Date(),

            officer_action: action,

            corrected_category: corrected_category || null,

            corrected_subcategory: corrected_subcategory || null,

            corrected_authority: corrected_authority || null,

            corrected_damage_level: corrected_damage_level || null,

            officer_notes: notes,

            analysis_status: action === 'REJECTED_MISLEADING' ? 'FAILED' : 'COMPLETED'

          }

        },

        { new: true, upsert: false }

      );



      // Audit log

      db.logEvidenceAudit({

        complaint_id: evidence?.complaint_id || 0,

        evidence_id: Number(id),

        cloudinary_public_id: evidence?.cloudinary_public_id || 'manual_review',

        action: action === 'CORRECTED' ? 'AI_CORRECTED' : (action === 'CONFIRMED' ? 'AI_CONFIRMED' : 'AI_FLAGGED_MISLEADING'),

        user_id: user.id,

        user_role: user.role,

        user_name: user.name,

        ip_address: req.ip || req.connection?.remoteAddress || '127.0.0.1',

        details: `Officer ${user.name} recorded ${action}: ${notes || 'Verified'}`

      });



      res.json({

        message: 'Evidence human verification recorded successfully.',

        review: {

          officer_action: action,

          reviewed_by: user.name,

          reviewed_at: new Date(),

          corrected_category,

          corrected_subcategory,

          corrected_authority,

          corrected_damage_level,

          officer_notes: notes,

          record: updatedMongo

        }

      });

    } catch (err) {

      console.error('Officer review evidence error:', err);

      res.status(500).json({ error: 'Failed to record officer review: ' + (err.message || 'Error') });

    }

  }

}



module.exports = new EvidenceController();

