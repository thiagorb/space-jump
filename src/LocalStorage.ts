interface LocalStorageData {
    highScore: number;
    playedTutorial: boolean;
    robotSettings: {
        width: number;
        skew: number;
        thickness: number;
        height: number;
        color: number;
    };
}

let backup: LocalStorageData = null;

export const LocalStorage = {
    get() {
        try {
            const fromLocalStorage = localStorage && localStorage.getItem('thiagorb/robots.txt');
            backup = JSON.parse(fromLocalStorage);
        } catch (error) {
            console.error('Failed to load data from local storage', error);
        }

        if (!backup || typeof backup.highScore !== 'number' || typeof backup.playedTutorial !== 'boolean') {
            backup = {
                highScore: 0,
                playedTutorial: false,
                robotSettings: {
                    width: 0.5,
                    skew: 0.5,
                    thickness: 0.5,
                    height: 0.5,
                    color: 0.5,
                }
            };
        }

        return backup;
    },

    update<Return>(callback: (data: LocalStorageData) => Return) {
        const result = callback(LocalStorage.get());

        try {
            if (localStorage) {
                localStorage.setItem('thiagorb/robots.txt', JSON.stringify(backup));
            }
        } catch (error) {
            console.error('Failed to store data to local storage', error);
        }

        return result;
    },
};