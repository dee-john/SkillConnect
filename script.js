/* ========= SkillConnect - script.js =========
   - Uses localStorage to store users and posts
   - users stored under 'sc_users' as array
   - posts stored under 'sc_posts' as array
   - current logged-in username stored under 'sc_current'
*/

/* ---------- Helpers ---------- */
const USERS_KEY = "sc_users";
const POSTS_KEY = "sc_posts";
const CURRENT_KEY = "sc_current";

const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}
function saveUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}
function loadPosts() {
  return JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
}
function savePosts(p) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(p));
}
function setCurrent(username) {
  localStorage.setItem(CURRENT_KEY, username);
}
function getCurrent() {
  return localStorage.getItem(CURRENT_KEY);
}
function logout() {
  localStorage.removeItem(CURRENT_KEY);
}

/* ---------- Nav state (show/hide profile/logout) ---------- */
function refreshNav() {
  const cur = getCurrent();
  const profileLink = qs("#nav-profile");
  const loginLink = qs("#nav-login");
  const logoutLink = qs("#nav-logout");
  if (profileLink) profileLink.classList.toggle("hidden", !cur);
  if (loginLink) loginLink.classList.toggle("hidden", !!cur);
  if (logoutLink) logoutLink.classList.toggle("hidden", !cur);
}
document.addEventListener("DOMContentLoaded", refreshNav);

/* ---------- Mobile Menu Toggle ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = qs(".hamburger");
  const nav = qs(".nav");

  if (hamburger && nav) {
    hamburger.addEventListener("click", () => {
      nav.classList.toggle("show");
    });

    // Optional: close menu when a link is clicked (for better UX)
    qsa(".nav-link").forEach((link) =>
      link.addEventListener("click", () => nav.classList.remove("show"))
    );
  }
});

/* ---------- REGISTER PAGE ---------- */
const registerForm = qs("#registerForm");
if (registerForm) {
  const profileImageInput = qs("#profileImage");
  const profilePreview = qs("#profilePreview");
  profileImageInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => (profilePreview.src = r.result);
    r.readAsDataURL(f);
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = qs("#name").value.trim();
    const username = qs("#username").value.trim();
    const password = qs("#password").value;
    const category = qs("#skillCategory").value || "Others";
    const bio = qs("#bio").value.trim();
    const photo = profilePreview.src || "";

    if (!name || !username || !password) {
      alert("Please fill name, username and password.");
      return;
    }

    const users = loadUsers();
    if (
      users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      alert("Username already exists. Choose another.");
      return;
    }
    users.push({ name, username, password, category, bio, photo });
    saveUsers(users);
    alert("Account created — please login.");
    window.location.href = "login.html";
  });
}

/* ---------- LOGIN PAGE ---------- */
const loginForm = qs("#loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = qs("#loginUsername").value.trim();
    const password = qs("#loginPassword").value;
    const users = loadUsers();
    const u = users.find(
      (x) => x.username === username && x.password === password
    );
    if (!u) {
      alert("Invalid credentials.");
      return;
    }
    setCurrent(u.username);
    refreshNav();
    window.location.href = "profile.html";
  });
}

/* ---------- PROFILE PAGE ---------- */
const profileMain = qs(".profile-main");
if (profileMain) {
  const cur = getCurrent();
  if (!cur) {
    alert("Please login");
    window.location.href = "login.html";
  }
  const users = loadUsers();
  const me = users.find((u) => u.username === cur);
  if (!me) {
    alert("User not found");
    logout();
    window.location.href = "login.html";
  }

  // populate sidebar
  qs("#mePhoto").src = me.photo || "https://via.placeholder.com/140";
  qs("#meName").textContent = me.name;
  qs("#meCategory").textContent = me.category;
  qs("#meBio").textContent = me.bio || "";

  // upload post
  const postImageInput = qs("#postImage");
  const uploadBtn = qs("#uploadBtn");
  uploadBtn.addEventListener("click", () => {
    const caption = qs("#postCaption").value.trim();
    const file = postImageInput.files[0];
    if (!file || !caption) {
      alert("Add a caption and image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const posts = loadPosts();
      posts.push({
        id: Date.now(),
        username: me.username,
        name: me.name,
        userPhoto: me.photo || "",
        category: me.category,
        caption,
        image: reader.result,
        likes: 0,
        comments: [],
      });
      savePosts(posts);
      qs("#postCaption").value = "";
      postImageInput.value = "";
      renderAllPosts(); // update grid
      alert("Post uploaded!");
    };
    reader.readAsDataURL(file);
  });

  // logout button in profile header
  const logoutBtn = qs("#logoutBtn");
  if (logoutBtn)
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
      refreshNav();
      window.location.href = "index.html";
    });

  // initial render
  renderAllPosts();
}

