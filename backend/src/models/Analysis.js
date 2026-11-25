const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: String,
    sizeBytes: Number,
    label: { type: String, default: '' },
    overallScore: Number,
    atsScore: Number,
    // Full ML payloads are stored as-is so reports can be revisited exactly.
    analysis: { type: mongoose.Schema.Types.Mixed, required: true },
    recommendations: { type: mongoose.Schema.Types.Mixed, default: [] },
    skillGap: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Output of the Colab-trained bundle ({ available: false, reason } when it is not installed)
    trainedModel: { type: mongoose.Schema.Types.Mixed, default: null },
    extractedText: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);
