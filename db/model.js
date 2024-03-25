const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clothSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
//   type: upper or lower
  type:{ 
    type: String,
    required: true
  },
//   ocassion: formal, casual, sporty
  occasion: {
    type: String,
    required: true
  },
  temperature: {
    type: String,
    required: true
  }
});

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  clauset: [clothSchema] // Define an array of cloth objects using the clothSchema
});
module.exports = mongoose.model('User', userSchema, 'AI_clauset');