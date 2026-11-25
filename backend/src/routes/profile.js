const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const strList = (v) => (Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean).slice(0, 60) : undefined);

router.get('/', (req, res) => res.json({ user: req.user.toPublic() }));

router.put('/', async (req, res, next) => {
  try {
    const { name, email, education, experience, technicalSkills, careerInterests, preferredRoles } = req.body;
    const user = req.user;
    if (name !== undefined) {
      if (String(name).trim().length < 2) return res.status(400).json({ message: 'Name is too short.' });
      user.name = String(name).trim();
    }
    if (email !== undefined && email.toLowerCase() !== user.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email.' });
      if (await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } }))
        return res.status(409).json({ message: 'That email is already in use.' });
      user.email = email.toLowerCase();
    }
    if (Array.isArray(education)) user.education = education.slice(0, 10);
    if (Array.isArray(experience)) user.experience = experience.slice(0, 20);
    if (strList(technicalSkills)) user.technicalSkills = strList(technicalSkills);
    if (strList(careerInterests)) user.careerInterests = strList(careerInterests);
    if (strList(preferredRoles)) user.preferredRoles = strList(preferredRoles);
    await user.save();
    res.json({ user: user.toPublic(), message: 'Profile updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
