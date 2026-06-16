/* ============================================
   DODGE REMIX ENGINE
   ============================================ */

class DodgeGame {
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
    this.lives = 3;
    this.dodged = 0;

    // Player
    this.playerW = Math.max(30, Math.round(canvas.width * 0.06));
    this.playerH = Math.max(30, Math.round(canvas.height * 0.06));
    this.playerX = canvas.width / 2 - this.playerW / 2;
    this.playerY = canvas.height * 0.85;
    this.playerSpeed = 6;

    // Falling objects
    this.fallingObjects = [];
    this.powerups = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 80;
    this.fallSpeed = 2;
    this.powerupTimer = 0;

    // Invincibility
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 180; // 3 seconds at 60fps

    // Hit flash
    this.hitFlash = 0;
  }

  start() {
    this.playerW = Math.max(30, Math.round(this.canvas.width * 0.06));
    this.playerH = Math.max(30, Math.round(this.canvas.height * 0.06));
    this.playerX = this.canvas.width / 2 - this.playerW / 2;
    this.playerY = this.canvas.height * 0.85;
    this.playerSpeed = 6;
    this.score = 0;
    this.lives = 3;
    this.dodged = 0;
    this.frameCount = 0;
    this.gameOver = false;
    this.keys = {};
    this.fallingObjects = [];
    this.powerups = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 80;
    this.fallSpeed = 2;
    this.powerupTimer = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.hitFlash = 0;

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

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    this.frameCount++;

    // Score increases with time
    if (this.frameCount % 6 === 0) {
      this.score++;
      this.cb.onScore(this.score);
    }

    // Increase difficulty over time
    if (this.frameCount % 300 === 0) {
      this.fallSpeed += 0.3;
      this.spawnInterval = Math.max(30, this.spawnInterval - 1);
    }

    // Player movement
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.playerX -= this.playerSpeed;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.playerX += this.playerSpeed;
    }
    // Clamp to screen
    this.playerX = Math.max(0, Math.min(this.canvas.width - this.playerW, this.playerX));

    // Invincibility countdown
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Hit flash decay
    if (this.hitFlash > 0) this.hitFlash--;

    // Spawn falling objects
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const size = Math.max(16, this.playerW * (0.5 + Math.random() * 0.5));
      this.fallingObjects.push({
        x: Math.random() * (this.canvas.width - size),
        y: -size,
        size: size,
        speed: this.fallSpeed * (0.8 + Math.random() * 0.4),
        rotation: Math.random() * Math.PI * 2
      });
    }

    // Spawn powerups
    this.powerupTimer++;
    if (this.powerupTimer >= 300 + Math.floor(Math.random() * 200)) {
      this.powerupTimer = 0;
      const size = this.playerW * 0.6;
      this.powerups.push({
        x: Math.random() * (this.canvas.width - size),
        y: -size,
        size: size,
        speed: this.fallSpeed * 0.7
      });
    }

    // Move and check falling objects
    for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
      const obj = this.fallingObjects[i];
      obj.y += obj.speed;
      obj.rotation += 0.02;

      // Off screen — dodged
      if (obj.y > this.canvas.height + obj.size) {
        this.fallingObjects.splice(i, 1);
        this.dodged++;
        this.score += 2;
        this.cb.onScore(this.score);
        continue;
      }

      // Collision with player
      const margin = this.playerW * 0.15;
      if (
        this.playerX + this.playerW - margin > obj.x &&
        this.playerX + margin < obj.x + obj.size &&
        this.playerY + this.playerH - margin > obj.y &&
        this.playerY + margin < obj.y + obj.size
      ) {
        if (this.invincible) {
          // Destroy on contact when invincible
          this._spawnHitParticles(obj.x + obj.size / 2, obj.y + obj.size / 2, 'rgba(255,215,0,');
          this.fallingObjects.splice(i, 1);
          this.score += 5;
          this.cb.onScore(this.score);
        } else {
          this.lives--;
          this.hitFlash = 15;
          this._spawnHitParticles(obj.x + obj.size / 2, obj.y + obj.size / 2, 'rgba(255,50,50,');
          this.fallingObjects.splice(i, 1);
          if (this.lives <= 0) {
            this.gameOver = true;
            this.cb.onGameOver(this.score);
            return;
          }
        }
      }
    }

    // Move and check powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.speed;

      if (pu.y > this.canvas.height + pu.size) {
        this.powerups.splice(i, 1);
        continue;
      }

      // Collect
      const px = this.playerX + this.playerW / 2;
      const py = this.playerY + this.playerH / 2;
      const cx = pu.x + pu.size / 2;
      const cy = pu.y + pu.size / 2;
      if (Math.hypot(px - cx, py - cy) < this.playerW * 0.7) {
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        this.score += 20;
        this.cb.onScore(this.score);
        this._spawnCollectParticles(cx, cy);
        this.powerups.splice(i, 1);
      }
    }

    // Update particles
    if (this.particles.length > 200) this.particles.splice(0, this.particles.length - 200);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _spawnHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        size: Math.random() * 4 + 2,
        color: color
      });
    }
  }

  _spawnCollectParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        size: Math.random() * 4 + 2,
        color: 'rgba(100,200,255,'
      });
    }
  }

  _getPlayerEmoji() {
    const t = (this.theme.playerIs || '').toLowerCase();
    if (t.includes('runner') || t.includes('person') || t.includes('human') || t.includes('athlete') || t.includes('man')) return '🏃';
    if (t.includes('car') || t.includes('auto') || t.includes('vehicle') || t.includes('race')) return '🚗';
    if (t.includes('umbrella') || t.includes('parasol')) return '☂️';
    if (t.includes('cat') || t.includes('kitten') || t.includes('feline')) return '🐱';
    if (t.includes('shield') || t.includes('guard') || t.includes('defend')) return '🛡️';
    if (t.includes('ninja') || t.includes('warrior') || t.includes('samurai')) return '🥷';
    if (t.includes('robot') || t.includes('mech') || t.includes('android')) return '🤖';
    if (t.includes('ghost') || t.includes('phantom') || t.includes('spirit')) return '👻';
    if (t.includes('bunny') || t.includes('rabbit') || t.includes('hare')) return '🐰';
    if (t.includes('frog') || t.includes('toad')) return '🐸';
    if (t.includes('dog') || t.includes('puppy') || t.includes('wolf')) return '🐕';
    if (t.includes('bird') || t.includes('eagle') || t.includes('hawk')) return '🐦';
    if (t.includes('penguin')) return '🐧';
    if (t.includes('bear') || t.includes('panda')) return '🐻';
    if (t.includes('monkey') || t.includes('ape')) return '🐵';
    if (t.includes('chicken')) return '🐔';
    if (t.includes('duck')) return '🦆';
    if (t.includes('fish')) return '🐟';
    if (t.includes('shark')) return '🦈';
    if (t.includes('whale')) return '🐋';
    if (t.includes('octopus')) return '🐙';
    if (t.includes('butterfly')) return '🦋';
    if (t.includes('bee')) return '🐝';
    if (t.includes('snake')) return '🐍';
    if (t.includes('dinosaur') || t.includes('dino')) return '🦖';
    if (t.includes('dragon')) return '🐉';
    if (t.includes('unicorn')) return '🦄';
    if (t.includes('pizza')) return '🍕';
    if (t.includes('taco')) return '🌮';
    if (t.includes('burger')) return '🍔';
    if (t.includes('donut')) return '🍩';
    if (t.includes('cookie')) return '🍪';
    if (t.includes('cake')) return '🧁';
    if (t.includes('rocket')) return '🚀';
    if (t.includes('train')) return '🚂';
    if (t.includes('boat') || t.includes('sail')) return '⛵';
    if (t.includes('skull') || t.includes('death')) return '💀';
    if (t.includes('alien')) return '👽';
    if (t.includes('wizard')) return '🧙';
    if (t.includes('star') || t.includes('cosmic')) return '⭐';
    if (t.includes('moon')) return '🌙';
    if (t.includes('sun')) return '☀️';
    if (t.includes('diamond') || t.includes('gem')) return '💎';
    if (t.includes('crown') || t.includes('king')) return '👑';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('tree')) return '🌲';
    if (t.includes('flower')) return '🌸';
    if (t.includes('mushroom')) return '🍄';
    if (t.includes('cactus')) return '🌵';
    if (t.includes('soccer')) return '⚽';
    if (t.includes('basketball')) return '🏀';
    if (t.length > 0) {
      const fallbackMap = {
        penguin:'🐧', cat:'🐱', dog:'🐶', bear:'🐻', frog:'🐸', monkey:'🐵',
        fish:'🐟', shark:'🦈', bird:'🐦', chicken:'🐔', duck:'🦆', eagle:'🦅',
        snake:'🐍', dragon:'🐉', dinosaur:'🦖', unicorn:'🦄', butterfly:'🦋',
        robot:'🤖', alien:'👽', ghost:'👻', ninja:'🥷', wizard:'🧙', pirate:'🏴‍☠️',
        pizza:'🍕', taco:'🌮', burger:'🍔', sushi:'🍣', donut:'🍩', cake:'🧁',
        candy:'🍬', cookie:'🍪', apple:'🍎', banana:'🍌', cherry:'🍒',
        car:'🚗', rocket:'🚀', train:'🚂', plane:'✈️', boat:'⛵',
        star:'⭐', moon:'🌙', sun:'☀️', heart:'❤️', diamond:'💎', crown:'👑',
        fire:'🔥', ice:'🧊', lightning:'⚡', rainbow:'🌈', cloud:'☁️',
        tree:'🌲', flower:'🌸', mushroom:'🍄', cactus:'🌵', leaf:'🍃',
        soccer:'⚽', basketball:'🏀', tennis:'🎾',
        bomb:'💣', skull:'💀', eye:'👁️', brain:'🧠',
        coin:'🪙', gem:'💎', treasure:'👑', shield:'🛡️',
      };
      for (const [word, emoji] of Object.entries(fallbackMap)) {
        if (t.includes(word)) return emoji;
      }
      const funPool = ['🎮','🎯','🔮','✨','💫','🌟','🎪','🎨','🎲','🌈','💥','🔥'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return funPool[Math.abs(hash) % funPool.length];
    }
    return null;
  }

  _getFallingEmoji() {
    const t = (this.theme.fallingIs || '').toLowerCase();
    if (t.includes('meteor') || t.includes('comet') || t.includes('asteroid')) return '☄️';
    if (t.includes('bomb') || t.includes('mine') || t.includes('explosive')) return '💣';
    if (t.includes('rock') || t.includes('boulder') || t.includes('stone')) return '🪨';
    if (t.includes('anvil') || t.includes('hammer') || t.includes('heavy')) return '⚒️';
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '🔥';
    if (t.includes('skull') || t.includes('skeleton') || t.includes('bone') || t.includes('death')) return '💀';
    if (t.includes('apple') || t.includes('fruit')) return '🍎';
    if (t.includes('snowball') || t.includes('snow') || t.includes('ice')) return '❄️';
    if (t.includes('poop') || t.includes('poo') || t.includes('dung')) return '💩';
    if (t.includes('spider') || t.includes('bug') || t.includes('insect')) return '🕷️';
    if (t.includes('trash') || t.includes('garbage')) return '🗑️';
    if (t.includes('cactus')) return '🌵';
    if (t.includes('penguin')) return '🐧';
    if (t.includes('frog') || t.includes('toad')) return '🐸';
    if (t.includes('bear') || t.includes('panda')) return '🐻';
    if (t.includes('monkey') || t.includes('ape')) return '🐵';
    if (t.includes('chicken')) return '🐔';
    if (t.includes('duck')) return '🦆';
    if (t.includes('fish')) return '🐟';
    if (t.includes('shark')) return '🦈';
    if (t.includes('whale')) return '🐋';
    if (t.includes('octopus')) return '🐙';
    if (t.includes('butterfly')) return '🦋';
    if (t.includes('bee')) return '🐝';
    if (t.includes('snake')) return '🐍';
    if (t.includes('dinosaur') || t.includes('dino')) return '🦖';
    if (t.includes('dragon')) return '🐉';
    if (t.includes('unicorn')) return '🦄';
    if (t.includes('pizza')) return '🍕';
    if (t.includes('taco')) return '🌮';
    if (t.includes('burger')) return '🍔';
    if (t.includes('donut')) return '🍩';
    if (t.includes('cookie')) return '🍪';
    if (t.includes('cake')) return '🧁';
    if (t.includes('cat') || t.includes('kitten')) return '🐱';
    if (t.includes('dog') || t.includes('puppy')) return '🐶';
    if (t.includes('robot')) return '🤖';
    if (t.includes('alien')) return '👽';
    if (t.includes('ghost')) return '👻';
    if (t.includes('ninja')) return '🥷';
    if (t.includes('wizard')) return '🧙';
    if (t.includes('star')) return '⭐';
    if (t.includes('moon')) return '🌙';
    if (t.includes('sun')) return '☀️';
    if (t.includes('diamond') || t.includes('gem')) return '💎';
    if (t.includes('crown')) return '👑';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('car')) return '🚗';
    if (t.includes('rocket')) return '🚀';
    if (t.includes('tree')) return '🌲';
    if (t.includes('flower')) return '🌸';
    if (t.includes('mushroom')) return '🍄';
    if (t.includes('soccer')) return '⚽';
    if (t.includes('basketball')) return '🏀';
    if (t.length > 0) {
      const fallbackMap = {
        penguin:'🐧', cat:'🐱', dog:'🐶', bear:'🐻', frog:'🐸', monkey:'🐵',
        fish:'🐟', shark:'🦈', bird:'🐦', chicken:'🐔', duck:'🦆', eagle:'🦅',
        snake:'🐍', dragon:'🐉', dinosaur:'🦖', unicorn:'🦄', butterfly:'🦋',
        robot:'🤖', alien:'👽', ghost:'👻', ninja:'🥷', wizard:'🧙', pirate:'🏴‍☠️',
        pizza:'🍕', taco:'🌮', burger:'🍔', sushi:'🍣', donut:'🍩', cake:'🧁',
        candy:'🍬', cookie:'🍪', apple:'🍎', banana:'🍌', cherry:'🍒',
        car:'🚗', rocket:'🚀', train:'🚂', plane:'✈️', boat:'⛵',
        star:'⭐', moon:'🌙', sun:'☀️', heart:'❤️', diamond:'💎', crown:'👑',
        fire:'🔥', ice:'🧊', lightning:'⚡', rainbow:'🌈', cloud:'☁️',
        tree:'🌲', flower:'🌸', mushroom:'🍄', cactus:'🌵', leaf:'🍃',
        soccer:'⚽', basketball:'🏀', tennis:'🎾',
        bomb:'💣', skull:'💀', eye:'👁️', brain:'🧠',
        coin:'🪙', gem:'💎', treasure:'👑', shield:'🛡️',
      };
      for (const [word, emoji] of Object.entries(fallbackMap)) {
        if (t.includes(word)) return emoji;
      }
      const funPool = ['🎮','🎯','🔮','✨','💫','🌟','🎪','🎨','🎲','🌈','💥','🔥'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return funPool[Math.abs(hash) % funPool.length];
    }
    return null;
  }

  _getPowerupEmoji() {
    const t = (this.theme.powerupIs || '').toLowerCase();
    if (t.includes('star') || t.includes('sparkle')) return '⭐';
    if (t.includes('shield') || t.includes('guard') || t.includes('protect')) return '🛡️';
    if (t.includes('heart') || t.includes('love') || t.includes('life')) return '❤️';
    if (t.includes('gem') || t.includes('diamond') || t.includes('jewel') || t.includes('crystal')) return '💎';
    if (t.includes('bolt') || t.includes('lightning') || t.includes('thunder')) return '⚡';
    if (t.includes('crown') || t.includes('king') || t.includes('royal')) return '👑';
    if (t.includes('potion') || t.includes('elixir')) return '🧪';
    return '⭐';
  }

  _getPlayerColor() {
    const t = (this.theme.playerIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('frost')) return '#87CEEB';
    if (t.includes('robot') || t.includes('metal') || t.includes('steel')) return '#aaaaaa';
    if (t.includes('neon') || t.includes('cyber') || t.includes('electric')) return '#00ffff';
    if (t.includes('gold') || t.includes('royal') || t.includes('king')) return '#ffd700';
    if (t.includes('ghost') || t.includes('phantom')) return '#aabbcc';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#44bb66';
  }

  _getFallingColor() {
    const t = (this.theme.fallingIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '#ff3300';
    if (t.includes('ice') || t.includes('frozen') || t.includes('snow')) return '#88ccff';
    if (t.includes('poison') || t.includes('toxic') || t.includes('acid')) return '#00ff44';
    if (t.includes('rock') || t.includes('stone') || t.includes('boulder')) return '#888888';
    if (t.includes('gold') || t.includes('treasure')) return '#ffd700';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#ee4444';
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();

    // Draw falling objects
    const fallingEmoji = this._getFallingEmoji();
    const fallingColor = this._getFallingColor();
    for (const obj of this.fallingObjects) {
      if (fallingEmoji) {
        const fontSize = Math.round(obj.size * 1.2);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(obj.x + obj.size / 2, obj.y + obj.size / 2);
        ctx.rotate(obj.rotation);
        ctx.fillText(fallingEmoji, 0, obj.size * 0.4);
        ctx.restore();
        ctx.textAlign = 'left';
      } else {
        // Default: colored circles with glow
        ctx.shadowColor = fallingColor;
        ctx.shadowBlur = 12;
        const grad = ctx.createRadialGradient(
          obj.x + obj.size / 2, obj.y + obj.size / 2, 0,
          obj.x + obj.size / 2, obj.y + obj.size / 2, obj.size / 2
        );
        grad.addColorStop(0, fallingColor);
        grad.addColorStop(0.7, fallingColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(obj.x + obj.size / 2, obj.y + obj.size / 2, obj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(obj.x + obj.size * 0.4, obj.y + obj.size * 0.35, obj.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw powerups
    const powerupEmoji = this._getPowerupEmoji();
    const t = performance.now() * 0.004;
    for (const pu of this.powerups) {
      const bobX = pu.x + Math.sin(t + pu.y * 0.02) * 3;
      const fontSize = Math.round(pu.size * 1.6);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 16;
      ctx.fillText(powerupEmoji, bobX + pu.size / 2, pu.y + pu.size);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // Draw player
    const playerEmoji = this._getPlayerEmoji();
    const playerColor = this._getPlayerColor();
    const flashOn = this.invincible && Math.floor(this.frameCount / 4) % 2 === 0;

    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.hitFlash * 0.8);
    }

    if (playerEmoji) {
      const fontSize = Math.round(this.playerH * 1.3);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      if (this.invincible) {
        ctx.shadowColor = '#00ccff';
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowColor = playerColor;
        ctx.shadowBlur = 10;
      }
      if (!flashOn || !this.invincible) {
        ctx.fillText(playerEmoji, this.playerX + this.playerW / 2, this.playerY + this.playerH);
      }
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    } else {
      // Default: rounded gradient rectangle
      const pGrad = ctx.createLinearGradient(this.playerX, this.playerY, this.playerX, this.playerY + this.playerH);
      pGrad.addColorStop(0, this.invincible ? '#00ccff' : playerColor);
      pGrad.addColorStop(1, this.invincible ? '#0066aa' : '#226633');
      ctx.shadowColor = this.invincible ? '#00ccff' : playerColor;
      ctx.shadowBlur = this.invincible ? 20 : 12;
      ctx.fillStyle = pGrad;
      if (!flashOn || !this.invincible) {
        ctx.beginPath();
        ctx.roundRect(this.playerX, this.playerY, this.playerW, this.playerH, 6);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      // Eyes
      if (!flashOn || !this.invincible) {
        ctx.fillStyle = '#fff';
        const ex1 = this.playerX + this.playerW * 0.35;
        const ex2 = this.playerX + this.playerW * 0.65;
        const ey = this.playerY + this.playerH * 0.35;
        ctx.beginPath();
        ctx.arc(ex1, ey, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ex1, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Invincibility aura
    if (this.invincible) {
      const auraAlpha = 0.15 + 0.1 * Math.sin(this.frameCount * 0.15);
      ctx.strokeStyle = `rgba(0,200,255,${auraAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(this.playerX + this.playerW / 2, this.playerY + this.playerH / 2, this.playerW * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
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

    // Lives display
    ctx.fillStyle = '#ff4444';
    ctx.font = `${Math.round(canvas.height * 0.035)}px sans-serif`;
    const heartsStr = '❤️'.repeat(this.lives);
    ctx.fillText(heartsStr, 8, canvas.height - 12);

    // Theme labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`Player: ${this.theme.playerIs || 'player'}`, 8, canvas.height - 56);
    ctx.fillText(`Falling: ${this.theme.fallingIs || 'objects'}`, 8, canvas.height - 40);
    if (this.invincible) {
      ctx.fillStyle = 'rgba(0,200,255,0.6)';
      ctx.fillText(`INVINCIBLE! ${Math.ceil(this.invincibleTimer / 60)}s`, canvas.width - 120, canvas.height - 12);
    }
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
    } else if (theme.includes('city') || theme.includes('neon') || theme.includes('cyber') || theme.includes('urban') || theme.includes('night') || theme.includes('tokyo')) {
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(40, 20, 60, 0.8)';
      for (let i = 0; i < 12; i++) {
        const bx = (i * canvas.width / 12);
        const bh = 40 + (i * 37 % 80);
        ctx.fillRect(bx, canvas.height - bh, canvas.width / 14, bh);
      }
    } else if (theme.includes('storm') || theme.includes('rain') || theme.includes('thunder') || theme.includes('cloud') || theme.includes('dark')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a0a1a');
      grad.addColorStop(0.5, '#151530');
      grad.addColorStop(1, '#0d0d20');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('desert') || theme.includes('sand') || theme.includes('dune')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1a1000');
      grad.addColorStop(1, '#2a1800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('volcano') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.5, '#400800');
      grad.addColorStop(1, '#ff3300');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('ocean') || theme.includes('underwater') || theme.includes('sea') || theme.includes('beach')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('wood') || theme.includes('nature')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a1800');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('snow') || theme.includes('arctic') || theme.includes('frozen') || theme.includes('winter') || theme.includes('ice')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#102030');
      grad.addColorStop(1, '#1a3040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.length > 0) {
      let hash = 0;
      for (let i = 0; i < theme.length; i++) hash = ((hash << 5) - hash + theme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
      grad.addColorStop(0, `hsl(${hue}, 20%, 10%)`);
      grad.addColorStop(1, `hsl(${hue}, 15%, 5%)`);
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

    // Ground line
    const groundY = this.canvas.height * 0.95;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGrad.addColorStop(0, '#3a3a3a');
    groundGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.strokeStyle = '#555';
    ctx.shadowColor = '#666';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
