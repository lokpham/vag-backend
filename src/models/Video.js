// // Dữ liệu video cuối cùng
// import { Schema, model } from 'mongoose';

// const VideoSchema = new Schema({
//   data: {
//     type: Buffer, // Dữ liệu video dưới dạng Buffer
//     required: true,
//   },
//   filename: {
//     type: String,
//     required: true, // Lưu tên file để dễ nhận diện
//   },
//   images: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Image',
//     required: true,
//   }],
//   audio: {
//     type: Schema.Types.ObjectId,
//     ref: 'Audio',
//     required: true,
//   },
//   music: {
//     type: Schema.Types.ObjectId,
//     ref: 'Music',
//     required: true,
//   },
//   user: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
// }, {
//   timestamps: true,
// });

// export default model('Video', VideoSchema);

import { Schema, model } from 'mongoose';

const VideoSchema = new Schema({
  data: {
    type: Buffer, // Lưu buffer video vào MongoDB
    required: true,
  },
  filePath: {
    type: String, // Đường dẫn tạm thời trong /uploads
    required: false, //
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
  subtitle: { type: String }, // Lưu phụ đề
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default model('Video', VideoSchema);