const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit faire au moins 6 caractères']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  savedJourneys: [{
    origin: String,
    destination: String,
    transportMode: String,
    distance: Number,
    emissions: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Historique des recherches complètes
  searchHistory: [{
    searchData: {
      origins: String,
      destinations: String
    },
    result: {
      origin: String,
      destination: String,
      origin_address: String,
      destination_address: String,
      transport_modes: [{
        mode: String,
        name: String,
        emissionId: Number,
        available: Boolean,
        distance: {
          text: String,
          value: Number
        },
        duration: {
          text: String,
          value: Number
        },
        emissions: {
          id: Number,
          name: String,
          value: Number
        }
      }],
      date: Date
    },
    date: { type: Date, default: Date.now }
  }],
  created: {
    type: Date,
    default: Date.now
  },
  
}, {
  timestamps: true
});

// Méthode pour hacher le mot de passe avant la sauvegarde
userSchema.pre('save', async function(next) {
  // Ne pas hacher le mot de passe s'il n'a pas été modifié
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour générer un JWT
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;