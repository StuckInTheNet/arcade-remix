/* ============================================
   PLATFORMER REMIX ENGINE
   ============================================ */

class PlatformerGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.animFrame = null;
    this._onKey = null;
    this._onKeyUp = null;
    this.keys = {};
    this.gameOver = false;
    this.frameCount = 0;
    this.score = 0;
    this.highestY = 0;
    this.scrollOffset = 0;

    // Player
    this.playerSize = Math.max(24, Math.round(canvas.height * 0.05));
    this.playerX = canvas.width * 0.1;
    this.playerY = canvas.height * 0.75;
    this.velX = 0;
    this.velY = 0;
    this.gravity = 0.45;
    this.jumpForce = -10;
    this.moveSpeed = 4;
    this.onGround = false;

    // World
    this.platforms = [];
    this.collectibles = [];
    this.particles = [];
    this.platformWidth = Math.max(60, canvas.width * 0.12);
    this.platformHeight = Math.max(10, canvas.height * 0.018);
  }

  start() {
    this.playerSize = Math.max(24, Math.round(this.canvas.height * 0.05));
    this.playerX = this.canvas.width * 0.1;
    this.playerY = this.canvas.height * 0.75;
    this.velX = 0;
    this.velY = 0;
    this.onGround = false;
    this.score = 0;
    this.highestY = 0;
    this.scrollOffset = 0;
    this.frameCount = 0;
    this.gameOver = false;
    this.keys = {};
    this.platforms = [];
    this.collectibles = [];
    this.particles = [];
    this.platformWidth = Math.max(60, this.canvas.width * 0.12);
    this.platformHeight = Math.max(10, this.canvas.height * 0.018);

    // Generate initial platforms
    this._generateInitialPlatforms();

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

  _generateInitialPlatforms() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Floor platform
    this.platforms.push({
      x: 0, y: ch * 0.85, w: cw, h: this.platformHeight * 2, isFloor: true
    });

    // Starting platforms going upward
    const spacing = ch * 0.12;
    for (let i = 1; i < 12; i++) {
      const pw = this.platformWidth * (0.7 + Math.random() * 0.6);
      this.platforms.push({
        x: Math.random() * (cw - pw),
        y: ch * 0.85 - i * spacing,
        w: pw,
        h: this.platformHeight,
        isFloor: false
      });
      // Maybe add a collectible
      if (Math.random() < 0.4) {
        this.collectibles.push({
          x: Math.random() * (cw - pw) + pw * 0.3,
          y: ch * 0.85 - i * spacing - this.playerSize * 1.2,
          size: this.playerSize * 0.5,
          collected: false
        });
      }
    }
    this.topGenerated = ch * 0.85 - 11 * spacing;
  }

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    this.frameCount++;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Horizontal movement
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.velX = -this.moveSpeed;
    } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.velX = this.moveSpeed;
    } else {
      this.velX *= 0.8;
      if (Math.abs(this.velX) < 0.3) this.velX = 0;
    }

    // Jump
    if ((this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) && this.onGround) {
      this.velY = this.jumpForce;
      this.onGround = false;
      this._spawnJumpParticles();
    }

    // Physics
    this.velY += this.gravity;
    this.playerX += this.velX;
    this.playerY += this.velY;

    // Horizontal wrapping
    if (this.playerX + this.playerSize < 0) {
      this.playerX = cw;
    } else if (this.playerX > cw) {
      this.playerX = -this.playerSize;
    }

    // Platform collision (only when falling)
    this.onGround = false;
    if (this.velY >= 0) {
      for (const p of this.platforms) {
        const screenY = p.y + this.scrollOffset;
        if (
          this.playerX + this.playerSize > p.x &&
          this.playerX < p.x + p.w &&
          this.playerY + this.playerSize >= screenY &&
          this.playerY + this.playerSize <= screenY + p.h + this.velY + 2
        ) {
          this.playerY = screenY - this.playerSize;
          this.velY = 0;
          this.onGround = true;
          break;
        }
      }
    }

    // Scroll when player goes above middle
    const scrollThreshold = ch * 0.4;
    if (this.playerY < scrollThreshold) {
      const diff = scrollThreshold - this.playerY;
      this.scrollOffset += diff;
      this.playerY = scrollThreshold;

      // Track height for score
      this.highestY += diff;
      this.score = Math.floor(this.highestY / 10);
      this.cb.onScore(this.score);
    }

    // Generate new platforms above
    const spacing = ch * 0.12;
    while (this.topGenerated + this.scrollOffset > -ch * 0.5) {
      const pw = this.platformWidth * (0.7 + Math.random() * 0.6);
      this.topGenerated -= spacing * (0.8 + Math.random() * 0.5);
      this.platforms.push({
        x: Math.random() * (cw - pw),
        y: this.topGenerated,
        w: pw,
        h: this.platformHeight,
        isFloor: false
      });
      if (Math.random() < 0.35) {
        this.collectibles.push({
          x: Math.random() * (cw - pw) + pw * 0.3,
          y: this.topGenerated - this.playerSize * 1.2,
          size: this.playerSize * 0.5,
          collected: false
        });
      }
    }

    // Remove platforms far below
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      if (this.platforms[i].y + this.scrollOffset > ch + 100) {
        this.platforms.splice(i, 1);
      }
    }

    // Collect items
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const cx = c.x + c.size / 2;
      const cy = c.y + this.scrollOffset + c.size / 2;
      const px = this.playerX + this.playerSize / 2;
      const py = this.playerY + this.playerSize / 2;
      if (Math.hypot(px - cx, py - cy) < this.playerSize * 0.7) {
        c.collected = true;
        this.score += 25;
        this.cb.onScore(this.score);
        this._spawnCollectParticles(cx, cy);
      }
    }

    // Remove collected items far below
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      if (this.collectibles[i].collected || this.collectibles[i].y + this.scrollOffset > ch + 100) {
        if (this.collectibles[i].collected || this.collectibles[i].y + this.scrollOffset > ch + 100) {
          this.collectibles.splice(i, 1);
        }
      }
    }

    // Game over if player falls below screen
    if (this.playerY > ch + 50) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
      return;
    }

    // Update particles
    if (this.particles.length > 150) this.particles.splice(0, this.particles.length - 150);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _spawnJumpParticles() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.playerX + this.playerSize / 2,
        y: this.playerY + this.playerSize,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        life: 1,
        size: Math.random() * 3 + 1,
        color: 'rgba(200,200,255,'
      });
    }
  }

  _spawnCollectParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        size: Math.random() * 4 + 2,
        color: 'rgba(255,215,0,'
      });
    }
  }

  _getPlayerEmoji() {
    const t = (this.theme.playerIs || '').toLowerCase();
    if (t.includes('cat') || t.includes('kitten') || t.includes('feline')) return '🐱';
    if (t.includes('robot') || t.includes('mech') || t.includes('android') || t.includes('machine')) return '🤖';
    if (t.includes('ninja') || t.includes('warrior') || t.includes('samurai')) return '🥷';
    if (t.includes('astronaut') || t.includes('spaceman') || t.includes('cosmonaut')) return '👨‍🚀';
    if (t.includes('frog') || t.includes('toad')) return '🐸';
    if (t.includes('ghost') || t.includes('phantom') || t.includes('spirit')) return '👻';
    if (t.includes('bunny') || t.includes('rabbit') || t.includes('hare')) return '🐰';
    if (t.includes('runner') || t.includes('person') || t.includes('human') || t.includes('athlete')) return '🏃';
    if (t.includes('dog') || t.includes('puppy') || t.includes('wolf')) return '🐕';
    if (t.includes('bear') || t.includes('panda')) return '🐻';
    if (t.includes('alien') || t.includes('ufo')) return '👽';
    if (t.includes('monkey') || t.includes('ape')) return '🐒';
    if (t.includes('bird') || t.includes('eagle') || t.includes('hawk')) return '🐦';
    return null;
  }

  _getCollectibleEmoji() {
    const t = (this.theme.collectibleIs || '').toLowerCase();
    if (t.includes('coin') || t.includes('money') || t.includes('gold')) return '🪙';
    if (t.includes('star') || t.includes('sparkle')) return '⭐';
    if (t.includes('gem') || t.includes('diamond') || t.includes('jewel') || t.includes('crystal')) return '💎';
    if (t.includes('heart') || t.includes('love') || t.includes('life')) return '❤️';
    if (t.includes('candy') || t.includes('sweet')) return '🍬';
    if (t.includes('pizza') || t.includes('food')) return '🍕';
    if (t.includes('cookie') || t.includes('cake')) return '🍪';
    if (t.includes('crown') || t.includes('king') || t.includes('royal')) return '👑';
    if (t.includes('potion') || t.includes('elixir')) return '🧪';
    if (t.includes('ring') || t.includes('halo')) return '💍';
    return '🪙';
  }

  _getPlayerColor() {
    const t = (this.theme.playerIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('frost')) return '#87CEEB';
    if (t.includes('robot') || t.includes('metal') || t.includes('steel')) return '#aaaaaa';
    if (t.includes('neon') || t.includes('cyber') || t.includes('electric')) return '#00ffff';
    if (t.includes('gold') || t.includes('royal') || t.includes('king')) return '#ffd700';
    if (t.includes('ghost') || t.includes('phantom')) return '#aabbcc';
    return '#5588ff';
  }

  _getPlatformStyle() {
    const t = (this.theme.platformsAre || '').toLowerCase();
    if (t.includes('wood') || t.includes('log') || t.includes('plank')) return 'wood';
    if (t.includes('ice') || t.includes('frozen') || t.includes('frost') || t.includes('crystal')) return 'ice';
    if (t.includes('cloud') || t.includes('fluffy') || t.includes('puffy') || t.includes('sky')) return 'cloud';
    if (t.includes('neon') || t.includes('glow') || t.includes('cyber') || t.includes('electric')) return 'neon';
    if (t.includes('candy') || t.includes('sweet') || t.includes('pink') || t.includes('bubblegum')) return 'candy';
    if (t.includes('stone') || t.includes('rock') || t.includes('brick')) return 'stone';
    if (t.includes('metal') || t.includes('steel') || t.includes('iron')) return 'metal';
    return 'default';
  }

  _drawPlatform(p, screenY) {
    const { ctx } = this;
    const style = this._getPlatformStyle();

    switch (style) {
      case 'wood': {
        const grad = ctx.createLinearGradient(p.x, screenY, p.x, screenY + p.h);
        grad.addColorStop(0, '#8B6914');
        grad.addColorStop(0.5, '#A0782C');
        grad.addColorStop(1, '#6B4F12');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 3);
        ctx.fill();
        // Wood grain lines
        ctx.strokeStyle = 'rgba(60,30,0,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const ly = screenY + p.h * (0.25 + i * 0.25);
          ctx.beginPath();
          ctx.moveTo(p.x + 4, ly);
          ctx.lineTo(p.x + p.w - 4, ly);
          ctx.stroke();
        }
        break;
      }
      case 'ice': {
        ctx.fillStyle = 'rgba(150,220,255,0.5)';
        ctx.shadowColor = '#88ddff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect(p.x + 3, screenY + 1, p.w - 6, p.h * 0.4, 2);
        ctx.fill();
        break;
      }
      case 'cloud': {
        ctx.fillStyle = 'rgba(240,240,255,0.7)';
        ctx.shadowColor = 'rgba(200,200,255,0.5)';
        ctx.shadowBlur = 12;
        // Puffy shape with overlapping circles
        const cx = p.x + p.w / 2;
        const r = p.h * 1.2;
        const puffs = Math.max(3, Math.floor(p.w / (r * 1.5)));
        for (let i = 0; i < puffs; i++) {
          const px = p.x + (i + 0.5) * (p.w / puffs);
          ctx.beginPath();
          ctx.arc(px, screenY + p.h / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        break;
      }
      case 'neon': {
        const neonColor = '#00ffcc';
        ctx.strokeStyle = neonColor;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 4);
        ctx.stroke();
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
        // Inner fill
        ctx.fillStyle = 'rgba(0,255,200,0.08)';
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 4);
        ctx.fill();
        break;
      }
      case 'candy': {
        const grad = ctx.createLinearGradient(p.x, screenY, p.x + p.w, screenY);
        grad.addColorStop(0, '#ff88bb');
        grad.addColorStop(0.5, '#ffaacc');
        grad.addColorStop(1, '#ff88bb');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, p.h / 2);
        ctx.fill();
        // Sprinkle dots
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 4; i++) {
          const sx = p.x + 8 + Math.floor((p.w - 16) * (i / 4));
          ctx.beginPath();
          ctx.arc(sx, screenY + p.h / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'stone': {
        const grad = ctx.createLinearGradient(p.x, screenY, p.x, screenY + p.h);
        grad.addColorStop(0, '#777');
        grad.addColorStop(1, '#555');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(p.x + 2, screenY + 1, p.w - 4, p.h * 0.3, 1);
        ctx.fill();
        break;
      }
      case 'metal': {
        const grad = ctx.createLinearGradient(p.x, screenY, p.x, screenY + p.h);
        grad.addColorStop(0, '#bbb');
        grad.addColorStop(0.5, '#888');
        grad.addColorStop(1, '#666');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(p.x + 1, screenY + 1, p.w - 2, p.h - 2, 2);
        ctx.stroke();
        break;
      }
      default: {
        const grad = ctx.createLinearGradient(p.x, screenY, p.x, screenY + p.h);
        grad.addColorStop(0, '#4488cc');
        grad.addColorStop(1, '#2266aa');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#4488cc';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(p.x, screenY, p.w, p.h, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(p.x + 2, screenY + 1, p.w - 4, p.h * 0.4, 2);
        ctx.fill();
        break;
      }
    }
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();

    // Draw platforms
    for (const p of this.platforms) {
      const screenY = p.y + this.scrollOffset;
      if (screenY > canvas.height + 20 || screenY + p.h < -20) continue;
      if (p.isFloor) {
        const groundGrad = ctx.createLinearGradient(0, screenY, 0, canvas.height);
        groundGrad.addColorStop(0, '#3a3a3a');
        groundGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, screenY, canvas.width, canvas.height - screenY + 50);
        ctx.strokeStyle = '#555';
        ctx.shadowColor = '#666';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        this._drawPlatform(p, screenY);
      }
    }

    // Draw collectibles
    const collectEmoji = this._getCollectibleEmoji();
    const t = performance.now() * 0.004;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const screenY = c.y + this.scrollOffset;
      if (screenY > canvas.height + 20 || screenY < -20) continue;
      const bobY = screenY + Math.sin(t + c.x * 0.02) * 4;
      const fontSize = Math.round(c.size * 1.8);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fillText(collectEmoji, c.x + c.size / 2, bobY + c.size);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // Draw player
    const playerEmoji = this._getPlayerEmoji();
    const playerColor = this._getPlayerColor();
    if (playerEmoji) {
      const fontSize = Math.round(this.playerSize * 1.3);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = playerColor;
      ctx.shadowBlur = 10;
      ctx.fillText(playerEmoji, this.playerX + this.playerSize / 2, this.playerY + this.playerSize);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    } else {
      const pGrad = ctx.createLinearGradient(this.playerX, this.playerY, this.playerX, this.playerY + this.playerSize);
      pGrad.addColorStop(0, playerColor);
      pGrad.addColorStop(1, '#2244aa');
      ctx.shadowColor = playerColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.roundRect(this.playerX, this.playerY, this.playerSize, this.playerSize, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#fff';
      const ex1 = this.playerX + this.playerSize * 0.3;
      const ex2 = this.playerX + this.playerSize * 0.7;
      const ey = this.playerY + this.playerSize * 0.35;
      ctx.beginPath();
      ctx.arc(ex1, ey, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2, ey, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      const dir = this.velX > 0.5 ? 1.5 : this.velX < -0.5 ? -1.5 : 0;
      ctx.beginPath();
      ctx.arc(ex1 + dir, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2 + dir, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
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
    ctx.fillText(`Player: ${this.theme.playerIs || 'player'}`, 8, canvas.height - 44);
    ctx.fillText(`Platforms: ${this.theme.platformsAre || 'platforms'}`, 8, canvas.height - 28);
    ctx.fillText(`Height: ${Math.floor(this.highestY)}`, 8, canvas.height - 12);
  }

  _drawBackground() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    if (theme.includes('space') || theme.includes('galaxy') || theme.includes('cosmic') || theme.includes('star') || theme.includes('nebula') || theme.includes('moon') || theme.includes('mars')) {
      const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
      grad.addColorStop(0, '#0a0a25');
      grad.addColorStop(1, '#020210');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 80; i++) {
        const sx = (42 * (i + 1) * 7919) % canvas.width;
        const sy = (42 * (i + 1) * 6271) % canvas.height;
        const bright = 0.2 + (i % 5) * 0.15;
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.includes('city') || theme.includes('neon') || theme.includes('cyber') || theme.includes('urban') || theme.includes('night')) {
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(40, 20, 60, 0.8)';
      for (let i = 0; i < 12; i++) {
        const bx = (i * canvas.width / 12);
        const bh = 40 + (i * 37 % 80);
        ctx.fillRect(bx, canvas.height - bh, canvas.width / 14, bh);
      }
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('wood') || theme.includes('nature') || theme.includes('garden')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a1800');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('ice') || theme.includes('snow') || theme.includes('arctic') || theme.includes('winter') || theme.includes('frozen')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#102030');
      grad.addColorStop(1, '#1a3040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('candy') || theme.includes('sweet') || theme.includes('bubblegum') || theme.includes('cotton')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#2a0028');
      grad.addColorStop(1, '#1a0018');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('volcano') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.5, '#400800');
      grad.addColorStop(1, '#ff3300');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('sky') || theme.includes('cloud') || theme.includes('heaven') || theme.includes('dream')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a1533');
      grad.addColorStop(1, '#1a2a55');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
      grad.addColorStop(0, '#12122a');
      grad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Vignette
    const vig = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.3, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
