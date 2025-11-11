
const API_ENDPOINT = '/.netlify/functions/xin-chu';
const submitBtn = document.getElementById('submit-btn');
const inputSection = document.getElementById('input-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const mongMuonInput = document.getElementById('mong-muon-input');

// CÁC THÀNH PHẦN MỚI
const chuChon1Display = document.getElementById('chu-chon-1');
const chuChon2Display = document.getElementById('chu-chon-2');
const cau1Display = document.getElementById('cau-thu-phap-1');
const cau2Display = document.getElementById('cau-thu-phap-2');
const loiBinhDisplay = document.getElementById('loi-binh');
const downloadBtn = document.getElementById('download-btn');
const quayLaiBtn = document.getElementById('quay-lai-btn');

submitBtn.addEventListener('click', async () => {
    const mongMuon = mongMuonInput.value.trim();
    if (mongMuon.length < 10) {
        alert('Vui lòng nhập mong muốn chi tiết hơn (tối thiểu 10 ký tự).');
        return;
    }

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
            body: JSON.stringify({ mong_muon: mongMuon }),
        });

        if (!response.ok) {
            throw new Error(`Lỗi Server: ${response.statusText}`);
        }

        const data = await response.json();

        // Cập nhật kết quả từ 5 trường dữ liệu API
        chuChon1Display.textContent = data.chu_chon_1 || 'PHÚC';
        chuChon2Display.textContent = data.chu_chon_2 || 'LỘC';
        cau1Display.textContent = data.cau_1 || 'Xin chữ chưa nhận được câu 1';
        cau2Display.textContent = data.cau_2 || 'Xin chữ chưa nhận được câu 2';
        loiBinhDisplay.textContent = data.loi_binh || 'Xin lỗi, AI chưa thể chọn chữ phù hợp. Hãy thử lại!';

        // Ẩn Loading, Hiện Kết quả
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('Lỗi khi gọi API AI:', error);
        // Thay đổi thông báo lỗi để người dùng dễ hiểu hơn
        alert('Đã xảy ra lỗi khi xin chữ. Vui lòng kiểm tra Netlify Terminal (nếu chạy local) hoặc Logs (nếu deploy).'); 
        // Trở về màn hình Input
        loadingSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
    }
});

// Logic cho nút Quay Lại
quayLaiBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    mongMuonInput.value = ''; // Xóa nội dung input
});


// Logic cho nút Tải Ảnh
downloadBtn.addEventListener('click', () => {
    const resultCard = document.querySelector('.result-card');
    
    if (typeof html2canvas !== 'undefined') {
        html2canvas(resultCard, {
            useCORS: true, 
            scale: 2 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `xin-chu-ai-${chuChon1Display.textContent}-${chuChon2Display.textContent}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    } else {
        alert("Thư viện html2canvas chưa được tải. Vui lòng kiểm tra file index.html.");
    }
});