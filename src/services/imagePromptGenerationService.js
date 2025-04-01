import generateText from './textGenerationService.js';

export default async (paragraph) => {
  const prompt = `${paragraph} . Từ đoạn văn này hãy đưa ra các phân cảnh thích hợp. Từ các phân cảnh hãy đưa ra các prompt để tạo hình ảnh giới hạn là 8 prompt, prompt không quá dài và không có kí tự đặc biệt và các prompt từ ngữ không nhạy cảm, châm biếm, chính trị. Mỗi prompt bắt từ 1. 2. n. . Chỉ phản hồi cho tôi về các prompt bằng tiếng anh.`;
  const promptsText = await generateText(prompt);
  const prompts = promptsText.split('\n').map((line) => {
    const withoutNumber = line.replace(/^\d+\.\s*/, '');
    return withoutNumber.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  });
  return prompts;
};