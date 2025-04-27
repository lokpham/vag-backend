import generateText from './textGenerationService.js';

export default async (paragraph, duration) => {
  const imageDisplayTime = 4; // Thời gian trung bình mỗi hình ảnh hiển thị (giây)
  let promptCount = Math.ceil(duration / imageDisplayTime);
  
  // Đảm bảo số lượng hình ảnh phù hợp
  promptCount = Math.max(4, Math.min(20, promptCount)); 
  // const prompt = `${paragraph} . Từ đoạn văn này hãy đưa ra các phân cảnh thích hợp. Từ các phân cảnh hãy đưa ra các prompt để tạo hình ảnh giới hạn là 8 prompt, prompt không quá dài và không có kí tự đặc biệt và các prompt từ ngữ không nhạy cảm, châm biếm, chính trị. Mỗi prompt bắt từ 1. 2. n. . Chỉ phản hồi cho tôi về các prompt bằng tiếng anh.`;
  const prompt = `${paragraph} . Dựa vào đoạn văn trên, hãy:
  1. Phân tích và xác định các phân cảnh quan trọng, các hình ảnh có thể minh họa
  2. Tạo ${promptCount} prompt ngắn gọn để sinh ra các hình ảnh minh họa cho đoạn văn
  3. Mỗi prompt nên mô tả rõ một cảnh/hình ảnh cụ thể
  4. Prompt phải bằng tiếng Anh, ngắn gọn, không chứa ký tự đặc biệt
  5. Nội dung prompt phải phù hợp, không nhạy cảm, không chứa yếu tố chính trị hoặc châm biếm
  6. Các prompt nên theo trình tự diễn biến của đoạn văn
  7. Mỗi prompt bắt đầu bằng số thứ tự (1., 2., 3., v.v.)
  
  Chỉ cung cấp danh sách các prompt bằng tiếng Anh, không cần giải thích thêm.`;
  const promptsText = await generateText(prompt);
  const prompts = promptsText.split('\n').map((line) => {
    const withoutNumber = line.replace(/^\d+\.\s*/, '');
    return withoutNumber.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  });
  return prompts;
};