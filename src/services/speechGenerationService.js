import { generateSpeech } from '../utils/helper.js';

export default async (text, voice = "alloy") => {
  return await generateSpeech(text, voice);
};