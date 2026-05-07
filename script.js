const API_URL = "https://bluetok-server.onrender.com"; 

let bolts = [];

// --- ЭФФЕКТЫ МОЛНИЙ ---
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed'; canvas.style.inset = '0'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '10000';
function res() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = res; res();

// --- БУДИЛЬНИК ДЛЯ СЕРВЕРА (чтобы не засыпал) ---
function keepServerAlive() {
    setInterval(async () => {
        try {
            console.log("Пинаем сервер Render... 🚀");
            await fetch(API_URL + "/"); 
        } catch (e) { console.log("Сервер спит, будим..."); }
    }, 300000); // Пингаем каждые 5 минут
}

// --- ЗАГРУЗКА ВИДЕО ---
async function loadVideosFromCloud() {
    try {
        const response = await fetch(API_URL + "/videos");
        const videoPaths = await response.json();
        const feed = document.getElementById('feed');
        feed.innerHTML = '';
        
        if(videoPaths.length === 0) {
            feed.innerHTML = '<div style="text-align:center; padding-top:50vh; color:var(--neon-blue)">ЛЕНТА ПУСТА. ЗАГРУЗИ ВИДЕО!</div>';
            return;
        }

        videoPaths.reverse().forEach(url => {
            createVideoCard(url, false);
        });
    } catch (e) {
        console.log("Ошибка загрузки ленты. Проверь сервер!");
    }
}

function createVideoCard(url, prepend = true) {
    const videoName = url.split('/').pop();
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="content-frame">
            <video src="${url}" loop playsinline muted onclick="this.play(); this.muted=false;"></video>
        </div>
        <div class="comm-box" style="display:none; flex-direction:column; background:rgba(0,0,0,0.9); padding:10px; border-top:1px solid var(--neon-blue);">
            <div class="comm-list" style="max-height:150px; overflow-y:auto; margin-bottom:10px; font-size:14px;">Загрузка...</div>
            <input type="text" class="comm-input" placeholder="Написать..." onkeydown="addComment(event, this)" style="background:none; border:1px solid var(--neon-blue); color:white; padding:5px;">
        </div>
        <div class="controls">
            <div class="btn like-btn" onclick="toggleLike(this, event)">⚡</div><div class="like-count">0</div>
            <div class="btn mute-btn active" onclick="toggleSound(this)">🔇</div>
            <div class="btn" onclick="toggleComm(this, '${videoName}')">💬</div>
            <div class="btn" onclick="openProfile()">👤</div>
        </div>
    `;
    const feed = document.getElementById('feed');
    prepend ? feed.prepend(card) : feed.appendChild(card);
}

// --- КОММЕНТАРИИ (ДЛЯ КАЖДОГО ВИДЕО СВОИ) ---
async function toggleComm(btn, videoName) {
    const box = btn.closest('.card').querySelector('.comm-box');
    const isOpening = box.style.display !== 'flex';
    box.style.display = isOpening ? 'flex' : 'none';
    if(isOpening) {
        const list = box.querySelector('.comm-list');
        try {
            const res = await fetch(API_URL + "/comments/" + videoName);
            const data = await res.json();
            list.innerHTML = data.length > 0 
                ? data.map(c => `<div style="margin-bottom:5px;"><b style="color:var(--neon-blue)">${c.author}:</b> ${c.text}</div>`).join('')
                : "Нет комментариев. Будь первым!";
        } catch (e) { list.innerHTML = "Ошибка загрузки комментов."; }
    }
}

async function addComment(e, input) {
    if (e.key === 'Enter' && input.value.trim()) {
        const text = input.value;
        const author = localStorage.getItem('bt_current') || "Аноним";
        const videoSrc = input.closest('.card').querySelector('video').src;
        const videoName = videoSrc.split('/').pop();

        input.value = "⏳";
        const formData = new FormData();
        formData.append("video_name", videoName);
        formData.append("text", text);
        formData.append("author", author);

        await fetch(API_URL + "/comment", { method: "POST", body: formData });
        input.value = "";
        toggleComm(input.closest('.card').querySelector('.btn[onclick*="toggleComm"]'), videoName);
    }
}

// --- СИСТЕМА ВХОДА ---
function handleAuth() {
    const nick = document.getElementById('nick').value.trim();
    if(!nick) return alert("ВВЕДИ НИК!");
    localStorage.setItem('bt_current', nick);
    start();
}

function start() {
    const user = localStorage.getItem('bt_current');
    if(!user) return;
    document.getElementById('reg-screen').style.display = 'none';
    document.getElementById('feed').style.display = 'block';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('user-display').innerText = user.toUpperCase();
    loadVideosFromCloud();
    keepServerAlive(); // Запускаем будильник
}

// --- ПРОЧЕЕ ---
function toggleLike(btn, e) {
    const label = btn.parentElement.querySelector('.like-count');
    btn.classList.toggle('active');
    let count = parseInt(label.innerText);
    label.innerText = btn.classList.contains('active') ? count + 1 : count - 1;
    if(btn.classList.contains('active')) {
        for(let i=0; i<10; i++) bolts.push({ x: e.clientX, y: e.clientY, life: 1.0 });
    }
}

function toggleSound(btn) {
    const v = btn.closest('.card').querySelector('video');
    v.muted = !v.muted;
    btn.innerText = v.muted ? "🔇" : "🔊";
}

document.getElementById('video-upload').onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const btn = document.querySelector('.add-btn');
    btn.innerText = "⏳";
    const formData = new FormData();
    formData.append("file", file);
    try {
        await fetch(API_URL + "/upload", { method: "POST", body: formData });
        location.reload();
    } catch (err) { alert("Ошибка!"); btn.innerText = "+"; }
};

function openProfile() { document.getElementById('profile-screen').style.display = 'block'; }
function closeProfile() { document.getElementById('profile-screen').style.display = 'none'; }
function logout() { localStorage.removeItem('bt_current'); location.reload(); }

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bolts.forEach((b, i) => {
        b.life -= 0.04;
        if(b.life > 0) {
            ctx.strokeStyle = `rgba(0, 210, 255, ${b.life})`;
            ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, b.y);
            let cx = b.x, cy = b.y;
            for(let j=0; j<5; j++) { cx += Math.random()*40-20; cy += Math.random()*40-20; ctx.lineTo(cx, cy); }
            ctx.stroke();
        } else bolts.splice(i, 1);
    });
    requestAnimationFrame(loop);
}
loop();
window.onload = start;
