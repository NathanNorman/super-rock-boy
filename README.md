# Super Rock Boy

A relaxing browser-based game where you control a rock doing rock things - like rolling down hills and generally being a rock. A peaceful parody of Super Meat Boy.

🎮 **[Play Super Rock Boy Now!](https://nathannorman.github.io/super-rock-boy)** 🎮

## Changelog

### [0.0.1] - 2024-11-23 10:00 EST
#### Added
- Basic project structure with HTML5 Canvas
- Initial rock rendering with:
  - Randomized rocky shape generation
  - Gradient shading for 3D effect
  - Surface details (cracks)
  - Random variations in shape on each load
- Git version control initialization

### [0.0.2] - 2024-11-23 12:00 EST
#### Added
- Basic keyboard movement controls
- Physics system with:
  - Velocity and acceleration
  - Maximum speed limits
  - Friction for smooth deceleration
  - Basic boundary collision

### [0.0.3] - 2024-11-23 14:00 EST
#### Added
- Natural rock physics:
  - Gravity and jumping mechanics
  - Ground collision with bounce effects
  - Wall collision with bounce effects
  - Natural rotation based on movement
  - Smooth movement transitions
#### Improved
- Movement system now feels more "rocky":
  - Rock rolls naturally when moving
  - Rotation speed tied to velocity
  - Clean stopping behavior
  - Different movement physics for ground vs air

### [0.0.4] - 2024-11-23 16:00 EST
#### Added
- Platform system:
  - Multiple platforms at different heights
  - Collision detection and landing mechanics
  - Platform-to-platform jumping

### [0.0.5] - 2024-11-23 18:00 EST
#### Added
- Health system:
  - Health bar UI
  - Damage mechanics
  - Spike obstacles
  - Damage flash effect
- Game Over system:
  - Rock breaking animation
  - Miner character game over screen
  - Restart functionality

### [0.0.6] - 2024-11-23 20:30 EST
#### Added
- Evolution system:
  - 5 rock stages (pebble → diamond)
  - Level-based progression
  - XP system with survival XP
  - Evolution particle effects
  - Different colors and sizes per evolution
- Debug features:
  - Debug panel with game stats
  - Level up/down controls
  - Panel toggle
#### Improved
- Health system:
  - Health increases with evolution
  - Immunity frames after damage
- UI Layout:
  - Fixed health bar position
  - Added XP bar
  - Evolution status display

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A text editor if you want to modify the code
- Git (for version control)
- No additional installations required!

### Running the Game
1. Clone or download this repository to your local machine
2. Open the `index.html` file in your web browser
   - You can do this by double-clicking the file
   - Or by dragging it into your browser window
   - Or by right-clicking and selecting "Open with" your preferred browser

### Development Setup
If you want to modify the code:
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd super-rock-boy
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:8080`
5. Make your changes and refresh the browser to see updates

### Running Tests
```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Version Control
This project uses Git for version control. Currently maintained as a local repository.

### Branching Strategy
- `main`: Stable releases
- `develop`: Active development (create feature branches from here)
- Feature branches: Use format `feature/description`

## Project Structure
```
super-rock-boy/
├── index.html      # Main HTML file
├── css/
│   └── style.css   # Styling
├── js/
│   └── game.js     # Game logic
└── assets/
    └── images/     # Game graphics (coming soon)
```

## Controls
- Arrow Keys:
  - Left/Right: Roll the rock
  - Up: Jump
- Movement features:
  - Natural rolling motion based on velocity
  - Air control (reduced movement speed while jumping)
  - Bounce effects on hard landings
  - Smooth deceleration to stop

## Current Status
This is an early development version (0.0.6) with the following features complete:
- Natural rock movement physics
- Platform system
- Health and damage system
- Evolution system with 5 stages
- Debug features

Features coming soon:
- Level design and obstacles
- Collectibles and objectives
- Background art and particles
- Sound effects and music

## Contributing
This is a fun, open project! Feel free to submit issues or pull requests.

## License
[Add your chosen license here]