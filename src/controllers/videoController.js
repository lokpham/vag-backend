// controllers/videoController.js
import multer from 'multer';
import generateText from '../services/textGenerationService.js';
import generateImagePrompts from '../services/imagePromptGenerationService.js';
import generateImage from '../services/imageGenerationService.js';
import generateSpeech from '../services/speechGenerationService.js';
import generateSubtitles from '../services/subtitleGenerationService.js';
import createVideo from '../services/videoCreationService.js';
import { Prompt, GeneratedText, ImagePrompt, Image, Audio, Music, Video } from '../models/index.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const generateVideo = async (req, res) => {
  try {
    const { prompt, width = 1024, height = 768, duration } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Music file is required' });

    const music = new Music({ data: req.file.buffer, filename: req.file.originalname, user: 'user_id' });
    await music.save();

    const paragraphPrompt = `Tôi có nội dung: ${prompt}. Hãy viết đoạn văn dựa trên nội dung đó, độ dài đoạn văn phải dài đủ để AI đọc trong vòng ${duration} giây, Trả về chữ thôi không cần định dạng gì hết.`;
    const paragraph = await generateText(paragraphPrompt);
    const promptDoc = new Prompt({ content: prompt, user: 'user_id' });
    await promptDoc.save();
    const generatedText = new GeneratedText({ content: paragraph, prompt: promptDoc._id, user: 'user_id' });
    await generatedText.save();

    const imagePromptsText = await generateImagePrompts(paragraph);
    const imagePrompts = await Promise.all(
      imagePromptsText.map((desc) => new ImagePrompt({ description: desc, generatedText: generatedText._id }).save())
    );

    const images = await Promise.all(
      imagePrompts.map(async (p) => {
        const { data, filename } = await generateImage(p.description, width, height);
        const image = new Image({ data, filename, imagePrompt: p._id, user: 'user_id' });
        await image.save();
        return image;
      })
    );

    const { data: speechData, filename: speechFilename } = await generateSpeech(paragraph);
    const audio = new Audio({ data: speechData, filename: speechFilename, generatedText: generatedText._id, user: 'user_id' });
    audio.subtitles = await generateSubtitles(speechData);
    await audio.save();

    const video = await createVideo({ images, audio, music, width, height, duration });
    const videoDoc = new Video({
      data: video.data,
      filename: video.filename,
      images: images.map((img) => img._id),
      audio: audio._id,
      music: music._id,
      user: 'user_id',
    });
    await videoDoc.save();

    res.json({
      paragraph,
      prompts: imagePromptsText,
      images: images.map((img) => img.filename),
      audio: audio.filename,
      subtitle: audio.subtitles,
      video: video.filename,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};