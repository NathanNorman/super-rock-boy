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
        
        // Now create rock with points and details
        this.rock = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            baseRadius: this.baseRadius,
            points: this.generateRockPoints(),
            color: '#808080',
            details: this.generateRockDetails()
        };
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Add basic initialization here
        console.log('Super Rock Boy initialized!');
        
        // Start the game loop
        this.gameLoop();
    }
    
    gameLoop() {
        // Basic game loop
        this.update();
        this.draw();
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update game logic will go here
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
        
        // Draw the rock
        this.ctx.beginPath();
        const firstPoint = {
            x: this.rock.x + this.rock.points[0].x,
            y: this.rock.y + this.rock.points[0].y
        };
        this.ctx.moveTo(firstPoint.x, firstPoint.y);
        
        // Draw the main rock shape
        for (let i = 1; i <= this.rock.points.length; i++) {
            const point = this.rock.points[i % this.rock.points.length];
            this.ctx.lineTo(
                this.rock.x + point.x,
                this.rock.y + point.y
            );
        }
        
        // Create gradient for 3D effect
        const gradient = this.ctx.createRadialGradient(
            this.rock.x - this.rock.baseRadius * 0.3,
            this.rock.y - this.rock.baseRadius * 0.3,
            0,  // Changed from 0.1 to 0
            this.rock.x,
            this.rock.y,
            this.rock.baseRadius  // Reduced from baseRadius * 2
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
            const startX = this.rock.x + Math.cos(detail.startAngle) * this.rock.baseRadius * 0.5;
            const startY = this.rock.y + Math.sin(detail.startAngle) * this.rock.baseRadius * 0.5;
            this.ctx.moveTo(startX, startY);
            
            const endX = startX + Math.cos(detail.startAngle) * detail.length;
            const endY = startY + Math.sin(detail.startAngle) * detail.length;
            const controlX = (startX + endX) / 2 + detail.curve * this.rock.baseRadius;
            const controlY = (startY + endY) / 2 + detail.curve * this.rock.baseRadius;
            
            this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            this.ctx.stroke();
        });
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