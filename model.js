const mongoose = require('mongoose');

// Define schema
const codeSchema = new mongoose.Schema({
  username: { type: String, required: true },
  language: { type: String, required: true },
  stdinput: { type: String, required: true },
  sourceCode: { type: String, required: true },
});

// Create model
const CodeModel = mongoose.model('Code', codeSchema);

module.exports = CodeModel;