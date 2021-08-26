import { memoizedBackgroundPattern } from "./Background";
import { start as gameStart } from "./Game";
import { context, keyboard, keyboardMap, menu, scene, WORLD_SIZE } from "./Globals";

const resize = () => {
    document.querySelectorAll('canvas').forEach(canvas => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });

    scene.scale = Math.min(window.innerWidth / WORLD_SIZE, window.innerHeight / WORLD_SIZE);
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
    const key = keyboardMap.get(e.code);
    if (key) {
        keyboard[key] = true;
    }
});

document.addEventListener('keyup', (e: KeyboardEvent) => {
    const key = keyboardMap.get(e.code);
    if (key) {
        keyboard[key] = false;
    }
});

let menuActive = false;

export const activateMenu = async () => {
    const background = await memoizedBackgroundPattern().getBackground();

    let backgroundY = background.getHeight() * Math.random();
    let previousTime = null;
    const renderBackground = (time: number) => {
        background.draw(context, backgroundY);
        if (previousTime) {
            backgroundY += (time - previousTime) * 0.01;
        }
        previousTime = time;
        if (menuActive) {
            window.requestAnimationFrame(renderBackground);
        }
    };

    menuActive = true;
    menu.style.display = null;
    window.requestAnimationFrame(renderBackground);
};

const deactivateMenu = () => {
    menuActive = false;
    menu.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    const body: any = document.body;

    resize();

    const goToMenu = () => {
        document.querySelector('#fullscreen').remove();
        const pattern = memoizedBackgroundPattern();
        for (let i = 0; i < 1; i++) {
            pattern.increment();
        }
        activateMenu();

        document.querySelector('#start').addEventListener('click', () => {
            deactivateMenu();
            gameStart();
        });
    };

    document.querySelector('#fullscreen--yes').addEventListener('click', () => {
        try {
            if (body.webkitEnterFullScreen) {
                body.webkitEnterFullScreen();
            } else {
                body.requestFullscreen();
            }
        } catch (error) {
            console.error(error);
        }
        goToMenu();
    });

    document.querySelector('#fullscreen--no').addEventListener('click', () => {
        goToMenu();
    });

    if (document.fullscreenEnabled) {
        document.querySelector<HTMLDivElement>('#fullscreen').classList.remove('hidden');
    } else {
        goToMenu();
    }
});

if (isTouchDevice()) {
    document.body.classList.add('touch');

    const setActive = callback => event => {
        (event.target as HTMLDivElement).classList.add('is-active');
        callback(event);
    };

    const unsetActive = callback => event => {
        (event.target as HTMLDivElement).classList.remove('is-active');
        callback(event);
    };

    const filterTouch = callback => event => {
        const key = (event.target as HTMLDivElement).getAttribute('data-touch-key');
        if (key in keyboard) {
            event.preventDefault();
            callback(key);
        }
    };

    const flagKey = key => keyboard[key] = true;
    const unflagKey = key => keyboard[key] = false;

    document.addEventListener('touchstart', setActive(filterTouch(flagKey)));
    document.addEventListener('touchend', unsetActive(filterTouch(unflagKey)));
}
