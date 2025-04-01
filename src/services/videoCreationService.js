import tmp from 'tmp';
import fs from 'fs-extra';
import {
  createVideoFromImages,
  burnSubtitles,
  mergeMusicAndAudio,
  getAudioDuration,
} from '../utils/ffmpegUtils.js';

export default async ({ images, audio, music, width, height, duration }) => {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const imageDurations = Array(images.length).fill(duration / images.length);
  const tempVideoPath = `${tmpDir.name}/temp_${Date.now()}.mp4`;
  const videoWithSubPath = `${tmpDir.name}/video_subtitles_${Date.now()}.mp4`;
  const finalVideoPath = `${tmpDir.name}/final_${Date.now()}.mp4`;

  await createVideoFromImages(images.map((img) => img.data), imageDurations, tempVideoPath, width, height);
  const tempVideoBuffer = fs.readFileSync(tempVideoPath);

  const subtitleContent = audio.subtitles;
  if (subtitleContent) {
    await burnSubtitles(tempVideoBuffer, subtitleContent, videoWithSubPath);
    const videoWithSubBuffer = fs.readFileSync(videoWithSubPath);
    await mergeMusicAndAudio(videoWithSubBuffer, audio.data, music.data, finalVideoPath);
  }

  const finalVideoBuffer = fs.readFileSync(finalVideoPath);
  tmpDir.removeCallback();
  return { data: finalVideoBuffer, filename: `final_${Date.now()}.mp4` };
};