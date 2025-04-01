// Tạo lời nhắc phụ cho ảnh
import { Schema, model } from 'mongoose';

const ImagePromptSchema = new Schema({
  description: {
    type: String,
    required: true,
  },
  generatedText: {
    type: Schema.Types.ObjectId,
    ref: 'GeneratedText',
    required: true,
  },
}, {
  timestamps: true,
});

export default model('ImagePrompt', ImagePromptSchema);