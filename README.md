# AR Creature Catch - Unofficial Fan Demo

A web-based, unofficial and non-commercial creature-catching experiment. This project uses MediaPipe for hand tracking and Three.js for 3D graphics to create an interactive capture experience in your browser.

## Demo

[![Demo Video](https://img.youtube.com/vi/lPNULsQs6I8/0.jpg)](https://youtu.be/lPNULsQs6I8)


### Key Features
- 🗺️ **Interactive Map**: Explore the world with Pokemon spawns
- 🖐️ **Hand Gestures**: Use natural hand movements to throw Pokeballs
- 🎯 **AI Tracking**: Real-time hand position detection
- ✨ **Visual Effects**: Beautiful capture animations

## Features

- Interactive map with randomly spawning Pokemon
- Hand gesture-based Pokeball throwing mechanics
- AI-powered interactive capture experience
- Location-based gameplay
- Beautiful visual effects and animations
- Mobile-friendly design

## Technologies Used

- Three.js for 3D graphics
- MediaPipe for AI hand tracking and gesture recognition
- MapLibre GL JS with OpenFreeMap map tiles
- HTML5 Canvas for rendering
- Modern CSS3 for animations and styling
- Vanilla JavaScript for game logic

## Prerequisites

- Modern web browser with WebGL support
- Camera access for AI hand tracking
- Internet connection for map data

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yinkaizhai/AI-interactive-pokemon-go-web.git
cd AI-interactive-pokemon-go-web
```

2. Pokemon sprite loading:
   - Animated sprites are loaded at runtime from the credited [PkParaiso sprite page](https://www.pkparaiso.com/espada_escudo/sprites_pokemon.php?cid=14&order=#sprites).
   - No Pokemon GIF sprite files are included in or redistributed by this repository.
   - The application is intended as a non-commercial fan experiment. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

3. Serve the project:
   - Use a local development server (e.g., Live Server in VS Code)
   - Or use Python's built-in server:
     ```bash
     python -m http.server 8000
     ```

### Deploying to GitHub Pages

This is a static site and does not require a build step.

1. In the repository settings, open **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select the `master` branch and the `/ (root)` folder, then save.
4. Open `https://<username>.github.io/AI-interactive-pokemon-go-web/` after the Pages deployment completes.

Camera access requires HTTPS in production; GitHub Pages provides HTTPS.

4. Open in browser:
   - Navigate to `http://localhost:8000`
   - Grant camera permissions when prompted

## Usage

1. Allow camera access when prompted
2. Look for Pokemon markers on the map
3. Click a Pokemon to enter capture mode
4. Use hand gestures to throw Pokeballs:
   - Make a grabbing gesture to hold the Pokeball
   - Move your hand up and forward to throw
   - Time your throw to hit the Pokemon!

### Mobile Controls

- The capture view starts with the front camera for easier one-handed gesture control; use **Use rear camera** when preferred.
- Hold one hand in view, close your fist, lift it, and open it to throw.
- Swipe upward on the capture view to throw when gesture tracking is slow or lighting is difficult.
- Mobile capture uses a lower-latency hand-tracking profile and pauses the camera when returning to the map.

## Project Structure
```
AI-interactive-pokemon-go-web/
├── index.html
├── README.md
├── LICENSE
├── src/
│   ├── js/
│   │   ├── map.js
│   │   ├── capture.js
│   │   ├── animations.js
│   ├── css/
│   │   └── style.css
└── pokemon_files.json
```

## Contributing

Contributions are welcome! This is an open-source project aimed at creating a more comprehensive AI-interactive Pokemon game. Feel free to:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## Credits

- Pokemon GIF sprites displayed from [PkParaiso](https://www.pkparaiso.com/espada_escudo/sprites_pokemon.php?cid=14&order=#sprites)
- Map rendering provided by [MapLibre GL JS](https://maplibre.org/) with tiles from [OpenFreeMap](https://openfreemap.org/)
- Search geocoding provided by [Photon](https://photon.komoot.io/)
- Hand tracking powered by [MediaPipe](https://mediapipe.dev/)
- 3D graphics rendered with [Three.js](https://threejs.org/)

## Future Development Goals

- Multiplayer support
- More interactive Pokemon behaviors
- Advanced AI interactions
- Battle system implementation
- Pokemon evolution mechanics
- Social features and trading

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Important Notes

1. **Pokemon Assets**: The application loads Pokemon GIF files from their source website at runtime and does not include copies in this repository.
2. **Asset Credits**: Pokemon sprites are displayed from PkParaiso for this non-commercial fan experiment; this attribution does not grant additional rights to the assets.
3. **AI Features**: This project uses MediaPipe's AI capabilities for hand tracking and gesture recognition to create an interactive gaming experience.

## Disclaimer

This is an unofficial, non-commercial fan-made project for educational and experimental purposes. Pokemon and related properties are trademarks of Nintendo, Game Freak, and The Pokemon Company. This project is not affiliated with, endorsed by, or sponsored by those rights holders or PkParaiso.
