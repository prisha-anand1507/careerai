const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const educationSchema = new mongoose.Schema(
  { degree: String, institution: String, field: String, year: String },
  { _id: false }
);
const experienceSchema = new mongoose.Schema(
  { title: String, company: String, duration: String, description: String },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    education: [educationSchema],
    experience: [experienceSchema],
    technicalSkills: [String],
    careerInterests: [String],
    preferredRoles: [String],
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.profileCompletion = function () {
  const checks = [
    !!this.name,
    !!this.email,
    this.education.length > 0,
    this.experience.length > 0,
    this.technicalSkills.length > 0,
    this.careerInterests.length > 0,
    this.preferredRoles.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    education: this.education,
    experience: this.experience,
    technicalSkills: this.technicalSkills,
    careerInterests: this.careerInterests,
    preferredRoles: this.preferredRoles,
    profileCompletion: this.profileCompletion(),
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
