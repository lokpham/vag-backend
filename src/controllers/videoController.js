
import multer from 'multer';
import generateText from '../services/textGenerationService.js';
import generateImagePrompts from '../services/imagePromptGenerationService.js';
import generateImage from '../services/imageGenerationService.js';
import generateSpeech from '../services/speechGenerationService.js';
import generateSubtitles from '../services/subtitleGenerationService.js';
import createVideo from '../services/videoCreationService.js';
import { Prompt, GeneratedText, ImagePrompt, Image, Audio, Music, Video } from '../models/index.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Đảm bảo thư mục uploads tồn tại ngay từ đầu
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory in videoController:', uploadDir);
}

// Cấu hình multer để lưu file tạm thời vào /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn kích thước file tối đa là 50MB
});

// Khởi tạo multer
const upload = multer({ storage });

// Middleware kiểm tra request trước khi gọi multer
const checkMultipartRequest = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    next();
  } else {
    return res.status(400).json({ error: 'Invalid Content-Type: Expected multipart/form-data for file upload' });
  }
};

// Route handler chính để tạo video
export const generateVideo = [
  // Middleware để kiểm tra user
  (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }
    next();
  },
  // Middleware kiểm tra request
  checkMultipartRequest,
  // Middleware multer để xử lý file
  (req, res, next) => {
    upload.single('music')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File quá lớn! Vui lòng chọn file nhỏ hơn 50MB.' });
        }
        return res.status(400).json({ error: 'Failed to upload music file', message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Music file is required' });
      }
      next();
    });
  },
  // Logic chính
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { prompt, width = 1024, height = 768, duration } = req.body;

      if (!prompt || !duration) {
        return res.status(400).json({ error: 'Prompt and duration are required' });
      }

      // Xử lý file music (bắt buộc)
      const musicPath = req.file.path;
      const musicBuffer = fs.readFileSync(musicPath); // Đọc buffer của file music
      const music = new Music({
        data: musicBuffer, // Lưu buffer vào MongoDB
        filename: req.file.filename,
        user: userId,
      });
      await music.save();
      music.filePath = musicPath; // Lưu tạm filePath để tạo video

      // Tạo đoạn văn
      const paragraphPrompt = `Tôi có nội dung: ${prompt}. Hãy viết đoạn văn dựa trên nội dung đó, độ dài đoạn văn phải dài đủ để AI đọc trong vòng ${duration} giây, Trả về chữ thôi không cần định dạng gì hết.`;
      const paragraph = await generateText(paragraphPrompt);
      const promptDoc = new Prompt({
        content: prompt,
        user: userId,
      });
      await promptDoc.save();
      const generatedText = new GeneratedText({
        content: paragraph,
        prompt: promptDoc._id,
        user: userId,
      });
      await generatedText.save();

      // Tạo image prompts
      const imagePromptsText = await generateImagePrompts(paragraph);
      const imagePrompts = await Promise.all(
        imagePromptsText.map((desc) =>
          new ImagePrompt({ description: desc, generatedText: generatedText._id }).save()
        )
      );

      // Tạo images và lưu vào /uploads
      const images = await Promise.all(
        imagePrompts.map(async (p) => {
          const { data, filename } = await generateImage(p.description, width, height);
          const imagePath = path.join(uploadDir, filename);
          fs.writeFileSync(imagePath, data); // Lưu file hình ảnh vào /uploads
          const imageBuffer = fs.readFileSync(imagePath); // Đọc buffer của hình ảnh
          const image = new Image({
            data: imageBuffer, // Lưu buffer vào MongoDB
            filename,
            imagePrompt: p._id,
            user: userId,
          });
          await image.save();
          image.filePath = imagePath; // Lưu tạm filePath để tạo video
          return image;
        })
      );

      // Tạo speech và lưu vào /uploads
      const { data: speechData, filename: speechFilename } = await generateSpeech(paragraph);
      if (!speechData) {
        throw new Error('Failed to generate speech: No data returned');
      }

      const audioPath = path.join(uploadDir, speechFilename);
      fs.writeFileSync(audioPath, speechData); // Lưu file âm thanh vào /uploads

      // Kiểm tra file âm thanh có tồn tại không
      if (!fs.existsSync(audioPath)) {
        throw new Error('Failed to write audio file to disk');
      }

      const audioBuffer = fs.readFileSync(audioPath); // Đọc buffer của âm thanh
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Failed to read audio file: Buffer is empty');
      }

      const audio = new Audio({
        data: audioBuffer, // Lưu buffer vào MongoDB
        filename: speechFilename,
        generatedText: generatedText._id,
        user: userId,
      });
      audio.subtitles = await generateSubtitles(speechData);
      await audio.save();
      audio.filePath = audioPath; // Lưu tạm filePath để tạo video

      // Tạo video
      const video = await createVideo({ images, audio, music, width, height, duration });
      const videoPath = path.join(uploadDir, video.filename);
      fs.writeFileSync(videoPath, video.data); // Lưu video vào /uploads

      // Đọc video buffer để lưu vào MongoDB
      const videoBuffer = fs.readFileSync(videoPath);
      const videoDoc = new Video({
        data: videoBuffer, // Lưu buffer vào MongoDB
        filename: video.filename,
        images: images.map((img) => img._id),
        audio: audio._id,
        music: music._id,
        user: userId,
        prompt: promptDoc._id,
        generatedText: generatedText._id,
        subtitle: audio.subtitles, // Lưu phụ đề vào video document
      });
      await videoDoc.save();

      // Xóa file tạm thời
      images.forEach((img) => fs.unlinkSync(img.filePath));
      fs.unlinkSync(audioPath);
      fs.unlinkSync(musicPath);
      fs.unlinkSync(videoPath);

      // Trả về kết quả
      res.json({
        paragraph,
        prompts: imagePromptsText,
        images: images.map((img) => img._id), // Trả về imageId để truy xuất
        audio: audio._id, // Trả về audioId để truy xuất
        subtitle: audio.subtitles,
        video: videoDoc.filename,
        videoId: videoDoc._id, // Trả về ID để frontend truy xuất video
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  },
];

// API để lấy video theo ID
export const getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.set('Content-Type', 'video/mp4');
    res.send(video.data); // Gửi buffer video trực tiếp
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API để lấy hình ảnh theo ID
export const getImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.set('Content-Type', 'image/jpeg');
    res.send(image.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API để lấy âm thanh theo ID
export const getAudio = async (req, res) => {
  try {
    const { audioId } = req.params;
    const audio = await Audio.findById(audioId);
    if (!audio) {
      return res.status(404).json({ error: 'Audio not found' });
    }
    res.set('Content-Type', 'audio/mpeg');
    res.send(audio.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};