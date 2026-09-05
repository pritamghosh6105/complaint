# MongoDB Atlas Cloud Database Setup Guide

CivicPulse AI now has full native support for **MongoDB Atlas** using **Mongoose** with 2dsphere GeoJSON spatial indexing.

---

## Step 1: Create a Free MongoDB Atlas Account & Cluster (2 Minutes)

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. Click **Build a Database** and select the **M0 Free (Shared)** tier.
3. Choose your nearest cloud region (e.g. AWS Mumbai, Frankfurt, Singapore, or N. Virginia).
4. Click **Create Deployment**.

---

## Step 2: Set Up Database User & Network Access

1. In the **Security Quickstart** prompt:
   - **Username**: Create a username (e.g., `civicpulse_admin`)
   - **Password**: Create a secure password (e.g., `CivicPulse@2026`)
   - Click **Create User**.
2. Under **Where would you like to connect from?**:
   - Choose **My Local Environment**
   - Click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** so your laptop can connect from any network or Wi-Fi.
   - Click **Finish and Close**.

---

## Step 3: Copy Your Connection String

1. In your Atlas dashboard, click **Connect** on your cluster.
2. Select **Drivers** (Node.js).
3. Copy the connection URI provided:
   ```text
   mongodb+srv://civicpulse_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
4. Replace `<password>` with the password you created in Step 2, and add `/civicpulse` after `.net/`:
   ```text
   mongodb+srv://civicpulse_admin:CivicPulse@2026@cluster0.abcde.mongodb.net/civicpulse?retryWrites=true&w=majority
   ```

---

## Step 4: Add URI to `backend/.env`

Open [`backend/.env`](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/backend/.env) and paste your URI:

```env
PORT=5000
JWT_SECRET=civicpulse_ai_secure_jwt_secret_token_2026_xyz
ML_SERVICE_URL=http://localhost:8000

# MongoDB Atlas URI
MONGODB_URI=mongodb+srv://civicpulse_admin:CivicPulse@2026@cluster0.abcde.mongodb.net/civicpulse?retryWrites=true&w=majority
```

---

## Step 5: Seed MongoDB Atlas & Start

### 1. Seed your MongoDB Atlas cluster:
Open PowerShell in the `backend/` folder and run:
```powershell
npm run seed:mongo
```
*Output:*
```text
🌱 Connecting to MongoDB Atlas...
✓ Connected to MongoDB Atlas successfully.
✓ MongoDB Atlas Database Successfully Seeded!
  - 10 Municipal Departments
  - 8 Demo Accounts (Admin, Officers, Citizens)
  - 3 Geolocated Incident Documents with GeoJSON & SLA
```

### 2. Start the Backend:
```powershell
npm start
```
*Console log:*
```text
=======================================================
🚀 Citizen Complaint API Server running on port 5000
🌐 Health endpoint: http://localhost:5000/api/health
🗄️ Database status: http://localhost:5000/api/database/status
=======================================================
⚡ [MongoDB Atlas] Connecting to MongoDB cluster...
✓ [MongoDB Atlas] Successfully connected to: cluster0.xxxxx.mongodb.net/civicpulse
✓ [MongoDB Atlas] Synced 3 complaints, 8 users, 10 departments.
```

---

## Check Live Database Status Anytime:
Visit `http://localhost:5000/api/database/status` in your browser to verify:
```json
{
  "activeEngine": "MongoDB Atlas (Cloud)",
  "connected": true,
  "host": "cluster0.xxxxx.mongodb.net",
  "database": "civicpulse",
  "collections": ["departments", "users", "complaints", "complaint_timeline", "feedback", "notifications"]
}
```

> [!NOTE]
> If `MONGODB_URI` is left blank, the system automatically falls back to local embedded JSON storage so you can always work offline without disruption.
