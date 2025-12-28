const loadHeader = () => {
    const headerHTML = `
    <header class="main-header">
        <a href="index.html" style="text-decoration: none;">
            <div class="logo">Galleriya</div>
        </a>
        <nav>
            <ul>
                <li><a href="upload.html" id="nav-upload">업로드</a></li>
                <li><a href="index.html" id="nav-community">커뮤니티</a></li>
                <li><a href="contact.html" id="nav-contact">문의</a></li>
            </ul>
        </nav>
    </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);

    // Highlight active link
    const path = window.location.pathname;
    const page = path.split("/").pop();

    const navLinks = {
        "upload.html": "nav-upload",
        "index.html": "nav-community",
        "contact.html": "nav-contact",
        "login.html": "", // Login doesn't need highlight in main nav usually, or maybe it does?
        "": "nav-community"
    };

    // Handle root path or index.html
    const key = (page === "" || page === "index.html") ? "index.html" : page;

    const activeId = navLinks[key];
    if (activeId) {
        const activeElement = document.getElementById(activeId);
        if (activeElement) {
            activeElement.classList.add('active'); // Use class instead of inline style for cleaner CSS
            activeElement.style.color = "var(--accent-color)";
            activeElement.style.fontWeight = "bold";
        }
    }
};

if (document.body) {
    loadHeader();
} else {
    document.addEventListener("DOMContentLoaded", loadHeader);
}
