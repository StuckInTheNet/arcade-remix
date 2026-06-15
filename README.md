# Arcade Remix

A mad-libs themed retro arcade game collection. Pick a classic game, describe your own version with creative prompts, and watch it come to life with emoji characters, themed particle effects, and dynamic backgrounds.

## Play

Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

## Games

| Game | Genre | Controls |
|------|-------|----------|
| Tetris | Puzzle | Arrows/WASD + Space to drop |
| Snake | Arcade | Arrows/WASD |
| Breakout | Action | Arrows/Mouse + Space |
| Invaders | Shooter | Arrows + Space |
| Pong | Sports | Arrows/WS vs CPU |
| Runner | Runner | Space/Up to jump |
| Flappy | Arcade | Space/Up/Click to flap |
| Asteroids | Shooter | Arrows to steer, Space to shoot |
| Match 3 | Puzzle | Click to swap gems |
| Platformer | Platform | Arrows/WASD + Space to jump |
| Dodge | Action | Arrows/AD to dodge |

Plus a **Create** mode that remixes existing engines with fresh prompts.

## How It Works

Each game has 4 mad-libs fields. Type anything — the engine matches keywords to visual themes:

- **Emoji rendering** — type "duck" for paddles and get actual duck emoji stacked as your paddle
- **Color theming** — type "lava" and blocks glow orange-red with animated cracks
- **Particle effects** — type "explode" for line clears and get radial fire bursts
- **Background themes** — type "space" and get a starfield with nebula gradients

Clickable keyword chips below each input show which words trigger effects.

## Tech

Vanilla HTML/CSS/JS. No dependencies, no build step. Each game is a self-contained ES6 class rendering on a shared canvas.

## License

MIT
