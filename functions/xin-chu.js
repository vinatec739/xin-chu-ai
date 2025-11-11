const { GoogleGenAI } = require('@google/genai');

// Khởi tạo Gemini AI, sử dụng biến môi trường GEMINI_API_KEY
// Lưu ý: Khóa API phải được thiết lập trong Netlify Environment Variables hoặc tệp .env local
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
const model = "gemini-2.5-flash"; 

// Định nghĩa cấu trúc JSON mà model phải trả về
const responseSchema = {
  type: "object",
  properties: {
    chu_chon_1: { 
      type: "string", 
      description: "Chữ thư pháp Hán Việt đầu tiên (tối đa 1 từ)." 
    },
    chu_chon_2: { 
      type: "string", 
      description: "Chữ thư pháp Hán Việt thứ hai (tối đa 1 từ)." 
    },
    cau_1: { 
      type: "string", 
      description: "Một câu đối/thơ thư pháp bằng tiếng Việt hoặc Hán Việt liên quan đến chu_chon_1. Dài khoảng 7-10 từ." 
    },
    cau_2: { 
      type: "string", 
      description: "Một câu đối/thơ thư pháp bằng tiếng Việt hoặc Hán Việt liên quan đến chu_chon_2. Dài khoảng 7-10 từ." 
    },
    loi_binh: { 
      type: "string", 
      description: "Lời bình luận, giải thích ý nghĩa của hai chữ và hai câu đối đối với mong muốn của người dùng (tối thiểu 50 từ, bằng tiếng Việt, không lặp lại nội dung câu 1 và câu 2)." 
    }
  },
  required: ["chu_chon_1", "chu_chon_2", "cau_1", "cau_2", "loi_binh"]
};


exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Kiểm tra khóa API (Nếu thiếu, hàm sẽ lỗi)
  if (!process.env.GEMINI_API_KEY) {
      return { 
          statusCode: 500, 
          body: JSON.stringify({ error: "Thiếu GEMINI_API_KEY. Vui lòng kiểm tra tệp .env hoặc Netlify Environment Variables." }) 
      };
  }

  try {
    const data = JSON.parse(event.body);
    const mongMuon = data.mong_muon;

    if (!mongMuon) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu trường mong_muon' }) };
    }

    const prompt = `Người dùng có mong muốn, khát vọng sau: "${mongMuon}". 
    
    Với vai trò là một Ông Đồ AI, hãy lắng nghe và chọn ra hai chữ thư pháp Hán Việt (mỗi chữ tối đa 1 từ) mang ý nghĩa tốt lành, may mắn, và phù hợp nhất.
    
    Sau đó, tạo ra hai câu đối hoặc thơ (mỗi câu liên quan đến một chữ) và một lời bình luận sâu sắc, giải thích lý do chọn chữ và ý nghĩa của các câu đối đối với mong muốn của người dùng.
    
    Đảm bảo câu 1 và câu 2 là các câu đối/thơ riêng biệt, trang trọng và đầy tính thư pháp.
    
    Hãy trả về kết quả chính xác theo định dạng JSON được yêu cầu.`;

    // Gọi API Gemini
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "Bạn là một ông đồ AI thông thái và am hiểu về văn hóa truyền thống Việt Nam. Bạn luôn trả lời bằng tiếng Việt và chỉ trả về định dạng JSON theo schema đã cung cấp, không thêm bất kỳ văn bản giải thích nào bên ngoài JSON."
      },
    });

    const content = response.text.trim();
    const result = JSON.parse(content);
    
    // Trả về dữ liệu thành công
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
    
  } catch (error) {
    console.error('Lỗi Gemini API hoặc xử lý JSON:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu xin chữ.', details: error.message }),
    };
  }
};