const { GoogleGenAI } = require('@google/genai');

// Dán khóa API của bạn vào đây
const API_KEY = "AIzaSyDtS5efUHEhOQPW91nwtl-3eMzGR3rIDP0"; 

if (API_KEY === "AIzaSyDtS5efUHEhOQPW91nwtl-3eMzGR3rIDP0") {
    console.log("⚠️ Vui lòng thay khóa API mẫu bằng khóa thật của bạn.");
    return;
}

const ai = new GoogleGenAI(API_KEY);

async function testApi() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Nói xin chào bằng tiếng Việt.",
        });

        console.log("✅ API thành công! Phản hồi:");
        console.log(response.text);
    } catch (error) {
        console.error("❌ API thất bại. Lỗi chi tiết:", error.message);
    }
}

testApi();