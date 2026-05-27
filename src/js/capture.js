// Global variables for capture page
let scene, camera, renderer;
let hands, videoElement, canvasElement, canvasCtx;
let isGrabbing = false;
let throwDetected = false;
let lastPalmY = null;
let lastThrowTime = 0;
let canDetectThrow = true;
let throwingState = 'none';
let moveStartTime = 0;
let isThrown = false;
let throwStartTime = 0;
let throwStartPosition = new THREE.Vector3();
let prevHandX = null;
let isBouncing = false;
let bounceStartTime = 0;
let bounceProgress = 0;
let handFirstDetectedTime = null;
let isHandReady = false;
let isAbsorbing = false;
let absorbStartTime = 0;
let pokeball;
let ispokemonVisible = false;
let isCatchingpokemon = false;
let catchShakeCount = 0;
let catchSuccess = false;
let currentPage = 'map';
let selectedPokemon = null;
let selectedPokemonGif = null;
let mediaStream = null;
let trackingFrameId = null;
let inferencePending = false;
let lastInferenceTime = 0;
let activeFacingMode = 'user';
let trackingGeneration = 0;
let touchThrowStart = null;
let lastRenderTime = 0;

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

// Constants
const ABSORB_DURATION = 1000;
const BOUNCE_BACK_DISTANCE = 2;
const throwDuration = 1500;
const throwHeight = 15;
const throwDistance = -80;
const bounceHeight = 2;
const bounceDuration = 400;
const initialZ = 15;
const HAND_INFERENCE_INTERVAL = 1000 / (isMobile ? 20 : 30);
const CAPTURE_RENDER_INTERVAL = 1000 / (isMobile ? 30 : 60);

function initCapturePage() {
    // Set up video and canvas
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('outputCanvas');
    canvasCtx = canvasElement.getContext('2d');

    // Three.js setup
    setupThreeJS();
    
    // Initialize MediaPipe Hands
    setupMediaPipe();
    startHandTracking();
    setupTouchControls();

    // Start animation loop
    animate();
}

function setupThreeJS() {
    scene = new THREE.Scene();
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -15 * aspectRatio, 15 * aspectRatio,
        15, -15,
        0.1, 1000
    );
    
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('threeCanvas'), 
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2));
    resizeCaptureScene();

    createPokeball();
    setupLighting();
}

function createPokeball() {
    const size = 0.8;
    const segments = isMobile ? 16 : 32;
    
    const topGeometry = new THREE.SphereGeometry(size, segments, segments, 0, Math.PI * 2, 0, Math.PI / 2);
    const topMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    });
    const topHalf = new THREE.Mesh(topGeometry, topMaterial);
    
    const bottomGeometry = new THREE.SphereGeometry(size, segments, segments, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 100,
        specular: 0x444444,
        side: THREE.DoubleSide
    });
    const bottomHalf = new THREE.Mesh(bottomGeometry, bottomMaterial);

    pokeball = new THREE.Group();
    pokeball.add(topHalf);
    pokeball.add(bottomHalf);

    const ringGeometry = new THREE.RingGeometry(size * 0.15, size * 0.25, segments);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.z = size * 1.01;
    ring.rotation.y = Math.PI;
    pokeball.add(ring);

    const innerCircleGeometry = new THREE.CircleGeometry(size * 0.15, segments);
    const innerCircleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    const innerCircle = new THREE.Mesh(innerCircleGeometry, innerCircleMaterial);
    innerCircle.position.z = size * 1.0;
    innerCircle.rotation.y = Math.PI;
    pokeball.add(innerCircle);

    scene.add(pokeball);
    pokeball.position.set(0, -12, initialZ);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    camera.position.set(0, -5, 60);
    camera.lookAt(0, 5, -60);
    renderer.setClearColor(0x000000, 0);
}

