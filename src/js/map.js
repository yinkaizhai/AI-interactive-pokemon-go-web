// Map configuration
mapboxgl.accessToken = 'pk.eyJ1IjoiemhhaXlpbmthaSIsImEiOiJjbTNiMGE1amUxajN6MnBvbXpleXF2ZzdjIn0.zuE2gNQaYsC5FjeR85yM_w';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [151.17074, -33.87841],
    zoom: 14,
    maxZoom: 16,
    minZoom: 14,
    pitch: 0,
    bearing: 0,
    dragRotate: false,
    touchZoomRotate: false
});

const nav = new mapboxgl.NavigationControl({
    showCompass: false,
    showZoom: true,
    visualizePitch: false
});
map.addControl(nav, 'top-right');

// Pokemon spawn configuration
const MAX_MARKERS = 80;
const MAX_POKEMON_IN_VIEW = 20;
const MIN_POKEMON_IN_VIEW = 5;
const REFRESH_DELAY = 15000;
const POKEMON_LIFETIME = {
    MIN: 10 * 60 * 30,
    MAX: 20 * 60 * 1000
};

let availableGifs = [];
let markers = [];
let isJustReturnedFromCapture = false;
let lastRefreshTime = Date.now();

// Load Pokemon files
async function loadPokemonFiles() {
    try {
        const response = await fetch('pokemon_files.json');
        const files = await response.json();
        availableGifs = files.map(file => `src/assets/${file}`);
        console.log(`Loaded ${availableGifs.length} Pokemon files`);
    } catch (error) {
        console.error('Failed to load Pokemon list:', error);
        availableGifs = [
            'src/assets/gifs/094-gengar.gif',
            'src/assets/gifs/025-pikachu.gif'
        ];
    }
}

function getRandomGif() {
    if (availableGifs.length === 0) return 'assets/gifs/025-pikachu.gif';
    return availableGifs[Math.floor(Math.random() * availableGifs.length)];
}

async function addRandomGifInView() {
    if (markers.length >= MAX_MARKERS) {
        const oldestMarker = markers.shift();
        oldestMarker.marker.remove();
    }

    const bounds = map.getBounds();
    let lng = bounds._sw.lng + Math.random() * (bounds._ne.lng - bounds._sw.lng);
    let lat = bounds._sw.lat + Math.random() * (bounds._ne.lat - bounds._sw.lat);

    const randomGif = getRandomGif();
    
    const container = document.createElement('div');
    container.className = 'marker-container';

    const background = document.createElement('div');
    background.className = 'marker-background';
    
    const pointer = document.createElement('div');
    pointer.className = 'marker-pointer';

    const gifElement = document.createElement('img');
    gifElement.className = 'gif-marker';
    gifElement.src = randomGif;

    background.appendChild(gifElement);
    container.appendChild(background);
    container.appendChild(pointer);

    const markerDiv = document.createElement('div');
    markerDiv.style.position = 'absolute';
    markerDiv.style.left = '0';
    markerDiv.style.top = '0';
    markerDiv.appendChild(container);
    document.getElementById('map').appendChild(markerDiv);

    function updatePosition() {
        const point = map.project([lng, lat]);
        markerDiv.style.transform = `translate(${point.x - 30}px, ${point.y - 60}px)`;
    }

    updatePosition();
    map.on('move', updatePosition);

    const lifetime = POKEMON_LIFETIME.MIN + Math.random() * (POKEMON_LIFETIME.MAX - POKEMON_LIFETIME.MIN);
    const expireTime = Date.now() + lifetime;

    markers.push({
        marker: {
            remove: () => {
                map.off('move', updatePosition);
                markerDiv.remove();
            },
            getLngLat: () => ({ lng, lat }),
            element: container
        },
        expireTime
    });

    container.addEventListener('click', () => {
        console.log('Pokemon clicked:', randomGif);
        const pokemonName = randomGif.split('/').pop().split('.')[0];
        if (typeof window.startCapture === 'function') {
            window.startCapture(pokemonName, randomGif);
        } else {
            console.error('startCapture function is not available');
        }
    });
}

function checkPokemonInView() {
    const bounds = map.getBounds();
    let count = 0;
    
    const currentTime = Date.now();
    
    markers = markers.filter(({marker, expireTime}) => {
        if (currentTime >= expireTime) {
            marker.remove();
            return false;
        }
        const pos = marker.getLngLat();
        if (bounds.contains(pos)) {
            count++;
        }
        return true;
    });

    if (isJustReturnedFromCapture) {
        isJustReturnedFromCapture = false;
        return;
    }

    if (count >= MAX_POKEMON_IN_VIEW) {
        return;
    }

    if (count > MIN_POKEMON_IN_VIEW) {
        if (currentTime - lastRefreshTime < REFRESH_DELAY) {
            return;
        }
    }

    const needToAdd = Math.min(
        MAX_POKEMON_IN_VIEW - count,
        Math.floor(Math.random() * 3) + 3
    );

    for (let i = 0; i < needToAdd; i++) {
        setTimeout(() => addRandomGifInView(), i * 200);
    }

    lastRefreshTime = currentTime;
}

function searchLocation() {
    const query = document.getElementById('search').value;
    if (!query) return;
    
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&language=en`)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                map.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    duration: 2000
                });
            } else {
                alert("Location not found");
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
            alert("Search error, please try again later");
        });
}

// Event listeners
map.on('moveend', checkPokemonInView);

map.on('dblclick', (e) => {
    e.preventDefault();
    const currentZoom = map.getZoom();
    if (currentZoom < 16) {
        map.easeTo({
            zoom: currentZoom + 0.5,
            duration: 300
        });
    }
});

document.getElementById('searchBtn').addEventListener('click', searchLocation);

document.getElementById('search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchLocation();
    }
}); 