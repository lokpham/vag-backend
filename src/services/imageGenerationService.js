import { GenerateImage } from '../utils/helper.js';

export default async (prompt, width, height) => {
  const maxRetries = 3;
  let attempts = 0;
  while (attempts < maxRetries) {
    const result = await GenerateImage(prompt, width, height);
    if (result.status) return result;
    attempts++;
  }
  throw new Error('Failed to generate image after multiple attempts');
};