import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import tmp from 'tmp';
import fs from 'fs-extra';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export const getAudioDuration = (audioBuffer) => {
  return new Promise((resolve, reject) => {
    const tmpFile = tmp.fileSync({ postfix: '.mp3' });
    fs.writeFileSync(tmpFile.name, audioBuffer);
    ffmpeg.ffprobe(tmpFile.name, (err, metadata) => {
      tmpFile.removeCallback();
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

export const createVideoFromImages = (imageBuffers, durations, outputPath, width, height) => {
  return new Promise((resolve, reject) => {
    const tmpDir = tmp.dirSync();
    const imageListFile = `${tmpDir.name}/images.txt`;
    const imageListContent = imageBuffers
      .map((buffer, index) => {
        const imagePath = `${tmpDir.name}/image_${index}.jpg`;
        fs.writeFileSync(imagePath, buffer);
        return `file '${imagePath}'\nduration ${durations[index]}`;
      })
      .join('\n');
    fs.writeFileSync(imageListFile, imageListContent);
    ffmpeg()
      .input(imageListFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([`-vf scale=${width}:${height}`, '-pix_fmt yuv420p'])
      .save(outputPath)
      .on('end', () => {
        tmpDir.removeCallback();
        resolve();
      })
      .on('error', (err) => {
        tmpDir.removeCallback();
        reject(err);
      });
  });
};

export const burnSubtitles = (videoBuffer, subtitleContent, outputPath) => {
  return new Promise((resolve, reject) => {
    const tmpDir = tmp.dirSync();
    const videoPath = `${tmpDir.name}/temp_video.mp4`;
    const subtitlePath = `${tmpDir.name}/subtitles.srt`;
    fs.writeFileSync(videoPath, videoBuffer);
    fs.writeFileSync(subtitlePath, subtitleContent);
    ffmpeg(videoPath)
      .outputOptions([`-vf subtitles=${subtitlePath}`])
      .output(outputPath)
      .on('end', () => {
        tmpDir.removeCallback();
        resolve();
      })
      .on('error', (err) => {
        tmpDir.removeCallback();
        reject(err);
      });
  });
};

export const mergeMusicAndAudio = (videoBuffer, voiceBuffer, musicBuffer, outputPath) => {
  return new Promise((resolve, reject) => {
    const tmpDir = tmp.dirSync();
    const videoPath = `${tmpDir.name}/temp_video.mp4`;
    const voicePath = `${tmpDir.name}/voice.mp3`;
    const musicPath = `${tmpDir.name}/music.mp3`;
    fs.writeFileSync(videoPath, videoBuffer);
    fs.writeFileSync(voicePath, voiceBuffer);
    fs.writeFileSync(musicPath, musicBuffer);
    ffmpeg()
      .input(videoPath)
      .input(voicePath)
      .input(musicPath)
      .complexFilter([
        '[1:a]volume=2.0[voice]',
        '[2:a]volume=0.2[music_low]',
        '[music_low]aloop=loop=-1:size=2e+09[music_loop]',
        '[music_loop]apad[music_padded]',
        '[music_padded]atrim=0:duration=999[music_trimmed]',
        '[voice][music_trimmed]amix=inputs=2:duration=first:dropout_transition=3[audio_mixed]',
      ])
      .outputOptions([
        '-map 0:v:0',
        '-map [audio_mixed]',
        '-c:v copy',
        '-c:a aac',
        '-b:a 192k',
        '-shortest',
      ])
      .save(outputPath)
      .on('end', () => {
        tmpDir.removeCallback();
        resolve();
      })
      .on('error', (err) => {
        tmpDir.removeCallback();
        reject(err);
      });
  });
};