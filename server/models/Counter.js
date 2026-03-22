const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

// Composite index to ensure one counter per model per organization
counterSchema.index({ organization: 1, model: 1 }, { unique: true });

counterSchema.statics.getNextSequence = async function (organizationId, modelName) {
  const counter = await this.findOneAndUpdate(
    { organization: organizationId, model: modelName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
