/* ============================================
   ARCADE REMIX — Main Application Controller
   ============================================ */

const GAMES = {
  tetris: {
    id: 'tetris',
    name: 'TETRIS',
    icon: '🧱',
    genre: 'Puzzle',
    engine: TetrisGame,
    fields: [
      { key: 'blockMaterial', label: 'The falling blocks are made of...', hint: 'e.g. crystal glass, molten lava, gummy bears', placeholder: 'crystal glass' },
      { key: 'worldTheme', label: 'The world behind the grid is...', hint: 'e.g. a volcanic hellscape, an underwater reef, outer space', placeholder: 'a volcanic hellscape' },
      { key: 'clearEffect', label: 'When a line clears, it...', hint: 'e.g. shatters into diamonds, explodes in flames, dissolves into butterflies', placeholder: 'shatters into diamonds' },
      { key: 'colorScheme', label: 'The color palette feels like...', hint: 'e.g. neon synthwave, earthy forest, candy shop', placeholder: 'neon synthwave' },
    ],
    controls: 'ARROWS or WASD to move | W or UP to rotate | SPACE to drop'
  },
  snake: {
    id: 'snake',
    name: 'SNAKE',
    icon: '🐍',
    genre: 'Arcade',
    engine: SnakeGame,
    fields: [
      { key: 'snakeIs', label: 'The snake is actually a...', hint: 'e.g. fire-breathing dragon, sushi train, conga line of penguins', placeholder: 'fire-breathing dragon' },
      { key: 'foodIs', label: 'It eats...', hint: 'e.g. golden coins, tiny planets, tacos', placeholder: 'golden coins' },
      { key: 'worldTheme', label: 'The arena is set in...', hint: 'e.g. a neon-lit Tokyo street, a haunted graveyard, the inside of a computer', placeholder: 'a neon-lit Tokyo street' },
      { key: 'trailEffect', label: 'It leaves a trail of...', hint: 'e.g. sparks, flower petals, pixel dust', placeholder: 'sparks' },
    ],
    controls: 'ARROW KEYS or WASD to move'
  },
  breakout: {
    id: 'breakout',
    name: 'BREAKOUT',
    icon: '🧨',
    genre: 'Action',
    engine: BreakoutGame,
    fields: [
      { key: 'paddleIs', label: 'Your paddle is a...', hint: 'e.g. surfboard, lightsaber, giant ruler', placeholder: 'surfboard' },
      { key: 'ballIs', label: 'The ball is a...', hint: 'e.g. flaming meteor, bouncy eyeball, tiny moon', placeholder: 'flaming meteor' },
      { key: 'bricksAre', label: 'The bricks are made of...', hint: 'e.g. chocolate bars, ancient stone tablets, ice blocks', placeholder: 'chocolate bars' },
      { key: 'breakEffect', label: 'When bricks break they...', hint: 'e.g. melt into goo, crumble to dust, pop like balloons', placeholder: 'melt into goo' },
    ],
    controls: 'ARROW KEYS or MOUSE to move paddle | SPACE to launch'
  },
  invaders: {
    id: 'invaders',
    name: 'INVADERS',
    icon: '👾',
    genre: 'Shooter',
    engine: InvadersGame,
    fields: [
      { key: 'shipIs', label: 'Your ship is a...', hint: 'e.g. pizza delivery drone, viking longship, flying cat', placeholder: 'pizza delivery drone' },
      { key: 'enemiesAre', label: 'The invaders are...', hint: 'e.g. angry emojis, rogue AI bots, space chickens', placeholder: 'angry emojis' },
      { key: 'weaponIs', label: 'You shoot...', hint: 'e.g. laser beams, pizza slices, love hearts', placeholder: 'laser beams' },
      { key: 'worldTheme', label: 'The battlefield is...', hint: 'e.g. above a cyberpunk city, in a cereal bowl, on the moon', placeholder: 'above a cyberpunk city' },
    ],
    controls: 'ARROW KEYS to move | SPACE to shoot'
  },
  pong: {
    id: 'pong',
    name: 'PONG',
    icon: '🏓',
    genre: 'Sports',
    engine: PongGame,
    fields: [
      { key: 'paddlesAre', label: 'The paddles are...', hint: 'e.g. medieval shields, rubber ducks, skyscrapers', placeholder: 'medieval shields' },
      { key: 'ballIs', label: 'The ball is a...', hint: 'e.g. comet, bowling ball, hamster in a wheel', placeholder: 'comet' },
      { key: 'arenaIs', label: 'The arena is...', hint: 'e.g. a gladiator colosseum, deep space, a swimming pool', placeholder: 'a gladiator colosseum' },
      { key: 'scoreEffect', label: 'When someone scores it...', hint: 'e.g. triggers fireworks, causes an earthquake, summons confetti', placeholder: 'triggers fireworks' },
    ],
    controls: 'ARROWS or W/S to move | vs CPU'
  },
  runner: {
    id: 'runner',
    name: 'RUNNER',
    icon: '🏃',
    genre: 'Endless',
    engine: RunnerGame,
    fields: [
      { key: 'playerIs', label: 'The runner is a...', hint: 'e.g. rocket-powered cat, dinosaur, ninja on a skateboard', placeholder: 'rocket-powered cat' },
      { key: 'obstacleIs', label: 'The obstacles are...', hint: 'e.g. flaming cacti, rolling boulders, angry mailboxes', placeholder: 'flaming cacti' },
      { key: 'worldTheme', label: 'The world looks like...', hint: 'e.g. a neon cityscape, an alien desert, a candy highway', placeholder: 'a neon cityscape' },
      { key: 'powerupIs', label: 'The collectibles are...', hint: 'e.g. golden coins, glowing stars, tiny diamonds', placeholder: 'golden coins' },
    ],
    controls: 'SPACE or UP to jump'
  },
  flappy: {
    id: 'flappy',
    name: 'FLAPPY',
    icon: '🐦',
    genre: 'Arcade',
    engine: FlappyGame,
    fields: [
      { key: 'birdIs', label: 'The bird is a...', hint: 'e.g. flying cat, tiny rocket, flapping ghost', placeholder: 'flying cat' },
      { key: 'pipesAre', label: 'The pipes are...', hint: 'e.g. candy canes, skyscrapers, crystal columns', placeholder: 'candy canes' },
      { key: 'worldTheme', label: 'The sky looks like...', hint: 'e.g. a sunset over the ocean, deep space, a haunted forest', placeholder: 'a sunset over the ocean' },
      { key: 'flapEffect', label: 'When you flap it leaves...', hint: 'e.g. sparkles, fire trails, little bubbles', placeholder: 'sparkles' },
    ],
    controls: 'SPACE or UP or CLICK to flap'
  },
  asteroids: {
    id: 'asteroids',
    name: 'ASTEROIDS',
    icon: '☄️',
    genre: 'Shooter',
    engine: AsteroidsGame,
    fields: [
      { key: 'shipIs', label: 'Your ship is a...', hint: 'e.g. pizza delivery rocket, ghost pirate ship, golden dragon', placeholder: 'pizza delivery rocket' },
      { key: 'asteroidsAre', label: 'The asteroids are...', hint: 'e.g. giant cookies, alien eggs, floating skulls', placeholder: 'giant cookies' },
      { key: 'weaponIs', label: 'You shoot...', hint: 'e.g. laser beams, fireballs, love hearts', placeholder: 'laser beams' },
      { key: 'worldTheme', label: 'Space looks like...', hint: 'e.g. a neon arcade grid, a colorful nebula, the void', placeholder: 'a neon arcade grid' },
    ],
    controls: 'ARROWS or WASD to steer | SPACE to shoot'
  },
  match3: {
    id: 'match3',
    name: 'MATCH 3',
    icon: '💎',
    genre: 'Puzzle',
    engine: Match3Game,
    fields: [
      { key: 'gemsAre', label: 'The gems look like...', hint: 'e.g. fruits, planets, candy, emojis', placeholder: 'fruits' },
      { key: 'matchEffect', label: 'When gems match they...', hint: 'e.g. sparkle, explode, melt, pop', placeholder: 'sparkle' },
      { key: 'worldTheme', label: 'The world behind the board is...', hint: 'e.g. a crystal cave, an enchanted forest, outer space', placeholder: 'a crystal cave' },
      { key: 'boardStyle', label: 'The board looks...', hint: 'e.g. wooden, crystal, neon, stone', placeholder: 'wooden' },
    ],
    controls: 'CLICK to select & swap gems | ARROW KEYS to swap direction'
  },
  platformer: {
    id: 'platformer',
    name: 'PLATFORMER',
    icon: '🏔️',
    genre: 'Platform',
    engine: PlatformerGame,
    fields: [
      { key: 'playerIs', label: 'The climber is a...', hint: 'e.g. ninja cat, jetpack robot, bouncy frog', placeholder: 'ninja cat' },
      { key: 'platformsAre', label: 'The platforms are made of...', hint: 'e.g. wooden planks, ice crystals, neon beams, candy', placeholder: 'wooden planks' },
      { key: 'collectibleIs', label: 'You collect...', hint: 'e.g. golden coins, sparkling gems, pizza slices', placeholder: 'golden coins' },
      { key: 'worldTheme', label: 'The world looks like...', hint: 'e.g. a candy kingdom, a frozen mountain, outer space', placeholder: 'a candy kingdom' },
    ],
    controls: 'ARROWS or WASD to move | SPACE to jump'
  },
  dodge: {
    id: 'dodge',
    name: 'DODGE',
    icon: '⚡',
    genre: 'Action',
    engine: DodgeGame,
    fields: [
      { key: 'playerIs', label: 'You are a...', hint: 'e.g. nimble ninja, speedy cat, brave umbrella', placeholder: 'nimble ninja' },
      { key: 'fallingIs', label: 'Falling from the sky...', hint: 'e.g. flaming meteors, bombs, angry rocks', placeholder: 'flaming meteors' },
      { key: 'worldTheme', label: 'The world looks like...', hint: 'e.g. a stormy battlefield, deep space, a volcano', placeholder: 'a stormy battlefield' },
      { key: 'powerupIs', label: 'Power-ups are...', hint: 'e.g. glowing stars, magic shields, sparkling gems', placeholder: 'glowing stars' },
    ],
    controls: 'ARROWS or A/D to dodge'
  }
};

