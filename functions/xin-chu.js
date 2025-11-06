// functions/xin-chu.js
const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const ai = new GoogleGenAI(GEMINI_API_KEY);

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: "Method Not Allowed" }),
            headers: { "Access-Control-Allow-Origin": "*" }
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    const mong_muon = requestBody.mong_muon;
    // Nhận danh sách chữ đã dùng từ Frontend (dùng cho logic chữ duy nhất)
    const usedWords = requestBody.used_words || []; 
    
    if (!mong_muon) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing 'mong_muon' field" }) };
    }

    // Tạo điều kiện KHÔNG LẶP LẠI (Nếu có)
    const exclusionCondition = usedWords.length > 0 
        ? ` (KHÔNG ĐƯỢC PHÉP chọn các chữ sau: ${usedWords.join(', ')}).`
        : '';
    
    // 2. Xây dựng Prompt cho AI (ĐÃ CẬP NHẬT: Chọn 2 chữ)
    const prompt = `
        Khách hàng có mong muốn: "${mong_muon}". 
        Bạn hãy phân tích ý nghĩa mong muốn này và thực hiện 2 nhiệm vụ sau, 
        chỉ trả lời bằng một đối tượng JSON và không có bất kỳ văn bản giải thích nào khác. 
        Sử dụng tiếng Việt.
        
        1. Chọn ra **HAI chữ Hán Việt/Nôm** phù hợp nhất, liên quan và bổ sung ý nghĩa cho nhau${exclusionCondition}.
        2. Viết một **lời bình ngắn** (khoảng 3-4 câu) giải thích ý nghĩa lần lượt CẢ HAI chữ đã chọn và liên kết nó với mong muốn của khách.
        
        Ví dụ định dạng JSON: 
        {
          "chu_chon": ["Phúc", "Lộc"],
          "loi_binh": "Phúc và Lộc là hai điều ước nguyện lớn nhất... (Giải thích ý nghĩa chung)."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json", 
            },
        });
        
        const responseText = response.text.trim();
        const result = JSON.parse(responseText);
        
        // Kiểm tra định dạng 2 chữ, nếu không đúng thì mặc định là 1 chữ
        if (result.chu_chon && !Array.isArray(result.chu_chon)) {
            result.chu_chon = [result.chu_chon.toString()];
        }

        // 4. Trả về kết quả JSON cho Frontend
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(result),
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            statusCode: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ 
                error: "Lỗi nội bộ server khi tạo chữ. Vui lòng kiểm tra API Key và Node.js version."
            }),
        };
    }
};
