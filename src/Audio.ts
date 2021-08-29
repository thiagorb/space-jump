class SoundPlayer {
    sounds = {
        rocket: [.09,,1705,.5,,1,4,2,36.2,26.2,100,5,.16,3.4,,.3,.1,.32,1],
        jump: [.1,,70,.11,.05,.06,,.33,,10,50,,,,,,,.7,.1],
        ice: [.3,0,17897,.19,.5,.4,1,1.9,,,100,,.0424,,,,,,.49],
        mouseOver: [.5,0,194,.04,,.05,,2.69,,,100,.04,,,,,.07,.13,.05],
        gameStart: [0.2,0,2079,.07,.18,2.48,1,.82,1,9.1,2050,.09,.09,,2,,.16,.45,.09],
        gameOver: [0.2,,2079,.07,.18,2.48,1,.82,1,9.1,-81,.09,.09,.1,,,,.45,.09,.24],
        click: [1,0,800,,,0,,,,,,,,,,,,0,.01],
    }

    samples = null;

    enabled: boolean = false;

    throttle(ms: number, sound: string) {
        let previous = null;
        const clearPrevious = () => previous = null;

        return () => {
            if (!this.enabled || previous) {
                return;
            }

            this.buildSamples();
            previous = setTimeout(clearPrevious, ms);
            this.getZzfx().playSamples(this.samples[sound]);
        };
    }

    getZzfx() {
        return require('zzfx').ZZFX;
    }

    buildSamples() {
        if (this.samples) {
            return;
        }

        this.samples = {};
        for (const sound in this.sounds) {
            this.samples[sound] = this.getZzfx().buildSamples(...this.sounds[sound]);
        }
    }

    playRocket = this.throttle(1000, 'rocket');
    playJump = this.throttle(500, 'jump');
    playIce = this.throttle(700, 'ice');
    playMouseOver = this.throttle(50, 'mouseOver');
    playGameStart = this.throttle(1000, 'gameStart');
    playGameOver = this.throttle(1000, 'gameOver');
    playClick = this.throttle(100, 'click');
};

export const soundPlayer = new SoundPlayer();
