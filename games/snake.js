/* ============================================
   SNAKE REMIX ENGINE
   ============================================ */

class SnakeGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    // Scale cells to screen — aim for ~30 columns
    this.cellSize = Math.max(20, Math.round(canvas.width / 30));
    this.cols = Math.floor(canvas.width / this.cellSize);
    this.rows = Math.floor(canvas.height / this.cellSize);
    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = null;
    this.score = 0;
    this.gameOver = false;
    this.tickRate = 120;
    this.lastTick = 0;
    this.animFrame = null;
    this._onKey = null;
    this.particles = [];
    this.trailPoints = [];
  }

  start() {
    const midX = Math.floor(this.cols / 2);
    const midY = Math.floor(this.rows / 2);
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.tickRate = 120;
    this.particles = [];
    this.trailPoints = [];
    this._placeFood();

    this._onKey = (e) => this._handleKey(e);
    document.addEventListener('keydown', this._onKey);

    this.lastTick = performance.now();
    this._loop();
  }

  destroy() {
    this.gameOver = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
  }

  _placeFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
      };
    } while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
    this.food = pos;
  }

  _handleKey(e) {
    if (this.gameOver) return;
    const map = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
      a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
      W: { x: 0, y: -1 }, S: { x: 0, y: 1 },
      A: { x: -1, y: 0 }, D: { x: 1, y: 0 },
    };
    const nd = map[e.key];
    if (nd && !(nd.x === -this.dir.x && nd.y === -this.dir.y)) {
      this.nextDir = nd;
    }
  }

  _tick() {
    this.dir = this.nextDir;
    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
      return;
    }

    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
      return;
    }

    this.snake.unshift(newHead);

    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.cb.onScore(this.score);
      this._spawnEatParticles(newHead);
      this._placeFood();
      this.tickRate = Math.max(50, this.tickRate - 2);
    } else {
      const tail = this.snake.pop();
      this.trailPoints.push({
        x: tail.x * this.cellSize + this.cellSize / 2,
        y: tail.y * this.cellSize + this.cellSize / 2,
        life: 1,
      });
    }
  }

  _spawnEatParticles(pos) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: pos.x * this.cellSize + this.cellSize / 2,
        y: pos.y * this.cellSize + this.cellSize / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: '#ffff00',
        size: Math.random() * 4 + 2,
      });
    }
  }

  _loop() {
    if (this.gameOver) return;
    const now = performance.now();

    if (now - this.lastTick > this.tickRate) {
      this._tick();
      this.lastTick = now;
    }

    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { ctx, canvas, cellSize } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawBackground();
    this._drawTrail();

    const snakeTheme = (this.theme.snakeIs || '').toLowerCase();
    let bodyColor = '#00ff00';
    let headColor = '#00cc00';
    this._matchedSnake = null;

    if (snakeTheme.includes('dragon') || snakeTheme.includes('fire') || snakeTheme.includes('flame') || snakeTheme.includes('phoenix') || snakeTheme.includes('lava') || snakeTheme.includes('magma') || snakeTheme.includes('inferno')) {
      bodyColor = '#ff4400'; headColor = '#ff0000'; this._matchedSnake = 'fire';
    } else if (snakeTheme.includes('sushi') || snakeTheme.includes('food') || snakeTheme.includes('pizza') || snakeTheme.includes('taco') || snakeTheme.includes('burger') || snakeTheme.includes('hotdog') || snakeTheme.includes('noodle') || snakeTheme.includes('ramen') || snakeTheme.includes('pasta') || snakeTheme.includes('bread')) {
      bodyColor = '#ff9966'; headColor = '#ff6633'; this._matchedSnake = 'food';
    } else if (snakeTheme.includes('penguin') || snakeTheme.includes('ice') || snakeTheme.includes('polar') || snakeTheme.includes('arctic') || snakeTheme.includes('frozen') || snakeTheme.includes('frost') || snakeTheme.includes('snow') || snakeTheme.includes('glacier') || snakeTheme.includes('winter')) {
      bodyColor = '#334455'; headColor = '#ffffff'; this._matchedSnake = 'ice';
    } else if (snakeTheme.includes('neon') || snakeTheme.includes('cyber') || snakeTheme.includes('laser') || snakeTheme.includes('glow') || snakeTheme.includes('electric') || snakeTheme.includes('tron') || snakeTheme.includes('synth') || snakeTheme.includes('plasma') || snakeTheme.includes('hologram')) {
      bodyColor = '#00ffff'; headColor = '#ff00ff'; this._matchedSnake = 'neon';
    } else if (snakeTheme.includes('worm') || snakeTheme.includes('earth') || snakeTheme.includes('dirt') || snakeTheme.includes('mud') || snakeTheme.includes('soil') || snakeTheme.includes('ground') || snakeTheme.includes('mole')) {
      bodyColor = '#8B4513'; headColor = '#A0522D'; this._matchedSnake = 'earth';
    } else if (snakeTheme.includes('cat') || snakeTheme.includes('kitten') || snakeTheme.includes('feline') || snakeTheme.includes('tiger') || snakeTheme.includes('leopard') || snakeTheme.includes('panther') || snakeTheme.includes('jaguar')) {
      bodyColor = '#ff9933'; headColor = '#ffcc00'; this._matchedSnake = 'cat';
    } else if (snakeTheme.includes('dog') || snakeTheme.includes('puppy') || snakeTheme.includes('wolf') || snakeTheme.includes('husky') || snakeTheme.includes('corgi') || snakeTheme.includes('poodle')) {
      bodyColor = '#b8860b'; headColor = '#daa520'; this._matchedSnake = 'dog';
    } else if (snakeTheme.includes('robot') || snakeTheme.includes('metal') || snakeTheme.includes('steel') || snakeTheme.includes('mech') || snakeTheme.includes('android') || snakeTheme.includes('machine') || snakeTheme.includes('iron') || snakeTheme.includes('chrome')) {
      bodyColor = '#888888'; headColor = '#cccccc'; this._matchedSnake = 'robot';
    } else if (snakeTheme.includes('rainbow') || snakeTheme.includes('unicorn') || snakeTheme.includes('pride') || snakeTheme.includes('colorful') || snakeTheme.includes('spectrum') || snakeTheme.includes('skittles')) {
      bodyColor = '#ff00ff'; headColor = '#ffff00'; this._matchedSnake = 'rainbow';
    } else if (snakeTheme.includes('ghost') || snakeTheme.includes('phantom') || snakeTheme.includes('spirit') || snakeTheme.includes('specter') || snakeTheme.includes('invisible') || snakeTheme.includes('transparent') || snakeTheme.includes('soul')) {
      bodyColor = 'rgba(200,200,255,0.5)'; headColor = '#ffffff'; this._matchedSnake = 'ghost';
    } else if (snakeTheme.includes('vine') || snakeTheme.includes('plant') || snakeTheme.includes('leaf') || snakeTheme.includes('garden') || snakeTheme.includes('flower') || snakeTheme.includes('tree') || snakeTheme.includes('moss') || snakeTheme.includes('fern') || snakeTheme.includes('ivy')) {
      bodyColor = '#228B22'; headColor = '#32CD32'; this._matchedSnake = 'vine';
    } else if (snakeTheme.includes('candy') || snakeTheme.includes('sweet') || snakeTheme.includes('gummy') || snakeTheme.includes('sugar') || snakeTheme.includes('lollipop') || snakeTheme.includes('chocolate') || snakeTheme.includes('caramel')) {
      bodyColor = '#ff69b4'; headColor = '#ff1493'; this._matchedSnake = 'candy';
    } else if (snakeTheme.includes('shark') || snakeTheme.includes('fish') || snakeTheme.includes('whale') || snakeTheme.includes('dolphin') || snakeTheme.includes('eel') || snakeTheme.includes('squid') || snakeTheme.includes('octopus') || snakeTheme.includes('sea') || snakeTheme.includes('ocean') || snakeTheme.includes('aqua')) {
      bodyColor = '#1e90ff'; headColor = '#00bfff'; this._matchedSnake = 'ocean';
    } else if (snakeTheme.includes('gold') || snakeTheme.includes('treasure') || snakeTheme.includes('rich') || snakeTheme.includes('money') || snakeTheme.includes('coin') || snakeTheme.includes('bling') || snakeTheme.includes('crown') || snakeTheme.includes('king') || snakeTheme.includes('royal')) {
      bodyColor = '#ffd700'; headColor = '#daa520'; this._matchedSnake = 'gold';
    } else if (snakeTheme.includes('space') || snakeTheme.includes('alien') || snakeTheme.includes('ufo') || snakeTheme.includes('cosmic') || snakeTheme.includes('galaxy') || snakeTheme.includes('nebula') || snakeTheme.includes('star') || snakeTheme.includes('planet')) {
      bodyColor = '#7b68ee'; headColor = '#9370db'; this._matchedSnake = 'cosmic';
    } else if (snakeTheme.includes('blood') || snakeTheme.includes('vampire') || snakeTheme.includes('zombie') || snakeTheme.includes('demon') || snakeTheme.includes('evil') || snakeTheme.includes('dark') || snakeTheme.includes('shadow') || snakeTheme.includes('death') || snakeTheme.includes('skull')) {
      bodyColor = '#8b0000'; headColor = '#cc0000'; this._matchedSnake = 'dark';
    } else if (snakeTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < snakeTheme.length; i++) hash = ((hash << 5) - hash + snakeTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      bodyColor = `hsl(${hue}, 70%, 55%)`; headColor = `hsl(${hue}, 80%, 65%)`; this._matchedSnake = 'custom';
    }

    const snakeEmoji = this._getSnakeEmoji();

    this.snake.forEach((seg, i) => {
      const x = seg.x * cellSize;
      const y = seg.y * cellSize;
      const isHead = i === 0;

      if (snakeEmoji) {
        // Emoji rendering for the whole snake
        const sz = Math.round(cellSize * 0.9);
        ctx.font = `${sz}px sans-serif`;
        ctx.textAlign = 'center';
        if (isHead) {
          ctx.fillText(snakeEmoji.head, x + cellSize / 2, y + cellSize * 0.85);
        } else {
          ctx.globalAlpha = 1 - (i / this.snake.length) * 0.3;
          ctx.fillText(snakeEmoji.body, x + cellSize / 2, y + cellSize * 0.85);
          ctx.globalAlpha = 1;
        }
        ctx.textAlign = 'left';
      } else if (isHead) {
        // Default head: circle with eyes
        ctx.shadowColor = headColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        const ex1 = x + cellSize * 0.3;
        const ex2 = x + cellSize * 0.7;
        const ey = y + cellSize * 0.35;
        ctx.beginPath();
        ctx.arc(ex1, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ex1 + this.dir.x, ey + this.dir.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2 + this.dir.x, ey + this.dir.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default body: gradient rounded segment
        const ratio = 1 - (i / this.snake.length) * 0.3;
        ctx.globalAlpha = ratio;
        const segColor = i <= 2 ? headColor : bodyColor;
        const segGrad = ctx.createLinearGradient(x, y, x, y + cellSize);
        segGrad.addColorStop(0, segColor);
        segGrad.addColorStop(1, bodyColor);
        ctx.fillStyle = segGrad;
        const r = cellSize * 0.3;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cellSize - 4, cellSize - 4, r);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    this._drawFood();
    this._updateParticles();

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`Snake: ${this.theme.snakeIs || 'classic snake'}`, 8, canvas.height - 44);
    ctx.fillText(`Food: ${this.theme.foodIs || 'food'}`, 8, canvas.height - 28);

    const matched = [
      this._matchedSnake ? `snake:${this._matchedSnake}` : null,
      this._matchedFood ? `food:${this._matchedFood}` : null,
      this._matchedWorld ? `world:${this._matchedWorld}` : null,
      this._matchedTrail ? `trail:${this._matchedTrail}` : null,
    ].filter(Boolean);
    if (matched.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`matched: ${matched.join(' | ')}`, 8, canvas.height - 12);
    }
  }

  _drawBackground() {
    const ctx = this.ctx;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    this._matchedWorld = null;

    if (theme.includes('tokyo') || theme.includes('neon') || theme.includes('city') || theme.includes('cyber') || theme.includes('urban') || theme.includes('synth') || theme.includes('tron') || theme.includes('vaporwave') || theme.includes('arcade') || theme.includes('electric') || theme.includes('glitch') || theme.includes('retrowave') || theme.includes('new york') || theme.includes('street') || theme.includes('metropol')) {
      this._matchedWorld = 'cyberpunk';
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < this.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.cellSize, 0);
        ctx.lineTo(i * this.cellSize, this.canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < this.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * this.cellSize);
        ctx.lineTo(this.canvas.width, i * this.cellSize);
        ctx.stroke();
      }
    } else if (theme.includes('haunt') || theme.includes('grave') || theme.includes('dark') || theme.includes('spooky') || theme.includes('ghost') || theme.includes('zombie') || theme.includes('halloween') || theme.includes('horror') || theme.includes('creepy') || theme.includes('witch') || theme.includes('vampire') || theme.includes('cemetery') || theme.includes('skull') || theme.includes('monster') || theme.includes('demon')) {
      this._matchedWorld = 'haunted';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#10002a');
      grad.addColorStop(1, '#200a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('computer') || theme.includes('digital') || theme.includes('matrix') || theme.includes('hack') || theme.includes('code') || theme.includes('terminal') || theme.includes('binary') || theme.includes('program') || theme.includes('virus') || theme.includes('bot')) {
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
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('wood') || theme.includes('nature') || theme.includes('garden') || theme.includes('meadow') || theme.includes('grass') || theme.includes('swamp') || theme.includes('bog') || theme.includes('moss') || theme.includes('wild') || theme.includes('fern') || theme.includes('leaf')) {
      this._matchedWorld = 'forest';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#0a2000');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = 'rgba(0,255,0,0.02)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < this.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.cellSize, 0);
        ctx.lineTo(i * this.cellSize, this.canvas.height);
        ctx.stroke();
      }
    } else if (theme.includes('space') || theme.includes('galaxy') || theme.includes('cosmic') || theme.includes('star') || theme.includes('nebula') || theme.includes('planet') || theme.includes('alien') || theme.includes('moon') || theme.includes('mars') || theme.includes('orbit') || theme.includes('rocket') || theme.includes('ufo') || theme.includes('astro') || theme.includes('meteor')) {
      this._matchedWorld = 'space';
      const spaceGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.7);
      spaceGrad.addColorStop(0, '#0a0a25');
      spaceGrad.addColorStop(1, '#020210');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i < 120; i++) {
        const sx = (42 * (i + 1) * 7919) % this.canvas.width;
        const sy = (42 * (i + 1) * 6271) % this.canvas.height;
        const bright = 0.2 + (i % 5) * 0.15;
        const sz = 1 + (i % 3);
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.includes('ocean') || theme.includes('underwater') || theme.includes('sea') || theme.includes('reef') || theme.includes('aqua') || theme.includes('marine') || theme.includes('deep') || theme.includes('fish') || theme.includes('coral') || theme.includes('whale') || theme.includes('dolphin') || theme.includes('shark') || theme.includes('atlantis') || theme.includes('mermaid') || theme.includes('trench')) {
      this._matchedWorld = 'ocean';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('desert') || theme.includes('sand') || theme.includes('egypt') || theme.includes('pyramid') || theme.includes('dune') || theme.includes('cactus') || theme.includes('oasis') || theme.includes('sahara') || theme.includes('pharaoh') || theme.includes('camel')) {
      this._matchedWorld = 'desert';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#2a1800');
      grad.addColorStop(1, '#3a2500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('volcan') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno') || theme.includes('magma') || theme.includes('flame') || theme.includes('ember') || theme.includes('dragon') || theme.includes('phoenix') || theme.includes('burn')) {
      this._matchedWorld = 'volcanic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.5, '#400800');
      grad.addColorStop(1, '#ff3300');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('snow') || theme.includes('arctic') || theme.includes('frozen') || theme.includes('winter') || theme.includes('ice') || theme.includes('glacier') || theme.includes('blizzard') || theme.includes('tundra') || theme.includes('polar') || theme.includes('christmas') || theme.includes('frost')) {
      this._matchedWorld = 'arctic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102030');
      grad.addColorStop(1, '#1a3040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('candy') || theme.includes('sweet') || theme.includes('cake') || theme.includes('sugar') || theme.includes('chocolate') || theme.includes('donut') || theme.includes('cookie') || theme.includes('cupcake') || theme.includes('waffle')) {
      this._matchedWorld = 'candyland';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200030');
      grad.addColorStop(1, '#301040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('sky') || theme.includes('cloud') || theme.includes('heaven') || theme.includes('angel') || theme.includes('air') || theme.includes('wind') || theme.includes('flying') || theme.includes('bird') || theme.includes('eagle') || theme.includes('paradise')) {
      this._matchedWorld = 'sky';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102040');
      grad.addColorStop(1, '#1a3050');
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
    } else if (theme.length > 0) {
      this._matchedWorld = 'custom';
      let hash = 0;
      for (let i = 0; i < theme.length; i++) hash = ((hash << 5) - hash + theme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const defGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.6);
      defGrad.addColorStop(0, `hsl(${hue}, 20%, 10%)`);
      defGrad.addColorStop(1, `hsl(${hue}, 15%, 5%)`);
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      const defGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.6);
      defGrad.addColorStop(0, '#12122a');
      defGrad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < this.cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.cellSize, 0);
        ctx.lineTo(i * this.cellSize, this.canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < this.rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * this.cellSize);
        ctx.lineTo(this.canvas.width, i * this.cellSize);
        ctx.stroke();
      }
    }

    // Vignette for depth
    const vig = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawFood() {
    if (!this.food) return;
    const ctx = this.ctx;
    const x = this.food.x * this.cellSize + this.cellSize / 2;
    const y = this.food.y * this.cellSize + this.cellSize / 2;
    const t = performance.now() * 0.003;
    const pulse = 1 + Math.sin(t) * 0.15;
    const r = (this.cellSize / 2 - 2) * pulse;

    const foodTheme = (this.theme.foodIs || '').toLowerCase();
    let color = '#ff0000';
    this._matchedFood = null;
    if (foodTheme.includes('gold') || foodTheme.includes('coin') || foodTheme.includes('treasure') || foodTheme.includes('money') || foodTheme.includes('rich') || foodTheme.includes('bling') || foodTheme.includes('crown')) {
      color = '#ffd700'; this._matchedFood = 'gold';
    } else if (foodTheme.includes('planet') || foodTheme.includes('star') || foodTheme.includes('comet') || foodTheme.includes('meteor') || foodTheme.includes('moon') || foodTheme.includes('cosmic') || foodTheme.includes('nebula') || foodTheme.includes('galaxy')) {
      color = '#00bfff'; this._matchedFood = 'cosmic';
    } else if (foodTheme.includes('taco') || foodTheme.includes('pizza') || foodTheme.includes('burger') || foodTheme.includes('hotdog') || foodTheme.includes('fries') || foodTheme.includes('sandwich') || foodTheme.includes('nacho') || foodTheme.includes('kebab') || foodTheme.includes('wrap')) {
      color = '#ff9900'; this._matchedFood = 'junkfood';
    } else if (foodTheme.includes('gem') || foodTheme.includes('diamond') || foodTheme.includes('emerald') || foodTheme.includes('ruby') || foodTheme.includes('sapphire') || foodTheme.includes('crystal') || foodTheme.includes('jewel') || foodTheme.includes('amethyst') || foodTheme.includes('opal')) {
      color = '#00ffcc'; this._matchedFood = 'gem';
    } else if (foodTheme.includes('apple') || foodTheme.includes('fruit') || foodTheme.includes('cherry') || foodTheme.includes('grape') || foodTheme.includes('berry') || foodTheme.includes('strawberry') || foodTheme.includes('watermelon') || foodTheme.includes('peach') || foodTheme.includes('mango') || foodTheme.includes('banana') || foodTheme.includes('orange') || foodTheme.includes('lemon') || foodTheme.includes('pear')) {
      color = '#ff3355'; this._matchedFood = 'fruit';
    } else if (foodTheme.includes('candy') || foodTheme.includes('sweet') || foodTheme.includes('lollipop') || foodTheme.includes('gummy') || foodTheme.includes('chocolate') || foodTheme.includes('cookie') || foodTheme.includes('cake') || foodTheme.includes('donut') || foodTheme.includes('cupcake') || foodTheme.includes('sugar') || foodTheme.includes('marshmallow') || foodTheme.includes('ice cream')) {
      color = '#ff69b4'; this._matchedFood = 'candy';
    } else if (foodTheme.includes('heart') || foodTheme.includes('love') || foodTheme.includes('valentine') || foodTheme.includes('romance') || foodTheme.includes('kiss') || foodTheme.includes('rose')) {
      color = '#ff1493'; this._matchedFood = 'love';
    } else if (foodTheme.includes('mushroom') || foodTheme.includes('shroom') || foodTheme.includes('fungus') || foodTheme.includes('toadstool') || foodTheme.includes('power up') || foodTheme.includes('powerup') || foodTheme.includes('1up')) {
      color = '#ff4444'; this._matchedFood = 'mushroom';
    } else if (foodTheme.includes('egg') || foodTheme.includes('nest') || foodTheme.includes('bird') || foodTheme.includes('chick') || foodTheme.includes('chicken') || foodTheme.includes('duck') || foodTheme.includes('goose')) {
      color = '#fffacd'; this._matchedFood = 'egg';
    } else if (foodTheme.includes('fish') || foodTheme.includes('sushi') || foodTheme.includes('shrimp') || foodTheme.includes('crab') || foodTheme.includes('lobster') || foodTheme.includes('seafood') || foodTheme.includes('salmon') || foodTheme.includes('tuna')) {
      color = '#ff7766'; this._matchedFood = 'seafood';
    } else if (foodTheme.includes('poison') || foodTheme.includes('toxic') || foodTheme.includes('radioactive') || foodTheme.includes('acid') || foodTheme.includes('venom') || foodTheme.includes('potion') || foodTheme.includes('elixir')) {
      color = '#00ff00'; this._matchedFood = 'toxic';
    } else if (foodTheme.includes('fire') || foodTheme.includes('flame') || foodTheme.includes('hot') || foodTheme.includes('pepper') || foodTheme.includes('chili') || foodTheme.includes('spicy') || foodTheme.includes('jalapeno') || foodTheme.includes('habanero')) {
      color = '#ff2200'; this._matchedFood = 'spicy';
    } else if (foodTheme.includes('ghost') || foodTheme.includes('soul') || foodTheme.includes('spirit') || foodTheme.includes('phantom') || foodTheme.includes('wisp') || foodTheme.includes('orb')) {
      color = '#aabbff'; this._matchedFood = 'spirit';
    } else if (foodTheme.includes('cheese') || foodTheme.includes('nachos') || foodTheme.includes('cheddar') || foodTheme.includes('gouda') || foodTheme.includes('brie') || foodTheme.includes('fondue')) {
      color = '#ffcc00'; this._matchedFood = 'cheese';
    } else if (foodTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < foodTheme.length; i++) hash = ((hash << 5) - hash + foodTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      color = `hsl(${hue}, 70%, 55%)`; this._matchedFood = 'custom';
    }

    // Pulsing glow ring around food
    const glowR = r + 4 + Math.sin(t * 1.5) * 2;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba').replace('#', '#');
    const glowGrad = ctx.createRadialGradient(x, y, r, x, y, glowR);
    glowGrad.addColorStop(0, color + '44');
    glowGrad.addColorStop(1, color + '00');
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Emoji on food
    const foodEmoji = this._getFoodEmoji(foodTheme);
    if (foodEmoji) {
      ctx.font = `${Math.round(this.cellSize * 0.8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(foodEmoji, x, y + this.cellSize * 0.25);
      ctx.textAlign = 'left';
    }
  }

  _getSnakeEmoji() {
    const t = (this.theme.snakeIs || '').toLowerCase();
    if (t.includes('dragon') || t.includes('fire')) return { head: '🐉', body: '🔥' };
    if (t.includes('cat') || t.includes('kitten')) return { head: '🐱', body: '🐾' };
    if (t.includes('dog') || t.includes('puppy')) return { head: '🐶', body: '🐾' };
    if (t.includes('robot') || t.includes('mech')) return { head: '🤖', body: '⚙️' };
    if (t.includes('sushi') || t.includes('food')) return { head: '🍣', body: '🍙' };
    if (t.includes('pizza')) return { head: '🍕', body: '🧀' };
    if (t.includes('train') || t.includes('conga')) return { head: '🚂', body: '🚃' };
    if (t.includes('penguin')) return { head: '🐧', body: '🧊' };
    if (t.includes('worm') || t.includes('earth')) return { head: '🪱', body: '🟤' };
    if (t.includes('snake') || t.includes('cobra')) return { head: '🐍', body: '🟢' };
    if (t.includes('ghost') || t.includes('spooky')) return { head: '👻', body: '💀' };
    if (t.includes('alien') || t.includes('ufo')) return { head: '👽', body: '🛸' };
    if (t.includes('rainbow') || t.includes('unicorn')) return { head: '🦄', body: '🌈' };
    if (t.includes('shark') || t.includes('fish')) return { head: '🦈', body: '🐟' };
    if (t.includes('candy') || t.includes('sweet')) return { head: '🍬', body: '🍭' };
    if (t.includes('neon') || t.includes('electric')) return { head: '⚡', body: '💜' };
    if (t.includes('ice') || t.includes('frozen')) return { head: '🧊', body: '❄️' };
    if (t.includes('gold') || t.includes('treasure')) return { head: '👑', body: '💰' };
    if (t.includes('zombie') || t.includes('undead')) return { head: '🧟', body: '💀' };
    if (t.includes('monkey') || t.includes('ape')) return { head: '🐵', body: '🍌' };
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      const idx = Math.abs(hash) % pool.length;
      return { head: pool[idx], body: pool[(idx + 7) % pool.length] };
    }
    return null;
  }

  _getFoodEmoji(t) {
    if (t.includes('gold') || t.includes('coin')) return '🪙';
    if (t.includes('treasure') || t.includes('crown')) return '👑';
    if (t.includes('planet') || t.includes('earth')) return '🌍';
    if (t.includes('star')) return '⭐';
    if (t.includes('moon')) return '🌙';
    if (t.includes('taco')) return '🌮';
    if (t.includes('pizza')) return '🍕';
    if (t.includes('burger')) return '🍔';
    if (t.includes('hotdog')) return '🌭';
    if (t.includes('gem') || t.includes('diamond')) return '💎';
    if (t.includes('crystal')) return '🔮';
    if (t.includes('apple')) return '🍎';
    if (t.includes('cherry')) return '🍒';
    if (t.includes('strawberry')) return '🍓';
    if (t.includes('watermelon')) return '🍉';
    if (t.includes('banana')) return '🍌';
    if (t.includes('grape')) return '🍇';
    if (t.includes('candy') || t.includes('sweet')) return '🍬';
    if (t.includes('chocolate')) return '🍫';
    if (t.includes('cookie')) return '🍪';
    if (t.includes('donut')) return '🍩';
    if (t.includes('cake') || t.includes('cupcake')) return '🧁';
    if (t.includes('ice cream')) return '🍦';
    if (t.includes('mushroom')) return '🍄';
    if (t.includes('egg')) return '🥚';
    if (t.includes('fish') || t.includes('sushi')) return '🍣';
    if (t.includes('heart') || t.includes('love')) return '❤️';
    if (t.includes('fire') || t.includes('pepper') || t.includes('chili')) return '🌶️';
    if (t.includes('ghost') || t.includes('spirit')) return '👻';
    if (t.includes('cheese')) return '🧀';
    if (t.includes('poison') || t.includes('toxic')) return '☠️';
    if (t.includes('fruit')) return '🍎';
    if (t.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < t.length; i++) hash = ((hash << 5) - hash + t.charCodeAt(i)) | 0;
      return pool[Math.abs(hash) % pool.length];
    }
    return null;
  }

  _drawTrail() {
    const ctx = this.ctx;
    if (this.trailPoints.length > 100) this.trailPoints.splice(0, this.trailPoints.length - 100);
    const trailTheme = (this.theme.trailEffect || '').toLowerCase();
    let color = 'rgba(0, 255, 0, ';
    this._matchedTrail = null;
    if (trailTheme.includes('spark') || trailTheme.includes('fire') || trailTheme.includes('flame') || trailTheme.includes('ember') || trailTheme.includes('blaze') || trailTheme.includes('lava') || trailTheme.includes('magma') || trailTheme.includes('burn') || trailTheme.includes('torch') || trailTheme.includes('comet')) {
      color = 'rgba(255, 100, 0, '; this._matchedTrail = 'fire';
    } else if (trailTheme.includes('flower') || trailTheme.includes('petal') || trailTheme.includes('rose') || trailTheme.includes('cherry') || trailTheme.includes('blossom') || trailTheme.includes('bloom') || trailTheme.includes('sakura') || trailTheme.includes('daisy') || trailTheme.includes('tulip') || trailTheme.includes('garden') || trailTheme.includes('floral')) {
      color = 'rgba(255, 150, 200, '; this._matchedTrail = 'floral';
    } else if (trailTheme.includes('pixel') || trailTheme.includes('digital') || trailTheme.includes('cyber') || trailTheme.includes('neon') || trailTheme.includes('laser') || trailTheme.includes('electric') || trailTheme.includes('glitch') || trailTheme.includes('matrix') || trailTheme.includes('data') || trailTheme.includes('code') || trailTheme.includes('tron')) {
      color = 'rgba(0, 255, 255, '; this._matchedTrail = 'digital';
    } else if (trailTheme.includes('star') || trailTheme.includes('sparkle') || trailTheme.includes('glitter') || trailTheme.includes('shine') || trailTheme.includes('twinkle') || trailTheme.includes('shimmer') || trailTheme.includes('diamond') || trailTheme.includes('gem') || trailTheme.includes('gold') || trailTheme.includes('bling')) {
      color = 'rgba(255, 215, 0, '; this._matchedTrail = 'sparkle';
    } else if (trailTheme.includes('ice') || trailTheme.includes('frost') || trailTheme.includes('snow') || trailTheme.includes('frozen') || trailTheme.includes('cold') || trailTheme.includes('winter') || trailTheme.includes('crystal') || trailTheme.includes('glacier') || trailTheme.includes('arctic')) {
      color = 'rgba(135, 206, 250, '; this._matchedTrail = 'ice';
    } else if (trailTheme.includes('rainbow') || trailTheme.includes('pride') || trailTheme.includes('colorful') || trailTheme.includes('spectrum') || trailTheme.includes('unicorn') || trailTheme.includes('prism')) {
      color = 'rgba(255, 0, 255, '; this._matchedTrail = 'rainbow';
    } else if (trailTheme.includes('shadow') || trailTheme.includes('dark') || trailTheme.includes('smoke') || trailTheme.includes('fog') || trailTheme.includes('mist') || trailTheme.includes('ghost') || trailTheme.includes('phantom') || trailTheme.includes('ink') || trailTheme.includes('void') || trailTheme.includes('stealth')) {
      color = 'rgba(100, 100, 120, '; this._matchedTrail = 'shadow';
    } else if (trailTheme.includes('slime') || trailTheme.includes('goo') || trailTheme.includes('ooze') || trailTheme.includes('toxic') || trailTheme.includes('acid') || trailTheme.includes('poison') || trailTheme.includes('radioactive') || trailTheme.includes('venom') || trailTheme.includes('mutant')) {
      color = 'rgba(50, 255, 50, '; this._matchedTrail = 'toxic';
    } else if (trailTheme.includes('blood') || trailTheme.includes('red') || trailTheme.includes('crimson') || trailTheme.includes('scarlet') || trailTheme.includes('gore') || trailTheme.includes('heart') || trailTheme.includes('love') || trailTheme.includes('valentine')) {
      color = 'rgba(255, 50, 50, '; this._matchedTrail = 'blood';
    } else if (trailTheme.includes('bubble') || trailTheme.includes('water') || trailTheme.includes('wave') || trailTheme.includes('ocean') || trailTheme.includes('splash') || trailTheme.includes('rain') || trailTheme.includes('tear') || trailTheme.includes('drip') || trailTheme.includes('aqua')) {
      color = 'rgba(0, 150, 255, '; this._matchedTrail = 'water';
    } else if (trailTheme.includes('dust') || trailTheme.includes('sand') || trailTheme.includes('earth') || trailTheme.includes('dirt') || trailTheme.includes('mud') || trailTheme.includes('ground') || trailTheme.includes('rock') || trailTheme.includes('gravel')) {
      color = 'rgba(180, 140, 80, '; this._matchedTrail = 'dust';
    } else if (trailTheme.length > 0) {
      let hash = 0;
      for (let i = 0; i < trailTheme.length; i++) hash = ((hash << 5) - hash + trailTheme.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      color = `hsla(${hue}, 70%, 55%, `; this._matchedTrail = 'custom';
    }

    for (let i = this.trailPoints.length - 1; i >= 0; i--) {
      const tp = this.trailPoints[i];
      const matched = this._matchedTrail;

      // Themed decay rates
      if (matched === 'shadow') {
        tp.life -= 0.015; // linger longer
      } else {
        tp.life -= 0.03;
      }
      if (tp.life <= 0) {
        this.trailPoints.splice(i, 1);
        continue;
      }

      // Themed drift
      if (matched === 'fire') {
        tp.y -= 0.6; // upward drift
        tp.x += (Math.random() - 0.5) * 0.5;
      } else if (matched === 'floral') {
        tp.y -= 0.3; // gentle float up
        tp.x += Math.sin(performance.now() * 0.005 + i) * 0.3;
      } else if (matched === 'ice') {
        tp.y += 0.2; // slow downward drift
      } else if (matched === 'water') {
        tp.x += (Math.random() - 0.5) * 1.2; // spread outward
        tp.y += (Math.random() - 0.5) * 1.2;
      }

      const alpha = tp.life * 0.4;

      if (matched === 'fire') {
        // Warm circles drifting up
        const warmColors = ['rgba(255,100,0,', 'rgba(255,60,0,', 'rgba(255,200,50,'];
        ctx.fillStyle = warmColors[i % warmColors.length] + alpha + ')';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (matched === 'floral') {
        // Heart/circle shapes
        ctx.fillStyle = color + alpha + ')';
        if (i % 3 === 0) {
          // Simple heart shape
          const s = 3;
          ctx.beginPath();
          ctx.moveTo(tp.x, tp.y + s * 0.3);
          ctx.bezierCurveTo(tp.x - s, tp.y - s * 0.5, tp.x - s * 0.5, tp.y - s, tp.x, tp.y - s * 0.4);
          ctx.bezierCurveTo(tp.x + s * 0.5, tp.y - s, tp.x + s, tp.y - s * 0.5, tp.x, tp.y + s * 0.3);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (matched === 'digital') {
        // Square particles that blink
        const blinkAlpha = Math.random() > 0.3 ? alpha : alpha * 0.15;
        ctx.fillStyle = color + blinkAlpha + ')';
        ctx.fillRect(tp.x - 3, tp.y - 3, 6, 6);
      } else if (matched === 'ice') {
        // White/blue circles drifting down
        const iceColors = ['rgba(200,230,255,', 'rgba(135,206,250,', 'rgba(255,255,255,'];
        ctx.fillStyle = iceColors[i % iceColors.length] + alpha + ')';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (matched === 'rainbow') {
        // Cycle through rainbow colors
        const hue = ((performance.now() * 0.1 + i * 40) % 360);
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (matched === 'water') {
        // Blue circles spreading outward
        const waterColors = ['rgba(0,150,255,', 'rgba(0,100,200,', 'rgba(100,200,255,'];
        ctx.fillStyle = waterColors[i % waterColors.length] + alpha + ')';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 2 + (1 - tp.life) * 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (matched === 'shadow') {
        // Dark purple/black circles that linger
        const shadowColors = ['rgba(60,30,80,', 'rgba(30,10,40,', 'rgba(80,50,100,'];
        ctx.fillStyle = shadowColors[i % shadowColors.length] + alpha * 1.5 + ')';
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Default: simple square
        ctx.fillStyle = color + alpha + ')';
        ctx.fillRect(tp.x - 3, tp.y - 3, 6, 6);
      }
    }
  }

  _updateParticles() {
    const ctx = this.ctx;
    if (this.particles.length > 300) this.particles.splice(0, this.particles.length - 300);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= 0.025;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