/* --- State --- */
let currentScreen = 'boot';
let selectedGame = null;
let activeEngine = null;
let madlibValues = {};
let splashTimer = null;
let isPaused = false;

/* --- DOM refs --- */
const screens = {
  boot: document.getElementById('boot-screen'),
  select: document.getElementById('select-screen'),
  madlibs: document.getElementById('madlibs-screen'),
  game: document.getElementById('game-screen'),
  custom: document.getElementById('custom-screen'),
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

/* --- Helper: is user typing in an input? --- */
function isTyping() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/* --- Screen transitions --- */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  currentScreen = name;
}

/* --- Canvas sizing --- */
function sizeCanvas() {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;
  if (w > 0 && h > 0) {
    canvas.width = w;
    canvas.height = h;
  }
}

/* --- Boot Screen --- */
document.getElementById('btn-start').addEventListener('click', () => {
  showScreen('select');
  buildCartridgeGrid();
});

document.addEventListener('keydown', (e) => {
  if (isTyping()) return;
  if (currentScreen === 'boot' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    showScreen('select');
    buildCartridgeGrid();
  }
});

/* --- Cartridge Grid --- */
function buildCartridgeGrid() {
  const grid = document.getElementById('cartridge-grid');
  grid.innerHTML = '';

  Object.values(GAMES).forEach(game => {
    const el = document.createElement('div');
    el.className = 'cartridge';
    el.dataset.id = game.id;

    const icon = document.createElement('span');
    icon.className = 'cartridge-icon';
    icon.textContent = game.icon;

    const label = document.createElement('span');
    label.className = 'cartridge-label';
    label.textContent = game.name;

    const genre = document.createElement('span');
    genre.className = 'cartridge-genre';
    genre.textContent = game.genre;

    el.appendChild(icon);
    el.appendChild(label);
    el.appendChild(genre);
    el.addEventListener('click', () => selectCartridge(game.id));
    grid.appendChild(el);
  });

  // "+" card — opens custom game builder
  const addEl = document.createElement('div');
  addEl.className = 'cartridge-add';
  const addIcon = document.createElement('span');
  addIcon.className = 'cartridge-icon';
  addIcon.textContent = '🎨';
  const addLabel = document.createElement('span');
  addLabel.className = 'cartridge-label';
  addLabel.textContent = 'CREATE';
  const addGenre = document.createElement('span');
  addGenre.className = 'cartridge-genre';
  addGenre.textContent = 'Build your own';
  addEl.appendChild(addIcon);
  addEl.appendChild(addLabel);
  addEl.appendChild(addGenre);
  addEl.addEventListener('click', () => {
    showScreen('custom');
    buildCustomTemplates();
  });
  grid.appendChild(addEl);
}

