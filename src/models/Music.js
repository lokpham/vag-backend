// Dữ liệu nhạc nền được người dùng cung cấp
import { Schema, model } from 'mongoose';

const MusicSchema = new Schema({
  data: {
    type: Buffer, // Dữ liệu nhạc nền dưới dạng Buffer
    required: true,
  },
  filename: {
    type: String,
    required: true, // Lưu tên file để dễ nhận diện
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default model('Music', MusicSchema);