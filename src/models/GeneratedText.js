// Tạo ra kịch bản dựa theo prompt người dùng cung cấp
import { Schema, model } from 'mongoose';

const GeneratedTextSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  prompt: {
    type: Schema.Types.ObjectId,
    ref: 'Prompt',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default model('GeneratedText', GeneratedTextSchema);