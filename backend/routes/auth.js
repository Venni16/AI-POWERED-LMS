import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { FailedLoginAttempt } from '../models/FailedLoginAttempt.js';
import { createAuditLog, authenticate } from '../middleware/auth.js';
import { upload } from '../utils/fileUpload.js';
import { FileUpload } from '../utils/fileUpload.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatar_url,
        profile: {
          bio: req.user.bio,
          specialization: req.user.specialization
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, upload.single('avatar'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('specialization').optional().trim().isLength({ max: 100 }).withMessage('Specialization must be less than 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, bio, specialization } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    let avatarUrl = req.user.avatar_url;

    // Handle avatar upload if file is provided
    if (req.file) {
      try {
        const uploadResult = await FileUpload.uploadAvatar(req.file, userId);
        avatarUrl = uploadResult.publicUrl;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload avatar' });
      }
    }

    // Update user profile
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (avatarUrl !== req.user.avatar_url) updateData.avatar_url = avatarUrl;

    const updatedUser = await User.update(userId, updateData);

    await createAuditLog(req, 'PROFILE_UPDATE', 'USER', { userId });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatar_url,
        profile: {
          bio: updatedUser.bio,
          specialization: updatedUser.specialization
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// Regular email/password registration (optional)
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password using bcrypt directly
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student'
    });

    // Create token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await createAuditLog(req, 'REGISTER', 'USER', { userId: user.id, email });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Supabase Auth callback handler
router.post('/supabase-auth', async (req, res) => {
  try {
    const { access_token, refresh_token, user: supabaseUser } = req.body;

    console.log('Supabase auth request received:', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      hasUser: !!supabaseUser,
      userEmail: supabaseUser?.email
    });

    if (!supabaseUser || !access_token) {
      console.error('Missing required auth data');
      return res.status(400).json({ error: 'Invalid auth data' });
    }

    const { email, user_metadata } = supabaseUser;
    console.log('Processing user:', { email, user_metadata });

    if (!email) {
      console.error('No email in supabase user data');
      return res.status(400).json({ error: 'Email is required' });
    }

    const name = user_metadata?.full_name || user_metadata?.name || email.split('@')[0];
    const avatarUrl = user_metadata?.avatar_url || user_metadata?.picture;

    console.log('Extracted user data:', { name, avatarUrl });

    // Find or create user
    let user = await User.findByEmail(email);
    console.log('Existing user found:', !!user);

    if (!user) {
      console.log('Creating new user');
      // Create new user with Supabase Auth
      user = await User.create({
        name,
        email,
        avatarUrl,
        role: 'student'
      });
      console.log('New user created:', user.id);
    } else {
      console.log('Updating existing user');
      // Update existing user with latest info
      user = await User.update(user.id, {
        name,
        avatar_url: avatarUrl
      });
      console.log('User updated:', user.id);
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('JWT token created for user:', user.id);

    await createAuditLog(req, 'SUPABASE_LOGIN', 'USER', { userId: user.id, email });

    console.log('Auth successful, sending response');
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Supabase auth error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Regular login (optional)
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    const user = await User.findByEmail(email);
    console.log('User found:', user ? { id: user.id, email: user.email, hasPassword: !!user.password, isActive: user.is_active } : 'No user found');

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(400).json({ error: 'Account deactivated' });
    }

    // Check if user has a password (not Google-only account)
    if (!user.password) {
      console.log('User has no password (likely Google-only account)');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    let isPasswordValid = false;

    // Check if password is hashed (bcrypt hash starts with $2a$, $2b$, or $2y$)
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');

    if (isHashed) {
      // Use bcrypt compare for hashed passwords
      isPasswordValid = await User.verifyPassword(password, user.password);
      console.log('Password verification result (hashed):', isPasswordValid);
    } else {
      // Plain text password (for backward compatibility)
      isPasswordValid = password === user.password;
      console.log('Password verification result (plain):', isPasswordValid);

      // If valid, hash the password for future logins
      if (isPasswordValid) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);
        await User.update(user.id, { password: hashedPassword });
        console.log('Password hashed and updated for user:', user.id);
      }
    }

    console.log('Password hash in DB:', user.password ? user.password.substring(0, 10) + '...' : 'null');

    if (!isPasswordValid) {
      console.log('Password verification failed');

      // Record failed login attempt
      try {
        await FailedLoginAttempt.create({
          email,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        });

        // Check if user has exceeded failed login attempts (3 attempts in 15 minutes)
        const recentAttempts = await FailedLoginAttempt.countRecentAttempts(email, 15);
        console.log(`Failed login attempts for ${email}: ${recentAttempts + 1}`);

        if (recentAttempts >= 2) { // +1 for the current attempt
          // Deactivate the account
          await User.update(user.id, { is_active: false });
          await createAuditLog(req, 'ACCOUNT_LOCKED', 'USER', {
            userId: user.id,
            email,
            reason: 'Too many failed login attempts'
          });

          return res.status(400).json({
            error: 'Due to security concerns, your account has been deactivated. Please contact the admin.'
          });
        }
      } catch (attemptError) {
        console.error('Error recording failed login attempt:', attemptError);
      }

      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await createAuditLog(req, 'LOGIN', 'USER', { userId: user.id, email });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Password hashing helper
async function hashPassword(password) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hashedPassword) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}

export default router;
