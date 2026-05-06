// ССЫЛКА НА ТВОЙ SPACE (возьми ее из настроек Space или из браузерной строки, когда он запустится)
const API_URL = "https://emeraldcreator-bluetokbase.hf.space"; 

let userAva = null;
let bolts = [];

// ИНИЦИАЛИЗАЦИЯ КАНВАСА
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed'; canvas.style.inset = '0'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '10000';
function res() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = res; res();

// ЗАГРУЗКА ВИДЕО ИЗ ОБЛАКА ПРИ СТАРТЕ
async function loadVideosFromCloud() {
    try {
        const response = await fetch(`${API_URL}/videos`);
        const videoPaths = await response.json();
        videoPaths.reverse().forEach(path => {
            createVideoCard(API_URL + path, false);
        });
    } catch (e) {
        console.error("Облако еще не проснулось или адрес неверен", e);
    }
}

// СОЗДАНИЕ КАРТОЧКИ
function createVideoCard(url, prepend = true) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="content-frame">
            <video src="${url}" loop playsinline onclick="this.play()"></video>
        </div>
        <div class="comm-box">
            <div class="comm-list"></div>
            <input type="text" class="comm-input" placeholder="Коммент..." onkeydown="addComment(event, this)">
        </div>
        <div class="controls">
            <div class="btn like-btn" onclick="toggleLike(this, event)">⚡</div>
            <div class="like-count">0</div>
            <div class="btn mute-btn" onclick="toggleSound(this)">🔇</div>
            <div class="btn" onclick="toggleComm(this)">💬</div>
            <div class="btn" onclick="openProfile()">👤</div>
        </div>
    `;
    const feed = document.getElementById('feed');
    prepend ? feed.prepend(card) : feed.appendChild(card);
}

// ОТПРАВКА ВИДЕО В ОБЛАКО
document.getElementById('video-upload').onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.querySelector('.add-btn');
    btn.innerText = "⏳"; // Показываем загрузку

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        createVideoCard(API_URL + data.url);
    } catch (err) {
        alert("Ошибка связи с облаком!");
    } finally {
        btn.innerText = "+";
    }
};

// --- ОСТАЛЬНАЯ ЛОГИКА (ЛАЙКИ, КОММЕНТЫ, АВТОРИЗАЦИЯ) ---

function toggleLike(btn, e) {
    const label = btn.parentElement.querySelector('.like-count');
    let count = parseInt(label.innerText);
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        label.innerText = count - 1;
    } else {
        btn.classList.add('active');
        label.innerText = count + 1;
        for(let i=0; i<8; i++) bolts.push({ x: e.clientX, y: e.clientY, life: 1.0 });
    }
}

function toggleSound(btn) {
    const video = btn.closest('.card').querySelector('video');
    video.muted = !video.muted;
    btn.innerText = video.muted ? "🔇" : "🔊";
    btn.classList.toggle('active', !video.muted);
}

function handleAuth() {
    const n = document.getElementById('nick').value.trim();
    const p = document.getElementById('pass').value.trim();
    if(!n || !p) return alert("Введи логин и пароль!");
    localStorage.setItem('bt_current', n);
    start();
}

function start() {
    const u = localStorage.getItem('bt_current');
    if(!u) return;
    document.getElementById('reg-screen').style.display = 'none';
    document.getElementById('feed').style.display = 'block';
    document.getElementById('navbar').style.display = 'flex';
    document.getElementById('user-display').innerText = u.toUpperCase();
    loadVideosFromCloud(); // Запускаем загрузку из облака
}

function toggleComm(btn) {
    const box = btn.closest('.card').querySelector('.comm-box');
    box.style.display = (box.style.display === 'flex') ? 'none' : 'flex';
}

function addComment(e, input) {
    if (e.key === 'Enter' && input.value) {
        const list = input.parentElement.querySelector('.comm-list');
        const d = document.createElement('div');
        d.innerText = "> " + input.value;
        list.appendChild(d);
        input.value = "";
    }
}

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
