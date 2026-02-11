import Health from '../Health';

describe('Health', () => {
    let health;
    let mockGame;

    beforeEach(() => {
        mockGame = {};
        health = new Health(mockGame);
    });

    test('initializes with correct default values', () => {
        expect(health.max).toBe(100);
        expect(health.current).toBe(100);
        expect(health.damageFlashTime).toBe(0);
        expect(health.isGameOver).toBe(false);
        expect(health.immunityFrames).toBe(0);
    });

    test('takes damage correctly when not immune', () => {
        health.takeDamage(20);
        expect(health.current).toBe(80);
        expect(health.damageFlashTime).toBe(10);
        expect(health.immunityFrames).toBe(30);
    });

    test('does not take damage during immunity frames', () => {
        health.takeDamage(20); // First hit
        const healthAfterFirstHit = health.current;
        health.takeDamage(20); // Should not register due to immunity
        expect(health.current).toBe(healthAfterFirstHit);
    });

    test('triggers game over when health reaches 0', () => {
        health.takeDamage(100);
        expect(health.isGameOver).toBe(true);
        expect(health.current).toBeLessThanOrEqual(0);
    });

    test('updates timers correctly', () => {
        health.takeDamage(20);
        expect(health.damageFlashTime).toBe(10);
        expect(health.immunityFrames).toBe(30);

        // Simulate a few frames
        for (let i = 0; i < 5; i++) {
            health.update();
        }

        expect(health.damageFlashTime).toBe(5);
        expect(health.immunityFrames).toBe(25);
    });

    test('draws health bar correctly', () => {
        // Mock canvas context
        const mockCtx = {
            fillRect: jest.fn(),
            strokeRect: jest.fn(),
            fillStyle: null,
            strokeStyle: null
        };

        health.currentHealth = 50; // Set health to 50%
        health.draw(mockCtx);

        // Check if correct number of draw calls were made
        expect(mockCtx.fillRect).toHaveBeenCalledTimes(2);
        expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1);
    });
}); 