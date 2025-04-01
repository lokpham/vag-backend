// Prompt được người dùng gửi
import { Schema, model } from 'mongoose';

const PromptSchema = new Schema({
  content: {
    type: String,
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

export default model('Prompt', PromptSchema);