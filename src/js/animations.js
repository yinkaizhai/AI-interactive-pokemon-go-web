// Animation related functions
function animateThrow() {
    const elapsed = Date.now() - throwStartTime;
    const progress = Math.min(elapsed / throwDuration, 1);
    const easeProgress = easeInOutQuad(progress);
    const t = easeProgress * 1.1;
    
    if (progress < 1) {
        const z = throwStartPosition.z + (throwDistance * t);
        const a = 4 * throwHeight;
        const x = t - 0.5;
        const y = throwStartPosition.y + (-a * x * x + throwHeight) + (t * 25);
        const worldX = throwStartPosition.x;
        pokeball.position.set(worldX, y, z);
        
        const scale = 1 - (t * 0.5);
        const smoothScale = scale + Math.sin(t * Math.PI * 2) * 0.03;
        pokeball.scale.set(smoothScale, smoothScale, smoothScale);
        
        pokeball.rotation.x += 0.25;
        pokeball.rotation.y += 0.2;
        pokeball.rotation.z += 0.15;
        
        const wobble = Math.sin(t * Math.PI * 4) * 0.1;
        pokeball.rotation.z += wobble;

        if (t > 0.5 && !isCatchingpokemon) {
            const hitQuality = checkCollision();
            if (hitQuality !== false) {
                handleCollision(hitQuality);
                return;
            }
        }
    } else {
        if (!isBouncing) {
            isBouncing = true;
            bounceStartTime = Date.now();
            pokeball.position.set(
                throwStartPosition.x, 
                12,
                throwStartPosition.z + throwDistance
            );
            pokeball.scale.set(0.5, 0.5, 0.5);
        }
    }
}

function animateBounce() {
    const bounceElapsed = Date.now() - bounceStartTime;
    const bounceProgress = Math.min(bounceElapsed / bounceDuration, 1);

    if (bounceProgress < 1) {
        const easeBounceProgress = easeOutQuad(bounceProgress);
        const bounceY = -12 + (bounceHeight * Math.sin(Math.PI * easeBounceProgress));
        pokeball.position.setY(bounceY);
        
        const rotationSpeed = 0.1 * (1 - bounceProgress);
        pokeball.rotation.x += rotationSpeed;
        pokeball.rotation.z += rotationSpeed;
        
        const wobble = Math.sin(bounceProgress * Math.PI * 6) * 0.05;
        pokeball.rotation.z += wobble;
    } else {
        isThrown = false;
        isBouncing = false;
        pokeball.position.set(0, -12, initialZ);
        pokeball.rotation.set(0, 0, 0);
        pokeball.scale.set(1, 1, 1);
    }
}

function startAbsorbAnimation(collisionPosition) {
    const pokemonElement = document.getElementById('pokemon');
    const pokemonRect = pokemonElement.getBoundingClientRect();
    const absorbBeam = document.getElementById('absorbBeam');
    
    // 清空并重新创建光束内部元素
    absorbBeam.innerHTML = '';
    
    // 创建内部光束
    const beamInner = document.createElement('div');
    beamInner.className = 'beam-inner';
    absorbBeam.appendChild(beamInner);
    
    const pokemonCenterX = pokemonRect.left + pokemonRect.width / 2;
    const pokemonCenterY = pokemonRect.top + pokemonRect.height / 2;
    
    const pokeballPos = collisionPosition.clone();
    pokeballPos.project(camera);
    const ballX = (pokeballPos.x + 1) * window.innerWidth / 2;
    const ballY = (-pokeballPos.y + 1) * window.innerHeight / 2;
    
    const beamHeight = Math.sqrt(
        Math.pow(pokemonCenterY - ballY, 2) +
        Math.pow(pokemonCenterX - ballX, 2)
    );
    
    const angle = Math.atan2(pokemonCenterY - ballY, pokemonCenterX - ballX) * (180 / Math.PI) + 180;
    
    // 设置光束的位置和样式
    absorbBeam.style.cssText = `
        display: block;
        position: absolute;
        left: ${ballX}px;
        top: ${ballY}px;
        width: ${beamHeight * 0.15}px;
        height: ${beamHeight}px;
        transform: rotate(${angle}deg);
        transform-origin: top center;
        perspective: 1000px;
        transform-style: preserve-3d;
        pointer-events: none;
        z-index: 1;
        filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.6));
    `;
    
    // 添加发光效果
    const glowEffect = document.createElement('div');
    glowEffect.style.cssText = `
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: ${beamHeight * 0.3}px;
        height: ${beamHeight * 0.3}px;
        background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.9),
            transparent 70%
        );
        border-radius: 50%;
        filter: blur(5px);
    `;
    absorbBeam.appendChild(glowEffect);
    
    // 添加动画类
    absorbBeam.classList.add('beam-animation');
    pokemonElement.classList.add('absorb-flash');
    
    // 开始吸收动画
    absorbStartTime = Date.now();
    
    function animateAbsorb() {
        const elapsed = Date.now() - absorbStartTime;
        const progress = Math.min(elapsed / 600, 1);
        
        if (progress < 1) {
            const easeProgress = progress * progress;
            const scale = 1 - easeProgress * 0.9;
            pokemonElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
            pokemonElement.style.left = '50%';
            pokemonElement.style.top = '20%';
            
            requestAnimationFrame(animateAbsorb);
        } else {
            absorbBeam.classList.remove('beam-animation');
            pokemonElement.classList.remove('absorb-flash');
            absorbBeam.style.display = 'none';
            
            pokemonElement.style.display = 'none';
            pokeball.position.copy(collisionPosition);
            startCatchAnimation();
        }
    }
    
    animateAbsorb();
}

