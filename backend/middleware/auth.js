import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    if (!user.is_active && user.is_active !== undefined) {
      return res.status(401).json({ error: 'Account deactivated.' });
    }

    req.user = {
      ...user,
      _id: user.id // Add _id for backward compatibility
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

export const createAuditLog = async (req, action, resource, details = {}) => {
  try {
    const { AuditLog } = await import('../models/AuditLog.js');

    // Check if req.user exists (for public routes)
    if (!req.user) {
      console.log('No user found for audit log - skipping');
      return;
    }

    await AuditLog.create({
      userId: req.user.id,
      action,
      resource,
      details,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
