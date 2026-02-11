import Game from '../game';

// Mock Audio constructor
global.Audio = jest.fn(() => ({
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    volume: 1,
    loop: false,
}));

// Mock requestAnimationFrame to prevent game loop from running
global.requestAnimationFrame = jest.fn();

// Mock performance.now
global.performance.now = jest.fn(() => 0);

// Mock canvas and context
const mockCtx = {
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    drawImage: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    setTransform: jest.fn(),
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
};

const mockCanvas = {
    getContext: jest.fn(() => mockCtx),
    width: 800,
    height: 600,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    requestFullscreen: jest.fn(),
    webkitRequestFullscreen: jest.fn(),
};

// Mock DOM element for buttons/other elements
const mockElement = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    textContent: '',
    disabled: false,
    style: {},
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
};

// Mock document APIs
document.getElementById = jest.fn((id) => {
    if (id === 'gameCanvas') return mockCanvas;
    return mockElement;
});
document.addEventListener = jest.fn();
Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true });
Object.defineProperty(document, 'webkitFullscreenElement', { value: null, writable: true });
Object.defineProperty(document, 'documentElement', {
    value: { requestFullscreen: jest.fn(), webkitRequestFullscreen: jest.fn() },
    writable: true,
});

// Mock window APIs
window.addEventListener = jest.fn();
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

describe('Game', () => {
    let game;

    beforeEach(() => {
        jest.clearAllMocks();
        // Prevent game loop from running during construction
        const origGameLoop = Game.prototype.gameLoop;
        Game.prototype.gameLoop = jest.fn();
        game = new Game();
        Game.prototype.gameLoop = origGameLoop;
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
        expect(game.health.current).toBe(100);
    });

    test('initializes with correct debug settings', () => {
        expect(game.debug.enabled).toBe(true);
        expect(game.debug.panel).toBeDefined();
    });
});
