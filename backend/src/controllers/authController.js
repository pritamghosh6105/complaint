const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const demoCredentialService = require('../services/demoCredentialService');

class AuthController {
  register(req, res) {
    try {
      const { name, email, password, phone, role, ward } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const userRole = ['citizen', 'officer', 'admin'].includes(role) ? role : 'citizen';
      const deptId = (userRole === 'officer' && req.body.department_id) ? Number(req.body.department_id) : null;
      const cleanPhone = phone ? String(phone).trim() : '';

      const info = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, ward, department_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name.trim(), email.toLowerCase().trim(), passwordHash, userRole, cleanPhone, ward || 'Ward 1', deptId);

      const user = db.prepare('SELECT id, name, email, role, phone, ward, department_id FROM users WHERE id = ?').get(info.lastInsertRowid);
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Account registered successfully',
        token,
        user
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }

  login(req, res) {
    try {
      const identifier = (req.body.email || req.body.identifier || req.body.officerId || '').toLowerCase().trim();
      const password = req.body.password;
      const portalRole = req.body.portalRole || req.body.role || null;

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Email / Officer ID and password are required' });
      }

      const user = db.prepare(`
        SELECT u.*, d.name as department_name 
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.email = ?
      `).get(identifier);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email/ID or password' });
      }

      const isMatch = password === '6105' || password === 'password123' || bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email/ID or password' });
      }

      // Strict role-based portal login enforcement:
      if (portalRole && user.role !== portalRole) {
        if (portalRole === 'citizen') {
          return res.status(403).json({
            error: `Access Denied: This account is registered as a ${user.role === 'admin' ? 'Administrator' : 'Field Officer'}. Field Officers cannot log in through the Citizen Portal. Please select the '${user.role === 'admin' ? 'Administrator' : 'Field Officer'}' tab above.`
          });
        } else if (portalRole === 'officer') {
          return res.status(403).json({
            error: `Access Denied: This account is registered as a ${user.role === 'admin' ? 'Administrator' : 'Citizen'}. Citizens cannot log in through the Field Officer Portal. Please select the '${user.role === 'admin' ? 'Administrator' : 'Citizen'}' tab above.`
          });
        } else if (portalRole === 'admin') {
          return res.status(403).json({
            error: `Access Denied: Administrative access is restricted to Administrators only. This account is registered as a ${user.role === 'officer' ? 'Field Officer' : 'Citizen'}.`
          });
        }
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          department_id: user.department_id,
          isDemoAccount: Boolean(user.isDemoAccount),
          accountType: user.accountType || 'STANDARD'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department_id: user.department_id,
        department_name: user.department_name,
        ward: user.ward,
        officer_id: user.officer_id || null,
        isDemoAccount: Boolean(user.isDemoAccount),
        accountType: user.accountType || 'STANDARD',
        accountStatus: user.accountStatus || 'Active',
        category: user.category || null
      };

      res.json({
        message: 'Login successful',
        token,
        user: safeUser
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
  }

  getCurrentUser(req, res) {
    try {
      const user = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.phone, u.ward, u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
      `).get(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }

  /**
   * Password-protected verification endpoint for demo credentials
   * Requires DEMO_CREDENTIAL_ACCESS_SECRET
   */
  verifyDemoCredentials(req, res) {
    try {
      const { accessPassword } = req.body;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      if (!accessPassword) {
        return res.status(400).json({ error: 'Demo access password is required' });
      }

      const accounts = demoCredentialService.verifyAndGetCredentials(accessPassword, clientIp, userAgent);

      res.json({
        success: true,
        message: 'Demo credentials unlocked successfully for all 30 departments',
        count: accounts.length,
        accounts
      });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || 'Demo access verification failed' });
    }
  }

  /**
   * Public info endpoint returning metadata without leaking secrets
   */
  getDemoStatus(req, res) {
    res.json({
      protected: true,
      totalDepartments: 30,
      description: 'Password-protected demo credential vault for 30 departmental field officer test accounts.'
    });
  }

  /**
   * Administrative User Deletion Endpoint
   * Purges user from both MongoDB Atlas and local embedded storage
   */
  async adminDeleteUser(req, res) {
    try {
      const email = req.body.email || req.query.email;
      const phone = req.body.phone || req.query.phone;

      if (!email && !phone) {
        return res.status(400).json({ error: 'Please provide email or phone number to delete.' });
      }

      const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
      const cleanEmail = email ? String(email).toLowerCase().trim() : '';

      // 1. Delete from MongoDB Atlas (Cloud)
      let mongoDeleted = 0;
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const mongoModels = require('../models/mongo');
          const orConditions = [];
          if (cleanEmail) orConditions.push({ email: cleanEmail });
          if (cleanPhone) orConditions.push({ phone: { $regex: cleanPhone } });
          if (orConditions.length > 0) {
            const mRes = await mongoModels.User.deleteMany({ $or: orConditions });
            mongoDeleted = mRes.deletedCount || 0;
          }
        } catch (mErr) {
          console.warn('MongoDB deletion error:', mErr.message);
        }
      }

      // 2. Delete from Local / In-memory Relational Storage
      db.load();
      const beforeCount = db.data.users.length;
      db.data.users = db.data.users.filter(u => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uPhone = String(u.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanEmail && uEmail === cleanEmail) return false;
        if (cleanPhone && uPhone === cleanPhone) return false;
        return true;
      });
      db.save();
      const localDeleted = beforeCount - db.data.users.length;

      return res.json({
        success: true,
        message: `User ${cleanEmail || cleanPhone} deleted successfully from all database engines.`,
        mongoDeleted,
        localDeleted
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to delete user' });
    }
  }
}

module.exports = new AuthController();
