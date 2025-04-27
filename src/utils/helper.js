import axios from 'axios';
import FormData from 'form-data';

export const toBase64 = (str) => {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const GenerateText = async (userPrompt) => {
  const API_URL = "https://openrouter.ai/api/v1/chat/completions";
  const payload = {
    model: 'deepseek/deepseek-chat:free',
    messages: [{ role: 'user', content: userPrompt }],
  };
  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.openrouter_key}`,
      },
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
};

export const GenerateImage = async (prompt, width, height) => {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=42&nologo=true`;
  const filename = `${Date.now()}_${toBase64(prompt)}.jpg`;
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return { data: Buffer.from(response.data), filename, status: true };
  } catch (error) {
    console.error('Error generating image:', error);
    return { data: null, filename, status: false, message: error.message };
  }
};

export const generateSpeech = async (text, voice = 'alloy') => {
  if (!text) throw new Error('Text is required');
  const API_URL = 'https://whisper-tts-openai.openai.azure.com/openai/deployments/tts-hd/audio/speech?api-version=2024-05-01-preview';
  const filename = `${Date.now()}_speech.mp3`;
  try {
    const response = await axios.post(
      API_URL,
      { model: 'tts-1-hd', input: text, voice },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.azure_key,
        },
        responseType: 'arraybuffer',
      }
    );
    return { data: Buffer.from(response.data), filename };
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

export const GenerateSubtitle = async (audioBuffer) => {
  const API_URL = 'https://whisper-tts-openai.openai.azure.com/openai/deployments/whisper/audio/transcriptions?api-version=2024-06-01';
  const formData = new FormData();
  formData.append('file', audioBuffer, { filename: 'audio.mp3' });
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('language', 'vi');
  try {
    const response = await axios.post(API_URL, formData, {
      headers: {
        'api-key': process.env.azure_key,
        ...formData.getHeaders(),
      },
    });
    const result = response.data;
    if (!result.segments) throw new Error('No transcription found!');
    return generateSRT(result.segments);
  } catch (error) {
    console.error('Error generating subtitles:', error);
    throw error;
  }
};

export const formatTime = (seconds) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const ms = Math.floor((seconds % 1) * 1000);
  return date.toISOString().substr(11, 8) + `,${ms.toString().padStart(3, '0')}`;
};

export const generateSRT = (segments) => {
  return segments
    .map((segment, index) => {
      return `${index + 1}
${formatTime(segment.start)} --> ${formatTime(segment.end)}
${segment.text}

`;
    })
    .join('');
};