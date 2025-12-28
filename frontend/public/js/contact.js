const API_URL = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchContacts();

    // Modal Elements
    const modal = document.getElementById('contactModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeBtn = document.querySelector('.close-contact-modal');
    const contactForm = document.getElementById('contactForm');

    // Open Modal
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    // Close Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle Submit
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const email = document.getElementById('email').value;
        const content = document.getElementById('content').value;

        try {
            const response = await fetch(`${API_URL}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, email, content })
            });

            if (response.ok) {
                alert('문의가 등록되었습니다.');
                contactForm.reset();
                modal.style.display = 'none';
                fetchContacts(); // Refresh list
            } else {
                alert('문의 등록 실패');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('오류가 발생했습니다.');
        }
    });
});

async function fetchContacts() {
    try {
        const response = await fetch(`${API_URL}/contacts`);
        const contacts = await response.json();

        const tableBody = document.getElementById('inquiryTableBody');
        tableBody.innerHTML = '';

        if (contacts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem; color: #aaa;">등록된 문의가 없습니다.</td></tr>';
            return;
        }

        contacts.forEach((contact, index) => {
            const row = document.createElement('tr');

            const isAnswered = index % 2 !== 0;
            const statusText = isAnswered ? '답변완료' : '답변대기';
            const statusColor = isAnswered ? '#00d2ff' : '#aaa';

            // Escape single quotes for use in onclick
            const safeContact = JSON.stringify(contact).replace(/'/g, "&#39;");

            row.innerHTML = `
                <!-- No Column Removed -->
                <td class="col-title" onclick='openViewModal(${safeContact})'>${contact.title}</td>
                <td class="col-date">${contact.timestamp}</td>
                <td class="col-status" style="color: ${statusColor}">${statusText}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
    }
}

// Global function to open detail modal
window.openViewModal = function (contact) {
    const viewModal = document.getElementById('viewModal');
    if (!viewModal) return;

    document.getElementById('viewTitle').textContent = contact.title;
    document.getElementById('viewAuthor').textContent = `작성자: ${contact.email || '익명'}`;
    document.getElementById('viewDate').textContent = contact.timestamp;
    document.getElementById('viewContent').textContent = contact.content;

    // Dummy Status
    const statusText = '답변대기';
    document.getElementById('viewStatus').textContent = statusText;

    viewModal.style.display = 'flex';

    // Close logic
    const closeBtn = viewModal.querySelector('.close-view-modal');
    if (closeBtn) {
        closeBtn.onclick = function () {
            viewModal.style.display = 'none';
        };
    }

    window.onclick = function (e) {
        if (e.target === viewModal) {
            viewModal.style.display = 'none';
        }
    };
};
