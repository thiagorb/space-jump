export const STEPS_PER_SECOND = 500;
export const STEPS_PER_MILISECOND = STEPS_PER_SECOND / 1000;
export const SPEED_UNIT = 1 / STEPS_PER_SECOND;
export const ACCELERATION_UNIT = SPEED_UNIT / STEPS_PER_SECOND;
export const GRAVITY = 2000 * ACCELERATION_UNIT;
export const JUMP_SPEED = 1200 * SPEED_UNIT;
export const TERMINAL_VELOCITY = 1000 * SPEED_UNIT;
export const WORLD_SIZE = 1000;
export const URL_RADIUS = WORLD_SIZE / 50;
export const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
export const menu = document.querySelector<HTMLDivElement>('#menu');
export const scene = {
    scale: 1
};
export const context = canvas.getContext('2d');

export const keyboard = {
    arrowUp: false,
    arrowLeft: false,
    arrowRight: false,
};

export const keyboardMap: Map<string, keyof typeof keyboard> = new Map([
    ['ArrowUp', 'arrowUp'],
    ['ArrowLeft', 'arrowLeft'],
    ['ArrowRight', 'arrowRight'],
    ['KeyW', 'arrowUp'],
    ['KeyA', 'arrowLeft'],
    ['KeyD', 'arrowRight'],
]);
