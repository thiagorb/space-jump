import { soundPlayer } from "./Audio";
import { memoizedBackgroundPattern } from "./Background";
import { start as gameStart } from "./Game";
import { context, keyboard, keyboardMap, scene, setContext, WORLD_SIZE } from "./Globals";
import { LocalStorage } from "./LocalStorage";

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
    document.querySelector<HTMLDivElement>('#menu').style.display = null;
    window.requestAnimationFrame(renderBackground);
};

const deactivateMenu = () => {
    menuActive = false;
    document.querySelector<HTMLDivElement>('#menu').style.display = 'none';
};

const updateAudioText = () => {
    document.querySelector('#audio').setAttribute('data-text', `AUDIO ${soundPlayer.enabled ? 'YES' : 'NO'}`);
}

const setAudioActive = (value: boolean) => {
    LocalStorage.update(storage => storage.audio = soundPlayer.enabled = value);
    updateAudioText();

    if (value) {
        soundPlayer.playClick();
    }
}

export const waitNextFrame = () => new Promise(window.requestAnimationFrame);
const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));
const waitRelayout = () => document.body.getClientRects() && waitNextFrame();

const waitForConsistentAnimation = async () => {
    let maxTries = 30;
    let delta: number;
    let sequence: number = 0;
    do {
        delta = -(await waitNextFrame()) + (await waitNextFrame());
        if (delta > 1000 / 60) {
            sequence = 0;
        } else {
            sequence++;
        }
    } while (--maxTries > 0 && sequence < 5);
};

let nextFadeId = 0;
export const fadeInTransition = async (ms: number = 500) => {
    const fadeTransition = document.querySelector<HTMLDivElement>('#fade-transition');
    const fadeId = ++nextFadeId;
    await waitForConsistentAnimation();
    fadeTransition.style.transition = `opacity ${ms}ms`;
    await waitRelayout();
    fadeTransition.classList.remove('visible');
    await wait(ms);
    if (fadeId === nextFadeId) {
        fadeTransition.style.zIndex = '-1';
    }
};

export const fadeOutTransition = async (ms: number = 500) => {
    const fadeTransition = document.querySelector<HTMLDivElement>('#fade-transition');
    const fadeId = ++nextFadeId;
    fadeTransition.style.transition = `opacity ${ms}ms`;
    fadeTransition.classList.add('visible');
    fadeTransition.style.zIndex = '1';
    await wait(ms);
};

document.addEventListener('DOMContentLoaded', () => {
    const body: any = document.body;

    resize();

    const goToMenu = () => {
        const pattern = memoizedBackgroundPattern();
        pattern.increment();
        activateMenu();
        updateAudioText();
        fadeInTransition(500);
    };

    document.querySelector('#audio').addEventListener('click', () => {
        setAudioActive(!soundPlayer.enabled);
    });

    document.querySelector('#fullscreen').addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            body.requestFullscreen();
        }
    });

    document.querySelector('#start').addEventListener('click', async () => {
        deactivateMenu();
        await fadeOutTransition();
        gameStart();
        await fadeInTransition(5000);
    });

    const goToFullscreen = () => {
        if (!LocalStorage.get().fullscreen || !document.fullscreenEnabled) {
            document.querySelector('#fullscreen-question').remove();
            goToAudio();
        } else {
            fadeInTransition();
        }
    };

    const goToAudio = () => {
        if (!LocalStorage.get().audio) {
            document.querySelector('#audio-question').remove();
            goToMenu();
        } else {
            fadeInTransition();
        }
    };

    document.querySelector('#fullscreen--yes').addEventListener('click', async () => {
        await closeFullScreen();
        try {
            if (body.webkitEnterFullScreen) {
                await body.webkitEnterFullScreen();
            } else {
                await body.requestFullscreen();
            }
        } catch (error) {
            console.error(error);
        }
    });

    const closeFullScreen = async () => {
        await fadeOutTransition();
        memoizedBackgroundPattern().increment();
        document.querySelector('#fullscreen-question').remove();
        goToAudio();
    }

    const closeAudio = async () => {
        await fadeOutTransition();
        memoizedBackgroundPattern().increment();
        document.querySelector('#audio-question').remove();
        goToMenu();
    }

    document.querySelector('#fullscreen--no').addEventListener('click', () => {
        LocalStorage.update(storage => storage.fullscreen = false);
        closeFullScreen();
    });

    document.querySelector('#audio--no').addEventListener('click', () => {
        setAudioActive(false);
        closeAudio();
    });

    document.querySelector('#audio--yes').addEventListener('click', () => {
        setAudioActive(true);
        closeAudio();
    });

    document.body.addEventListener('mouseover', (event: MouseEvent) => {
        const element = <Element>event.target;
        if (element.matches('.button')) {
            soundPlayer.playMouseOver();
        }
    });

    document.body.addEventListener('click', (event: MouseEvent) => {
        const element = <Element>event.target;
        if (element.matches('.button')) {
            soundPlayer.playClick();
        }
    });

    goToFullscreen();
});

if (isTouchDevice()) {
    document.body.classList.add('touch');

    const setActive = (callback: (event: TouchEvent) => void) => (event: TouchEvent) => {
        (event.target as HTMLDivElement).classList.add('is-active');
        callback(event);
    };

    const unsetActive = (callback: (event: TouchEvent) => void) => (event: TouchEvent) => {
        (event.target as HTMLDivElement).classList.remove('is-active');
        callback(event);
    };

    const filterTouch = (callback: (key: string) => void) => (event: TouchEvent) => {
        const key = (event.target as HTMLDivElement).getAttribute('data-touch-key');
        if (key in keyboard) {
            event.preventDefault();
            callback(key);
        }
    };

    const flagKey = (key: string) => keyboard[key] = true;
    const unflagKey = (key: string) => keyboard[key] = false;

    document.addEventListener('touchstart', setActive(filterTouch(flagKey)));
    document.addEventListener('touchend', unsetActive(filterTouch(unflagKey)));
}

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
setContext(canvas.getContext('2d'));
