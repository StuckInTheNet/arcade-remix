# ARCADE REMIX

### What if Tetris blocks were made of slime? What if Space Invaders were angry emojis? What if your Pong paddle was a stack of ducks?

**Arcade Remix** is a mad-libs arcade — pick a classic game, describe your wildest version, and play it instantly. No downloads, no installs, no excuses.

---

## INSERT COIN

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Or just open `index.html`. That's it. Zero dependencies.

---

## SELECT YOUR CARTRIDGE

```
 -------    -------    -------    -------
| TETRIS | | SNAKE  | |BREAKOUT| |INVADERS|
|   puzzle  |   arcade  |   action  |  shooter |
 -------    -------    -------    -------
|  PONG  | | RUNNER | | FLAPPY | |ASTEROIDS|
|  sports   |  runner   |  arcade   |  shooter |
 -------    -------    -------    -------
|MATCH 3 | |PLATFORM| | DODGE  | | CREATE |
|  puzzle   | platform  |  action   | build own|
 -------    -------    -------    -------
```

**11 games** + a custom game builder that remixes engines with your own prompts.

---

## HOW IT WORKS

Every game has 4 mad-libs fields. Fill them in, hit Play, and watch your words transform the game.

**Type "slime" for Tetris blocks:**
Bright green gooey blobs with drip bumps replace standard blocks.

**Type "duck" for Pong paddles:**
Your paddle becomes a column of duck emoji.

**Type "explode" for line clears:**
Lines burst into radial fire particles instead of disappearing.

**Type "angry emojis" for Invaders enemies:**
Rows of angry face emoji march toward you.

Not sure what to type? Clickable keyword chips below each input show you what triggers visual effects. Click one to auto-fill.

---

## THEME SYSTEM

The engine matches your input against hundreds of keywords across every visual element:

| Layer | What changes | Example |
|-------|-------------|---------|
| **Shape** | Game elements transform completely | "slime" blocks = green goo circles |
| **Emoji** | Elements render as emoji characters | "duck" paddle = column of ducks |
| **Color** | Palette shifts to match theme | "fire" = reds/oranges, "ice" = blues |
| **Particles** | Destruction effects change | "melt" = dripping, "shatter" = shards |
| **Background** | Environment transforms | "space" = starfield, "neon" = grid |

---

## CONTROLS

| Game | How to play |
|------|------------|
| **Tetris** | Arrows/WASD move, Up/W rotate, Space hard drop |
| **Snake** | Arrows/WASD to steer |
| **Breakout** | Arrows/Mouse move paddle, Space launch ball |
| **Invaders** | Arrows move, Space shoot |
| **Pong** | Arrows/WS to move paddle vs CPU |
| **Runner** | Space/Up to jump over obstacles |
| **Flappy** | Space/Up/Click to flap |
| **Asteroids** | Arrows steer + thrust, Space shoot |
| **Match 3** | Click gems to swap, match 3+ to score |
| **Platformer** | Arrows/WASD move, Space jump |
| **Dodge** | Arrows/AD to dodge falling objects |

All games: **ESC** to pause, **EXIT** button to return to menu.

---

## CREATE MODE

Don't see what you want? Hit the **CREATE** card and pick a template:

- **SHOOTER** — Invaders engine with custom enemies and weapons
- **DODGER** — Dodge engine with custom falling objects
- **RUNNER** — Runner engine with custom obstacles
- **CLIMBER** — Platformer engine with custom platforms
- **BREAKER** — Breakout engine with custom bricks and effects
- **PUZZLER** — Match 3 engine with custom gem themes

Same engines, completely different vibes. Your prompts, your game.

---

## TECH

Vanilla HTML + CSS + JS. No frameworks, no build tools, no node_modules.

Each game is a self-contained ES6 class (~300-500 lines) that renders on a shared canvas. The mad-libs values are passed as a `theme` object to the engine constructor, and keyword matching happens in the draw loop.

```
arcade-remix/
  index.html        — shell + screens
  app.js             — navigation, mad-libs, game launcher
  style.css          — UI styling + animations
  games/
    tetris.js        — 965 lines
    snake.js         — 680 lines
    breakout.js      — 550 lines
    invaders.js      — 590 lines
    pong.js          — 640 lines
    runner.js        — ~400 lines
    flappy.js        — ~350 lines
    asteroids.js     — ~450 lines
    match3.js        — ~500 lines
    platformer.js    — ~400 lines
    dodge.js         — ~350 lines
```

Total: **~9,000 lines** of pure vanilla JS arcade.

---

## LICENSE

MIT — remix it however you want.
