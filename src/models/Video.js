import { Schema, model } from 'mongoose';

const VideoSchema = new Schema({
  data: {
    type: Buffer,
    required: true,
  },
  filePath: {
    type: String,
    required: false,
  },
  filename: {
    type: String,
    required: true,
  },
  images: [{
    type: Schema.Types.ObjectId,
    ref: 'Image',
  }],
  audio: {
    type: Schema.Types.ObjectId,
    ref: 'Audio',
  },
  music: {
    type: Schema.Types.ObjectId,
    ref: 'Music',
    required: false,
  },
  subtitle: { 
    type: String 
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  generatedText: {
    type: Schema.Types.ObjectId,
    ref: 'GeneratedText',
  },
  duration: {
    type: Number, // Duration in seconds
    required: false,
  },
  size: {
    type: Number, // Size in bytes
    required: true,
  },
}, {
  timestamps: true,
});

export default model('Video', VideoSchema);