/* --- Custom Game Templates --- */
const TEMPLATES = [
  { id: 'shooter', name: 'SHOOTER', icon: '🔫', desc: 'Shoot enemies coming at you',
    base: 'invaders', fields: [
      { key: 'shipIs', label: 'You are a...', hint: 'e.g. spaceship, cowboy, wizard, penguin', placeholder: 'spaceship' },
      { key: 'enemiesAre', label: 'Enemies are...', hint: 'e.g. zombies, angry birds, evil robots', placeholder: 'zombies' },
      { key: 'weaponIs', label: 'You shoot...', hint: 'e.g. lasers, snowballs, bananas, lightning', placeholder: 'lasers' },
      { key: 'worldTheme', label: 'The battlefield is...', hint: 'e.g. haunted castle, tropical island, moon base', placeholder: 'haunted castle' },
    ]},
  { id: 'dodger', name: 'DODGER', icon: '💨', desc: 'Dodge falling chaos',
    base: 'dodge', fields: [
      { key: 'playerIs', label: 'You are a...', hint: 'e.g. tiny mouse, dancing robot, brave knight', placeholder: 'tiny mouse' },
      { key: 'fallingIs', label: 'Things falling are...', hint: 'e.g. flaming meteors, rotten tomatoes, pianos', placeholder: 'flaming meteors' },
      { key: 'worldTheme', label: 'You\'re dodging in...', hint: 'e.g. a thunderstorm, a candy factory, a volcano', placeholder: 'a thunderstorm' },
      { key: 'powerupIs', label: 'Power-ups are...', hint: 'e.g. magic shields, speed boots, invisibility cloaks', placeholder: 'magic shields' },
    ]},
  { id: 'racer', name: 'RUNNER', icon: '🏁', desc: 'Run and jump endlessly',
    base: 'runner', fields: [
      { key: 'playerIs', label: 'The runner is a...', hint: 'e.g. speedy hedgehog, rocket cat, rolling boulder', placeholder: 'speedy hedgehog' },
      { key: 'obstacleIs', label: 'Obstacles are...', hint: 'e.g. giant cacti, lava pits, brick walls', placeholder: 'giant cacti' },
      { key: 'worldTheme', label: 'Running through...', hint: 'e.g. a jungle, the moon, a birthday party', placeholder: 'a jungle' },
      { key: 'powerupIs', label: 'Boosts are...', hint: 'e.g. rocket fuel, rainbow stars, super sneakers', placeholder: 'rocket fuel' },
    ]},
  { id: 'climber', name: 'CLIMBER', icon: '🧗', desc: 'Jump between platforms',
    base: 'platformer', fields: [
      { key: 'playerIs', label: 'The climber is a...', hint: 'e.g. mountain goat, jetpack kid, spider', placeholder: 'mountain goat' },
      { key: 'platformsAre', label: 'Platforms are made of...', hint: 'e.g. clouds, pizza slices, lily pads', placeholder: 'clouds' },
      { key: 'collectibleIs', label: 'Collect...', hint: 'e.g. treasure chests, butterflies, music notes', placeholder: 'treasure chests' },
      { key: 'worldTheme', label: 'Climbing through...', hint: 'e.g. a beanstalk, a skyscraper, inside a volcano', placeholder: 'a beanstalk' },
    ]},
  { id: 'breaker', name: 'BREAKER', icon: '💥', desc: 'Smash blocks with a ball',
    base: 'breakout', fields: [
      { key: 'paddleIs', label: 'Your paddle is a...', hint: 'e.g. magic wand, skateboard, giant tongue', placeholder: 'magic wand' },
      { key: 'ballIs', label: 'The ball is a...', hint: 'e.g. cannonball, hamster ball, eyeball', placeholder: 'cannonball' },
      { key: 'bricksAre', label: 'Bricks are made of...', hint: 'e.g. gingerbread, frozen tears, ancient runes', placeholder: 'gingerbread' },
      { key: 'breakEffect', label: 'When bricks break they...', hint: 'e.g. shatter into glitter, melt like ice cream, pop like balloons', placeholder: 'shatter into glitter' },
    ]},
  { id: 'puzzler', name: 'PUZZLER', icon: '🧩', desc: 'Match gems to score',
    base: 'match3', fields: [
      { key: 'gemsAre', label: 'The pieces look like...', hint: 'e.g. sea creatures, space rocks, breakfast foods', placeholder: 'sea creatures' },
      { key: 'matchEffect', label: 'Matches cause...', hint: 'e.g. mini explosions, rainbow sparkles, puffs of smoke', placeholder: 'mini explosions' },
      { key: 'worldTheme', label: 'The puzzle is set in...', hint: 'e.g. an underwater temple, a wizard\'s lab, a candy factory', placeholder: 'an underwater temple' },
      { key: 'boardStyle', label: 'The board is made of...', hint: 'e.g. ancient stone, glowing crystal, rustic wood', placeholder: 'ancient stone' },
    ]},
];

