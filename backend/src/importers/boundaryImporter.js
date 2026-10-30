const fs = require('fs');
const path = require('path');
const LocationBoundary = require('../models/mongo/LocationBoundary');
const { Location } = require('../models/mongo/Location');

class BoundaryImporter {
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

    const content = fs.readFileSync(filePath, 'utf-8');
    let geojson;
    try {
      geojson = JSON.parse(content);
    } catch (e) {
      throw new Error(`Invalid JSON file: ${e.message}`);
    }

    const features = geojson.type === 'FeatureCollection' 
      ? geojson.features 
      : (geojson.type === 'Feature' ? [geojson] : [{ geometry: geojson, properties: {} }]);

    const report = {
      filename: path.basename(filePath),
      timestamp: new Date().toISOString(),
      totalFeatures: features.length,
      inserted: 0,
      updated: 0,
      rejected: 0,
      errors: []
    };

    for (let i = 0; i < features.length; i++) {
      const feat = features[i];
      try {
        const geom = feat.geometry || feat;
        const props = feat.properties || {};

        // Geometry validity check
        if (!geom || !['Polygon', 'MultiPolygon'].includes(geom.type)) {
          report.rejected++;
          report.errors.push({ featureIndex: i, error: `Invalid geometry type: ${geom?.type}. Must be Polygon or MultiPolygon.` });
          continue;
        }

        if (!Array.isArray(geom.coordinates) || geom.coordinates.length === 0) {
          report.rejected++;
          report.errors.push({ featureIndex: i, error: 'Empty geometry coordinates.' });
          continue;
        }

        // Validate coordinate range
        const isValidCoords = this.validateCoordinates(geom.type, geom.coordinates);
        if (!isValidCoords) {
          report.rejected++;
          report.errors.push({ featureIndex: i, error: 'Coordinates contain points outside [-180..180, -90..90] bounds or unclosed ring.' });
          continue;
        }

        // Match with location
        let locationDoc = null;
        if (props.locationId) {
          locationDoc = await Location.findById(props.locationId);
        }
        if (!locationDoc && props.lgdCode) {
          locationDoc = await Location.findOne({ lgdCode: String(props.lgdCode).trim() });
        }
        if (!locationDoc && props.name) {
          locationDoc = await Location.findOne({ name: new RegExp(`^${props.name.trim()}$`, 'i') });
        }

        if (!locationDoc) {
          report.rejected++;
          report.errors.push({ featureIndex: i, error: `Could not match boundary to any existing location (name=${props.name}, lgdCode=${props.lgdCode})` });
          continue;
        }

        const updateData = {
          locationId: locationDoc._id,
          locationType: locationDoc.type,
          geometry: {
            type: geom.type,
            coordinates: geom.coordinates
          },
          source: props.source || 'Official West Bengal GIS Boundary Dataset',
          sourceUpdatedAt: new Date()
        };

        const existing = await LocationBoundary.findOne({ locationId: locationDoc._id });
        if (existing) {
          await LocationBoundary.updateOne({ _id: existing._id }, { $set: updateData });
          await Location.updateOne({ _id: locationDoc._id }, { $set: { boundaryId: existing._id } });
          report.updated++;
        } else {
          const created = await LocationBoundary.create(updateData);
          await Location.updateOne({ _id: locationDoc._id }, { $set: { boundaryId: created._id } });
          report.inserted++;
        }
      } catch (err) {
        report.errors.push({ featureIndex: i, error: err.message });
        report.rejected++;
      }
    }

    const repFile = path.join(this.reportDir, `boundary_report_${Date.now()}.json`);
    fs.writeFileSync(repFile, JSON.stringify(report, null, 2));
    console.log(`✓ Boundary Import Complete: Inserted=${report.inserted}, Updated=${report.updated}, Rejected=${report.rejected}, Errors=${report.errors.length}`);
    return report;
  }

  validateCoordinates(type, coordinates) {
    try {
      const checkRing = (ring) => {
        if (!Array.isArray(ring) || ring.length < 4) return false;
        // Ring must be closed
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) return false;

        for (const pt of ring) {
          if (!Array.isArray(pt) || pt.length < 2) return false;
          const [lng, lat] = pt;
          if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
        }
        return true;
      };

      if (type === 'Polygon') {
        return coordinates.every(ring => checkRing(ring));
      } else if (type === 'MultiPolygon') {
        return coordinates.every(poly => poly.every(ring => checkRing(ring)));
      }
      return false;
    } catch {
      return false;
    }
  }
}

module.exports = BoundaryImporter;
