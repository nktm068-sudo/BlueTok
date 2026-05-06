// ССЫЛКА НА ТВОЙ SPACE (убери пробелы!)
const API_URL = "https://bluetok-server.onrender.com"; 

let bolts = [];

// --- ЭФФЕКТЫ МОЛНИЙ (КАНВАС) ---
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed'; canvas.style.inset = '0'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = '10000';
function res() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = res; res();



// --- ЗАГРУЗКА ИЗ ОБЛАКА ---
async function loadVideosFromCloud() {
    try {
        const response = await fetch(API_URL + "/videos");
        const videoPaths = await response.json();
        const feed = document.getElementById('feed');
        feed.innerHTML = ''; // Очистка перед загрузкой
        
        if(videoPaths.length === 0) {
            feed.innerHTML = '<div style="text-align:center; padding-top:50vh; color:var(--neon-blue)">ЛЕНТА ПУСТА. ЗАГРУЗИ ПЕРВОЕ ВИДЕО!</div>';
        }

        videoPaths.reverse().forEach(url => {
            createVideoCard(url, false);
        });
    } catch (e) {
        console.log("Облако спит или ссылка неверна. Проверь консоль!");
    }
}

// --- СОЗДАНИЕ КАРТОЧКИ ---
function createVideoCard(url, prepend = true) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="content-frame">
            <video src="${url}" loop playsinline muted onclick="this.play(); this.muted=false;"></video>
        </div>
        <div class="comm-box"><div class="comm-list"></div><input type="text" class="comm-input" placeholder="Коммент..." onkeydown="addComment(event, this)"></div>
        <div class="controls">
            <div class="btn like-btn" onclick="toggleLike(this, event)">⚡</div><div class="like-count">0</div>
            <div class="btn mute-btn active" onclick="toggleSound(this)">🔇</div>
            <div class="btn" onclick="toggleComm(this)">💬</div>
            <div class="btn" onclick="openProfile()">👤</div>
        </div>
    `;
    const feed = document.getElementById('feed');
    if(feed.innerText.includes("ПУСТА")) feed.innerHTML = ""; // Убираем текст, если загружаем видео
    
    prepend ? feed.prepend(card) : feed.appendChild(card);
    
    // Автопауза: играет только то видео, которое видно
    const obs = new IntersectionObserver(entries => {
        entries.forEach(en => {
            const v = en.target.querySelector('video');
            if (en.isIntersecting) v.play(); else v.pause();
        });
    }, { threshold: 0.6 });
    obs.observe(card);
}

// --- ЗАГРУЗКА НОВОГО ВИДЕО ---
document.getElementById('video-upload').onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.querySelector('.add-btn');
    const originalText = btn.innerText;
    btn.innerText = "⏳";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(API_URL + "/upload", { method: "POST", body: formData });
        const data = await response.json();
        if(data.url) {
            createVideoCard(data.url, true);
            alert("ВИДЕО УСПЕШНО СОХРАНЕНО В ОБЛАКО!");
        } else {
            alert("Ошибка сервера: " + (data.error || "неизвестно"));
        }
    } catch (err) {
        alert("ОШИБКА: Облако BlueTok не отвечает!");
        console.error(err);
    } finally {
        btn.innerText = originalText;
    }
};

// --- ЛОГИКА ЛАЙКА (⚡) ---
function toggleLike(btn, e) {
    const label = btn.parentElement.querySelector('.like-count');
    let count = parseInt(label.innerText);
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        label.innerText = count - 1;
    } else {
        btn.classList.add('active');
        label.innerText = count + 1;
        // Молнии только при "лайке"
        for(let i=0; i<10; i++) {
            bolts.push({ x: e.clientX, y: e.clientY, life: 1.0 });
        }
    }
}

// --- ЗВУК И КОММЕНТЫ ---
function toggleSound(btn) {
    const v = btn.closest('.card').querySelector('video');
    v.muted = !v.muted;
    btn.innerText = v.muted ? "🔇" : "🔊";
    btn.classList.toggle('active', !v.muted);
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

// --- СИСТЕМА ВХОДА ---
function handleAuth() {
    const n = document.getElementById('nick').value.trim();
    if(!n) return alert("ВВЕДИ ЛОГИН, ADMINX!");
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
    loadVideosFromCloud(); // Подгружаем базу при старте
}

// --- ИНТЕРФЕЙС ПРОФИЛЯ ---
function openProfile() { document.getElementById('profile-screen').style.display = 'block'; }
function closeProfile() { document.getElementById('profile-screen').style.display = 'none'; }
function logout() { localStorage.removeItem('bt_current'); location.reload(); }

// --- АНИМАЦИЯ МОЛНИЙ ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bolts.forEach((b, i) => {
        b.life -= 0.03;
        if(b.life > 0) {
            ctx.strokeStyle = `rgba(0, 210, 255, ${b.life})`;
            ctx.lineWidth = 2; ctx.shadowBlur = 15; ctx.shadowColor = "#00d2ff";
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            let cx = b.x, cy = b.y;
            for(let j=0; j<5; j++) { 
                cx += Math.random()*50-25; cy += Math.random()*50-25; 
                ctx.lineTo(cx, cy); 
            }
            ctx.stroke();
        } else {
            bolts.splice(i, 1);
        }
    });
    requestAnimationFrame(loop);
}
// Ждем 5 кликов по версии для запуска Python-игры
let vClicks = 0;
document.addEventListener('click', (e) => {
    // Проверяем, нажал ли ты именно на версию
    if (e.target && e.target.id === 'version-trigger') {
        vClicks++;
        console.log("Клик системы: " + vClicks);

        if (vClicks >= 5) {
            console.log("🐍 ADMINX: Активация Python-модуля...");
            
            // Подгружаем твой game.py
            let pyScript = document.createElement('script');
            pyScript.type = "text/python";
            pyScript.src = "game.py"; 
            document.head.appendChild(pyScript);
            
            // Запускаем движок Brython
            setTimeout(() => { 
                if(typeof brython !== 'undefined') brython(); 
            }, 500);
            
            vClicks = 0;
        }
        
        // Сброс, если кликаешь слишком медленно (дольше 2 секунд)
        clearTimeout(window.vTimer);
        window.vTimer = setTimeout(() => { vClicks = 0; }, 2000);
    }
});

loop();
window.onload = start;
// --- СЕКРЕТНАЯ ИГРА ОТ ADMINX ---
function startFlappyBird() {
    document.body.innerHTML = `
        <div style="position:fixed; inset:0; z-index:99999; background:#70c5ce; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; touch-action:none;">
            <h1 style="color:white; text-shadow:2px 2px #000;">FLAPPY ADMINX</h1>
            <canvas id="flappy" width="320" height="480" style="background:#fff; border:5px solid #fff; border-radius:10px;"></canvas>
            <p style="color:white; margin-top:10px;">КЛИКАЙ ИЛИ ЖМИ ПРОБЕЛ!</p>
            <button onclick="location.reload()" style="padding:10px 20px; background:#ff4757; color:white; border:none; border-radius:5px; cursor:pointer;">ВЫХОД</button>
        </div>
    `;

    const cvs = document.getElementById("flappy");
    const gctx = cvs.getContext("2d");
    let bird = { x: 50, y: 150, v: 0, g: 0.6 };
    let pipes = [];
    let frame = 0;
    let score = 0;

    function jump() { bird.v = -8; }
    window.onclick = jump;
    window.onkeydown = (e) => { if(e.code === 'Space') jump(); };

    function draw() {
        gctx.fillStyle = "#70c5ce"; gctx.fillRect(0,0,320,480);
        bird.v += bird.g; bird.y += bird.v;
        gctx.fillStyle = "#f1c40f"; gctx.fillRect(bird.x, bird.y, 25, 25);

        if(frame % 100 === 0) pipes.push({ x: 320, y: Math.random() * 200 + 50 });
        pipes.forEach((p, i) => {
            p.x -= 3;
            gctx.fillStyle = "#2ecc71";
            gctx.fillRect(p.x, 0, 50, p.y);
            gctx.fillRect(p.x, p.y + 120, 50, 480);
            if(bird.x+25 > p.x && bird.x < p.x+50 && (bird.y < p.y || bird.y+25 > p.y+120)) location.reload();
            if(p.x < -50) { pipes.splice(i, 1); score++; }
        });
        if(bird.y > 480 || bird.y < 0) location.reload();
        gctx.fillStyle = "black"; gctx.font = "20px Arial"; gctx.fillText("Счет: " + score, 10, 30);
        frame++;
        requestAnimationFrame(draw);
    }
    draw();
}

// --- ОБРАБОТЧИК 5 КЛИКОВ ПО ВЕРСИИ ---
let vClicks = 0;
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'version-trigger') {
        vClicks++;
        if (vClicks >= 5) {
            startFlappyBird(); // ВЫЗЫВАЕМ ФУНКЦИЮ ВЫШЕ
            vClicks = 0;
        }
        clearTimeout(window.vTimer);
        window.vTimer = setTimeout(() => { vClicks = 0; }, 2000);
    }
});

