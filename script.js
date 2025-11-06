// Thay thế bằng URL của Serverless Function (Netlify/Vercel/Google Cloud)
const API_ENDPOINT = 'http://localhost:8888/.netlify/functions/xin-chu'; 

const submitBtn = document.getElementById('submit-btn');
const inputSection = document.getElementById('input-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const mongMuonInput = document.getElementById('mong-muon-input');
const chuChonContainer = document.getElementById('chu-chon-container'); // Container cho 2 chữ
const loiBinhDisplay = document.getElementById('loi-binh');
const downloadBtn = document.getElementById('download-btn');
const quayLaiBtn = document.getElementById('quay-lai-btn');


// Hàm lưu trữ và lấy chữ đã dùng trong ngày (Logic Chữ Duy Nhất)
const getUsedWords = () => {
    const today = new Date().toDateString();
    const storageKey = `usedWords_${today}`;
    
    try {
        const storedData = localStorage.getItem(storageKey);
        return storedData ? JSON.parse(storedData) : [];
    } catch (e) {
        console.error("Error reading localStorage:", e);
        return [];
    }
};

const addUsedWord = (word) => {
    const today = new Date().toDateString();
    const storageKey = `usedWords_${today}`;
    
    const usedWords = getUsedWords();
    // Thêm từng chữ vào danh sách
    if (Array.isArray(word)) {
        word.forEach(w => {
            if (!usedWords.includes(w)) usedWords.push(w);
        });
    } else if (!usedWords.includes(word)) {
        usedWords.push(word);
    }
    localStorage.setItem(storageKey, JSON.stringify(usedWords));
};

// Hàm hiển thị 2 chữ
const displayCalligraphyWords = (words) => {
    chuChonContainer.innerHTML = ''; // Xóa nội dung cũ
    if (Array.isArray(words) && words.length > 0) {
        words.forEach(word => {
            const div = document.createElement('div');
            div.className = 'calligraphy-word'; 
            div.textContent = word;
            chuChonContainer.appendChild(div);
        });
    } else {
        // Trường hợp lỗi: không phải mảng 2 chữ
        chuChonContainer.innerHTML = `<div class="calligraphy-word">${words ? words[0] : 'LỖI'}</div>`;
    }
};


submitBtn.addEventListener('click', async () => {
    const mongMuon = mongMuonInput.value.trim();
    if (mongMuon.length < 10) {
        alert('Vui lòng nhập mong muốn chi tiết hơn (tối thiểu 10 ký tự).');
        return;
    }

    // LẤY DANH SÁCH CÁC CHỮ ĐÃ DÙNG TRONG NGÀY
    const usedWords = getUsedWords();

    // Ẩn Input, Hiện Loading
    inputSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // GỬI KÈM DANH SÁCH ĐÃ DÙNG LÊN BACKEND
            body: JSON.stringify({ mong_muon: mongMuon, used_words: usedWords }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi Server: ${response.statusText} - ${errorData.error}`);
        }

        const data = await response.json();
        const selectedWords = data.chu_chon;

        // LƯU LẠI CHỮ MỚI ĐÃ CHỌN VÀO LOCAL STORAGE (2 chữ)
        if (selectedWords) {
            addUsedWord(selectedWords);
        }

        // Cập nhật kết quả (gọi hàm mới)
        displayCalligraphyWords(selectedWords); 
        loiBinhDisplay.textContent = data.loi_binh || 'Xin lỗi, AI chưa thể chọn chữ phù hợp. Hãy thử lại!';

        // Ẩn Loading, Hiện Kết quả
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('Lỗi khi gọi API AI:', error);
        alert('Đã xảy ra lỗi khi xin chữ. Vui lòng kiểm tra Terminal (netlify dev) để xem lỗi chi tiết.');
        
        // Trở về màn hình Input
        loadingSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
    }
});

// Logic cho nút Tải Ảnh 
downloadBtn.addEventListener('click', () => {
    const resultCard = document.querySelector('.result-card');
    
    if (window.html2canvas) {
        // Tải ảnh với scale 2 để ảnh nét hơn
        html2canvas(resultCard, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            // Đặt tên file theo chữ đầu tiên
            const firstWord = chuChonContainer.querySelector('.calligraphy-word')?.textContent || 'chu';
            link.download = `xin-chu-ai-${firstWord}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    } else {
        alert('Vui lòng tải lại trang và đảm bảo thư viện html2canvas đã được nhúng.');
    }
});

// Logic cho nút Quay lại
quayLaiBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    mongMuonInput.value = ''; 
});