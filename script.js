// ========== GAME SHOWCASE INTERACTIVE FEATURES ==========

// Game Statistics
let gameStats = {
    highScore: 0,
    levelsCompleted: 0,
    gamesPlayed: 0,
    currentStreak: 0
};

// Load stats from localStorage
function loadGameStats() {
    const saved = localStorage.getItem('jumpGameStats');
    if (saved) {
        gameStats = { ...gameStats, ...JSON.parse(saved) };
    }
}

// Save stats to localStorage
function saveGameStats() {
    localStorage.setItem('jumpGameStats', JSON.stringify(gameStats));
}

// Initialize all interactive features
function initGameShowcase() {
    loadGameStats();
}

// ========== ICY TOWER GAME ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Game State
let gameState = 'start'; // start, playing, gameOver, levelComplete, levelTransition
let score = 0;
let highScore = 0;
let combo = 0;
let floor = 0;
let cameraY = 0;

// Level System
let currentLevel = 1;
let maxLevel = 3;
let levelProgress = 0;
let levelCompleteThreshold = 1000;
let levelMultiplier = 1;
let topPlatformY = 0; // Track the highest platform Y-coordinate
let targetTopPlatformY = 0; // Fixed target for level completion
let maxPlatformsPerLevel = 20; // Maximum platforms to generate per level
let platformCount = 0; // Track number of platforms generated
let levelCompleteTriggered = false; // Flag to ensure level completion triggers only once

// Player
const player = {
    x: 200,
    y: 500,
    width: 30,
    height: 40,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: 15,
    gravity: 0.6,
    onGround: false,
    color: '#00d4ff'
};

// Platforms
let platforms = [];
const platformHeight = 15;
let lastPlatformY = canvas ? canvas.height - 50 : 0;

// Controls
const keys = {};

// Level Configurations
const levelConfigs = {
    1: {
        name: "The Beginning",
        minGap: 60,
        maxGap: 100,
        minWidth: 80,
        maxWidth: 200,
        color: '#7b2ff7',
        multiplier: 1
    },
    2: {
        name: "Rising Challenge", 
        minGap: 80,
        maxGap: 120,
        minWidth: 60,
        maxWidth: 150,
        color: '#ff006e',
        multiplier: 1.5
    },
    3: {
        name: "Expert Heights",
        minGap: 100,
        maxGap: 150,
        minWidth: 50,
        maxWidth: 120,
        color: '#00d4ff',
        multiplier: 2
    }
};

// Initialize platforms
function initPlatforms() {
    platforms = [];
    lastPlatformY = canvas.height - 50;
    topPlatformY = canvas.height - 50; // Initialize with starting platform
    platformCount = 0; // Reset platform count
    
    // Starting platform
    platforms.push({
        x: 0,
        y: canvas.height - 50,
        width: canvas.width,
        height: platformHeight,
        color: '#7b2ff7'
    });

    // Generate initial platforms
    for (let i = 0; i < maxPlatformsPerLevel; i++) {
        generatePlatform();
    }
    
    // Set the fixed target for level completion (the topmost platform)
    targetTopPlatformY = topPlatformY;
}

// Generate new platform
function generatePlatform() {
    const config = levelConfigs[currentLevel];
    const minGap = config.minGap + Math.floor(score / 500) * 5;
    const maxGap = config.maxGap + Math.floor(score / 500) * 8;
    const gap = Math.random() * (maxGap - minGap) + minGap;
    
    lastPlatformY -= gap;
    
    const width = Math.random() * (config.maxWidth - config.minWidth) + config.minWidth;
    const x = Math.random() * (canvas.width - width);
    
    const newPlatform = {
        x: x,
        y: lastPlatformY,
        width: width,
        height: platformHeight,
        color: config.color
    };
    
    platforms.push(newPlatform);
    platformCount++;
    
    // Update top platform tracking
    if (lastPlatformY < topPlatformY) {
        topPlatformY = lastPlatformY;
    }
}

// Reset game
function resetGame() {
    player.x = 200;
    player.y = 500;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    score = 0;
    combo = 0;
    floor = 0;
    cameraY = 0;
    currentLevel = 1;
    levelProgress = 0;
    levelCompleteThreshold = 1000;
    levelMultiplier = 1;
    topPlatformY = canvas.height - 50; // Reset top platform tracking
    platformCount = 0; // Reset platform count
    levelCompleteTriggered = false; // Reset level completion flag
    gameState = 'playing';
    initPlatforms();

    // Track game start
    gameStats.gamesPlayed++;
    gameStats.currentStreak++;
    saveGameStats();
}

// Check level completion
function checkLevelComplete() {
    // Only check if we haven't already triggered level completion
    if (levelCompleteTriggered) return;

    // Check if player reached the top platform
    if (gameState === 'playing' && currentLevel <= maxLevel) {
        // Find the actual top platform (excluding the starting platform at the bottom)
        const topPlatform = platforms.reduce((highest, platform) => {
            // Exclude the starting platform (the wide one at the bottom)
            if (platform.width === canvas.width) return highest;
            return platform.y < highest.y ? platform : highest;
        }, platforms[1] || platforms[0]);

        // Player must be STANDING ON the top platform (landed on it)
        // Check if player's bottom is touching the platform's top
        const isOnTopPlatform = player.onGround &&
                                Math.abs(player.y + player.height - topPlatform.y) < 5 &&
                                player.x + player.width > topPlatform.x &&
                                player.x < topPlatform.x + topPlatform.width;

        if (isOnTopPlatform) {
            gameState = 'levelComplete';
            levelProgress = 100;
            levelCompleteTriggered = true;
        }
    }
}

// Advance to next level
function advanceLevel() {
    if (currentLevel < maxLevel) {
        currentLevel++;
        levelProgress = 0;
        levelCompleteThreshold = currentLevel * 1000;
        levelMultiplier = levelConfigs[currentLevel].multiplier;
        gameState = 'levelTransition';
        levelCompleteTriggered = false; // Reset the flag for the new level

        // Track level completion
        gameStats.levelsCompleted = Math.max(gameStats.levelsCompleted, currentLevel - 1);
        saveGameStats();

        // Reset player position and physics for new level
        player.x = 200;
        player.y = 500;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        floor = 0;
        cameraY = 0;
        combo = 0;
        score = 0; // Reset score for new level
        topPlatformY = canvas.height - 50; // Reset top platform tracking
        platformCount = 0; // Reset platform count

        // Reset platforms for new level
        initPlatforms();

        // Brief transition before continuing
        setTimeout(() => {
            gameState = 'playing';
        }, 2000);
    } else {
        // Game completed
        gameState = 'gameComplete';
        gameStats.levelsCompleted = Math.max(gameStats.levelsCompleted, currentLevel);
        saveGameStats();
    }
}

