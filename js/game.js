/**
 * Игра «Собери берёзовый сок!»
 *
 * Механика:
 *  - Игрок (банка) двигается влево/вправо между берёзами
 *  - С деревьев падают капли сока: +10 очков
 *  - Редко падают часы: +20 секунд
 *  - Каждые 10 секунд скорость увеличивается
 *  - Начальное время: 60 секунд
 *
 * Управление: стрелки / A-D / кнопки на экране
 */

class BirchSapGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.gameArea = document.getElementById('gameArea');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');

        this.scoreEl = document.getElementById('gameScore');
        this.timeEl = document.getElementById('gameTime');
        this.levelEl = document.getElementById('gameLevel');
        this.finalScoreEl = document.getElementById('finalScore');
        this.finalLevelEl = document.getElementById('finalLevel');
        this.finalRating = document.getElementById('finalRating');
        this.finalBestEl = document.getElementById('finalBest');

        this.startBtn = document.getElementById('startGameBtn');
        this.restartBtn = document.getElementById('restartGameBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeGameBtn');
        this.shareBtn = document.getElementById('shareResultBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');

        if (!this.canvas || !this.gameArea) return;

        this.ctx = this.canvas.getContext('2d');

        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.timeLeft = 60;
        this.level = 1;
        this.speedMultiplier = 1;
        this.elapsedPlaySeconds = 0;
        this.lastSpeedLevel = 0;
        this.timerInterval = null;
        this.rafId = null;
        this.spawnTimer = 0;
        this.bestScore = parseInt(localStorage.getItem('birchSapBest') || '0', 10);
        this.missedDrops = 0;

        this.keysDown = {};

        this.player = { x: 0, y: 0, width: 50, height: 60, bounceY: 0 };
        this.trees = [];
        this.items = [];
        this.particles = [];
        this.clouds = this._generateClouds(4);
        this.grassSeeds = [];

        this._resizeBound = this._handleResize.bind(this);
        this._keydownBound = this._onKeyDown.bind(this);
        this._keyupBound = this._onKeyUp.bind(this);

        this._setupCanvas();
        this._setupEvents();
        this.showScreen('start');
        this._drawStatic();
    }

    // ─── Canvas ───

    _setupCanvas() {
        this._syncSize();
        window.addEventListener('resize', this._resizeBound);
    }

    _syncSize() {
        const rect = this.gameArea.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.groundY = Math.floor(this.canvas.height * 0.78);
        this._buildTrees();
        this._buildGrass();
    }

    _handleResize() {
        this._syncSize();
        if (!this.isPlaying) this._drawStatic();
    }

    _buildTrees() {
        this.trees = [];
        const count = 5;
        const spacing = this.canvas.width / (count + 1);
        const treeH = Math.max(160, this.groundY - 30);
        for (let i = 1; i <= count; i++) {
            this.trees.push({
                x: spacing * i,
                topY: this.groundY - treeH,
                height: treeH,
                trunkW: 18
            });
        }
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.groundY - this.player.height;
    }

    _buildGrass() {
        this.grassSeeds = [];
        for (let x = 0; x < this.canvas.width; x += 8) {
            this.grassSeeds.push({
                x,
                h: 4 + Math.random() * 8,
                shade: Math.random() > 0.5 ? '#689F38' : '#558B2F'
            });
        }
    }

    _generateClouds(n) {
        const arr = [];
        for (let i = 0; i < n; i++) {
            arr.push({
                x: Math.random() * 900,
                y: 15 + Math.random() * 35,
                r: 18 + Math.random() * 14,
                speed: 0.15 + Math.random() * 0.2
            });
        }
        return arr;
    }

    // ─── Events ───

    _setupEvents() {
        document.addEventListener('keydown', this._keydownBound);
        document.addEventListener('keyup', this._keyupBound);

        const bind = (el, fn) => {
            if (!el) return;
            el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
        };

        bind(this.startBtn, () => this.startGame());
        bind(this.restartBtn, () => this.startGame());
        bind(this.pauseBtn, () => this.togglePause());
        bind(this.resumeBtn, () => this.togglePause());
        bind(this.shareBtn, () => this.shareResult());

        const holdBtn = (el, dir) => {
            if (!el) return;
            let interval = null;
            const start = (e) => {
                e.preventDefault();
                if (!this.isPlaying || this.isPaused) return;
                this._movePlayer(dir);
                interval = setInterval(() => this._movePlayer(dir), 120);
            };
            const stop = () => { clearInterval(interval); interval = null; };
            el.addEventListener('touchstart', start, { passive: false });
            el.addEventListener('touchend', stop);
            el.addEventListener('touchcancel', stop);
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', stop);
            el.addEventListener('mouseleave', stop);
        };
        holdBtn(this.leftBtn, 'left');
        holdBtn(this.rightBtn, 'right');
    }

    _onKeyDown(e) {
        if (!this.isPlaying) return;
        const k = e.key;
        if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(k)) {
            e.preventDefault();
        }
        if (this.keysDown[k]) return;
        this.keysDown[k] = true;

        if (this.isPaused) {
            if (k === 'Escape' || k === 'p' || k === 'P') this.togglePause();
            return;
        }

        if (k === 'ArrowLeft' || k === 'a' || k === 'A') this._movePlayer('left');
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') this._movePlayer('right');
        else if (k === 'Escape' || k === 'p' || k === 'P') this.togglePause();
    }

    _onKeyUp(e) {
        delete this.keysDown[e.key];
    }

    // ─── Screens ───

    showScreen(name) {
        [this.startScreen, this.gameOverScreen, this.pauseScreen].forEach(s => {
            if (s) s.classList.remove('active');
        });
        if (name === 'start' && this.startScreen) this.startScreen.classList.add('active');
        else if (name === 'gameover' && this.gameOverScreen) this.gameOverScreen.classList.add('active');
        else if (name === 'pause' && this.pauseScreen) this.pauseScreen.classList.add('active');
    }

    // ─── Game lifecycle ───

    startGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.rafId) cancelAnimationFrame(this.rafId);

        this.score = 0;
        this.timeLeft = 60;
        this.level = 1;
        this.speedMultiplier = 1;
        this.elapsedPlaySeconds = 0;
        this.lastSpeedLevel = 0;
        this.items = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.isPaused = false;
        this.isPlaying = true;
        this.missedDrops = 0;
        this.keysDown = {};

        this._syncSize();
        this._updateUI();
        this.showScreen('none');

        this.timerInterval = setInterval(() => this._tick(), 1000);
        this.rafId = requestAnimationFrame((t) => this._loop(t));
    }

    _tick() {
        if (!this.isPlaying || this.isPaused) return;

        this.timeLeft--;
        this.elapsedPlaySeconds++;

        if (this.elapsedPlaySeconds > 0 && this.elapsedPlaySeconds % 10 === 0) {
            const newLevel = Math.floor(this.elapsedPlaySeconds / 10) + 1;
            if (newLevel > this.lastSpeedLevel) {
                this.lastSpeedLevel = newLevel;
                this._speedUp();
            }
        }

        this._updateUI();

        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this._endGame();
        }
    }

    _speedUp() {
        this.speedMultiplier += 0.25;
        this.level++;
        this._updateUI();
        this._showToast(`Уровень ${this.level}! Скорость +25%`);
    }

    _showToast(text) {
        const el = document.createElement('div');
        el.className = 'speed-indicator';
        el.textContent = text;
        this.gameArea.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    togglePause() {
        if (!this.isPlaying) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.showScreen('pause');
            if (this.pauseBtn) this.pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            this.showScreen('none');
            if (this.pauseBtn) this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.rafId = requestAnimationFrame((t) => this._loop(t));
        }
    }

    _endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('birchSapBest', String(this.bestScore));
        }

        if (this.finalScoreEl) this.finalScoreEl.textContent = this.score;
        if (this.finalLevelEl) this.finalLevelEl.textContent = this.level;
        if (this.finalBestEl) this.finalBestEl.textContent = this.bestScore;

        if (this.finalRating) {
            let stars = 1;
            if (this.score >= 100) stars = 2;
            if (this.score >= 200) stars = 3;
            if (this.score >= 300) stars = 4;
            if (this.score >= 500) stars = 5;
            this.finalRating.innerHTML = Array(stars).fill('<i class="fas fa-star"></i>').join('');
        }

        this.showScreen('gameover');
    }

    shareResult() {
        const text = `Я собрал ${this.score} капель берёзового сока и достиг ${this.level} уровня! Попробуй и ты!`;
        if (navigator.share) {
            navigator.share({ title: 'Собери берёзовый сок!', text, url: location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.showNotification) window.showNotification('Результат скопирован в буфер обмена!');
            });
        }
    }

    // ─── Player ───

    _movePlayer(dir) {
        const step = 65;
        if (dir === 'left') {
            this.player.x = Math.max(10, this.player.x - step);
        } else {
            this.player.x = Math.min(this.canvas.width - this.player.width - 10, this.player.x + step);
        }
        this.player.bounceY = -8;
    }

    // ─── Main loop ───

    _loop(timestamp) {
        if (!this.isPlaying || this.isPaused) return;

        this._update();
        this._draw();

        this.rafId = requestAnimationFrame((t) => this._loop(t));
    }

    _update() {
        // Bounce decay
        if (this.player.bounceY < 0) {
            this.player.bounceY += 0.8;
            if (this.player.bounceY > 0) this.player.bounceY = 0;
        }

        // Keyboard held-down continuous movement
        if (this.keysDown['ArrowLeft'] || this.keysDown['a'] || this.keysDown['A']) {
            this.player.x = Math.max(10, this.player.x - 4);
        }
        if (this.keysDown['ArrowRight'] || this.keysDown['d'] || this.keysDown['D']) {
            this.player.x = Math.min(this.canvas.width - this.player.width - 10, this.player.x + 4);
        }

        // Spawn
        this.spawnTimer++;
        const spawnRate = Math.max(25, Math.floor(55 / this.speedMultiplier));
        if (this.spawnTimer >= spawnRate) {
            this._spawnItem();
            this.spawnTimer = 0;
        }

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed * this.speedMultiplier;

            if (!item.collected && this._collides(item)) {
                this._collect(item);
                item.collected = true;
            }

            if (item.y > this.canvas.height + 20 || item.collected) {
                if (!item.collected && item.type === 'drop') this.missedDrops++;
                this.items.splice(i, 1);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.025;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Clouds
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > this.canvas.width + 80) c.x = -80;
        });
    }

    _spawnItem() {
        const tree = this.trees[Math.floor(Math.random() * this.trees.length)];
        const isClock = Math.random() < 0.05;
        const holeY = tree.topY + Math.min(50, tree.height * 0.25);
        this.items.push({
            x: tree.x + (Math.random() - 0.5) * 6,
            y: holeY + 14,
            type: isClock ? 'clock' : 'drop',
            width: isClock ? 30 : 18,
            height: isClock ? 30 : 24,
            speed: 1.8 + Math.random() * 1.5,
            collected: false,
            wobble: Math.random() * Math.PI * 2
        });
    }

    _collides(item) {
        const ix = item.x - item.width / 2;
        const iy = item.y;
        const px = this.player.x;
        const py = this.player.y + this.player.bounceY;
        return ix < px + this.player.width &&
               ix + item.width > px &&
               iy < py + this.player.height &&
               iy + item.height > py;
    }

    _collect(item) {
        if (item.type === 'drop') {
            this.score += 10;
            this._burstParticles(item.x, item.y, '#4CAF50', 6);
            this._floatText(item.x, item.y, '+10', '#4CAF50');
        } else {
            this.timeLeft += 20;
            this._burstParticles(item.x, item.y, '#FFC107', 8);
            this._floatText(item.x, item.y, '+20 сек', '#FFC107');
            if (window.showNotification) window.showNotification('Бонусное время! +20 секунд');
        }
        this._updateUI();
    }

    _burstParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * (1.5 + Math.random()),
                vy: Math.sin(angle) * (1.5 + Math.random()) - 1,
                color,
                life: 1
            });
        }
    }

    _floatText(x, y, text, color) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `position:absolute;left:${x}px;top:${y}px;color:${color};font-size:1.2rem;font-weight:bold;pointer-events:none;z-index:50;animation:floatUp 0.8s ease-out forwards;`;
        this.gameArea.appendChild(el);
        setTimeout(() => el.remove(), 850);
    }

    _updateUI() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.timeEl) this.timeEl.textContent = Math.max(0, this.timeLeft);
        if (this.levelEl) this.levelEl.textContent = this.level;

        if (this.timeEl && this.timeEl.parentElement) {
            this.timeEl.parentElement.classList.toggle('warning', this.timeLeft <= 10);
        }
    }

    // ─── Drawing ───

    _drawStatic() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawGround();
        this._drawClouds();
        this._drawTrees();
        this._drawPlayer();
    }

    _draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this._drawGround();
        this._drawClouds();
        this._drawTrees();
        this._drawItems();
        this._drawPlayer();
        this._drawParticles();
    }

    _drawGround() {
        const ctx = this.ctx;
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        this.grassSeeds.forEach(g => {
            ctx.fillStyle = g.shade;
            ctx.fillRect(g.x, this.groundY - g.h, 2, g.h);
        });
    }

    _drawClouds() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.clouds.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.arc(c.x + c.r, c.y - 4, c.r * 0.8, 0, Math.PI * 2);
            ctx.arc(c.x - c.r * 0.6, c.y + 2, c.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    _drawTrees() {
        const ctx = this.ctx;
        this.trees.forEach(t => {
            // Ствол берёзы
            const grad = ctx.createLinearGradient(t.x - t.trunkW / 2, 0, t.x + t.trunkW / 2, 0);
            grad.addColorStop(0, '#e0e0e0');
            grad.addColorStop(0.3, '#f5f5f5');
            grad.addColorStop(0.5, '#fff');
            grad.addColorStop(0.7, '#f0f0f0');
            grad.addColorStop(1, '#bdbdbd');
            ctx.fillStyle = grad;
            ctx.fillRect(t.x - t.trunkW / 2, t.topY, t.trunkW, t.height);

            // Чёрные полоски — количество зависит от высоты
            ctx.fillStyle = '#424242';
            const stripeCount = Math.max(4, Math.floor(t.height / 28));
            const stripeSpacing = (t.height - 30) / stripeCount;
            for (let i = 0; i < stripeCount; i++) {
                const sw = (t.trunkW - 6) * (0.5 + Math.random() * 0.5);
                ctx.fillRect(t.x - sw / 2, t.topY + 20 + i * stripeSpacing, sw, 2);
            }

            // Крона — крупная, многослойная
            const crownR = 42;
            ctx.fillStyle = 'rgba(76,175,80,0.2)';
            ctx.beginPath();
            ctx.arc(t.x, t.topY - 6, crownR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(56,142,60,0.15)';
            ctx.beginPath();
            ctx.arc(t.x - 22, t.topY + 4, 26, 0, Math.PI * 2);
            ctx.arc(t.x + 24, t.topY, 24, 0, Math.PI * 2);
            ctx.arc(t.x - 8, t.topY - 18, 20, 0, Math.PI * 2);
            ctx.arc(t.x + 10, t.topY - 16, 18, 0, Math.PI * 2);
            ctx.fill();

            // Отверстие для сбора сока (ниже кроны)
            const holeY = t.topY + Math.min(50, t.height * 0.25);
            ctx.fillStyle = '#5d4037';
            ctx.beginPath();
            ctx.arc(t.x, holeY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Маленький желобок от отверстия
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(t.x, holeY + 4);
            ctx.lineTo(t.x, holeY + 14);
            ctx.stroke();
        });
    }

    _drawItems() {
        const ctx = this.ctx;
        const now = Date.now();
        this.items.forEach(item => {
            const wobbleX = Math.sin(now * 0.003 + item.wobble) * 2;
            const dx = item.x + wobbleX;

            if (item.type === 'drop') {
                const g = ctx.createRadialGradient(dx, item.y + 6, 0, dx, item.y + 10, 10);
                g.addColorStop(0, '#a5d6a7');
                g.addColorStop(0.6, '#4caf50');
                g.addColorStop(1, '#2e7d32');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(dx, item.y);
                ctx.quadraticCurveTo(dx - 9, item.y + 10, dx, item.y + 20);
                ctx.quadraticCurveTo(dx + 9, item.y + 10, dx, item.y);
                ctx.fill();

                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.beginPath();
                ctx.arc(dx - 3, item.y + 7, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#FFC107';
                ctx.beginPath();
                ctx.arc(dx, item.y + 15, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#FF8F00';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(dx, item.y + 15);
                ctx.lineTo(dx, item.y + 7);
                ctx.moveTo(dx, item.y + 15);
                ctx.lineTo(dx + 7, item.y + 15);
                ctx.stroke();

                ctx.fillStyle = '#FF8F00';
                ctx.beginPath();
                ctx.arc(dx, item.y + 15, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('+20с', dx, item.y + 30);
            }
        });
    }

    _drawPlayer() {
        const ctx = this.ctx;
        const { x, y, width, height, bounceY } = this.player;
        const dy = y + bounceY;

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height - 2, width / 2 + 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        const g = ctx.createLinearGradient(x, dy, x + width, dy);
        g.addColorStop(0, '#43a047');
        g.addColorStop(0.5, '#66bb6a');
        g.addColorStop(1, '#2e7d32');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x + 8, dy + 10);
        ctx.lineTo(x + width - 8, dy + 10);
        ctx.quadraticCurveTo(x + width, dy + 10, x + width, dy + 18);
        ctx.lineTo(x + width - 4, dy + height - 8);
        ctx.quadraticCurveTo(x + width - 4, dy + height, x + width - 10, dy + height);
        ctx.lineTo(x + 10, dy + height);
        ctx.quadraticCurveTo(x + 4, dy + height, x + 4, dy + height - 8);
        ctx.lineTo(x, dy + 18);
        ctx.quadraticCurveTo(x, dy + 10, x + 8, dy + 10);
        ctx.fill();

        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, dy + 12, width / 2 - 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + width / 2, dy + 13, width / 2 + 3, Math.PI, 0);
        ctx.stroke();

        const fillPercent = Math.min(1, this.score / 300);
        if (fillPercent > 0) {
            const fillH = (height - 24) * fillPercent;
            ctx.fillStyle = 'rgba(129,199,132,0.6)';
            ctx.fillRect(x + 6, dy + height - 8 - fillH, width - 12, fillH);
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 16, dy + 28, 5, 0, Math.PI * 2);
        ctx.arc(x + width - 16, dy + 28, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(x + 16, dy + 28, 2.5, 0, Math.PI * 2);
        ctx.arc(x + width - 16, dy + 28, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + width / 2, dy + 36, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    _drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

// ─── Bootstrap ───

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            0% { opacity:1; transform:translateY(0) scale(1); }
            100% { opacity:0; transform:translateY(-40px) scale(1.3); }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        window.birchSapGame = new BirchSapGame();
    }, 600);
});
