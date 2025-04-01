// Tạo ra ảnh dựa theo câu prompt
import { Schema, model } from 'mongoose';

const ImageSchema = new Schema({
  data: {
    type: Buffer, // Dữ liệu ảnh dưới dạng Buffer
    required: true,
  },
  filename: {
    type: String,
    required: true, // Lưu tên file để dễ nhận diện
  },
  imagePrompt: {
    type: Schema.Types.ObjectId,
    ref: 'ImagePrompt',
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

export default model('Image', ImageSchema);