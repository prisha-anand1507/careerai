const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const auth = require('../middleware/auth');
const { analyzeResume } = require('../services/mlClient');

const router = express.Router();
router.use(auth);

const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okExt = /\.(pdf|docx)$/i.test(file.originalname);
    if (ALLOWED.includes(file.mimetype) && okExt) return cb(null, true);
    cb(new Error('Only PDF and DOCX files are supported.'));
  },
});

const summary = (a) => ({
  id: a._id,
  filename: a.filename,
  label: a.label,
  overallScore: a.overallScore,
  atsScore: a.atsScore,
  topRole: a.recommendations?.[0]?.role || null,
  topMatch: a.recommendations?.[0]?.match_percentage || null,
  skillCount: a.analysis?.technical_skills?.length || 0,
  createdAt: a.createdAt,
});

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// Upload + analyze
router.post('/', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Attach a resume file in the "resume" field.' });
    const result = await analyzeResume({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      interests: req.user.careerInterests,
      preferredRoles: req.user.preferredRoles,
      jobDescription: (req.body.jobDescription || '').slice(0, 8000),
    });
    const doc = await Analysis.create({
      user: req.user._id,
      filename: req.file.originalname,
      sizeBytes: req.file.size,
      label: (req.body.label || '').slice(0, 60),
      overallScore: result.analysis.overall_score,
      atsScore: result.analysis.ats_score,
      analysis: result.analysis,
      recommendations: result.recommendations,
      skillGap: result.skill_gap,
      trainedModel: result.trained_model || null,
      extractedText: result.extracted_text,
    });
    res.status(201).json({ analysis: { ...doc.toObject(), extractedText: undefined } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const items = await Analysis.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ analyses: items.map(summary) });
  } catch (err) { next(err); }
});

router.get('/latest', async (req, res, next) => {
  try {
    const doc = await Analysis.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ analysis: doc || null });
  } catch (err) { next(err); }
});

router.get('/compare', async (req, res, next) => {
  try {
    const { a, b } = req.query;
    if (!validId(a) || !validId(b)) return res.status(400).json({ message: 'Provide two valid analysis ids (a, b).' });
    const [first, second] = await Promise.all([
      Analysis.findOne({ _id: a, user: req.user._id }),
      Analysis.findOne({ _id: b, user: req.user._id }),
    ]);
    if (!first || !second) return res.status(404).json({ message: 'One or both analyses were not found.' });
    const names = (x) => new Set((x.analysis.technical_skills || []).map((s) => s.name));
    const sa = names(first), sb = names(second);
    res.json({
      a: first, b: second,
      diff: {
        overallScore: second.overallScore - first.overallScore,
        atsScore: second.atsScore - first.atsScore,
        skillsAdded: [...sb].filter((s) => !sa.has(s)),
        skillsRemoved: [...sa].filter((s) => !sb.has(s)),
        topRoleA: first.recommendations?.[0]?.role || null,
        topRoleB: second.recommendations?.[0]?.role || null,
      },
    });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
    const doc = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Analysis not found.' });
    res.json({ analysis: doc });
  } catch (err) { next(err); }
});

router.get('/:id/text', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
    const doc = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).select('+extractedText');
    if (!doc) return res.status(404).json({ message: 'Analysis not found.' });
    res.json({ text: doc.extractedText || '' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
    const doc = await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Analysis not found.' });
    res.json({ message: 'Analysis deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
