/* ============================================
   FLAPPY REMIX ENGINE
   ============================================ */

class FlappyGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.birdSize = Math.max(24, Math.round(canvas.height * 0.045));
    this.birdX = canvas.width * 0.25;
    this.birdY = canvas.height / 2;
    this.velY = 0;
    this.gravity = 0.45;
    this.flapForce = -7.5;
    this.pipes = [];
    this.pipeWidth = Math.max(50, Math.round(canvas.width * 0.08));
    this.gapHeight = Math.max(100, Math.round(canvas.height * 0.25));
    this.pipeSpeed = 3;
    this.pipeInterval = 100;
    this.frameCount = 0;
    this.lastPipe = 60;
    this.score = 0;
    this.gameOver = false;
    this.animFrame = null;
    this._onKey = null;
    this._onClick = null;
    this.particles = [];
    this.rotation = 0;
    this.started = false;
  }

  start() {
    this.birdSize = Math.max(24, Math.round(this.canvas.height * 0.045));
    this.birdX = this.canvas.width * 0.25;
    this.birdY = this.canvas.height / 2;
    this.velY = 0;
    this.pipes = [];
    this.pipeWidth = Math.max(50, Math.round(this.canvas.width * 0.08));
    this.gapHeight = Math.max(100, Math.round(this.canvas.height * 0.25));
    this.pipeSpeed = 3;
    this.pipeInterval = 100;
    this.frameCount = 0;
    this.lastPipe = 60;
    this.score = 0;
    this.gameOver = false;
    this.particles = [];
    this.rotation = 0;
    this.started = false;

    this._onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this._flap();
      }
    };
    this._onClick = () => { this._flap(); };
    document.addEventListener('keydown', this._onKey);
    this.canvas.addEventListener('click', this._onClick);

    this._loop();
  }

  destroy() {
    this.gameOver = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    if (this._onClick) this.canvas.removeEventListener('click', this._onClick);
  }

  _flap() {
    if (this.gameOver) return;
    if (!this.started) this.started = true;
    this.velY = this.flapForce;
    this._spawnFlapParticles();
  }

  _spawnFlapParticles() {
    const fx = (this.theme.flapEffect || '').toLowerCase();
    let color = 'rgba(255,255,255,';
    if (fx.includes('fire') || fx.includes('flame') || fx.includes('burn')) color = 'rgba(255,100,0,';
    else if (fx.includes('sparkle') || fx.includes('star') || fx.includes('glitter')) color = 'rgba(255,215,0,';
    else if (fx.includes('bubble') || fx.includes('water') || fx.includes('splash')) color = 'rgba(100,200,255,';
    else if (fx.includes('feather') || fx.includes('petal') || fx.includes('flower')) color = 'rgba(255,200,220,';
    else if (fx.includes('smoke') || fx.includes('cloud') || fx.includes('puff')) color = 'rgba(180,180,180,';
    else if (fx.includes('rainbow') || fx.includes('color')) color = 'rgba(255,0,255,';
    else if (fx.includes('electric') || fx.includes('lightning') || fx.includes('spark') || fx.includes('neon')) color = 'rgba(0,255,255,';
    else if (fx.length > 0) {
      let hash = 0;
      for (let i = 0; i < fx.length; i++) hash = ((hash << 5) - hash + fx.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      color = `hsla(${hue}, 70%, 55%,`;
    }

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.birdX,
        y: this.birdY + this.birdSize / 2,
        vx: -(Math.random() * 3 + 1),
        vy: (Math.random() - 0.3) * 3,
        life: 1,
        size: Math.random() * 4 + 2,
        color: color,
      });
    }
  }

  _getBirdEmoji() {
    const t = (this.theme.birdIs || '').toLowerCase();
    if (t.includes('bird') || t.includes('sparrow') || t.includes('finch')) return '🐦';
    if (t.includes('cat') || t.includes('kitten') || t.includes('feline')) return '🐱';
    if (t.includes('rocket') || t.includes('ship') || t.includes('shuttle') || t.includes('space')) return '🚀';
    if (t.includes('ghost') || t.includes('phantom') || t.includes('spirit')) return '👻';
    if (t.includes('fish') || t.includes('nemo') || t.includes('goldfish')) return '🐟';
    if (t.includes('angel') || t.includes('heaven') || t.includes('cherub')) return '😇';
    if (t.includes('bat') || t.includes('vampire')) return '🦇';
    if (t.includes('dragon') || t.includes('drake')) return '🐉';
    if (t.includes('bee') || t.includes('wasp') || t.includes('hornet')) return '🐝';
    if (t.includes('butterfly') || t.includes('moth')) return '🦋';
    if (t.includes('plane') || t.includes('jet') || t.includes('airplane') || t.includes('aircraft')) return '✈️';
    if (t.includes('superhero') || t.includes('superman') || t.includes('hero')) return '🦸';
    if (t.includes('alien') || t.includes('ufo')) return '👽';
    if (t.includes('penguin')) return '🐧';
    if (t.includes('owl')) return '🦉';
    if (t.includes('eagle') || t.includes('hawk') || t.includes('falcon')) return '🦅';
    if (t.includes('parrot') || t.includes('macaw')) return '🦜';
    if (t.includes('duck') || t.includes('goose')) return '🦆';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getPipeEmoji() {
    const t = (this.theme.pipesAre || '').toLowerCase();
    if (t.includes('tree') || t.includes('trunk') || t.includes('log') || t.includes('wood')) return '🌲';
    if (t.includes('building') || t.includes('tower') || t.includes('skyscraper')) return '🏢';
    if (t.includes('candy') || t.includes('sweet') || t.includes('lollipop')) return '🍬';
    if (t.includes('cactus') || t.includes('cacti')) return '🌵';
    if (t.includes('bone') || t.includes('skeleton') || t.includes('skull')) return '🦴';
    if (t.includes('crystal') || t.includes('gem') || t.includes('diamond')) return '💎';
    if (t.includes('pillar') || t.includes('column') || t.includes('stone') || t.includes('rock')) return '🪨';
    if (t.includes('bamboo') || t.includes('stalk')) return '🎋';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _getBirdColor() {
    const t = (this.theme.birdIs || '').toLowerCase();
    if (t.includes('fire') || t.includes('flame') || t.includes('phoenix')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('frost')) return '#87CEEB';
    if (t.includes('gold') || t.includes('royal') || t.includes('crown')) return '#ffd700';
    if (t.includes('neon') || t.includes('cyber') || t.includes('electric')) return '#00ffff';
    if (t.includes('ghost') || t.includes('phantom')) return '#aabbcc';
    if (t.includes('dark') || t.includes('shadow') || t.includes('black')) return '#444466';
    if (t.includes('rainbow') || t.includes('unicorn')) return '#ff69b4';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#ffcc00';
  }

  _getPipeColor() {
    const t = (this.theme.pipesAre || '').toLowerCase();
    if (t.includes('fire') || t.includes('lava') || t.includes('flame')) return '#ff4400';
    if (t.includes('ice') || t.includes('frozen') || t.includes('crystal')) return '#00bfff';
    if (t.includes('gold') || t.includes('treasure')) return '#daa520';
    if (t.includes('candy') || t.includes('sweet') || t.includes('pink')) return '#ff69b4';
    if (t.includes('wood') || t.includes('tree') || t.includes('bamboo')) return '#8B4513';
    if (t.includes('stone') || t.includes('rock') || t.includes('pillar')) return '#666666';
    if (t.includes('neon') || t.includes('cyber')) return '#00ff88';
    if (t.length > 0) {
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
    }
    return '#2ecc71';
  }

  _loop() {
    if (this.gameOver) return;
    this._update();
    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _update() {
    this.frameCount++;

    if (!this.started) return;

    // Gravity
    this.velY += this.gravity;
    this.birdY += this.velY;

    // Rotation based on velocity
    this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velY * 0.06));

    // Ceiling / floor
    if (this.birdY - this.birdSize / 2 < 0) {
      this.birdY = this.birdSize / 2;
      this.velY = 0;
    }
    if (this.birdY + this.birdSize / 2 >= this.canvas.height) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
      return;
    }

    // Spawn pipes
    this.lastPipe++;
    if (this.lastPipe >= this.pipeInterval) {
      this.lastPipe = 0;
      const minGapTop = this.canvas.height * 0.1;
      const maxGapTop = this.canvas.height * 0.65 - this.gapHeight;
      const gapTop = minGapTop + Math.random() * (maxGapTop - minGapTop);
      this.pipes.push({
        x: this.canvas.width + 10,
        gapTop: gapTop,
        scored: false,
      });
    }

    // Move pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      this.pipes[i].x -= this.pipeSpeed;

      // Score when pipe passes bird
      if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.birdX) {
        this.pipes[i].scored = true;
        this.score++;
        this.cb.onScore(this.score);
      }

      // Remove off-screen pipes
      if (this.pipes[i].x + this.pipeWidth < -10) {
        this.pipes.splice(i, 1);
        continue;
      }

      // Collision
      const p = this.pipes[i];
      const bLeft = this.birdX - this.birdSize / 2;
      const bRight = this.birdX + this.birdSize / 2;
      const bTop = this.birdY - this.birdSize / 2;
      const bBottom = this.birdY + this.birdSize / 2;
      const margin = this.birdSize * 0.1;

      if (bRight - margin > p.x && bLeft + margin < p.x + this.pipeWidth) {
        if (bTop + margin < p.gapTop || bBottom - margin > p.gapTop + this.gapHeight) {
          this.gameOver = true;
          this.cb.onGameOver(this.score);
          return;
        }
      }
    }

    // Increase speed
    if (this.frameCount % 500 === 0) {
      this.pipeSpeed += 0.3;
      this.pipeInterval = Math.max(60, this.pipeInterval - 5);
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

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();

    const pipeColor = this._getPipeColor();
    const pipeEmoji = this._getPipeEmoji();

    // Draw pipes
    for (const p of this.pipes) {
      // Top pipe
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + this.pipeWidth, 0);
      topGrad.addColorStop(0, pipeColor);
      topGrad.addColorStop(0.5, this._lightenColor(pipeColor, 0.2));
      topGrad.addColorStop(1, pipeColor);
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, 0, this.pipeWidth, p.gapTop, [0, 0, 6, 6]);
      ctx.fill();

      // Top pipe cap
      ctx.fillStyle = this._lightenColor(pipeColor, 0.1);
      ctx.beginPath();
      ctx.roundRect(p.x - 4, p.gapTop - 16, this.pipeWidth + 8, 16, 4);
      ctx.fill();

      // Bottom pipe
      const botTop = p.gapTop + this.gapHeight;
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, botTop, this.pipeWidth, canvas.height - botTop, [6, 6, 0, 0]);
      ctx.fill();

      // Bottom pipe cap
      ctx.fillStyle = this._lightenColor(pipeColor, 0.1);
      ctx.beginPath();
      ctx.roundRect(p.x - 4, botTop, this.pipeWidth + 8, 16, 4);
      ctx.fill();

      // Pipe emoji decoration
      if (pipeEmoji) {
        const emojiSize = Math.round(this.pipeWidth * 0.7);
        ctx.font = `${emojiSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(pipeEmoji, p.x + this.pipeWidth / 2, p.gapTop - 20);
        ctx.fillText(pipeEmoji, p.x + this.pipeWidth / 2, botTop + 30 + emojiSize / 2);
        ctx.textAlign = 'left';
      }

      // Highlight on pipes
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(p.x + 4, 0, 6, p.gapTop);
      ctx.fillRect(p.x + 4, botTop, 6, canvas.height - botTop);
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

    // Draw bird
    const birdEmoji = this._getBirdEmoji();
    const birdColor = this._getBirdColor();

    ctx.save();
    ctx.translate(this.birdX, this.birdY);
    if (this.started) ctx.rotate(this.rotation);

    if (birdEmoji) {
      const fontSize = Math.round(this.birdSize * 2);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = birdColor;
      ctx.shadowBlur = 12;
      ctx.fillText(birdEmoji, 0, this.birdSize * 0.4);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    } else {
      // Circle bird with gradient
      const bGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.birdSize);
      bGrad.addColorStop(0, this._lightenColor(birdColor, 0.3));
      bGrad.addColorStop(1, birdColor);
      ctx.shadowColor = birdColor;
      ctx.shadowBlur = 14;
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.birdSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.birdSize * 0.2, -this.birdSize * 0.1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(this.birdSize * 0.25, -this.birdSize * 0.1, 2, 0, Math.PI * 2);
      ctx.fill();
      // Wing
      ctx.fillStyle = this._lightenColor(birdColor, 0.15);
      ctx.beginPath();
      ctx.ellipse(-this.birdSize * 0.15, this.birdSize * 0.05, this.birdSize * 0.3, this.birdSize * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Score display (large, centered)
    if (this.started) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = `bold ${Math.round(canvas.height * 0.08)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(this.score.toString(), canvas.width / 2, canvas.height * 0.12);
      ctx.textAlign = 'left';
    }

    // Start hint
    if (!this.started) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TAP or PRESS SPACE TO FLAP', canvas.width / 2, canvas.height * 0.65);
      ctx.textAlign = 'left';
    }

    // Theme labels
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`Bird: ${this.theme.birdIs || 'bird'}`, 8, canvas.height - 28);
    ctx.fillText(`Pipes: ${this.theme.pipesAre || 'pipes'}`, 8, canvas.height - 12);
  }

  _drawBackground() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    if (theme.includes('space') || theme.includes('galaxy') || theme.includes('cosmic') || theme.includes('star') || theme.includes('nebula')) {
      const spaceGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
      spaceGrad.addColorStop(0, '#0a0a25');
      spaceGrad.addColorStop(1, '#020210');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 80; i++) {
        const sx = (42 * (i + 1) * 7919) % canvas.width;
        const sy = (42 * (i + 1) * 6271) % canvas.height;
        ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.15})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.includes('city') || theme.includes('neon') || theme.includes('cyber') || theme.includes('urban') || theme.includes('night')) {
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(40, 20, 60, 0.5)';
      for (let i = 0; i < 15; i++) {
        const bx = (i * canvas.width / 15);
        const bh = 50 + (i * 47 % 120);
        ctx.fillRect(bx, canvas.height - bh, canvas.width / 17, bh);
      }
    } else if (theme.includes('sky') || theme.includes('cloud') || theme.includes('heaven') || theme.includes('day') || theme.includes('sun')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#102040');
      grad.addColorStop(1, '#1a3050');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('ocean') || theme.includes('underwater') || theme.includes('sea') || theme.includes('reef')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('haunt') || theme.includes('spooky') || theme.includes('ghost') || theme.includes('halloween') || theme.includes('dark') || theme.includes('grave')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#10002a');
      grad.addColorStop(1, '#200a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('sunset') || theme.includes('sunrise') || theme.includes('dusk') || theme.includes('twilight') || theme.includes('dawn')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#200830');
      grad.addColorStop(0.5, '#351015');
      grad.addColorStop(1, '#2a1800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.includes('candy') || theme.includes('sweet') || theme.includes('sugar') || theme.includes('cake') || theme.includes('donut')) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#200030');
      grad.addColorStop(1, '#301040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (theme.length > 0) {
      let hash = 0;
      for (let i = 0; i < theme.length; i++) hash = ((hash << 5) - hash + theme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const defGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      defGrad.addColorStop(0, `hsl(${hue}, 20%, 12%)`);
      defGrad.addColorStop(0.6, `hsl(${hue}, 18%, 7%)`);
      defGrad.addColorStop(1, `hsl(${hue}, 15%, 5%)`);
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const defGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      defGrad.addColorStop(0, '#1a2a3a');
      defGrad.addColorStop(0.6, '#0a1520');
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

  _lightenColor(hex, amount) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const num = parseInt(c, 16);
    const r = Math.min(255, Math.round(((num >> 16) & 0xff) * (1 + amount)));
    const g = Math.min(255, Math.round(((num >> 8) & 0xff) * (1 + amount)));
    const b = Math.min(255, Math.round((num & 0xff) * (1 + amount)));
    return `rgb(${r},${g},${b})`;
  }
}
