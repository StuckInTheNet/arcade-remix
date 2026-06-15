/* ============================================
   BREAKOUT REMIX ENGINE
   ============================================ */

class BreakoutGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.paddleW = Math.max(100, Math.round(canvas.width * 0.13));
    this.paddleH = Math.max(16, Math.round(canvas.height * 0.025));
    this.paddleX = canvas.width / 2 - this.paddleW / 2;
    this.paddleY = canvas.height - Math.round(canvas.height * 0.07);
    this.ballR = Math.max(8, Math.round(canvas.height * 0.015));
    this.ballX = canvas.width / 2;
    this.ballY = this.paddleY - 10;
    this.ballVX = 3;
    this.ballVY = -4;
    this.launched = false;
    this.score = 0;
    this.lives = 3;
    this.bricks = [];
    this.particles = [];
    this.gameOver = false;
    this.animFrame = null;
    this._onKey = null;
    this._onKeyUp = null;
    this._onMouse = null;
    this._onClick = null;
    this.keys = {};
    this.brickRows = 6;
    this.brickCols = 10;
  }

  start() {
    this.paddleX = this.canvas.width / 2 - this.paddleW / 2;
    this.ballX = this.canvas.width / 2;
    this.ballY = this.paddleY - 10;
    this.ballVX = 3;
    this.ballVY = -4;
    this.launched = false;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.particles = [];
    this.keys = {};

    this._buildBricks();

    this._onKey = (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ' && !this.launched) this.launched = true;
    };
    this._onKeyUp = (e) => { this.keys[e.key] = false; };
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKeyUp);

    this._onMouse = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      this.paddleX = (e.clientX - rect.left) * scaleX - this.paddleW / 2;
      this.paddleX = Math.max(0, Math.min(this.canvas.width - this.paddleW, this.paddleX));
    };
    this._onClick = () => { if (!this.launched) this.launched = true; };
    this.canvas.addEventListener('mousemove', this._onMouse);
    this.canvas.addEventListener('click', this._onClick);

    this._loop();
  }

  destroy() {
    this.gameOver = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);
    if (this._onMouse) this.canvas.removeEventListener('mousemove', this._onMouse);
    if (this._onClick) this.canvas.removeEventListener('click', this._onClick);
  }

  _buildBricks() {
    this.bricks = [];
    const brickW = (this.canvas.width - 40) / this.brickCols;
    const brickH = Math.max(20, Math.round(this.canvas.height * 0.03));
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickCols; c++) {
        this.bricks.push({
          x: 20 + c * brickW,
          y: 50 + r * (brickH + 4),
          w: brickW - 4,
          h: brickH,
          color: colors[r % colors.length],
          hits: r < 2 ? 2 : 1,
          alive: true,
        });
      }
    }
  }

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const speed = 7;
    if (this.keys['ArrowLeft'] || this.keys['a']) this.paddleX -= speed;
    if (this.keys['ArrowRight'] || this.keys['d']) this.paddleX += speed;
    this.paddleX = Math.max(0, Math.min(this.canvas.width - this.paddleW, this.paddleX));

    if (!this.launched) {
      this.ballX = this.paddleX + this.paddleW / 2;
      this.ballY = this.paddleY - this.ballR - 1;
      return;
    }

    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    // Wall bounce
    if (this.ballX - this.ballR <= 0 || this.ballX + this.ballR >= this.canvas.width) {
      this.ballVX = -this.ballVX;
    }
    if (this.ballY - this.ballR <= 0) {
      this.ballVY = -this.ballVY;
    }

    // Bottom — lose life
    if (this.ballY + this.ballR >= this.canvas.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver = true;
        this.cb.onGameOver(this.score);
        return;
      }
      this.launched = false;
      this.ballVX = 3 * (Math.random() > 0.5 ? 1 : -1);
      this.ballVY = -4;
    }

    // Paddle bounce
    if (
      this.ballY + this.ballR >= this.paddleY &&
      this.ballY - this.ballR <= this.paddleY + this.paddleH &&
      this.ballX >= this.paddleX &&
      this.ballX <= this.paddleX + this.paddleW
    ) {
      this.ballVY = -Math.abs(this.ballVY);
      const hitPos = (this.ballX - this.paddleX) / this.paddleW;
      this.ballVX = (hitPos - 0.5) * 8;
      this.ballY = this.paddleY - this.ballR - 1;
    }

    // Brick collision
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (
        this.ballX + this.ballR > brick.x &&
        this.ballX - this.ballR < brick.x + brick.w &&
        this.ballY + this.ballR > brick.y &&
        this.ballY - this.ballR < brick.y + brick.h
      ) {
        brick.hits--;
        if (brick.hits <= 0) {
          brick.alive = false;
          this.score += 10;
          this._spawnBreakParticles(brick);
        } else {
          this.score += 5;
        }
        this.ballVY = -this.ballVY;
        this.cb.onScore(this.score);
        break;
      }
    }

    // Cap ball speed to prevent tunneling
    const maxSpeed = 10;
    this.ballVX = Math.max(-maxSpeed, Math.min(maxSpeed, this.ballVX));
    this.ballVY = Math.max(-maxSpeed, Math.min(maxSpeed, this.ballVY));

    // Win check
    if (this.bricks.every(b => !b.alive)) {
      this.score += 500;
      this.cb.onScore(this.score);
      this.gameOver = true;
      this.cb.onGameOver(this.score);
    }
  }

  _getEmoji(text, map) {
    for (const [keyword, emoji] of Object.entries(map)) {
      if (text.includes(keyword)) return emoji;
    }
    return null;
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

  _spawnBreakParticles(brick) {
    const fx = (this.theme.breakEffect || '').toLowerCase();
    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;

    if (fx.includes('melt') || fx.includes('goo') || fx.includes('drip') || fx.includes('ooze') || fx.includes('slime') || fx.includes('liquid')) {
      // Melting: slow drips falling down
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: brick.x + Math.random() * brick.w,
          y: cy,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 1,
          life: 1.2,
          color: brick.color,
          size: Math.random() * 6 + 3,
          type: 'drip',
        });
      }
    } else if (fx.includes('explode') || fx.includes('blast') || fx.includes('boom') || fx.includes('detonate') || fx.includes('bomb')) {
      // Explosion: fast outward burst
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const speed = 4 + Math.random() * 6;
        this.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.8,
          color: ['#ff0', '#f80', '#f00', '#fff'][i % 4],
          size: Math.random() * 5 + 3,
        });
      }
    } else if (fx.includes('shatter') || fx.includes('smash') || fx.includes('crack') || fx.includes('break') || fx.includes('crystal') || fx.includes('glass') || fx.includes('diamond')) {
      // Shatter: sharp angular shards
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: brick.x + Math.random() * brick.w,
          y: brick.y + Math.random() * brick.h,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 8 - 2,
          life: 1,
          color: brick.color,
          size: Math.random() * 4 + 2,
          type: 'shard',
        });
      }
    } else if (fx.includes('pop') || fx.includes('balloon') || fx.includes('bubble') || fx.includes('burst')) {
      // Pop: ring expanding outward
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        this.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 0.6,
          color: brick.color,
          size: Math.random() * 7 + 4,
          type: 'circle',
        });
      }
    } else if (fx.includes('fire') || fx.includes('flame') || fx.includes('burn') || fx.includes('ignite') || fx.includes('incinerate')) {
      // Fire: upward flames
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: brick.x + Math.random() * brick.w,
          y: cy,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 5 + 2),
          life: 1,
          color: ['#ff0', '#f80', '#f40', '#f00'][i % 4],
          size: Math.random() * 6 + 3,
        });
      }
    } else if (fx.includes('dissolve') || fx.includes('dust') || fx.includes('fade') || fx.includes('vanish') || fx.includes('poof') || fx.includes('smoke')) {
      // Dissolve: slow scatter
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: brick.x + Math.random() * brick.w,
          y: brick.y + Math.random() * brick.h,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          life: 1.5,
          color: brick.color,
          size: Math.random() * 3 + 1,
          type: 'circle',
        });
      }
    } else if (fx.includes('confetti') || fx.includes('party') || fx.includes('celebrate') || fx.includes('sparkle') || fx.includes('glitter')) {
      // Confetti: colorful scatter
      const colors = ['#ff0', '#f0f', '#0ff', '#0f0', '#f80', '#80f', '#f08'];
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 1.2,
          color: colors[i % colors.length],
          size: Math.random() * 4 + 2,
        });
      }
    } else if (fx.includes('butterfly') || fx.includes('flutter') || fx.includes('petal') || fx.includes('flower') || fx.includes('blossom')) {
      // Flutter: slow floating upward
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * brick.w,
          y: cy,
          vx: (Math.random() - 0.5) * 3,
          vy: -(Math.random() * 2 + 0.5),
          life: 1.5,
          color: ['#ff69b4', '#ffb6c1', '#dda0dd', '#ff1493', '#ffc0cb'][i % 5],
          size: Math.random() * 5 + 3,
          type: 'circle',
        });
      }
    } else {
      // Default: standard burst
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          color: brick.color,
          size: Math.random() * 5 + 2,
        });
      }
    }
  }

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const bgGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width * 0.6);
    bgGrad.addColorStop(0, '#12122a');
    bgGrad.addColorStop(1, '#0a0a18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vignette for depth
    const vig = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height * 0.3, canvas.width/2, canvas.height/2, canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bricks
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      // Gradient fill: lighter at top
      const bGrad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
      bGrad.addColorStop(0, brick.color);
      bGrad.addColorStop(0.3, brick.color);
      bGrad.addColorStop(1, this._darkenColor(brick.color, 0.25));
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.roundRect(brick.x + 2, brick.y + 2, brick.w - 4, brick.h / 3, 2);
      ctx.fill();

      // Cracked indicator
      if (brick.hits === 1) {
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(brick.x + brick.w * 0.3, brick.y);
        ctx.lineTo(brick.x + brick.w * 0.5, brick.y + brick.h);
        ctx.stroke();
      }
    }

    // Paddle
    const paddleTheme = (this.theme.paddleIs || '').toLowerCase();
    let paddleColor = '#8b5cf6';
    this._matchedPaddle = null;
    if (paddleTheme.includes('surf') || paddleTheme.includes('board') || paddleTheme.includes('wave') || paddleTheme.includes('beach') || paddleTheme.includes('ocean') || paddleTheme.includes('water') || paddleTheme.includes('tropical') || paddleTheme.includes('hawaii')) {
      paddleColor = '#00bcd4'; this._matchedPaddle = 'surf';
    } else if (paddleTheme.includes('light') || paddleTheme.includes('saber') || paddleTheme.includes('laser') || paddleTheme.includes('neon') || paddleTheme.includes('glow') || paddleTheme.includes('plasma') || paddleTheme.includes('beam') || paddleTheme.includes('jedi') || paddleTheme.includes('force') || paddleTheme.includes('electric')) {
      paddleColor = '#ff00ff'; this._matchedPaddle = 'laser';
    } else if (paddleTheme.includes('ruler') || paddleTheme.includes('wood') || paddleTheme.includes('plank') || paddleTheme.includes('log') || paddleTheme.includes('bamboo') || paddleTheme.includes('timber') || paddleTheme.includes('oak') || paddleTheme.includes('stick') || paddleTheme.includes('bat') || paddleTheme.includes('branch')) {
      paddleColor = '#8B4513'; this._matchedPaddle = 'wood';
    } else if (paddleTheme.includes('ice') || paddleTheme.includes('frozen') || paddleTheme.includes('frost') || paddleTheme.includes('glacier') || paddleTheme.includes('snow') || paddleTheme.includes('crystal') || paddleTheme.includes('cold') || paddleTheme.includes('arctic') || paddleTheme.includes('winter')) {
      paddleColor = '#87CEEB'; this._matchedPaddle = 'ice';
    } else if (paddleTheme.includes('fire') || paddleTheme.includes('flame') || paddleTheme.includes('lava') || paddleTheme.includes('burn') || paddleTheme.includes('hot') || paddleTheme.includes('inferno') || paddleTheme.includes('ember') || paddleTheme.includes('magma') || paddleTheme.includes('dragon')) {
      paddleColor = '#ff4400'; this._matchedPaddle = 'fire';
    } else if (paddleTheme.includes('gold') || paddleTheme.includes('treasure') || paddleTheme.includes('rich') || paddleTheme.includes('money') || paddleTheme.includes('crown') || paddleTheme.includes('royal') || paddleTheme.includes('king') || paddleTheme.includes('queen') || paddleTheme.includes('bling') || paddleTheme.includes('jewel') || paddleTheme.includes('diamond')) {
      paddleColor = '#ffd700'; this._matchedPaddle = 'gold';
    } else if (paddleTheme.includes('metal') || paddleTheme.includes('steel') || paddleTheme.includes('iron') || paddleTheme.includes('chrome') || paddleTheme.includes('silver') || paddleTheme.includes('robot') || paddleTheme.includes('mech') || paddleTheme.includes('titanium') || paddleTheme.includes('armor') || paddleTheme.includes('shield')) {
      paddleColor = '#aaaaaa'; this._matchedPaddle = 'metal';
    } else if (paddleTheme.includes('candy') || paddleTheme.includes('sweet') || paddleTheme.includes('gummy') || paddleTheme.includes('lollipop') || paddleTheme.includes('bubblegum') || paddleTheme.includes('sugar') || paddleTheme.includes('cake') || paddleTheme.includes('donut') || paddleTheme.includes('cookie') || paddleTheme.includes('marshmallow')) {
      paddleColor = '#ff69b4'; this._matchedPaddle = 'candy';
    } else if (paddleTheme.includes('cat') || paddleTheme.includes('kitten') || paddleTheme.includes('dog') || paddleTheme.includes('puppy') || paddleTheme.includes('animal') || paddleTheme.includes('hamster') || paddleTheme.includes('bunny') || paddleTheme.includes('rabbit') || paddleTheme.includes('bear') || paddleTheme.includes('panda') || paddleTheme.includes('fox')) {
      paddleColor = '#ffaa55'; this._matchedPaddle = 'animal';
    } else if (paddleTheme.includes('leaf') || paddleTheme.includes('plant') || paddleTheme.includes('vine') || paddleTheme.includes('garden') || paddleTheme.includes('flower') || paddleTheme.includes('tree') || paddleTheme.includes('nature') || paddleTheme.includes('grass') || paddleTheme.includes('moss') || paddleTheme.includes('forest')) {
      paddleColor = '#228B22'; this._matchedPaddle = 'nature';
    } else if (paddleTheme.includes('space') || paddleTheme.includes('rocket') || paddleTheme.includes('alien') || paddleTheme.includes('ufo') || paddleTheme.includes('star') || paddleTheme.includes('cosmic') || paddleTheme.includes('galaxy') || paddleTheme.includes('planet') || paddleTheme.includes('astro') || paddleTheme.includes('nebula')) {
      paddleColor = '#7b68ee'; this._matchedPaddle = 'cosmic';
    } else if (paddleTheme.includes('ghost') || paddleTheme.includes('phantom') || paddleTheme.includes('spirit') || paddleTheme.includes('invisible') || paddleTheme.includes('shadow') || paddleTheme.includes('dark') || paddleTheme.includes('spooky') || paddleTheme.includes('halloween') || paddleTheme.includes('skeleton')) {
      paddleColor = '#666688'; this._matchedPaddle = 'ghost';
    } else if (paddleTheme.includes('rainbow') || paddleTheme.includes('unicorn') || paddleTheme.includes('pride') || paddleTheme.includes('colorful') || paddleTheme.includes('spectrum') || paddleTheme.includes('skittles') || paddleTheme.includes('crayon')) {
      paddleColor = '#ff00ff'; this._matchedPaddle = 'rainbow';
    } else if (paddleTheme.includes('pizza') || paddleTheme.includes('taco') || paddleTheme.includes('burger') || paddleTheme.includes('hotdog') || paddleTheme.includes('sushi') || paddleTheme.includes('food') || paddleTheme.includes('noodle') || paddleTheme.includes('bread') || paddleTheme.includes('cheese') || paddleTheme.includes('sandwich')) {
      paddleColor = '#ff9900'; this._matchedPaddle = 'food';
    } else if (paddleTheme.includes('snake') || paddleTheme.includes('lizard') || paddleTheme.includes('reptile') || paddleTheme.includes('crocodile') || paddleTheme.includes('alligator') || paddleTheme.includes('gecko') || paddleTheme.includes('turtle') || paddleTheme.includes('frog') || paddleTheme.includes('toad')) {
      paddleColor = '#32cd32'; this._matchedPaddle = 'reptile';
    }

    // Paddle with pill shape and gradient
    const pGrad = ctx.createLinearGradient(this.paddleX, this.paddleY, this.paddleX, this.paddleY + this.paddleH);
    pGrad.addColorStop(0, paddleColor);
    pGrad.addColorStop(1, this._darkenColor(paddleColor, 0.3));
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(this.paddleX, this.paddleY, this.paddleW, this.paddleH, this.paddleH / 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(this.paddleX + 4, this.paddleY + 2, this.paddleW - 8, 3, 1.5);
    ctx.fill();
    // Emoji on paddle
    const pEmoji = this._getEmoji(paddleTheme, {surf:'🏄',board:'🏄',wave:'🌊',light:'⚡',saber:'⚡',laser:'⚡',wood:'🪵',ruler:'📏',ice:'🧊',fire:'🔥',gold:'👑',metal:'🔧',candy:'🍬',cat:'🐱',dog:'🐶',ghost:'👻',pizza:'🍕',snake:'🐍',leaf:'🌿',space:'🚀',rainbow:'🦄'});
    if (pEmoji) {
      ctx.font = `${Math.round(this.paddleH * 1.2)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(pEmoji, this.paddleX + this.paddleW / 2, this.paddleY + this.paddleH - 1);
      ctx.textAlign = 'left';
    }

    // Ball
    const ballTheme = (this.theme.ballIs || '').toLowerCase();
    let ballColor = '#fff';
    let ballGlow = '#fff';
    this._matchedBall = null;
    if (ballTheme.includes('fire') || ballTheme.includes('flame') || ballTheme.includes('meteor') || ballTheme.includes('comet') || ballTheme.includes('lava') || ballTheme.includes('burn') || ballTheme.includes('ember') || ballTheme.includes('phoenix') || ballTheme.includes('dragon') || ballTheme.includes('inferno')) {
      ballColor = '#ff4400'; ballGlow = '#ff6600'; this._matchedBall = 'fire';
    } else if (ballTheme.includes('eye') || ballTheme.includes('eyeball') || ballTheme.includes('cyclops') || ballTheme.includes('iris') || ballTheme.includes('pupil') || ballTheme.includes('vision') || ballTheme.includes('sauron')) {
      ballColor = '#ffffff'; ballGlow = '#ff0000'; this._matchedBall = 'eye';
    } else if (ballTheme.includes('moon') || ballTheme.includes('planet') || ballTheme.includes('earth') || ballTheme.includes('saturn') || ballTheme.includes('jupiter') || ballTheme.includes('mars') || ballTheme.includes('venus') || ballTheme.includes('mercury') || ballTheme.includes('space') || ballTheme.includes('cosmic') || ballTheme.includes('orbit')) {
      ballColor = '#ccc'; ballGlow = '#aaddff'; this._matchedBall = 'planet';
    } else if (ballTheme.includes('gold') || ballTheme.includes('coin') || ballTheme.includes('treasure') || ballTheme.includes('money') || ballTheme.includes('bling') || ballTheme.includes('crown') || ballTheme.includes('sun') || ballTheme.includes('sunny') || ballTheme.includes('solar')) {
      ballColor = '#ffd700'; ballGlow = '#ffaa00'; this._matchedBall = 'gold';
    } else if (ballTheme.includes('ice') || ballTheme.includes('frost') || ballTheme.includes('frozen') || ballTheme.includes('snow') || ballTheme.includes('crystal') || ballTheme.includes('glacier') || ballTheme.includes('arctic') || ballTheme.includes('cold') || ballTheme.includes('diamond') || ballTheme.includes('winter')) {
      ballColor = '#aaddff'; ballGlow = '#00bfff'; this._matchedBall = 'ice';
    } else if (ballTheme.includes('tennis') || ballTheme.includes('sport') || ballTheme.includes('ball') || ballTheme.includes('soccer') || ballTheme.includes('football') || ballTheme.includes('baseball') || ballTheme.includes('basketball') || ballTheme.includes('golf')) {
      ballColor = '#ccff00'; ballGlow = '#aadd00'; this._matchedBall = 'sports';
    } else if (ballTheme.includes('candy') || ballTheme.includes('sweet') || ballTheme.includes('gummy') || ballTheme.includes('bubblegum') || ballTheme.includes('lollipop') || ballTheme.includes('jawbreaker') || ballTheme.includes('gobstopper') || ballTheme.includes('marble') || ballTheme.includes('bouncy')) {
      ballColor = '#ff69b4'; ballGlow = '#ff1493'; this._matchedBall = 'candy';
    } else if (ballTheme.includes('bomb') || ballTheme.includes('cannonball') || ballTheme.includes('cannon') || ballTheme.includes('grenade') || ballTheme.includes('explosive') || ballTheme.includes('dynamite') || ballTheme.includes('tnt') || ballTheme.includes('missile') || ballTheme.includes('bullet')) {
      ballColor = '#333333'; ballGlow = '#ff4400'; this._matchedBall = 'bomb';
    } else if (ballTheme.includes('neon') || ballTheme.includes('laser') || ballTheme.includes('glow') || ballTheme.includes('electric') || ballTheme.includes('plasma') || ballTheme.includes('energy') || ballTheme.includes('pulse') || ballTheme.includes('spark')) {
      ballColor = '#00ffff'; ballGlow = '#00ff88'; this._matchedBall = 'neon';
    } else if (ballTheme.includes('ghost') || ballTheme.includes('spirit') || ballTheme.includes('phantom') || ballTheme.includes('soul') || ballTheme.includes('wisp') || ballTheme.includes('orb') || ballTheme.includes('specter')) {
      ballColor = '#aabbcc'; ballGlow = '#8899ff'; this._matchedBall = 'ghost';
    } else if (ballTheme.includes('blood') || ballTheme.includes('vampire') || ballTheme.includes('crimson') || ballTheme.includes('ruby') || ballTheme.includes('scarlet') || ballTheme.includes('heart') || ballTheme.includes('love') || ballTheme.includes('rose') || ballTheme.includes('valentine')) {
      ballColor = '#cc0000'; ballGlow = '#ff0000'; this._matchedBall = 'blood';
    } else if (ballTheme.includes('poison') || ballTheme.includes('toxic') || ballTheme.includes('radioactive') || ballTheme.includes('acid') || ballTheme.includes('venom') || ballTheme.includes('slime') || ballTheme.includes('ooze') || ballTheme.includes('mutant')) {
      ballColor = '#00ff00'; ballGlow = '#00cc00'; this._matchedBall = 'toxic';
    } else if (ballTheme.includes('hamster') || ballTheme.includes('animal') || ballTheme.includes('cat') || ballTheme.includes('dog') || ballTheme.includes('bunny') || ballTheme.includes('rabbit') || ballTheme.includes('mouse') || ballTheme.includes('panda') || ballTheme.includes('bear') || ballTheme.includes('hedgehog') || ballTheme.includes('squirrel')) {
      ballColor = '#ffaa55'; ballGlow = '#ff8800'; this._matchedBall = 'animal';
    } else if (ballTheme.includes('rainbow') || ballTheme.includes('prism') || ballTheme.includes('colorful') || ballTheme.includes('spectrum') || ballTheme.includes('unicorn') || ballTheme.includes('disco')) {
      ballColor = '#ff00ff'; ballGlow = '#ffff00'; this._matchedBall = 'rainbow';
    } else if (ballTheme.includes('bowling') || ballTheme.includes('heavy') || ballTheme.includes('wrecking') || ballTheme.includes('boulder') || ballTheme.includes('rock') || ballTheme.includes('stone') || ballTheme.includes('iron') || ballTheme.includes('steel') || ballTheme.includes('metal')) {
      ballColor = '#666666'; ballGlow = '#444444'; this._matchedBall = 'heavy';
    }

    // Emoji on ball
    const bEmoji = this._getEmoji(ballTheme, {fire:'🔥',flame:'🔥',meteor:'☄️',comet:'☄️',eye:'👁️',moon:'🌙',planet:'🌍',gold:'💰',sun:'☀️',ice:'❄️',tennis:'🎾',soccer:'⚽',basketball:'🏀',candy:'🍬',bomb:'💣',ghost:'👻',poison:'☠️',toxic:'☠️',hamster:'🐹',cat:'🐱',dog:'🐶',bowling:'🎳',rock:'🪨',disco:'🪩',heart:'❤️',rainbow:'🌈'});

    // Outer glow ring
    const glowGrad = ctx.createRadialGradient(this.ballX, this.ballY, this.ballR, this.ballX, this.ballY, this.ballR + 8);
    glowGrad.addColorStop(0, ballGlow + '44');
    glowGrad.addColorStop(1, ballGlow + '00');
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballR + 8, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.shadowColor = ballGlow;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballR, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.shadowBlur = 0;
    if (bEmoji) {
      ctx.font = `${Math.round(this.ballR * 1.8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(bEmoji, this.ballX, this.ballY + this.ballR * 0.5);
      ctx.textAlign = 'left';
    }

    // Lives
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('LIVES: ' + '\u2665'.repeat(this.lives), 10, canvas.height - 10);

    // Particles (cap to prevent unbounded growth)
    if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'drip') {
        p.vy += 0.05; // slow gravity for melting
        p.vx *= 0.98;
        p.life -= 0.015;
      } else {
        p.vy += 0.1;
        p.life -= 0.025;
      }
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'drip') {
        // Elongated drip shape
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size / 3, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shard') {
        // Rotated shard
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.vx * 0.5);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    // Theme labels
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Paddle: ' + (this.theme.paddleIs || 'paddle'), canvas.width - 200, canvas.height - 38);
    ctx.fillText('Ball: ' + (this.theme.ballIs || 'ball'), canvas.width - 200, canvas.height - 24);

    const matched = [
      this._matchedPaddle ? `paddle:${this._matchedPaddle}` : null,
      this._matchedBall ? `ball:${this._matchedBall}` : null,
    ].filter(Boolean);
    if (matched.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`matched: ${matched.join(' | ')}`, canvas.width - 200, canvas.height - 10);
    }

    // Launch hint
    if (!this.launched) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO LAUNCH', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }
  }
}
