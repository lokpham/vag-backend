import { generateSpeech } from '../utils/helper.js';

export default async (text) => {
  return await generateSpeech(text);
};