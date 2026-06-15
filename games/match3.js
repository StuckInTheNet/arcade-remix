/* ============================================
   MATCH 3 REMIX ENGINE
   ============================================ */

class Match3Game {
  constructor(canvas, ctx, theme, callbacks) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.cb = callbacks;
    this.gameOver = false;
    this.animFrame = null;
    this._onClick = null;
    this._onKey = null;
    this.score = 0;
    this.timeLimit = 90;
    this.timeLeft = this.timeLimit;
    this.startTime = 0;
    this.particles = [];
    this.selected = null; // {row, col}
    this.animating = false;
    this.pulsePhase = 0;

    // Grid sizing based on canvas
    this.cols = canvas.width < 400 ? 7 : 8;
    this.rows = canvas.height < 400 ? 8 : 9;
    this.grid = [];
    this.numTypes = 7;
    this.cellSize = 0;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;

    // Fall animation state
    this.falling = false;
    this.fallSpeed = 12; // pixels per frame

    // Swap animation state
    this.swapping = false;
    this.swapFrom = null;
    this.swapTo = null;
    this.swapProgress = 0;
    this.swapRevert = false;

    // Gem colors for non-emoji mode
    this.gemColors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
  }

  start() {
    this.score = 0;
    this.gameOver = false;
    this.particles = [];
    this.selected = null;
    this.animating = false;
    this.swapping = false;
    this.falling = false;
    this.pulsePhase = 0;
    this.startTime = performance.now();
    this.timeLeft = this.timeLimit;

    this._calcGrid();
    this._buildGrid();
    this._removeInitialMatches();

    this._onClick = (e) => {
      if (this.gameOver || this.animating) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const col = Math.floor((mx - this.gridOffsetX) / this.cellSize);
      const row = Math.floor((my - this.gridOffsetY) / this.cellSize);
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
      this._handleSelect(row, col);
    };

    this._onKey = (e) => {
      if (this.gameOver || this.animating) return;
      if (!this.selected) return;
      let dr = 0, dc = 0;
      if (e.key === 'ArrowUp') dr = -1;
      else if (e.key === 'ArrowDown') dr = 1;
      else if (e.key === 'ArrowLeft') dc = -1;
      else if (e.key === 'ArrowRight') dc = 1;
      else return;
      e.preventDefault();
      const nr = this.selected.row + dr;
      const nc = this.selected.col + dc;
      if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return;
      this._trySwap(this.selected.row, this.selected.col, nr, nc);
    };

    this.canvas.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKey);

    this._loop();
  }

  destroy() {
    this.gameOver = true;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this._onClick) this.canvas.removeEventListener('click', this._onClick);
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
  }

  _calcGrid() {
    const margin = 40;
    const topMargin = 60;
    const availW = this.canvas.width - margin * 2;
    const availH = this.canvas.height - topMargin - margin;
    this.cellSize = Math.floor(Math.min(availW / this.cols, availH / this.rows));
    const gridW = this.cellSize * this.cols;
    const gridH = this.cellSize * this.rows;
    this.gridOffsetX = Math.floor((this.canvas.width - gridW) / 2);
    this.gridOffsetY = Math.floor(topMargin + (availH - gridH) / 2);
  }

  _buildGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          type: Math.floor(Math.random() * this.numTypes),
          y: r * this.cellSize + this.gridOffsetY,
          targetY: r * this.cellSize + this.gridOffsetY,
        });
      }
      this.grid.push(row);
    }
  }

  _removeInitialMatches() {
    let found = true;
    let safety = 0;
    while (found && safety < 100) {
      found = false;
      safety++;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          // Horizontal check
          if (c >= 2 && this.grid[r][c].type === this.grid[r][c-1].type && this.grid[r][c].type === this.grid[r][c-2].type) {
            this.grid[r][c].type = Math.floor(Math.random() * this.numTypes);
            found = true;
          }
          // Vertical check
          if (r >= 2 && this.grid[r][c].type === this.grid[r-1][c].type && this.grid[r][c].type === this.grid[r-2][c].type) {
            this.grid[r][c].type = Math.floor(Math.random() * this.numTypes);
            found = true;
          }
        }
      }
    }
  }

  _handleSelect(row, col) {
    if (!this.selected) {
      this.selected = { row, col };
      return;
    }
    const dr = Math.abs(row - this.selected.row);
    const dc = Math.abs(col - this.selected.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      this._trySwap(this.selected.row, this.selected.col, row, col);
    } else {
      this.selected = { row, col };
    }
  }

  _trySwap(r1, c1, r2, c2) {
    this.animating = true;
    this.swapping = true;
    this.swapFrom = { row: r1, col: c1 };
    this.swapTo = { row: r2, col: c2 };
    this.swapProgress = 0;
    this.swapRevert = false;

    // Perform the swap in data
    const tmp = this.grid[r1][c1].type;
    this.grid[r1][c1].type = this.grid[r2][c2].type;
    this.grid[r2][c2].type = tmp;

    // Check if this creates a match
    const matches = this._findMatches();
    if (matches.length === 0) {
      // Swap back
      this.grid[r1][c1].type = this.grid[r2][c2].type;
      this.grid[r2][c2].type = tmp;
      this.swapRevert = true;
    }
    this.selected = null;
  }

  _findMatches() {
    const matched = new Set();

    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      let run = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.grid[r][c].type === this.grid[r][c-1].type) {
          run++;
        } else {
          if (run >= 3) {
            for (let k = c - run; k < c; k++) matched.add(`${r},${k}`);
          }
          run = 1;
        }
      }
      if (run >= 3) {
        for (let k = this.cols - run; k < this.cols; k++) matched.add(`${r},${k}`);
      }
    }

    // Vertical
    for (let c = 0; c < this.cols; c++) {
      let run = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.grid[r][c].type === this.grid[r-1][c].type) {
          run++;
        } else {
          if (run >= 3) {
            for (let k = r - run; k < r; k++) matched.add(`${k},${c}`);
          }
          run = 1;
        }
      }
      if (run >= 3) {
        for (let k = this.rows - run; k < this.rows; k++) matched.add(`${k},${c}`);
      }
    }

    return Array.from(matched).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { row: r, col: c };
    });
  }

  _scoreMatches(matches) {
    // Group into connected runs to score by length
    // Simple approach: count total matched and score proportionally
    // But better: find distinct runs

    // Horizontal runs
    const runs = [];
    for (let r = 0; r < this.rows; r++) {
      let run = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.grid[r][c].type === this.grid[r][c-1].type && this.grid[r][c].type !== -1) {
          run++;
        } else {
          if (run >= 3) runs.push(run);
          run = 1;
        }
      }
      if (run >= 3) runs.push(run);
    }
    // Vertical runs
    for (let c = 0; c < this.cols; c++) {
      let run = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.grid[r][c].type === this.grid[r-1][c].type && this.grid[r][c].type !== -1) {
          run++;
        } else {
          if (run >= 3) runs.push(run);
          run = 1;
        }
      }
      if (run >= 3) runs.push(run);
    }

    let pts = 0;
    for (const len of runs) {
      if (len === 3) pts += 100;
      else if (len === 4) pts += 300;
      else pts += 500;
    }
    return pts;
  }

  _clearMatches(matches) {
    for (const m of matches) {
      const cell = this.grid[m.row][m.col];
      this._spawnMatchParticles(m.row, m.col, cell.type);
      cell.type = -1; // empty
    }
  }

  _applyGravity() {
    this.falling = true;
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c].type !== -1) {
          if (writeRow !== r) {
            this.grid[writeRow][c].type = this.grid[r][c].type;
            this.grid[r][c].type = -1;
          }
          this.grid[writeRow][c].targetY = writeRow * this.cellSize + this.gridOffsetY;
          writeRow--;
        }
      }
      // Fill empty spaces at top
      for (let r = writeRow; r >= 0; r--) {
        this.grid[r][c].type = Math.floor(Math.random() * this.numTypes);
        this.grid[r][c].y = (r - (writeRow + 1)) * this.cellSize + this.gridOffsetY - this.cellSize;
        this.grid[r][c].targetY = r * this.cellSize + this.gridOffsetY;
      }
    }
  }

  _updateFalling() {
    let allSettled = true;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.y < cell.targetY) {
          cell.y = Math.min(cell.y + this.fallSpeed, cell.targetY);
          if (cell.y < cell.targetY) allSettled = false;
        }
      }
    }
    if (allSettled) {
      this.falling = false;
      // Check for cascading matches
      const matches = this._findMatches();
      if (matches.length > 0) {
        const pts = this._scoreMatches(matches);
        this.score += pts;
        this.cb.onScore(this.score);
        this._clearMatches(matches);
        this._applyGravity();
      } else {
        this.animating = false;
        // Check if any moves remain
        if (!this._hasValidMoves()) {
          this.gameOver = true;
          this.cb.onGameOver(this.score);
        }
      }
    }
  }

  _hasValidMoves() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Try swap right
        if (c < this.cols - 1) {
          this._swapTypes(r, c, r, c + 1);
          if (this._findMatches().length > 0) { this._swapTypes(r, c, r, c + 1); return true; }
          this._swapTypes(r, c, r, c + 1);
        }
        // Try swap down
        if (r < this.rows - 1) {
          this._swapTypes(r, c, r + 1, c);
          if (this._findMatches().length > 0) { this._swapTypes(r, c, r + 1, c); return true; }
          this._swapTypes(r, c, r + 1, c);
        }
      }
    }
    return false;
  }

  _swapTypes(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1].type;
    this.grid[r1][c1].type = this.grid[r2][c2].type;
    this.grid[r2][c2].type = tmp;
  }

  _getEmojiSet() {
    const gemsTheme = (this.theme.gemsAre || '').toLowerCase();
    const map = {
      fruit: ['🍎','🍊','🍋','🍇','🍉','🍓','🍌'],
      planet: ['🌍','🌙','☀️','⭐','💫','🪐','☄️'],
      animal: ['🐱','🐶','🐸','🦊','🐰','🐻','🐼'],
      food: ['🍕','🍔','🌮','🍩','🍪','🧁','🍫'],
      candy: ['🍬','🍭','🍫','🧁','🍪','🍩','🎂'],
      sport: ['⚽','🏀','🎾','🏈','⚾','🎱','🏐'],
      flower: ['🌹','🌻','🌸','🌺','🌼','💐','🌷'],
      heart: ['❤️','🧡','💛','💚','💙','💜','🤍'],
    };
    for (const [keyword, emojis] of Object.entries(map)) {
      if (gemsTheme.includes(keyword)) return emojis;
    }
    if (gemsTheme.length > 0) {
      const pool = ['🎮','🎯','🎪','🎨','🎭','🎬','🎵','🎸','🎲','🎰','🃏','🀄','🌀','💫','✨','🔮','💠','🔷'];
      let hash = 0;
      for (let i = 0; i < gemsTheme.length; i++) hash = ((hash << 5) - hash + gemsTheme.charCodeAt(i)) | 0;
      const idx = Math.abs(hash) % (pool.length - 6);
      return pool.slice(idx, idx + 7);
    }
    return null;
  }

  _spawnMatchParticles(row, col, type) {
    const fx = (this.theme.matchEffect || '').toLowerCase();
    const cx = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    const cy = this.grid[row][col].y + this.cellSize / 2;
    const color = this.gemColors[type] || '#fff';

    if (fx.includes('sparkle') || fx.includes('glitter') || fx.includes('shine') || fx.includes('twinkle')) {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * this.cellSize,
          y: cy,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 3 + 1),
          life: 1.2,
          color: ['#ffd700', '#ffec8b', '#fff8dc', '#fffacd'][i % 4],
          size: Math.random() * 4 + 2,
          type: 'circle',
        });
      }
    } else if (fx.includes('explode') || fx.includes('blast') || fx.includes('boom') || fx.includes('detonate')) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 4 + Math.random() * 5;
        this.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.7,
          color: ['#ff0', '#f80', '#f00', '#fff'][i % 4],
          size: Math.random() * 5 + 3,
        });
      }
    } else if (fx.includes('melt') || fx.includes('drip') || fx.includes('ooze') || fx.includes('slime') || fx.includes('liquid')) {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * this.cellSize * 0.6,
          y: cy,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 1,
          life: 1.2,
          color: color,
          size: Math.random() * 6 + 3,
          type: 'drip',
        });
      }
    } else if (fx.includes('pop') || fx.includes('bubble') || fx.includes('burst')) {
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        this.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 0.6,
          color: color,
          size: Math.random() * 7 + 4,
          type: 'circle',
        });
      }
    } else if (fx.includes('fire') || fx.includes('flame') || fx.includes('burn') || fx.includes('ignite')) {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * this.cellSize * 0.5,
          y: cy,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 5 + 2),
          life: 1,
          color: ['#ff0', '#f80', '#f40', '#f00'][i % 4],
          size: Math.random() * 6 + 3,
        });
      }
    } else if (fx.length > 0) {
      let hash = 0;
      for (let i = 0; i < fx.length; i++) hash = ((hash << 5) - hash + fx.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      const pColor = `hsl(${hue}, 70%, 55%)`;
      const style = Math.abs(hash) % 3;
      for (let i = 0; i < 8; i++) {
        if (style === 0) {
          this.particles.push({ x: cx+(Math.random()-0.5)*this.cellSize, y: cy, vx: (Math.random()-0.5)*3, vy: -(Math.random()*8+2), life: 1.1, color: pColor, size: Math.random()*5+3 });
        } else if (style === 1) {
          const angle = (i/8)*Math.PI*2; const speed = 3+Math.random()*4;
          this.particles.push({ x: cx, y: cy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 0.8, color: pColor, size: Math.random()*5+3 });
        } else {
          this.particles.push({ x: cx+(Math.random()-0.5)*this.cellSize, y: cy, vx: (Math.random()-0.5)*2, vy: -(Math.random()*2+0.5), life: 1.4, color: pColor, size: Math.random()*5+3, type: 'circle' });
        }
      }
    } else {
      // Default: colored squares
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          color: color,
          size: Math.random() * 5 + 2,
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
    // Timer
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.timeLeft = Math.max(0, this.timeLimit - elapsed);
    if (this.timeLeft <= 0 && !this.animating) {
      this.gameOver = true;
      this.cb.onGameOver(this.score);
      return;
    }

    // Pulse phase for selection highlight
    this.pulsePhase += 0.08;

    // Swap animation
    if (this.swapping) {
      this.swapProgress += 0.08;
      if (this.swapProgress >= 1) {
        this.swapping = false;
        this.swapProgress = 0;
        if (this.swapRevert) {
          this.animating = false;
          this.swapFrom = null;
          this.swapTo = null;
        } else {
          // Process matches
          const matches = this._findMatches();
          if (matches.length > 0) {
            const pts = this._scoreMatches(matches);
            this.score += pts;
            this.cb.onScore(this.score);
            this._clearMatches(matches);
            this._applyGravity();
          } else {
            this.animating = false;
          }
          this.swapFrom = null;
          this.swapTo = null;
        }
      }
    }

    // Falling animation
    if (this.falling) {
      this._updateFalling();
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

  _draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background with radial gradient + vignette
    const _m3BgTheme = (this.theme.worldTheme || '').toLowerCase();
    let _m3Center = '#12122a', _m3Edge = '#0a0a18';
    if (_m3BgTheme.length > 0) {
      let _m3Hash = 0;
      for (let i = 0; i < _m3BgTheme.length; i++) _m3Hash = ((_m3Hash << 5) - _m3Hash + _m3BgTheme.charCodeAt(i)) | 0;
      const _m3Hue = Math.abs(_m3Hash) % 360;
      _m3Center = `hsl(${_m3Hue}, 20%, 10%)`;
      _m3Edge = `hsl(${_m3Hue}, 15%, 5%)`;
    }
    const bgGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width * 0.6);
    bgGrad.addColorStop(0, _m3Center);
    bgGrad.addColorStop(1, _m3Edge);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vig = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height * 0.3, canvas.width/2, canvas.height/2, canvas.width * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Board background
    this._drawBoard();

    // Gems
    const emojiSet = this._getEmojiSet();
    const pad = Math.max(2, this.cellSize * 0.08);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (cell.type === -1) continue;

        let drawX = this.gridOffsetX + c * this.cellSize;
        let drawY = cell.y;

        // Swap animation offset
        if (this.swapping && this.swapFrom && this.swapTo) {
          const t = this.swapProgress;
          if (r === this.swapFrom.row && c === this.swapFrom.col) {
            const dx = (this.swapTo.col - this.swapFrom.col) * this.cellSize * t;
            const dy = (this.swapTo.row - this.swapFrom.row) * this.cellSize * t;
            drawX += dx;
            drawY += dy;
          } else if (r === this.swapTo.row && c === this.swapTo.col) {
            const dx = (this.swapFrom.col - this.swapTo.col) * this.cellSize * t;
            const dy = (this.swapFrom.row - this.swapTo.row) * this.cellSize * t;
            drawX += dx;
            drawY += dy;
          }
        }

        const gemX = drawX + pad;
        const gemY = drawY + pad;
        const gemSize = this.cellSize - pad * 2;

        if (emojiSet) {
          // Emoji rendering
          ctx.font = `${Math.round(gemSize * 0.75)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emojiSet[cell.type] || '?', drawX + this.cellSize / 2, drawY + this.cellSize / 2);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        } else {
          // Colored rounded square with gradient and shine
          const color = this.gemColors[cell.type];
          const gGrad = ctx.createLinearGradient(gemX, gemY, gemX, gemY + gemSize);
          gGrad.addColorStop(0, color);
          gGrad.addColorStop(0.4, color);
          gGrad.addColorStop(1, this._darkenColor(color, 0.3));
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.roundRect(gemX, gemY, gemSize, gemSize, gemSize * 0.2);
          ctx.fill();

          // Shine highlight
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.beginPath();
          ctx.roundRect(gemX + gemSize * 0.15, gemY + gemSize * 0.1, gemSize * 0.5, gemSize * 0.25, gemSize * 0.1);
          ctx.fill();
        }

        // Selection highlight
        if (this.selected && this.selected.row === r && this.selected.col === c) {
          const pulse = 0.4 + Math.sin(this.pulsePhase) * 0.3;
          ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(drawX + 2, drawY + 2, this.cellSize - 4, this.cellSize - 4, this.cellSize * 0.15);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Timer
    ctx.fillStyle = this.timeLeft < 10 ? '#e74c3c' : '#8b5cf6';
    ctx.font = `bold ${Math.max(14, Math.round(canvas.height * 0.025))}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${Math.ceil(this.timeLeft)}s`, canvas.width - 15, 30);
    ctx.textAlign = 'left';

    // Timer bar
    const barW = 120;
    const barH = 6;
    const barX = canvas.width - 15 - barW;
    const barY = 38;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();
    const pct = this.timeLeft / this.timeLimit;
    ctx.fillStyle = this.timeLeft < 10 ? '#e74c3c' : '#8b5cf6';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * pct, barH, 3);
    ctx.fill();

    // Particles
    if (this.particles.length > 300) this.particles.splice(0, this.particles.length - 300);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'drip') {
        p.vy += 0.05;
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
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size / 3, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    // Theme labels
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('Gems: ' + (this.theme.gemsAre || 'gems'), 10, canvas.height - 10);
  }

  _drawBoard() {
    const { ctx } = this;
    const bx = this.gridOffsetX - 6;
    const by = this.gridOffsetY - 6;
    const bw = this.cols * this.cellSize + 12;
    const bh = this.rows * this.cellSize + 12;
    const style = (this.theme.boardStyle || '').toLowerCase();

    if (style.includes('wood') || style.includes('wooden')) {
      ctx.fillStyle = '#5c3a1e';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      // Wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < bh; i += 12) {
        ctx.beginPath();
        ctx.moveTo(bx + 4, by + i);
        ctx.bezierCurveTo(bx + bw * 0.3, by + i + 3, bx + bw * 0.6, by + i - 2, bx + bw - 4, by + i + 1);
        ctx.stroke();
      }
    } else if (style.includes('crystal') || style.includes('glass')) {
      ctx.fillStyle = 'rgba(80, 140, 220, 0.15)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.stroke();
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(bx + 4, by + 4, bw * 0.4, bh * 0.15, 6);
      ctx.fill();
    } else if (style.includes('neon') || style.includes('glow')) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      // Glowing grid lines
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.15)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= this.cols; c++) {
        const lx = this.gridOffsetX + c * this.cellSize;
        ctx.beginPath();
        ctx.moveTo(lx, this.gridOffsetY);
        ctx.lineTo(lx, this.gridOffsetY + this.rows * this.cellSize);
        ctx.stroke();
      }
      for (let r = 0; r <= this.rows; r++) {
        const ly = this.gridOffsetY + r * this.cellSize;
        ctx.beginPath();
        ctx.moveTo(this.gridOffsetX, ly);
        ctx.lineTo(this.gridOffsetX + this.cols * this.cellSize, ly);
        ctx.stroke();
      }
      ctx.shadowColor = 'rgba(0, 255, 200, 0.4)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (style.includes('stone') || style.includes('marble')) {
      ctx.fillStyle = '#3a3a40';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      // Texture dots
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 60; i++) {
        const tx = bx + Math.random() * bw;
        const ty = by + Math.random() * bh;
        ctx.beginPath();
        ctx.arc(tx, ty, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style.length > 0) {
      // Unrecognized: hash-tinted board
      let hash = 0;
      for (let i = 0; i < style.length; i++) hash = ((hash << 5) - hash + style.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      ctx.fillStyle = `hsla(${hue}, 30%, 15%, 0.4)`;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 50%, 50%, 0.2)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.stroke();
    } else {
      // Default: dark with subtle border
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.stroke();
    }
  }
}
