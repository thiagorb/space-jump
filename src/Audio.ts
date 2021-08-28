class SoundPlayer {
    enabled: boolean = false;

    throttle(ms: number, sound: () => number[]) {
        let previous = null;

        const clearPrevious = () => previous = null;

        return () => {
            if (!this.enabled || previous) {
                return;
            }

            previous = setTimeout(clearPrevious, ms);
            const { zzfx } = require('zzfx')
            zzfx(...sound());
        };
    }

    playRocket = this.throttle(1000, () => [.09,,1705,.5,,1,4,2,36.2,26.2,100,5,.16,3.4,,.3,.1,.32,1]);

    playJump = this.throttle(500, () => [.1,,70,.11,.05,.06,,.33,,10,50,,,,,,,.7,.1]);

    playIce = this.throttle(700, () => [.3,0,17897,.19,.5,.4,1,1.9,,,100,,.0424,,,,,,.49]);

    playMouseOver = this.throttle(100, () => [.3,0,194,.04,,.05,,2.69,,,100,.04,,,,,.07,.13,.05]);

    playGameStart = this.throttle(1000, () => [0.2,0,2079,.07,.18,2.48,1,.82,1,9.1,2050,.09,.09,,2,,.16,.45,.09]);

    playGameOver = this.throttle(1000, () => [0.2,,2079,.07,.18,2.48,1,.82,1,9.1,-81,.09,.09,.1,,,,.45,.09,.24]);

    playClick = this.throttle(100, () => [.3,0,800,,,0,,,,,,,,,,,,0,.01]);
};

export const soundPlayer = new SoundPlayer();
