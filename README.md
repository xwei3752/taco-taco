# Taco Taco - Taco-Themed Fighting Game

A taco-themed fighting game that supports two-player battles.

## Features

- 🎮 Comic-style game graphics
- ⚔️ Rich combat system
- Melee attacks (Left Mouse Button/J)
- Ranged attacks (Right Mouse Button/K)
- Defense system (A Key)
- 🏃‍♂️ Smooth movement controls
- Space Key: Jump
- A Key: Move Backward/Defend
- D Key: Move Forward
- 🌐 Multiplayer battle support
- Real-time synchronization using Multisynq
- Supports multiple players simultaneously

## Installation and Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open `http://localhost:3000` in your browser

## Game Controls

- **Space** - Jump
- **A** - Move Backward/Defend
- **D** - Move Forward
- **Left Mouse Button** - Melee Attack
- **Right Mouse Button** - Ranged Attack

## Tech Stack

- **Phaser.js** - Game engine
- **Vite** - Build tool
- **Multisynq** - Multiplayer synchronization

## Project Structure

```
src/
├── main.js# Game entry
├── scenes/# Game scenes
│├── MenuScene.js# Menu scene
│└── GameScene.js# Main game scene
├── entities/# Game entities
│└── Player.js# Player class
└── utils/# Utility classes
├── PixelFontGenerator.js# Pixel font generator
└── MultiplayerSimulator.js# Multiplayer battle simulator
```

## Development Notes

The game uses Phaser.js's physics engine for collision detection and gravity effects. Player characters feature a complete health system, attack cooldowns, and defense mechanics.

Multiplayer functionality is implemented using Multisynq for real-time data synchronization, including:
- Player position synchronization
- Attack action synchronization
- Health synchronization
- Player join/leave events

## Building for Production

```bash
npm run build
```

The built files will be output to the `dist` directory.

## License

MIT License