import { Schema, model } from 'mongoose';

const AudioSchema = new Schema({
  data: { 
    type: Buffer, 
    required: true 
  },
  filePath: {
    type: String,
    required: false,
  },
  filename: {
    type: String,
    required: true,
  },
  generatedText: {
    type: Schema.Types.ObjectId,
    ref: 'GeneratedText',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subtitles: {
    type: String,
  },
}, {
  timestamps: true,
});

export default model('Audio', AudioSchema);