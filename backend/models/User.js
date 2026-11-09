const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [60, 'Name must be at most 60 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 8,
      select: false,
    },
    profileImage: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    timezone: {
      type: String,
      default: 'UTC',
      validate: {
        validator(value) {
          try {
            new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid timezone.',
      },
    },
    goals: {
      type: [
        new mongoose.Schema(
          {
            title: {
              type: String,
              required: true,
              trim: true,
              maxlength: [120, 'Goal title must be at most 120 characters.'],
            },
            description: { type: String, trim: true, default: '', maxlength: 500 },
            targetDate: { type: Date, default: null },
            status: {
              type: String,
              enum: ['active', 'completed'],
              default: 'active',
            },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    workingHours: {
      start: { type: String, default: '09:00', match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Working hours must use HH:mm format.'] },
      end: { type: String, default: '17:00', match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Working hours must use HH:mm format.'] },
      daysOfWeek: {
        type: [Number],
        default: [1, 2, 3, 4, 5],
      },
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.resetPasswordTokenHash;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