/* ---------- HOME feed + SEARCH + FILTER ---------- */
const postsGrid = qs("#postsGrid");
if (postsGrid) {
  const searchInput = qs("#searchInput");
  const catFilter = qs("#categoryFilter");
  if (searchInput) searchInput.addEventListener("input", renderAllPosts);
  if (catFilter) catFilter.addEventListener("change", renderAllPosts);
  renderAllPosts();
}

/* ---------- Render function used by both home & profile -------- */
function renderAllPosts() {
  const posts = loadPosts();
  const users = loadUsers();
  const curUser = getCurrent();
  const search =
    (qs("#searchInput") && qs("#searchInput").value.trim().toLowerCase()) || "";
  const cat = (qs("#categoryFilter") && qs("#categoryFilter").value) || "all";

  let filtered = posts.filter((p) => {
    const u = users.find((x) => x.username === p.username) || {};
    const matchesSearch =
      !search ||
      p.caption.toLowerCase().includes(search) ||
      (u.name && u.name.toLowerCase().includes(search));
    const matchesCat = cat === "all" || u.category === cat;
    return matchesSearch && matchesCat;
  });

  filtered = filtered.slice().reverse();

  const markup = filtered
    .map((p) => {
      const owner = loadUsers().find((u) => u.username === p.username) || {};
      const isMine = curUser === p.username;
      const commentsHtml = (p.comments || [])
        .map(
          (c) =>
            `<div class="c-item"><b>${escapeHtml(c.user)}</b>: ${escapeHtml(
              c.text
            )}</div>`
        )
        .join("");
      return `
      <article class="post-card" data-id="${p.id}">
        <div class="post-header">
          <img class="user-thumb" src="${
            owner.photo || "https://via.placeholder.com/80"
          }" alt="${escapeHtml(owner.name || p.username)}">
          <div>
            <div class="post-author">${escapeHtml(
              owner.name || p.username
            )}</div>
            <div class="post-meta">${escapeHtml(owner.category || "")}</div>
          </div>
        </div>

        <img class="post-media" src="${p.image}" alt="work image" />
        <div class="post-body">
          <p class="post-text">${escapeHtml(p.caption)}</p>
        </div>

        <div class="post-actions">
          <button class="like-btn" data-id="${p.id}">❤️ <span>${
        p.likes || 0
      }</span></button>
          <button class="comment-toggle" data-id="${p.id}">💬 <span>${
        (p.comments || []).length
      }</span></button>
          <button class="share-btn" data-id="${p.id}">🔗 Share</button>
          ${
            isMine
              ? `<button class="delete-btn" data-id="${p.id}">🗑️</button>`
              : ""
          }
        </div>

        <div class="comments-box hidden" id="comments-${p.id}">
          <div class="comments-list">${
            commentsHtml || '<div class="muted small">No comments yet</div>'
          }</div>
          <div class="comments-input">
            <input class="c-input" id="cinput-${
              p.id
            }" placeholder="Write a comment..." />
            <button class="c-post" data-id="${p.id}">Post</button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  const container = qs("#userPostsGrid") || qs("#postsGrid");
  if (container)
    container.innerHTML =
      markup || `<p class="muted">No posts yet — be the first to share!</p>`;

  attachPostActions();
}

/* ---------- Post Actions ---------- */
function attachPostActions() {
  qsa(".like-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const posts = loadPosts();
      const p = posts.find((x) => x.id === id);
      if (p) {
        p.likes = (p.likes || 0) + 1;
        savePosts(posts);
        renderAllPosts();
      }
    };
  });

  qsa(".delete-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      if (!confirm("Delete this post?")) return;
      const posts = loadPosts().filter((x) => x.id !== id);
      savePosts(posts);
      renderAllPosts();
    };
  });

  qsa(".comment-toggle").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const box = qs(`#comments-${id}`);
      if (box) box.classList.toggle("hidden");
    };
  });

  qsa(".c-post").forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const input = qs(`#cinput-${id}`);
      const text = input.value.trim();
      if (!text) return;
      const posts = loadPosts();
      const p = posts.find((x) => x.id === id);
      const cur = getCurrent() || "Guest";
      p.comments = p.comments || [];
      p.comments.push({ user: cur, text });
      savePosts(posts);
      renderAllPosts();
    };
  });

  qsa(".share-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const url = `${location.origin}${location.pathname}#post-${id}`;
      navigator.clipboard?.writeText(url).then(
        () => alert("Post link copied to clipboard!"),
        () => alert("Copy not supported.")
      );
    };
  });
}

/* ---------- Utility: escapeHtml ---------- */
function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  refreshNav();
  if (qs("#postsGrid") || qs("#userPostsGrid")) renderAllPosts();
});
