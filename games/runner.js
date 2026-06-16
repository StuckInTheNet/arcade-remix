/* ============================================
   RUNNER REMIX ENGINE
   ============================================ */

class RunnerGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.groundY = canvas.height * 0.85;
    this.playerSize = Math.max(30, Math.round(canvas.height * 0.06));
    this.playerX = canvas.width * 0.15;
    this.playerY = this.groundY - this.playerSize;
    this.velY = 0;
    this.gravity = 0.6;
    this.jumpForce = -12;
    this.isJumping = false;
    this.score = 0;
    this.distance = 0;
    this.speed = 5;
    this.obstacles = [];
    this.powerups = [];
    this.particles = [];
    this.gameOver = false;
    this.animFrame = null;
    this._onKey = null;
    this._onKeyUp = null;
    this.keys = {};
    this.lastObstacle = 0;
    this.lastPowerup = 0;
    this.obstacleInterval = 120;
    this.frameCount = 0;
  }

  start() {
    this.groundY = this.canvas.height * 0.85;
    this.playerSize = Math.max(30, Math.round(this.canvas.height * 0.06));
    this.playerX = this.canvas.width * 0.15;
    this.playerY = this.groundY - this.playerSize;
    this.velY = 0;
    this.isJumping = false;
    this.score = 0;
    this.distance = 0;
    this.speed = 5;
    this.obstacles = [];
    this.powerups = [];
    this.particles = [];
    this.gameOver = false;
    this.lastObstacle = 0;
    this.lastPowerup = 0;
    this.obstacleInterval = 120;
    this.frameCount = 0;
    this.keys = {};

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
    this.distance += this.speed;
    this.score = Math.floor(this.distance / 10);
    this.cb.onScore(this.score);

    // Increase speed over time
    if (this.frameCount % 300 === 0) {
      this.speed += 0.3;
      this.obstacleInterval = Math.max(40, this.obstacleInterval - 3);
    }

    // Jump
    if ((this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) && !this.isJumping) {
      this.velY = this.jumpForce;
      this.isJumping = true;
    }

    // Physics
    this.velY += this.gravity;
    this.playerY += this.velY;
    if (this.playerY >= this.groundY - this.playerSize) {
      this.playerY = this.groundY - this.playerSize;
      this.velY = 0;
      this.isJumping = false;
    }

    // Spawn obstacles
    this.lastObstacle++;
    if (this.lastObstacle >= this.obstacleInterval) {
      this.lastObstacle = 0;
      const h = Math.max(20, this.playerSize * (0.5 + Math.random() * 0.8));
      const w = Math.max(15, h * (0.4 + Math.random() * 0.4));
      this.obstacles.push({
        x: this.canvas.width + 10,
        y: this.groundY - h,
        w: w,
        h: h,
      });
      // Randomize next interval
      this.obstacleInterval = Math.max(60, 90 + Math.floor(Math.random() * 50) - Math.floor(this.speed));
    }

    // Spawn powerups
    this.lastPowerup++;
    if (this.lastPowerup >= 200 + Math.floor(Math.random() * 100)) {
      this.lastPowerup = 0;
      this.powerups.push({
        x: this.canvas.width + 10,
        y: this.groundY - this.playerSize * 2 - Math.random() * this.canvas.height * 0.2,
        size: this.playerSize * 0.5,
      });
    }

    // Move obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.speed;
      if (this.obstacles[i].x + this.obstacles[i].w < 0) {
        this.obstacles.splice(i, 1);
        continue;
      }
      // Collision
      const o = this.obstacles[i];
      const px = this.playerX;
      const py = this.playerY;
      const ps = this.playerSize;
      const margin = ps * 0.15;
      if (
        px + ps - margin > o.x &&
        px + margin < o.x + o.w &&
        py + ps - margin > o.y &&
        py + margin < o.y + o.h
      ) {
        this.gameOver = true;
        this.cb.onGameOver(this.score);
        return;
      }
    }

    // Move powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      this.powerups[i].x -= this.speed;
      if (this.powerups[i].x + this.powerups[i].size < 0) {
        this.powerups.splice(i, 1);
        continue;
      }
      // Collect
      const p = this.powerups[i];
      const px = this.playerX + this.playerSize / 2;
      const py = this.playerY + this.playerSize / 2;
      const dist = Math.hypot(px - (p.x + p.size / 2), py - (p.y + p.size / 2));
      if (dist < this.playerSize * 0.6) {
        this.score += 50;
        this.cb.onScore(this.score);
        this._spawnCollectParticles(p.x + p.size / 2, p.y + p.size / 2);
        this.powerups.splice(i, 1);
      }
    }

    // Run particles
    if (this.frameCount % 3 === 0 && !this.isJumping) {
      this.particles.push({
        x: this.playerX + Math.random() * 4,
        y: this.groundY - 2,
        vx: -(Math.random() * 2 + 1),
        vy: -(Math.random() * 1.5),
        life: 1,
        size: Math.random() * 3 + 1,
        color: 'rgba(200,180,150,',
      });
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

  _spawnCollectParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        size: Math.random() * 4 + 2,
        color: 'rgba(255,215,0,',
      });
    }
  }

  _getPlayerEmoji() {
    const t = (this.theme.playerIs || '').toLowerCase();
    if (t.includes('runner') || t.includes('person') || t.includes('man') || t.includes('human') || t.includes('athlete')) return '🏃';
    if (t.includes('cat') || t.includes('kitten') || t.includes('feline')) return '🐱';
    if (t.includes('robot') || t.includes('mech') || t.includes('android') || t.includes('machine')) return '🤖';
    if (t.includes('car') || t.includes('auto') || t.includes('vehicle') || t.includes('race')) return '🚗';
    if (t.includes('bird') || t.includes('eagle') || t.includes('hawk') || t.includes('parrot')) return '🐦';
    if (t.includes('rocket') || t.includes('ship') || t.includes('shuttle') || t.includes('space')) return '🚀';
    if (t.includes('horse') || t.includes('pony') || t.includes('stallion') || t.includes('unicorn')) return '🐎';
    if (t.includes('dog') || t.includes('puppy') || t.includes('wolf')) return '🐕';
    if (t.includes('dinosaur') || t.includes('dino') || t.includes('trex') || t.includes('t-rex') || t.includes('rex')) return '🦖';
    if (t.includes('ninja') || t.includes('warrior') || t.includes('samurai')) return '🥷';
    if (t.includes('bunny') || t.includes('rabbit') || t.includes('hare')) return '🐰';
    if (t.includes('frog') || t.includes('toad')) return '🐸';
    if (t.includes('bear') || t.includes('panda')) return '🐻';
    if (t.includes('ghost') || t.includes('phantom') || t.includes('spirit')) return '👻';
    if (t.includes('alien') || t.includes('ufo')) return '👽';
    if (t.includes('monkey') || t.includes('ape') || t.includes('gorilla')) return '🐒';
    if (t.includes('penguin')) return '🐧';
    if (t.includes('panda')) return '🐼';
    if (t.includes('chicken')) return '🐔';
    if (t.includes('duck')) return '🦆';
    if (t.includes('fish')) return '🐟';
    if (t.includes('shark')) return '🦈';
    if (t.includes('whale')) return '🐋';
    if (t.includes('octopus')) return '🐙';
    if (t.includes('butterfly')) return '🦋';
    if (t.includes('bee')) return '🐝';
    if (t.includes('snake') || t.includes('cobra')) return '🐍';
    if (t.includes('dragon')) return '🐉';
    if (t.includes('unicorn')) return '🦄';
    if (t.includes('pizza')) return '🍕';
    if (t.includes('taco')) return '🌮';
    if (t.includes('burger')) return '🍔';
    if (t.includes('donut')) return '🍩';
    if (t.includes('cookie')) return '🍪';
    if (t.includes('cake')) return '🧁';
    if (t.includes('train')) return '🚂';
    if (t.includes('boat') || t.includes('sail')) return '⛵';
    if (t.includes('skull') || t.includes('death')) return '💀';
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

  _getObstacleEmoji() {
    const t = (this.theme.obstacleIs || '').toLowerCase();
    if (t.includes('cactus') || t.includes('cacti')) return '🌵';
    if (t.includes('rock') || t.includes('boulder') || t.includes('stone')) return '🪨';
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '🔥';
    if (t.includes('bomb') || t.includes('mine') || t.includes('explosive')) return '💣';
    if (t.includes('wall') || t.includes('brick') || t.includes('block')) return '🧱';
    if (t.includes('tree') || t.includes('stump') || t.includes('log')) return '🌲';
    if (t.includes('car') || t.includes('truck') || t.includes('vehicle')) return '🚗';
    if (t.includes('spike') || t.includes('thorn') || t.includes('nail')) return '📌';
    if (t.includes('skull') || t.includes('skeleton') || t.includes('bone')) return '💀';
    if (t.includes('barrel') || t.includes('box') || t.includes('crate')) return '🛢️';
    if (t.includes('trash') || t.includes('garbage') || t.includes('can')) return '🗑️';
    if (t.includes('snowman') || t.includes('snow') || t.includes('ice')) return '⛄';
    if (t.includes('ghost') || t.includes('phantom')) return '👻';
    if (t.includes('mushroom') || t.includes('shroom')) return '🍄';
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
    if (t.includes('ninja')) return '🥷';
    if (t.includes('wizard')) return '🧙';
    if (t.includes('star')) return '⭐';
    if (t.includes('moon')) return '🌙';
    if (t.includes('sun')) return '☀️';
    if (t.includes('diamond') || t.includes('gem')) return '💎';
    if (t.includes('crown')) return '👑';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('flower')) return '🌸';
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
    if (t.includes('coin') || t.includes('money') || t.includes('gold')) return '🪙';
    if (t.includes('star') || t.includes('sparkle')) return '⭐';
    if (t.includes('heart') || t.includes('love') || t.includes('life')) return '❤️';
    if (t.includes('gem') || t.includes('diamond') || t.includes('jewel') || t.includes('crystal')) return '💎';
    if (t.includes('candy') || t.includes('sweet')) return '🍬';
    if (t.includes('cookie') || t.includes('cake')) return '🍪';
    if (t.includes('pizza') || t.includes('food')) return '🍕';
    if (t.includes('potion') || t.includes('elixir')) return '🧪';
    if (t.includes('ring') || t.includes('halo')) return '💍';
    if (t.includes('crown') || t.includes('king') || t.includes('royal')) return '👑';
    if (t.includes('bolt') || t.includes('lightning') || t.includes('thunder')) return '⚡';
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
    if (t.includes('toxic') || t.includes('poison') || t.includes('slime')) return '#00ff00';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#ff6b35';
  }

  _getObstacleColor() {
    const t = (this.theme.obstacleIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('lava')) return '#ff2200';
    if (t.includes('ice') || t.includes('frozen') || t.includes('crystal')) return '#00bfff';
    if (t.includes('rock') || t.includes('stone') || t.includes('boulder')) return '#666666';
    if (t.includes('cactus') || t.includes('tree') || t.includes('plant')) return '#228B22';
    if (t.includes('gold') || t.includes('treasure')) return '#ffd700';
    if (t.includes('toxic') || t.includes('poison') || t.includes('acid')) return '#00ff00';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#cc3333';
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();

    // Ground
    const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, canvas.height);
    groundGrad.addColorStop(0, '#3a3a3a');
    groundGrad.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, this.groundY, canvas.width, canvas.height - this.groundY);

    // Ground line glow
    ctx.shadowColor = '#666';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(canvas.width, this.groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ground dashes (scrolling)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    const dashOffset = this.distance % 40;
    for (let x = -dashOffset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY + 8);
      ctx.lineTo(x + 20, this.groundY + 8);
      ctx.stroke();
    }

    // Draw obstacles
    const obstacleEmoji = this._getObstacleEmoji();
    const obstacleColor = this._getObstacleColor();
    for (const o of this.obstacles) {
      if (obstacleEmoji) {
        const fontSize = Math.round(Math.min(o.w, o.h) * 1.2);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(obstacleEmoji, o.x + o.w / 2, o.y + o.h - 2);
        ctx.textAlign = 'left';
      } else {
        ctx.shadowColor = obstacleColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = obstacleColor;
        ctx.beginPath();
        ctx.roundRect(o.x, o.y, o.w, o.h, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(o.x + 2, o.y + 2, o.w - 4, o.h * 0.3, 2);
        ctx.fill();
      }
    }

    // Draw powerups
    const powerupEmoji = this._getPowerupEmoji();
    const t = performance.now() * 0.004;
    for (const p of this.powerups) {
      const bobY = p.y + Math.sin(t + p.x * 0.01) * 6;
      const fontSize = Math.round(p.size * 1.5);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      // Glow
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.fillText(powerupEmoji, p.x + p.size / 2, bobY + p.size);
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
      // Rounded rectangle player with gradient
      const pGrad = ctx.createLinearGradient(this.playerX, this.playerY, this.playerX, this.playerY + this.playerSize);
      pGrad.addColorStop(0, playerColor);
      pGrad.addColorStop(1, '#993300');
      ctx.shadowColor = playerColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.roundRect(this.playerX, this.playerY, this.playerSize, this.playerSize, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#fff';
      const ex1 = this.playerX + this.playerSize * 0.35;
      const ex2 = this.playerX + this.playerSize * 0.65;
      const ey = this.playerY + this.playerSize * 0.35;
      ctx.beginPath();
      ctx.arc(ex1, ey, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2, ey, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex1 + 1, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2 + 1, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
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
    ctx.fillText(`Runner: ${this.theme.playerIs || 'runner'}`, 8, canvas.height - 44);
    ctx.fillText(`Obstacles: ${this.theme.obstacleIs || 'obstacles'}`, 8, canvas.height - 28);
    ctx.fillText(`Speed: ${this.speed.toFixed(1)}`, 8, canvas.height - 12);
  }

  _drawBackground() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    if (theme.includes('space') || theme.includes('galaxy') || theme.includes('cosmic') || theme.includes('star') || theme.includes('nebula') || theme.includes('planet') || theme.includes('alien') || theme.includes('moon') || theme.includes('mars')) {
      const spaceGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
      spaceGrad.addColorStop(0, '#0a0a25');
      spaceGrad.addColorStop(1, '#020210');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 80; i++) {
        const sx = (42 * (i + 1) * 7919) % canvas.width;
        const sy = (42 * (i + 1) * 6271) % (this.groundY);
        const bright = 0.2 + (i % 5) * 0.15;
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.includes('city') || theme.includes('neon') || theme.includes('cyber') || theme.includes('urban') || theme.includes('tokyo') || theme.includes('synth') || theme.includes('night')) {
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Distant buildings
      ctx.fillStyle = 'rgba(40, 20, 60, 0.8)';
      for (let i = 0; i < 12; i++) {
        const bx = (i * canvas.width / 12);
        const bh = 40 + (i * 37 % 80);
        ctx.fillRect(bx, this.groundY - bh, canvas.width / 14, bh);
      }
    } else if (theme.includes('desert') || theme.includes('sand') || theme.includes('dune') || theme.includes('cactus') || theme.includes('sahara') || theme.includes('western') || theme.includes('cowboy')) {
      const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
      grad.addColorStop(0, '#1a1000');
      grad.addColorStop(1, '#2a1800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('wood') || theme.includes('nature') || theme.includes('garden')) {
      const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
      grad.addColorStop(0, '#0a2000');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('ocean') || theme.includes('underwater') || theme.includes('sea') || theme.includes('beach') || theme.includes('tropical')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('volcano') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.5, '#400800');
      grad.addColorStop(1, '#ff3300');
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
      const defGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
      defGrad.addColorStop(0, `hsl(${hue}, 20%, 10%)`);
      defGrad.addColorStop(1, `hsl(${hue}, 15%, 5%)`);
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const defGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.6);
      defGrad.addColorStop(0, '#12122a');
      defGrad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = defGrad;
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
