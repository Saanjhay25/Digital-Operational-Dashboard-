import mongoose from 'mongoose';

const rcaSchema = new mongoose.Schema({
  incident_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Server Issue', 'Network Issue', 'Application Bug', 'Human Error', 'Third-Party Failure'],
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  detailed_analysis: {
    type: String,
    required: true,
  },
  preventive_measures: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved'],
    default: 'Draft',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Ensure virtuals are included in JSON
rcaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc: any, ret: any) { 
      ret.id = ret._id;
      delete ret._id; 
  }
});

const RCA = mongoose.model('RCA', rcaSchema);
export default RCA;
