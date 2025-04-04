// // Dữ liệu âm thanh và phụ đề cho video
// import { Schema, model } from 'mongoose';

// const AudioSchema = new Schema({
//   data: {
//     type: Buffer, // Dữ liệu âm thanh dưới dạng Buffer
//     required: true,
//   },
//   filename: {
//     type: String,
//     required: true, // Lưu tên file để dễ nhận diện
//   },
//   generatedText: {
//     type: Schema.Types.ObjectId,
//     ref: 'GeneratedText',
//     required: true,
//   },
//   user: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   subtitles: {
//     type: String, // Nội dung file SRT dưới dạng chuỗi
//     default: null,
//   },
// }, {
//   timestamps: true,
// });

// export default model('Audio', AudioSchema);

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