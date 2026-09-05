const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

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

      const info = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, ward, department_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name.trim(), email.toLowerCase().trim(), passwordHash, userRole, phone || '', ward || 'Ward 1', deptId);

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
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.prepare(`
        SELECT u.*, d.name as department_name 
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.email = ?
      `).get(email.toLowerCase().trim());

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role, department_id: user.department_id },
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
        ward: user.ward
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
}

module.exports = new AuthController();
