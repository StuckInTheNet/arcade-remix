/* ============================================
   TETRIS REMIX ENGINE
   ============================================ */

class TetrisGame {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.cols = 10;
    this.rows = 20;
    this.cellSize = Math.floor(Math.min(canvas.width / (this.cols + 6), canvas.height / this.rows));
    this.offsetX = Math.floor((canvas.width - this.cols * this.cellSize) / 2) - this.cellSize * 2;
    this.offsetY = Math.floor((canvas.height - this.rows * this.cellSize) / 2);
    this.grid = [];
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.piece = null;
    this.nextPiece = null;
    this.gameOver = false;
    this.paused = false;
    this.dropInterval = 800;
    this.lastDrop = 0;
    this.animFrame = null;
    this.clearAnimations = [];
    this.particles = [];
    this._onKey = null;
    this.colors = this._buildPalette();
  }

  _buildPalette() {
    const scheme = (this.theme.colorScheme || '').toLowerCase();
    this._matchedColorScheme = null;

    if (scheme.includes('synth') || scheme.includes('neon') || scheme.includes('retro') || scheme.includes('arcade') || scheme.includes('80s') || scheme.includes('vaporwave') || scheme.includes('glow')) {
      this._matchedColorScheme = 'neon';
      return ['#ff00ff', '#00ffff', '#ff6600', '#ffff00', '#00ff00', '#ff0066', '#6600ff'];
    } else if (scheme.includes('earth') || scheme.includes('forest') || scheme.includes('nature') || scheme.includes('tree') || scheme.includes('leaf') || scheme.includes('plant') || scheme.includes('garden') || scheme.includes('moss') || scheme.includes('jungle') || scheme.includes('swamp')) {
      this._matchedColorScheme = 'earth';
      return ['#2d5016', '#8B4513', '#556B2F', '#6B8E23', '#228B22', '#8FBC8F', '#A0522D'];
    } else if (scheme.includes('candy') || scheme.includes('sweet') || scheme.includes('pastel') || scheme.includes('bubblegum') || scheme.includes('cotton') || scheme.includes('cake') || scheme.includes('cupcake') || scheme.includes('donut') || scheme.includes('unicorn') || scheme.includes('fairy') || scheme.includes('princess') || scheme.includes('kawaii')) {
      this._matchedColorScheme = 'candy';
      return ['#FF69B4', '#DDA0DD', '#87CEEB', '#98FB98', '#FFB347', '#FF6B6B', '#C9B1FF'];
    } else if (scheme.includes('fire') || scheme.includes('lava') || scheme.includes('hot') || scheme.includes('flame') || scheme.includes('burn') || scheme.includes('inferno') || scheme.includes('magma') || scheme.includes('phoenix') || scheme.includes('dragon') || scheme.includes('hell') || scheme.includes('ember') || scheme.includes('volcano')) {
      this._matchedColorScheme = 'fire';
      return ['#ff0000', '#ff4400', '#ff7700', '#ffaa00', '#ffdd00', '#cc0000', '#ff2200'];
    } else if (scheme.includes('ice') || scheme.includes('frozen') || scheme.includes('winter') || scheme.includes('snow') || scheme.includes('arctic') || scheme.includes('glacier') || scheme.includes('frost') || scheme.includes('cold') || scheme.includes('blizzard') || scheme.includes('polar') || scheme.includes('tundra')) {
      this._matchedColorScheme = 'ice';
      return ['#00CED1', '#4169E1', '#87CEEB', '#B0E0E6', '#E0FFFF', '#6495ED', '#00BFFF'];
    } else if (scheme.includes('ocean') || scheme.includes('sea') || scheme.includes('aqua') || scheme.includes('water') || scheme.includes('marine') || scheme.includes('coral') || scheme.includes('beach') || scheme.includes('tropical') || scheme.includes('fish') || scheme.includes('whale') || scheme.includes('dolphin') || scheme.includes('shark')) {
      this._matchedColorScheme = 'ocean';
      return ['#006994', '#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#00BFFF', '#7FFFD4'];
    } else if (scheme.includes('sunset') || scheme.includes('sunrise') || scheme.includes('dusk') || scheme.includes('twilight') || scheme.includes('dawn') || scheme.includes('horizon') || scheme.includes('evening')) {
      this._matchedColorScheme = 'sunset';
      return ['#FF6B35', '#FF4500', '#FF8C69', '#FFD700', '#FF69B4', '#C71585', '#4B0082'];
    } else if (scheme.includes('royal') || scheme.includes('purple') || scheme.includes('king') || scheme.includes('queen') || scheme.includes('crown') || scheme.includes('regal') || scheme.includes('majestic') || scheme.includes('noble') || scheme.includes('amethyst') || scheme.includes('violet')) {
      this._matchedColorScheme = 'royal';
      return ['#6A0DAD', '#9B30FF', '#8B008B', '#BA55D3', '#DDA0DD', '#FFD700', '#4B0082'];
    } else if (scheme.includes('blood') || scheme.includes('vampire') || scheme.includes('goth') || scheme.includes('dark') || scheme.includes('shadow') || scheme.includes('death') || scheme.includes('evil') || scheme.includes('demon') || scheme.includes('skull') || scheme.includes('horror')) {
      this._matchedColorScheme = 'gothic';
      return ['#8B0000', '#2F0000', '#555555', '#333333', '#990000', '#CC0000', '#1a1a1a'];
    } else if (scheme.includes('gold') || scheme.includes('treasure') || scheme.includes('rich') || scheme.includes('luxury') || scheme.includes('money') || scheme.includes('coin') || scheme.includes('bling') || scheme.includes('jewel') || scheme.includes('diamond') || scheme.includes('gem')) {
      this._matchedColorScheme = 'gold';
      return ['#FFD700', '#DAA520', '#B8860B', '#FFA500', '#FF8C00', '#CD853F', '#F5DEB3'];
    } else if (scheme.includes('rainbow') || scheme.includes('pride') || scheme.includes('colorful') || scheme.includes('spectrum') || scheme.includes('skittles') || scheme.includes('crayon')) {
      this._matchedColorScheme = 'rainbow';
      return ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FF1493'];
    } else if (scheme.includes('rust') || scheme.includes('copper') || scheme.includes('bronze') || scheme.includes('steampunk') || scheme.includes('vintage') || scheme.includes('antique') || scheme.includes('old')) {
      this._matchedColorScheme = 'steampunk';
      return ['#B87333', '#CD7F32', '#8B4513', '#A0522D', '#DAA520', '#D2691E', '#6B3A2A'];
    } else if (scheme.includes('cyber') || scheme.includes('hack') || scheme.includes('matrix') || scheme.includes('code') || scheme.includes('terminal') || scheme.includes('computer') || scheme.includes('binary') || scheme.includes('digital')) {
      this._matchedColorScheme = 'matrix';
      return ['#00FF00', '#00CC00', '#009900', '#33FF33', '#66FF66', '#00FF66', '#00AA00'];
    } else if (scheme.includes('space') || scheme.includes('galaxy') || scheme.includes('cosmic') || scheme.includes('nebula') || scheme.includes('star') || scheme.includes('astro') || scheme.includes('planet') || scheme.includes('alien') || scheme.includes('ufo') || scheme.includes('meteor')) {
      this._matchedColorScheme = 'cosmic';
      return ['#4B0082', '#0000CD', '#00CED1', '#FF69B4', '#FFD700', '#7B68EE', '#00FFFF'];
    } else if (scheme.includes('cherry') || scheme.includes('strawberry') || scheme.includes('rose') || scheme.includes('pink') || scheme.includes('blush') || scheme.includes('love') || scheme.includes('heart') || scheme.includes('valentine')) {
      this._matchedColorScheme = 'rose';
      return ['#FF1493', '#FF69B4', '#FFB6C1', '#FF007F', '#DB7093', '#C71585', '#FFC0CB'];
    } else if (scheme.includes('military') || scheme.includes('army') || scheme.includes('camo') || scheme.includes('soldier') || scheme.includes('tank') || scheme.includes('war') || scheme.includes('combat')) {
      this._matchedColorScheme = 'military';
      return ['#556B2F', '#6B8E23', '#8B8B00', '#4B5320', '#3B3B00', '#808000', '#2E4600'];
    } else {
      return ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'];
    }
  }

  // Standard tetrominos
  static SHAPES = [
    [[1,1,1,1]],                         // I
    [[1,1],[1,1]],                        // O
    [[0,1,0],[1,1,1]],                    // T
    [[1,0,0],[1,1,1]],                    // L
    [[0,0,1],[1,1,1]],                    // J
    [[0,1,1],[1,1,0]],                    // S
    [[1,1,0],[0,1,1]],                    // Z
  ];

  start() {
    // Init grid
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.gameOver = false;
    this.dropInterval = 800;
    this.particles = [];
    this.clearAnimations = [];

    this.nextPiece = this._randomPiece();
    this._spawnPiece();

    this._onKey = (e) => this._handleKey(e);
    document.addEventListener('keydown', this._onKey);

    this.lastDrop = performance.now();
    this._loop();
  }

  destroy() {
    this.gameOver = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
  }

  _randomPiece() {
    const idx = Math.floor(Math.random() * TetrisGame.SHAPES.length);
    return {
      shape: TetrisGame.SHAPES[idx].map(r => [...r]),
      color: this.colors[idx],
      x: Math.floor(this.cols / 2) - 1,
      y: 0,
    };
  }

  _spawnPiece() {
    this.piece = this.nextPiece;
    this.piece.x = Math.floor(this.cols / 2) - Math.floor(this.piece.shape[0].length / 2);
    this.piece.y = 0;
    this.nextPiece = this._randomPiece();

    if (this._collides(this.piece.shape, this.piece.x, this.piece.y)) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
    }
  }

  _collides(shape, px, py) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = px + c;
        const ny = py + r;
        if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
        if (ny >= 0 && this.grid[ny][nx]) return true;
      }
    }
    return false;
  }

  _lock() {
    const shape = this.piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const ny = this.piece.y + r;
        const nx = this.piece.x + c;
        if (ny >= 0 && ny < this.rows && nx >= 0 && nx < this.cols) {
          this.grid[ny][nx] = this.piece.color;
        }
      }
    }
    this._checkLines();
    this._spawnPiece();
  }

  _checkLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(c => c !== 0)) {
        // Spawn particles for the cleared line
        this._spawnLineParticles(r);
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(0));
        cleared++;
        r++; // recheck same row
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * this.level;
      this.score += points;
      this.linesCleared += cleared;
      this.level = Math.floor(this.linesCleared / 10) + 1;
      this.dropInterval = Math.max(100, 800 - (this.level - 1) * 70);
      this.cb.onScore(this.score);
    }
  }

  _spawnLineParticles(row) {
    const fx = (this.theme.clearEffect || '').toLowerCase();
    const cs = this.cellSize;
    const baseY = this.offsetY + row * cs + cs / 2;

    for (let c = 0; c < this.cols; c++) {
      const color = this.grid[row][c] || '#fff';
      const baseX = this.offsetX + c * this.cellSize + this.cellSize / 2;

      if (fx.includes('flame') || fx.includes('fire') || fx.includes('burn') || fx.includes('inferno') || fx.includes('ignite') || fx.includes('blaze')) {
        // Flames shooting upward — big and visible
        for (let i = 0; i < 8; i++) {
          this.particles.push({
            x: baseX + (Math.random() - 0.5) * this.cellSize * 1.5,
            y: baseY,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 12 + 4),
            life: 1.4,
            color: ['#ffff00', '#ff8800', '#ff4400', '#ff0000', '#ffcc00'][i % 5],
            size: Math.random() * this.cellSize * 0.4 + this.cellSize * 0.2,
            type: 'circle',
          });
        }
      }
      else if (fx.includes('explode') || fx.includes('blast') || fx.includes('boom') || fx.includes('detonate') || fx.includes('bomb')) {
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 5 + Math.random() * 10;
          this.particles.push({
            x: baseX, y: baseY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: ['#fff', '#ffff00', '#ff8800', '#ff0000', '#ff4400'][i % 5],
            size: Math.random() * cs * 0.3 + cs * 0.15,
          });
        }
      }
      else if (fx.includes('shatter') || fx.includes('diamond') || fx.includes('crystal') || fx.includes('glass') || fx.includes('smash')) {
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: baseX + (Math.random() - 0.5) * cs,
            y: baseY + (Math.random() - 0.5) * cs,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 12 - 3,
            life: 1.1,
            color: color,
            size: Math.random() * cs * 0.25 + cs * 0.1,
            type: 'shard',
          });
        }
      }
      else if (fx.includes('melt') || fx.includes('drip') || fx.includes('dissolve') || fx.includes('goo') || fx.includes('ooze') || fx.includes('liquid')) {
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: baseX + (Math.random() - 0.5) * cs,
            y: baseY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 5 + 1,
            life: 1.6,
            color: color,
            size: Math.random() * cs * 0.3 + cs * 0.15,
            type: 'drip',
          });
        }
      }
      else if (fx.includes('confetti') || fx.includes('party') || fx.includes('celebrate') || fx.includes('sparkle') || fx.includes('glitter')) {
        const colors = ['#ff0', '#f0f', '#0ff', '#0f0', '#f80', '#80f', '#f08'];
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: baseX, y: baseY,
            vx: (Math.random() - 0.5) * 10,
            vy: -(Math.random() * 8 + 2),
            life: 1.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * cs * 0.25 + cs * 0.1,
          });
        }
      }
      else if (fx.includes('butterfly') || fx.includes('flutter') || fx.includes('petal') || fx.includes('flower') || fx.includes('blossom')) {
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: baseX + (Math.random() - 0.5) * cs * 2,
            y: baseY,
            vx: (Math.random() - 0.5) * 4,
            vy: -(Math.random() * 3 + 1),
            life: 1.6,
            color: ['#ff69b4', '#ffb6c1', '#dda0dd', '#ff1493', '#fff'][i % 5],
            size: Math.random() * cs * 0.3 + cs * 0.15,
            type: 'circle',
          });
        }
      }
      else if (fx.includes('lightning') || fx.includes('electric') || fx.includes('shock') || fx.includes('zap') || fx.includes('thunder')) {
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: baseX, y: baseY,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            life: 0.5,
            color: ['#ffffff', '#aaaaff', '#8888ff', '#ffff00'][i % 4],
            size: Math.random() * cs * 0.15 + cs * 0.05,
            type: 'circle',
          });
        }
      }
      else if (fx.includes('snow') || fx.includes('frost') || fx.includes('freeze') || fx.includes('ice') || fx.includes('frozen')) {
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: baseX + (Math.random() - 0.5) * cs,
            y: baseY,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 2 + 0.5),
            life: 1.6,
            color: ['#aaddff', '#ffffff', '#cceeff', '#88bbff'][i % 4],
            size: Math.random() * cs * 0.25 + cs * 0.1,
            type: 'circle',
          });
        }
      }
      else if (fx.includes('star') || fx.includes('cosmic') || fx.includes('galaxy') || fx.includes('nova') || fx.includes('supernova')) {
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
          this.particles.push({
            x: baseX, y: baseY,
            vx: Math.cos(angle) * (5 + Math.random() * 5),
            vy: Math.sin(angle) * (5 + Math.random() * 5),
            life: 1.1,
            color: ['#ffd700', '#ffffff', '#00bfff', '#ff69b4'][i % 4],
            size: Math.random() * cs * 0.25 + cs * 0.1,
            type: 'circle',
          });
        }
      }
      else if (fx.includes('smoke') || fx.includes('poof') || fx.includes('vanish') || fx.includes('disappear') || fx.includes('fade')) {
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: baseX + (Math.random() - 0.5) * cs,
            y: baseY,
            vx: (Math.random() - 0.5) * 2,
            vy: -(Math.random() * 2 + 0.5),
            life: 1.6,
            color: 'rgba(180,180,200,0.6)',
            size: Math.random() * cs * 0.4 + cs * 0.2,
            type: 'circle',
          });
        }
      }
      else {
        // Default burst
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x: baseX, y: baseY,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            life: 1,
            color,
            size: Math.random() * 4 + 2,
          });
        }
      }
    }
  }

  _rotate(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = shape[r][c];
      }
    }
    return rotated;
  }

  _handleKey(e) {
    if (this.gameOver) return;
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      if (!this._collides(this.piece.shape, this.piece.x - 1, this.piece.y)) this.piece.x--;
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (!this._collides(this.piece.shape, this.piece.x + 1, this.piece.y)) this.piece.x++;
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      if (!this._collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
        this.piece.y++;
        this.score += 1;
        this.cb.onScore(this.score);
      }
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      const rotated = this._rotate(this.piece.shape);
      if (!this._collides(rotated, this.piece.x, this.piece.y)) {
        this.piece.shape = rotated;
      }
    } else if (key === ' ') {
      while (!this._collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
        this.piece.y++;
        this.score += 2;
      }
      this.cb.onScore(this.score);
      this._lock();
    }
  }

  _loop() {
    if (this.gameOver) return;
    const now = performance.now();

    if (now - this.lastDrop > this.dropInterval) {
      if (!this._collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
        this.piece.y++;
      } else {
        this._lock();
      }
      this.lastDrop = now;
    }

    this._draw();
    this.animFrame = requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { ctx, canvas, cellSize, offsetX, offsetY } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    this._drawBackground();

    // Grid border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX - 1, offsetY - 1, this.cols * cellSize + 2, this.rows * cellSize + 2);

    // Grid cells
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(offsetX, offsetY, this.cols * cellSize, this.rows * cellSize);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + r * cellSize);
      ctx.lineTo(offsetX + this.cols * cellSize, offsetY + r * cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + c * cellSize, offsetY);
      ctx.lineTo(offsetX + c * cellSize, offsetY + this.rows * cellSize);
      ctx.stroke();
    }

    // Locked blocks
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          this._drawBlock(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, this.grid[r][c]);
        }
      }
    }

    // Ghost piece
    if (this.piece) {
      let ghostY = this.piece.y;
      while (!this._collides(this.piece.shape, this.piece.x, ghostY + 1)) ghostY++;
      if (ghostY !== this.piece.y) {
        ctx.globalAlpha = 0.3;
        for (let r = 0; r < this.piece.shape.length; r++) {
          for (let c = 0; c < this.piece.shape[r].length; c++) {
            if (this.piece.shape[r][c]) {
              this._drawBlock(
                offsetX + (this.piece.x + c) * cellSize,
                offsetY + (ghostY + r) * cellSize,
                cellSize, this.piece.color, true
              );
            }
          }
        }
        ctx.globalAlpha = 1;
      }

      // Active piece
      for (let r = 0; r < this.piece.shape.length; r++) {
        for (let c = 0; c < this.piece.shape[r].length; c++) {
          if (this.piece.shape[r][c]) {
            this._drawBlock(
              offsetX + (this.piece.x + c) * cellSize,
              offsetY + (this.piece.y + r) * cellSize,
              cellSize, this.piece.color
            );
          }
        }
      }
    }

    // Next piece preview
    this._drawNextPiece();

    // Theme label
    this._drawThemeLabel();

    // Particles
    this._updateParticles();
  }

  _drawBlock(x, y, size, color, isGhost) {
    const ctx = this.ctx;
    const mat = (this.theme.blockMaterial || '').toLowerCase();
    const s = size;
    const m = 1; // margin

    // Ghost piece: just a dashed outline
    if (isGhost) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 3);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    // Material-specific rendering — each overrides colors AND shape
    if (mat.includes('slime') || mat.includes('goo') || mat.includes('ooze') || mat.includes('blob') || mat.includes('gummy') || mat.includes('jelly')) {
      this._matchedBlockMaterial = 'slime';
      // Bright green gooey blobs
      const sc = '#44ff44';
      ctx.fillStyle = sc;
      ctx.shadowColor = sc;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + s/2, y + s/2, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      // Drip bumps
      ctx.beginPath();
      ctx.arc(x + s * 0.3, y + s * 0.8, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.7, y + s * 0.85, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(x + s * 0.35, y + s * 0.35, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (mat.includes('lava') || mat.includes('magma') || mat.includes('molten')) {
      this._matchedBlockMaterial = 'lava';
      const t = performance.now() * 0.002 + x * 0.1;
      const r = Math.round(200 + Math.sin(t) * 55);
      ctx.fillStyle = `rgb(${r}, ${Math.round(50 + Math.sin(t*1.3) * 30)}, 0)`;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Hot cracks
      ctx.strokeStyle = `rgba(255, ${150 + Math.sin(t*2)*50}, 0, 0.7)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + s*0.2, y + s*0.3);
      ctx.lineTo(x + s*0.5, y + s*0.5);
      ctx.lineTo(x + s*0.8, y + s*0.4);
      ctx.stroke();
    }
    else if (mat.includes('glass') || mat.includes('crystal') || mat.includes('ice') || mat.includes('diamond') || mat.includes('gem') || mat.includes('frozen')) {
      this._matchedBlockMaterial = 'glass';
      // Transparent blue with bright reflections
      ctx.fillStyle = 'rgba(100, 200, 255, 0.35)';
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Big shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + s * 0.5, y + 3);
      ctx.lineTo(x + 3, y + s * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    else if (mat.includes('metal') || mat.includes('steel') || mat.includes('iron') || mat.includes('chrome') || mat.includes('silver') || mat.includes('robot') || mat.includes('armor')) {
      this._matchedBlockMaterial = 'metal';
      const mg = ctx.createLinearGradient(x, y, x, y + s);
      mg.addColorStop(0, '#cccccc');
      mg.addColorStop(0.3, '#888888');
      mg.addColorStop(0.5, '#aaaaaa');
      mg.addColorStop(1, '#666666');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 2);
      ctx.fill();
      // Rivet dots
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(x + 4, y + 4, 2, 0, Math.PI * 2);
      ctx.arc(x + s - 4, y + 4, 2, 0, Math.PI * 2);
      ctx.arc(x + 4, y + s - 4, 2, 0, Math.PI * 2);
      ctx.arc(x + s - 4, y + s - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (mat.includes('gold') || mat.includes('treasure') || mat.includes('bling') || mat.includes('rich')) {
      this._matchedBlockMaterial = 'gold';
      const gg = ctx.createLinearGradient(x, y, x + s, y + s);
      gg.addColorStop(0, '#ffd700');
      gg.addColorStop(0.3, '#ffaa00');
      gg.addColorStop(0.5, '#ffe066');
      gg.addColorStop(1, '#cc8800');
      ctx.fillStyle = gg;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(x + s * 0.3, y + s * 0.3, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (mat.includes('wood') || mat.includes('log') || mat.includes('plank') || mat.includes('timber')) {
      this._matchedBlockMaterial = 'wood';
      ctx.fillStyle = '#8B5A2B';
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60, 30, 0, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 2 + i * (s / 5));
        ctx.bezierCurveTo(x + s*0.3, y + i*(s/5) + s*0.05, x + s*0.7, y + i*(s/5) - s*0.03, x + s - 2, y + 2 + i*(s/5));
        ctx.stroke();
      }
    }
    else if (mat.includes('neon') || mat.includes('glow') || mat.includes('laser') || mat.includes('electric') || mat.includes('plasma')) {
      this._matchedBlockMaterial = 'neon';
      // Hollow glowing outline
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 3);
      ctx.fill();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, s - 6, s - 6, 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    else if (mat.includes('candy') || mat.includes('sweet') || mat.includes('sugar') || mat.includes('lollipop') || mat.includes('bubblegum')) {
      this._matchedBlockMaterial = 'candy';
      const cc = ['#ff69b4', '#ff1493', '#ff69b4', '#dda0dd', '#ffb6c1', '#ff007f', '#c71585'];
      ctx.fillStyle = cc[Math.floor((x + y) / s) % cc.length];
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, s * 0.35);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(x + s * 0.35, y + s * 0.35, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (mat.includes('stone') || mat.includes('rock') || mat.includes('brick') || mat.includes('concrete')) {
      this._matchedBlockMaterial = 'stone';
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 1);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + m, y + m, s - m*2, s - m*2);
      ctx.fillStyle = 'rgba(100,100,100,0.3)';
      ctx.fillRect(x + 3, y + 3, s * 0.4, s * 0.4);
    }
    else if (mat.includes('fire') || mat.includes('flame') || mat.includes('burn') || mat.includes('inferno')) {
      this._matchedBlockMaterial = 'fire';
      const t = performance.now() * 0.003 + y * 0.05;
      ctx.fillStyle = `hsl(${15 + Math.sin(t) * 15}, 100%, ${50 + Math.sin(t*1.5) * 10}%)`;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    else if (mat.includes('cloud') || mat.includes('cotton') || mat.includes('fluffy') || mat.includes('pillow') || mat.includes('soft')) {
      this._matchedBlockMaterial = 'cloud';
      ctx.fillStyle = 'rgba(220, 230, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x + s*0.3, y + s*0.5, s*0.3, 0, Math.PI * 2);
      ctx.arc(x + s*0.55, y + s*0.35, s*0.28, 0, Math.PI * 2);
      ctx.arc(x + s*0.7, y + s*0.55, s*0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (mat.includes('chocolate') || mat.includes('cookie') || mat.includes('food') || mat.includes('cheese') || mat.includes('cake')) {
      this._matchedBlockMaterial = 'food';
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 4);
      ctx.fill();
      // Chip dots
      ctx.fillStyle = '#5a2d0c';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + s * (0.25 + i * 0.25), y + s * (0.3 + (i % 2) * 0.3), s * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 2, y + 2, s - 4, s * 0.2);
    }
    else {
      // Default: use palette color with modern bevel
      this._matchedBlockMaterial = null;
      const grad = ctx.createLinearGradient(x, y, x, y + s);
      grad.addColorStop(0, color);
      grad.addColorStop(1, this._darkenColor(color, 0.3));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + m, y + m, s - m*2, s - m*2, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 2, y + 2, s - 4, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 2, y + s - 4, s - 4, 2);
    }
  }

  _drawBackground() {
    const ctx = this.ctx;
    const theme = (this.theme.worldTheme || '').toLowerCase();

    this._matchedWorldTheme = null;

    if (theme.includes('volcan') || theme.includes('lava') || theme.includes('fire') || theme.includes('hell') || theme.includes('inferno') || theme.includes('magma') || theme.includes('flame') || theme.includes('burn') || theme.includes('ember') || theme.includes('phoenix') || theme.includes('dragon')) {
      this._matchedWorldTheme = 'volcanic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200000');
      grad.addColorStop(0.5, '#400800');
      grad.addColorStop(1, '#ff3300');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const t = performance.now() * 0.001;
      ctx.fillStyle = `rgba(255, ${50 + Math.sin(t) * 30}, 0, ${0.05 + Math.sin(t * 0.5) * 0.03})`;
      ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);
    } else if (theme.includes('space') || theme.includes('outer') || theme.includes('galaxy') || theme.includes('star') || theme.includes('cosmic') || theme.includes('nebula') || theme.includes('planet') || theme.includes('astro') || theme.includes('alien') || theme.includes('mars') || theme.includes('moon') || theme.includes('rocket') || theme.includes('orbit') || theme.includes('meteor') || theme.includes('ufo')) {
      this._matchedWorldTheme = 'space';
      const spaceGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.7);
      spaceGrad.addColorStop(0, '#0a0a25');
      spaceGrad.addColorStop(1, '#020210');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const seed = 42;
      for (let i = 0; i < 120; i++) {
        const sx = ((seed * (i + 1) * 7919) % this.canvas.width);
        const sy = ((seed * (i + 1) * 6271) % this.canvas.height);
        const bright = 0.2 + (i % 5) * 0.15;
        const sz = 1 + (i % 3);
        ctx.fillStyle = `rgba(255,255,255,${bright})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme.includes('underwater') || theme.includes('ocean') || theme.includes('reef') || theme.includes('sea') || theme.includes('aqua') || theme.includes('marine') || theme.includes('deep') || theme.includes('fish') || theme.includes('coral') || theme.includes('whale') || theme.includes('dolphin') || theme.includes('shark') || theme.includes('trench') || theme.includes('atlantis') || theme.includes('mermaid')) {
      this._matchedWorldTheme = 'underwater';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#002244');
      grad.addColorStop(0.5, '#003366');
      grad.addColorStop(1, '#004488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('neon') || theme.includes('cyber') || theme.includes('synth') || theme.includes('tron') || theme.includes('hack') || theme.includes('matrix') || theme.includes('digital') || theme.includes('virtual') || theme.includes('vaporwave') || theme.includes('glitch') || theme.includes('arcade') || theme.includes('retrowave')) {
      this._matchedWorldTheme = 'cyberpunk';
      ctx.fillStyle = '#0a0020';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(0, this.canvas.height - i * 30);
        ctx.lineTo(this.canvas.width, this.canvas.height - i * 30);
        ctx.stroke();
      }
    } else if (theme.includes('forest') || theme.includes('jungle') || theme.includes('tree') || theme.includes('wood') || theme.includes('nature') || theme.includes('garden') || theme.includes('meadow') || theme.includes('grass') || theme.includes('swamp') || theme.includes('bog') || theme.includes('moss') || theme.includes('wild')) {
      this._matchedWorldTheme = 'forest';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#0a2000');
      grad.addColorStop(1, '#153500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('desert') || theme.includes('sand') || theme.includes('egypt') || theme.includes('pyramid') || theme.includes('dune') || theme.includes('sahara') || theme.includes('cactus') || theme.includes('oasis') || theme.includes('camel') || theme.includes('pharaoh') || theme.includes('sphinx')) {
      this._matchedWorldTheme = 'desert';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#2a1800');
      grad.addColorStop(1, '#3a2500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('snow') || theme.includes('arctic') || theme.includes('frozen') || theme.includes('winter') || theme.includes('ice') || theme.includes('glacier') || theme.includes('blizzard') || theme.includes('tundra') || theme.includes('polar') || theme.includes('christmas') || theme.includes('north pole')) {
      this._matchedWorldTheme = 'arctic';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102030');
      grad.addColorStop(1, '#1a3040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('haunt') || theme.includes('grave') || theme.includes('spooky') || theme.includes('ghost') || theme.includes('zombie') || theme.includes('halloween') || theme.includes('horror') || theme.includes('creepy') || theme.includes('witch') || theme.includes('skull') || theme.includes('vampire') || theme.includes('cemetery') || theme.includes('monster')) {
      this._matchedWorldTheme = 'haunted';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#10002a');
      grad.addColorStop(1, '#200a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('sky') || theme.includes('cloud') || theme.includes('heaven') || theme.includes('angel') || theme.includes('paradise') || theme.includes('air') || theme.includes('wind') || theme.includes('flying') || theme.includes('bird') || theme.includes('eagle')) {
      this._matchedWorldTheme = 'sky';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#102040');
      grad.addColorStop(1, '#1a3050');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('candy') || theme.includes('sweet') || theme.includes('cake') || theme.includes('sugar') || theme.includes('chocolate') || theme.includes('donut') || theme.includes('cookie') || theme.includes('cupcake') || theme.includes('ice cream') || theme.includes('waffle')) {
      this._matchedWorldTheme = 'candyland';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200030');
      grad.addColorStop(1, '#301040');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else if (theme.includes('city') || theme.includes('urban') || theme.includes('tokyo') || theme.includes('new york') || theme.includes('street') || theme.includes('building') || theme.includes('skyscraper') || theme.includes('downtown') || theme.includes('metropol')) {
      this._matchedWorldTheme = 'city';
      ctx.fillStyle = '#080815';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#151525';
      for (let i = 0; i < 20; i++) {
        const bw = 20 + (i * 17 % 30);
        const bh = 60 + (i * 31 % 120);
        ctx.beginPath();
        ctx.roundRect(i * 30, this.canvas.height - bh, bw, bh, 2);
        ctx.fill();
      }
      // Window lights
      ctx.fillStyle = 'rgba(255, 255, 150, 0.3)';
      for (let i = 0; i < 20; i++) {
        const bw = 20 + (i * 17 % 30);
        const bh = 60 + (i * 31 % 120);
        const bx = i * 30;
        const by = this.canvas.height - bh;
        for (let wy = by + 8; wy < this.canvas.height - 8; wy += 12) {
          for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) {
            if ((wx * 31 + wy * 17) % 5 > 1) {
              ctx.fillRect(wx, wy, 3, 3);
            }
          }
        }
      }
    } else if (theme.includes('sunset') || theme.includes('sunrise') || theme.includes('dusk') || theme.includes('twilight') || theme.includes('dawn') || theme.includes('evening') || theme.includes('golden hour')) {
      this._matchedWorldTheme = 'sunset';
      const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, '#200830');
      grad.addColorStop(0.5, '#351015');
      grad.addColorStop(1, '#2a1800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      const defGrad = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 0, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.6);
      defGrad.addColorStop(0, '#12122a');
      defGrad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = defGrad;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Vignette for depth
    const vig = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3, this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _drawNextPiece() {
    if (!this.nextPiece) return;
    const ctx = this.ctx;
    const previewX = this.offsetX + this.cols * this.cellSize + 20;
    const previewY = this.offsetY + 20;

    ctx.fillStyle = '#0f0';
    ctx.font = '10px Inter';
    ctx.fillText('NEXT', previewX, previewY);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(previewX, previewY + 8, this.cellSize * 4, this.cellSize * 4);

    const shape = this.nextPiece.shape;
    const ox = previewX + (4 - shape[0].length) * this.cellSize / 2;
    const oy = previewY + 12 + (4 - shape.length) * this.cellSize / 2;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this._drawBlock(ox + c * this.cellSize, oy + r * this.cellSize, this.cellSize, this.nextPiece.color);
        }
      }
    }

    // Level + Lines
    ctx.fillStyle = '#0f0';
    ctx.font = '10px Inter';
    ctx.fillText(`LVL ${this.level}`, previewX, previewY + this.cellSize * 5 + 10);
    ctx.fillText(`${this.linesCleared} LINES`, previewX, previewY + this.cellSize * 5 + 30);
  }

  _drawThemeLabel() {
    const ctx = this.ctx;
    const material = this.theme.blockMaterial || 'blocks';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText(`Blocks: ${material}`, this.offsetX, this.canvas.height - 44);
    ctx.fillText(`World: ${this.theme.worldTheme || 'classic'}`, this.offsetX, this.canvas.height - 28);

    const matched = [
      this._matchedColorScheme ? `colors:${this._matchedColorScheme}` : null,
      this._matchedBlockMaterial ? `material:${this._matchedBlockMaterial}` : null,
      this._matchedWorldTheme ? `world:${this._matchedWorldTheme}` : null,
    ].filter(Boolean);
    if (matched.length > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`matched: ${matched.join(' | ')}`, this.offsetX, this.canvas.height - 12);
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

  _updateParticles() {
    const ctx = this.ctx;
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'drip') {
        p.vy += 0.06;
        p.vx *= 0.98;
        p.life -= 0.012;
      } else {
        p.vy += 0.15;
        p.life -= 0.02;
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'drip') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size / 3, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.vx * 0.4);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}
