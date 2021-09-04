export const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
export const WORLD_SIZE = 1000;
export const TAU = Math.PI * 2;
export const random = Math.random;
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

export const enum GraphicsQuality {
    High = 1,
    Medium = 2,
    Low = 3
};
