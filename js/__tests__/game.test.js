import Game from '../game';

// Mock canvas and context
const mockCanvas = {
    getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        // Add other context methods as needed
    })),
    width: 800,
    height: 600
};

// Mock document.getElementById
document.getElementById = jest.fn(() => mockCanvas);

describe('Game', () => {
    let game;

    beforeEach(() => {
        game = new Game();
    });

    test('initializes with correct canvas dimensions', () => {
        expect(game.canvas.width).toBe(800);
        expect(game.canvas.height).toBe(600);
    });

    test('initializes with correct level bounds', () => {
        expect(game.levelBounds.width).toBe(game.canvas.width * 3);
        expect(game.levelBounds.height).toBe(game.canvas.height);
    });

    test('initializes health system', () => {
        expect(game.health).toBeDefined();
        expect(game.health.currentHealth).toBe(100);
    });

    test('initializes with correct debug settings', () => {
        expect(game.debug.enabled).toBe(true);
        expect(game.debug.panel).toBeDefined();
    });
}); 