// Update game
function update() {
    if (gameState !== 'playing') return;

    // Player movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.vx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.vx = player.speed;
    } else {
        player.vx *= 0.8; // Friction
    }

    // Jumping
    if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && player.onGround) {
        player.vy = -player.jumpPower;
        player.onGround = false;
    }

    // Apply physics
    player.x += player.vx;
    player.y += player.vy;
    player.vy += player.gravity;

    // Wrap around screen horizontally
    if (player.x + player.width < 0) {
        player.x = canvas.width;
    } else if (player.x > canvas.width) {
        player.x = -player.width;
    }

    // Camera follow
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        cameraY += diff * 0.1;
        player.y += diff * 0.1;
        
        // Move platforms down
        platforms.forEach(platform => {
            platform.y += diff * 0.1;
        });
        
        // Update score based on height
        const newFloor = Math.floor(-cameraY / 50);
        if (newFloor > floor) {
            const floorsDiff = newFloor - floor;
            score += floorsDiff * 10 * (combo + 1) * levelMultiplier;
            floor = newFloor;

            // Update level progress based on height (how close to top platform)
            // Find the current top platform
            if (platforms.length > 0) {
                const currentTopPlatform = platforms.reduce((highest, platform) => {
                    return platform.y < highest.y ? platform : highest;
                }, platforms[0]);

                const totalHeight = canvas.height - 50 - currentTopPlatform.y;
                const currentHeight = canvas.height - 50 - player.y;
                levelProgress = Math.min(Math.max((currentHeight / totalHeight) * 100, 0), 100);
            }
        }
    }

    // Platform collision
    player.onGround = false;
    platforms.forEach(platform => {
        if (player.vy > 0 &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height + 10 &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width) {
            
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;
            
            // Combo system with level multiplier
            if (platform !== platforms[0]) { // Not the ground
                combo++;
                score += combo * 5 * levelMultiplier;
            }
        }
    });

    // Reset combo if on ground
    if (player.onGround && platforms[0] && 
        player.y + player.height >= platforms[0].y) {
        combo = 0;
    }

    // Check level completion
    checkLevelComplete();

    // Game over if fell off screen
    if (player.y > canvas.height + 100) {
        gameState = 'gameOver';
        if (score > highScore) {
            highScore = score;
        }
        
        // Track high score and reset streak
        if (score > gameStats.highScore) {
            gameStats.highScore = score;
        }
        gameStats.currentStreak = 0;
        saveGameStats();
    }

    // Generate new platforms only if we haven't reached the limit
    if (platforms[platforms.length - 1].y > 0 && platformCount < maxPlatformsPerLevel) {
        generatePlatform();
    }

    // Remove off-screen platforms
    platforms = platforms.filter(platform => platform.y < canvas.height + 100);
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw start screen
    if (gameState === 'start') {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('JUMP', canvas.width / 2, 150);
        
        ctx.font = '18px Inter';
        ctx.fillStyle = '#a0aec0';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, 250);
        
        ctx.fillText('← → or A D to Move', canvas.width / 2, 300);
        ctx.fillText('SPACE or W or ↑ to Jump', canvas.width / 2, 330);
        ctx.fillText('R to Restart', canvas.width / 2, 360);
        
        if (highScore > 0) {
            ctx.font = 'bold 24px Inter';
            ctx.fillStyle = '#00d4ff';
            ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 450);
        }
        return;
    }

    // Draw level complete screen
    if (gameState === 'levelComplete') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#27c93f';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, 200);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Inter';
        ctx.fillText(`Level ${currentLevel} Complete`, canvas.width / 2, 270);
        ctx.fillText(`Score: ${score}`, canvas.width / 2, 310);
        
        ctx.fillStyle = '#a0aec0';
        ctx.font = '18px Inter';
        ctx.fillText('Press SPACE to Continue', canvas.width / 2, 380);
        return;
    }

    // Draw level transition screen
    if (gameState === 'levelTransition') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const config = levelConfigs[currentLevel];
        ctx.fillStyle = config.color;
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${currentLevel}`, canvas.width / 2, 200);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Inter';
        ctx.fillText(config.name, canvas.width / 2, 250);
        
        ctx.fillStyle = '#a0aec0';
        ctx.font = '18px Inter';
        ctx.fillText('Get Ready...', canvas.width / 2, 300);
        return;
    }

    // Draw game complete screen
    if (gameState === 'gameComplete') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 36px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('GAME COMPLETE!', canvas.width / 2, 200);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Inter';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 270);
        ctx.fillText('Congratulations!', canvas.width / 2, 310);
        
        ctx.fillStyle = '#a0aec0';
        ctx.font = '18px Inter';
        ctx.fillText('Press R to Play Again', canvas.width / 2, 380);
        return;
    }

    // Draw game over screen
    if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff006e';
        ctx.font = 'bold 48px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, 200);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Inter';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, 270);
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 310);
        
        ctx.fillStyle = '#a0aec0';
        ctx.font = '18px Inter';
        ctx.fillText('Press R to Restart', canvas.width / 2, 380);
        return;
    }

    // Draw platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform shine effect
        const gradient = ctx.createLinearGradient(platform.x, platform.y, 
            platform.x, platform.y + platform.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    // Draw UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Floor: ${floor}`, 20, 70);
    
    if (combo > 0) {
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 28px Inter';
        ctx.fillText(`Combo x${combo}!`, 20, 105);
    }
    
    // Level UI
    const config = levelConfigs[currentLevel];
    ctx.fillStyle = config.color;
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`Level ${currentLevel}: ${config.name}`, canvas.width - 20, 40);
    
    // Level progress bar
    const progressWidth = 200;
    const progressHeight = 8;
    const progressX = canvas.width - progressWidth - 20;
    const progressY = 60;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
    
    ctx.fillStyle = config.color;
    ctx.fillRect(progressX, progressY, (levelProgress / 100) * progressWidth, progressHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(levelProgress)}%`, canvas.width - 20, progressY + 20);
    
    ctx.fillStyle = '#a0aec0';
    ctx.font = '16px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${highScore}`, canvas.width - 20, 100);
}

// Game loop
function gameLoop() {
    if (!canvas || !ctx) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Start game
    if (gameState === 'start' && e.key === ' ') {
        resetGame();
    }
    
    // Level complete - continue to next level
    if (gameState === 'levelComplete' && e.key === ' ') {
        advanceLevel();
    }
    
    // Restart game
    if (gameState === 'gameOver' && (e.key === 'r' || e.key === 'R')) {
        resetGame();
    }
    
    // Game complete - restart
    if (gameState === 'gameComplete' && (e.key === 'r' || e.key === 'R')) {
        resetGame();
    }
    
    // Prevent scrolling ONLY when not in input fields
    if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        // Check if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isTyping = activeElement.tagName === 'INPUT' || 
                         activeElement.tagName === 'TEXTAREA';
        
        if (!isTyping) {
        e.preventDefault();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize and start game loop
if (canvas && ctx) {
    initPlatforms();
    gameLoop();
}

// Initialize game showcase features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGameShowcase();
    initEmailModal();
    initProjects();
    initMobileMenu();
    initTechTagTooltips();
});

// ========== MOBILE MENU TOGGLE ==========
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when a link is clicked
        navLinksItems.forEach(item => {
            item.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Close menu on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

// ========== TECH TAG TOOLTIPS (HOVER / FOCUS / TAP) ==========
function initTechTagTooltips() {
    const tooltipId = 'techTooltip';
    const showDurationMs = 1600;
    const edgePadding = 12;
    const offset = 12;

    let tooltipEl = document.getElementById(tooltipId);
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = tooltipId;
        tooltipEl.className = 'tech-tooltip';
        tooltipEl.setAttribute('role', 'tooltip');
        document.body.appendChild(tooltipEl);
    }

    const timeouts = new WeakMap();
    let activeTarget = null;

    const clearTargetTimeout = (el) => {
        const t = timeouts.get(el);
        if (t) window.clearTimeout(t);
        timeouts.delete(el);
    };

    const hideTooltip = () => {
        if (activeTarget) activeTarget.removeAttribute('aria-describedby');
        activeTarget = null;
        tooltipEl.classList.remove('tech-tooltip--visible');
        tooltipEl.style.visibility = '';
    };

    const positionTooltip = (target) => {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        // Prefer showing below; flip above if it would overflow bottom.
        const fitsBelow = targetRect.bottom + offset + tooltipRect.height <= window.innerHeight - edgePadding;
        const top = fitsBelow
            ? targetRect.bottom + offset
            : Math.max(edgePadding, targetRect.top - offset - tooltipRect.height);

        // Center horizontally over the tag, clamped to viewport edges.
        const idealLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        const left = Math.min(
            Math.max(edgePadding, idealLeft),
            window.innerWidth - edgePadding - tooltipRect.width
        );

        tooltipEl.style.left = `${Math.round(left)}px`;
        tooltipEl.style.top = `${Math.round(top)}px`;
    };

    const showTooltip = (target, tooltipText, { autoHide = false } = {}) => {
        if (!tooltipText) return;

        clearTargetTimeout(target);
        activeTarget = target;

        target.setAttribute('aria-describedby', tooltipId);
        tooltipEl.textContent = tooltipText;

        // Make it measurable without flashing.
        tooltipEl.style.visibility = 'hidden';
        tooltipEl.classList.add('tech-tooltip--visible');

        requestAnimationFrame(() => {
            if (!activeTarget) return;
            positionTooltip(target);
            tooltipEl.style.visibility = 'visible';
        });

        if (autoHide) {
            const timeoutId = window.setTimeout(hideTooltip, showDurationMs);
            timeouts.set(target, timeoutId);
        }
    };

    // Hide on scroll/resize to avoid stale positioning.
    window.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('resize', hideTooltip);
    document.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (!t.classList.contains('tech-tag')) hideTooltip();
    });

    // Only apply these tooltips to PROJECT tech tags (not Skills section tags).
    document.querySelectorAll('#projects .tech-tag').forEach((el) => {
        const tagText = (el.textContent || '').trim();
        if (!tagText) return;

        const tooltipText = `Technology used: ${tagText}`;

        // Helpful fallbacks / accessibility
        el.setAttribute('title', tooltipText);
        el.setAttribute('aria-label', tooltipText);
        el.setAttribute('tabindex', '0');

        el.addEventListener('mouseenter', () => showTooltip(el, tooltipText));
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('focus', () => showTooltip(el, tooltipText));
        el.addEventListener('blur', hideTooltip);

        // Tap/click helper: show briefly
        el.addEventListener('click', () => showTooltip(el, tooltipText, { autoHide: true }));
    });

    const galleryHint = 'Click to view image';
    document.querySelectorAll('#projects .gallery-item').forEach((el) => {
        el.addEventListener('mouseenter', () => showTooltip(el, galleryHint));
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('focus', () => showTooltip(el, galleryHint));
        el.addEventListener('blur', hideTooltip);
    });
}

