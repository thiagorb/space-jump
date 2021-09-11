let interacted = false;
let enabled = false;

const sounds = {
    rocket: [.09,,1705,.5,,1,4,2,36.2,26.2,100,5,.16,3.4,,.3,.1,.32,1],
    jump: [.1,,70,.11,.05,.06,,.33,,10,50,,,,,,,.7,.1],
    ice: [.3,0,17897,.19,.5,.4,1,1.9,,,100,,.0424,,,,,,.49],
    mouseOver: [.5,0,194,.04,,.05,,2.69,,,100,.04,,,,,.07,.13,.05],
    gameStart: [0.2,0,2079,.07,.18,2.48,1,.82,1,9.1,2050,.09,.09,,2,,.16,.45,.09],
    gameOver: [0.2,,2079,.07,.18,2.48,1,.82,1,9.1,-81,.09,.09,.1,,,,.45,.09,.24],
    click: [1,0,800,,,0,,,,,,,,,,,,0,.01],
    alert: [0.1,0,1280,,.08,.16,2,.7,,,696,,,,30,,.1,.7,.07],
}

const samples = {};

const getZzfx = () => {
    return require('zzfx').ZZFX;
}

const buildSample = (sound: string) => {
    return samples[sound] = samples[sound] || getZzfx().buildSamples(...sounds[sound]);
}

const buildSamples = () => {
    for (const sound in sounds) {
        buildSample(sound);
    }
}

const throttle = (ms: number, sound: string) => {
    let previous = null;
    const clearPrevious = () => previous = null;

    return () => {
        if (!enabled || !interacted || previous) {
            return;
        }

        previous = setTimeout(clearPrevious, ms);
        getZzfx().playSamples(buildSample(sound));
    };
};

export const soundPlayer = {
    get enabled() { return enabled; },
    set enabled(value: boolean) { enabled = value; },
    buildSamples,
    playRocket: throttle(1000, 'rocket'),
    playJump: throttle(500, 'jump'),
    playIce: throttle(700, 'ice'),
    playMouseOver: throttle(50, 'mouseOver'),
    playGameStart: throttle(1000, 'gameStart'),
    playGameOver: throttle(1000, 'gameOver'),
    playClick: throttle(100, 'click'),
    playAlert: throttle(1000, 'alert'),
};

const setInteracted = () => {
    interacted = true;
    document.removeEventListener('click', setInteracted);
    document.removeEventListener('keydown', setInteracted);
    document.removeEventListener('keyup', setInteracted);
};

document.addEventListener('click', setInteracted);
document.addEventListener('keydown', setInteracted);
document.addEventListener('keyup', setInteracted);
