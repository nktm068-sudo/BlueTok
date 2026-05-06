let userAva = null;
let bolts = [];

// ИНИЦИАЛИЗАЦИЯ КАНВАСА ДЛЯ МОЛНИЙ
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed'; canvas.style.inset = '0'; canvas.style.pointerEvents = 'none';
function res() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = res; res();

// ГОРЯЧИЕ КЛАВИШИ
window.addEventListener('keydown', (e) => {
    const feed = document.getElementById('feed');
    if (e.key === 'ArrowDown') feed.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    if (e.key === 'ArrowUp') feed.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
});

// ОБРАБОТКА АВАТАРА
document.getElementById('avatar-file').onchange = function(e) {
    const reader = new FileReader();
    reader.onload = (ev) => { 
        userAva = ev.target.result; 
        document.querySelector('.file-label').innerText = "✅ АВАТАР ВЫБРАН";
    };
    reader.readAsDataURL(e.target.files[0]);
};

// ЗАГРУЗКА ВИДЕО (С ПОДДЕРЖКОЙ ЗВУКА)
document.getElementById('video-upload').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="content-frame">
            <video src="${url}" loop playsinline onclick="this.play()"></video>
        </div>
        <div class="comm-box"><div class="comm-list"></div><input type="text" class="comm-input" placeholder="Коммент..." onkeydown="addComment(event, this)"></div>
        <div class="controls">
            <div class="btn" onclick="toggleLike(this, event)">⚡</div><div class="like-count">0</div>
            <div class="btn mute-btn" onclick="toggleSound(this)">🔇</div>
            <div class="btn" onclick="toggleComm(this)">💬</div>
            <div class="btn" onclick="openProfile()">👤</div>
        </div>
    `;
    document.getElementById('feed').prepend(card);
    card.scrollIntoView({ behavior: 'smooth' });
};

// ЛОГИКА ЗВУКА
function toggleSound(btn) {
    const video = btn.closest('.card').querySelector('video');
    video.muted = !video.muted;
    btn.innerText = video.muted ? "🔇" : "🔊";
    btn.classList.toggle('active', !video.muted);
}

// АВТОРИЗАЦИЯ
function handleAuth() {
    const n = document.getElementById('nick').value.trim();
    const p = document.getElementById('pass').value.trim();
    if(!n || !p) return alert("Введи логин и пароль!");
    
    const stored = localStorage.getItem('bt_pass_'+n);
    if(!stored) {
        localStorage.setItem('bt_pass_'+n, p);
        localStorage.setItem('bt_ava_'+n, userAva || "");
    } else if(stored !== p) {
        return alert("ПАРОЛЬ НЕВЕРЕН!");
    }
    
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
    
    const a = localStorage.getItem('bt_ava_'+u);
    const letter = u.charAt(0).toUpperCase();
    const pImg = document.getElementById('p-avatar');
    const hImg = document.querySelector('#h-avatar img');

    if(a) {
        pImg.src = a; pImg.style.display = 'block';
        hImg.src = a; hImg.style.display = 'block';
        document.querySelector('#p-circle span').style.display = 'none';
        document.querySelector('#h-avatar span').style.display = 'none';
    } else {
        document.querySelector('#p-circle span').innerText = letter;
        document.querySelector('#h-avatar span').innerText = letter;
    }
    document.getElementById('p-name').innerText = u.toUpperCase();
}

// ВЗАИМОДЕЙСТВИЕ
function toggleLike(btn, e) {
    const label = btn.parentElement.querySelector('.like-count');
    label.innerText = parseInt(label.innerText) + 1;
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 200);
    for(let i=0; i<8; i++) bolts.push({x: e.clientX, y: e.clientY, life: 1.0});
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
        list.scrollTop = list.scrollHeight;
    }
}

// ПРОФИЛЬ
function openProfile() { document.getElementById('profile-screen').style.display = 'block'; }
function closeProfile() { document.getElementById('profile-screen').style.display = 'none'; }
function logout() { localStorage.removeItem('bt_current'); location.reload(); }

// ЦИКЛ АНИМАЦИИ МОЛНИЙ
function loop() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    bolts.forEach((b, i) => {
        b.life -= 0.05;
        if(b.life > 0) {
            ctx.strokeStyle = "white"; ctx.shadowBlur = 15; ctx.shadowColor = "#00d2ff";
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            let cx = b.x, cy = b.y;
            for(let j=0; j<5; j++) {
                cx += Math.random()*40-20; cy += Math.random()*40-20;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        } else bolts.splice(i, 1);
    });
    requestAnimationFrame(loop);
}

loop();
window.onload = start;