function buildCustomTemplates() {
  const container = document.getElementById('custom-templates');
  container.innerHTML = '';

  TEMPLATES.forEach(tmpl => {
    const el = document.createElement('div');
    el.className = 'cartridge';
    el.dataset.id = tmpl.id;

    const icon = document.createElement('span');
    icon.className = 'cartridge-icon';
    icon.textContent = tmpl.icon;

    const label = document.createElement('span');
    label.className = 'cartridge-label';
    label.textContent = tmpl.name;

    const desc = document.createElement('span');
    desc.className = 'cartridge-genre';
    desc.textContent = tmpl.desc;

    el.appendChild(icon);
    el.appendChild(label);
    el.appendChild(desc);
    el.addEventListener('click', () => selectTemplate(tmpl));
    container.appendChild(el);
  });
}

function selectTemplate(tmpl) {
  // Create a virtual game entry based on the template's base engine
  const baseGame = GAMES[tmpl.base];
  selectedGame = {
    id: 'custom_' + tmpl.id,
    baseId: tmpl.base,
    name: tmpl.name + ' REMIX',
    icon: tmpl.icon,
    genre: 'Custom',
    engine: baseGame.engine,
    fields: tmpl.fields,
    controls: baseGame.controls,
  };

  setTimeout(() => {
    showScreen('madlibs');
    buildMadLibsForm();
  }, 200);
}