function startCatchAnimation() {
    isCatchingpokemon = true;
    catchShakeCount = 0;
    const totalShakes = catchSuccess ? 3 : (Math.random() < 0.5 ? 1 : 2);
    shakePokeballOnce(totalShakes);
}

function shakePokeballOnce(totalShakes) {
    if (catchShakeCount >= totalShakes) {
        finishCatching();
        return;
    }
    
    const initialPosition = pokeball.position.clone();
    pokeball.rotation.set(0, 0, 0);
    const shakeDuration = 1000;
    let shakeStartTime = Date.now();
    
    function animateShake() {
        const elapsed = Date.now() - shakeStartTime;
        const progress = elapsed / shakeDuration;
        
        if (progress < 1) {
            const angle = Math.sin(progress * Math.PI * 2) * 0.3;
            pokeball.rotation.z = angle;
            
            const bounce = Math.abs(Math.sin(progress * Math.PI * 2)) * 0.5;
            pokeball.position.copy(initialPosition);
            pokeball.position.y += bounce * 0.1;
            
            requestAnimationFrame(animateShake);
        } else {
            pokeball.position.copy(initialPosition);
            catchShakeCount++;
            
            setTimeout(() => {
                if (catchShakeCount < totalShakes) {
                    shakeStartTime = Date.now();
                    animateShake();
                } else {
                    finishCatching();
                }
            }, 500);
        }
    }
    
    animateShake();
}

function finishCatching() {
    if (catchSuccess) {
        showMessage('Gotcha! Pokemon was caught!', true);
        
        // Download the GIF
        const link = document.createElement('a');
        link.href = selectedPokemonGif;
        link.download = `${selectedPokemon}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
            returnToMap(true);
        }, 1500);
    } else {
        showMessage('Oh no! The wild Pokemon broke free!');
        releasePokemon();
    }
    
    isCatchingpokemon = false;
    isThrown = false;
    isBouncing = false;
}

function showMessage(text, isSuccess = false) {
    const message = document.createElement('div');
    message.className = 'game-message ' + (isSuccess ? 'success' : 'fail');
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(message);
        }, 500);
    }, 2500);
}

function releasePokemon() {
    const releaseLight = document.createElement('div');
    releaseLight.className = 'release-light';
    document.body.appendChild(releaseLight);
    
    const lightX = window.innerWidth * 0.5;
    const lightY = window.innerHeight * 0.2;
    
    releaseLight.style.cssText = `
        position: absolute;
        left: ${lightX - 50}px;
        top: ${lightY - 50}px;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%);
        animation: release-flash 0.8s ease-out forwards;
        pointer-events: none;
        z-index: 3;
    `;
    
    const pokemonElement = document.getElementById('pokemon');
    pokemonElement.style.display = 'block';
    pokemonElement.style.transform = 'scale(0.1)';
    pokemonElement.style.left = '50%';
    pokemonElement.style.top = '20%';
    pokemonElement.style.opacity = '0';
    
    const releaseStartTime = Date.now();
    const releaseDuration = 1000;
    
    function animateRelease() {
        const elapsed = Date.now() - releaseStartTime;
        const progress = Math.min(elapsed / releaseDuration, 1);
        
        if (progress < 1) {
            const easeProgress = easeOutElastic(progress);
            const scale = 0.1 + (0.9 * easeProgress);
            const opacity = Math.min(progress * 2, 1);
            
            pokemonElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
            pokemonElement.style.opacity = opacity;
            pokemonElement.style.left = '50%';
            pokemonElement.style.top = '20%';
            
            requestAnimationFrame(animateRelease);
        } else {
            pokemonElement.style.transform = 'translate(-50%, -50%) scale(1)';
            pokemonElement.style.opacity = '1';
            pokemonElement.style.left = '50%';
            pokemonElement.style.top = '20%';
            ispokemonVisible = true;
            
            setTimeout(() => {
                document.body.removeChild(releaseLight);
            }, 800);
            
            pokeball.position.set(0, -12, initialZ);
            pokeball.rotation.set(0, 0, 0);
            pokeball.scale.set(1, 1, 1);
        }
    }
    
    animateRelease();
}

// Export necessary functions
window.startAbsorbAnimation = startAbsorbAnimation;
window.releasePokemon = releasePokemon; 