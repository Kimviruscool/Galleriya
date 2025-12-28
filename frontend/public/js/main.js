const API_URL = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main.js loaded');
    const galleryGrid = document.getElementById('galleryGrid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const captionText = document.getElementById('lightbox-caption');
    const commentsList = document.getElementById('comments-list');
    const closeBtn = document.querySelector('.close-lightbox');

    let currentPhotoId = null;
    let userId = getCookie('user_id');

    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        setCookie('user_id', userId, 365);
    }

    // Helper: Cookie Functions
    function getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{ }\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // Load Photos
    async function loadPhotos() {
        try {
            const response = await fetch(`${API_URL}/photos`);
            if (!response.ok) throw new Error('Failed to fetch photos');
            const photos = await response.json();

            galleryGrid.innerHTML = '';

            if (photos.length === 0) {
                galleryGrid.innerHTML = '<p style="text-align:center; width:100%; color:#777; margin-top:2rem;">아직 공유된 사진이 없습니다. 첫 번째 사진을 공유해보세요!</p>';
                return;
            }

            photos.forEach(photo => {
                const card = document.createElement('div');
                card.className = 'photo-card';

                const uploadDate = new Date(photo.timestamp);
                const timeString = uploadDate.toLocaleString('ko-KR');
                const imgUrl = `${API_URL}/uploads/${photo.filename}`;
                const commentCount = photo.comments ? photo.comments.length : 0;
                const likeCount = photo.likes || 0;

                card.innerHTML = `
                    <div class="photo-overlay"></div>
                    <img src="${imgUrl}" alt="Anonymous Photo" loading="lazy">
                    <div class="timestamp">${timeString}</div>
                    <div class="stats-area" style="position:absolute; bottom:10px; left:15px; z-index:2; display:flex; gap:10px; color:white; font-size:0.9rem;">
                        <span>💬 ${commentCount}</span>
                        <span>❤️ ${likeCount}</span>
                    </div>
                `;

                card.onclick = () => openLightbox(imgUrl, timeString, photo);
                galleryGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading photos:', error);
            galleryGrid.innerHTML = '<p style="text-align:center; width:100%; color:red;">사진을 불러오는데 실패했습니다.</p>';
        }
    }

    // Lightbox Functions
    function openLightbox(src, caption, photoData) {
        lightbox.style.display = "flex";
        lightboxImg.src = src;
        captionText.innerHTML = caption;
        currentPhotoId = photoData.id;

        // Render comments
        renderComments(photoData.comments || []);

        // Add Like Button if missing
        let likeBtn = document.getElementById('lightbox-like-btn');
        if (!likeBtn) {
            const headerArea = document.querySelector('.lightbox-header');
            likeBtn = document.createElement('button');
            likeBtn.id = 'lightbox-like-btn';
            likeBtn.style.cssText = "background:transparent; border:1px solid var(--accent-color); color:var(--accent-color); padding:5px 10px; border-radius:15px; cursor:pointer; margin-top:10px;";
            headerArea.appendChild(likeBtn);
        }
        updateLikeButton(likeBtn, photoData.likes || 0);

        likeBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                const response = await fetch(`${API_URL}/photos/${currentPhotoId}/like`, { method: 'POST' });
                if (response.ok) {
                    const data = await response.json();
                    updateLikeButton(likeBtn, data.likes);
                    loadPhotos(); // Refresh grid
                }
            } catch (e) {
                console.error(e);
            }
        };

        // Ensure Comment Input Exists
        let commentInputArea = document.getElementById('comment-input-area');
        if (!commentInputArea) {
            const commentSection = document.querySelector('.lightbox-comment-area');
            commentInputArea = document.createElement('div');
            commentInputArea.id = 'comment-input-area';
            commentInputArea.style.cssText = "padding: 1rem; border-top: 1px solid var(--glass-border); display:flex; gap:5px;";
            commentInputArea.innerHTML = `
                <input type="text" id="new-comment-text" placeholder="댓글 달기..." style="flex:1; padding:8px; border-radius:5px; border:none;">
                <button id="submit-comment-btn" style="background:var(--accent-color); border:none; color:white; padding:5px 15px; border-radius:5px; cursor:pointer;">게시</button>
            `;
            commentSection.appendChild(commentInputArea);

            document.getElementById('submit-comment-btn').onclick = submitComment;
            document.getElementById('new-comment-text').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitComment();
            });
        }
    }

    function updateLikeButton(btn, count) {
        btn.innerHTML = `❤️ 좋아요 (${count})`;
    }

    function renderComments(comments) {
        commentsList.innerHTML = '';
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="color:#aaa; text-align:center; margin-top:20px;">첫 댓글을 남겨보세요!</p>';
            return;
        }
        comments.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.innerHTML = `
                <span class="comment-author">${comment.alias}</span>
                <span class="comment-text">${comment.content}</span>
                <span class="comment-time">${new Date(comment.timestamp).toLocaleTimeString()}</span>
            `;
            commentsList.appendChild(item);
        });
        commentsList.scrollTop = commentsList.scrollHeight; // Ensure scroll to bottom
    }

    async function submitComment() {
        const input = document.getElementById('new-comment-text');
        const content = input.value.trim();
        if (!content || !currentPhotoId) return;

        // Get or create a persistent user ID for this browser
        let userId = localStorage.getItem('galleriya_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('galleriya_user_id', userId);
        }

        const submitBtn = document.getElementById('submit-comment-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = '...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/photos/${currentPhotoId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    content: content
                })
            });

            if (response.ok) {
                const newComment = await response.json();
                // Clear empty message if exists
                if (commentsList.querySelector('p')) commentsList.innerHTML = '';

                const div = document.createElement('div');
                div.className = 'comment-item';
                div.innerHTML = `
                    <div>
                        <span class="comment-author">${newComment.alias}</span>
                        <span class="comment-text">${newComment.content}</span>
                    </div>
                    <span class="comment-time">${new Date(newComment.timestamp).toLocaleString('ko-KR')}</span>
                `;
                commentsList.appendChild(div);
                commentsList.scrollTop = commentsList.scrollHeight;
                commentInput.value = '';

                // Reload photos to update comment count on the card
                loadPhotos();
            } else {
                alert('댓글 작성 실패');
            }
        } catch (e) {
            console.error(e);
            alert('오류 발생');
        } finally {
            sendCommentBtn.textContent = '등록';
            sendCommentBtn.disabled = false;
        }
    }

    // Event Listeners
    // Event Listeners

    closeBtn.onclick = () => {
        lightbox.style.display = "none";
    };

    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = "none";
        }
    };

    // Initial Load
    loadPhotos();
});
