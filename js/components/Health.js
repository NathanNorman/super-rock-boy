class Health {
    constructor(game) {
        this.game = game;
        this.max = 100;
        this.current = this.max;
        this.damageFlashTime = 0;
        this.isGameOver = false;
        this.immunityFrames = 0;
    }

    takeDamage(amount) {
        if (this.immunityFrames <= 0) {
            this.current -= amount;
            this.damageFlashTime = 10;
            this.immunityFrames = 30; // Half second of immunity at 60 FPS

            if (this.current <= 0) {
                this.current = 0;
                this.isGameOver = true;
            }
        }
    }

    update() {
        // Update damage flash timer
        if (this.damageFlashTime > 0) {
            this.damageFlashTime--;
        }

        // Update immunity frames
        if (this.immunityFrames > 0) {
            this.immunityFrames--;
        }
    }

    draw(ctx) {
        // Draw health bar
        const barWidth = 200;
        const barHeight = 20;
        const x = 10;
        const y = 10;

        // Background
        ctx.fillStyle = '#444';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health fill
        const healthPercent = this.current / this.max;
        ctx.fillStyle = this.damageFlashTime > 0 ? '#ff0000' : '#00ff00';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}

export default Health; 