import dotenv from "dotenv";

dotenv.config();
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs-extra";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { fileURLToPath } from "url";
import ffprobeStatic from "ffprobe-static";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import FormData from "form-data";
import axios from "axios";
// Thiết lập đường dẫn cho ffmpeg và ffprobe
// ffmpeg.setFfmpegPath(
//   "C:\\ffmpeg\\ffmpeg-2025-02-26-git-99e2af4e78-full_build\\bin\\ffmpeg.exe"
// );
// ffmpeg.setFfprobePath(
//   "C:\\ffmpeg\\ffmpeg-2025-02-26-git-99e2af4e78-full_build\\bin\\ffprobe.exe"
// );
console.log("HF KEY:", process.env.hf_key);
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "output");

// Tạo thư mục nếu chưa tồn tại
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Giữ nguyên tên gốc
  },
});

const upload = multer({ storage });

const Resolution = Object.freeze({
  R_169: { width: 1280, height: 720 },
  R_916: { width: 720, height: 1280 },
  R_11: { width: 960, height: 960 },
});

app.get("/test", async (req, res) => {
  const { prompt, width = 1024, height = 768 } = req.body;

  try {
    const filepath = await GenerateImage(prompt, width, height);
    res.json({ message: "Image saved successfully", filepath });
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

// Chuyển đổi timestamp thành định dạng HH:MM:SS,MS
function formatTime(seconds) {
  const date = new Date(0);
  date.setSeconds(seconds);
  const ms = Math.floor((seconds % 1) * 1000);
  return (
    date.toISOString().substr(11, 8) + `,${ms.toString().padStart(3, "0")}`
  );
}

// Tạo nội dung file .srt
function generateSRT(segments) {
  return segments
    .map((segment, index) => {
      return `${index + 1}
${formatTime(segment.start)} --> ${formatTime(segment.end)}
${segment.text}

`;
    })
    .join("");
}

// Hàm tạo subtitle, lưu file `.srt` vào thư mục `upload`, và trả về đường dẫn

const GenerateSubtitle = async (audioPath) => {
  const API_URL = `https://whisper-tts-openai.openai.azure.com/openai/deployments/whisper/audio/transcriptions?api-version=2024-06-01`;
  try {
    if (!fs.existsSync(audioPath)) {
      throw new Error("MP3 file does not exist!");
    }

    // Tạo formData để gửi file MP3 lên OpenAI
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioPath));
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("language", "vi");
    // Gửi request đến OpenAI Whisper
    const response = await axios.post(API_URL, formData, {
      headers: {
        "api-key": process.env.azure_key,
        ...formData.getHeaders(),
      },
    });

    const result = response.data;
    if (!result.segments) {
      throw new Error("No transcription found!");
    }

    // Tạo nội dung file .srt
    const srtContent = generateSRT(result.segments);
    const srtPath = path.join(UPLOAD_DIR, "subtitles.srt");

    // Ghi file SRT
    fs.writeFileSync(srtPath, srtContent);

    console.log(`Subtitles created: ${srtPath}`);
    return srtPath;
  } catch (error) {
    console.error("Error creating subtitles:", error);
    throw error;
  }
};

const GenerateImage = async (prompt, width, height) => {
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt parameter" });
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=${width}&height=${height}&seed=42&nologo=true`;
  const filename = `${Date.now()}_${prompt.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const response = await axios.get(url, { responseType: "arraybuffer" });

  // Lưu ảnh vào thư mục `imagedownload`
  fs.writeFileSync(filepath, response.data);
  return filepath;
};

const generateSpeech = async (text, voice = "alloy") => {
  if (!text) throw new Error("Text is required");

  const filename = `${Date.now()}_speech.mp3`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const API_URL =
    "https://whisper-tts-openai.openai.azure.com/openai/deployments/tts-hd/audio/speech?api-version=2024-05-01-preview";
  try {
    const response = await axios.post(
      API_URL,
      { model: "tts-1-hd", input: text, voice },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.azure_key,
        },
        responseType: "arraybuffer",
      }
    );

    // Lưu file MP3 vào thư mục `upload`
    fs.writeFileSync(filepath, response.data);
    console.log(`✅ File MP3 saved: ${filepath}`);

    return filepath; // Trả về đường dẫn file đã lưu
  } catch (error) {
    console.error("❌ Error generating speech:", error);
    throw new Error("Failed to generate speech");
  }
};
const GenerateText = async (userPrompt) => {
  const API_URL = "https://openrouter.ai/api/v1/chat/completions";
  console.log(userPrompt);
  const payload = {
    model: "deepseek/deepseek-chat:free",
    messages: [{ role: "user", content: userPrompt }],
  };

  try {
    // Gửi yêu cầu POST đến Hugging Face API
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.openrouter_key}`, // API key cho Hugging Face
      },
    });

    // Trả về dữ liệu từ API
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Error sending message to Hugging Face API:",
      error.response || error.message
    );
    throw error;
  }
};
app.get("/test", async (req, res) => {
  const imageurl = await GenerateImage(req.body.prompt);
  res.json({
    image: imageurl,
  });
});
app.get("/generate-video", async (req, res) => {
  const width = req.body.width;
  const height = req.body.height;
  const paragraph = await GenerateText(
    "Tôi có nội dung:" +
      req.body.prompt +
      `. Hãy viết đoạn văn dựa trên nội dung đó, đoạn văn kéo dài ${req.body.duration} giây, Trả về chữ thôi không cần định dạng gì hết.`
  );
  const prompts = await GenerateText(
    paragraph +
      " . Từ đoạn văn này hãy đưa ra các gợi ý để tạo hình ảnh. đưa ra 6 gợi ý thôi. Mỗi gợi ý bắt từ 1. Trả về các gợi ý bằng tiếng anh."
  );
  const prompts_cleaned = prompts
    .replace(/\n/g, " ")
    .split(/\d+\.\s+/)
    .filter(Boolean);

  let list_images_path = await Promise.all(
    prompts_cleaned.map(async (prompt) => {
      return await GenerateImage(prompt, width, height);
    })
  );

  let audioPath = await generateSpeech(paragraph);

  let durationAudio = await getAudioDuration(audioPath);
  let subtitlePath = await GenerateSubtitle(audioPath);

  const imageDuration = durationAudio / list_images_path.length;

  console.log("⏳ Thời lượng audio:", durationAudio);
  console.log("🖼 Thời lượng mỗi ảnh:", imageDuration);

  const imageListFile = path.join(UPLOAD_DIR, "images.txt");
  let imageListContent = list_images_path
    .map((imagePath) => `file '${imagePath}'\nduration ${imageDuration}`)
    .join("\n");

  await fs.writeFile(imageListFile, imageListContent);
  console.log("✅ File images.txt đã được tạo!");

  const tempVideo = path.join(UPLOAD_DIR, `temp_${Date.now()}.mp4`);
  await createVideoFromImages(imageListFile, tempVideo);

  // 2️⃣ Ghép âm thanh vào video
  const videoWithAudio = path.join(OUTPUT_DIR, `video_audio_${Date.now()}.mp4`);
  await mergeAudio(tempVideo, audioPath, videoWithAudio);

  let finalVideo = videoWithAudio;

  // 3️⃣ Burn-in subtitles nếu có file phụ đề
  if (subtitlePath) {
    finalVideo = path.join(OUTPUT_DIR, `final_video_${Date.now()}.mp4`);
    await burnSubtitles(videoWithAudio, subtitlePath, finalVideo);
  }

  res.json({
    paragraph: paragraph,
    prompts: prompts_cleaned,
    images_path: list_images_path,
    audio: audioPath,
    subtitle: subtitlePath,
    finalVideoPath: finalVideo,
  });
});

// 📌 Lấy độ dài file MP3
function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
}

// 📌 Tạo video từ hình ảnh
function createVideoFromImages(imageListFile, outputVideo) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imageListFile)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-pix_fmt yuv420p", "-vf scale=1280:720"])
      .save(outputVideo)
      .on("end", () => {
        console.log("✅ Video hình ảnh đã tạo xong!");
        resolve();
      })
      .on("error", (err) => reject(err));
  });
}

// 📌 Ghép âm thanh vào video
function mergeAudio(videoPath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions([
        "-c:v copy", // Giữ nguyên video
        "-c:a aac", // Đảm bảo mã hóa âm thanh đúng
        "-b:a 192k", // Chất lượng âm thanh tốt hơn
        "-map 0:v:0", // Lấy video từ đầu vào
        "-map 1:a:0", // Lấy âm thanh từ file MP3
        "-shortest", // Dừng video khi audio kết thúc
      ])
      .save(outputPath)
      .on("end", () => {
        console.log("✅ Video có âm thanh đã tạo xong!");
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ Lỗi ghép âm thanh:", err);
        reject(err);
      });
  });
}

// 📌 Burn-in subtitles vào video

function escapePathForFFmpeg(filePath) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\\\:");
}

function burnSubtitles(videoPath, subtitlePath, outputPath) {
  return new Promise((resolve, reject) => {
    const formattedSubtitlePath = escapePathForFFmpeg(
      path.resolve(subtitlePath)
    );
    const formattedVideoPath = path.resolve(videoPath).replace(/\\/g, "/");
    const formattedOutputPath = path.resolve(outputPath).replace(/\\/g, "/");

    console.log("🎬 Đường dẫn file video:", formattedVideoPath);
    console.log("📜 Đường dẫn file phụ đề:", formattedSubtitlePath);
    console.log("📂 Đường dẫn file đầu ra:", formattedOutputPath);

    ffmpeg(formattedVideoPath)
      .outputOptions(["-vf", `subtitles=${formattedSubtitlePath}`])
      .output(formattedOutputPath)
      .on("start", (cmd) => console.log("🛠 Lệnh FFmpeg:", cmd))
      .on("error", (err) => {
        console.error("❌ Lỗi burn-in subtitles:", err);
        reject(err);
      })
      .on("end", () => {
        console.log("✅ Video có phụ đề đã tạo xong!");
        resolve();
      })
      .run();
  });
}

// 📌 Chạy server
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