document.getElementById('btn-custom-back').addEventListener('click', () => {
  showScreen('select');
});

function selectCartridge(id) {
  selectedGame = GAMES[id];

  document.querySelectorAll('.cartridge').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.cartridge[data-id="${id}"]`)?.classList.add('selected');

  setTimeout(() => {
    showScreen('madlibs');
    buildMadLibsForm();
  }, 200);
}

/* --- Keyword chips: words that trigger visual effects --- */
const KEYWORD_CHIPS = {
  tetris: {
    blockMaterial: ['slime', 'lava', 'glass', 'crystal', 'metal', 'gold', 'neon', 'candy', 'wood', 'fire', 'cloud', 'chocolate'],
    worldTheme: ['volcano', 'lava', 'fire', 'space', 'galaxy', 'underwater', 'ocean', 'neon', 'cyber'],
    clearEffect: ['flame', 'explode', 'shatter', 'melt', 'confetti', 'lightning', 'snow', 'star', 'smoke', 'flutter'],
    colorScheme: ['synth', 'neon', 'earth', 'candy', 'fire', 'ice', 'ocean', 'sunset', 'gold', 'rainbow', 'cosmic', 'gothic'],
  },
  snake: {
    snakeIs: ['dragon', 'fire', 'sushi', 'food', 'penguin', 'ice', 'neon', 'cyber', 'worm', 'earth'],
    foodIs: ['gold', 'coin', 'planet', 'star', 'taco', 'pizza', 'gem', 'diamond'],
    worldTheme: ['tokyo', 'neon', 'city', 'cyber', 'haunt', 'grave', 'spooky', 'computer', 'digital', 'matrix'],
    trailEffect: ['spark', 'fire', 'flower', 'petal', 'pixel', 'digital'],
  },
  breakout: {
    paddleIs: ['surf', 'light', 'saber', 'ruler', 'wood', 'ice', 'fire', 'gold', 'candy', 'cat', 'ghost', 'rainbow'],
    ballIs: ['fire', 'flame', 'meteor', 'eye', 'moon', 'planet', 'ice', 'bomb', 'disco', 'bowling'],
    bricksAre: ['chocolate', 'ice', 'stone', 'glass', 'candy', 'gold', 'wood', 'neon'],
    breakEffect: ['melt', 'explode', 'shatter', 'pop', 'fire', 'dissolve', 'confetti', 'flutter'],
  },
  invaders: {
    shipIs: ['pizza', 'food', 'cat', 'animal', 'viking', 'ship', 'rocket', 'jet'],
    weaponIs: ['laser', 'pizza', 'food', 'heart', 'love'],
    worldTheme: ['cyber', 'city', 'neon', 'moon', 'lunar'],
  },
  pong: {
    paddlesAre: ['shield', 'medieval', 'duck', 'rubber', 'skyscraper', 'building', 'neon', 'laser'],
    ballIs: ['comet', 'fire', 'bowling', 'heavy', 'hamster', 'animal'],
    arenaIs: ['colosseum', 'gladiator', 'arena', 'space', 'deep', 'star', 'pool', 'water', 'swim'],
  },
  runner: {
    playerIs: ['cat', 'robot', 'rocket', 'dinosaur', 'ninja', 'horse', 'bird', 'ghost', 'dog', 'alien'],
    obstacleIs: ['cactus', 'rock', 'fire', 'bomb', 'wall', 'tree', 'car', 'spike', 'skull'],
    worldTheme: ['neon', 'city', 'cyber', 'desert', 'space', 'galaxy', 'forest', 'volcano', 'lava', 'snow'],
    powerupIs: ['coin', 'gold', 'star', 'heart', 'gem', 'diamond', 'candy', 'crown', 'lightning'],
  },
  flappy: {
    birdIs: ['bird', 'cat', 'rocket', 'ghost', 'fish', 'angel', 'bat', 'dragon', 'bee', 'penguin'],
    pipesAre: ['tree', 'building', 'candy', 'cactus', 'crystal', 'bone', 'stone', 'bamboo'],
    worldTheme: ['space', 'galaxy', 'sky', 'cloud', 'sunset', 'city', 'neon', 'ocean', 'underwater', 'haunt'],
    flapEffect: ['fire', 'sparkle', 'bubble', 'feather', 'smoke', 'rainbow', 'electric', 'star'],
  },
  asteroids: {
    shipIs: ['rocket', 'ufo', 'cat', 'jet', 'pizza', 'ghost', 'dragon', 'ninja', 'star'],
    asteroidsAre: ['rock', 'planet', 'moon', 'cookie', 'pizza', 'bomb', 'skull', 'balloon', 'alien', 'pumpkin'],
    weaponIs: ['laser', 'fire', 'heart', 'star', 'pizza', 'ice', 'snow', 'bomb', 'arrow'],
    worldTheme: ['neon', 'cyber', 'nebula', 'cosmic', 'void', 'dark', 'arcade', 'rainbow'],
  },
  match3: {
    gemsAre: ['fruit', 'planet', 'animal', 'candy', 'food', 'sport', 'flower', 'heart'],
    matchEffect: ['sparkle', 'explode', 'melt', 'pop', 'fire', 'blast', 'bubble', 'glitter'],
    worldTheme: ['crystal', 'cave', 'forest', 'space', 'neon', 'ocean', 'enchanted'],
    boardStyle: ['wood', 'crystal', 'neon', 'stone', 'glass', 'marble', 'glow'],
  },
  platformer: {
    playerIs: ['cat', 'robot', 'ninja', 'astronaut', 'frog', 'ghost', 'bunny', 'bird'],
    platformsAre: ['wood', 'ice', 'cloud', 'neon', 'candy', 'stone', 'metal'],
    collectibleIs: ['coin', 'gold', 'star', 'gem', 'diamond', 'heart', 'candy', 'pizza'],
    worldTheme: ['space', 'galaxy', 'forest', 'candy', 'volcano', 'lava', 'city', 'neon', 'snow', 'sky'],
  },
  dodge: {
    playerIs: ['runner', 'car', 'umbrella', 'cat', 'shield', 'ninja', 'robot', 'ghost'],
    fallingIs: ['meteor', 'bomb', 'rock', 'fire', 'skull', 'anvil', 'apple', 'ice'],
    worldTheme: ['space', 'storm', 'city', 'neon', 'volcano', 'lava', 'ocean', 'forest', 'desert'],
    powerupIs: ['star', 'shield', 'heart', 'gem', 'lightning', 'crown'],
  },
};

/* --- Mad Libs Form --- */
function buildMadLibsForm() {
  const form = document.getElementById('madlibs-form');
  const subtitle = document.getElementById('madlibs-subtitle');
  subtitle.textContent = `Remixing: ${selectedGame.icon} ${selectedGame.name}`;

  form.innerHTML = '';
  madlibValues = {};

  const chipId = selectedGame.baseId || selectedGame.id;
  const gameChips = KEYWORD_CHIPS[chipId] || {};

  selectedGame.fields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'madlib-field';

    const lbl = document.createElement('label');
    lbl.className = 'madlib-label';
    lbl.textContent = field.label;

    const hint = document.createElement('span');
    hint.className = 'madlib-hint';
    hint.textContent = field.hint;

    const input = document.createElement('input');
    input.className = 'madlib-input';
    input.type = 'text';
    input.dataset.key = field.key;
    input.placeholder = field.placeholder;

    div.appendChild(lbl);
    div.appendChild(hint);

    // Add keyword chips if this field has them
    const chips = gameChips[field.key];
    if (chips && chips.length > 0) {
      const chipRow = document.createElement('div');
      chipRow.className = 'keyword-chips';
      chips.forEach(word => {
        const chip = document.createElement('span');
        chip.className = 'keyword-chip';
        chip.textContent = word;
        chip.addEventListener('click', () => {
          input.value = word;
          input.focus();
        });
        chipRow.appendChild(chip);
      });
      div.appendChild(chipRow);
    }

    div.appendChild(input);
    form.appendChild(div);
    madlibValues[field.key] = '';
  });

  const firstInput = form.querySelector('.madlib-input');
  if (firstInput) setTimeout(() => firstInput.focus(), 150);

  form.querySelectorAll('.madlib-input').forEach((input, i, all) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (i < all.length - 1) {
          all[i + 1].focus();
        } else {
          startGame();
        }
      }
    });
  });
}

function gatherMadLibValues() {
  const inputs = document.querySelectorAll('#madlibs-form .madlib-input');
  inputs.forEach(input => {
    const key = input.dataset.key;
    const val = input.value.trim();
    madlibValues[key] = val || input.placeholder;
  });
  return madlibValues;
}

/* --- Randomize --- */
document.getElementById('btn-randomize').addEventListener('click', () => {
  document.querySelectorAll('#madlibs-form .madlib-input').forEach(input => {
    input.value = input.placeholder;
  });
});

/* --- Back Button --- */
document.getElementById('btn-back').addEventListener('click', () => {
  showScreen('select');
});

/* --- Start Game --- */
document.getElementById('btn-play').addEventListener('click', startGame);

function startGame() {
  if (!selectedGame) return;
  const values = gatherMadLibValues();

  showScreen('game');
  document.activeElement?.blur();

  document.getElementById('hud-title').textContent = `${selectedGame.icon} ${selectedGame.name} REMIX`;
  document.getElementById('hud-score').textContent = 'SCORE: 0';
  document.getElementById('game-controls-hint').textContent = selectedGame.controls;
  document.getElementById('game-over-overlay').classList.add('hidden');
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('btn-pause').textContent = 'PAUSE';
  isPaused = false;

  // Kill previous engine and countdown timer
  if (activeEngine && activeEngine.destroy) activeEngine.destroy();
  activeEngine = null;
  if (splashTimer) { clearInterval(splashTimer); splashTimer = null; }

  // Theme bar (textContent prevents XSS from user input)
  const tbar = document.getElementById('theme-bar');
  tbar.innerHTML = '';
  selectedGame.fields.forEach(field => {
    const span = document.createElement('span');
    span.className = 'theme-item';

    const lbl = document.createElement('span');
    lbl.className = 'theme-label';
    lbl.textContent = field.key.replace(/([A-Z])/g, ' $1').trim().toUpperCase() + ':';

    const val = document.createElement('span');
    val.className = 'theme-value';
    val.textContent = values[field.key] || field.placeholder;

    span.appendChild(lbl);
    span.appendChild(document.createTextNode(' '));
    span.appendChild(val);
    tbar.appendChild(span);
  });

  // Splash countdown
  const splash = document.getElementById('splash-overlay');
  splash.classList.remove('hidden');
  document.getElementById('splash-icon').textContent = selectedGame.icon;
  document.getElementById('splash-title').textContent = `${selectedGame.name} REMIX`;

  const fieldsDiv = document.getElementById('splash-fields');
  fieldsDiv.innerHTML = '';
  selectedGame.fields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'splash-field';

    const k = document.createElement('div');
    k.className = 'splash-field-key';
    k.textContent = field.label.replace('...', '');

    const v = document.createElement('div');
    v.className = 'splash-field-value';
    v.textContent = values[field.key] || field.placeholder;

    div.appendChild(k);
    div.appendChild(v);
    fieldsDiv.appendChild(div);
  });

  let count = 3;
  const countEl = document.getElementById('splash-count');
  countEl.textContent = count;

  splashTimer = setInterval(() => {
    count--;
    if (count > 0) {
      countEl.textContent = count;
      countEl.classList.remove('countdown-pop');
      void countEl.offsetWidth;
      countEl.classList.add('countdown-pop');
    } else {
      clearInterval(splashTimer);
      splashTimer = null;
      splash.classList.add('hidden');
      launchEngine(values);
    }
  }, 800);
}

function launchEngine(values) {
  requestAnimationFrame(() => {
    sizeCanvas();
    try {
      activeEngine = new selectedGame.engine(canvas, ctx, values, {
        onScore: (score) => {
          const scoreEl = document.getElementById('hud-score');
          scoreEl.textContent = `SCORE: ${score}`;
          scoreEl.classList.remove('score-pop');
          void scoreEl.offsetWidth; // force reflow to restart animation
          scoreEl.classList.add('score-pop');
          setTimeout(() => scoreEl.classList.remove('score-pop'), 200);
        },
        onGameOver: (score) => {
          document.getElementById('final-score').textContent = `FINAL SCORE: ${score}`;
          document.getElementById('game-over-overlay').classList.remove('hidden');
        }
      });
      activeEngine.start();
    } catch (err) {
      console.error('Game engine failed to start:', err);
    }
  });
}

/* --- Game Over buttons --- */
document.getElementById('btn-retry').addEventListener('click', () => {
  startGame();
});

/* --- Pause --- */
function togglePause() {
  if (!activeEngine || currentScreen !== 'game') return;
  isPaused = !isPaused;
  document.getElementById('pause-overlay').classList.toggle('hidden', !isPaused);
  document.getElementById('btn-pause').textContent = isPaused ? 'RESUME' : 'PAUSE';
  if (isPaused) {
    activeEngine.gameOver = true; // freezes the loop
  } else {
    activeEngine.gameOver = false;
    activeEngine.lastDrop = performance.now(); // reset timers so piece doesn't jump
    activeEngine.lastTick = performance.now();
    activeEngine._loop();
  }
}

document.getElementById('btn-pause').addEventListener('click', togglePause);
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-pause-menu').addEventListener('click', () => {
  isPaused = false;
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('btn-pause').textContent = 'PAUSE';
  exitToMenu();
});

function exitToMenu() {
  if (splashTimer) { clearInterval(splashTimer); splashTimer = null; }
  if (activeEngine && activeEngine.destroy) {
    activeEngine.destroy();
    activeEngine = null;
  }
  showScreen('select');
}

document.getElementById('btn-menu').addEventListener('click', exitToMenu);
document.getElementById('btn-exit').addEventListener('click', exitToMenu);

/* --- Prevent scrolling during game + Escape to pause --- */
window.addEventListener('keydown', (e) => {
  if (isTyping()) return;
  if (currentScreen === 'game' && e.key === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }
  if (currentScreen === 'game' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});

/* --- Resize handler --- */
window.addEventListener('resize', () => {
  if (currentScreen === 'game' && activeEngine) sizeCanvas();
});
