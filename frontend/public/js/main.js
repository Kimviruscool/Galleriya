const API_URL = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main.js loaded');
    const galleryGrid = document.getElementById('galleryGrid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const captionText = document.getElementById('caption');
    const commentsList = document.getElementById('comments-list');
    const commentInput = document.getElementById('comment-input');
    const sendCommentBtn = document.getElementById('send-comment');
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

        // Update comments
        renderComments(photoData.comments || []);

        // Add Like Button to Lightbox
        let likeBtn = document.getElementById('lightbox-like-btn');
        if (!likeBtn) {
            // Create like button if it doesn't exist
            const headerArea = document.querySelector('.lightbox-header');
            likeBtn = document.createElement('button');
            likeBtn.id = 'lightbox-like-btn';
            likeBtn.style.cssText = "background:transparent; border:1px solid var(--accent-color); color:var(--accent-color); padding:5px 10px; border-radius:15px; cursor:pointer; margin-top:10px;";
            headerArea.appendChild(likeBtn);
        }

        // Update like text and event
        updateLikeButton(likeBtn, photoData.likes || 0);

        likeBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                const response = await fetch(`${API_URL}/photos/${currentPhotoId}/like`, { method: 'POST' });
                if (response.ok) {
                    const data = await response.json();
                    updateLikeButton(likeBtn, data.likes);
                    // Refresh grid to update counts there too (optional but good for consistency)
                    loadPhotos();
                }
            } catch (e) {
                console.error(e);
            }
        };
    }

    function updateLikeButton(btn, count) {
        btn.innerHTML = `❤️ 좋아요 (${count})`;
    }

    function renderComments(comments) {
        commentsList.innerHTML = '';
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<p style="color:#777; font-size: 0.9rem; text-align:center; padding-top: 2rem;">첫 번째 댓글을 남겨보세요.</p>';
            return;
        }

        comments.forEach(comment => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div>
                    <span class="comment-author">${comment.alias}</span>
                    <span class="comment-text">${comment.content}</span>
                </div>
                <span class="comment-time">${new Date(comment.timestamp).toLocaleString('ko-KR')}</span>
            `;
            commentsList.appendChild(div);
        });
        commentsList.scrollTop = commentsList.scrollHeight;
    }

    async function submitComment() {
        const text = commentInput.value.trim();
        if (!text || !currentPhotoId) return;

        try {
            sendCommentBtn.textContent = '...';
            sendCommentBtn.disabled = true;

            const response = await fetch(`${API_URL}/photos/${currentPhotoId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, content: text })
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
    sendCommentBtn.onclick = submitComment;
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitComment();
    });

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
