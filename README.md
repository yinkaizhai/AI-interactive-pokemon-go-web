# Pokemon GO Web AR Game

A web-based augmented reality Pokemon catching game inspired by Pokemon GO. This project uses MediaPipe for hand tracking and Three.js for 3D graphics to create an interactive Pokemon catching experience in your browser.

## Demo

https://github.com/yinkaizhai/pokemon-go-web-ar/raw/master/showcase.mp4

## Features

- Interactive map with randomly spawning Pokemon
- Hand gesture-based Pokeball throwing mechanics
- Augmented reality Pokemon capture experience
- Location-based gameplay
- Beautiful visual effects and animations
- Mobile-friendly design

## Technologies Used

- Three.js for 3D graphics
- MediaPipe for hand tracking
- Mapbox for map integration
- HTML5 Canvas for rendering
- Modern CSS3 for animations and styling
- Vanilla JavaScript for game logic

## Prerequisites

- Modern web browser with WebGL support
- Camera access for hand tracking
- Internet connection for map data
- Your own Mapbox API token

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yinkaizhai/pokemon-go-web-ar.git
cd pokemon-go-web-ar
```

2. Download Pokemon GIF assets:
   - Download the GIF pack from [Google Drive](https://drive.google.com/file/d/1xWZTGFYTEHtn_bqpcQE4DPcoNG7zZYLn/view?usp=drive_link)
   - Extract and place all GIF files in the `src/assets/gifs` directory
   - **Important**: The `src/assets/gifs` directory is not included in the repository due to size constraints. You must download and add these files manually.

3. Configure Mapbox:
   - Sign up for a Mapbox account at https://www.mapbox.com
   - Create your API token
   - Replace the token in `src/js/map.js`:
     ```javascript
     mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
     ```

4. Serve the project:
   - Use a local development server (e.g., Live Server in VS Code)
   - Or use Python's built-in server:
     ```bash
     python -m http.server 8000
     ```

5. Open in browser:
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

## Project Structure
```
pokemon-go-web/
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
│   └── assets/
│       └── gifs/
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

- Pokemon GIF sprites from [PkParaiso](https://www.pkparaiso.com/espada_escudo/sprites_pokemon.php?cid=14&order=#sprites)
- Map data provided by [Mapbox](https://www.mapbox.com)
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

1. **Mapbox Token**: The current Mapbox token in the code may be deactivated. Please use your own token for development.
2. **Pokemon Assets**: The Pokemon GIF files need to be downloaded separately from the provided Google Drive link due to size constraints.
3. **Asset Credits**: All Pokemon sprites are sourced from PkParaiso and are used for educational purposes only.

## Disclaimer

This is a fan-made project for educational purposes. Pokemon and related properties are trademarks of Nintendo, Game Freak, and The Pokemon Company. 