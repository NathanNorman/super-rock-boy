import Health from './components/Health.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found!');
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Could not get 2D context!');
        }
        
        // Set initial canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set level bounds BEFORE creating background
        this.levelBounds = {
            width: this.canvas.width * 3,  // Three screens wide
            height: this.canvas.height
        };
        
        // Define base properties
        this.baseRadius = 20;
        
        // Create camera
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height,
            followSpeed: 0.1
        };
        
        // NOW create background with mountains
        this.background = {
            layers: [
                {
                    color: '#4B617A',
                    points: this.generateMountainPoints(3, 0.3),
                    parallaxFactor: 0.2
                },
                {
                    color: '#445469',
                    points: this.generateMountainPoints(4, 0.5),
                    parallaxFactor: 0.4
                },
                {
                    color: '#3A4757',
                    points: this.generateMountainPoints(5, 0.7),
                    parallaxFactor: 0.6
                }
            ]
        };
        
        // Create rock first since other systems depend on it
        this.rock = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            baseRadius: this.baseRadius,
            velocityX: 0,
            velocityY: 0,
            rotation: 0,
            rotationVelocity: 0,
            isGrounded: false,
            canJump: false
        };
        
        // Now generate visual properties
        this.rock.points = this.generateRockPoints();
        this.rock.details = this.generateRockDetails();
        
        // Then define physics constants
        this.physics = {
            gravity: 0.5,
            jumpForce: -12,
            groundY: this.canvas.height - 50,
            moveSpeed: 0.8,
            maxSpeedX: 8,
            groundFriction: 0.90,
            rotationFactor: 0.05,
            rotationFriction: 0.98,
            stopThreshold: 0.1
        };
        
        // Update rock physics properties
        this.rock.acceleration = this.physics.moveSpeed;
        this.rock.maxSpeedX = this.physics.maxSpeedX;
        this.rock.friction = this.physics.groundFriction;
        
        // Define platforms array
        this.platforms = [
            // Starting area
            {
                x: 100,
                y: this.canvas.height - 200,
                width: 200,
                height: 20,
                color: '#654321'
            },
            {
                x: 400,
                y: this.canvas.height - 300,
                width: 200,
                height: 20,
                color: '#654321'
            },
            // Middle section
            {
                x: 800,
                y: this.canvas.height - 250,
                width: 200,
                height: 20,
                color: '#654321'
            },
            {
                x: 1100,
                y: this.canvas.height - 350,
                width: 200,
                height: 20,
                color: '#654321'
            },
            {
                x: 1400,
                y: this.canvas.height - 200,
                width: 200,
                height: 20,
                color: '#654321'
            },
            // Final section
            {
                x: 1700,
                y: this.canvas.height - 300,
                width: 200,
                height: 20,
                color: '#654321'
            },
            {
                x: 2000,
                y: this.canvas.height - 400,
                width: 200,
                height: 20,
                color: '#654321'
            }
        ];
        
        // Add spikes array
        this.spikes = [
            // Ground spikes
            this.placeSpike(300),
            this.placeSpike(700),
            this.placeSpike(1200),
            this.placeSpike(1800),
            // Platform spikes
            this.placeSpike(500, this.canvas.height - 300),
            this.placeSpike(1150, this.canvas.height - 350),
            this.placeSpike(1450, this.canvas.height - 200),
            this.placeSpike(2050, this.canvas.height - 400)
        ];
        
        // Add health properties
        this.health = new Health(this);
        
        // Add to the constructor after health properties
        this.level = {
            current: 1,
            xp: 0,
            xpToNext: 100,  // Base XP needed
            evolution: 'pebble', // Current form
            worldLevel: 1, // New world level system
            // Evolution stages and their levels
            stages: {
                'pebble': { minLevel: 1, color: '#808080', strength: 1 },
                'rock': { minLevel: 5, color: '#606060', strength: 1.2 },
                'boulder': { minLevel: 10, color: '#404040', strength: 1.5 },
                'granite': { minLevel: 15, color: '#483D8B', strength: 1.8 },
                'diamond': { minLevel: 18, color: '#B9F2FF', strength: 2 }
            }
        };
        
        // Modify input state tracking
        this.keys = {
            left: false,
            right: false,
            up: false,
            jumpPressed: false, // Track jump key press separately
            space: false // Track space key press separately
        };
        
        // Add to constructor after this.keys
        this.debug = {
            enabled: true,
            panel: {
                x: this.canvas.width - 200,
                y: 40,
                width: 190,
                height: 120,
                color: 'rgba(0, 0, 0, 0.7)'
            },
            levelChange: {
                speed: 0,
                maxSpeed: 5, // Increased max speed
                acceleration: 0.1, // Increased acceleration
                deceleration: 0.2, // Added deceleration for better control
                active: false,
                direction: 0, // -1 for down, 1 for up
                lastUpdate: 0 // Track last update time for smoother changes
            }
        };
        
        // Add to constructor after platforms
        this.star = {
            x: this.canvas.width / 4,
            y: this.canvas.height / 2,
            size: 15,
            rotation: 0,
            velocityX: 3,
            velocityY: -2,
            trail: [],
            maxTrailLength: 20,
            bounceForce: 5,
            collected: false
        };
        
        // Add to constructor after star definition
        this.starRespawnTimer = 0;
        this.starRespawnDelay = 180; // 3 seconds at 60fps
        
        // Add miners array
        this.miners = [
            this.createMiner(600, this.physics.groundY),
            this.createMiner(1000, this.physics.groundY),
            this.createMiner(1500, this.physics.groundY),
            this.createMiner(2100, this.physics.groundY)
        ];
        
        // Add procedural generation tracking
        this.proceduralGeneration = {
            rightmostGenerated: this.levelBounds.width, // Track rightmost generated content
            leftmostGenerated: 0, // Track leftmost generated content
            generationDistance: 800, // Generate new content every 800 pixels
            lookAheadDistance: 1600 // Generate content this far ahead/behind player
        };
        
        // Initialize game music
        this.music = new Audio('assets/audio/supa_rock_boy_game_music.mp3');
        this.music.loop = true;
        
        // Initialize sound effects
        this.sounds = {
            jump: new Audio('assets/audio/jump_sound_effect.mp3'),
            damage: new Audio('assets/audio/damage_sound_effect.mp3'),
            starCollect: new Audio('assets/audio/star_collection.mp3')
        };
        
        // Setup music button
        this.setupMusicButton();
        
        // Initialize game
        this.init();
    }
    
    setupMusicButton() {
        const musicButton = document.getElementById('playMusic');
        if (musicButton) {
            musicButton.addEventListener('click', () => {
                this.music.play()
                    .then(() => {
                        musicButton.textContent = 'Music Playing';
                        musicButton.disabled = true;
                    })
                    .catch(e => console.warn('Audio play failed:', e));
            });
        }
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            // Stop any currently playing instance and reset
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.warn(`Sound ${soundName} play failed:`, e));
        }
    }

    init() {
        // Add keyboard event listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Add mobile touch controls
        this.initMobileControls();
        
        // Add mobile tap-to-restart for game over screen
        this.initMobileTapRestart();
        
        // Add mobile fullscreen functionality
        this.initMobileFullscreen();
        
        // Initialize timing for delta time calculations
        this.lastFrameTime = performance.now();
        this.targetFPS = 60;
        this.targetFrameTime = 1000 / this.targetFPS; // ~16.67ms for 60 FPS
        
        console.log('Super Rock Boy initialized!');
        this.gameLoop();
    }

    initMobileControls() {
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const jumpBtn = document.getElementById('jump-btn');

        if (leftBtn && rightBtn && jumpBtn) {
            // Left button events
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.left = true;
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.left = false;
            });
            leftBtn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys.left = false;
            });

            // Right button events  
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.right = true;
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.right = false;
            });
            rightBtn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys.right = false;
            });

            // Jump button events
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.keys.jumpPressed && this.rock.canJump) {
                    this.rock.velocityY = this.physics.jumpForce;
                    this.rock.canJump = false;
                    this.playSound('jump');
                    this.keys.jumpPressed = true;
                }
            });
            jumpBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.jumpPressed = false;
            });
            jumpBtn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys.jumpPressed = false;
            });

            // Also add mouse events for desktop testing
            leftBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys.left = true;
            });
            leftBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys.left = false;
            });

            rightBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.keys.right = true;
            });
            rightBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys.right = false;
            });

            jumpBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (!this.keys.jumpPressed && this.rock.canJump) {
                    this.rock.velocityY = this.physics.jumpForce;
                    this.rock.canJump = false;
                    this.playSound('jump');
                    this.keys.jumpPressed = true;
                }
            });
            jumpBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.keys.jumpPressed = false;
            });
        }
    }

    initMobileTapRestart() {
        // Add tap-anywhere-to-restart for mobile when game is over
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // Check if game is over or win screen is showing
            if (this.health.isGameOver || (this.winScreen?.active && this.winScreen?.gameComplete)) {
                this.keys.space = true; // Simulate space key press
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.space = false;
        });
        
        // Also add click support for desktop testing
        this.canvas.addEventListener('click', (e) => {
            if (this.health.isGameOver || (this.winScreen?.active && this.winScreen?.gameComplete)) {
                this.keys.space = true;
                // Reset after a short delay to simulate key press
                setTimeout(() => {
                    this.keys.space = false;
                }, 100);
            }
        });
    }

    initMobileFullscreen() {
        // Track orientation and fullscreen state
        this.isLandscape = false;
        this.isFullscreen = false;
        
        // Handle orientation changes
        const handleOrientationChange = () => {
            // Use setTimeout to ensure orientation change is complete
            setTimeout(() => {
                const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
                let isLandscape = false;
                
                if (orientation) {
                    // Modern orientation API
                    isLandscape = orientation.angle === 90 || orientation.angle === -90 || 
                                  orientation.type.includes('landscape');
                } else {
                    // Fallback for older devices
                    isLandscape = window.innerWidth > window.innerHeight;
                }
                
                this.isLandscape = isLandscape;
                
                // Request fullscreen when rotating to landscape on mobile
                if (isLandscape && this.isMobileDevice() && !this.isFullscreen) {
                    this.requestFullscreen();
                } else if (!isLandscape && this.isFullscreen) {
                    this.exitFullscreen();
                }
                
                // Resize canvas for orientation
                this.handleCanvasResize();
            }, 100);
        };
        
        // Listen for orientation changes
        if (screen.orientation) {
            screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            // Fallback for older browsers
            window.addEventListener('orientationchange', handleOrientationChange);
            window.addEventListener('resize', handleOrientationChange);
        }
        
        // Handle fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.handleCanvasResize();
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            this.isFullscreen = !!document.webkitFullscreenElement;
            this.handleCanvasResize();
        });
        
        // Add manual fullscreen button for mobile
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                if (!this.isFullscreen) {
                    this.requestFullscreen();
                } else {
                    this.exitFullscreen();
                }
            });
        }
    }
    
    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }
    
    requestFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(e => console.log('Fullscreen request failed:', e));
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(e => console.log('Exit fullscreen failed:', e));
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    handleCanvasResize() {
        if (this.isLandscape && this.isMobileDevice()) {
            // Landscape mode - use full screen dimensions
            const maxWidth = window.innerWidth;
            const maxHeight = window.innerHeight;
            
            // Maintain aspect ratio while maximizing screen usage
            const gameAspectRatio = 800 / 600; // Original canvas ratio
            const screenAspectRatio = maxWidth / maxHeight;
            
            if (screenAspectRatio > gameAspectRatio) {
                // Screen is wider than game ratio
                this.canvas.style.height = `${maxHeight}px`;
                this.canvas.style.width = `${maxHeight * gameAspectRatio}px`;
            } else {
                // Screen is taller than game ratio
                this.canvas.style.width = `${maxWidth}px`;
                this.canvas.style.height = `${maxWidth / gameAspectRatio}px`;
            }
            
            // Center the canvas
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '50%';
            this.canvas.style.left = '50%';
            this.canvas.style.transform = 'translate(-50%, -50%)';
            this.canvas.style.zIndex = '1000';
            
            // Hide other UI elements in landscape fullscreen
            document.body.classList.add('landscape-fullscreen');
        } else {
            // Portrait mode or desktop - reset to default
            this.canvas.style.width = '';
            this.canvas.style.height = '';
            this.canvas.style.position = '';
            this.canvas.style.top = '';
            this.canvas.style.left = '';
            this.canvas.style.transform = '';
            this.canvas.style.zIndex = '';
            
            document.body.classList.remove('landscape-fullscreen');
        }
    }

    handleKeyDown(e) {
        if (this.debug.enabled) {
            switch(e.key) {
                case '[': // Level down
                    this.debug.levelChange.active = true;
                    this.debug.levelChange.direction = -1;
                    break;
                case ']': // Level up
                    this.debug.levelChange.active = true;
                    this.debug.levelChange.direction = 1;
                    break;
                case '\\': // Toggle debug panel
                    this.toggleDebugPanel();
                    break;
            }
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'ArrowUp':
                if (!this.keys.jumpPressed && this.rock.canJump) {
                    this.rock.velocityY = this.physics.jumpForce;
                    this.rock.canJump = false;
                    this.playSound('jump');
                }
                this.keys.jumpPressed = true;
                this.keys.up = true;
                break;
            case ' ': // Space key
                this.keys.space = true;
                break;
        }
    }

    handleKeyUp(e) {
        if (this.debug.enabled) {
            switch(e.key) {
                case '[':
                case ']':
                    this.debug.levelChange.active = false;
                    this.debug.levelChange.speed = 0;
                    break;
            }
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ArrowUp':
                this.keys.up = false;
                this.keys.jumpPressed = false;
                break;
            case ' ': // Space key
                this.keys.space = false;
                break;
        }
    }
    
    gameLoop(currentTime = performance.now()) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Calculate delta multiplier (1.0 = perfect 60 FPS, 0.5 = 30 FPS, 2.0 = 120 FPS)
        const deltaMultiplier = deltaTime / this.targetFrameTime;
        
        // Cap extreme delta values to prevent physics breaking
        const cappedDelta = Math.min(deltaMultiplier, 3.0);
        
        // Update and draw with delta time
        this.update(cappedDelta);
        this.draw();
        
        // Request next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaMultiplier = 1.0) {
        // Check for win or game over first
        if (this.winScreen?.active || this.health.isGameOver) {
            // Only handle win screen particles and timer
            if (this.winScreen?.active) {
                // Update win screen particles (delta time compensated)
                this.winScreen.particles.forEach(particle => {
                    particle.x += particle.velocityX * deltaMultiplier;
                    particle.y += particle.velocityY * deltaMultiplier;
                    particle.life -= deltaMultiplier;
                });
                
                this.winScreen.particles = this.winScreen.particles.filter(p => p.life > 0);
                
                // If game is complete and space is pressed, restart
                if (this.winScreen.gameComplete && this.keys.space) {
                    this.resetGame();
                    return;
                }
                
                // Only count down timer if not complete
                if (!this.winScreen.gameComplete) {
                    this.winScreen.timer--;
                    if (this.winScreen.timer <= 0) {
                        this.startNextLevel();
                    }
                }
            }
            
            // Handle space to restart if game over
            if (this.health.isGameOver && this.keys.space) {
                this.resetGame();
            }
            
            return; // Skip all other game updates
        }

        // Horizontal movement with more responsive controls (delta time compensated)
        if (this.keys.left) {
            if (this.rock.isGrounded) {
                this.rock.velocityX = Math.max(this.rock.velocityX - this.rock.acceleration * deltaMultiplier, -this.rock.maxSpeedX);
            } else {
                // Slower acceleration in air
                this.rock.velocityX = Math.max(this.rock.velocityX - this.rock.acceleration * 0.5 * deltaMultiplier, -this.rock.maxSpeedX);
            }
        }
        if (this.keys.right) {
            if (this.rock.isGrounded) {
                this.rock.velocityX = Math.min(this.rock.velocityX + this.rock.acceleration * deltaMultiplier, this.rock.maxSpeedX);
            } else {
                // Slower acceleration in air
                this.rock.velocityX = Math.min(this.rock.velocityX + this.rock.acceleration * 0.5 * deltaMultiplier, this.rock.maxSpeedX);
            }
        }

        // Apply gravity (delta time compensated)
        this.rock.velocityY += this.physics.gravity * deltaMultiplier;

        // Apply friction only when on ground and not pressing movement keys (delta time compensated)
        if (this.rock.isGrounded && !this.keys.left && !this.keys.right) {
            this.rock.velocityX *= Math.pow(this.rock.friction, deltaMultiplier);
            
            // Clear stop check - if below threshold, stop completely
            if (Math.abs(this.rock.velocityX) < this.physics.stopThreshold) {
                this.rock.velocityX = 0;
                this.rock.rotationVelocity = 0;
            }
        }

        // Update position (delta time compensated)
        this.rock.x += this.rock.velocityX * deltaMultiplier;
        this.rock.y += this.rock.velocityY * deltaMultiplier;

        // Simplified rotation update - only rotate if we have meaningful velocity (delta time compensated)
        if (Math.abs(this.rock.velocityX) >= this.physics.stopThreshold) {
            if (this.rock.isGrounded) {
                this.rock.rotationVelocity = this.rock.velocityX * this.physics.rotationFactor;
            } else {
                this.rock.rotationVelocity *= Math.pow(this.physics.rotationFriction, deltaMultiplier);
            }
        } else {
            this.rock.rotationVelocity = 0;
        }
        
        // Update rotation (delta time compensated)
        this.rock.rotation += this.rock.rotationVelocity * deltaMultiplier;

        // Ground collision handling
        if (this.rock.y + this.baseRadius > this.physics.groundY) {
            this.rock.y = this.physics.groundY - this.baseRadius;
            
            if (this.rock.velocityY > 3) {
                // Add extra rotation on hard landings only if we have meaningful velocity
                if (Math.abs(this.rock.velocityX) >= this.physics.stopThreshold) {
                    this.rock.rotationVelocity += (Math.random() - 0.5) * this.rock.velocityY * 0.1;
                }
                this.rock.velocityY = -this.rock.velocityY * 0.3;
            } else {
                // For soft landings, check against stop threshold
                if (Math.abs(this.rock.velocityX) < this.physics.stopThreshold) {
                    this.rock.velocityX = 0;
                    this.rock.velocityY = 0;
                    this.rock.rotationVelocity = 0;
                }
            }
            
            this.rock.isGrounded = true;
            this.rock.canJump = true;
        } else {
            this.rock.isGrounded = false;
        }

        // No horizontal boundaries - infinite scrolling in both directions

        // Update rotation position
        this.rock.rotation += this.rock.rotationVelocity;

        // Check platform collisions
        this.platforms.forEach(platform => {
            if (this.rock.velocityY >= 0 && // Moving downward
                this.rock.y + this.rock.baseRadius > platform.y && 
                this.rock.y - this.rock.baseRadius < platform.y + platform.height &&
                this.rock.x + this.rock.baseRadius > platform.x &&
                this.rock.x - this.rock.baseRadius < platform.x + platform.width) {
                
                this.rock.y = platform.y - this.rock.baseRadius;
                this.rock.velocityY = 0;
                this.rock.isGrounded = true;
                this.rock.canJump = true;
            }
        });

        // Check spike collisions
        this.spikes.forEach(spike => {
            if (!this.health.damageFlashTime && // Don't check during immunity frames
                this.rock.x + this.rock.baseRadius > spike.x &&
                this.rock.x - this.rock.baseRadius < spike.x + spike.width &&
                this.rock.y + this.rock.baseRadius > spike.y &&
                this.rock.y - this.rock.baseRadius < spike.y + spike.height) {
                
                this.health.takeDamage(10); // Reduced damage amount
                this.playSound('damage');
                
                // Bounce away from spike
                this.rock.velocityY = this.physics.jumpForce * 0.7;
                this.rock.velocityX = (this.rock.x < spike.x + spike.width/2) ? -8 : 8;
            }
        });

        // Update damage flash timer
        if (this.health.damageFlashTime > 0) {
            this.health.damageFlashTime--;
        }

        // Add XP over time (survival XP)
        if (!this.health.isGameOver) {
            this.level.xp += 0.1; // Small amount of XP for surviving
            
            // Check for level up
            if (this.level.xp >= this.level.xpToNext) {
                this.levelUp();
            }
        }

        // Update evolution particles if they exist
        if (this.evolutionParticles) {
            this.evolutionParticles = this.evolutionParticles.filter(particle => {
                particle.x += particle.velocityX * deltaMultiplier;
                particle.y += particle.velocityY * deltaMultiplier;
                particle.life -= deltaMultiplier;
                return particle.life > 0;
            });
            
            if (this.evolutionParticles.length === 0) {
                this.evolutionParticles = null;
            }
        }

        // Update star effects particles if they exist  
        if (this.starEffects) {
            this.starEffects = this.starEffects.filter(particle => {
                particle.x += particle.velocityX * deltaMultiplier;
                particle.y += particle.velocityY * deltaMultiplier;
                particle.life -= deltaMultiplier;
                return particle.life > 0;
            });
            
            if (this.starEffects.length === 0) {
                this.starEffects = null;
            }
        }

        // Update star collection particles if they exist
        if (this.starCollectParticles) {
            this.starCollectParticles = this.starCollectParticles.filter(particle => {
                particle.x += particle.velocityX * deltaMultiplier;
                particle.y += particle.velocityY * deltaMultiplier;
                particle.life -= deltaMultiplier;
                return particle.life > 0;
            });
            
            if (this.starCollectParticles.length === 0) {
                this.starCollectParticles = null;
            }
        }

        // Update star
        if (!this.star.collected) {
            // Move star (delta time compensated)
            this.star.x += this.star.velocityX * deltaMultiplier;
            this.star.y += this.star.velocityY * deltaMultiplier;
            this.star.rotation += 0.1 * deltaMultiplier;
            
            // Bounce off walls and ground with sparkle effect
            if (this.star.x < 20 || this.star.x > this.levelBounds.width - 20) {
                this.star.velocityX *= -1;
                this.createStarBounceEffect(this.star.x, this.star.y);
            }
            if (this.star.y < 20 || this.star.y > this.physics.groundY - 20) {
                this.star.velocityY *= -1;
                this.createStarBounceEffect(this.star.x, this.star.y);
            }
            
            // Add rainbow trail particle with more variation
            const hue = (Date.now() / 20) % 360; // Cycling rainbow effect
            this.star.trail.unshift({
                x: this.star.x,
                y: this.star.y,
                color: `hsl(${hue}, 100%, 70%)`,
                size: 2 + Math.random() * 2,
                life: 20,
                alpha: 1
            });
            
            // Limit trail length
            if (this.star.trail.length > this.star.maxTrailLength) {
                this.star.trail.pop();
            }
            
            // Update trail particles (delta time compensated)
            this.star.trail.forEach(particle => {
                particle.life -= deltaMultiplier;
                particle.alpha = particle.life / 20;
            });
            this.star.trail = this.star.trail.filter(particle => particle.life > 0);
            
            // Check collision with rock
            const dx = this.rock.x - this.star.x;
            const dy = this.rock.y - this.star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.rock.baseRadius + this.star.size && !this.star.collected) {
                this.star.collected = true;
                this.level.xp += 50; // Give XP for collecting star
                this.playSound('starCollect');
                this.startStarCollectEffect();
                this.starRespawnTimer = this.starRespawnDelay;
                
                // Check for level up
                if (this.level.xp >= this.level.xpToNext) {
                    this.levelUp();
                }
            }
        }

        // Handle star respawning
        if (this.star.collected) {
            if (this.starRespawnTimer > 0) {
                this.starRespawnTimer--;
            } else {
                // Respawn star in new location
                this.star.collected = false;
                this.star.trail = [];
                
                // Find safe spawn position (away from rock and not in platforms)
                let safePosition = this.findSafeStarPosition();
                this.star.x = safePosition.x;
                this.star.y = safePosition.y;
                
                // Random initial velocity
                const angle = Math.random() * Math.PI * 2;
                this.star.velocityX = Math.cos(angle) * 3;
                this.star.velocityY = Math.sin(angle) * 3;
            }
        }

        // Add to update method before other updates
        if (this.winScreen?.active) {
            // Update win screen particles (delta time compensated)
            this.winScreen.particles.forEach(particle => {
                particle.x += particle.velocityX * deltaMultiplier;
                particle.y += particle.velocityY * deltaMultiplier;
                particle.life -= deltaMultiplier;
            });
            
            this.winScreen.particles = this.winScreen.particles.filter(p => p.life > 0);
            
            // Count down win screen timer (delta time compensated)
            this.winScreen.timer -= deltaMultiplier;
            if (this.winScreen.timer <= 0) {
                // Transition to next level or world
                this.startNextLevel();
            }
            return; // Skip other updates during win sequence
        }

        // Add to update method before other updates
        this.updateCamera();
        
        // Update miners
        this.updateMiners(deltaMultiplier);
        
        // Procedural generation based on player position
        this.updateProceduralGeneration();
        
        // Update level change with improved control
        if (this.debug.enabled && this.debug.levelChange.active) {
            // Accelerate
            this.debug.levelChange.speed = Math.min(
                this.debug.levelChange.maxSpeed,
                this.debug.levelChange.speed + this.debug.levelChange.acceleration
            );
            
            // Only update level on certain frames based on speed
            const now = Date.now();
            const updateDelay = Math.max(50, 200 - (this.debug.levelChange.speed * 30));
            
            if (now - this.debug.levelChange.lastUpdate > updateDelay) {
                const newLevel = Math.max(1, Math.min(100, 
                    this.level.current + this.debug.levelChange.direction
                ));
                
                if (newLevel !== this.level.current) {
                    this.level.current = newLevel;
                    
                    // Update evolution based on new level
                    for (const [stage, data] of Object.entries(this.level.stages)) {
                        if (this.level.current >= data.minLevel) {
                            if (this.level.evolution !== stage) {
                                this.level.evolution = stage;
                                this.startEvolutionAnimation();
                            }
                        }
                    }
                    
                    // Update rock properties with proper scaling
                    const evolutionData = this.level.stages[this.level.evolution];
                    const levelScale = 1 + (this.level.current * 0.05); // 5% size increase per level
                    
                    this.rock.baseRadius = this.baseRadius * levelScale * evolutionData.strength;
                    this.rock.points = this.generateRockPoints();
                    this.rock.details = this.generateRockDetails();
                    
                    // Update health scaling
                    this.health.max = 100 * evolutionData.strength * levelScale;
                    this.health.current = this.health.max;
                }
                
                this.debug.levelChange.lastUpdate = now;
            }
        } else {
            // Decelerate when not active
            this.debug.levelChange.speed = Math.max(0,
                this.debug.levelChange.speed - this.debug.levelChange.deceleration
            );
        }
        
        this.health.update();
    }
    
    generateRockPoints(numPoints = 12) {
        const points = [];
        const radius = this.rock ? this.rock.baseRadius : this.baseRadius;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radiusVariation = 0.8 + Math.random() * 0.4;
            points.push({
                x: Math.cos(angle) * radius * radiusVariation,
                y: Math.sin(angle) * radius * radiusVariation
            });
        }
        return points;
    }

    generateRockDetails() {
        const details = [];
        const radius = this.rock ? this.rock.baseRadius : this.baseRadius;
        const numDetails = Math.max(2, Math.min(4, Math.floor(radius / 10))); // Scale detail count with size
        
        for (let i = 0; i < numDetails; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const length = Math.min(radius * 0.4, 25); // Cap maximum length to prevent hair-like appearance
            const curve = (Math.random() - 0.5) * 0.3; // Reduce curve intensity
            const thickness = Math.max(1, radius / 15); // Scale thickness with size
            
            details.push({
                startAngle,
                length,
                curve,
                thickness
            });
        }
        return details;
    }
    
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save the context state
        this.ctx.save();
        
        // Apply camera transform (negative to move world opposite to camera)
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw parallax background
        this.ctx.save();
        
        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#1e3c72');
        skyGradient.addColorStop(1, '#2a5298');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
        
        // Draw each mountain layer with infinite parallax effect
        this.background.layers.forEach(layer => {
            const parallaxOffset = this.camera.x * layer.parallaxFactor;
            const layerWidth = this.levelBounds.width;
            
            // Calculate how many times we need to repeat the mountains
            const startRepeat = Math.floor(parallaxOffset / layerWidth) - 1;
            const endRepeat = Math.ceil((parallaxOffset + this.canvas.width) / layerWidth) + 1;
            
            for (let repeat = startRepeat; repeat <= endRepeat; repeat++) {
                this.ctx.beginPath();
                const offsetX = repeat * layerWidth - parallaxOffset;
                
                // Move to first point
                this.ctx.moveTo(
                    layer.points[0].x + offsetX,
                    layer.points[0].y
                );
                
                // Draw through all points
                layer.points.forEach(point => {
                    this.ctx.lineTo(
                        point.x + offsetX,
                        point.y
                    );
                });
                
                this.ctx.fillStyle = layer.color;
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
        
        // Draw ground
        const groundGradient = this.ctx.createLinearGradient(
            0, 
            this.physics.groundY - 20, 
            0, 
            this.physics.groundY + 50
        );
        groundGradient.addColorStop(0, '#8B4513'); // Darker brown at top
        groundGradient.addColorStop(0.4, '#A0522D'); // Medium brown
        groundGradient.addColorStop(1, '#6B4423'); // Darker brown at bottom

        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(
            -this.camera.x, // Adjust for camera position
            this.physics.groundY,
            this.levelBounds.width, // Make ground span entire level
            50 // Ground height
        );

        // Add some ground details
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let x = 0; x < this.levelBounds.width; x += 50) {
            const detailWidth = 20 + Math.random() * 30;
            const detailHeight = 2 + Math.random() * 4;
            this.ctx.fillRect(
                x - this.camera.x,
                this.physics.groundY,
                detailWidth,
                detailHeight
            );
        }
        
        // Draw platforms (they'll move with camera)
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Draw spikes (they'll move with camera)
        this.spikes.forEach(spike => {
            this.ctx.fillStyle = spike.color;
            this.ctx.beginPath();
            
            if (spike.upsideDown) {
                // Upside-down spike (on platforms) - point faces down
                this.ctx.moveTo(spike.x, spike.y);
                this.ctx.lineTo(spike.x + spike.width/2, spike.y + spike.height);
                this.ctx.lineTo(spike.x + spike.width, spike.y);
            } else {
                // Normal spike (on ground) - point faces up
                this.ctx.moveTo(spike.x, spike.y + spike.height);
                this.ctx.lineTo(spike.x + spike.width/2, spike.y);
                this.ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
        });
        
        // Draw miners
        this.miners.forEach(miner => {
            if (miner.health <= 0) return; // Skip dead miners
            
            this.drawMiner(miner);
        });
        
        // Draw star and its trail
        if (!this.star.collected) {
            // Draw trail first (so it appears behind the star)
            this.star.trail.forEach((particle, index) => {
                const alpha = particle.life / 20; // Fade out based on life
                this.ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw the star
            this.ctx.save();
            this.ctx.translate(this.star.x, this.star.y);
            this.ctx.rotate(this.star.rotation);
            
            // Star shape
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5;
                const x = Math.cos(angle) * this.star.size;
                const y = Math.sin(angle) * this.star.size;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            
            // Star gradient
            const starGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.star.size);
            starGradient.addColorStop(0, '#FFD700');  // Gold center
            starGradient.addColorStop(1, '#FFA500');  // Orange edge
            this.ctx.fillStyle = starGradient;
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        // Draw star indicator (arrow pointing to star when off-screen)
        this.drawStarIndicator();
        
        // Draw star collect particles if they exist
        if (this.starCollectParticles) {
            this.starCollectParticles.forEach(particle => {
                const alpha = particle.life / 60;
                this.ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        // Draw the rock (now stays centered)
        if (!this.health.isGameOver) {
            // Save the current context state
            this.ctx.save();
            
            // Move to rock position and apply rotation
            this.ctx.translate(this.rock.x, this.rock.y);
            this.ctx.rotate(this.rock.rotation);
            
            // Draw the rock shape
            this.ctx.beginPath();
            this.ctx.moveTo(this.rock.points[0].x, this.rock.points[0].y);
            
            for (let i = 1; i <= this.rock.points.length; i++) {
                const point = this.rock.points[i % this.rock.points.length];
                this.ctx.lineTo(point.x, point.y);
            }
            
            // Create gradient for 3D effect
            const gradient = this.ctx.createRadialGradient(
                -this.rock.baseRadius * 0.3,
                -this.rock.baseRadius * 0.3,
                0,
                0,
                0,
                this.rock.baseRadius
            );
            
            if (this.health.damageFlashTime > 0) {
                gradient.addColorStop(0, '#FF6060');
                gradient.addColorStop(0.6, '#FF4040');
                gradient.addColorStop(1, '#FF2020');
            } else {
                const evolutionColor = this.level.stages[this.level.evolution].color;
                const brighterColor = this.brightenColor(evolutionColor, 20);
                const darkerColor = this.darkenColor(evolutionColor, 20);
                gradient.addColorStop(0, brighterColor);
                gradient.addColorStop(0.6, evolutionColor);
                gradient.addColorStop(1, darkerColor);
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Draw rock details as more natural-looking facets
            this.rock.details.forEach(detail => {
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.lineWidth = detail.thickness;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                const startX = Math.cos(detail.startAngle) * this.rock.baseRadius * 0.4;
                const startY = Math.sin(detail.startAngle) * this.rock.baseRadius * 0.4;
                this.ctx.moveTo(startX, startY);
                
                const endX = startX + Math.cos(detail.startAngle) * detail.length;
                const endY = startY + Math.sin(detail.startAngle) * detail.length;
                const controlX = (startX + endX) / 2 + detail.curve * this.rock.baseRadius * 0.3;
                const controlY = (startY + endY) / 2 + detail.curve * this.rock.baseRadius * 0.3;
                
                this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                this.ctx.stroke();
                
                // Add a lighter highlight line for depth
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                this.ctx.lineWidth = detail.thickness * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(startX - 1, startY - 1);
                this.ctx.quadraticCurveTo(controlX - 1, controlY - 1, endX - 1, endY - 1);
                this.ctx.stroke();
            });
            
            this.ctx.restore();
        }

        // Restore context before drawing UI
        this.ctx.restore();
        
        // Draw Health Bar
        this.health.draw(this.ctx);
        
        // Draw XP Bar
        const xpBarWidth = 200;
        const xpBarHeight = 10;
        const xpX = 10;
        const xpY = 40;
        
        // XP Background
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(xpX, xpY, xpBarWidth, xpBarHeight);
        
        // XP Fill
        const xpPercent = this.level.xp / this.level.xpToNext;
        this.ctx.fillStyle = '#4169E1';  // Royal Blue
        this.ctx.fillRect(xpX, xpY, xpBarWidth * xpPercent, xpBarHeight);
        
        // XP Border
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeRect(xpX, xpY, xpBarWidth, xpBarHeight);
        
        // Evolution Status
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(
            `Evolution: ${this.level.evolution.charAt(0).toUpperCase() + this.level.evolution.slice(1)}`,
            xpX, xpY + 30
        );
        this.ctx.fillText(`Level: ${this.level.current} | World: ${this.level.worldLevel}`, xpX + 150, xpY + 30);
        
        // Debug Panel
        if (this.debug.enabled) {
            // Panel background
            this.ctx.fillStyle = this.debug.panel.color;
            this.ctx.fillRect(
                this.debug.panel.x,
                this.debug.panel.y,
                this.debug.panel.width,
                this.debug.panel.height
            );
            
            // Debug info
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`FPS: ${Math.round(60)}`, this.debug.panel.x + 10, this.debug.panel.y + 20);
            this.ctx.fillText(`Position: (${Math.round(this.rock.x)}, ${Math.round(this.rock.y)})`, this.debug.panel.x + 10, this.debug.panel.y + 40);
            this.ctx.fillText(`Velocity: (${this.rock.velocityX.toFixed(2)}, ${this.rock.velocityY.toFixed(2)})`, this.debug.panel.x + 10, this.debug.panel.y + 60);
            this.ctx.fillText(`Grounded: ${this.rock.isGrounded}`, this.debug.panel.x + 10, this.debug.panel.y + 80);
            this.ctx.fillText(`Can Jump: ${this.rock.canJump}`, this.debug.panel.x + 10, this.debug.panel.y + 100);
        }
        
        // Game Over Screen
        if (this.health.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over', this.canvas.width/2, this.canvas.height/2);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press SPACE or tap to restart', this.canvas.width/2, this.canvas.height/2 + 50);
            
            this.ctx.textAlign = 'left'; // Reset text alignment
        }
        
        // Win Screen
        if (this.winScreen?.active) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw particles
            this.winScreen.particles.forEach(particle => {
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.winScreen.message, this.canvas.width/2, this.canvas.height/2);
            
            if (this.winScreen.gameComplete) {
                this.ctx.font = '24px Arial';
                this.ctx.fillText('Press SPACE or tap to play again', this.canvas.width/2, this.canvas.height/2 + 50);
            }
            
            this.ctx.textAlign = 'left'; // Reset text alignment
        }

        // Draw star effects (bounce particles)
        if (this.starEffects) {
            this.starEffects.forEach((particle, index) => {
                const alpha = particle.life / 15;
                this.ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // Draw star collection particles with enhanced effects
        if (this.starCollectParticles) {
            this.starCollectParticles.forEach(particle => {
                particle.alpha = particle.life / (particle.isSparkle ? 90 : 60);
                
                if (particle.isSparkle) {
                    // Draw sparkles
                    const flicker = 0.7 + Math.random() * 0.3;
                    this.ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255 * flicker).toString(16).padStart(2, '0')}`;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size * flicker, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // Draw burst particles
                    particle.rotation += particle.rotationSpeed;
                    this.ctx.save();
                    this.ctx.translate(particle.x, particle.y);
                    this.ctx.rotate(particle.rotation);
                    
                    this.ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -particle.size);
                    this.ctx.lineTo(particle.size * 0.5, particle.size * 0.5);
                    this.ctx.lineTo(-particle.size * 0.5, particle.size * 0.5);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    this.ctx.restore();
                }
            });
            
        }
    }

    startRockBreakAnimation() {
        this.rockPieces = [];
        // Create 8 pieces of the rock
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.rockPieces.push({
                x: this.rock.x,
                y: this.rock.y,
                velocityX: Math.cos(angle) * 5,
                velocityY: Math.sin(angle) * 5 - 2,
                size: this.rock.baseRadius / 2,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    resetGame() {
        // Only reset music if it's already playing
        if (!this.music.paused) {
            this.music.currentTime = 0;
            this.music.play().catch(e => console.warn('Audio play failed:', e));
        }
        
        // Reset level and evolution
        this.level = {
            current: 1,
            xp: 0,
            xpToNext: 100,
            evolution: 'pebble',
            worldLevel: 1, // Reset world level on game over
            stages: this.level.stages  // Keep the stage definitions
        };

        // Reset health - create new Health instance instead of plain object
        this.health = new Health(this);

        // Reset rock - ensure proper order of operations
        this.rock = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            baseRadius: this.baseRadius, // Reset to original base size
            velocityX: 0,
            velocityY: 0,
            acceleration: this.physics.moveSpeed,
            maxSpeedX: this.physics.maxSpeedX,
            friction: this.physics.groundFriction,
            rotation: 0,
            rotationVelocity: 0,
            isGrounded: false,
            canJump: false
        };
        
        // Generate visual properties after rock object is fully reset
        this.rock.points = this.generateRockPoints();
        this.rock.details = this.generateRockDetails();

        // Clear all special effects
        this.rockPieces = null;
        this.evolutionParticles = null;
        this.winScreen = null;
        
        // Reset star
        this.star.collected = false;
        this.star.x = this.canvas.width / 4;
        this.star.y = this.canvas.height / 2;
        this.star.trail = [];
        this.starCollectParticles = null;
        
        // Reset miners
        this.generateMinersForLevel();
        
        // Reset procedural generation
        this.proceduralGeneration.rightmostGenerated = this.levelBounds.width;
        this.proceduralGeneration.leftmostGenerated = 0;
    }

    // Modify the levelUp method
    levelUp() {
        this.level.current++;
        this.level.xp = 0;
        this.level.xpToNext = Math.floor(this.level.xpToNext * 1.5);
        
        // Base size increase per level (5% each level)
        const levelSizeIncrease = 1 + (this.level.current * 0.05);
        
        // Check for evolution and win condition
        let evolved = false;
        for (const [stage, data] of Object.entries(this.level.stages)) {
            if (this.level.current >= data.minLevel) {
                if (this.level.evolution !== stage) {
                    this.level.evolution = stage;
                    evolved = true;
                    this.startEvolutionAnimation();
                    
                    // Check for diamond evolution (level progression)
                    if (stage === 'diamond') {
                        this.startNextWorldLevel();
                    }
                }
            }
        }
        
        // Update rock appearance based on current evolution
        const evolutionData = this.level.stages[this.level.evolution];
        this.rock.color = evolutionData.color;
        
        // Combine level scaling with evolution strength
        this.rock.baseRadius = this.baseRadius * levelSizeIncrease * evolutionData.strength;
        
        // Update collision radius and other size-dependent properties
        this.rock.points = this.generateRockPoints();
        this.rock.details = this.generateRockDetails();
        
        // Increase health cap with level and evolution
        this.health.max = 100 * evolutionData.strength * levelSizeIncrease;
        this.health.current = this.health.max;
    }

    // Add new world level progression method
    startNextWorldLevel() {
        this.winScreen = {
            active: true,
            timer: 180, // 3 seconds at 60fps
            particles: [],
            message: `Level ${this.level.worldLevel} Complete!`,
            gameComplete: false  // Continue to next level
        };
        
        // Create celebration particles
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.winScreen.particles.push({
                x: this.rock.x,
                y: this.rock.y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: `hsl(${Math.random() * 360}, 100%, 70%)`,
                size: 3 + Math.random() * 3,
                life: 120 + Math.random() * 60
            });
        }
    }

    // Add new method for level transition
    startNextLevel() {
        // Advance world level
        this.level.worldLevel++;
        
        // Reset evolution progress but keep some XP
        this.level.current = 1;
        this.level.xp = 0; 
        this.level.xpToNext = 100;
        this.level.evolution = 'pebble';
        
        // Reset rock to starting size and position
        this.rock.x = this.canvas.width / 2;
        this.rock.y = this.canvas.height / 2;
        this.rock.velocityX = 0;
        this.rock.velocityY = 0;
        this.rock.baseRadius = this.baseRadius;
        this.rock.points = this.generateRockPoints();
        this.rock.details = this.generateRockDetails();
        
        // Reset health
        this.health = new Health(this);
        
        // Generate new miners for this level (more miners on higher levels)
        this.generateMinersForLevel();
        
        // Reset procedural generation for new level
        this.proceduralGeneration.rightmostGenerated = this.levelBounds.width;
        this.proceduralGeneration.leftmostGenerated = 0;
        
        // Clear win screen
        this.winScreen = null;
        
        console.log(`Starting Level ${this.level.worldLevel}!`);
    }

    // Add color utility methods
    brightenColor(hex, percent) {
        return this.adjustColor(hex, percent);
    }

    darkenColor(hex, percent) {
        return this.adjustColor(hex, -percent);
    }

    adjustColor(hex, percent) {
        let r = parseInt(hex.substring(1,3), 16);
        let g = parseInt(hex.substring(3,5), 16);
        let b = parseInt(hex.substring(5,7), 16);

        r = Math.min(255, Math.max(0, r + (r * percent/100)));
        g = Math.min(255, Math.max(0, g + (g * percent/100)));
        b = Math.min(255, Math.max(0, b + (b * percent/100)));

        return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`;
    }

    // Add debug methods
    debugLevelUp() {
        this.level.xp = this.level.xpToNext;
        this.levelUp();
    }

    debugLevelDown() {
        if (this.level.current > 1) {
            this.level.current--;
            // Find appropriate evolution for this level
            for (const [stage, data] of Object.entries(this.level.stages)) {
                if (this.level.current >= data.minLevel) {
                    this.level.evolution = stage;
                }
            }
            // Update rock properties
            const evolutionData = this.level.stages[this.level.evolution];
            this.rock.color = evolutionData.color;
            this.rock.baseRadius = this.baseRadius * (1 + (evolutionData.strength - 1) * 0.5);
            this.health.max = 100 * evolutionData.strength;
            this.health.current = this.health.max;
        }
    }

    toggleDebugPanel() {
        this.debug.enabled = !this.debug.enabled;
    }

    // Add new method for star collection effect
    startStarCollectEffect() {
        const numParticles = 40; // Increased number of particles
        this.starCollectParticles = [];
        
        // Burst particles
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const speed = 2 + Math.random() * 5; // More varied speed
            const size = 2 + Math.random() * 3; // Varied sizes
            this.starCollectParticles.push({
                x: this.star.x,
                y: this.star.y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: `hsl(${(i / numParticles) * 360}, 100%, 70%)`,
                size: size,
                life: 45 + Math.random() * 30,
                alpha: 1,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
        
        // Add some sparkles that linger
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            this.starCollectParticles.push({
                x: this.star.x,
                y: this.star.y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: '#FFD700',
                size: 1 + Math.random() * 2,
                life: 60 + Math.random() * 30,
                alpha: 1,
                isSparkle: true
            });
        }
    }

    // Add new method for finding safe star position
    findSafeStarPosition() {
        const padding = 40; // Minimum distance from edges
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            // Generate random position
            let x = padding + Math.random() * (this.canvas.width - padding * 2);
            let y = padding + Math.random() * (this.physics.groundY - padding * 2);
            
            // Check distance from rock
            const dx = this.rock.x - x;
            const dy = this.rock.y - y;
            const distanceFromRock = Math.sqrt(dx * dx + dy * dy);
            
            // Check if position is safe (away from rock and platforms)
            let isSafe = distanceFromRock > 100; // Minimum 100px from rock
            
            // Check platform collisions
            if (isSafe) {
                isSafe = !this.platforms.some(platform => {
                    return x > platform.x - padding &&
                           x < platform.x + platform.width + padding &&
                           y > platform.y - padding &&
                           y < platform.y + platform.height + padding;
                });
            }
            
            if (isSafe) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback position if no safe spot found
        return {
            x: this.canvas.width / 4,
            y: this.canvas.height / 4
        };
    }

    // Add helper method for spike placement
    placeSpike(x, platformY = null) {
        const isOnPlatform = platformY !== null;
        return {
            x: x,
            y: platformY ? platformY + 20 : this.canvas.height - 70, // Platform spikes hang below platform, ground spikes on ground
            width: 30,
            height: 20,
            color: '#FF0000',
            upsideDown: isOnPlatform // Platform spikes point downward
        };
    }

    // Add this method to the Game class
    startEvolutionAnimation() {
        this.evolutionParticles = [];
        const numParticles = 20;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            this.evolutionParticles.push({
                x: this.rock.x,
                y: this.rock.y,
                velocityX: Math.cos(angle) * 3,
                velocityY: Math.sin(angle) * 3,
                size: 3,
                life: 60,
                color: this.level.stages[this.level.evolution].color
            });
        }
    }

    // Add new method for camera update
    updateCamera() {
        // Camera should center on the rock's position
        const targetX = this.rock.x - this.canvas.width/2;
        const targetY = this.rock.y - this.canvas.height/2;
        
        // Smooth camera movement
        this.camera.x += (targetX - this.camera.x) * this.camera.followSpeed;
        this.camera.y += (targetY - this.camera.y) * this.camera.followSpeed;
    }

    // Add new method for generating mountain points
    generateMountainPoints(peaks, height) {
        const points = [];
        const segments = peaks * 2;
        
        points.push({ x: 0, y: this.canvas.height });
        
        for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * this.levelBounds.width; // Use level width instead of canvas
            let y;
            
            if (i % 2 === 1) {
                y = this.canvas.height - (Math.random() * this.canvas.height * height);
            } else {
                y = this.canvas.height - (Math.random() * this.canvas.height * height * 0.5);
            }
            
            points.push({ x, y });
        }
        
        points.push({ x: this.levelBounds.width, y: this.canvas.height });
        
        return points;
    }

    // Add new method for bounce effect
    createStarBounceEffect(x, y) {
        const bounceParticles = [];
        for (let i = 0; i < 5; i++) {
            const angle = (Math.random() * Math.PI * 2);
            bounceParticles.push({
                x: x,
                y: y,
                velocityX: Math.cos(angle) * (1 + Math.random() * 2),
                velocityY: Math.sin(angle) * (1 + Math.random() * 2),
                color: `hsl(${Math.random() * 360}, 100%, 70%)`,
                size: 2 + Math.random() * 2,
                life: 15 + Math.random() * 10
            });
        }
        if (!this.starEffects) this.starEffects = [];
        this.starEffects.push(...bounceParticles);
    }
    
    // Draw star direction indicator when star is off-screen
    drawStarIndicator() {
        try {
            if (this.star.collected) return;
            
            // Calculate star position relative to camera/screen
            const starScreenX = this.star.x - this.camera.x;
            const starScreenY = this.star.y - this.camera.y;
            
            // Check if star is off-screen
            const margin = 50;
            const isOffScreen = starScreenX < -margin || starScreenX > this.canvas.width + margin ||
                               starScreenY < -margin || starScreenY > this.canvas.height + margin;
            
            if (isOffScreen) {
                // Simple approach: place indicator at edge based on direction
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const dx = starScreenX - centerX;
                const dy = starScreenY - centerY;
                
                if (Math.abs(dx) === 0 && Math.abs(dy) === 0) return; // Avoid issues when star is at center
                
                let indicatorX, indicatorY;
                const edgeMargin = 40;
                
                // Determine which edge based on larger displacement
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Star is more left/right than up/down
                    if (dx > 0) {
                        // Star is to the right - place indicator on right edge
                        indicatorX = this.canvas.width - edgeMargin;
                        indicatorY = centerY;
                    } else {
                        // Star is to the left - place indicator on left edge
                        indicatorX = edgeMargin;
                        indicatorY = centerY;
                    }
                } else {
                    // Star is more up/down than left/right
                    if (dy > 0) {
                        // Star is below - place indicator on bottom edge
                        indicatorX = centerX;
                        indicatorY = this.canvas.height - edgeMargin;
                    } else {
                        // Star is above - place indicator on top edge
                        indicatorX = centerX;
                        indicatorY = edgeMargin;
                    }
                }
                
                // Calculate angle for arrow direction
                const angle = Math.atan2(dy, dx);
                
                // Draw simple indicator
                this.ctx.save();
                this.ctx.translate(indicatorX, indicatorY);
                this.ctx.rotate(angle);
                
                // Pulsing effect
                const pulse = 0.9 + 0.1 * Math.sin(Date.now() / 300);
                this.ctx.scale(pulse, pulse);
                
                // Draw arrow
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.moveTo(8, 0);
                this.ctx.lineTo(-6, -4);
                this.ctx.lineTo(-3, 0);
                this.ctx.lineTo(-6, 4);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Arrow outline
                this.ctx.strokeStyle = '#B8860B';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                this.ctx.restore();
                
                // Draw star symbol nearby
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('★', indicatorX, indicatorY - 15);
            }
        } catch (error) {
            console.error('Star indicator error:', error);
            // Don't let indicator errors break the game
        }
    }
    
    // Add miner creation method
    createMiner(x, groundY) {
        return {
            x: x,
            y: groundY, // Position miner on ground level
            width: 20,
            height: 30,
            velocityX: 1 + Math.random() * 2, // Random walking speed
            direction: Math.random() > 0.5 ? 1 : -1, // Random initial direction
            health: 100,
            maxHealth: 100,
            
            // Attack properties
            attackRange: 40,
            attackDamage: 15,
            attackCooldown: 0,
            attackDelay: 180, // 3 seconds between attacks
            isAttacking: false,
            attackAnimation: 0,
            attackDuration: 60, // 1 second attack animation
            
            // Visual properties
            color: '#8B4513',
            pickaxeColor: '#654321',
            helmetColor: '#FFD700',
            
            // Animation properties
            walkAnimation: 0, // Animation timer for leg movement
            walkSpeed: 0.15 // Speed of walk animation
        };
    }
    
    // Add miner update method
    updateMiners(deltaMultiplier = 1.0) {
        this.miners.forEach(miner => {
            if (miner.health <= 0) return; // Skip dead miners
            
            // Calculate distance to rock
            const dx = this.rock.x - miner.x;
            const dy = this.rock.y - miner.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Update attack cooldown
            if (miner.attackCooldown > 0) {
                miner.attackCooldown--;
            }
            
            // Check if rock is in attack range
            if (distance <= miner.attackRange && !miner.isAttacking && miner.attackCooldown <= 0) {
                // Start attack
                miner.isAttacking = true;
                miner.attackAnimation = miner.attackDuration;
                miner.attackCooldown = miner.attackDelay;
            }
            
            // Handle attack animation
            if (miner.isAttacking) {
                miner.attackAnimation--;
                
                // Deal damage at peak of swing (halfway through animation)
                if (miner.attackAnimation === Math.floor(miner.attackDuration / 2)) {
                    if (distance <= miner.attackRange && !this.health.damageFlashTime) {
                        this.health.takeDamage(miner.attackDamage);
                        this.playSound('damage');
                        
                        // Knockback effect
                        const knockbackForce = 5;
                        if (distance > 0) { // Prevent division by zero
                            this.rock.velocityX += (dx / distance) * knockbackForce;
                            this.rock.velocityY = -3; // Small upward bounce
                        }
                    }
                }
                
                // End attack
                if (miner.attackAnimation <= 0) {
                    miner.isAttacking = false;
                }
            } else {
                // Normal movement when not attacking (delta time compensated)
                miner.x += miner.velocityX * miner.direction * deltaMultiplier;
                
                // Update walk animation (delta time compensated)
                miner.walkAnimation += miner.walkSpeed * deltaMultiplier;
                
                // Reverse direction randomly (no boundaries for infinite scrolling)
                if (Math.random() < 0.01) {
                    miner.direction *= -1;
                }
            }
        });
    }
    
    // Add miner drawing method with legs and funny face
    drawMiner(miner) {
        this.ctx.save();
        this.ctx.translate(miner.x, miner.y);
        
        // Flip sprite based on direction
        if (miner.direction < 0) {
            this.ctx.scale(-1, 1);
        }
        
        // Calculate leg positions for walking animation
        const legSwing = Math.sin(miner.walkAnimation) * 0.3; // Swing amount
        const leftLegAngle = miner.isAttacking ? 0 : legSwing;
        const rightLegAngle = miner.isAttacking ? 0 : -legSwing;
        
        // Draw legs
        this.ctx.strokeStyle = miner.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        // Left leg
        const leftLegX = -3;
        const leftLegStartY = -5;
        const leftLegEndX = leftLegX + Math.sin(leftLegAngle) * 8;
        const leftLegEndY = leftLegStartY + Math.cos(leftLegAngle) * 12;
        this.ctx.beginPath();
        this.ctx.moveTo(leftLegX, leftLegStartY);
        this.ctx.lineTo(leftLegEndX, leftLegEndY);
        this.ctx.stroke();
        
        // Right leg
        const rightLegX = 3;
        const rightLegStartY = -5;
        const rightLegEndX = rightLegX + Math.sin(rightLegAngle) * 8;
        const rightLegEndY = rightLegStartY + Math.cos(rightLegAngle) * 12;
        this.ctx.beginPath();
        this.ctx.moveTo(rightLegX, rightLegStartY);
        this.ctx.lineTo(rightLegEndX, rightLegEndY);
        this.ctx.stroke();
        
        // Draw feet
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.arc(leftLegEndX, leftLegEndY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(rightLegEndX, rightLegEndY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw miner body
        this.ctx.fillStyle = miner.color;
        this.ctx.fillRect(-miner.width/2, -miner.height, miner.width, miner.height);
        
        // Draw arms
        this.ctx.strokeStyle = miner.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, -miner.height/2);
        this.ctx.lineTo(-12, -miner.height/2 + 8);
        this.ctx.stroke();
        
        // Draw helmet
        this.ctx.fillStyle = miner.helmetColor;
        this.ctx.beginPath();
        this.ctx.arc(0, -miner.height + 5, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw helmet light
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(0, -miner.height + 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw funny face
        const faceY = -miner.height + 12;
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-3, faceY, 1.5, 0, Math.PI * 2); // Left eye
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(3, faceY, 1.5, 0, Math.PI * 2); // Right eye
        this.ctx.fill();
        
        // Nose
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.arc(0, faceY + 2, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mouth - changes based on if attacking
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        if (miner.isAttacking) {
            // Angry mouth when attacking
            this.ctx.arc(0, faceY + 4, 3, 0.2 * Math.PI, 0.8 * Math.PI);
        } else {
            // Happy mouth when walking
            this.ctx.arc(0, faceY + 3, 3, 0.2 * Math.PI, 0.8 * Math.PI, true);
        }
        this.ctx.stroke();
        
        // Mustache
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-4, faceY + 3);
        this.ctx.lineTo(-1, faceY + 2.5);
        this.ctx.moveTo(1, faceY + 2.5);
        this.ctx.lineTo(4, faceY + 3);
        this.ctx.stroke();
        
        // Draw pickaxe
        const attackProgress = miner.isAttacking ? 
            (miner.attackDuration - miner.attackAnimation) / miner.attackDuration : 0;
        const pickaxeAngle = miner.isAttacking ? 
            -Math.PI/4 + (attackProgress * Math.PI/2) : -Math.PI/6;
        
        // Pickaxe handle
        this.ctx.strokeStyle = miner.pickaxeColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        const handleLength = 20;
        const handleEndX = Math.cos(pickaxeAngle) * handleLength;
        const handleEndY = Math.sin(pickaxeAngle) * handleLength;
        this.ctx.moveTo(8, -miner.height/2);
        this.ctx.lineTo(8 + handleEndX, -miner.height/2 + handleEndY);
        this.ctx.stroke();
        
        // Pickaxe head - proper pickaxe shape (perpendicular to handle)
        this.ctx.save();
        this.ctx.translate(8 + handleEndX, -miner.height/2 + handleEndY);
        this.ctx.rotate(pickaxeAngle);
        
        // Main pickaxe head body (perpendicular to handle)
        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(-2, -8, 4, 16); // Vertical head connecting to handle
        
        // Pick side (pointed end going left)
        this.ctx.beginPath();
        this.ctx.moveTo(-2, -2); // Top of connection
        this.ctx.lineTo(-10, -1); // Point tip
        this.ctx.lineTo(-2, 2);  // Bottom of connection
        this.ctx.closePath();
        this.ctx.fill();
        
        // Adze side (flat blade going right)
        this.ctx.beginPath();
        this.ctx.moveTo(2, -3);  // Top of connection
        this.ctx.lineTo(8, -2);  // Top of blade
        this.ctx.lineTo(8, 2);   // Bottom of blade
        this.ctx.lineTo(2, 3);   // Bottom of connection
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add metal detail lines
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        // Detail on pick side
        this.ctx.moveTo(-2, 0);
        this.ctx.lineTo(-8, 0);
        // Detail on adze side
        this.ctx.moveTo(2, -1);
        this.ctx.lineTo(7, -1);
        this.ctx.moveTo(2, 1);
        this.ctx.lineTo(7, 1);
        this.ctx.stroke();
        
        // Add metal shine highlights
        this.ctx.strokeStyle = '#BBB';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-1, -1);
        this.ctx.lineTo(-7, -0.5);
        this.ctx.moveTo(3, -2);
        this.ctx.lineTo(7, -1.5);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        this.ctx.restore();
    }
    
    // Add method to generate miners for current level
    generateMinersForLevel() {
        this.miners = [];
        const baseMiners = 4;
        const additionalMiners = Math.floor(this.level.worldLevel / 2); // More miners every 2 levels
        const totalMiners = Math.min(baseMiners + additionalMiners, 12); // Cap at 12 miners
        
        for (let i = 0; i < totalMiners; i++) {
            // Spread miners across a wider area for each level
            const spacing = 400 + (this.level.worldLevel * 100);
            const x = 400 + (i * spacing) + Math.random() * 200;
            this.miners.push(this.createMiner(x, this.physics.groundY));
        }
    }
    
    // Add procedural generation method for both directions
    updateProceduralGeneration() {
        const playerRightPoint = this.rock.x + this.proceduralGeneration.lookAheadDistance;
        const playerLeftPoint = this.rock.x - this.proceduralGeneration.lookAheadDistance;
        
        // Safeguards to prevent infinite loops
        const maxIterations = 10;
        
        // Generate new content to the right
        let rightIterations = 0;
        while (this.proceduralGeneration.rightmostGenerated < playerRightPoint && rightIterations < maxIterations) {
            const startX = this.proceduralGeneration.rightmostGenerated;
            const endX = startX + this.proceduralGeneration.generationDistance;
            
            // Safety check
            if (this.proceduralGeneration.generationDistance <= 0) {
                console.error('Invalid generation distance:', this.proceduralGeneration.generationDistance);
                break;
            }
            
            this.generateContentInRange(startX, endX);
            this.proceduralGeneration.rightmostGenerated = endX;
            rightIterations++;
        }
        
        // Generate new content to the left
        let leftIterations = 0;
        while (this.proceduralGeneration.leftmostGenerated > playerLeftPoint && leftIterations < maxIterations) {
            const endX = this.proceduralGeneration.leftmostGenerated;
            const startX = endX - this.proceduralGeneration.generationDistance;
            
            // Safety check
            if (this.proceduralGeneration.generationDistance <= 0) {
                console.error('Invalid generation distance:', this.proceduralGeneration.generationDistance);
                break;
            }
            
            this.generateContentInRange(startX, endX);
            this.proceduralGeneration.leftmostGenerated = startX;
            leftIterations++;
        }
        
        // Clean up old content that's far from the player
        this.cleanupOldContent();
    }
    
    // Generate platforms, spikes, and miners in a specific range
    generateContentInRange(startX, endX) {
        const rangeWidth = endX - startX;
        
        // Generate platforms (2-4 per range)
        const numPlatforms = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numPlatforms; i++) {
            const x = startX + 100 + Math.random() * (rangeWidth - 300);
            const y = this.canvas.height - 150 - Math.random() * 200;
            const width = 150 + Math.random() * 100;
            
            this.platforms.push({
                x: x,
                y: y,
                width: width,
                height: 20,
                color: '#654321'
            });
            
            // Maybe add spike to this platform (30% chance)
            if (Math.random() < 0.3) {
                const spikeX = x + 50 + Math.random() * (width - 100);
                this.spikes.push(this.placeSpike(spikeX, y));
            }
        }
        
        // Generate ground spikes (1-3 per range)
        const numGroundSpikes = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numGroundSpikes; i++) {
            const x = startX + 200 + Math.random() * (rangeWidth - 400);
            this.spikes.push(this.placeSpike(x));
        }
        
        // Generate miners (1-2 per range, scaled by world level)
        const baseMiners = 1 + Math.floor(Math.random() * 2);
        const worldScaling = Math.min(2, this.level.worldLevel * 0.5);
        const numMiners = Math.floor(baseMiners * worldScaling);
        
        for (let i = 0; i < numMiners; i++) {
            const x = startX + 100 + Math.random() * (rangeWidth - 200);
            this.miners.push(this.createMiner(x, this.physics.groundY));
        }
    }
    
    // Remove old content that's far from the player in both directions
    cleanupOldContent() {
        const cleanupDistance = 2000; // Remove content 2000px away from player
        const leftCleanupThreshold = this.rock.x - cleanupDistance;
        const rightCleanupThreshold = this.rock.x + cleanupDistance;
        
        // Remove old platforms
        this.platforms = this.platforms.filter(platform => 
            platform.x + platform.width > leftCleanupThreshold && 
            platform.x < rightCleanupThreshold
        );
        
        // Remove old spikes
        this.spikes = this.spikes.filter(spike => 
            spike.x + spike.width > leftCleanupThreshold && 
            spike.x < rightCleanupThreshold
        );
        
        // Remove old miners
        this.miners = this.miners.filter(miner => 
            miner.x > leftCleanupThreshold && 
            miner.x < rightCleanupThreshold
        );
    }
}

// Start the game when the window loads
window.onload = () => {
    try {
        const game = new Game();
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}; 