// ========== EMAIL MODAL ==========
function initEmailModal() {
    const emailModal = document.getElementById('emailModal');
    const emailModalBackdrop = document.getElementById('emailModalBackdrop');
    const emailModalClose = document.getElementById('emailModalClose');
    const emailModalTriggers = document.querySelectorAll('.email-modal-trigger');
    const copyEmailBtn = document.getElementById('copyEmailBtn');
    const copySuccess = document.getElementById('copySuccess');
    const emailDisplay = document.getElementById('emailDisplay');

    // Open modal when clicking @ buttons
    emailModalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openEmailModal();
        });
    });

    // Close modal when clicking close button - button needs stopPropagation only
    if (emailModalClose) {
        emailModalClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeEmailModal();
        });
    }

    // Close modal when clicking backdrop element
    if (emailModalBackdrop) {
        emailModalBackdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            closeEmailModal();
        });
    }

    // Close modal when clicking the modal container itself (not content)
    if (emailModal) {
        emailModal.addEventListener('click', (e) => {
            if (e.target === emailModal) {
                closeEmailModal();
            }
        });
    }

    // Close modal with Escape key
    const handleEmailEscape = (e) => {
        if (e.key === 'Escape' && emailModal.classList.contains('active')) {
            e.preventDefault();
            closeEmailModal();
        }
    };
    document.addEventListener('keydown', handleEmailEscape);

    // Copy email to clipboard
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', async () => {
        try {
            const email = emailDisplay.textContent;
            await navigator.clipboard.writeText(email);
            
            // Show success feedback
            copySuccess.classList.add('show');
            
            // Close modal immediately after copy (as requested)
            setTimeout(() => {
                closeEmailModal();
            }, 100);
            
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = emailDisplay.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Show success feedback
            copySuccess.classList.add('show');
            
            // Close modal immediately after copy
            setTimeout(() => {
                closeEmailModal();
            }, 100);
        }
        });
    }

    function openEmailModal() {
        emailModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        copySuccess.classList.remove('show'); // Reset success message
    }

    function closeEmailModal() {
        emailModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        copySuccess.classList.remove('show'); // Reset success message
    }
}

// ========== END ICY TOWER GAME ==========

// Particle System
const particleCanvas = document.getElementById('particleCanvas');
const particleCtx = particleCanvas.getContext('2d');
function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}
resizeParticleCanvas();

const particles = [];
const particleCount = 100;

class Particle {
    constructor() {
        this.x = Math.random() * particleCanvas.width;
        this.y = Math.random() * particleCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > particleCanvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > particleCanvas.height) this.vy *= -1;
    }

    draw() {
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Theme-aware particle colors - darker for light theme for visibility
        const isDarkTheme = document.body.getAttribute('data-theme') === 'dark';
        particleCtx.fillStyle = isDarkTheme 
            ? 'rgba(0, 212, 255, 0.3)' 
            : 'rgba(30, 58, 138, 0.4)'; // Darker navy blue for light theme
        particleCtx.fill();
    }
}

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Connect nearby particles
    // Theme-aware line colors
    const isDarkTheme = document.body.getAttribute('data-theme') === 'dark';
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
                particleCtx.beginPath();
                particleCtx.moveTo(particles[i].x, particles[i].y);
                particleCtx.lineTo(particles[j].x, particles[j].y);
                const baseOpacity = isDarkTheme ? 0.2 : 0.25;
                particleCtx.strokeStyle = isDarkTheme 
                    ? `rgba(0, 212, 255, ${baseOpacity * (1 - distance / 120)})`
                    : `rgba(30, 58, 138, ${baseOpacity * (1 - distance / 120)})`; // Darker navy for light theme
                particleCtx.lineWidth = isDarkTheme ? 1 : 1.5;
                particleCtx.stroke();
            }
        }
    }

    requestAnimationFrame(animateParticles);
}

animateParticles();

window.addEventListener('resize', () => {
    resizeParticleCanvas();
});

// Playground Tab Switching - Simplified for single game tab
const playgroundTabs = document.querySelectorAll('.playground-tab');
const playgroundContents = document.querySelectorAll('.playground-content');

// Since there's only one tab now, we can simplify or remove this logic
playgroundTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        playgroundTabs.forEach(t => t.classList.remove('active'));
        playgroundContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const content = document.getElementById(`${tabName}-content`);
        if (content) {
            content.classList.add('active');
        }
    });
});

// Theme Toggle (Dark Mode Default)
const themeToggle = document.getElementById('themeToggle');
const bodyEl = document.body;
let isDark = true;

function setThemeToggleAria(isDarkMode) {
    if (!themeToggle) return;
    themeToggle.setAttribute(
        'aria-label',
        isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
    );
}

// Respect saved preference, otherwise default to dark mode
const savedTheme = localStorage.getItem('theme');
isDark = savedTheme ? savedTheme === 'dark' : true;

// Apply initial theme
bodyEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
setThemeToggleAria(isDark);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        bodyEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        setThemeToggleAria(isDark);

        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const ripple = document.createElement('div');
        ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        width: 20px;
        height: 20px;
        left: 50%;
        top: 50%;
        margin-left: -10px;
        margin-top: -10px;
    `;

        themeToggle.style.position = 'relative';
        themeToggle.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });

    themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            themeToggle.click();
        }
    });
}

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Navbar Scroll Effect - Enhanced version is in the enhanced features section

// Enhanced Scroll Animations
const animateCounter = (element) => {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current) + (target === 100 ? '%' : '+');
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + (target === 100 ? '%' : '+');
        }
    };

    updateCounter();
};

// Terminal Typing Animation
let terminalTyped = false;
let terminalOriginalContent = null;

// Store original terminal content on page load
const terminalContent = document.querySelector('.terminal-content');
if (terminalContent) {
    terminalOriginalContent = terminalContent.innerHTML;
    terminalContent.innerHTML = '';
}

// Typing animation function
async function animateTerminalTyping() {
    const terminalContent = document.querySelector('.terminal-content');
    if (!terminalContent || terminalTyped || !terminalOriginalContent) return;
    
    terminalTyped = true;
    
    // Parse the original HTML to preserve structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(terminalOriginalContent, 'text/html');
    const lines = Array.from(doc.body.children);
    
    terminalContent.innerHTML = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].cloneNode(true);
        const lineElement = document.createElement('div');
        lineElement.className = 'terminal-line';
        lineElement.innerHTML = '';
        terminalContent.appendChild(lineElement);
        
        const text = line.textContent || '';
        const innerHTML = line.innerHTML;
        
        // Type character by character
        for (let j = 0; j < text.length; j++) {
            lineElement.textContent = text.substring(0, j + 1);
            await new Promise(resolve => setTimeout(resolve, 12));
        }
        
        // After typing text, restore HTML structure
        lineElement.innerHTML = innerHTML;
        
        // Add cursor blink to last line
        if (i === lines.length - 1) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor-blink';
            lineElement.appendChild(cursor);
        }
        
        // Pause between lines
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

// Enhanced Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Counter animation for hero stats
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                if (counter.textContent === '0') {
                    animateCounter(counter);
                }
            });
            
            // Terminal typing animation
            if (entry.target.classList.contains('terminal-card') && !terminalTyped) {
                animateTerminalTyping();
            }
            
            // Add animation classes for scroll-triggered elements
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for scroll animations (project-card handled separately with enhanced animations)
const elementsToAnimate = document.querySelectorAll('.hero-stats, .skill-card, .section-title, .section-subtitle, .quote-card, .terminal-card');
elementsToAnimate.forEach(element => {
    observer.observe(element);
});

// Add CSS classes for scroll animations
const style = document.createElement('style');
style.textContent = `
    .skill-card, .project-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .skill-card.animate-in, .project-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .skill-card:nth-child(1) { transition-delay: 0.1s; }
    .skill-card:nth-child(2) { transition-delay: 0.2s; }
    .skill-card:nth-child(3) { transition-delay: 0.3s; }
    .skill-card:nth-child(4) { transition-delay: 0.4s; }
    .skill-card:nth-child(5) { transition-delay: 0.5s; }
    .skill-card:nth-child(6) { transition-delay: 0.6s; }
