const mongoose = require('mongoose');
require('dotenv').config();

const PoliceStation = require('../src/models/mongo/PoliceStation');
const PostalLocation = require('../src/models/mongo/PostalLocation');
const { Location } = require('../src/models/mongo/Location');
const geocodingService = require('../src/services/geocodingService');

async function enrichPoliceStations() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  const stations = await PoliceStation.find({});
  console.log(`Found ${stations.length} police stations to enrich.`);

  const allDistricts = await Location.find({ type: 'DISTRICT', isActive: true }).lean();

  let updatedCount = 0;

  for (const ps of stations) {
    const addr = ps.address || '';
    const pinMatch = addr.match(/\b([1-9][0-9]{5})\b/);
    let resolvedDistrictName = null;

    if (pinMatch) {
      const pin = pinMatch[1];
      const postDoc = await PostalLocation.findOne({ pincode: pin }).lean();
      if (postDoc && postDoc.district) {
        resolvedDistrictName = postDoc.district;
      }
    }

    // Fallback: check district name in address
    if (!resolvedDistrictName) {
      for (const d of allDistricts) {
        const dName = d.name.toLowerCase();
        if (addr.toLowerCase().includes(dName)) {
          resolvedDistrictName = d.name;
          break;
        }
      }
    }

    let districtDoc = null;
    if (resolvedDistrictName) {
      const cleanName = resolvedDistrictName.toLowerCase().replace(/district|\(n\)|\(s\)/gi, '').trim();
      districtDoc = allDistricts.find(d => 
        d.name.toLowerCase() === resolvedDistrictName.toLowerCase() ||
        d.name.toLowerCase().includes(cleanName)
      );
    }

    const updates = {};
    if (districtDoc) {
      updates.districtId = districtDoc._id;
      if (!ps.commissionerate) {
        updates.policeDistrict = `${districtDoc.name} District Police`;
      }
    } else if (resolvedDistrictName) {
      updates.policeDistrict = `${resolvedDistrictName} District Police`;
    }

    // Check if coordinates are dummy (88.3639, 22.5726)
    const isDummy = !ps.location?.coordinates || 
      (Math.abs(ps.location.coordinates[0] - 88.3639) < 0.001 && Math.abs(ps.location.coordinates[1] - 22.5726) < 0.001);

    if (isDummy && addr) {
      try {
        const geo = await geocodingService.forwardGeocode(addr);
        if (geo && geo.latitude && geo.longitude) {
          updates.location = {
            type: 'Point',
            coordinates: [geo.longitude, geo.latitude]
          };
          console.log(`  ✓ Geocoded ${ps.name}: [${geo.longitude}, ${geo.latitude}]`);
        }
      } catch (err) {
        // keep fallback or district centroid
        if (districtDoc?.longitude && districtDoc?.latitude) {
          updates.location = {
            type: 'Point',
            coordinates: [districtDoc.longitude, districtDoc.latitude]
          };
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await PoliceStation.updateOne({ _id: ps._id }, { $set: updates });
      updatedCount++;
    }
  }

  console.log(`Successfully enriched ${updatedCount} police stations.`);
  process.exit(0);
}

enrichPoliceStations().catch(err => {
  console.error('Enrichment error:', err);
  process.exit(1);
});
