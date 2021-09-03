export const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
export const context: CanvasRenderingContext2D = canvas.getContext('2d');
export const STEPS_PER_SECOND = 60;
export const STEPS_PER_MILISECOND = STEPS_PER_SECOND / 1000;
export const SPEED_UNIT = 1 / STEPS_PER_SECOND;
export const ACCELERATION_UNIT = SPEED_UNIT / STEPS_PER_SECOND;
export const GRAVITY = 2000 * ACCELERATION_UNIT;
export const JUMP_SPEED = 1200 * SPEED_UNIT;
export const TERMINAL_VELOCITY = 1000 * SPEED_UNIT;
export const WORLD_SIZE = 1000;
export const URL_RADIUS = WORLD_SIZE / 50;
export const TAU = Math.PI * 2;
export const random = Math.random;
export const screenWidth = screen.width * window.devicePixelRatio;
export const screenHeight = screen.height * window.devicePixelRatio;
export const scene = {
    scale: 1
};

export const keyboard = {
    arrowUp: false,
    arrowLeft: false,
    arrowDown: false,
    arrowRight: false,
    enter: false,
};

export const keyboardMap: Map<string, keyof typeof keyboard> = new Map([
    ['ArrowUp', 'arrowUp'],
    ['ArrowLeft', 'arrowLeft'],
    ['ArrowDown', 'arrowDown'],
    ['ArrowRight', 'arrowRight'],
    ['KeyW', 'arrowUp'],
    ['KeyA', 'arrowLeft'],
    ['KeyS', 'arrowDown'],
    ['KeyD', 'arrowRight'],
    ['Enter', 'enter'],
]);
