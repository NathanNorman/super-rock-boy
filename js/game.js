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
        this.baseRadius = 20;  // Moved outside of rock object
        
        // Define physics constants
        this.physics = {
            gravity: 0.5,
            jumpForce: -12,
            groundY: this.canvas.height - 50, // Ground position
            moveSpeed: 0.8,    // Added for horizontal movement
            maxSpeedX: 8,      // Maximum horizontal speed
            groundFriction: 0.90,  // Friction when on ground
            // Add rotation physics
            rotationFactor: 0.05,  // How much movement affects rotation
            rotationFriction: 0.98, // How quickly rotation slows down
            // Add clear threshold for stopping
            stopThreshold: 0.1  // Velocity threshold for complete stop
        };
        
        // Now create rock with updated properties
        this.rock = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            baseRadius: this.baseRadius,
            points: this.generateRockPoints(),
            color: '#808080',
            details: this.generateRockDetails(),
            // Updated movement properties
            velocityX: 0,
            velocityY: 0,
            acceleration: this.physics.moveSpeed,  // Use moveSpeed for acceleration
            maxSpeedX: this.physics.maxSpeedX,
            friction: this.physics.groundFriction,
            // New properties
            rotation: 0,
            rotationVelocity: 0,
            isGrounded: false,
            canJump: false
        };
        
        // Modify input state tracking
        this.keys = {
            left: false,
            right: false,
            up: false,
            jumpPressed: false // Track jump key press separately
        };
        
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
    }
    
    generateRockPoints(numPoints = 12) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            // Use this.baseRadius instead of this.rock.baseRadius
            const radiusVariation = 0.8 + Math.random() * 0.4;
            points.push({
                x: Math.cos(angle) * this.baseRadius * radiusVariation,
                y: Math.sin(angle) * this.baseRadius * radiusVariation
            });
        }
        return points;
    }

    generateRockDetails() {
        const details = [];
        const numDetails = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numDetails; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            // Use this.baseRadius instead of this.rock.baseRadius
            const length = this.baseRadius * (0.3 + Math.random() * 0.4);
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
        
        // Create gradient for 3D effect (adjusted for rotation)
        const gradient = this.ctx.createRadialGradient(
            -this.baseRadius * 0.3, // Relative to center now
            -this.baseRadius * 0.3,
            0,
            0, // Center of rotation
            0,
            this.baseRadius
        );
        gradient.addColorStop(0, '#A0A0A0');
        gradient.addColorStop(0.6, '#808080');
        gradient.addColorStop(1, '#606060');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw rock details (cracks)
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        
        this.rock.details.forEach(detail => {
            this.ctx.beginPath();
            const startX = Math.cos(detail.startAngle) * this.baseRadius * 0.5;
            const startY = Math.sin(detail.startAngle) * this.baseRadius * 0.5;
            this.ctx.moveTo(startX, startY);
            
            const endX = startX + Math.cos(detail.startAngle) * detail.length;
            const endY = startY + Math.sin(detail.startAngle) * detail.length;
            const controlX = (startX + endX) / 2 + detail.curve * this.baseRadius;
            const controlY = (startY + endY) / 2 + detail.curve * this.baseRadius;
            
            this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            this.ctx.stroke();
        });
        
        // Restore the context
        this.ctx.restore();
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