function setupMediaPipe() {
    if (hands) {
        return;
    }

    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: isMobile ? 0 : 1,
        minDetectionConfidence: isMobile ? 0.55 : 0.5,
        minTrackingConfidence: isMobile ? 0.5 : 0.5,
    });

    hands.onResults(handleHandResults);
}

async function startHandTracking() {
    stopHandTracking();
    updateCameraButton();
    const requestedGeneration = trackingGeneration;

    try {
        const requestedStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: { ideal: activeFacingMode },
                width: { ideal: isMobile ? 320 : 640 },
                height: { ideal: isMobile ? 240 : 480 },
                frameRate: { ideal: isMobile ? 24 : 30, max: isMobile ? 24 : 30 }
            }
        });
        if (requestedGeneration !== trackingGeneration || currentPage !== 'capture') {
            requestedStream.getTracks().forEach(track => track.stop());
            return;
        }
        mediaStream = requestedStream;
        videoElement.srcObject = mediaStream;
        videoElement.muted = true;
        await videoElement.play();
        document.querySelector('.camera-error')?.remove();
        lastInferenceTime = 0;
        trackingFrameId = requestAnimationFrame(processHandFrame);
    } catch (error) {
        if (requestedGeneration === trackingGeneration && currentPage === 'capture') {
            handleCameraError(error);
        }
    }
}

function stopHandTracking() {
    trackingGeneration += 1;
    touchThrowStart = null;
    if (trackingFrameId) {
        cancelAnimationFrame(trackingFrameId);
        trackingFrameId = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
    }
    if (canvasCtx && canvasElement) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
}

function processHandFrame(timestamp) {
    if (currentPage !== 'capture' || !mediaStream) {
        return;
    }
    if (!inferencePending && videoElement.readyState >= 2 &&
        timestamp - lastInferenceTime >= HAND_INFERENCE_INTERVAL) {
        lastInferenceTime = timestamp;
        inferencePending = true;
        hands.send({ image: videoElement })
            .catch(error => console.warn('Hand tracking frame skipped:', error))
            .finally(() => {
                inferencePending = false;
            });
    }
    trackingFrameId = requestAnimationFrame(processHandFrame);
}

async function switchCaptureCamera() {
    activeFacingMode = activeFacingMode === 'user' ? 'environment' : 'user';
    const cameraButton = document.getElementById('switchCameraBtn');
    cameraButton.disabled = true;
    await startHandTracking();
    cameraButton.disabled = false;
}

function updateCameraButton() {
    const cameraButton = document.getElementById('switchCameraBtn');
    const cameraPreview = document.querySelector('.camera-preview');
    if (cameraButton) {
        cameraButton.textContent = activeFacingMode === 'user' ? 'Use rear camera' : 'Use front camera';
    }
    if (cameraPreview) {
        cameraPreview.classList.toggle('is-mirrored', activeFacingMode === 'user');
    }
}

function handleHandResults(results) {
    if (currentPage !== 'capture') {
        return;
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);

    if (results.multiHandLandmarks?.length && results.multiHandedness?.length) {
        if (handFirstDetectedTime === null) {
            handFirstDetectedTime = Date.now();
            isHandReady = false;
        } else if (!isHandReady && Date.now() - handFirstDetectedTime >= 500) {
            isHandReady = true;
        }

        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i].label;

            if (isHandReady) {
                handleHandGestures(landmarks, handedness);
            }

            drawHandLandmarks(landmarks);
        }
    } else {
        handFirstDetectedTime = null;
        isHandReady = false;
        isGrabbing = false;
        if (!isThrown) {
            throwingState = 'none';
        }
    }

    canvasCtx.restore();
}

function handleHandGestures(landmarks, handedness) {
    const grabbing = isGrabbingGesture(landmarks);
    if (grabbing !== isGrabbing) {
        isGrabbing = grabbing;
    }

    if (isGrabbing && !isThrown && !isBouncing) {
        const palmX = 1 - landmarks[0].x;
        const normalizedX = (palmX * 2) - 1;
        updatePokeballPosition(normalizedX);
    }

    if (detectThrowGesture(landmarks)) {
        throwDetected = true;
        setTimeout(() => {
            throwDetected = false;
        }, 800);
    }
}

