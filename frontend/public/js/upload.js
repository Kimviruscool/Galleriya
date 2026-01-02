const API_URL = 'https://galleriya-backend-143.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileNameSpan = document.getElementById('fileName');

    // Show filename and Preview when selected
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;

            // Image Preview
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewContainer = document.getElementById('previewContainer');
                previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            }
            reader.readAsDataURL(file);
        } else {
            fileNameSpan.textContent = '선택된 파일 없음';
            document.getElementById('previewContainer').innerHTML = '<div class="placeholder-icon">📷</div>';
        }
    });

    // Handle Upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (fileInput.files.length === 0) {
            alert('사진을 선택해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const submitBtn = uploadForm.querySelector('.upload-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '업로드 중...';
            submitBtn.disabled = true;

            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('사진이 업로드되었습니다!');
                window.location.href = 'index.html'; // Redirect to Community
            } else {
                alert(`업로드 실패: ${result.error || '알 수 없는 오류'}`);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('업로드 중 오류가 발생했습니다.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
