const fs = require('fs');
const path = require('path');
const { parseCsv } = require('./csvHelper');
const PostalLocation = require('../models/mongo/PostalLocation');

class IndiaPostImporter {
  constructor(options = {}) {
    this.reportDir = options.reportDir || path.resolve(__dirname, '../../../data/import-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async importFile(filePath) {
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
      records = Array.isArray(parsed) ? parsed : (parsed.records || [parsed]);
    } else {
      throw new Error(`Unsupported file extension ${ext}. Please provide a .csv or .json file.`);
    }

    const report = {
      filename: path.basename(filePath),
      timestamp: new Date().toISOString(),
      totalRecords: records.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      invalidPin: 0,
      errors: []
    };

    const BATCH_SIZE = 500;
    let batchOps = [];
    const seenPairs = new Set();

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      try {
        const item = this.normalizeRecord(raw);

        // Strict 6-digit PIN validation (must be string, never integer)
        if (!item.pincode || typeof item.pincode !== 'string' || !/^[1-9][0-9]{5}$/.test(item.pincode)) {
          report.invalidPin++;
          report.skipped++;
          continue;
        }

        if (!item.postOffice) {
          report.skipped++;
          continue;
        }

        // Deduplicate within the file
        const pairKey = `${item.pincode}_${item.postOffice.toLowerCase()}`;
        if (seenPairs.has(pairKey)) {
          report.skipped++;
          continue;
        }
        seenPairs.add(pairKey);

        const updateData = {
          pincode: item.pincode,
          postOffice: item.postOffice,
          district: item.district || 'West Bengal',
          state: 'West Bengal',
          officeType: item.officeType || 'S.O',
          latitude: item.latitude,
          longitude: item.longitude,
          source: 'India Post Official Directory',
          sourceUpdatedAt: new Date()
        };

        batchOps.push({
          updateOne: {
            filter: { pincode: item.pincode, postOffice: item.postOffice },
            update: { $set: updateData },
            upsert: true
          }
        });

        if (batchOps.length >= BATCH_SIZE) {
          const bulkRes = await PostalLocation.bulkWrite(batchOps, { ordered: false });
          report.inserted += (bulkRes.upsertedCount || 0);
          report.updated += (bulkRes.modifiedCount || 0);
          batchOps = [];
        }
      } catch (err) {
        report.errors.push({ row: i + 1, error: err.message, record: raw });
      }
    }

    if (batchOps.length > 0) {
      const bulkRes = await PostalLocation.bulkWrite(batchOps, { ordered: false });
      report.inserted += (bulkRes.upsertedCount || 0);
      report.updated += (bulkRes.modifiedCount || 0);
      batchOps = [];
    }

    const repFile = path.join(this.reportDir, `india_post_report_${Date.now()}.json`);
    fs.writeFileSync(repFile, JSON.stringify(report, null, 2));
    console.log(`✓ India Post Import Complete: Total=${report.totalRecords}, Inserted=${report.inserted}, Updated=${report.updated}, Skipped=${report.skipped}, InvalidPin=${report.invalidPin}, Errors=${report.errors.length}`);
    return report;
  }

  normalizeRecord(raw) {
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

    // Ensure PIN is strictly a string
    let pinRaw = getVal(['pincode', 'pin_code', 'postal_code', 'pin']);
    if (pinRaw) {
      pinRaw = pinRaw.replace(/[^0-9]/g, '').trim();
    }

    let postOffice = getVal(['officename', 'post_office', 'office_name', 'postoffice', 'po_name', 'locality']);
    if (postOffice) {
      // Normalize whitespace
      postOffice = postOffice.replace(/\s+/g, ' ').trim();
    }

    let district = getVal(['districtname', 'district_name', 'district', 'dist']);
    if (district) {
      district = district.replace(/\s+/g, ' ').trim();
    }

    const officeType = getVal(['officetype', 'office_type', 'type']) || 'S.O';

    const latStr = getVal(['latitude', 'lat']);
    const lngStr = getVal(['longitude', 'lng', 'long']);
    const latitude = latStr ? parseFloat(latStr) : null;
    const longitude = lngStr ? parseFloat(lngStr) : null;

    return {
      pincode: pinRaw ? String(pinRaw) : null,
      postOffice: postOffice ? String(postOffice) : null,
      district: district ? String(district) : null,
      state: 'West Bengal',
      officeType: String(officeType).trim(),
      latitude: !isNaN(latitude) ? latitude : null,
      longitude: !isNaN(longitude) ? longitude : null
    };
  }
}

module.exports = IndiaPostImporter;
