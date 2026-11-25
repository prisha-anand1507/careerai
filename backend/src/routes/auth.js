const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

router.post('/register', limiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!email || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
    if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters.';
    else if (!/\d/.test(password) || !/[A-Za-z]/.test(password)) errors.password = 'Use letters and at least one number.';
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account with this email already exists.', errors: { email: 'Email already registered.' } });

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: sign(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: sign(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth, (req, res) => res.json({ user: req.user.toPublic() }));

// Stateless JWT: logout is handled client-side by discarding the token. Endpoint exists for symmetry/auditing.
router.post('/logout', auth, (req, res) => res.json({ message: 'Logged out.' }));

router.post('/forgot-password', limiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.resetTokenExpires = Date.now() + 30 * 60 * 1000;
      await user.save({ validateBeforeSave: false });
      const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      // TODO: send via your email provider (SES, SendGrid, Resend...). Logged in dev only.
      if (process.env.NODE_ENV !== 'production') console.log(`[dev] password reset link for ${email}: ${link}`);
    }
    // Same response either way to avoid account enumeration.
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', limiter, async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ message: 'Reset token missing.' });
    if (!password || password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password))
      return res.status(400).json({ message: 'Password must be 8+ characters with letters and a number.' });
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: Date.now() } }).select('+resetTokenHash +resetTokenExpires');
    if (!user) return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    user.password = password;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
