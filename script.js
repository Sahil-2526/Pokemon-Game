let isPlaying = false;
let animationFrameId;
let score = 0; 
let highScore = localStorage.getItem('wingullHighScore') || 0;
let lives = 3; 
let timeLeft = 15;
let level = 1;
let targetTimer;

let dashEnergy = 100; 
const dashCost = 50; 
let isDashing = false;

const player = {
    el: document.getElementById('player'),
    x: 0, y: 0, width: 80, height: 80,
    baseSpeed: 7, speed: 7, dx: 0, dy: 0, isStunned: false
};

const target = {
    el: document.getElementById('target'),
    x: 0, y: 0, width: 50, height: 50, dx: 0, dy: 0, baseSpeed: 3
};

let obstacles = [];
let powerups = [];

const images = { left: 'url("1n.png")', up: 'url("2n.png")', down: 'url("3n.png")', right: 'url("4n.png")' };

const ui = {
    score: document.getElementById('scoreDisplay'),
    level: document.getElementById('levelDisplay'),
    highScoreBtn: document.getElementById('highScoreBtn'),
    lives: document.getElementById('livesDisplay'),
    time: document.getElementById('timeDisplay'),
    dash: document.getElementById('dashBar'),
    start: document.getElementById('startScreen'),
    gameOver: document.getElementById('gameOverScreen'),
    finalScore: document.getElementById('finalScore'),
    reason: document.getElementById('deathReason'),
    entContainer: document.getElementById('entitiesContainer')
};

ui.highScoreBtn.innerText = `Highest Score: ${highScore}`;

function startGame() {
    score = 0; lives = 3; dashEnergy = 100; level = 1; target.baseSpeed = 3;
    ui.entContainer.innerHTML = ''; obstacles = []; powerups = [];
    updateUI();
    
    ui.start.classList.add('hidden'); ui.gameOver.classList.add('hidden');
    player.el.classList.remove('hidden'); target.el.classList.remove('hidden');

    player.x = window.innerWidth / 2; player.y = window.innerHeight / 2;
    player.dx = 0; player.dy = 0; player.el.style.backgroundImage = images.right;
    player.isStunned = false; player.el.classList.remove('stunned');

    spawnTarget(true);
    isPlaying = true;
    
    cancelAnimationFrame(animationFrameId); clearInterval(targetTimer);
    startTimer(); gameLoop();
}

function gameOver(reason) {
    isPlaying = false;
    cancelAnimationFrame(animationFrameId); clearInterval(targetTimer);
    player.el.classList.add('hidden'); target.el.classList.add('hidden');
    ui.gameOver.classList.remove('hidden');
    ui.finalScore.innerText = score;
    ui.reason.innerText = reason;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('wingullHighScore', highScore);
    }
    ui.highScoreBtn.innerText = `Highest Score: ${highScore}`;
}

function checkLevelUp() {
    let expectedLevel = Math.floor(score / 15) + 1;
    if (expectedLevel > level) {
        level = expectedLevel;
        target.baseSpeed += 2;
        
        obstacles.forEach(obs => {
            obs.dx *= 1.3;
            obs.dy *= 1.3;
        });
        
        spawnObstacle();
        updateUI();
        
        const lvlPopup = document.createElement('div');
        lvlPopup.className = 'level-popup';
        lvlPopup.innerText = `LEVEL ${level}`;
        document.body.appendChild(lvlPopup);
        setTimeout(() => lvlPopup.remove(), 2000);
    }
}

function spawnTarget(resetTime = false) {
    target.x = Math.random() * (window.innerWidth - 100) + 50;
    target.y = Math.random() * (window.innerHeight - 100) + 50;
    
    setTargetDirection();

    if(resetTime) {
        timeLeft = Math.max(5, 15 - Math.floor(score / 3)); 
        ui.time.innerText = `Time: ${timeLeft}s`;
    }

    if (score > 0 && score % 3 === 0) spawnObstacle();
    if (score > 0 && Math.random() < 0.3) spawnPowerup();
}

function setTargetDirection() {
    const angle = Math.random() * Math.PI * 2;
    const currentSpeed = target.baseSpeed + (score * 0.1); 
    target.dx = Math.cos(angle) * currentSpeed;
    target.dy = Math.sin(angle) * currentSpeed;
}

function spawnObstacle() {
    const obs = document.createElement('div');
    obs.className = 'obstacle';
    ui.entContainer.appendChild(obs);
    
    let speedMultiplier = 1 + (level * 0.2);
    
    obstacles.push({
        el: obs, width: 60, height: 60,
        x: Math.random() < 0.5 ? -60 : window.innerWidth, 
        y: Math.random() * window.innerHeight,
        dx: (Math.random() - 0.5) * 10 * speedMultiplier, 
        dy: (Math.random() - 0.5) * 10 * speedMultiplier  
    });
}

