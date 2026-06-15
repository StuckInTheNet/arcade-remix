/* ============================================
   ASTEROIDS REMIX ENGINE
   ============================================ */

class AsteroidsGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.ship = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      size: Math.max(16, Math.round(canvas.height * 0.025)),
      thrust: false,
    };
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.score = 0;
    this.gameOver = false;
    this.animFrame = null;
    this._onKey = null;
    this._onKeyUp = null;
    this.keys = {};
    this.shootCooldown = 0;
    this.frameCount = 0;
    this.invincible = 120; // brief invincibility at start
  }

  start() {
    this.ship = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0,
      size: Math.max(16, Math.round(this.canvas.height * 0.025)),
      thrust: false,
    };
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.score = 0;
    this.gameOver = false;
    this.shootCooldown = 0;
    this.frameCount = 0;
    this.invincible = 120;
    this.keys = {};

    // Spawn initial asteroids
    this._spawnWave(5);

    this._onKey = (e) => { this.keys[e.key] = true; };
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

  _spawnWave(count) {
    for (let i = 0; i < count; i++) {
      this._spawnAsteroid('large', null);
    }
  }

  _spawnAsteroid(size, pos) {
    const sizeMap = { large: 3, medium: 2, small: 1 };
    const radiusMap = {
      large: Math.max(30, this.canvas.height * 0.05),
      medium: Math.max(18, this.canvas.height * 0.03),
      small: Math.max(10, this.canvas.height * 0.018),
    };
    let x, y;
    if (pos) {
      x = pos.x;
      y = pos.y;
    } else {
      // Spawn from edges, away from ship
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { x = 0; y = Math.random() * this.canvas.height; }
      else if (edge === 1) { x = this.canvas.width; y = Math.random() * this.canvas.height; }
      else if (edge === 2) { x = Math.random() * this.canvas.width; y = 0; }
      else { x = Math.random() * this.canvas.width; y = this.canvas.height; }
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    // Generate a rough polygon shape
    const verts = [];
    const numVerts = 7 + Math.floor(Math.random() * 5);
    for (let j = 0; j < numVerts; j++) {
      const a = (j / numVerts) * Math.PI * 2;
      const r = radiusMap[size] * (0.7 + Math.random() * 0.3);
      verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    this.asteroids.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: radiusMap[size],
      sizeClass: size,
      sizeNum: sizeMap[size],
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      verts: verts,
    });
  }

  _getShipEmoji() {
    const t = (this.theme.shipIs || '').toLowerCase();
    if (t.includes('rocket') || t.includes('shuttle') || t.includes('spaceship')) return '🚀';
    if (t.includes('ufo') || t.includes('saucer') || t.includes('alien')) return '🛸';
    if (t.includes('cat') || t.includes('kitten') || t.includes('feline')) return '🐱';
    if (t.includes('jet') || t.includes('plane') || t.includes('fighter') || t.includes('aircraft')) return '✈️';
    if (t.includes('pizza') || t.includes('food') || t.includes('slice')) return '🍕';
    if (t.includes('star') || t.includes('sheriff') || t.includes('badge')) return '⭐';
    if (t.includes('sword') || t.includes('knight') || t.includes('warrior')) return '⚔️';
    if (t.includes('ghost') || t.includes('phantom')) return '👻';
    if (t.includes('dragon') || t.includes('drake')) return '🐉';
    if (t.includes('ninja') || t.includes('assassin')) return '🥷';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getAsteroidEmoji() {
    const t = (this.theme.asteroidsAre || '').toLowerCase();
    if (t.includes('rock') || t.includes('boulder') || t.includes('stone')) return '🪨';
    if (t.includes('planet') || t.includes('earth') || t.includes('world')) return '🌍';
    if (t.includes('moon') || t.includes('lunar')) return '🌙';
    if (t.includes('cookie') || t.includes('donut') || t.includes('cake')) return '🍪';
    if (t.includes('pizza') || t.includes('food') || t.includes('cheese')) return '🍕';
    if (t.includes('bomb') || t.includes('mine') || t.includes('explosive')) return '💣';
    if (t.includes('skull') || t.includes('skeleton') || t.includes('bone')) return '💀';
    if (t.includes('balloon') || t.includes('ball') || t.includes('bubble')) return '🎈';
    if (t.includes('alien') || t.includes('monster') || t.includes('creature')) return '👾';
    if (t.includes('snowball') || t.includes('ice') || t.includes('snow')) return '⛄';
    if (t.includes('pumpkin') || t.includes('halloween') || t.includes('jack')) return '🎃';
    if (t.includes('star') || t.includes('comet') || t.includes('meteor')) return '☄️';
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
    if (t.includes('laser') || t.includes('beam') || t.includes('ray')) return null; // draw as line
    if (t.includes('fire') || t.includes('flame') || t.includes('fireball')) return '🔥';
    if (t.includes('heart') || t.includes('love') || t.includes('valentine')) return '❤️';
    if (t.includes('star') || t.includes('sparkle')) return '⭐';
    if (t.includes('pizza') || t.includes('food')) return '🍕';
    if (t.includes('snowball') || t.includes('ice') || t.includes('snow')) return '❄️';
    if (t.includes('bomb') || t.includes('missile') || t.includes('rocket')) return '💣';
    if (t.includes('arrow') || t.includes('bow')) return '➡️';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getShipColor() {
    const t = (this.theme.shipIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('frost')) return '#87CEEB';
    if (t.includes('gold') || t.includes('royal') || t.includes('king')) return '#ffd700';
    if (t.includes('neon') || t.includes('cyber') || t.includes('electric')) return '#00ffff';
    if (t.includes('ghost') || t.includes('phantom')) return '#aabbcc';
    if (t.includes('dark') || t.includes('shadow') || t.includes('stealth')) return '#555577';
    if (t.includes('rainbow') || t.includes('unicorn')) return '#ff69b4';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#00ff88';
  }

  _getBulletColor() {
    const t = (this.theme.weaponIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('frost')) return '#00bfff';
    if (t.includes('neon') || t.includes('cyber') || t.includes('plasma') || t.includes('electric')) return '#00ffff';
    if (t.includes('heart') || t.includes('love')) return '#ff1493';
    if (t.includes('gold') || t.includes('royal')) return '#ffd700';
    if (t.includes('toxic') || t.includes('poison') || t.includes('acid')) return '#00ff00';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#ffffff';
  }

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    this.frameCount++;
    if (this.invincible > 0) this.invincible--;
    if (this.shootCooldown > 0) this.shootCooldown--;

    const rotSpeed = 0.06;
    const thrustPower = 0.15;
    const friction = 0.99;
    const maxSpeed = 7;

    // Rotation
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.ship.angle -= rotSpeed;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.ship.angle += rotSpeed;
    }

    // Thrust
    this.ship.thrust = false;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.ship.thrust = true;
      this.ship.vx += Math.cos(this.ship.angle) * thrustPower;
      this.ship.vy += Math.sin(this.ship.angle) * thrustPower;
    }

    // Friction
    this.ship.vx *= friction;
    this.ship.vy *= friction;

    // Clamp speed
    const speed = Math.hypot(this.ship.vx, this.ship.vy);
    if (speed > maxSpeed) {
      this.ship.vx = (this.ship.vx / speed) * maxSpeed;
      this.ship.vy = (this.ship.vy / speed) * maxSpeed;
    }

    // Move ship
    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;

    // Wrap ship
    if (this.ship.x < -this.ship.size) this.ship.x = this.canvas.width + this.ship.size;
    if (this.ship.x > this.canvas.width + this.ship.size) this.ship.x = -this.ship.size;
    if (this.ship.y < -this.ship.size) this.ship.y = this.canvas.height + this.ship.size;
    if (this.ship.y > this.canvas.height + this.ship.size) this.ship.y = -this.ship.size;

    // Shoot
    if (this.keys[' '] && this.shootCooldown <= 0) {
      this.shootCooldown = 12;
      const bulletSpeed = 8;
      this.bullets.push({
        x: this.ship.x + Math.cos(this.ship.angle) * this.ship.size,
        y: this.ship.y + Math.sin(this.ship.angle) * this.ship.size,
        vx: Math.cos(this.ship.angle) * bulletSpeed + this.ship.vx * 0.3,
        vy: Math.sin(this.ship.angle) * bulletSpeed + this.ship.vy * 0.3,
        life: 60,
        trail: [],
      });
    }

    // Thrust particles
    if (this.ship.thrust && this.frameCount % 2 === 0) {
      const exhaust = this.ship.angle + Math.PI;
      this.particles.push({
        x: this.ship.x + Math.cos(exhaust) * this.ship.size * 0.8,
        y: this.ship.y + Math.sin(exhaust) * this.ship.size * 0.8,
        vx: Math.cos(exhaust) * (2 + Math.random() * 2) + (Math.random() - 0.5),
        vy: Math.sin(exhaust) * (2 + Math.random() * 2) + (Math.random() - 0.5),
        life: 1,
        size: Math.random() * 3 + 1,
        color: 'rgba(255,150,50,',
      });
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 6) b.trail.shift();
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Wrap bullets
      if (b.x < 0) b.x = this.canvas.width;
      if (b.x > this.canvas.width) b.x = 0;
      if (b.y < 0) b.y = this.canvas.height;
      if (b.y > this.canvas.height) b.y = 0;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Update asteroids
    for (const a of this.asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.rotSpeed;

      // Wrap
      if (a.x < -a.radius * 2) a.x = this.canvas.width + a.radius;
      if (a.x > this.canvas.width + a.radius * 2) a.x = -a.radius;
      if (a.y < -a.radius * 2) a.y = this.canvas.height + a.radius;
      if (a.y > this.canvas.height + a.radius * 2) a.y = -a.radius;
    }

    // Bullet-asteroid collision
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const a = this.asteroids[ai];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < a.radius) {
          // Hit
          this.bullets.splice(bi, 1);
          const scoreMap = { large: 25, medium: 50, small: 100 };
          this.score += scoreMap[a.sizeClass] || 25;
          this.cb.onScore(this.score);

          // Spawn explosion particles
          this._spawnExplosion(a.x, a.y, a.radius);

          // Split
          if (a.sizeClass === 'large') {
            this._spawnAsteroid('medium', { x: a.x, y: a.y });
            this._spawnAsteroid('medium', { x: a.x, y: a.y });
          } else if (a.sizeClass === 'medium') {
            this._spawnAsteroid('small', { x: a.x, y: a.y });
            this._spawnAsteroid('small', { x: a.x, y: a.y });
          }

          this.asteroids.splice(ai, 1);
          break;
        }
      }
    }

    // Ship-asteroid collision
    if (this.invincible <= 0) {
      for (const a of this.asteroids) {
        const dist = Math.hypot(this.ship.x - a.x, this.ship.y - a.y);
        if (dist < a.radius + this.ship.size * 0.5) {
          this._spawnExplosion(this.ship.x, this.ship.y, this.ship.size * 2);
          this.gameOver = true;
          this.cb.onGameOver(this.score);
          return;
        }
      }
    }

    // Spawn new wave if empty
    if (this.asteroids.length === 0) {
      const wave = Math.min(12, 5 + Math.floor(this.score / 500));
      this._spawnWave(wave);
    }

    // Update particles
    if (this.particles.length > 300) this.particles.splice(0, this.particles.length - 300);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= 0.025;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _spawnExplosion(x, y, radius) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: Math.random() * 4 + 2,
        color: ['rgba(255,200,50,', 'rgba(255,100,0,', 'rgba(255,50,0,', 'rgba(200,200,200,'][i % 4],
      });
    }
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();

    const bulletColor = this._getBulletColor();
    const bulletEmoji = this._getBulletEmoji();

    // Draw bullets
    for (const b of this.bullets) {
      // Trail
      for (let j = 0; j < b.trail.length; j++) {
        const t = b.trail[j];
        const alpha = (j / b.trail.length) * 0.3;
        ctx.fillStyle = bulletColor;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (bulletEmoji) {
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bulletEmoji, b.x, b.y + 5);
        ctx.textAlign = 'left';
      } else {
        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = bulletColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw asteroids
    const asteroidEmoji = this._getAsteroidEmoji();
    const asteroidColor = this._getAsteroidColor();

    for (const a of this.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);

      if (asteroidEmoji) {
        const fontSize = Math.round(a.radius * 1.8);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(asteroidEmoji, 0, a.radius * 0.4);
        ctx.textAlign = 'left';
      } else {
        // Draw polygon asteroid
        ctx.shadowColor = asteroidColor;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = asteroidColor;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(60,60,80,0.5)';
        ctx.beginPath();
        ctx.moveTo(a.verts[0].x, a.verts[0].y);
        for (let j = 1; j < a.verts.length; j++) {
          ctx.lineTo(a.verts[j].x, a.verts[j].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    // Draw ship
    const shipEmoji = this._getShipEmoji();
    const shipColor = this._getShipColor();

    // Invincibility blink
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
      // skip drawing (blink effect)
    } else {
      ctx.save();
      ctx.translate(this.ship.x, this.ship.y);
      ctx.rotate(this.ship.angle + Math.PI / 2);

      if (shipEmoji) {
        const fontSize = Math.round(this.ship.size * 2.5);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = shipColor;
        ctx.shadowBlur = 12;
        ctx.fillText(shipEmoji, 0, this.ship.size * 0.5);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
      } else {
        // Triangle ship
        const s = this.ship.size;
        ctx.shadowColor = shipColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = shipColor;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.7, s * 0.7);
        ctx.lineTo(0, s * 0.3);
        ctx.lineTo(s * 0.7, s * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.7);
        ctx.lineTo(-s * 0.3, s * 0.2);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color + p.life + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Theme labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`Ship: ${this.theme.shipIs || 'ship'}`, 8, canvas.height - 28);
    ctx.fillText(`Asteroids: ${this.theme.asteroidsAre || 'asteroids'}`, 8, canvas.height - 12);
  }

  _getAsteroidColor() {
    const t = (this.theme.asteroidsAre || '').toLowerCase();
    if (t.includes('fire') || t.includes('lava') || t.includes('flame')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('crystal')) return '#00bfff';
    if (t.includes('gold') || t.includes('treasure') || t.includes('coin')) return '#ffd700';
    if (t.includes('neon') || t.includes('cyber') || t.includes('electric')) return '#00ffff';
    if (t.includes('toxic') || t.includes('poison') || t.includes('acid')) return '#00ff00';
    if (t.includes('candy') || t.includes('sweet') || t.includes('pink')) return '#ff69b4';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#aaaaaa';
  }

  _drawBackground() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    if (theme.includes('neon') || theme.includes('cyber') || theme.includes('synth') || theme.includes('tron') || theme.includes('arcade')) {
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.04)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (theme.includes('nebula') || theme.includes('colorful') || theme.includes('rainbow') || theme.includes('cosmic')) {
      const grad = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.4, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
      grad.addColorStop(0, '#1a0030');
      grad.addColorStop(0.5, '#0a0a25');
      grad.addColorStop(1, '#020210');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('deep') || theme.includes('void') || theme.includes('dark') || theme.includes('black')) {
      ctx.fillStyle = '#020204';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.length > 0) {
      let hash = 0;
      for (let i = 0; i < theme.length; i++) hash = ((hash << 5) - hash + theme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const spaceGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
      spaceGrad.addColorStop(0, `hsl(${hue}, 20%, 10%)`);
      spaceGrad.addColorStop(1, `hsl(${hue}, 15%, 4%)`);
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Default: deep space
      const spaceGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
      spaceGrad.addColorStop(0, '#0a0a20');
      spaceGrad.addColorStop(1, '#020208');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Stars
    for (let i = 0; i < 100; i++) {
      const sx = (42 * (i + 1) * 7919) % canvas.width;
      const sy = (42 * (i + 1) * 6271) % canvas.height;
      const bright = 0.15 + (i % 5) * 0.12;
      ctx.fillStyle = `rgba(255,255,255,${bright})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vignette
    const vig = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