`;
document.head.appendChild(style);

// GitHub Activity Grid - "I CAN BUILD ANYTHING" encoded
const activityGrid = document.getElementById('activityGrid');
if (activityGrid) {
    // Pixel font patterns (7 rows tall; glyph width is pattern[0].length — mostly 3; N is 4 with right stem one col left of typical 5-wide)
    // 1 = active cell (level-4 for brightest), 0 = inactive
    const pixelFont = {
        'I': [
            [1,1,1],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [1,1,1]
        ],
        'C': [
            [0,1,1],
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [0,1,1]
        ],
        'A': [
            [0,1,0],
            [1,0,1],
            [1,0,1],
            [1,1,1],
            [1,0,1],
            [1,0,1],
            [1,0,1]
        ],
        'N': [
            [1, 0, 0, 1],
            [1, 1, 0, 1],
            [1, 0, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
        'B': [
            [1,1,0],
            [1,0,1],
            [1,0,1],
            [1,1,0],
            [1,0,1],
            [1,0,1],
            [1,1,0]
        ],
        'U': [
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [0,1,0]
        ],
        'L': [
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [1,0,0],
            [1,1,1]
        ],
        'D': [
            [1,1,0],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,1,0]
        ],
        'Y': [
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0]
        ],
        'T': [
            [1,1,1],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0]
        ],
        'H': [
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [1,1,1],
            [1,0,1],
            [1,0,1],
            [1,0,1]
        ],
        'G': [
            [0,1,1],
            [1,0,0],
            [1,0,0],
            [1,0,1],
            [1,0,1],
            [1,0,1],
            [0,1,1]
        ],
        ' ': [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0]
        ]
    };

    const glyphWidth = (char) => (char === ' ' ? 2 : pixelFont[char][0].length + 1);

    // Message to encode
    const message = "I CAN BUILD ANYTHING";
    
    // Glyph columns + 1 gap after each letter; spaces are 2 cols
    let messageWidth = 0;
    for (const char of message) {
        messageWidth += glyphWidth(char);
    }
    
    // Add gap between message repetitions for visual separation
    const gapBetweenMessages = 12;
    const messageWithGap = messageWidth + gapBetweenMessages;
    
    // Create a wider grid that repeats the message 3 times for seamless scrolling
    const gridHeight = 7;
    const gridWidth = messageWithGap * 3; // Triple the message width including gaps
    const totalCells = gridWidth * gridHeight;
    
    // Initialize grid with all zeros
    const grid = Array(totalCells).fill(0);
    
    // Render the message 3 times across the grid
    for (let repeat = 0; repeat < 3; repeat++) {
        let currentCol = repeat * messageWithGap;
        
        // Render each character
        for (const char of message) {
            const pattern = pixelFont[char];
            if (!pattern) continue;
            
            const w = pattern[0].length;
            for (let row = 0; row < gridHeight; row++) {
                for (let col = 0; col < w; col++) {
                    const cellIndex = row * gridWidth + currentCol + col;
                    if (cellIndex < totalCells && pattern[row][col] === 1) {
                        grid[cellIndex] = 4; // Use level 4 for maximum brightness
                    }
                }
            }
            
            currentCol += glyphWidth(char);
        }
    }
    
    // Add some random noise to make it look more organic
    for (let i = 0; i < totalCells; i++) {
        if (grid[i] === 0 && Math.random() < 0.12) {
            grid[i] = Math.floor(Math.random() * 2) + 1; // Level 1 or 2 for background noise
        }
    }
    
    // Set grid template columns dynamically to ensure full message fits
    activityGrid.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
    activityGrid.style.width = '100%';
    activityGrid.style.minWidth = `${gridWidth * 13}px`; // Ensure grid is wide enough: (10px cell + 3px gap) × columns
    activityGrid.style.minHeight = '91px'; // 7 rows × (10px + 3px gap) - 3px = ensure squares always visible
    activityGrid.classList.add('scrolling-grid');
    
    // Create the cells
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'activity-cell';
        const level = grid[i];
        if (level > 0) {
            cell.classList.add(`level-${level}`);
        }
        cell.title = `${Math.floor(Math.random() * 10)} contributions`;
        activityGrid.appendChild(cell);
    }
}

// Interactive Terminal
const terminalInput = document.getElementById('terminalInput');
if (terminalInput) {
    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.toLowerCase();
            const terminalContent = document.querySelector('.terminal-content');

            let response = '';
            if (command === 'help') {
                response = '\n$ Available commands: help, skills, contact, clear';
            } else if (command === 'skills') {
                response = '\n$ Skills: React, TypeScript, Next.js, Node.js, CSS3';
            } else if (command === 'contact') {
                response = '\n$ Email: katiehunt95@gmail.com';
            } else if (command === 'clear') {
                terminalContent.innerHTML = '';
                terminalInput.value = '';
                return;
            } else {
                response = `\n$ Command not found: ${command}. Type 'help' for commands.`;
            }

            const newLine = document.createElement('div');
            newLine.className = 'terminal-line';
            newLine.style.opacity = '1';
            newLine.textContent = response;
            terminalContent.appendChild(newLine);
            terminalInput.value = '';

            terminalContent.scrollTop = terminalContent.scrollHeight;
        }
    });
}


// Performance Monitor
let lastTime = performance.now();
let frames = 0;

function updateFPS() {
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = frames;
        }
        frames = 0;
        lastTime = currentTime;
    }
    requestAnimationFrame(updateFPS);
}

updateFPS();

window.addEventListener('load', () => {
    const loadTime = performance.now();
    const loadTimeElement = document.getElementById('loadTime');
    if (loadTimeElement) {
        loadTimeElement.textContent = Math.round(loadTime);
    }
});

// Performance Monitor Easter Egg - Toggle with 'P' key
let perfMonitorVisible = localStorage.getItem('perfMonitorVisible') === 'true';

// Initialize performance monitor visibility on page load
document.addEventListener('DOMContentLoaded', () => {
    const perfMonitor = document.getElementById('perfMonitor');
    if (perfMonitor && perfMonitorVisible) {
        perfMonitor.classList.remove('hidden');
    }
});

// Toggle performance monitor with 'P' key
document.addEventListener('keydown', (e) => {
    // Check if user is typing in an input field
    const activeElement = document.activeElement;
    const isTyping = activeElement.tagName === 'INPUT' || 
                     activeElement.tagName === 'TEXTAREA';
    
    // Only toggle if not typing in an input field
    if (!isTyping && (e.key === 'p' || e.key === 'P')) {
        const perfMonitor = document.getElementById('perfMonitor');
        if (perfMonitor) {
            perfMonitorVisible = !perfMonitorVisible;
            
            if (perfMonitorVisible) {
                perfMonitor.classList.remove('hidden');
                // Add a subtle animation when showing
                perfMonitor.style.animation = 'fadeInUp 0.3s ease';
            } else {
                perfMonitor.classList.add('hidden');
            }
            
            // Save preference to localStorage
            localStorage.setItem('perfMonitorVisible', perfMonitorVisible);
        }
    }
});

// Konami Code Easter Egg
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            document.getElementById('easterEgg').classList.add('active');
            document.getElementById('modalBackdrop').classList.add('active');
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});

function closeEasterEgg() {
    const easterEgg = document.getElementById('easterEgg');
    const backdrop = document.getElementById('modalBackdrop');
    easterEgg.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Initialize Easter Egg Modal listeners
function initEasterEggModal() {
    const easterEgg = document.getElementById('easterEgg');
    const easterEggBackdrop = document.getElementById('modalBackdrop');

    if (!easterEgg || !easterEggBackdrop) return;

    // Backdrop click
    easterEggBackdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeEasterEgg();
    });

    // Close modal when clicking outside the easter egg content
    easterEgg.addEventListener('click', (e) => {
        if (e.target === easterEgg) {
            closeEasterEgg();
        }
    });

    // Add Escape key handler for Easter Egg modal
    const handleEasterEggEscape = (e) => {
        if (e.key === 'Escape' && easterEgg.classList.contains('active')) {
            e.preventDefault();
            closeEasterEgg();
        }
    };
    document.addEventListener('keydown', handleEasterEggEscape);
}

// Initialize Easter Egg modal
initEasterEggModal();

// Smooth Scroll - Enhanced version with offset is in the enhanced features section

// ========== PROJECT CARDS FUNCTIONALITY ==========

// Initialize project cards functionality
function initProjectCards() {
    // Handle expand/collapse for project details
    const expandButtons = document.querySelectorAll('.expand-details-btn');
    expandButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const projectCard = button.closest('.project-card');
            const detailsSection = projectCard.querySelector('.project-details-expanded');
            const isActive = detailsSection.classList.contains('active');
            
            // Close all other expanded sections
            document.querySelectorAll('.project-details-expanded.active').forEach(section => {
                section.classList.remove('active');
            });
            
            // Toggle current section
            if (!isActive) {
                detailsSection.classList.add('active');
                button.textContent = 'Hide Details';
            } else {
                detailsSection.classList.remove('active');
                button.textContent = 'View Details';
            }
        });
    });

    // Handle screenshot modal
    const screenshotButtons = document.querySelectorAll('.screenshot-btn');
    screenshotButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = button.getAttribute('data-project');
            openScreenshotModal(projectId);
        });
    });
}

// Render inline galleries inside project cards
function renderProjectGalleries() {
    const containers = document.querySelectorAll('.project-gallery');
    containers.forEach(container => {
        const projectId = container.getAttribute('data-project');
        const data = projectScreenshots[projectId];
        if (!data) return;
        const mediaArray = data.images || data.media || [];
        if (!Array.isArray(mediaArray) || mediaArray.length === 0) return;

        const grid = document.createElement('div');
        grid.className = 'gallery-grid';

        const displayCount = Math.min(2, mediaArray.length);
        for (let i = 0; i < displayCount; i++) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.setAttribute('data-index', String(i));
            item.setAttribute('role', 'button');
            item.setAttribute('aria-haspopup', 'dialog');
            item.setAttribute('aria-controls', 'screenshotModal');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', 'Click to view image');

            const img = document.createElement('img');
            img.src = mediaArray[i];
            const caption = Array.isArray(data.captions) ? data.captions[i] : '';
            if (caption) img.alt = caption;
            img.loading = 'lazy';

            const overlay = document.createElement('div');
            overlay.className = 'gallery-overlay';
            overlay.textContent = '';

            item.appendChild(img);
            item.appendChild(overlay);
            const open = () => openScreenshotModal(projectId, i);
            item.addEventListener('click', open);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
            grid.appendChild(item);
        }

        if (mediaArray.length > 2) {
            const more = document.createElement('div');
            more.className = 'gallery-more';
            more.textContent = `+${mediaArray.length - displayCount} more`;
            more.addEventListener('click', () => openScreenshotModal(projectId, displayCount));
            grid.appendChild(more);
        }

        container.innerHTML = '';
        container.appendChild(grid);
    });
}

// Project screenshots mapping
const projectScreenshots = {
    project1: {
        images: [
            'images/project1-1.png',
            'images/project1-2.png',
            'images/project1-3.png',
            'images/project1-4.png',
            'images/project1-5.png',
            'images/project1-6.png',
            'images/project1-7.png',
            'images/project1-8.png',
            'images/project1-9.png',
            'images/project1-10.png',
            'images/project1-11.png',
            'images/project1-12.png',
            'images/project1-13.png',
            'images/project1-14.png',
            'images/project1-15.png',
            'images/project1-16.png',
            'images/project1-17.png',
            'images/project1-18.png',
            'images/project1-19.png'
        ],
        captions: [
            'Floating Dock - Interactive Dashboard Navigation',
            'Floating Dock - Analytics View with Quick Access',
            'Floating Dock - User Management Interface',
            'Floating Dock - Data Management Controls',
            'Floating Dock - Settings Configuration',
            'Morphing Header - Adaptive Navigation Dashboard',
            'Morphing Header - Performance Analytics',
            'Morphing Header - User Access Control',
            'Morphing Header - Data Infrastructure',
            'Morphing Header - System Configuration',
            'Radial Menu - Touch-Optimized Circular Navigation',
            'Command Bar - Keyboard Shortcut Power User Interface',
            'Slide-out Panel - Space-Efficient Side Navigation',
            'Slide-out Panel - Extended Menu with File Management',
            'Tabbed Interface - Multi-Section Dashboard',
            'Tabbed Interface - Analytics Section View',
            'Tabbed Interface - User Management Tab',
            'Tabbed Interface - Data Management Tab',
            'Tabbed Interface - Settings Configuration Tab'
        ],
        currentIndex: 0
    },
    project2: {
        images: [
            'images/project2-1.png',
            'images/project2-2.png',
            'images/project2-3.png',
            'images/project2-4.png',
            'images/project2-5.png',
            'images/project2-6.png',
            'images/project2-7.png',
            'images/project2-8.png',
            'images/project2-9.png',
            'images/project2-10.png',
            'images/project2-11.png',
            'images/project2-12.png',
            'images/project2-13.png',
            'images/project2-14.png',
            'images/project2-15.png'
        ],
        captions: [
            'Home - Dark Theme with Animated Hero Section',
            'Home - Light Theme with Clean Interface',
            'Features - Dark Theme Showing Key Functionality',
            'Features - Light Theme with Feature Cards',
            'Benefits - Dark Theme with Visual Analytics',
            'Benefits - Light Theme Highlighting Advantages',
            'Contact - Dark Theme with Glassmorphism Form',
            'Contact - Light Theme with Minimalist Design',
            'Sign In - Authentication Interface',
            'Sign In - Alternative Layout with Gradient Background',
            'Sign In - Premium Design with Floating Elements',
            'Sign In - Light Theme Authentication',
            'Create New Habit - Dark Theme Habit Builder',
            'Create New Habit - Light Theme Form Interface',
            'My Habits - Dashboard with Progress Tracking'
        ],
        currentIndex: 0
    },
    project3: {
        images: [
            'images/project3-1.png',
            'images/project3-2.png',
            'images/project3-3.png',
            'images/project3-4.png',
            'images/project3-5.png',
            'images/project3-6.png',
            'images/project3-7.png',
            'images/project3-8.png',
            'images/project3-9.png'
        ],
        captions: [
            'Lock Screen - Master Password Authentication with Secure Vault Access',
            'Dashboard - Real-time KPI Analytics with Recent Snippets and Security Status',
            'Code Snippet - Create and Edit Code with Syntax Highlighting and Metadata',
            'Snippets Folder - Advanced Filtering by Language, Project, and Tags',
            'Code Repository - File Tree Navigation with Syntax Highlighting',
            'Settings - Security Configuration with Encryption and Auto-lock Options',
            'Settings - Appearance Customization with Theme and Layout Preferences',
            'Settings - Editor Preferences with Syntax Highlighting Configuration',
            'Settings - Data Management with Backup, Export, and Retention Policies'
        ],
        currentIndex: 0
    },
    project4: {
        images: [
            'images/Project 4/Dashboard.png',
            'images/Project 4/API Settings.png',
            'images/Project 4/Logout.png'
        ],
        captions: [
            'Dashboard - Real-Time Multi-Source Financial Data Visualization',
            'API Settings - Secure API Key Management and Configuration',
            'Logout - Secure Authentication Session Management'
        ],
        currentIndex: 0
    },
    project5: {
        images: [
            'images/Project 5/Vault.png',
            'images/Project 5/Add Password.png',
            'images/Project 5/Settings.png'
        ],
        captions: [
            'Vault - Password Dashboard with Category Organization and Real-Time Search',
            'Add Password - Secure Credential Entry with Category Assignment and Validation',
            'Settings - Theme Customization and Data Management Configuration'
        ],
        currentIndex: 0
    },
    project6: {
        images: [
            'images/Project 6/1.png',
            'images/Project 6/2.png',
            'images/Project 6/3.png',
            'images/Project 6/4.png',
            'images/Project 6/5.png',
            'images/Project 6/6.png',
            'images/Project 6/7.png',
            'images/Project 6/8.png',
            'images/Project 6/9.png',
            'images/Project 6/10.png'
        ],
        captions: [
            'Homepage - Hero Section with Mission Statement and Role Tags',
            'About Section - Brief Introduction with Quote Card',
            'About Section - Feature Cards (Inclusive Accessibility, Data-Driven Design, Scalable Systems)',
            'Portfolio Section - Teaching Artifacts & Projects with Category Filters',
            'Portfolio Section - Python Programming Projects Grid',
            'Portfolio Section - Physical Education Curriculum Projects',
            'Portfolio Section - Learning Methodology and Professional Development Artifacts',
            'Skills Section - Technical Skills & Competencies Grid',
            'Skills Section - LMS Platforms, Design Tools, and Productivity Skills',
            'Footer Section - Contact Information and Navigation'
        ],
        currentIndex: 0
    },
    project7: {
        images: [
            'images/Project 7/1.png',
            'images/Project 7/2.png',
            'images/Project 7/3.png',
            'images/Project 7/4.png',
            'images/Project 7/5.png',
            'images/Project 7/6.png'
        ],
        captions: [
            'Library Dashboard - Main Prompt Library with KPI Dashboard, Category Filters, and Prompt Cards',
            'Create New Prompt - Modal Interface for Prompt Creation with Category Selection and Tag Management',
            'Favorites Page - Favorited Prompts with Search Functionality and Usage Statistics',
            'AI Insights Dashboard - Usage Analytics, Top Prompts, Usage Patterns, and AI-Generated Suggestions',
            'Settings Page - General Settings, Sync & Backup Configuration, and Data Management Options',
            'Settings Page - Data Management, Notifications, Privacy & Security, and Application Information'
        ],
        currentIndex: 0
    },
    project8: {
        images: [
            'images/Project 8/1 lock screen.png',
            'images/Project 8/2 dashboard.png',
            'images/Project 8/3 + New Play 1.png',
            'images/Project 8/3 + New Play 2.png',
            'images/Project 8/3 + New Play 3.png',
            'images/Project 8/4 settings 1.png',
            'images/Project 8/4 settings 2.png',
            'images/Project 8/keyboard shortcuts.png',
            'images/Project 8/Pin RESET.png'
        ],
        captions: [
            'Lock Screen - PIN Authentication with Secure Access and Animations',
            'Dashboard - Trading Playbook Library with Stats Grid, Search, Filtering, and Grid/List View Modes',
            'New Play Editor - Trade Rules Form with Entry Confirmations, Stop Loss, and Take Profit Rules',
            'New Play Editor - Trade Rules Form with Trade Logic, Conditions, and Risk Parameters',
            'New Play Editor - Confluence Factors, Tags & Organization, and Chart Screenshots Upload',
            'Settings Page - Appearance Theme Selection, Risk Models, and Take Profit Models Management',
            'Settings Page - Data & Export Options, Security Settings with PIN Change and Recovery Phrase',
            'Keyboard Shortcuts Modal - Navigation, Search, and Play Editor Keyboard Shortcuts Reference',
            'Recovery Phrase Modal - Secret Phrase Generated for Regaining Access When PIN Is Lost'
        ],
        currentIndex: 0
    },
    project9: {
        images: [
            'images/Project 9/1 -lock screen.png',
            'images/Project 9/2 - dashboard.png',
            'images/Project 9/3 - portfolio.png',
            'images/Project 9/3 - position.png',
            'images/Project 9/4 - history.png',
            'images/Project 9/5 - security.png',
            'images/Project 9/6 - settings (appearance).png',
            'images/Project 9/6 - settings (data & export).png',
            'images/Project 9/6 - settings (general).png',
            'images/Project 9/6 - settings (network).png',
            'images/Project 9/6 - settings (notifications).png',
            'images/Project 9/6 - settings (privacy).png',
            'images/Project 9/6 - settings (security).png',
            'images/Project 9/1 -lock screen  LT.png',
            'images/Project 9/2 - dashboard LT.png',
            'images/Project 9/3 - portfolio  LT.png',
            'images/Project 9/3 - position  LT.png',
            'images/Project 9/4 - history  LT.png',
            'images/Project 9/5 - security  LT.png',
            'images/Project 9/6 - settings (appearance)  LT.png',
            'images/Project 9/6 - settings (data & export)  LT.png',
            'images/Project 9/6 - settings (general) LT.png',
            'images/Project 9/6 - settings (network)  LT.png',
            'images/Project 9/6 - settings (notifications)  LT.png',
            'images/Project 9/6 - settings (privacy)  LT.png',
            'images/Project 9/6 - settings (security)  LT.png'
        ],
        captions: [
            'Lock screen — secure entry before wallet access',
            'Dashboard — wallet overview, balances, and primary actions',
            'Portfolio — holdings and allocation-style tracking',
            'Position — single-asset view and position-level context',
            'History — transaction list and activity',
            'Security — protective controls and wallet safeguards',
            'Settings — Appearance and display preferences',
            'Settings — Data management and export options',
            'Settings — General preferences',
            'Settings — Network and connectivity',
            'Settings — Notifications',
            'Settings — Privacy',
            'Settings — Security and account protection',
            'Lock screen — light theme',
            'Dashboard — light theme',
            'Portfolio — light theme',
            'Position — light theme',
            'History — light theme',
            'Security — light theme',
            'Settings — Appearance — light theme',
            'Settings — Data & export — light theme',
            'Settings — General — light theme',
            'Settings — Network — light theme',
            'Settings — Notifications — light theme',
            'Settings — Privacy — light theme',
            'Settings — Security — light theme'
        ],
        currentIndex: 0
    },
    project10: {
        /** PNGs for card thumbnails; full demo video lives on the case study page only. */
        images: [
            'images/Project 10/file upload screen.png',
            'images/Project 10/completion screen or result screen.png'
        ],
        captions: [
            'File upload — choose input and conversion mode',
            'Completion — result ready with download flow'
        ],
        currentIndex: 0
    }
};

let currentProject = null;

// Helper function to check if a file is a video
function isVideoFile(filename) {
    if (!filename || typeof filename !== 'string') {
        return false;
    }
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Open screenshot modal
function openScreenshotModal(projectId, startIndex = 0) {
    const modal = document.getElementById('screenshotModal');
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');
    const modalCaption = document.getElementById('modalCaption');
    
    currentProject = projectId;
    const projectData = projectScreenshots[projectId];
    
    if (projectData) {
        const mediaArray = projectData.images || projectData.media || [];
        const clampedIndex = Math.min(Math.max(parseInt(startIndex, 10) || 0, 0), Math.max(mediaArray.length - 1, 0));
        projectData.currentIndex = clampedIndex;
        const firstMedia = mediaArray[clampedIndex];
        
        if (!firstMedia) {
            console.warn('No media found for project:', projectId);
            return;
        }
        
        const isVideo = isVideoFile(firstMedia);
        
        if (isVideo) {
            modalImage.style.display = 'none';
            modalVideo.style.display = 'block';
            // Clear existing sources
            modalVideo.innerHTML = '';
            // Add source element
            const source = document.createElement('source');
            source.src = firstMedia;
            // Detect video type from extension
            if (firstMedia.toLowerCase().endsWith('.webm')) {
                source.type = 'video/webm';
            } else if (firstMedia.toLowerCase().endsWith('.ogg') || firstMedia.toLowerCase().endsWith('.ogv')) {
                source.type = 'video/ogg';
            } else {
                source.type = 'video/mp4';
            }
            modalVideo.appendChild(source);
            modalVideo.load();
        } else {
            modalVideo.style.display = 'none';
            modalImage.style.display = 'block';
            modalImage.src = firstMedia;
            modalImage.alt = Array.isArray(projectData.captions) ? projectData.captions[projectData.currentIndex] : '';
        }
        modalCaption.textContent = Array.isArray(projectData.captions) ? projectData.captions[projectData.currentIndex] : '';
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Navigate screenshots
function navigateScreenshot(direction) {
    if (!currentProject) return;
    
    const projectData = projectScreenshots[currentProject];
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');
    const modalCaption = document.getElementById('modalCaption');
    
    // Pause video if playing
    if (!modalVideo.paused) {
        modalVideo.pause();
    }
    
    const mediaArray = projectData.images || projectData.media || [];
    
    if (mediaArray.length === 0) {
        console.warn('No media available for project:', currentProject);
        return;
    }
    
    if (direction === 'next') {
        projectData.currentIndex = (projectData.currentIndex + 1) % mediaArray.length;
    } else {
        projectData.currentIndex = (projectData.currentIndex - 1 + mediaArray.length) % mediaArray.length;
    }
    
    const currentMedia = mediaArray[projectData.currentIndex];
    
    if (!currentMedia) {
        console.warn('Media at index', projectData.currentIndex, 'is undefined for project:', currentProject);
        return;
    }
    
    const isVideo = isVideoFile(currentMedia);
    
    if (isVideo) {
        modalImage.style.display = 'none';
        modalVideo.style.display = 'block';
        // Clear existing sources
        modalVideo.innerHTML = '';
        // Add source element
        const source = document.createElement('source');
        source.src = currentMedia;
        // Detect video type from extension
        if (currentMedia.toLowerCase().endsWith('.webm')) {
            source.type = 'video/webm';
        } else if (currentMedia.toLowerCase().endsWith('.ogg') || currentMedia.toLowerCase().endsWith('.ogv')) {
            source.type = 'video/ogg';
        } else {
            source.type = 'video/mp4';
        }
        modalVideo.appendChild(source);
        modalVideo.load();
    } else {
        modalVideo.style.display = 'none';
        modalImage.style.display = 'block';
        modalImage.src = currentMedia;
        modalImage.alt = projectData.captions[projectData.currentIndex];
    }
    modalCaption.textContent = projectData.captions[projectData.currentIndex];
}

// Close screenshot modal
function closeScreenshotModal() {
    const modal = document.getElementById('screenshotModal');
    const modalVideo = document.getElementById('modalVideo');
    
    // Pause video if playing
    if (modalVideo && !modalVideo.paused) {
        modalVideo.pause();
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProject = null; // Reset current project
}

// Initialize screenshot modal event listeners
function initScreenshotModal() {
    const modal = document.getElementById('screenshotModal');
    const closeButton = document.getElementById('screenshotModalClose');
    const backdrop = document.getElementById('screenshotModalBackdrop');
    const prevButton = document.getElementById('screenshotNavPrev');
    const nextButton = document.getElementById('screenshotNavNext');
    const modalContent = document.querySelector('.screenshot-modal-content');

    // Add null checks before attaching listeners
    if (!modal || !closeButton || !backdrop || !prevButton || !nextButton) {
        console.error('Screenshot modal elements not found:', {
            modal: !!modal,
            closeButton: !!closeButton,
            backdrop: !!backdrop,
            prevButton: !!prevButton,
            nextButton: !!nextButton
        });
        return;
    }

    console.log('Screenshot modal elements found, attaching listeners');

    // Close button - only stopPropagation, no preventDefault
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Close button clicked');
        closeScreenshotModal();
    });

    // Backdrop click
    backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Backdrop clicked');
        closeScreenshotModal();
    });

    // Close modal when clicking modal container directly (not content)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('Modal container clicked');
            closeScreenshotModal();
        }
    });

    // Navigation buttons
    prevButton.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateScreenshot('prev');
    });
    nextButton.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateScreenshot('next');
    });

    // Keyboard navigation - use a unique handler to avoid conflicts
    const handleScreenshotKeydown = (e) => {
        if (modal.classList.contains('active')) {
            console.log('Key pressed in screenshot modal:', e.key);
            if (e.key === 'Escape') {
                e.preventDefault();
                console.log('Escape key pressed, closing modal');
                closeScreenshotModal();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateScreenshot('prev');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateScreenshot('next');
            }
        }
    };

    document.addEventListener('keydown', handleScreenshotKeydown);
}

// Initialize all project functionality
function initProjects() {
    initProjectCards();
    renderProjectGalleries();
    initScreenshotModal();
    initImageModal();
}

// ========== CERTIFICATE MODAL FUNCTIONALITY ==========

// Certificate data array - Make it global and define immediately
window.certificates = [
    {
        title: "Developing Machine Learning Solutions Using AI",
        file: "certifications/Hunt FGCU Developing Machine Learning Solutions Using AI Training.pdf"
    },
    {
        title: "Coding with Artificial Intelligence Training",
        file: "certifications/Hunt Coding with Artificial Intelligence Training.pdf"
    },
    {
        title: "Fleet Certified GitOps Administrator",
        file: "certifications/Fleet Certified GitOps Administator.pdf"
    },
    {
        title: "Programming with Python - Level 1",
        file: "certifications/TTN Programming with Python – Level 1.pdf"
    },
    {
        title: "12 Week Python Certificate",
        file: "certifications/QS 12 Week Python Certificate.pdf"
    },
    {
        title: "Programming Foundations with Python",
        file: "certifications/From Logic to Code_ Programming Foundations with Python.pdf"
    },
    {
        title: "TTN Web Development - Level 1",
        file: "certifications/TTN Web Development level1 Certificate.pdf"
    },
    {
        title: "TTN+Cognizant Data Management Workshop",
        file: "certifications/TTN+Cognizant Data Management workshop Certificate.pdf"
    },
    {
        title: "Algorithmic Trading with Python",
        file: "certifications/Algorithimic Trading with Python.pdf"
    },
    {
        title: "Data Analysis via Python",
        file: "certifications/Data Analysis via Python.pdf"
    },
    {
        title: "Sanfoundry Python Certificate",
        file: "certifications/Sanfoundry Python Certificate.pdf"
    },
    {
        title: "SQL Beginner to Intermediate Query Writing",
        file: "certifications/SQL Beginner to Intermediate Query Writing Certificate of Completion.pdf"
    },
    {
        title: "TTN DevOps Level 1",
        file: "certifications/TTN DevOps level 1 Certificate.pdf"
    },
    {
        title: "AI-Powered Development with Cursor Workshop",
        file: "certifications/AI-Powered Development with Cursor Workshop.pdf"
    },
    {
        title: "Algorithmic Trading — Course Completion",
        file: "certifications/Course_Completion_Certificate_Katie_Hunt_Algorithmic_Trading.pdf"
    }
];

// Show certificate modal - Define as regular function for global scope
function showCert(index) {
    console.log('showCert called with index:', index);
    console.log('window.certificates exists?', typeof window.certificates !== 'undefined');
    console.log('window.certificates length:', typeof window.certificates !== 'undefined' ? window.certificates.length : 'undefined');

    if (typeof window.certificates === 'undefined' || index < 0 || index >= window.certificates.length) {
        console.error('Certificate not found at index:', index);
        return;
    }

    var cert = window.certificates[index];
    var modal = document.getElementById('certModal');
    var modalTitle = document.getElementById('certModalTitle');
    var certIframe = document.getElementById('certIframe');

    if (!modal || !modalTitle || !certIframe) {
        alert('Modal elements not found! Please refresh the page.');
        return;
    }

    // Set certificate data
    modalTitle.innerHTML = '<b>' + cert.title + '</b>';
    certIframe.src = cert.file;

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Also expose it on window for inline onclick handlers
window.showCert = showCert;

// Close certificate modal
function closeCertModal() {
    var modal = document.getElementById('certModal');
    var certIframe = document.getElementById('certIframe');

    if (modal && certIframe) {
        modal.classList.remove('active');
        certIframe.src = '';
        document.body.style.overflow = '';
    }
}

// Initialize certificate modal event listeners
function initCertModal() {
    var modal = document.getElementById('certModal');
    var closeButton = document.getElementById('certModalClose');
    var backdrop = document.getElementById('certModalBackdrop');

    if (!modal || !closeButton || !backdrop) {
        return;
    }

    // Close button
    closeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        closeCertModal();
    });

    // Backdrop click
    backdrop.addEventListener('click', function(e) {
        e.stopPropagation();
        closeCertModal();
    });

    // Close modal when clicking modal container directly (not content)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCertModal();
        }
    });

    // Keyboard navigation - ESC to close
    document.addEventListener('keydown', function(e) {
        if (modal.classList.contains('active') && e.key === 'Escape') {
            e.preventDefault();
            closeCertModal();
        }
    });
}

// Initialize certificate modal on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCertModal);
} else {
    initCertModal();
}

// ========== IMAGE MODAL FUNCTIONALITY ==========

// Open image modal
function openImageModal(imageSrc, caption) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    modalImage.src = imageSrc;
    modalImage.alt = caption;
    modalCaption.textContent = caption;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close image modal
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Initialize image modal event listeners
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const closeButton = document.getElementById('imageModalClose');
    const backdrop = document.getElementById('imageModalBackdrop');
    const modalContent = document.querySelector('.image-modal-content');

    if (!modal || !closeButton || !backdrop) return;

    // Close button - only stopPropagation, no preventDefault
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeImageModal();
    });

    // Backdrop click
    backdrop.addEventListener('click', (e) => {
        e.stopPropagation();
        closeImageModal();
    });

    // Close modal when clicking modal container directly (not content)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal();
        }
    });

    // Keyboard navigation
    const handleImageEscape = (e) => {
        if (modal.classList.contains('active')) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeImageModal();
            }
        }
    };
    document.addEventListener('keydown', handleImageEscape);
}

// ========== ENHANCED ANIMATIONS & VISUAL EFFECTS ==========

// Page Loader
function initPageLoader() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <div class="loader-text">Loading Portfolio...</div>
        </div>
    `;
    document.body.appendChild(loader);

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }, 300);
    });
}

