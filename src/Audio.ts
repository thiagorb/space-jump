import {ZZFX, zzfx} from 'zzfx';

const vai = (f) => {
    let previous = null;
    return () => {
        if (previous && new Date().getTime() - previous < 1000) {
            return;
        }

        previous = new Date().getTime();
        f();
    };
};

export const playRocket = vai(() => zzfx(...[1.61,,1705,.5,,1,4,2,36.2,26.2,100,5,.16,3.4,,.3,.1,.32,1]));
