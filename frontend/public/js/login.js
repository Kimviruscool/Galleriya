const API_URL = 'https://galleriya-backend-143.onrender.com';


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            // Simulate login or integrate with backend later
            console.log(`Login attempted with: ${email}`);
            alert(`${email}님 로그인 되었습니다. (시뮬레이션)`);
            window.location.href = 'index.html';
        } else {
            alert('이메일과 비밀번호를 입력해주세요.');
        }
    });
});