function spawnPowerup() {
    const pwr = document.createElement('div');
    pwr.className = 'powerup';
    ui.entContainer.appendChild(pwr);
    
    powerups.push({
        el: pwr, width: 40, height: 40,
        x: Math.random() * (window.innerWidth - 100) + 50, 
        y: Math.random() * (window.innerHeight - 100) + 50,
        dx: (Math.random() - 0.5) * 6,
        dy: (Math.random() - 0.5) * 6,
        active: true
    });
    
    setTimeout(() => {
        if(pwr.parentNode) pwr.parentNode.removeChild(pwr);
        const idx = powerups.findIndex(p => p.el === pwr);
        if(idx > -1) powerups.splice(idx, 1);
    }, 6000);
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        const size = Math.random() * 8 + 4;
        p.style.width = size + 'px'; p.style.height = size + 'px';
        p.style.left = (x + 20) + 'px'; p.style.top = (y + 20) + 'px';
        
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 80 + 30;
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function startTimer() {
    targetTimer = setInterval(() => {
        if (!isPlaying) return;
        timeLeft--; ui.time.innerText = `Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            lives--; updateUI();
            if (lives <= 0) gameOver("Time ran out!");
            else spawnTarget(true);
        }
    }, 1000);
}

function updateUI() {
    ui.score.innerText = `Score: ${score}`;
    ui.lives.innerText = `Lives: ${lives}`;
    ui.level.innerText = `Level: ${level}`;
}

function showPopup(x, y, text) {
    const popup = document.createElement('div');
    popup.className = 'point-popup';
    popup.innerText = text;
    popup.style.left = x + 'px'; popup.style.top = y + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function applyStun() {
    if (player.isStunned) return;
    player.isStunned = true;
    lives--; updateUI();
    player.el.classList.add('stunned');
    createParticles(player.x, player.y, '#ff4747', 15);
    
    if (lives <= 0) { gameOver("Hit by a red orb!"); return; }
    setTimeout(() => { player.isStunned = false; player.el.classList.remove('stunned'); }, 1500); 
}

function gameLoop() {
    if (!isPlaying) return;

    player.x += player.dx; player.y += player.dy;

    if (player.x < 0) { player.x = 0; player.dx = 0; }
    if (player.x + player.width > window.innerWidth) { player.x = window.innerWidth - player.width; player.dx = 0; }
    if (player.y < 0) { player.y = 0; player.dy = 0; }
    if (player.y + player.height > window.innerHeight) { player.y = window.innerHeight - player.height; player.dy = 0; }

    player.el.style.transform = `translate(${player.x}px, ${player.y}px)`;

    if (!isDashing && dashEnergy < 100) {
        dashEnergy += 0.5;
        ui.dash.style.width = `${dashEnergy}%`;
        if(dashEnergy > dashCost) ui.dash.style.background = "#00ff88";
    }

    if (Math.random() < 0.015) setTargetDirection();

    target.x += target.dx; target.y += target.dy;
    
    if (target.x < 0 || target.x + target.width > window.innerWidth) target.dx *= -1;
    if (target.y < 0 || target.y + target.height > window.innerHeight) target.dy *= -1;
    
    target.el.style.transform = `translate(${target.x}px, ${target.y}px)`;

    obstacles.forEach(obs => {
        obs.x += obs.dx; obs.y += obs.dy;
        if (obs.x < 0 || obs.x + obs.width > window.innerWidth) obs.dx *= -1;
        if (obs.y < 0 || obs.y + obs.height > window.innerHeight) obs.dy *= -1;
        obs.el.style.transform = `translate(${obs.x}px, ${obs.y}px)`;

        if (!player.isStunned) {
            const dist = Math.hypot((player.x + 40) - (obs.x + 30), (player.y + 40) - (obs.y + 30));
            if (dist < 50) applyStun();
        }
    });

    for (let i = powerups.length - 1; i >= 0; i--) {
        const pwr = powerups[i];
        if (!pwr.active) continue;
        
        pwr.x += pwr.dx; pwr.y += pwr.dy;
        if (pwr.x < 0 || pwr.x + pwr.width > window.innerWidth) pwr.dx *= -1;
        if (pwr.y < 0 || pwr.y + pwr.height > window.innerHeight) pwr.dy *= -1;
        
        pwr.el.style.transform = `translate(${pwr.x}px, ${pwr.y}px)`;
        
        const dist = Math.hypot((player.x + 40) - (pwr.x + 20), (player.y + 40) - (pwr.y + 20));
        if (dist < 50) {
            dashEnergy = 100;
            ui.dash.style.width = `100%`;
            ui.dash.style.background = "#00ff88";
            createParticles(pwr.x, pwr.y, '#00f2fe', 10);
            pwr.el.remove(); powerups.splice(i, 1);
        }
    }

    const distToTarget = Math.hypot((player.x + 40) - (target.x + 25), (player.y + 40) - (target.y + 25));
    if (distToTarget < 55) {
        score++; 
        checkLevelUp();
        updateUI();
        showPopup(target.x, target.y, "+1");
        createParticles(target.x, target.y, '#ffde00', 20);
        spawnTarget(true);
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

const keys = { w: false, a: false, s: false, d: false };

function updateMovement() {
    if (!isPlaying) return;
    player.dx = 0; player.dy = 0;
    
    if (keys.w || keys.ArrowUp) { player.dy = -player.speed; player.el.style.backgroundImage = images.up; }
    if (keys.s || keys.ArrowDown) { player.dy = player.speed; player.el.style.backgroundImage = images.down; }
    if (keys.a || keys.ArrowLeft) { player.dx = -player.speed; player.el.style.backgroundImage = images.left; }
    if (keys.d || keys.ArrowRight) { player.dx = player.speed; player.el.style.backgroundImage = images.right; }
    
    if (player.dx !== 0 && player.dy !== 0) {
        player.dx *= 0.707; player.dy *= 0.707;
    }
}

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (keys.hasOwnProperty(k) || k.includes('arrow')) {
        keys[k] = true; updateMovement();
    }
    if (k === ' ' && dashEnergy >= dashCost && !isDashing) {
        isDashing = true; dashEnergy -= dashCost;
        ui.dash.style.background = "#ff4747"; 
        player.speed = player.baseSpeed * 3; 
        createParticles(player.x, player.y, '#ffffff', 5);
        updateMovement();
        
        setTimeout(() => {
            player.speed = player.baseSpeed; isDashing = false; updateMovement();
        }, 200); 
    }
});

window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (keys.hasOwnProperty(k) || k.includes('arrow')) {
        keys[k] = false; updateMovement();
    }
});