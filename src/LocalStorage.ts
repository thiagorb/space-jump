interface LocalStorageData {
    highScore: number;
    audio: boolean;
    fullscreen: boolean;
}

let backup: LocalStorageData = null;

export const LocalStorage = {
    get() {
        try {
            const fromLocalStorage = localStorage && localStorage.getItem('thiagorb/space');
            backup = JSON.parse(fromLocalStorage);
        } catch (error) {
            console.error('Failed to load data from local storage', error);
        }

        if (!backup || typeof backup.highScore !== 'number' || typeof backup.audio !== 'boolean' || typeof backup.fullscreen !== 'boolean') {
            backup = {
                highScore: 0,
                audio: true,
                fullscreen: true,
            };
        }

        return backup;
    },

    update<Return>(callback: (data: LocalStorageData) => Return) {
        const result = callback(LocalStorage.get());

        try {
            if (localStorage) {
                localStorage.setItem('thiagorb/space', JSON.stringify(backup));
            }
        } catch (error) {
            console.error('Failed to store data to local storage', error);
        }

        return result;
    },
};