// Enhanced Parallax Effect
function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-element');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// About page: assign reveal classes before scroll-reveal observer runs
function initAboutRevealTargets() {
    document.querySelectorAll('.certifications-grid .cert-card').forEach((el) => {
        el.classList.add('reveal-up');
    });
    document.querySelectorAll('.experience-section .experience-item').forEach((el) => {
        el.classList.add('reveal-up');
    });
    document.querySelectorAll('.education-section .education-item').forEach((el) => {
        el.classList.add('reveal-up');
    });
}

function initAboutTimelineLines() {
    document.querySelectorAll('.timeline-animate').forEach((timeline) => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );
        observer.observe(timeline);
    });
}

// Enhanced Scroll Reveal with Stagger
function initEnhancedScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 100);
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

// Enhanced Project Card Animations with Stagger
function enhanceProjectCardAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 150);
                cardObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });

    projectCards.forEach(card => {
        cardObserver.observe(card);
    });
}

// Magnetic Hover Effect
function initMagneticEffect() {
    const magneticElements = document.querySelectorAll('.magnetic, .btn, .contact-social-link, .cert-link');
    
    magneticElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const moveX = x * 0.15;
            const moveY = y * 0.15;
            
            element.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate(0, 0)';
        });
    });
}

// Animated Progress Bars
function initProgressBars() {
    const progressBars = document.querySelectorAll('.skill-progress-bar');
    
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetWidth = entry.target.getAttribute('data-width') || '100';
                entry.target.style.width = targetWidth + '%';
                progressObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });
}

