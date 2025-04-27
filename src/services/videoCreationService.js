
import fs from 'fs';
import path from 'path';
import {
  createVideoFromImages,
  burnSubtitles,
  mergeMusicAndAudio,
  getAudioDuration,
} from '../utils/ffmpegUtils.js';
import Prompt from '../models/Prompt.js';

export default async ({ images, audio, music, width, height, duration, promptId }) => {
  try {
    if (!music || !music.filePath) {
      throw new Error('Music file is required to create video');
    }
    // Change video name 
    function removeVietnameseAccents(str) {
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    const prompt = await Prompt.findById(promptId)
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    const uploadDir = path.join('uploads');
    const tempVideoPath = path.join(uploadDir, `temp_${Date.now()}.mp4`);
    const videoWithSubPath = path.join(uploadDir, `video_subtitles_${Date.now()}.mp4`);

    // Xử lý tên file từ prompt
    const normalizedPrompt = removeVietnameseAccents(prompt.content)
    .trim()
    .slice(0, 30) // Tăng độ dài để có tên có ý nghĩa hơn
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_') // Loại bỏ nhiều dấu gạch dưới liên tiếp

    const finalVideoPath = path.join(uploadDir, `${normalizedPrompt}_${Date.now()}.mp4`);

    // Kiểm tra file đầu vào images, audio, music
    images.forEach((img) => {
      if (!fs.existsSync(img.filePath)) {
        throw new Error(`Image file not found: ${img.filePath}`);
      }
    });
    if (!fs.existsSync(audio.filePath)) {
      throw new Error(`Audio file not found: ${audio.filePath}`);
    }
    if (!fs.existsSync(music.filePath)) {
      throw new Error(`Music file not found: ${music.filePath}`);
    }

    // Tính thời lượng mỗi ảnh
    const imageDurations = Array(images.length).fill(duration / images.length);

    // Tạo video từ hình ảnh
    console.log('Starting to create video from images...');
    await createVideoFromImages(
      images.map((img) => img.filePath),
      imageDurations,
      tempVideoPath,
      width,
      height
    );
    console.log('Video created from images successfully!');

    // Lưu file phụ đề (.srt)
    const subtitleContent = audio.subtitles;
    let subtitlePath = null;
    if (subtitleContent) {
      subtitlePath = path.join(uploadDir, `subtitles_${Date.now()}.srt`);
      console.log('Saving subtitle file...')
      fs.writeFileSync(subtitlePath, subtitleContent);
      console.log('Subtitle created successfully!');
    }

    // Burn phụ đề vào video (nếu có)
    if (subtitlePath) {
      await burnSubtitles(tempVideoPath, subtitlePath, videoWithSubPath);
      console.log('Subtitles burned successfully!');
    } else {
      // Nếu không có phụ đề, copy file tạm thời sang videoWithSubPath
      console.log('No subtitles provided, copying temp video...');
      fs.copyFileSync(tempVideoPath, videoWithSubPath);
    }

    // Ghép âm thanh (speech) và nhạc nền (music) vào video
    console.log('Starting to merge audio and music...');
    await mergeMusicAndAudio(
      videoWithSubPath,
      audio.filePath,
      music.filePath,
      finalVideoPath
    );
    console.log('Audio and music merged successfully!');

    // Đọc buffer của video cuối cùng
    const finalVideoBuffer = fs.readFileSync(finalVideoPath);

    // Xóa file tạm thời
    console.log('Cleaning up temporary files...');
    fs.unlinkSync(tempVideoPath);
    if (fs.existsSync(videoWithSubPath)) {
      fs.unlinkSync(videoWithSubPath);
    }
    if (subtitlePath) {
      fs.unlinkSync(subtitlePath);
    }

    return { data: finalVideoBuffer, filename: path.basename(finalVideoPath) };
  } catch (error) {
    console.error('Error in videoCreationService:', error.message);
    // Xóa file tạm thời nếu có lỗi
    const uploadDir = path.join('uploads');
    const tempFiles = fs.readdirSync(uploadDir).filter((file) => file.startsWith('temp_') || file.startsWith('video_subtitles_') || file.endsWith('.srt'));
    tempFiles.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    throw error;
  }
};
