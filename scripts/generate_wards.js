const fs = require('fs');
const path = require('path');

const ulbs = JSON.parse(fs.readFileSync(path.join(__dirname, '../location-data/urban_local_bodies.json'), 'utf-8'));

let wardId = 1;
const wards = [];

for (const ulb of ulbs) {
  const total = ulb.total_wards || 20;
  for (let w = 1; w <= total; w++) {
    wards.push({
      id: wardId++,
      ulb_id: ulb.id,
      ward_number: w,
      name: `Ward ${w}`,
      code: `${ulb.code}-W${w}`,
      is_active: 1
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, '../location-data/wards.json'),
  JSON.stringify(wards, null, 2),
  'utf-8'
);

console.log(`Generated ${wards.length} wards across ${ulbs.length} Urban Local Bodies.`);
