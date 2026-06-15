/* ============================================
   SPACE INVADERS REMIX ENGINE
   ============================================ */

class InvadersGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    const pw = Math.max(40, Math.round(canvas.width * 0.05));
    const ph = Math.max(30, Math.round(canvas.height * 0.05));
    this.player = { x: canvas.width / 2 - pw / 2, y: canvas.height - ph * 3, w: pw, h: ph };
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.particles = [];
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.animFrame = null;
    this._onKey = null;
    this._onKeyUp = null;
    this.keys = {};
    this.enemyDir = 1;
    this.enemySpeed = 0.5;
    this.enemyDropAmount = 15;
    this.lastEnemyShot = 0;
    this.enemyShotInterval = 1500;
    this.wave = 1;
  }

  start() {
    this.player.x = this.canvas.width / 2 - 15;
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.enemyDir = 1;
    this.enemySpeed = 0.5;
    this.wave = 1;
    this.keys = {};

    this._buildEnemies();

    this._onKey = (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ') this._shoot();
    };
    this._onKeyUp = (e) => { this.keys[e.key] = false; };
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKeyUp);

    this._loop();
  }

  destroy() {
    this.gameOver = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);
  }

  _buildEnemies() {
    this.enemies = [];
    const rows = 4 + Math.min(this.wave - 1, 2);
    const cols = Math.max(6, Math.floor(this.canvas.width / 80));
    const w = Math.max(36, Math.round(this.canvas.width * 0.035));
    const h = Math.max(30, Math.round(this.canvas.height * 0.04));
    const gap = Math.max(10, Math.round(w * 0.3));
    const startX = (this.canvas.width - cols * (w + gap)) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.enemies.push({
          x: startX + c * (w + gap),
          y: 40 + r * (h + gap),
          w, h,
          alive: true,
          type: r, // different appearance per row
        });
      }
    }
    this.enemySpeed = 0.5 + (this.wave - 1) * 0.2;
    this.enemyShotInterval = Math.max(500, 1500 - (this.wave - 1) * 200);
  }

  _shoot() {
    // Max 3 bullets on screen
    if (this.bullets.length >= 3) return;
    this.bullets.push({
      x: this.player.x + this.player.w / 2,
      y: this.player.y,
      speed: 7,
    });
  }

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const speed = 4;
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      this.player.x = Math.max(0, this.player.x - speed);
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      this.player.x = Math.min(this.canvas.width - this.player.w, this.player.x + speed);
    }

    // Player bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].y -= this.bullets[i].speed;
      if (this.bullets[i].y < 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit enemy
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (
          this.bullets[i] &&
          this.bullets[i].x > enemy.x &&
          this.bullets[i].x < enemy.x + enemy.w &&
          this.bullets[i].y > enemy.y &&
          this.bullets[i].y < enemy.y + enemy.h
        ) {
          enemy.alive = false;
          this.bullets.splice(i, 1);
          this.score += 10 + Math.max(0, 3 - enemy.type) * 5;
          this.cb.onScore(this.score);
          this._spawnDestroyParticles(enemy);
          break;
        }
      }
    }

    // Enemy movement
    let hitEdge = false;
    const alive = this.enemies.filter(e => e.alive);
    for (const e of alive) {
      e.x += this.enemySpeed * this.enemyDir;
      if (e.x + e.w >= this.canvas.width - 5 || e.x <= 5) {
        hitEdge = true;
      }
    }
    if (hitEdge) {
      this.enemyDir = -this.enemyDir;
      for (const e of alive) {
        e.y += this.enemyDropAmount;
      }
      // Speed up slightly
      this.enemySpeed += 0.05;
    }

    // Enemies reach bottom
    if (alive.some(e => e.y + e.h >= this.player.y)) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
      return;
    }

    // Enemy shooting
    const now = performance.now();
    if (now - this.lastEnemyShot > this.enemyShotInterval && alive.length > 0) {
      const shooter = alive[Math.floor(Math.random() * alive.length)];
      this.enemyBullets.push({
        x: shooter.x + shooter.w / 2,
        y: shooter.y + shooter.h,
        speed: 3 + this.wave * 0.3,
      });
      this.lastEnemyShot = now;
    }

    // Enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      this.enemyBullets[i].y += this.enemyBullets[i].speed;
      if (this.enemyBullets[i].y > this.canvas.height) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Hit player
      const b = this.enemyBullets[i];
      if (b &&
        b.x > this.player.x &&
        b.x < this.player.x + this.player.w &&
        b.y > this.player.y &&
        b.y < this.player.y + this.player.h
      ) {
        this.enemyBullets.splice(i, 1);
        this.lives--;
        if (this.lives <= 0) {
          this.gameOver = true;
          this.cb.onGameOver(this.score);
          return;
        }
      }
    }

    // Wave clear
    if (alive.length === 0) {
      this.wave++;
      this._buildEnemies();
    }
  }

  _darkenColor(hex, amount) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const num = parseInt(c, 16);
    const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
    const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
    return `rgb(${r},${g},${b})`;
  }

  _spawnDestroyParticles(enemy) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const et = (this.theme.enemiesAre || '').toLowerCase();

    if (et.includes('chicken') || et.includes('bird')) {
      // Feather-like: slow float, white/brown
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * -1 + 0.5,
          life: 1,
          color: ['#fff', '#f5f5dc', '#d2b48c', '#deb887', '#faebd7'][Math.floor(Math.random() * 5)],
          size: Math.random() * 3 + 2,
          type: 'feather',
        });
      }
    } else if (et.includes('emoji') || et.includes('angry')) {
      // Burst of colorful circles
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: ['#ff0', '#f0f', '#0ff', '#0f0', '#f80', '#f00'][Math.floor(Math.random() * 6)],
          size: Math.random() * 5 + 3,
          type: 'circle',
        });
      }
    } else if (et.includes('robot') || et.includes('bot') || et.includes('mech')) {
      // Sparks + metal shards: fast, gray/yellow
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          life: 1,
          color: ['#ccc', '#999', '#ff0', '#ff8800', '#aaa'][Math.floor(Math.random() * 5)],
          size: Math.random() * 3 + 1,
          type: i % 2 === 0 ? 'shard' : 'circle',
        });
      }
    } else if (et.includes('ghost') || et.includes('spooky')) {
      // Wisps floating up slowly, pale blue
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 0.5,
          life: 1,
          color: ['#aabbff', '#8899dd', '#bbccff', '#99aaee'][Math.floor(Math.random() * 4)],
          size: Math.random() * 4 + 3,
          type: 'circle',
        });
      }
    } else if (et.includes('food') || et.includes('pizza')) {
      // Food-colored burst
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1,
          color: ['#ff9900', '#ffcc00', '#ff3300', '#ff6600', '#cc3300'][Math.floor(Math.random() * 5)],
          size: Math.random() * 4 + 2,
          type: 'circle',
        });
      }
    } else if (et.length > 0) {
      let hash = 0;
      for (let i = 0; i < et.length; i++) hash = ((hash << 5) - hash + et.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const pColor = `hsl(${hue}, 70%, 55%)`;
      const style = Math.abs(hash) % 3;
      for (let i = 0; i < 10; i++) {
        if (style === 0) {
          this.particles.push({ x: cx, y: cy, vx: (Math.random()-0.5)*3, vy: -(Math.random()*8+2), life: 1, color: pColor, size: Math.random()*4+2, type: 'circle' });
        } else if (style === 1) {
          const angle = (i/10)*Math.PI*2; const speed = 4+Math.random()*5;
          this.particles.push({ x: cx, y: cy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 0.8, color: pColor, size: Math.random()*4+2 });
        } else {
          this.particles.push({ x: cx+(Math.random()-0.5)*enemy.w, y: cy, vx: (Math.random()-0.5)*2, vy: -(Math.random()*2+0.5), life: 1.4, color: pColor, size: Math.random()*4+3, type: 'circle' });
        }
      }
    } else {
      // Default: generic colored squares
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1,
          color: ['#ff0', '#f80', '#f00', '#fff'][Math.floor(Math.random() * 4)],
          size: Math.random() * 4 + 2,
        });
      }
    }
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    this._drawBackground();

    // Enemies
    const enemyTheme = (this.theme.enemiesAre || '').toLowerCase();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      this._drawEnemy(e, enemyTheme);
    }

    // Player
    this._drawPlayer();

    // Player bullets
    const weaponTheme = (this.theme.weaponIs || '').toLowerCase();
    let bulletColor = '#0f0';
    this._matchedWeapon = null;
    if (weaponTheme.includes('laser') || weaponTheme.includes('beam') || weaponTheme.includes('ray') || weaponTheme.includes('phaser') || weaponTheme.includes('blaster') || weaponTheme.includes('photon') || weaponTheme.includes('plasma') || weaponTheme.includes('ion') || weaponTheme.includes('pulse')) {
      bulletColor = '#00ffff'; this._matchedWeapon = 'laser';
    } else if (weaponTheme.includes('pizza') || weaponTheme.includes('food') || weaponTheme.includes('taco') || weaponTheme.includes('burger') || weaponTheme.includes('hotdog') || weaponTheme.includes('sandwich') || weaponTheme.includes('donut') || weaponTheme.includes('cookie') || weaponTheme.includes('cake') || weaponTheme.includes('pie') || weaponTheme.includes('meatball')) {
      bulletColor = '#ff9900'; this._matchedWeapon = 'food';
    } else if (weaponTheme.includes('heart') || weaponTheme.includes('love') || weaponTheme.includes('kiss') || weaponTheme.includes('valentine') || weaponTheme.includes('rose') || weaponTheme.includes('cupid') || weaponTheme.includes('romance') || weaponTheme.includes('hug')) {
      bulletColor = '#ff69b4'; this._matchedWeapon = 'love';
    } else if (weaponTheme.includes('fire') || weaponTheme.includes('flame') || weaponTheme.includes('fireball') || weaponTheme.includes('torch') || weaponTheme.includes('flamethrower') || weaponTheme.includes('blaze') || weaponTheme.includes('napalm') || weaponTheme.includes('molotov') || weaponTheme.includes('inferno')) {
      bulletColor = '#ff4400'; this._matchedWeapon = 'fire';
    } else if (weaponTheme.includes('ice') || weaponTheme.includes('frost') || weaponTheme.includes('frozen') || weaponTheme.includes('snow') || weaponTheme.includes('icicle') || weaponTheme.includes('blizzard') || weaponTheme.includes('cold') || weaponTheme.includes('freeze') || weaponTheme.includes('glacier')) {
      bulletColor = '#aaddff'; this._matchedWeapon = 'ice';
    } else if (weaponTheme.includes('poison') || weaponTheme.includes('toxic') || weaponTheme.includes('acid') || weaponTheme.includes('venom') || weaponTheme.includes('slime') || weaponTheme.includes('radioactive') || weaponTheme.includes('bio') || weaponTheme.includes('chemical') || weaponTheme.includes('mutant')) {
      bulletColor = '#00ff00'; this._matchedWeapon = 'toxic';
    } else if (weaponTheme.includes('lightning') || weaponTheme.includes('thunder') || weaponTheme.includes('bolt') || weaponTheme.includes('electric') || weaponTheme.includes('shock') || weaponTheme.includes('spark') || weaponTheme.includes('zap') || weaponTheme.includes('volt') || weaponTheme.includes('tesla')) {
      bulletColor = '#ffff00'; this._matchedWeapon = 'lightning';
    } else if (weaponTheme.includes('magic') || weaponTheme.includes('spell') || weaponTheme.includes('wizard') || weaponTheme.includes('wand') || weaponTheme.includes('sorcerer') || weaponTheme.includes('witch') || weaponTheme.includes('enchant') || weaponTheme.includes('mystic') || weaponTheme.includes('arcane') || weaponTheme.includes('mage')) {
      bulletColor = '#cc66ff'; this._matchedWeapon = 'magic';
    } else if (weaponTheme.includes('gold') || weaponTheme.includes('coin') || weaponTheme.includes('treasure') || weaponTheme.includes('money') || weaponTheme.includes('bullet') || weaponTheme.includes('bling') || weaponTheme.includes('rich')) {
      bulletColor = '#ffd700'; this._matchedWeapon = 'gold';
    } else if (weaponTheme.includes('blood') || weaponTheme.includes('vampire') || weaponTheme.includes('crimson') || weaponTheme.includes('scarlet') || weaponTheme.includes('dark') || weaponTheme.includes('shadow') || weaponTheme.includes('death') || weaponTheme.includes('doom') || weaponTheme.includes('reaper')) {
      bulletColor = '#cc0000'; this._matchedWeapon = 'dark';
    } else if (weaponTheme.includes('flower') || weaponTheme.includes('petal') || weaponTheme.includes('blossom') || weaponTheme.includes('plant') || weaponTheme.includes('seed') || weaponTheme.includes('leaf') || weaponTheme.includes('nature') || weaponTheme.includes('garden') || weaponTheme.includes('thorn')) {
      bulletColor = '#ff88cc'; this._matchedWeapon = 'floral';
    } else if (weaponTheme.includes('music') || weaponTheme.includes('note') || weaponTheme.includes('song') || weaponTheme.includes('sound') || weaponTheme.includes('melody') || weaponTheme.includes('beat') || weaponTheme.includes('bass') || weaponTheme.includes('drum') || weaponTheme.includes('guitar') || weaponTheme.includes('piano')) {
      bulletColor = '#ff66ff'; this._matchedWeapon = 'music';
    } else if (weaponTheme.includes('sword') || weaponTheme.includes('blade') || weaponTheme.includes('knife') || weaponTheme.includes('dagger') || weaponTheme.includes('katana') || weaponTheme.includes('axe') || weaponTheme.includes('arrow') || weaponTheme.includes('bow') || weaponTheme.includes('spear') || weaponTheme.includes('lance')) {
      bulletColor = '#cccccc'; this._matchedWeapon = 'melee';
    } else if (weaponTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < weaponTheme.length; i++) hash = ((hash << 5) - hash + weaponTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      bulletColor = `hsl(${hue}, 70%, 55%)`; this._matchedWeapon = 'custom';
    }

    // Bullet emoji lookup
    const bulletEmoji = this._getBulletEmoji();
    const bSize = Math.round(this.player.w * 0.5);
    for (const b of this.bullets) {
      if (bulletEmoji) {
        ctx.font = `${bSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(bulletEmoji, b.x, b.y + bSize * 0.2);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = bulletColor;
        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(b.x - 3, b.y - 10, 6, 14, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Enemy bullets
    for (const b of this.enemyBullets) {
      ctx.fillStyle = '#ff3333';
      ctx.shadowColor = '#ff3333';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(b.x - 3, b.y, 6, 12, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Particles (cap to prevent unbounded growth)
    if (this.particles.length > 300) this.particles.splice(0, this.particles.length - 300);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      // Feathers float slowly with wobble
      if (p.type === 'feather') {
        p.vx *= 0.96;
        p.vy *= 0.98;
        p.x += Math.sin(performance.now() * 0.005 + i) * 0.4;
      }
      p.life -= 0.025;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'feather') {
        // Elongated ellipse for feather
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.5, p.size * 1.5, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shard') {
        // Angular shard shape
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size * 0.6, p.y);
        ctx.lineTo(p.x, p.y + p.size * 0.5);
        ctx.lineTo(p.x - p.size * 0.4, p.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = '#0f0';
    ctx.font = '10px Inter';
    ctx.fillText(`LIVES: ${'♥'.repeat(this.lives)}`, 10, canvas.height - 10);
    ctx.fillText(`WAVE ${this.wave}`, canvas.width - 100, canvas.height - 10);

    // Theme label
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText(`Ship: ${this.theme.shipIs || 'ship'}`, 10, canvas.height - 44);
    ctx.fillText(`Enemy: ${this.theme.enemiesAre || 'invaders'}`, 10, canvas.height - 58);

    const matched = [
      this._matchedShip ? `ship:${this._matchedShip}` : null,
      this._matchedWeapon ? `weapon:${this._matchedWeapon}` : null,
      this._matchedWorld ? `world:${this._matchedWorld}` : null,
    ].filter(Boolean);
    if (matched.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`matched: ${matched.join(' | ')}`, 10, canvas.height - 30);
    }
  }

  _drawBackground() {
    const ctx = this.ctx;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    this._matchedWorld = null;

    if (theme.includes('cyber') || theme.includes('city') || theme.includes('neon') || theme.includes('urban') || theme.includes('tokyo') || theme.includes('synth') || theme.includes('tron') || theme.includes('vaporwave') || theme.includes('arcade') || theme.includes('electric') || theme.includes('glitch') || theme.includes('retrowave') || theme.includes('new york') || theme.includes('street') || theme.includes('metropol') || theme.includes('skyscraper') || theme.includes('downtown')) {
      this._matchedWorld = 'cybercity';
      ctx.fillStyle = '#080815';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#151525';
      for (let i = 0; i < 20; i++) {
        const bw = 20 + (i * 17 % 30);
        const bh = 60 + (i * 31 % 120);
        ctx.beginPath();
        ctx.roundRect(i * 26, this.canvas.height - bh, bw, bh, 2);
        ctx.fill();
      }
      // Window lights
      ctx.fillStyle = 'rgba(255, 255, 150, 0.3)';
      for (let i = 0; i < 20; i++) {
        const bw = 20 + (i * 17 % 30);
        const bh = 60 + (i * 31 % 120);
        const bx = i * 26;
        const by = this.canvas.height - bh;
        for (let wy = by + 8; wy < this.canvas.height - 8; wy += 12) {
          for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) {
            if ((wx * 31 + wy * 17) % 5 > 1) {
              ctx.fillRect(wx, wy, 3, 3);
            }
          }
        }
      }
    } else if (theme.includes('moon') || theme.includes('lunar') || theme.includes('crater') || theme.includes('apollo') || theme.includes('mars') || theme.includes('planet') || theme.includes('asteroid') || theme.includes('desolate') || theme.includes('barren')) {
      this._matchedWorld = 'lunar';
      ctx.fillStyle = '#101015';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#222230';
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc((i * 53) % this.canvas.width, this.canvas.height - 20, 15 + (i * 7 % 20), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.includes('ocean') || theme.includes('underwater') || theme.includes('sea') || theme.includes('reef') || theme.includes('aqua') || theme.includes('marine') || theme.includes('deep') || theme.includes('fish') || theme.includes('coral') || theme.includes('whale') || theme.includes('dolphin') || theme.includes('shark') || theme.includes('atlantis') || theme.includes('mermaid')) {
      this._matchedWorld = 'ocean';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('volcan') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno') || theme.includes('magma') || theme.includes('flame') || theme.includes('ember') || theme.includes('dragon') || theme.includes('phoenix') || theme.includes('burn') || theme.includes('demon')) {
      this._matchedWorld = 'volcanic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.5, '#400800');
      grad.addColorStop(1, '#ff3300');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('nature') || theme.includes('garden') || theme.includes('meadow') || theme.includes('grass') || theme.includes('swamp') || theme.includes('wild') || theme.includes('leaf') || theme.includes('moss') || theme.includes('fern')) {
      this._matchedWorld = 'forest';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#0a2000');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('desert') || theme.includes('sand') || theme.includes('egypt') || theme.includes('pyramid') || theme.includes('dune') || theme.includes('cactus') || theme.includes('oasis') || theme.includes('sahara') || theme.includes('pharaoh') || theme.includes('camel')) {
      this._matchedWorld = 'desert';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#2a1800');
      grad.addColorStop(1, '#3a2500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('snow') || theme.includes('arctic') || theme.includes('frozen') || theme.includes('winter') || theme.includes('ice') || theme.includes('glacier') || theme.includes('blizzard') || theme.includes('tundra') || theme.includes('polar') || theme.includes('christmas') || theme.includes('frost')) {
      this._matchedWorld = 'arctic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102030');
      grad.addColorStop(1, '#1a3040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('haunt') || theme.includes('grave') || theme.includes('spooky') || theme.includes('ghost') || theme.includes('zombie') || theme.includes('halloween') || theme.includes('horror') || theme.includes('creepy') || theme.includes('witch') || theme.includes('vampire') || theme.includes('cemetery') || theme.includes('skull') || theme.includes('monster')) {
      this._matchedWorld = 'haunted';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#10002a');
      grad.addColorStop(1, '#200a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('sunset') || theme.includes('sunrise') || theme.includes('dusk') || theme.includes('twilight') || theme.includes('dawn') || theme.includes('evening') || theme.includes('golden')) {
      this._matchedWorld = 'sunset';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200830');
      grad.addColorStop(0.5, '#351015');
      grad.addColorStop(1, '#2a1800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('matrix') || theme.includes('hack') || theme.includes('code') || theme.includes('terminal') || theme.includes('binary') || theme.includes('computer') || theme.includes('digital') || theme.includes('program') || theme.includes('virus')) {
      this._matchedWorld = 'matrix';
      ctx.fillStyle = '#001000';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
      ctx.font = '10px monospace';
      for (let i = 0; i < 30; i++) {
        const x = (i * 37) % this.canvas.width;
        const y = ((performance.now() * 0.02 + i * 97) % this.canvas.height);
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
      }
    } else if (theme.includes('candy') || theme.includes('sweet') || theme.includes('cake') || theme.includes('sugar') || theme.includes('chocolate') || theme.includes('donut') || theme.includes('cookie') || theme.includes('cupcake') || theme.includes('waffle')) {
      this._matchedWorld = 'candyland';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200030');
      grad.addColorStop(1, '#301040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.length > 0) {
      this._matchedWorld = 'custom';
      let hash = 0;
      for (let i = 0; i < theme.length; i++) hash = ((hash << 5) - hash + theme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const defGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.7);
      defGrad.addColorStop(0, `hsl(${hue}, 20%, 10%)`);
      defGrad.addColorStop(1, `hsl(${hue}, 15%, 5%)`);
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Default: starfield
      const defGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.7);
      defGrad.addColorStop(0, '#0a0a25');
      defGrad.addColorStop(1, '#020210');
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i < 120; i++) {
        const sx = (i * 7919) % this.canvas.width;
        const sy = (i * 6271) % this.canvas.height;
        const bright = 0.2 + (i % 5) * 0.15;
        const sz = 1 + (i % 3);
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Vignette for depth
    const vig = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawPlayer() {
    const ctx = this.ctx;
    const { x, y, w, h } = this.player;
    const shipTheme = (this.theme.shipIs || '').toLowerCase();

    let color = '#00ff00';
    this._matchedShip = null;
    if (shipTheme.includes('pizza') || shipTheme.includes('food') || shipTheme.includes('taco') || shipTheme.includes('burger') || shipTheme.includes('hotdog') || shipTheme.includes('sushi') || shipTheme.includes('noodle') || shipTheme.includes('sandwich') || shipTheme.includes('cheese') || shipTheme.includes('bread')) {
      color = '#ff9900'; this._matchedShip = 'food';
    } else if (shipTheme.includes('cat') || shipTheme.includes('animal') || shipTheme.includes('kitten') || shipTheme.includes('dog') || shipTheme.includes('puppy') || shipTheme.includes('bunny') || shipTheme.includes('rabbit') || shipTheme.includes('hamster') || shipTheme.includes('panda') || shipTheme.includes('bear') || shipTheme.includes('fox') || shipTheme.includes('wolf') || shipTheme.includes('tiger')) {
      color = '#ffaa00'; this._matchedShip = 'animal';
    } else if (shipTheme.includes('viking') || shipTheme.includes('ship') || shipTheme.includes('pirate') || shipTheme.includes('boat') || shipTheme.includes('sail') || shipTheme.includes('captain') || shipTheme.includes('anchor') || shipTheme.includes('naval') || shipTheme.includes('galleon') || shipTheme.includes('corsair')) {
      color = '#8B4513'; this._matchedShip = 'nautical';
    } else if (shipTheme.includes('rocket') || shipTheme.includes('jet') || shipTheme.includes('fighter') || shipTheme.includes('shuttle') || shipTheme.includes('falcon') || shipTheme.includes('eagle') || shipTheme.includes('hawk') || shipTheme.includes('plane') || shipTheme.includes('aircraft') || shipTheme.includes('bomber') || shipTheme.includes('stealth')) {
      color = '#cccccc'; this._matchedShip = 'aircraft';
    } else if (shipTheme.includes('gold') || shipTheme.includes('treasure') || shipTheme.includes('rich') || shipTheme.includes('crown') || shipTheme.includes('king') || shipTheme.includes('queen') || shipTheme.includes('royal') || shipTheme.includes('diamond') || shipTheme.includes('jewel') || shipTheme.includes('bling')) {
      color = '#ffd700'; this._matchedShip = 'gold';
    } else if (shipTheme.includes('neon') || shipTheme.includes('laser') || shipTheme.includes('glow') || shipTheme.includes('electric') || shipTheme.includes('cyber') || shipTheme.includes('tron') || shipTheme.includes('plasma') || shipTheme.includes('hologram') || shipTheme.includes('synth')) {
      color = '#00ffff'; this._matchedShip = 'neon';
    } else if (shipTheme.includes('fire') || shipTheme.includes('flame') || shipTheme.includes('phoenix') || shipTheme.includes('dragon') || shipTheme.includes('lava') || shipTheme.includes('inferno') || shipTheme.includes('burn') || shipTheme.includes('ember') || shipTheme.includes('blaze')) {
      color = '#ff4400'; this._matchedShip = 'fire';
    } else if (shipTheme.includes('ice') || shipTheme.includes('frozen') || shipTheme.includes('frost') || shipTheme.includes('glacier') || shipTheme.includes('snow') || shipTheme.includes('arctic') || shipTheme.includes('crystal') || shipTheme.includes('cold') || shipTheme.includes('winter')) {
      color = '#87CEEB'; this._matchedShip = 'ice';
    } else if (shipTheme.includes('ghost') || shipTheme.includes('phantom') || shipTheme.includes('spirit') || shipTheme.includes('invisible') || shipTheme.includes('shadow') || shipTheme.includes('stealth') || shipTheme.includes('wraith') || shipTheme.includes('specter')) {
      color = '#888899'; this._matchedShip = 'ghost';
    } else if (shipTheme.includes('robot') || shipTheme.includes('mech') || shipTheme.includes('android') || shipTheme.includes('machine') || shipTheme.includes('transformer') || shipTheme.includes('gundam') || shipTheme.includes('metal') || shipTheme.includes('iron') || shipTheme.includes('steel') || shipTheme.includes('chrome')) {
      color = '#aaaacc'; this._matchedShip = 'mech';
    } else if (shipTheme.includes('candy') || shipTheme.includes('sweet') || shipTheme.includes('sugar') || shipTheme.includes('pink') || shipTheme.includes('unicorn') || shipTheme.includes('fairy') || shipTheme.includes('rainbow') || shipTheme.includes('sparkle') || shipTheme.includes('glitter')) {
      color = '#ff69b4'; this._matchedShip = 'candy';
    } else if (shipTheme.includes('blood') || shipTheme.includes('vampire') || shipTheme.includes('demon') || shipTheme.includes('evil') || shipTheme.includes('dark') || shipTheme.includes('death') || shipTheme.includes('skull') || shipTheme.includes('reaper') || shipTheme.includes('hell')) {
      color = '#cc0000'; this._matchedShip = 'dark';
    } else if (shipTheme.includes('plant') || shipTheme.includes('leaf') || shipTheme.includes('tree') || shipTheme.includes('nature') || shipTheme.includes('flower') || shipTheme.includes('garden') || shipTheme.includes('vine') || shipTheme.includes('moss') || shipTheme.includes('fern') || shipTheme.includes('mushroom')) {
      color = '#32cd32'; this._matchedShip = 'nature';
    } else if (shipTheme.includes('alien') || shipTheme.includes('ufo') || shipTheme.includes('cosmic') || shipTheme.includes('galaxy') || shipTheme.includes('space') || shipTheme.includes('nebula') || shipTheme.includes('star') || shipTheme.includes('martian') || shipTheme.includes('xenomorph')) {
      color = '#9370db'; this._matchedShip = 'alien';
    } else if (shipTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < shipTheme.length; i++) hash = ((hash << 5) - hash + shipTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      color = `hsl(${hue}, 70%, 55%)`; this._matchedShip = 'custom';
    }

    // Emoji ship if theme matches
    const shipEmoji = this._getShipEmoji();
    if (shipEmoji) {
      const sz = Math.round(Math.max(w, h) * 1.4);
      ctx.font = `${sz}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(shipEmoji, x + w / 2, y + h + sz * 0.1);
      ctx.textAlign = 'left';
    } else {
      const shipGrad = ctx.createLinearGradient(x + w / 2, y - 5, x + w / 2, y + h);
      shipGrad.addColorStop(0, '#00ffff');
      shipGrad.addColorStop(0.3, color);
      shipGrad.addColorStop(1, this._darkenColor(color, 0.3));
      ctx.fillStyle = shipGrad;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - 5);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _getShipEmoji() {
    const t = (this.theme.shipIs || '').toLowerCase();
    if (t.includes('pizza')) return '🍕';
    if (t.includes('taco')) return '🌮';
    if (t.includes('burger')) return '🍔';
    if (t.includes('food') || t.includes('hotdog')) return '🌭';
    if (t.includes('cat') || t.includes('kitten')) return '🐱';
    if (t.includes('dog') || t.includes('puppy')) return '🐶';
    if (t.includes('rocket') || t.includes('shuttle')) return '🚀';
    if (t.includes('jet') || t.includes('plane') || t.includes('fighter')) return '✈️';
    if (t.includes('viking') || t.includes('pirate')) return '🏴‍☠️';
    if (t.includes('robot') || t.includes('mech')) return '🤖';
    if (t.includes('alien') || t.includes('ufo')) return '🛸';
    if (t.includes('dragon') || t.includes('fire')) return '🐉';
    if (t.includes('unicorn') || t.includes('rainbow')) return '🦄';
    if (t.includes('ghost') || t.includes('phantom')) return '👻';
    if (t.includes('skull') || t.includes('death')) return '💀';
    if (t.includes('eagle') || t.includes('hawk') || t.includes('bird')) return '🦅';
    if (t.includes('star') || t.includes('cosmic')) return '⭐';
    if (t.includes('tank') || t.includes('war')) return '🔫';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getBulletEmoji() {
    const t = (this.theme.weaponIs || '').toLowerCase();
    if (t.includes('pizza')) return '🍕';
    if (t.includes('taco')) return '🌮';
    if (t.includes('food') || t.includes('hotdog')) return '🌭';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('fire') || t.includes('flame')) return '🔥';
    if (t.includes('ice') || t.includes('snow')) return '❄️';
    if (t.includes('lightning') || t.includes('bolt') || t.includes('electric')) return '⚡';
    if (t.includes('magic') || t.includes('spell') || t.includes('wand')) return '✨';
    if (t.includes('poison') || t.includes('toxic')) return '☠️';
    if (t.includes('star') || t.includes('cosmic')) return '⭐';
    if (t.includes('flower') || t.includes('petal')) return '🌸';
    if (t.includes('music') || t.includes('note')) return '🎵';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getEnemyEmoji() {
    const t = (this.theme.enemiesAre || '').toLowerCase();
    if (t.includes('angry') || t.includes('emoji') || t.includes('face')) return ['😠','😡','🤬','👿','😤','💢'];
    if (t.includes('chicken') || t.includes('bird')) return ['🐔','🐓','🐤','🐣','🐥','🦆'];
    if (t.includes('alien') || t.includes('ufo') || t.includes('space')) return ['👽','🛸','👾','🌀','💫','☄️'];
    if (t.includes('robot') || t.includes('mech') || t.includes('bot')) return ['🤖','⚙️','🔩','💻','🖥️','📡'];
    if (t.includes('monster') || t.includes('creature')) return ['👹','👺','🧟','🧌','👻','💀'];
    if (t.includes('bug') || t.includes('insect') || t.includes('spider')) return ['🕷️','🐛','🦗','🐜','🪲','🦟'];
    if (t.includes('zombie') || t.includes('undead')) return ['🧟','💀','☠️','🪦','⚰️','👻'];
    if (t.includes('pirate') || t.includes('skull')) return ['☠️','🏴‍☠️','💀','⚔️','🗡️','💣'];
    if (t.includes('ghost') || t.includes('spooky')) return ['👻','💀','🎃','👿','😈','☠️'];
    if (t.includes('cat') || t.includes('kitten')) return ['😼','🙀','😾','😿','😸','😹'];
    if (t.includes('food') || t.includes('pizza')) return ['🍕','🍔','🌮','🌭','🍩','🧁'];
    if (t.includes('fruit')) return ['🍎','🍊','🍋','🍇','🍉','🍓'];
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      const idx = Math.abs(hash) % pool.length;
      return [pool[idx], pool[(idx+1)%pool.length], pool[(idx+2)%pool.length], pool[(idx+3)%pool.length], pool[(idx+4)%pool.length], pool[(idx+5)%pool.length]];
    }
    return null;
  }

  _drawEnemy(e, theme) {
    const ctx = this.ctx;
    const emojis = this._getEnemyEmoji();

    if (emojis) {
      const emoji = emojis[e.type % emojis.length];
      const sz = Math.round(Math.min(e.w, e.h) * 1.1);
      const bob = Math.sin(performance.now() * 0.003 + e.x * 0.1) * 2;
      ctx.font = `${sz}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(emoji, e.x + e.w / 2, e.y + e.h - 2 + bob);
      ctx.textAlign = 'left';
    } else {
      const colors = ['#ff4444', '#ff8800', '#ffcc00', '#44ff44', '#4488ff', '#cc44ff'];
      const color = colors[e.type % colors.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(e.x + 4, e.y + 4, e.w - 8, e.h / 3, 3);
      ctx.fill();
      ctx.fillStyle = '#000';
      const eyeSize = Math.max(3, e.w * 0.1);
      ctx.beginPath();
      ctx.arc(e.x + e.w * 0.35, e.y + e.h * 0.45, eyeSize, 0, Math.PI * 2);
      ctx.arc(e.x + e.w * 0.65, e.y + e.h * 0.45, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
