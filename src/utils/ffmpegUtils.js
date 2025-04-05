
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

export const createVideoFromImages = (imagePaths, durations, outputPath, width, height) => {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Kiểm tra và tạo thư mục uploads nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory in ffmpegUtils:', uploadDir);
    }

    const imageListFile = path.join(uploadDir, `images_${Date.now()}.txt`);
    const imageListContent = imagePaths
      .map((imagePath, index) => `file '${imagePath}'\nduration ${durations[index]}`)
      .join('\n');
    fs.writeFileSync(imageListFile, imageListContent);

    ffmpeg()
      .input(imageListFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([`-vf scale=${width}:${height}`, '-pix_fmt yuv420p'])
      .save(outputPath)
      .on('end', () => {
        fs.unlinkSync(imageListFile); // Xóa file danh sách hình ảnh
        resolve();
      })
      .on('error', (err) => {
        console.error('Error in createVideoFromImages:', err.message);
        if (fs.existsSync(imageListFile)) {
          fs.unlinkSync(imageListFile);
        }
        reject(err);
      });
  });
};

export const burnSubtitles = (videoPath, subtitlePath, outputPath) => {
  return new Promise((resolve, reject) => {
    // Escape đường dẫn phụ đề
    const formattedSubtitlePath = subtitlePath
    .replace(/\\/g, '/')
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");

    const formattedVideoPath = path.resolve(videoPath).replace(/\\/g, "/");
    const formattedOutputPath = path.resolve(outputPath).replace(/\\/g, "/");

    ffmpeg(formattedVideoPath)
      .outputOptions([
        `-vf subtitles='${formattedSubtitlePath}'`,
      ])
      .output(formattedOutputPath)
      .on('progress', (progress) => {
        console.log(`Burning subtitles: ${progress.percent}% done`);
      })
      .on('end', () => {
        console.log(`Successfully burned subtitles to ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error in burnSubtitles:', err.message);
        reject(err);
      })
      .run();
  });
};


export const mergeMusicAndAudio = (videoPath, voicePath, musicPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(videoPath)
      .input(voicePath);

    if (musicPath) {
      command
        .input(musicPath)
        .complexFilter([
          '[1:a]volume=2.0[voice]', // Giữ nguyên giọng đọc
          '[2:a]volume=0.2[music_low]', // Giảm âm lượng nhạc nền xuống 20%
          '[music_low]aloop=loop=-1:size=2e+09[music_loop]', // Lặp nhạc nền nếu ngắn hơn video
          '[music_loop]apad[music_padded]',
          '[music_padded]atrim=0:duration=999[music_trimmed]',
          // Trộn giọng đọc và nhạc nền (giọng đọc lớn hơn nhạc nền)
          '[voice][music_trimmed]amix=inputs=2:duration=first:dropout_transition=3[audio_mixed]',
        ])
        .outputOptions([
          '-map 0:v:0',
          '-map [audio_mixed]',
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-shortest',
        ]);
    } else {
      command
        .outputOptions([
          '-map 0:v:0',
          '-map 1:a:0',
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-shortest',
        ]);
    }

    command
      .save(outputPath)
      .on('progress', (progress) => {
        console.log(`Merging audio and music: ${progress.percent}% done`);
      })
      .on('end', () => {
        console.log(`Successfully merged audio and music to ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error in mergeMusicAndAudio:', err.message);
        reject(err);
      });
  });
};