function handleCameraError(error) {
    console.error('Camera start error:', error);
    const errorMessage = document.querySelector('.camera-error') || document.createElement('div');
    errorMessage.className = 'camera-error';
    errorMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
    `;
    errorMessage.innerHTML = `
        Cannot access camera<br>
        Please ensure camera permissions are granted<br>
        and refresh the page to try again
    `;
    if (!errorMessage.parentNode) {
        document.body.appendChild(errorMessage);
    }
}

// Animation functions
function animate(timestamp = 0) {
    requestAnimationFrame(animate);

    if (currentPage !== 'capture') {
        return;
    }
    if (isMobile && timestamp - lastRenderTime < CAPTURE_RENDER_INTERVAL) {
        return;
    }
    lastRenderTime = timestamp;

    if (isThrown && !isCatchingpokemon) {
        animateThrow();
    }

    if (isBouncing) {
        animateBounce();
    }

    renderer.render(scene, camera);
}

function resizeCaptureScene() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    if (canvasElement) {
        const overlayScale = isMobile ? 0.75 : 1;
        canvasElement.width = Math.round(width * overlayScale);
        canvasElement.height = Math.round(height * overlayScale);
    }
    if (camera) {
        camera.left = -15 * aspectRatio;
        camera.right = 15 * aspectRatio;
        camera.top = 15;
        camera.bottom = -15;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(width, height, false);
    }
}

function setupTouchControls() {
    if (!isMobile) {
        return;
    }

    const touchCanvas = document.getElementById('threeCanvas');
    touchCanvas.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' || isThrown || isCatchingpokemon) {
            return;
        }
        touchThrowStart = { id: event.pointerId, y: event.clientY };
        updatePokeballPosition((event.clientX / window.innerWidth) * 2 - 1);
    });
    touchCanvas.addEventListener('pointermove', event => {
        if (!touchThrowStart || event.pointerId !== touchThrowStart.id || isThrown) {
            return;
        }
        updatePokeballPosition((event.clientX / window.innerWidth) * 2 - 1);
    });
    touchCanvas.addEventListener('pointerup', event => {
        if (!touchThrowStart || event.pointerId !== touchThrowStart.id) {
            return;
        }
        const verticalDistance = touchThrowStart.y - event.clientY;
        touchThrowStart = null;
        if (verticalDistance > 45) {
            throwDetected = true;
            setTimeout(() => {
                throwDetected = false;
            }, 500);
            launchThrow();
        }
    });
    touchCanvas.addEventListener('pointercancel', () => {
        touchThrowStart = null;
    });
}

// Utility functions
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutQuad(t) {
    const t1 = 1 - t;
    return 1 - t1 * t1;
}

function easeOutElastic(t) {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

function startCapture(pokemonName, gifPath) {
    currentPage = 'capture';
    lastRenderTime = 0;
    selectedPokemon = pokemonName;
    selectedPokemonGif = gifPath;
    
    document.getElementById('mapPage').style.display = 'none';
    document.getElementById('capturePage').style.display = 'block';
    
    const pokemonElement = document.getElementById('pokemon');
    pokemonElement.src = gifPath;
    pokemonElement.style.display = 'block';
    pokemonElement.style.transform = 'translate(-50%, -50%) scale(1)';
    pokemonElement.style.left = '50%';
    pokemonElement.style.top = '20%';
    pokemonElement.style.opacity = '1';
    
    document.querySelector('.battle-platform').style.display = 'block';
    ispokemonVisible = true;
    
    if (!scene) {
        initCapturePage();
    } else {
        // Reset state
        isThrown = false;
        isGrabbing = false;
        throwDetected = false;
        isCatchingpokemon = false;
        isBouncing = false;
        canDetectThrow = true;
        throwingState = 'none';
        lastPalmY = null;
        handFirstDetectedTime = null;
        isHandReady = false;
        
        // Reset pokeball
        pokeball.position.set(0, -12, initialZ);
        pokeball.rotation.set(0, 0, 0);
        pokeball.scale.set(1, 1, 1);
        startHandTracking();
    }
}

function returnToMap(captured) {
    currentPage = 'map';
    
    document.getElementById('mapPage').style.display = 'block';
    document.getElementById('capturePage').style.display = 'none';
    stopHandTracking();
    document.querySelector('.camera-error')?.remove();
    
    if (captured && selectedPokemon) {
        // Remove the captured Pokemon's marker
        markers = markers.filter(({marker}) => {
            const markerImg = marker.element.querySelector('.gif-marker');
            if (markerImg && markerImg.src === selectedPokemonGif) {
                marker.remove();
                return false;
            }
            return true;
        });
    }
    
    selectedPokemon = null;
    selectedPokemonGif = null;
    isJustReturnedFromCapture = true;
    
    // Reset capture page state
    isThrown = false;
    isGrabbing = false;
    throwDetected = false;
    isCatchingpokemon = false;
    isBouncing = false;
    canDetectThrow = true;
    throwingState = 'none';
    lastPalmY = null;
    handFirstDetectedTime = null;
    isHandReady = false;
    
    if (pokeball) {
        pokeball.position.set(0, -12, initialZ);
        pokeball.rotation.set(0, 0, 0);
        pokeball.scale.set(1, 1, 1);
    }
}

function isGrabbingGesture(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerMids = [7, 11, 15, 19];
    
    let bentFingers = 0;
    for (let i = 0; i < fingerTips.length; i++) {
        const tipY = landmarks[fingerTips[i]].y;
        const midY = landmarks[fingerMids[i]].y;
        
        const threshold = isMobile ? 0.02 : 0;
        if (tipY > midY + threshold) {
            bentFingers++;
        }
    }

    const thumbTip = landmarks[4];
    const indexBase = landmarks[5];
    const thumbDistance = Math.sqrt(
        Math.pow(thumbTip.x - indexBase.x, 2) + 
        Math.pow(thumbTip.y - indexBase.y, 2)
    );

    const thumbThreshold = isMobile ? 0.15 : 0.12;
    return bentFingers >= 3 && thumbDistance < thumbThreshold;
}

function detectThrowGesture(landmarks) {
    if (!canDetectThrow) return false;

    const currentTime = Date.now();
    const palmBase = landmarks[0];
    
    if (lastPalmY === null) {
        lastPalmY = palmBase.y;
        return false;
    }

    const moveThreshold = isMobile ? 0.012 : 0.008;
    const moveDistanceY = lastPalmY - palmBase.y;
    lastPalmY = palmBase.y * 0.8 + lastPalmY * 0.2;

    switch (throwingState) {
        case 'none':
            if (isGrabbing) {
                throwingState = 'grabbing';
            }
            break;

        case 'grabbing':
            if (!isGrabbing) {
                throwingState = 'none';
            } else if (moveDistanceY > moveThreshold) {
                throwingState = 'moving';
                moveStartTime = currentTime;
            }
            break;

        case 'moving':
            const timeInMoving = currentTime - moveStartTime;
            
            if (!isGrabbing) {
                throwingState = 'none';
                
                if (timeInMoving < 100) {
                    return false;
                }
                
                launchThrow(currentTime);
                return true;
            } else if (timeInMoving > 1000) {
                throwingState = 'grabbing';
            }
            break;
    }

    return false;
}

function launchThrow(startTime = Date.now()) {
    if (isThrown || isCatchingpokemon || !pokeball) {
        return;
    }
    canDetectThrow = false;
    setTimeout(() => {
        canDetectThrow = true;
    }, isMobile ? 1500 : 2000);
    isThrown = true;
    throwStartTime = startTime;
    throwStartPosition.copy(pokeball.position);
}

function drawHandLandmarks(landmarks) {
    canvasCtx.save();
    for (const point of landmarks) {
        const x = point.x * canvasElement.width;
        const y = point.y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 3, 0, 2 * Math.PI);

        let color;
        if (!isHandReady) {
            color = 'gray';
        } else if (!canDetectThrow) {
            color = 'gray';
        } else {
            switch (throwingState) {
                case 'grabbing':
                    color = 'yellow';
                    break;
                case 'moving':
                    color = 'orange';
                    break;
                case 'throwing':
                    color = 'green';
                    break;
                default:
                    color = isGrabbing ? 'yellow' : 'red';
            }
        }
        
        canvasCtx.fillStyle = throwDetected ? 'green' : color;
        canvasCtx.fill();
    }
    canvasCtx.restore();
}

function updatePokeballPosition(worldX) {
    if (isCatchingpokemon) return;
    
    const maxX = 12;
    const clampedX = Math.max(Math.min(worldX * 8, maxX), -maxX);
    pokeball.position.set(clampedX, -12, initialZ);
}

function abandonCapture() {
    returnToMap(false);
}

function checkCollision() {
    if (!ispokemonVisible || isCatchingpokemon) return false;
    
    const pokeballPosition = new THREE.Vector3();
    pokeball.getWorldPosition(pokeballPosition);
    
    const vector = pokeballPosition.clone();
    vector.project(camera);
    
    const x = (vector.x + 1) * window.innerWidth / 2;
    const y = (-vector.y + 1) * window.innerHeight / 2;
    
    const pokemonRect = document.getElementById('pokemon').getBoundingClientRect();
    const pokemonCenterX = pokemonRect.left + pokemonRect.width / 2;
    const pokemonCenterY = pokemonRect.top + pokemonRect.height / 2;
    
    const distance = Math.sqrt(
        Math.pow(x - pokemonCenterX, 2) +
        Math.pow(y - pokemonCenterY, 2)
    );
    
    if (distance < 50) {
        const hitQuality = Math.max(0, 1 - (distance / 50));
        return hitQuality;
    }
    
    return false;
}

function handleCollision(hitQuality) {
    if (!ispokemonVisible || isCatchingpokemon) return;
    
    isThrown = false;
    isCatchingpokemon = true;
    
    const catchProbability = 0.4 + (hitQuality * 0.6);
    catchSuccess = Math.random() < catchProbability;
    
    const pokemonRect = document.getElementById('pokemon').getBoundingClientRect();
    const pokemonX = pokemonRect.left + pokemonRect.width / 2;
    const pokemonY = pokemonRect.top;
    
    const vector = new THREE.Vector3(
        (pokemonX / window.innerWidth) * 2 - 1,
        -(pokemonY / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    
    const ballOffset = new THREE.Vector3(-2, 2, 0);
    const targetPosition = vector.add(ballOffset);
    
    const startPosition = pokeball.position.clone();
    const moveStartTime = Date.now();
    const moveDuration = 300;
    
    function animateMove() {
        const elapsed = Date.now() - moveStartTime;
        const progress = Math.min(elapsed / moveDuration, 1);
        
        if (progress < 1) {
            const easeProgress = easeOutQuad(progress);
            pokeball.position.lerpVectors(startPosition, targetPosition, easeProgress);
            requestAnimationFrame(animateMove);
        } else {
            pokeball.position.copy(targetPosition);
            startAbsorbAnimation(targetPosition);
        }
    }
    
    animateMove();
}

// Export necessary functions
window.initCapturePage = initCapturePage;
window.startCapture = startCapture;
window.returnToMap = returnToMap;
window.abandonCapture = abandonCapture;
window.switchCaptureCamera = switchCaptureCamera;
window.resizeCaptureScene = resizeCaptureScene;

// Export additional functions
window.checkCollision = checkCollision;
window.handleCollision = handleCollision;
