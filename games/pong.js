/* ============================================
   PONG REMIX ENGINE
   ============================================ */

class PongGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.paddleW = Math.max(18, Math.round(canvas.width * 0.02));
    this.paddleH = Math.max(100, Math.round(canvas.height * 0.18));
    this.ballR = Math.max(12, Math.round(canvas.height * 0.025));
    this.p1 = { y: canvas.height / 2 - 35, score: 0 };
    this.p2 = { y: canvas.height / 2 - 35, score: 0 };
    this.ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 4, vy: 2 };
    this.gameOver = false;
    this.animFrame = null;
    this._onKey = null;
    this._onKeyUp = null;
    this.keys = {};
    this.particles = [];
    this.scoreFlash = 0;
    this.winScore = 7;
    this.isCPU = true;
    this.cpuSpeed = 3;
    this.rallyCount = 0;
  }

  start() {
    this.p1 = { y: this.canvas.height / 2 - 35, score: 0 };
    this.p2 = { y: this.canvas.height / 2 - 35, score: 0 };
    this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, vx: 4, vy: 2 };
    this.gameOver = false;
    this.particles = [];
    this.scoreFlash = 0;
    this.keys = {};
    this.rallyCount = 0;

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

  _resetBall(loserSide) {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.vx = (loserSide === 'left' ? 4 : -4);
    this.ball.vy = (Math.random() - 0.5) * 4;
    this.rallyCount = 0;
  }

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const pSpeed = 5;

    if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) this.p1.y = Math.max(0, this.p1.y - pSpeed);
    if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) this.p1.y = Math.min(this.canvas.height - this.paddleH, this.p1.y + pSpeed);

    if (this.isCPU) {
      const center = this.p2.y + this.paddleH / 2;
      const target = this.ball.y;
      if (center < target - 10) this.p2.y += this.cpuSpeed;
      else if (center > target + 10) this.p2.y -= this.cpuSpeed;
      this.p2.y = Math.max(0, Math.min(this.canvas.height - this.paddleH, this.p2.y));
    } else {
      if (this.keys['ArrowUp']) this.p2.y = Math.max(0, this.p2.y - pSpeed);
      if (this.keys['ArrowDown']) this.p2.y = Math.min(this.canvas.height - this.paddleH, this.p2.y + pSpeed);
    }

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Top/bottom bounce
    if (this.ball.y - this.ballR <= 0 || this.ball.y + this.ballR >= this.canvas.height) {
      this.ball.vy = -this.ball.vy;
      this.ball.y = Math.max(this.ballR, Math.min(this.canvas.height - this.ballR, this.ball.y));
    }

    // Paddle 1 (left)
    const p1x = 20;
    if (
      this.ball.x - this.ballR <= p1x + this.paddleW &&
      this.ball.x + this.ballR >= p1x &&
      this.ball.y >= this.p1.y &&
      this.ball.y <= this.p1.y + this.paddleH &&
      this.ball.vx < 0
    ) {
      this.ball.vx = Math.abs(this.ball.vx) * 1.05;
      this.ball.vy = ((this.ball.y - this.p1.y) / this.paddleH - 0.5) * 8;
      this.rallyCount++;
      this._spawnHitParticles(p1x + this.paddleW, this.ball.y);
    }

    // Paddle 2 (right)
    const p2x = this.canvas.width - 20 - this.paddleW;
    if (
      this.ball.x + this.ballR >= p2x &&
      this.ball.x - this.ballR <= p2x + this.paddleW &&
      this.ball.y >= this.p2.y &&
      this.ball.y <= this.p2.y + this.paddleH &&
      this.ball.vx > 0
    ) {
      this.ball.vx = -Math.abs(this.ball.vx) * 1.05;
      this.ball.vy = ((this.ball.y - this.p2.y) / this.paddleH - 0.5) * 8;
      this.rallyCount++;
      this._spawnHitParticles(p2x, this.ball.y);
    }

    // Score
    if (this.ball.x < 0) {
      this.p2.score++;
      this.scoreFlash = 30;
      this._spawnScoreParticles('right');
      this.cb.onScore(this.p1.score + ' - ' + this.p2.score);
      if (this.p2.score >= this.winScore) {
        this.gameOver = true;
        this.cb.onGameOver(this.p1.score + ' - ' + this.p2.score);
        return;
      }
      this._resetBall('left');
    }
    if (this.ball.x > this.canvas.width) {
      this.p1.score++;
      this.scoreFlash = 30;
      this._spawnScoreParticles('left');
      this.cb.onScore(this.p1.score + ' - ' + this.p2.score);
      if (this.p1.score >= this.winScore) {
        this.gameOver = true;
        this.cb.onGameOver(this.p1.score + ' - ' + this.p2.score);
        return;
      }
      this._resetBall('right');
    }

    // Cap speed
    const max = 12;
    this.ball.vx = Math.max(-max, Math.min(max, this.ball.vx));
    this.ball.vy = Math.max(-max, Math.min(max, this.ball.vy));
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

  _spawnHitParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1, color: '#ffffff', size: Math.random() * 3 + 1,
      });
    }
  }

  _spawnScoreParticles(side) {
    const sx = side === 'left' ? this.canvas.width * 0.25 : this.canvas.width * 0.75;
    const se = (this.theme.scoreEffect || '').toLowerCase();

    if (se.includes('firework') || se.includes('pyro')) {
      // Big burst of colorful circles from scoring side
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i + Math.random() * 0.3;
        const speed = 4 + Math.random() * 6;
        this.particles.push({
          x: sx, y: this.canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: ['#ff0', '#f00', '#0f0', '#00f', '#f0f', '#0ff', '#ff8800'][Math.floor(Math.random() * 7)],
          size: Math.random() * 4 + 2,
          type: 'circle',
        });
      }
    } else if (se.includes('earthquake') || se.includes('shake') || se.includes('tremor')) {
      // Screen shake + some debris particles
      this._screenShake = 15;
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width, y: this.canvas.height,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 8 - 2,
          life: 1,
          color: ['#888', '#666', '#aaa', '#555'][Math.floor(Math.random() * 4)],
          size: Math.random() * 4 + 2,
        });
      }
    } else if (se.includes('confetti') || se.includes('party') || se.includes('celebrat')) {
      // Rainbow particles floating down
      for (let i = 0; i < 25; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width, y: -10,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 3 + 1,
          life: 1,
          color: ['#ff0', '#f00', '#0f0', '#00f', '#f0f', '#0ff', '#ff8800', '#ff69b4'][Math.floor(Math.random() * 8)],
          size: Math.random() * 4 + 2,
          type: 'circle',
        });
      }
    } else if (se.includes('lightning') || se.includes('thunder') || se.includes('shock')) {
      // Flash + fast particles
      this._screenFlash = 8;
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: sx, y: this.canvas.height / 2,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          life: 1,
          color: ['#fff', '#ff0', '#aaf', '#ccf'][Math.floor(Math.random() * 4)],
          size: Math.random() * 3 + 1,
          type: 'circle',
        });
      }
    } else if (se.includes('snow') || se.includes('blizzard') || se.includes('frost')) {
      // White particles drifting down across screen
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width, y: -5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 2 + 0.5,
          life: 1,
          color: ['#fff', '#eef', '#ddf', '#cce'][Math.floor(Math.random() * 4)],
          size: Math.random() * 3 + 2,
          type: 'circle',
        });
      }
    } else if (se.includes('explosion') || se.includes('boom') || se.includes('blast')) {
      // Massive fast outward burst with fire colors
      for (let i = 0; i < 35; i++) {
        const angle = (Math.PI * 2 / 35) * i;
        const speed = 6 + Math.random() * 8;
        this.particles.push({
          x: sx, y: this.canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: ['#ff4400', '#ff8800', '#ffcc00', '#ff0000', '#ff6600'][Math.floor(Math.random() * 5)],
          size: Math.random() * 5 + 3,
          type: 'circle',
        });
      }
    } else if (se.length > 0) {
      let hash = 0;
      for (let i = 0; i < se.length; i++) hash = ((hash << 5) - hash + se.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const pColor = `hsl(${hue}, 70%, 55%)`;
      const style = Math.abs(hash) % 3;
      for (let i = 0; i < 20; i++) {
        if (style === 0) {
          this.particles.push({ x: sx, y: this.canvas.height/2, vx: (Math.random()-0.5)*4, vy: -(Math.random()*10+3), life: 1, color: pColor, size: Math.random()*4+2, type: 'circle' });
        } else if (style === 1) {
          const angle = (i/20)*Math.PI*2; const speed = 4+Math.random()*6;
          this.particles.push({ x: sx, y: this.canvas.height/2, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 0.9, color: pColor, size: Math.random()*4+2, type: 'circle' });
        } else {
          this.particles.push({ x: Math.random()*this.canvas.width, y: this.canvas.height/2, vx: (Math.random()-0.5)*2, vy: -(Math.random()*2+0.5), life: 1.3, color: pColor, size: Math.random()*4+2, type: 'circle' });
        }
      }
    } else {
      // Default: colored squares
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: sx, y: this.canvas.height / 2,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color: ['#ff0', '#f80', '#0f0', '#0ff', '#f0f'][Math.floor(Math.random() * 5)],
          size: Math.random() * 5 + 2,
        });
      }
    }
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();

    // Center line with gradient fade
    const lineGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
    lineGrad.addColorStop(0.15, 'rgba(255,255,255,0.12)');
    lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    lineGrad.addColorStop(0.85, 'rgba(255,255,255,0.12)');
    lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Scores
    ctx.fillStyle = this.scoreFlash > 0 ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.font = '40px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.p1.score, canvas.width * 0.25, 60);
    ctx.fillText(this.p2.score, canvas.width * 0.75, 60);
    ctx.textAlign = 'left';
    if (this.scoreFlash > 0) this.scoreFlash--;

    // Paddle color
    const paddleTheme = (this.theme.paddlesAre || '').toLowerCase();
    let paddleColor = '#ffffff';
    this._matchedPaddle = null;
    if (paddleTheme.includes('shield') || paddleTheme.includes('medieval') || paddleTheme.includes('knight') || paddleTheme.includes('castle') || paddleTheme.includes('armor') || paddleTheme.includes('sword') || paddleTheme.includes('warrior') || paddleTheme.includes('gladiator') || paddleTheme.includes('spartan') || paddleTheme.includes('viking')) {
      paddleColor = '#ccaa44'; this._matchedPaddle = 'medieval';
    } else if (paddleTheme.includes('duck') || paddleTheme.includes('rubber') || paddleTheme.includes('chicken') || paddleTheme.includes('goose') || paddleTheme.includes('bird') || paddleTheme.includes('parrot') || paddleTheme.includes('penguin') || paddleTheme.includes('flamingo')) {
      paddleColor = '#ffdd00'; this._matchedPaddle = 'bird';
    } else if (paddleTheme.includes('skyscraper') || paddleTheme.includes('building') || paddleTheme.includes('tower') || paddleTheme.includes('wall') || paddleTheme.includes('brick') || paddleTheme.includes('concrete') || paddleTheme.includes('stone') || paddleTheme.includes('pillar') || paddleTheme.includes('column')) {
      paddleColor = '#888888'; this._matchedPaddle = 'building';
    } else if (paddleTheme.includes('neon') || paddleTheme.includes('laser') || paddleTheme.includes('glow') || paddleTheme.includes('electric') || paddleTheme.includes('plasma') || paddleTheme.includes('cyber') || paddleTheme.includes('tron') || paddleTheme.includes('hologram') || paddleTheme.includes('synth') || paddleTheme.includes('digital')) {
      paddleColor = '#00ffff'; this._matchedPaddle = 'neon';
    } else if (paddleTheme.includes('fire') || paddleTheme.includes('flame') || paddleTheme.includes('lava') || paddleTheme.includes('burn') || paddleTheme.includes('hot') || paddleTheme.includes('inferno') || paddleTheme.includes('ember') || paddleTheme.includes('magma') || paddleTheme.includes('dragon') || paddleTheme.includes('phoenix')) {
      paddleColor = '#ff4400'; this._matchedPaddle = 'fire';
    } else if (paddleTheme.includes('ice') || paddleTheme.includes('frozen') || paddleTheme.includes('frost') || paddleTheme.includes('glacier') || paddleTheme.includes('snow') || paddleTheme.includes('arctic') || paddleTheme.includes('crystal') || paddleTheme.includes('cold') || paddleTheme.includes('winter') || paddleTheme.includes('icicle')) {
      paddleColor = '#87CEEB'; this._matchedPaddle = 'ice';
    } else if (paddleTheme.includes('wood') || paddleTheme.includes('plank') || paddleTheme.includes('log') || paddleTheme.includes('bamboo') || paddleTheme.includes('timber') || paddleTheme.includes('bat') || paddleTheme.includes('stick') || paddleTheme.includes('branch') || paddleTheme.includes('oak') || paddleTheme.includes('pine')) {
      paddleColor = '#8B4513'; this._matchedPaddle = 'wood';
    } else if (paddleTheme.includes('gold') || paddleTheme.includes('treasure') || paddleTheme.includes('rich') || paddleTheme.includes('crown') || paddleTheme.includes('king') || paddleTheme.includes('queen') || paddleTheme.includes('royal') || paddleTheme.includes('diamond') || paddleTheme.includes('jewel') || paddleTheme.includes('bling') || paddleTheme.includes('money')) {
      paddleColor = '#ffd700'; this._matchedPaddle = 'gold';
    } else if (paddleTheme.includes('candy') || paddleTheme.includes('sweet') || paddleTheme.includes('gummy') || paddleTheme.includes('lollipop') || paddleTheme.includes('bubblegum') || paddleTheme.includes('sugar') || paddleTheme.includes('cake') || paddleTheme.includes('donut') || paddleTheme.includes('cookie') || paddleTheme.includes('marshmallow')) {
      paddleColor = '#ff69b4'; this._matchedPaddle = 'candy';
    } else if (paddleTheme.includes('cat') || paddleTheme.includes('dog') || paddleTheme.includes('animal') || paddleTheme.includes('hamster') || paddleTheme.includes('bunny') || paddleTheme.includes('rabbit') || paddleTheme.includes('bear') || paddleTheme.includes('panda') || paddleTheme.includes('fox') || paddleTheme.includes('wolf') || paddleTheme.includes('mouse') || paddleTheme.includes('kitten') || paddleTheme.includes('puppy')) {
      paddleColor = '#ffaa55'; this._matchedPaddle = 'animal';
    } else if (paddleTheme.includes('robot') || paddleTheme.includes('metal') || paddleTheme.includes('steel') || paddleTheme.includes('iron') || paddleTheme.includes('chrome') || paddleTheme.includes('mech') || paddleTheme.includes('android') || paddleTheme.includes('machine') || paddleTheme.includes('titanium') || paddleTheme.includes('silver')) {
      paddleColor = '#aaaacc'; this._matchedPaddle = 'metal';
    } else if (paddleTheme.includes('ghost') || paddleTheme.includes('phantom') || paddleTheme.includes('spirit') || paddleTheme.includes('invisible') || paddleTheme.includes('shadow') || paddleTheme.includes('dark') || paddleTheme.includes('spooky') || paddleTheme.includes('halloween') || paddleTheme.includes('skeleton') || paddleTheme.includes('zombie')) {
      paddleColor = '#666688'; this._matchedPaddle = 'ghost';
    } else if (paddleTheme.includes('leaf') || paddleTheme.includes('plant') || paddleTheme.includes('vine') || paddleTheme.includes('garden') || paddleTheme.includes('flower') || paddleTheme.includes('tree') || paddleTheme.includes('nature') || paddleTheme.includes('grass') || paddleTheme.includes('moss') || paddleTheme.includes('forest') || paddleTheme.includes('cactus')) {
      paddleColor = '#228B22'; this._matchedPaddle = 'nature';
    } else if (paddleTheme.includes('pizza') || paddleTheme.includes('taco') || paddleTheme.includes('burger') || paddleTheme.includes('hotdog') || paddleTheme.includes('sushi') || paddleTheme.includes('food') || paddleTheme.includes('noodle') || paddleTheme.includes('bread') || paddleTheme.includes('cheese') || paddleTheme.includes('sandwich') || paddleTheme.includes('fries')) {
      paddleColor = '#ff9900'; this._matchedPaddle = 'food';
    } else if (paddleTheme.includes('rainbow') || paddleTheme.includes('unicorn') || paddleTheme.includes('pride') || paddleTheme.includes('colorful') || paddleTheme.includes('spectrum') || paddleTheme.includes('skittles') || paddleTheme.includes('crayon')) {
      paddleColor = '#ff00ff'; this._matchedPaddle = 'rainbow';
    } else if (paddleTheme.includes('blood') || paddleTheme.includes('vampire') || paddleTheme.includes('demon') || paddleTheme.includes('evil') || paddleTheme.includes('skull') || paddleTheme.includes('death') || paddleTheme.includes('reaper') || paddleTheme.includes('hell')) {
      paddleColor = '#cc0000'; this._matchedPaddle = 'dark';
    } else if (paddleTheme.includes('surf') || paddleTheme.includes('beach') || paddleTheme.includes('ocean') || paddleTheme.includes('wave') || paddleTheme.includes('water') || paddleTheme.includes('tropical') || paddleTheme.includes('hawaii') || paddleTheme.includes('coral') || paddleTheme.includes('sea')) {
      paddleColor = '#00bcd4'; this._matchedPaddle = 'surf';
    } else if (paddleTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < paddleTheme.length; i++) hash = ((hash << 5) - hash + paddleTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      paddleColor = `hsl(${hue}, 70%, 55%)`; this._matchedPaddle = 'custom';
    }

    // Paddles
    const paddleEmoji = this._getPaddleEmoji();
    if (paddleEmoji) {
      // Column of emoji — no shadow (causes ghosting on emoji)
      const emojiSize = Math.round(this.paddleH * 0.45);
      const count = Math.max(1, Math.floor(this.paddleH / emojiSize));
      ctx.font = `${emojiSize}px sans-serif`;
      ctx.textAlign = 'center';
      for (let i = 0; i < count; i++) {
        ctx.fillText(paddleEmoji, 20 + this.paddleW / 2, this.p1.y + emojiSize * (i + 0.85));
        ctx.fillText(paddleEmoji, canvas.width - 20 - this.paddleW / 2, this.p2.y + emojiSize * (i + 0.85));
      }
      ctx.textAlign = 'left';
    } else {
      // Default: rounded paddles with vertical gradient
      const p1Grad = ctx.createLinearGradient(20, this.p1.y, 20, this.p1.y + this.paddleH);
      p1Grad.addColorStop(0, paddleColor);
      p1Grad.addColorStop(1, this._darkenColor(paddleColor, 0.3));
      ctx.fillStyle = p1Grad;
      ctx.beginPath();
      ctx.roundRect(20, this.p1.y, this.paddleW, this.paddleH, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.roundRect(22, this.p1.y + 2, this.paddleW - 4, this.paddleH / 3, 2);
      ctx.fill();

      const p2x = canvas.width - 20 - this.paddleW;
      const p2Grad = ctx.createLinearGradient(p2x, this.p2.y, p2x, this.p2.y + this.paddleH);
      p2Grad.addColorStop(0, paddleColor);
      p2Grad.addColorStop(1, this._darkenColor(paddleColor, 0.3));
      ctx.fillStyle = p2Grad;
      ctx.beginPath();
      ctx.roundRect(p2x, this.p2.y, this.paddleW, this.paddleH, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.roundRect(p2x + 2, this.p2.y + 2, this.paddleW - 4, this.paddleH / 3, 2);
      ctx.fill();
    }

    // Ball
    const ballTheme = (this.theme.ballIs || '').toLowerCase();
    let ballColor = '#ffffff';
    let ballGlow = '#ffffff';
    this._matchedBall = null;
    if (ballTheme.includes('comet') || ballTheme.includes('fire') || ballTheme.includes('flame') || ballTheme.includes('meteor') || ballTheme.includes('lava') || ballTheme.includes('burn') || ballTheme.includes('ember') || ballTheme.includes('phoenix') || ballTheme.includes('dragon') || ballTheme.includes('inferno')) {
      ballColor = '#ff6600'; ballGlow = '#ff4400'; this._matchedBall = 'fire';
    } else if (ballTheme.includes('bowling') || ballTheme.includes('heavy') || ballTheme.includes('wrecking') || ballTheme.includes('boulder') || ballTheme.includes('rock') || ballTheme.includes('stone') || ballTheme.includes('iron') || ballTheme.includes('steel') || ballTheme.includes('metal') || ballTheme.includes('cannonball')) {
      ballColor = '#666666'; ballGlow = '#444444'; this._matchedBall = 'heavy';
    } else if (ballTheme.includes('hamster') || ballTheme.includes('animal') || ballTheme.includes('cat') || ballTheme.includes('dog') || ballTheme.includes('bunny') || ballTheme.includes('rabbit') || ballTheme.includes('mouse') || ballTheme.includes('panda') || ballTheme.includes('bear') || ballTheme.includes('hedgehog') || ballTheme.includes('squirrel') || ballTheme.includes('puppy') || ballTheme.includes('kitten')) {
      ballColor = '#ffaa55'; ballGlow = '#ff8800'; this._matchedBall = 'animal';
    } else if (ballTheme.includes('gold') || ballTheme.includes('coin') || ballTheme.includes('treasure') || ballTheme.includes('money') || ballTheme.includes('bling') || ballTheme.includes('crown') || ballTheme.includes('sun') || ballTheme.includes('sunny') || ballTheme.includes('solar')) {
      ballColor = '#ffd700'; ballGlow = '#ffaa00'; this._matchedBall = 'gold';
    } else if (ballTheme.includes('ice') || ballTheme.includes('frost') || ballTheme.includes('frozen') || ballTheme.includes('snow') || ballTheme.includes('crystal') || ballTheme.includes('glacier') || ballTheme.includes('arctic') || ballTheme.includes('cold') || ballTheme.includes('diamond') || ballTheme.includes('winter')) {
      ballColor = '#aaddff'; ballGlow = '#00bfff'; this._matchedBall = 'ice';
    } else if (ballTheme.includes('neon') || ballTheme.includes('laser') || ballTheme.includes('glow') || ballTheme.includes('electric') || ballTheme.includes('plasma') || ballTheme.includes('energy') || ballTheme.includes('pulse') || ballTheme.includes('spark')) {
      ballColor = '#00ffff'; ballGlow = '#00ff88'; this._matchedBall = 'neon';
    } else if (ballTheme.includes('candy') || ballTheme.includes('sweet') || ballTheme.includes('gummy') || ballTheme.includes('bubblegum') || ballTheme.includes('lollipop') || ballTheme.includes('jawbreaker') || ballTheme.includes('gobstopper') || ballTheme.includes('marble') || ballTheme.includes('bouncy')) {
      ballColor = '#ff69b4'; ballGlow = '#ff1493'; this._matchedBall = 'candy';
    } else if (ballTheme.includes('moon') || ballTheme.includes('planet') || ballTheme.includes('earth') || ballTheme.includes('saturn') || ballTheme.includes('jupiter') || ballTheme.includes('mars') || ballTheme.includes('space') || ballTheme.includes('cosmic') || ballTheme.includes('orbit') || ballTheme.includes('star')) {
      ballColor = '#ccc'; ballGlow = '#aaddff'; this._matchedBall = 'planet';
    } else if (ballTheme.includes('ghost') || ballTheme.includes('spirit') || ballTheme.includes('phantom') || ballTheme.includes('soul') || ballTheme.includes('wisp') || ballTheme.includes('orb') || ballTheme.includes('specter')) {
      ballColor = '#aabbcc'; ballGlow = '#8899ff'; this._matchedBall = 'ghost';
    } else if (ballTheme.includes('blood') || ballTheme.includes('vampire') || ballTheme.includes('crimson') || ballTheme.includes('ruby') || ballTheme.includes('scarlet') || ballTheme.includes('heart') || ballTheme.includes('love') || ballTheme.includes('rose') || ballTheme.includes('valentine')) {
      ballColor = '#cc0000'; ballGlow = '#ff0000'; this._matchedBall = 'blood';
    } else if (ballTheme.includes('poison') || ballTheme.includes('toxic') || ballTheme.includes('radioactive') || ballTheme.includes('acid') || ballTheme.includes('venom') || ballTheme.includes('slime') || ballTheme.includes('ooze') || ballTheme.includes('mutant')) {
      ballColor = '#00ff00'; ballGlow = '#00cc00'; this._matchedBall = 'toxic';
    } else if (ballTheme.includes('bomb') || ballTheme.includes('grenade') || ballTheme.includes('explosive') || ballTheme.includes('dynamite') || ballTheme.includes('tnt') || ballTheme.includes('missile') || ballTheme.includes('cannon')) {
      ballColor = '#333333'; ballGlow = '#ff4400'; this._matchedBall = 'bomb';
    } else if (ballTheme.includes('rainbow') || ballTheme.includes('prism') || ballTheme.includes('colorful') || ballTheme.includes('spectrum') || ballTheme.includes('unicorn') || ballTheme.includes('disco')) {
      ballColor = '#ff00ff'; ballGlow = '#ffff00'; this._matchedBall = 'rainbow';
    } else if (ballTheme.includes('tennis') || ballTheme.includes('sport') || ballTheme.includes('soccer') || ballTheme.includes('football') || ballTheme.includes('baseball') || ballTheme.includes('basketball') || ballTheme.includes('golf') || ballTheme.includes('cricket')) {
      ballColor = '#ccff00'; ballGlow = '#aadd00'; this._matchedBall = 'sports';
    } else if (ballTheme.includes('pizza') || ballTheme.includes('donut') || ballTheme.includes('cookie') || ballTheme.includes('food') || ballTheme.includes('taco') || ballTheme.includes('burger') || ballTheme.includes('cheese') || ballTheme.includes('sushi') || ballTheme.includes('apple') || ballTheme.includes('fruit')) {
      ballColor = '#ff9900'; ballGlow = '#ff6600'; this._matchedBall = 'food';
    } else if (ballTheme.includes('eye') || ballTheme.includes('eyeball') || ballTheme.includes('cyclops') || ballTheme.includes('sauron') || ballTheme.includes('vision')) {
      ballColor = '#ffffff'; ballGlow = '#ff0000'; this._matchedBall = 'eye';
    } else if (ballTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < ballTheme.length; i++) hash = ((hash << 5) - hash + ballTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      ballColor = `hsl(${hue}, 70%, 55%)`; ballGlow = `hsl(${hue}, 80%, 65%)`; this._matchedBall = 'custom';
    }

    const ballEmoji = this._getBallEmoji();
    if (ballEmoji) {
      // Emoji ball — no trail, no glow (clean rendering)
      const bSize = Math.round(this.ballR * 2.8);
      ctx.font = `${bSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(ballEmoji, this.ball.x, this.ball.y + bSize * 0.35);
      ctx.textAlign = 'left';
    } else {
      // Larger glow ring
      const glowGrad = ctx.createRadialGradient(this.ball.x, this.ball.y, this.ballR, this.ball.x, this.ball.y, this.ballR + 12);
      glowGrad.addColorStop(0, ballGlow + '33');
      glowGrad.addColorStop(1, ballGlow + '00');
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ballR + 12, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      ctx.shadowColor = ballGlow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.ball.x, this.ball.y, this.ballR, 0, Math.PI * 2);
      ctx.fillStyle = ballColor;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Screen shake effect (earthquake score effect)
    let shaking = false;
    if (this._screenShake > 0) {
      shaking = true;
      const shakeX = (Math.random() - 0.5) * this._screenShake;
      const shakeY = (Math.random() - 0.5) * this._screenShake;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      this._screenShake -= 0.8;
      if (this._screenShake < 0.5) this._screenShake = 0;
    }

    // Screen flash effect (lightning score effect)
    if (this._screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this._screenFlash * 0.08})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this._screenFlash--;
    }

    // Particles (cap to prevent unbounded growth)
    if (this.particles.length > 300) this.particles.splice(0, this.particles.length - 300);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= 0.025;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    if (shaking) {
      ctx.restore();
    }

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('P1: W/S', 10, canvas.height - 10);
    ctx.textAlign = 'right';
    ctx.fillText(this.isCPU ? 'P2: CPU' : 'P2: Up/Down', canvas.width - 10, canvas.height - 10);
    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Arena: ' + (this.theme.arenaIs || 'classic'), 10, canvas.height - 28);

    const matched = [
      this._matchedPaddle ? `paddles:${this._matchedPaddle}` : null,
      this._matchedBall ? `ball:${this._matchedBall}` : null,
      this._matchedArena ? `arena:${this._matchedArena}` : null,
    ].filter(Boolean);
    if (matched.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`matched: ${matched.join(' | ')}`, 10, canvas.height - 44);
    }

    if (this.rallyCount > 3) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RALLY: ' + this.rallyCount, canvas.width / 2, canvas.height - 10);
      ctx.textAlign = 'left';
    }
  }

  _getPaddleEmoji() {
    const t = (this.theme.paddlesAre || '').toLowerCase();
    if (t.includes('shield') || t.includes('medieval')) return '🛡️';
    if (t.includes('duck') || t.includes('rubber')) return '🦆';
    if (t.includes('skyscraper') || t.includes('building')) return '🏢';
    if (t.includes('neon') || t.includes('laser')) return '⚡';
    if (t.includes('sword') || t.includes('blade')) return '⚔️';
    if (t.includes('cat') || t.includes('kitten')) return '🐱';
    if (t.includes('dog') || t.includes('puppy')) return '🐶';
    if (t.includes('robot') || t.includes('mech')) return '🤖';
    if (t.includes('tree') || t.includes('wood') || t.includes('log')) return '🌲';
    if (t.includes('fish') || t.includes('shark')) return '🐟';
    if (t.includes('snake') || t.includes('lizard')) return '🐍';
    if (t.includes('fire') || t.includes('flame')) return '🔥';
    if (t.includes('ice') || t.includes('frozen')) return '🧊';
    if (t.includes('candy') || t.includes('sweet')) return '🍬';
    if (t.includes('pizza') || t.includes('food')) return '🍕';
    if (t.includes('ghost') || t.includes('spooky')) return '👻';
    if (t.includes('alien') || t.includes('ufo')) return '👽';
    if (t.includes('star') || t.includes('cosmic')) return '⭐';
    if (t.includes('diamond') || t.includes('gem')) return '💎';
    if (t.includes('skull') || t.includes('death')) return '💀';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('rainbow') || t.includes('unicorn')) return '🦄';
    if (t.includes('gold') || t.includes('treasure')) return '👑';
    if (t.includes('banana')) return '🍌';
    if (t.includes('cactus')) return '🌵';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getBallEmoji() {
    const t = (this.theme.ballIs || '').toLowerCase();
    if (t.includes('comet') || t.includes('meteor')) return '☄️';
    if (t.includes('fire') || t.includes('flame')) return '🔥';
    if (t.includes('bowling')) return '🎳';
    if (t.includes('hamster') || t.includes('mouse')) return '🐹';
    if (t.includes('eye') || t.includes('eyeball')) return '👁️';
    if (t.includes('moon')) return '🌙';
    if (t.includes('sun') || t.includes('star')) return '☀️';
    if (t.includes('planet') || t.includes('earth')) return '🌍';
    if (t.includes('bomb')) return '💣';
    if (t.includes('skull') || t.includes('death')) return '💀';
    if (t.includes('donut') || t.includes('doughnut')) return '🍩';
    if (t.includes('pizza')) return '🍕';
    if (t.includes('cookie')) return '🍪';
    if (t.includes('apple')) return '🍎';
    if (t.includes('watermelon') || t.includes('melon')) return '🍉';
    if (t.includes('basketball')) return '🏀';
    if (t.includes('soccer') || t.includes('football')) return '⚽';
    if (t.includes('tennis')) return '🎾';
    if (t.includes('snowball') || t.includes('snow')) return '❄️';
    if (t.includes('disco')) return '🪩';
    if (t.includes('crystal') || t.includes('gem')) return '🔮';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('cat')) return '🐱';
    if (t.includes('dog')) return '🐶';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _drawBackground() {
    const ctx = this.ctx;
    const theme = (this.theme.arenaIs || '').toLowerCase();

    this._matchedArena = null;

    // Subtle edge vignette for depth
    const drawVignette = () => {
      const g = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.8);
      g.addColorStop(0, 'transparent');
      g.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };

    if (theme.includes('colosseum') || theme.includes('gladiator') || theme.includes('arena') || theme.includes('roman') || theme.includes('ancient') || theme.includes('sparta') || theme.includes('olymp') || theme.includes('warrior') || theme.includes('battle') || theme.includes('fight') || theme.includes('duel') || theme.includes('tournament')) {
      this._matchedArena = 'colosseum';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#2a1800');
      grad.addColorStop(0.5, '#1a1000');
      grad.addColorStop(1, '#2a1500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(255, 150, 30, 0.08)');
    } else if (theme.includes('space') || theme.includes('deep') || theme.includes('star') || theme.includes('galaxy') || theme.includes('cosmic') || theme.includes('nebula') || theme.includes('planet') || theme.includes('alien') || theme.includes('moon') || theme.includes('mars') || theme.includes('orbit') || theme.includes('rocket') || theme.includes('ufo') || theme.includes('astro') || theme.includes('meteor') || theme.includes('void')) {
      this._matchedArena = 'space';
      const grad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.7);
      grad.addColorStop(0, '#0a0a25');
      grad.addColorStop(1, '#020210');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i < 120; i++) {
        const bright = 0.2 + (i % 5) * 0.15;
        const sz = 1 + (i % 3);
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc((i * 7919) % this.canvas.width, (i * 6271) % this.canvas.height, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      drawBorderGlow('rgba(100, 100, 255, 0.06)');
    } else if (theme.includes('pool') || theme.includes('water') || theme.includes('swim') || theme.includes('ocean') || theme.includes('sea') || theme.includes('aqua') || theme.includes('underwater') || theme.includes('marine') || theme.includes('fish') || theme.includes('coral') || theme.includes('reef') || theme.includes('beach') || theme.includes('tropical') || theme.includes('lake') || theme.includes('river')) {
      this._matchedArena = 'water';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(0, 150, 255, 0.08)');
    } else if (theme.includes('neon') || theme.includes('cyber') || theme.includes('synth') || theme.includes('tron') || theme.includes('electric') || theme.includes('vaporwave') || theme.includes('arcade') || theme.includes('glitch') || theme.includes('retrowave') || theme.includes('digital') || theme.includes('hack') || theme.includes('matrix')) {
      this._matchedArena = 'cyberpunk';
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(0, 255, 255, 0.1)');
    } else if (theme.includes('volcan') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno') || theme.includes('magma') || theme.includes('flame') || theme.includes('ember') || theme.includes('dragon') || theme.includes('phoenix') || theme.includes('burn') || theme.includes('demon')) {
      this._matchedArena = 'volcanic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.6, '#400800');
      grad.addColorStop(1, '#ff3300');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(255, 80, 0, 0.1)');
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('nature') || theme.includes('garden') || theme.includes('meadow') || theme.includes('grass') || theme.includes('swamp') || theme.includes('wild') || theme.includes('leaf') || theme.includes('moss') || theme.includes('fern') || theme.includes('wood')) {
      this._matchedArena = 'forest';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#0a2000');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(0, 200, 50, 0.08)');
    } else if (theme.includes('desert') || theme.includes('sand') || theme.includes('egypt') || theme.includes('pyramid') || theme.includes('dune') || theme.includes('cactus') || theme.includes('oasis') || theme.includes('sahara') || theme.includes('pharaoh') || theme.includes('camel')) {
      this._matchedArena = 'desert';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#2a1800');
      grad.addColorStop(1, '#3a2500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(255, 180, 60, 0.08)');
    } else if (theme.includes('snow') || theme.includes('arctic') || theme.includes('frozen') || theme.includes('winter') || theme.includes('ice') || theme.includes('glacier') || theme.includes('blizzard') || theme.includes('tundra') || theme.includes('polar') || theme.includes('christmas') || theme.includes('frost') || theme.includes('hockey') || theme.includes('rink')) {
      this._matchedArena = 'arctic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102030');
      grad.addColorStop(1, '#1a3040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(100, 200, 255, 0.08)');
    } else if (theme.includes('haunt') || theme.includes('grave') || theme.includes('spooky') || theme.includes('ghost') || theme.includes('zombie') || theme.includes('halloween') || theme.includes('horror') || theme.includes('creepy') || theme.includes('witch') || theme.includes('vampire') || theme.includes('cemetery') || theme.includes('skull') || theme.includes('monster') || theme.includes('dark')) {
      this._matchedArena = 'haunted';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#10002a');
      grad.addColorStop(1, '#200a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(150, 50, 255, 0.08)');
    } else if (theme.includes('sunset') || theme.includes('sunrise') || theme.includes('dusk') || theme.includes('twilight') || theme.includes('dawn') || theme.includes('evening') || theme.includes('golden')) {
      this._matchedArena = 'sunset';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200830');
      grad.addColorStop(0.5, '#351015');
      grad.addColorStop(1, '#2a1800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(255, 100, 50, 0.08)');
    } else if (theme.includes('city') || theme.includes('urban') || theme.includes('tokyo') || theme.includes('new york') || theme.includes('street') || theme.includes('skyscraper') || theme.includes('downtown') || theme.includes('metropol') || theme.includes('building')) {
      this._matchedArena = 'city';
      ctx.fillStyle = '#080815';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#151525';
      for (let i = 0; i < 20; i++) {
        const bw = 20 + (i * 17 % 30);
        const bh = 60 + (i * 31 % 120);
        ctx.beginPath();
        ctx.roundRect(i * 40 + 10, this.canvas.height - bh, bw, bh, 2);
        ctx.fill();
      }
      drawBorderGlow('rgba(100, 100, 255, 0.06)');
    } else if (theme.includes('candy') || theme.includes('sweet') || theme.includes('cake') || theme.includes('sugar') || theme.includes('chocolate') || theme.includes('donut') || theme.includes('cookie') || theme.includes('cupcake') || theme.includes('waffle')) {
      this._matchedArena = 'candyland';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200030');
      grad.addColorStop(1, '#301040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(255, 100, 200, 0.08)');
    } else if (theme.includes('sky') || theme.includes('cloud') || theme.includes('heaven') || theme.includes('angel') || theme.includes('air') || theme.includes('wind') || theme.includes('flying') || theme.includes('bird') || theme.includes('eagle') || theme.includes('paradise')) {
      this._matchedArena = 'sky';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102040');
      grad.addColorStop(1, '#1a3050');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(100, 180, 255, 0.06)');
    } else if (theme.length > 0) {
      this._matchedArena = 'custom';
      let hash = 0;
      for (let i = 0; i < theme.length; i++) hash = ((hash << 5) - hash + theme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const grad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.6);
      grad.addColorStop(0, `hsl(${hue}, 20%, 10%)`);
      grad.addColorStop(1, `hsl(${hue}, 15%, 5%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow(`hsla(${hue}, 70%, 50%, 0.08)`);
    } else {
      // Default modern background
      const grad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.6);
      grad.addColorStop(0, '#12122a');
      grad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      drawBorderGlow('rgba(139, 92, 246, 0.06)');
    }
  }
}
