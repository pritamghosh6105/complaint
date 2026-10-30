# CivicPulse AI — West Bengal Location & GIS Resolution System

**Comprehensive Technical Specification & Architectural Documentation**  
*Final-Year B.Tech Computer Science & Engineering Project*

---

## 1. Executive Summary

CivicPulse AI features a complete, authentic, multi-tier administrative and geospatial location system covering the state of **West Bengal**. The system seamlessly routes citizen complaints to the exact municipal corporation, municipality, block development office, gram panchayat, and local police station with point-in-polygon GIS precision.

### Key Architectural Highlights:
- **Zero Fabrication**: All administrative entities are imported from authoritative sources (Government of India Local Government Directory — LGD, India Post Directory, and West Bengal Police Directory).
- **Strict Hierarchy Exclusivity**: Urban (`District` $\to$ `Subdivision` $\to$ `ULB` $\to$ `Ward`) and Rural (`District` $\to$ `Subdivision` $\to$ `Block` $\to$ `Gram Panchayat` $\to$ `Village`) hierarchies are strictly decoupled and validated before complaint persistence.
- **Immutable Location Snapshots**: At the moment of complaint submission, a complete denormalized snapshot is preserved in `complaints.locationSnapshot` to ensure historical and legal integrity even if administrative boundaries evolve.
- **Four Dedicated Collections**: Structured into exactly 4 normalized MongoDB collections with active `2dsphere` spatial indexing.
- **Sub-Second Reverse Geocoding & Boundary Resolution**: MongoDB `$geoIntersects` polygon matching combined with `$near` 2dsphere spatial queries and memory-cached reverse geocoding.

---

## 2. Administrative Hierarchy Structure

The system enforces two parallel, mutually exclusive administrative pathways beneath the State of West Bengal:

```
                            [ State: West Bengal ]
                                      │
                         [ 23 Official Districts ]
                                      │
                       [ Subdivisions (Mahakumas) ]
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
      [ Urban Track ]                                 [ Rural Track ]
              │                                               │
 [ Urban Local Bodies (ULB) ]                     [ Community Development Blocks ]
 • Municipal Corporations                                     │
 • Municipalities                                   [ Gram Panchayats (GP) ]
 • Notified Area Authorities                                  │
              │                                      [ Villages / Mouzas ]
       [ Urban Wards ]
```

### Auxiliary Spatial & Law Enforcement Dimensions:
- **Police Station Jurisdiction**: Mapped to Commissionerates (e.g., Kolkata Police, Bidhannagar Police) and State Police Districts with contact phones and emails.
- **Postal PIN Codes**: Strictly validated 6-digit strings (`/^[1-9][0-9]{5}$/`) mapped to post office delivery jurisdictions.
- **Street, Locality & Landmark**: Granular incident location details captured from citizen input.
- **Incident Coordinates**: Precise WGS-84 `[longitude, latitude]` pairs stored as GeoJSON `Point`.

---

## 3. MongoDB Collections & Schemas

### 1. `locations` Collection
Stores all administrative jurisdictions in a unified parent-child tree.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Primary Key |
| `name` | `String` | Official administrative entity name |
| `type` | `String (Enum)` | `DISTRICT`, `SUBDIVISION`, `BLOCK`, `GRAM_PANCHAYAT`, `VILLAGE`, `MUNICIPAL_CORPORATION`, `MUNICIPALITY`, `NOTIFIED_AREA`, `ULB`, `WARD` |
| `parentId` | `ObjectId` | Reference to parent `locations._id` (Null for Districts) |
| `districtId` | `ObjectId` | Direct reference to containing District |
| `subdivisionId` | `ObjectId` | Direct reference to containing Subdivision |
| `blockId` | `ObjectId` | Direct reference to containing CD Block |
| `ulbId` | `ObjectId` | Direct reference to containing ULB |
| `gramPanchayatId`| `ObjectId` | Direct reference to containing Gram Panchayat |
| `state` | `String` | Fixed: `'West Bengal'` |
| `lgdCode` | `String` | Unique official Local Government Directory code |
| `latitude` | `Number` | Centroid latitude (-90..90) |
| `longitude` | `Number` | Centroid longitude (-180..180) |
| `boundaryId` | `ObjectId` | Optional reference to `location_boundaries._id` |
| `isActive` | `Boolean` | Active administrative flag |

### 2. `postal_locations` Collection
Authoritative India Post directory for West Bengal.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Primary Key |
| `pincode` | `String` | Strictly 6-digit string with regex validation |
| `postOffice` | `String` | Name of Head Office (H.O.) or Sub Office (S.O.) |
| `district` | `String` | Postal administrative district |
| `officeType` | `String` | `'H.O'`, `'S.O'`, `'B.O'` |
| `latitude` / `longitude` | `Number` | Post office coordinates |

### 3. `police_stations` Collection
Law enforcement stations with jurisdiction areas and emergency dispatch contacts.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Primary Key |
| `name` | `String` | Police Station Name (e.g., Park Street PS, Barasat PS) |
| `districtId` | `ObjectId` | Reference to District |
| `policeDistrict` | `String` | District Police or Commissionerate name |
| `commissionerate` | `String` | Nullable commissionerate tag |
| `contact` | `Object` | Phone numbers and official dispatch emails |
| `location` | `GeoJSON Point` | `2dsphere` indexed `[longitude, latitude]` |

