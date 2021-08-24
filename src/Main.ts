import { memoizedBackgroundPattern } from "./Background";
import { start as gameStart } from "./Game";
import { keyboard, menu, scene, WORLD_SIZE } from "./Globals";

const resize = () => {
    document.querySelectorAll('canvas').forEach(canvas => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });

    scene.width = window.innerWidth;
    scene.height = window.innerHeight;
    scene.scale = Math.min(scene.width / WORLD_SIZE, scene.height / WORLD_SIZE);
    console.log(scene, window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', resize);

const isTouchDevice = () => {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
};

const enableSubscriberOnly = () => {
    document.querySelectorAll('.subscriber-only').forEach(element => element.classList.remove('subscriber-only'));
};

const initializeMonetization = () => {
    try {
        const monetization = (document as any).monetization;

        if (!monetization) {
            return;
        }

        monetization.addEventListener('monetizationstart', () => {
            if (monetization.state === 'started') {
                enableSubscriberOnly();
            }
        });
    } catch (error) {
        console.error('Failed to initialize monetization', error);
    }
};
initializeMonetization();

document.addEventListener('keydown', (e: KeyboardEvent) => {
    const prop = e.key.replace(/^./, s => s.toLowerCase());
    if (prop in keyboard) {
        keyboard[prop] = true;
    }
});

document.addEventListener('keyup', (e: KeyboardEvent) => {
    const prop = e.key.replace(/^./, s => s.toLowerCase());
    if (prop in keyboard) {
        keyboard[prop] = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.body.focus();
    resize();
});

document.querySelector('#start').addEventListener('click', async () => {
    const pattern = memoizedBackgroundPattern();
    for (let i = 0; i < 1; i++) {
        await pattern.increment();
    }

    menu.style.display = 'none';
    gameStart();
});
