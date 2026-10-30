const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./csvHelper');
const { Location, LOCATION_TYPES } = require('../models/mongo/Location');

class LgdImporter {
  constructor(options = {}) {
    this.reportDir = options.reportDir || path.resolve(__dirname, '../../../data/import-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Import from file (CSV or JSON)
   */
  async importFile(filePath, defaultType = null) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let records = [];

    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf-8');
      records = parseCsv(content);
    } else if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      records = Array.isArray(parsed) ? parsed : (parsed.records || parsed.data || [parsed]);
    } else {
      throw new Error(`Unsupported file extension ${ext}. Please provide a .csv or .json file.`);
    }

    return await this.processRecords(records, path.basename(filePath), defaultType);
  }

  /**
   * Import all files in a directory
   */
  async importDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.csv') || f.endsWith('.json'));
    const combinedReport = {
      timestamp: new Date().toISOString(),
      directory: dirPath,
      filesProcessed: files.length,
      totals: {
        inserted: 0,
        updated: 0,
        skipped: 0,
        duplicates: 0,
        invalidParent: 0,
        missingCode: 0,
        errors: 0
      },
      fileReports: []
    };

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const rep = await this.importFile(filePath);
      combinedReport.fileReports.push(rep);
      combinedReport.totals.inserted += rep.inserted;
      combinedReport.totals.updated += rep.updated;
      combinedReport.totals.skipped += rep.skipped;
      combinedReport.totals.duplicates += rep.duplicates;
      combinedReport.totals.invalidParent += rep.invalidParent;
      combinedReport.totals.missingCode += rep.missingCode;
      combinedReport.totals.errors += rep.errors.length;
    }

    const repPath = path.join(this.reportDir, `lgd_dir_import_${Date.now()}.json`);
    fs.writeFileSync(repPath, JSON.stringify(combinedReport, null, 2));
    console.log(`📁 Directory import report saved: ${repPath}`);
    return combinedReport;
  }

  /**
   * Normalize and process records into MongoDB Location collection
   */
  async processRecords(records, filename, defaultType = null) {
    const report = {
      filename,
      timestamp: new Date().toISOString(),
      totalRecords: records.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      duplicates: 0,
      invalidParent: 0,
      missingCode: 0,
      errors: []
    };

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      try {
        const item = this.normalizeRecord(raw, defaultType, filename);
        if (!item.name) {
          report.skipped++;
          continue;
        }

        if (!item.lgdCode) {
          report.missingCode++;
        }

        // Validate and resolve parent reference
        let parentDoc = null;
        if (item.parentLgdCode) {
          parentDoc = await Location.findOne({ lgdCode: String(item.parentLgdCode).trim() });
          if (!parentDoc && item.parentName) {
            parentDoc = await Location.findOne({ name: new RegExp(`^${item.parentName.trim()}$`, 'i') });
          }
          if (!parentDoc) {
            report.invalidParent++;
          }
        } else if (item.parentName) {
          parentDoc = await Location.findOne({ name: new RegExp(`^${item.parentName.trim()}$`, 'i') });
          if (!parentDoc && item.type !== 'DISTRICT') {
            report.invalidParent++;
          }
        }

        const parentId = parentDoc ? parentDoc._id : null;

        // Build hierarchy references
        const hierarchyRefs = {
          districtId: null,
          subdivisionId: null,
          blockId: null,
          gramPanchayatId: null,
          villageId: null,
          ulbId: null,
          wardId: null
        };

        if (item.type === 'DISTRICT') {
          // self is district
        } else if (parentDoc) {
          if (parentDoc.type === 'DISTRICT') {
            hierarchyRefs.districtId = parentDoc._id;
          } else {
            hierarchyRefs.districtId = parentDoc.districtId || null;
            hierarchyRefs.subdivisionId = parentDoc.subdivisionId || null;
            hierarchyRefs.blockId = parentDoc.blockId || null;
            hierarchyRefs.gramPanchayatId = parentDoc.gramPanchayatId || null;
            hierarchyRefs.ulbId = parentDoc.ulbId || null;
          }

          if (item.type === 'SUBDIVISION') hierarchyRefs.subdivisionId = null;
          if (item.type === 'BLOCK') hierarchyRefs.subdivisionId = parentDoc._id;
          if (item.type === 'GRAM_PANCHAYAT') hierarchyRefs.blockId = parentDoc._id;
          if (item.type === 'VILLAGE') hierarchyRefs.gramPanchayatId = parentDoc._id;
          if (['MUNICIPALITY', 'MUNICIPAL_CORPORATION', 'NOTIFIED_AREA', 'ULB'].includes(item.type)) {
            hierarchyRefs.subdivisionId = parentDoc._id;
          }
          if (item.type === 'WARD') hierarchyRefs.ulbId = parentDoc._id;
        }

        // Upsert Query: preferably by lgdCode when present, otherwise by (type, parentId, name)
        let query = null;
        if (item.lgdCode) {
          query = { lgdCode: String(item.lgdCode).trim() };
        } else {
          query = { name: item.name, type: item.type, parentId: parentId };
        }

        const updateData = {
          name: item.name,
          type: item.type,
          parentId: parentId,
          state: 'West Bengal',
          ...hierarchyRefs,
          lgdCode: item.lgdCode ? String(item.lgdCode).trim() : null,
          latitude: typeof item.latitude === 'number' && !isNaN(item.latitude) ? item.latitude : null,
          longitude: typeof item.longitude === 'number' && !isNaN(item.longitude) ? item.longitude : null,
          source: 'Government of India LGD',
          sourceUpdatedAt: new Date(),
          isActive: true
        };

        const existing = await Location.findOne(query);
        if (existing) {
          await Location.updateOne({ _id: existing._id }, { $set: updateData });
          report.updated++;
        } else {
          await Location.create(updateData);
          report.inserted++;
        }
      } catch (err) {
        report.errors.push({ row: i + 1, error: err.message, record: raw });
      }
    }

    const repFile = path.join(this.reportDir, `lgd_${filename.replace(/[^a-z0-9_-]/gi, '_')}_report.json`);
    fs.writeFileSync(repFile, JSON.stringify(report, null, 2));
    console.log(`✓ LGD Import complete for ${filename}: Inserted=${report.inserted}, Updated=${report.updated}, Skipped=${report.skipped}, InvalidParent=${report.invalidParent}, Errors=${report.errors.length}`);
    return report;
  }

  normalizeRecord(raw, defaultType, filename) {
    const keys = Object.keys(raw);
    const getVal = (patterns) => {
      for (const p of patterns) {
        for (const k of keys) {
          if (k.toLowerCase().includes(p)) {
            const v = String(raw[k] || '').trim();
            if (v && v.toLowerCase() !== 'null' && v.toLowerCase() !== 'undefined') return v;
          }
        }
      }
      return null;
    };

    // Determine type
    let type = defaultType;
    if (!type) {
      const lowerFile = filename.toLowerCase();
      if (lowerFile.includes('district')) type = 'DISTRICT';
      else if (lowerFile.includes('subdivision') || lowerFile.includes('sub_district')) type = 'SUBDIVISION';
      else if (lowerFile.includes('block')) type = 'BLOCK';
      else if (lowerFile.includes('panchayat') || lowerFile.includes('gp')) type = 'GRAM_PANCHAYAT';
      else if (lowerFile.includes('village') || lowerFile.includes('mouza')) type = 'VILLAGE';
      else if (lowerFile.includes('ward')) type = 'WARD';
      else if (lowerFile.includes('urban') || lowerFile.includes('ulb') || lowerFile.includes('municipality')) type = 'MUNICIPALITY';
      else type = (raw.type || raw.entity_type || 'DISTRICT').toUpperCase();
    }

    // Name
    const name = getVal(['entity_name', 'district_name', 'subdivision_name', 'block_name', 'gp_name', 'panchayat_name', 'village_name', 'ulb_name', 'ward_name', 'name']);

    // LGD Code
    const lgdCode = getVal(['lgd_code', 'census_code', 'code', 'district_code', 'block_code', 'gp_code', 'village_code', 'ulb_code']);

    // Parent LGD code or name
    const parentLgdCode = getVal(['parent_lgd_code', 'district_lgd_code', 'subdivision_lgd_code', 'block_lgd_code', 'gp_lgd_code', 'ulb_lgd_code', 'parent_code']);
    const parentName = getVal(['parent_name', 'district_name_parent', 'district', 'subdivision', 'block', 'gram_panchayat', 'ulb']);

    // Coordinates
    const latStr = getVal(['center_lat', 'latitude', 'lat']);
    const lngStr = getVal(['center_lng', 'longitude', 'lng', 'long']);
    const latitude = latStr ? parseFloat(latStr) : null;
    const longitude = lngStr ? parseFloat(lngStr) : null;

    return {
      name,
      type: LOCATION_TYPES.includes(type) ? type : 'DISTRICT',
      lgdCode,
      parentLgdCode,
      parentName,
      latitude,
      longitude
    };
  }
}

module.exports = LgdImporter;