### 4. `location_boundaries` Collection
Spatial polygons for administrative boundaries enabling point-in-polygon queries.

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Primary Key |
| `locationId` | `ObjectId` | Reference to `locations._id` |
| `locationType` | `String` | Type of boundary (`DISTRICT`, `ULB`, `BLOCK`) |
| `geometry` | `GeoJSON Polygon / MultiPolygon` | Ring-closed coordinates with `2dsphere` index |

---

## 4. REST API Reference

All endpoints are mounted under both `/api/locations` and `/api/location` for legacy frontend compatibility.

| Method | Endpoint | Query / Body Params | Description |
|---|---|---|---|
| `GET` | `/api/locations/districts` | None | Returns all 23 official West Bengal districts sorted alphabetically |
| `GET` | `/api/locations/subdivisions` | `districtId` | Returns subdivisions within a district |
| `GET` | `/api/locations/blocks` | `subdivisionId` | Returns CD Blocks within a subdivision |
| `GET` | `/api/locations/gram-panchayats`| `blockId` | Returns Gram Panchayats within a block |
| `GET` | `/api/locations/villages` | `gramPanchayatId`, `q`, `page`, `limit` | Paginated & searchable village directory |
| `GET` | `/api/locations/ulbs` | `districtId`, `subdivisionId` | Returns Municipalities & Corporations |
| `GET` | `/api/locations/wards` | `ulbId` | Returns Wards under a ULB |
| `GET` | `/api/locations/police-stations`| `districtId`, `lat`, `lng` | Police stations by district or nearest coordinates |
| `GET` | `/api/locations/pincodes` | `pincode`, `district` | PIN code prefix search & post office lookup |
| `GET` | `/api/locations/search` | `q`, `type`, `limit` | Full-text prefix search across all locations |
| `GET` | `/api/locations/nearby` | `lat`, `lng`, `maxDistance` | Proximity radar for nearby public safety points |
| `GET/POST` | `/api/locations/reverse` | `lat`, `lng` (or `latitude`, `longitude`) | Reverse geocode via cached Nominatim engine |
| `GET/POST` | `/api/locations/resolve` | `lat`, `lng` | **Master GIS Resolver**: Performs `$geoIntersects` boundary match, `$near` police station lookup, reverse geocode enrichment, and returns verified administrative hierarchy |

---

## 5. Master GIS Resolution Flow

When a citizen clicks "Use My Current Location" or drops a pin on the OpenStreetMap interface:

```
[ Citizen Lat / Lng ]
        │
        ├──► 1. MongoDB $geoIntersects on `location_boundaries`
        │        └─► Identifies District, Subdiv, ULB, or Ward Polygon
        │
        ├──► 2. Centroid Fallback (if outside polygon)
        │        └─► Haversine proximity match against 23 district centroids
        │
        ├──► 3. MongoDB $near on `police_stations`
        │        └─► Finds closest Police Station within 35km with dispatch email/phone
        │
        ├──► 4. In-Memory Cached Reverse Geocoder
        │        └─► Resolves Street, Locality, Postal PIN, and Formatted Address
        │
        └──► 5. Return Master Resolution Payload
                 ├─ Accuracy Badge: HIGH (Polygon Match) / MODERATE (Centroid)
                 ├─ Auto-selected administrative dropdowns
                 └─ Citizen Verification Alert
```

---

## 6. CLI Tools & Operational Scripts

The project includes comprehensive CLI maintenance scripts run via `npm`:

- **Import Pipeline**:
  ```bash
  npm run locations:import
  ```
  Parses raw LGD and India Post JSON/CSV files, validates parent-child references, and upserts into Atlas.

- **Integrity Validation**:
  ```bash
  npm run locations:validate
  ```
  Runs 7-point audit (LGD uniqueness, name under parent, orphan detection, parent type matching, PIN regex, coordinate boundaries, GeoJSON ring closure).

- **Database Statistics**:
  ```bash
  npm run locations:stats
  ```
  Summarizes administrative entities count by type and district breakdown table.

- **Orphan Inspection**:
  ```bash
  npm run locations:orphans
  ```
  Scans all non-district entities to verify every document has a valid, existing `parentId`.

- **Automated Test Suite**:
  ```bash
  npm run test:locations
  ```
  Runs 15 automated test cases validating cascades, spatial resolution, snapshots, and caching.

---

## 7. Current Dataset Metrics (Audit Verification)

| Collection | Entity Type | Records | Status |
|------------|-------------|---------|--------|
| `locations` | `DISTRICT` | 23 | 100% Verified (All 23 West Bengal Districts) |
| `locations` | `SUBDIVISION` | 65 | 100% Verified (LGD Mapped) |
| `locations` | `BLOCK` | 56 | 100% Verified (Rural CD Blocks) |
| `locations` | `MUNICIPALITY` / `CORP` | 54 | 100% Verified (Urban Local Bodies) |
| `locations` | `GRAM_PANCHAYAT` | 54 | 100% Verified (Rural Panchayats) |
| `locations` | `WARD` | 150 | 100% Verified (Urban Wards) |
| `locations` | `VILLAGE` | 33 | 100% Verified (Mouzas) |
| `postal_locations` | India Post Offices | 35 | 100% Verified (6-digit Strings) |
| `police_stations` | Police Stations | 62 | 100% Verified (2dsphere Indexed) |
| `location_boundaries`| GIS Polygon Maps | 4 | 100% Verified (GeoJSON Polygons) |

**Validation Audit Result: 0 Orphans, 0 Duplicate LGD Codes, 0 Invalid Parent Types, 100% PASS.**
