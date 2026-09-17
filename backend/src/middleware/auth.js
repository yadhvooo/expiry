import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'expiry-marketplace-super-secret-key-2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Check if user is still active in database
    const users = await db.query('SELECT id, email, role, status, full_name FROM users WHERE id = $1', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (users[0].status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by administration.' });
    }

    req.currentUser = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: Requires one of roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
}

export default {
  generateToken,
  verifyToken,
  requireRole,
  JWT_SECRET
};
