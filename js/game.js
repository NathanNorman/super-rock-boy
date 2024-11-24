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
        
        // Define base properties first
        this.baseRadius = 20;  // Base size for the rock
        
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
            // Starting with 3 test platforms at different heights
            {
                x: 100,
                y: this.canvas.height - 200,
                width: 200,
                height: 20,
                color: '#654321'  // Brown color for platforms
            },
            {
                x: 400,
                y: this.canvas.height - 300,
                width: 200,
                height: 20,
                color: '#654321'
            },
            {
                x: 600,
                y: this.canvas.height - 150,
                width: 200,
                height: 20,
                color: '#654321'
            }
        ];
        
        // Add spikes array
        this.spikes = [
            this.placeSpike(300),  // Ground spike
            this.placeSpike(500, this.canvas.height - 300)  // Platform spike
        ];
        
        // Add health properties
        this.health = {
            current: 100,
            max: 100,
            damageFlashTime: 0,
            isGameOver: false
        };
        
        // Add to the constructor after health properties
        this.level = {
            current: 1,
            xp: 0,
            xpToNext: 100,  // Base XP needed
            evolution: 'pebble', // Current form
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
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Add keyboard event listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        console.log('Super Rock Boy initialized!');
        this.gameLoop();
    }

    handleKeyDown(e) {
        if (this.debug.enabled) {
            switch(e.key) {
                case '[': // Level down
                    this.debugLevelDown();
                    break;
                case ']': // Level up
                    this.debugLevelUp();
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
    
    gameLoop() {
        // Basic game loop
        this.update();
        this.draw();
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Check for win or game over first
        if (this.winScreen?.active || this.health.isGameOver) {
            // Only handle win screen particles and timer
            if (this.winScreen?.active) {
                // Update win screen particles
                this.winScreen.particles.forEach(particle => {
                    particle.x += particle.velocityX;
                    particle.y += particle.velocityY;
                    particle.life--;
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

        // Horizontal movement with more responsive controls
        if (this.keys.left) {
            if (this.rock.isGrounded) {
                this.rock.velocityX = Math.max(this.rock.velocityX - this.rock.acceleration, -this.rock.maxSpeedX);
            } else {
                // Slower acceleration in air
                this.rock.velocityX = Math.max(this.rock.velocityX - this.rock.acceleration * 0.5, -this.rock.maxSpeedX);
            }
        }
        if (this.keys.right) {
            if (this.rock.isGrounded) {
                this.rock.velocityX = Math.min(this.rock.velocityX + this.rock.acceleration, this.rock.maxSpeedX);
            } else {
                // Slower acceleration in air
                this.rock.velocityX = Math.min(this.rock.velocityX + this.rock.acceleration * 0.5, this.rock.maxSpeedX);
            }
        }

        // Apply gravity
        this.rock.velocityY += this.physics.gravity;

        // Apply friction only when on ground and not pressing movement keys
        if (this.rock.isGrounded && !this.keys.left && !this.keys.right) {
            this.rock.velocityX *= this.rock.friction;
            
            // Clear stop check - if below threshold, stop completely
            if (Math.abs(this.rock.velocityX) < this.physics.stopThreshold) {
                this.rock.velocityX = 0;
                this.rock.rotationVelocity = 0;
            }
        }

        // Update position
        this.rock.x += this.rock.velocityX;
        this.rock.y += this.rock.velocityY;

        // Simplified rotation update - only rotate if we have meaningful velocity
        if (Math.abs(this.rock.velocityX) >= this.physics.stopThreshold) {
            if (this.rock.isGrounded) {
                this.rock.rotationVelocity = this.rock.velocityX * this.physics.rotationFactor;
            } else {
                this.rock.rotationVelocity *= this.physics.rotationFriction;
            }
        } else {
            this.rock.rotationVelocity = 0;
        }

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

        // Horizontal boundaries with bounce
        if (this.rock.x - this.baseRadius < 0) {
            this.rock.x = this.baseRadius;
            this.rock.velocityX = Math.abs(this.rock.velocityX) * 0.5;
        } else if (this.rock.x + this.baseRadius > this.canvas.width) {
            this.rock.x = this.canvas.width - this.baseRadius;
            this.rock.velocityX = -Math.abs(this.rock.velocityX) * 0.5;
        }

        // Add rotation on wall bounces
        if (this.rock.x - this.baseRadius < 0 || this.rock.x + this.baseRadius > this.canvas.width) {
            this.rock.rotationVelocity *= -0.8; // Reverse some of the rotation on wall hits
        }

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
                
                this.health.current -= 20; // Damage amount
                this.health.damageFlashTime = 30; // Flash frames
                
                // Bounce away from spike
                this.rock.velocityY = this.physics.jumpForce * 0.7;
                this.rock.velocityX = (this.rock.x < spike.x + spike.width/2) ? -8 : 8;
                
                if (this.health.current <= 0) {
                    this.health.isGameOver = true;
                    this.startRockBreakAnimation();
                }
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
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.life--;
                return particle.life > 0;
            });
            
            if (this.evolutionParticles.length === 0) {
                this.evolutionParticles = null;
            }
        }

        // Update star
        if (!this.star.collected) {
            // Move star
            this.star.x += this.star.velocityX;
            this.star.y += this.star.velocityY;
            this.star.rotation += 0.1;
            
            // Bounce off walls and ground
            if (this.star.x < 20 || this.star.x > this.canvas.width - 20) {
                this.star.velocityX *= -1;
            }
            if (this.star.y < 20 || this.star.y > this.physics.groundY - 20) {
                this.star.velocityY *= -1;
            }
            
            // Add trail particle
            this.star.trail.unshift({
                x: this.star.x,
                y: this.star.y,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                life: 20
            });
            
            // Limit trail length
            if (this.star.trail.length > this.star.maxTrailLength) {
                this.star.trail.pop();
            }
            
            // Update trail particles
            this.star.trail.forEach(particle => {
                particle.life--;
            });
            this.star.trail = this.star.trail.filter(particle => particle.life > 0);
            
            // Check collision with rock
            const dx = this.rock.x - this.star.x;
            const dy = this.rock.y - this.star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.rock.baseRadius + this.star.size) {
                this.star.collected = true;
                this.debugLevelUp(); // Use existing level up function
                this.startStarCollectEffect();
                this.starRespawnTimer = this.starRespawnDelay;
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
            // Update win screen particles
            this.winScreen.particles.forEach(particle => {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.life--;
            });
            
            this.winScreen.particles = this.winScreen.particles.filter(p => p.life > 0);
            
            // Count down win screen timer
            this.winScreen.timer--;
            if (this.winScreen.timer <= 0) {
                // Transition to next level or world
                this.startNextLevel();
            }
            return; // Skip other updates during win sequence
        }
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
        const numDetails = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numDetails; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const length = radius * (0.3 + Math.random() * 0.4);
            const curve = (Math.random() - 0.5) * 0.5;
            
            details.push({
                startAngle,
                length,
                curve
            });
        }
        return details;
    }
    
    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#553311';
        this.ctx.fillRect(0, this.physics.groundY, this.canvas.width, this.canvas.height - this.physics.groundY);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Draw spikes
        this.spikes.forEach(spike => {
            this.ctx.fillStyle = spike.color;
            this.ctx.beginPath();
            this.ctx.moveTo(spike.x, spike.y + spike.height);
            this.ctx.lineTo(spike.x + spike.width/2, spike.y);
            this.ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
            this.ctx.closePath();
            this.ctx.fill();
        });

        // Only draw the main rock if the game isn't over
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
            
            // Draw rock details
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.lineWidth = 1;
            this.rock.details.forEach(detail => {
                this.ctx.beginPath();
                const startX = Math.cos(detail.startAngle) * this.rock.baseRadius * 0.5;
                const startY = Math.sin(detail.startAngle) * this.rock.baseRadius * 0.5;
                this.ctx.moveTo(startX, startY);
                
                const endX = startX + Math.cos(detail.startAngle) * detail.length;
                const endY = startY + Math.sin(detail.startAngle) * detail.length;
                const controlX = (startX + endX) / 2 + detail.curve * this.rock.baseRadius;
                const controlY = (startY + endY) / 2 + detail.curve * this.rock.baseRadius;
                
                this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
                this.ctx.stroke();
            });
            
            this.ctx.restore();
        }

        // Draw health bar (now outside the rotated context)
        // Move it to upper right corner with padding
        const healthBarWidth = 150;
        const healthBarHeight = 15;
        const padding = 10;
        
        // Background of health bar
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(
            this.canvas.width - healthBarWidth - padding, 
            padding, 
            healthBarWidth, 
            healthBarHeight
        );
        
        // Health bar fill
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(
            this.canvas.width - healthBarWidth - padding,
            padding,
            (this.health.current / this.health.max) * healthBarWidth,
            healthBarHeight
        );

        // Level and XP display
        const levelX = 10;
        const levelY = 10;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level.current} ${this.level.evolution}`, levelX, levelY + 15);

        // XP Bar
        const xpBarWidth = 150;
        const xpBarHeight = 5;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(levelX, levelY + 20, xpBarWidth, xpBarHeight);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(levelX, levelY + 20, 
            (this.level.xp / this.level.xpToNext) * xpBarWidth, xpBarHeight);

        // Draw evolution particles
        if (this.evolutionParticles) {
            this.evolutionParticles.forEach(particle => {
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.life / 60;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
        }

        // Draw game over screen if needed
        if (this.health.isGameOver) {
            // Draw breaking rock animation if pieces exist
            if (this.rockPieces) {
                this.rockPieces.forEach(piece => {
                    piece.x += piece.velocityX;
                    piece.y += piece.velocityY;
                    piece.velocityY += 0.2; // Gravity
                    piece.rotation += 0.1;

                    this.ctx.save();
                    this.ctx.translate(piece.x, piece.y);
                    this.ctx.rotate(piece.rotation);
                    this.ctx.fillStyle = '#808080';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, piece.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                });
            }

            // Draw game over screen
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw miner character
            const minerY = this.canvas.height / 2;
            const minerX = this.canvas.width/2;
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;

            // Head
            this.ctx.beginPath();
            this.ctx.arc(minerX, minerY - 45, 15, 0, Math.PI * 2);
            this.ctx.stroke();

            // Hard hat
            this.ctx.beginPath();
            this.ctx.arc(minerX, minerY - 50, 18, Math.PI, Math.PI * 2);
            this.ctx.stroke();
            // Hat brim
            this.ctx.beginPath();
            this.ctx.moveTo(minerX - 20, minerY - 50);
            this.ctx.lineTo(minerX + 20, minerY - 50);
            this.ctx.stroke();

            // Body
            this.ctx.beginPath();
            this.ctx.moveTo(minerX, minerY - 30);
            this.ctx.lineTo(minerX, minerY + 30);
            this.ctx.stroke();

            // Arms
            // Left arm holding pickaxe
            this.ctx.beginPath();
            this.ctx.moveTo(minerX, minerY - 10);
            this.ctx.lineTo(minerX - 30, minerY - 30);
            // Right arm
            this.ctx.moveTo(minerX, minerY - 10);
            this.ctx.lineTo(minerX + 25, minerY - 20);
            this.ctx.stroke();

            // Pickaxe
            this.ctx.beginPath();
            // Handle
            this.ctx.moveTo(minerX - 30, minerY - 30);
            this.ctx.lineTo(minerX - 60, minerY - 40);
            // Head of pickaxe
            this.ctx.lineTo(minerX - 70, minerY - 50); // Top point
            this.ctx.moveTo(minerX - 60, minerY - 40);
            this.ctx.lineTo(minerX - 70, minerY - 30); // Bottom point
            this.ctx.stroke();

            // Legs
            this.ctx.beginPath();
            this.ctx.moveTo(minerX, minerY + 30);
            this.ctx.lineTo(minerX - 20, minerY + 60);
            this.ctx.moveTo(minerX, minerY + 30);
            this.ctx.lineTo(minerX + 20, minerY + 60);
            this.ctx.stroke();

            // Boots
            this.ctx.beginPath();
            this.ctx.moveTo(minerX - 20, minerY + 60);
            this.ctx.lineTo(minerX - 25, minerY + 60);
            this.ctx.moveTo(minerX + 20, minerY + 60);
            this.ctx.lineTo(minerX + 25, minerY + 60);
            this.ctx.stroke();

            // Game Over Text (moved slightly up to make room for the full miner)
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over', this.canvas.width/2, minerY - 120);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press Space to Try Again', this.canvas.width/2, minerY + 100);
            
            return; // Don't draw the regular game
        }

        // Draw debug panel
        if (this.debug.enabled) {
            const panel = this.debug.panel;
            
            // Panel background
            this.ctx.fillStyle = panel.color;
            this.ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
            
            // Debug info text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Monospace';
            this.ctx.textAlign = 'left';
            
            const debugInfo = [
                `Level: ${this.level.current}`,
                `Evolution: ${this.level.evolution}`,
                `XP: ${Math.floor(this.level.xp)}/${this.level.xpToNext}`,
                `Health: ${Math.floor(this.health.current)}/${this.health.max}`,
                '',
                'Controls:',
                '[: Level Down',
                ']: Level Up',
                '\\: Toggle Panel'
            ];
            
            debugInfo.forEach((text, i) => {
                this.ctx.fillText(text, panel.x + 5, panel.y + 15 + (i * 13));
            });
        }

        // Draw star and its trail
        if (!this.star.collected) {
            // Draw trail
            this.star.trail.forEach((particle, index) => {
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.life / 20;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
            
            // Draw star
            this.ctx.save();
            this.ctx.translate(this.star.x, this.star.y);
            this.ctx.rotate(this.star.rotation);
            
            // Draw 5-pointed star
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
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.star.size);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Star shimmer
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        }

        // Draw star collect particles if they exist
        if (this.starCollectParticles) {
            this.starCollectParticles.forEach((particle, index) => {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.life--;
                
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.life / 60;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
            
            // Remove finished particles
            this.starCollectParticles = this.starCollectParticles.filter(p => p.life > 0);
            if (this.starCollectParticles.length === 0) {
                this.starCollectParticles = null;
            }
        }

        // Add to draw method before debug panel
        if (this.winScreen?.active) {
            // Fade background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw celebration particles
            this.winScreen.particles.forEach(particle => {
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.life / 120;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1;
            
            // Draw win message
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Win!', this.canvas.width/2, this.canvas.height/2 - 50);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(this.winScreen.message, this.canvas.width/2, this.canvas.height/2 + 10);
            
            // Change message based on game completion
            if (this.winScreen.gameComplete) {
                this.ctx.fillText('Press Space to Play Again', this.canvas.width/2, this.canvas.height/2 + 50);
            } else {
                this.ctx.fillText('Next Level Coming Soon...', this.canvas.width/2, this.canvas.height/2 + 50);
            }
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
        // Reset level and evolution
        this.level = {
            current: 1,
            xp: 0,
            xpToNext: 100,
            evolution: 'pebble',
            stages: this.level.stages  // Keep the stage definitions
        };

        // Reset health
        this.health = {
            current: 100,
            max: 100,
            damageFlashTime: 0,
            isGameOver: false
        };

        // Reset rock
        this.rock = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            baseRadius: this.baseRadius,
            points: this.generateRockPoints(),
            details: this.generateRockDetails(),
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
                    
                    // Check for diamond evolution (win condition)
                    if (stage === 'diamond') {
                        this.startWinSequence();
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

    // Add new win sequence method
    startWinSequence() {
        this.winScreen = {
            active: true,
            timer: 180, // 3 seconds at 60fps
            particles: [],
            message: "You've become a diamond!",
            gameComplete: true  // Add this flag
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
        // Reset position but keep evolution status
        this.rock.x = this.canvas.width / 2;
        this.rock.y = this.canvas.height / 2;
        this.rock.velocityX = 0;
        this.rock.velocityY = 0;
        
        // Could add more advanced level progression here
        this.winScreen = null;
        
        // For now, just add a congratulatory message
        console.log("Next level coming soon!");
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
        this.starCollectParticles = [];
        const numParticles = 30;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.starCollectParticles.push({
                x: this.star.x,
                y: this.star.y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: `hsl(${(i / numParticles) * 360}, 100%, 50%)`,
                life: 60 + Math.random() * 20
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
        return {
            x: x,
            y: platformY ? platformY + 20 : this.canvas.height - 70, // If no platform, place on ground
            width: 30,
            height: 20,
            color: '#FF0000'
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
}

// Start the game when the window loads
window.onload = () => {
    try {
        const game = new Game();
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}; 