// Enhanced Smooth Scroll with Offset
function enhanceSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Cursor Trail Effect (Optional - can be toggled)
function initCursorTrail() {
    if (window.innerWidth < 768) return; // Skip on mobile
    
    const trail = [];
    const trailLength = 20;
    
    document.addEventListener('mousemove', (e) => {
        trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
        
        if (trail.length > trailLength) {
            trail.shift();
        }
        
        // Remove old trail elements
        document.querySelectorAll('.cursor-trail').forEach(el => {
            if (Date.now() - parseInt(el.dataset.time) > 500) {
                el.remove();
            }
        });
        
        // Create new trail dot
        const dot = document.createElement('div');
        dot.className = 'cursor-trail';
        dot.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            width: 4px;
            height: 4px;
            background: var(--accent-primary);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.6;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
        `;
        dot.dataset.time = Date.now();
        document.body.appendChild(dot);
        
        setTimeout(() => {
            dot.style.opacity = '0';
            setTimeout(() => dot.remove(), 300);
        }, 100);
    });
}

// Enhanced Navbar Scroll Effect
function enhanceNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('nav-scroll');
        } else {
            navbar.classList.remove('nav-scroll');
        }
        
        // Hide/show navbar on scroll
        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

// Initialize all enhanced features
document.addEventListener('DOMContentLoaded', () => {
    initPageLoader();
    initParallax();
    initAboutRevealTargets();
    initAboutTimelineLines();
    initEnhancedScrollReveal();
    enhanceProjectCardAnimations();
    initMagneticEffect();
    initProgressBars();
    enhanceSmoothScroll();
    // initCursorTrail(); // Uncomment if you want cursor trail
    enhanceNavbarScroll();
});

// ========== STATE-OF-THE-ART INNOVATION FEATURES ==========

// Custom Interactive Cursor
function initCustomCursor() {
    if (window.innerWidth < 768) return; // Skip on mobile
    
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    
    const cursorDot = document.createElement('div');
    cursorDot.className = 'custom-cursor-dot';
    document.body.appendChild(cursorDot);
    
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Smooth cursor following
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .btn, .project-card, .skill-card, .tech-tag');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        el.addEventListener('mousedown', () => cursor.classList.add('click'));
        el.addEventListener('mouseup', () => cursor.classList.remove('click'));
    });
}

// Interactive 3D Hero with Mouse Tracking
function init3DHero() {
    const heroContent = document.querySelector('.hero-content');
    const heroText = document.querySelector('.hero-text');
    const heroMedia = document.querySelector('.hero-media-card');
    
    if (!heroContent) return;
    
    heroContent.addEventListener('mousemove', (e) => {
        const rect = heroContent.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        if (heroText) {
            heroText.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(50px)`;
        }
        
        if (heroMedia) {
            heroMedia.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${-rotateY}deg) translateZ(30px)`;
        }
    });
    
    heroContent.addEventListener('mouseleave', () => {
        if (heroText) heroText.style.transform = '';
        if (heroMedia) heroMedia.style.transform = '';
    });
}

// Advanced Text Reveal
function initTextReveal() {
    const revealElements = document.querySelectorAll('.text-reveal-word');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    revealElements.forEach(el => revealObserver.observe(el));
}

// Magnetic Text Effect
function initMagneticText() {
    const magneticTexts = document.querySelectorAll('.magnetic-text');
    
    magneticTexts.forEach(text => {
        text.addEventListener('mousemove', (e) => {
            const rect = text.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const moveX = x * 0.3;
            const moveY = y * 0.3;
            
            text.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        text.addEventListener('mouseleave', () => {
            text.style.transform = 'translate(0, 0)';
        });
    });
}

// Enhanced Particle Interactions
function enhanceParticleInteractions() {
    const particleZones = document.querySelectorAll('.particle-zone');
    
    particleZones.forEach(zone => {
        zone.addEventListener('mouseenter', () => {
            zone.style.transform = 'scale(1.02)';
        });
        zone.addEventListener('mouseleave', () => {
            zone.style.transform = '';
        });
    });
}

// Initialize all state-of-the-art features
window.addEventListener('DOMContentLoaded', () => {
    initCustomCursor();
    init3DHero();
    initTextReveal();
    initMagneticText();
    enhanceParticleInteractions();
});
