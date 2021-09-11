import { GraphicsQuality } from "./Globals";
import { RankingEntry } from "./Ranking";

interface LocalStorageData {
    audio: boolean;
    graphicsQuality: GraphicsQuality;
    ranking: Array<RankingEntry>;
}

export const localStorageKey = 'thiagorb_space_jump';

const validateStorage = (value: any): value is LocalStorageData => {
    return (
        value
        && Array.isArray(value.ranking)
        && !value.ranking.some((e: any) => !e || typeof e.player !== 'string' || typeof e.score !== 'number')
        && typeof value.audio === 'boolean'
        && typeof value.graphicsQuality === 'number'
    );
};

export const LocalStorage = {
    get(): LocalStorageData {
        let value: any;
        try {
            const fromLocalStorage = localStorage && localStorage.getItem(localStorageKey);
            value = JSON.parse(fromLocalStorage);
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to load data from local storage', error);
            }
        }

        if (!validateStorage(value)) {
            return {
                audio: false,
                graphicsQuality: GraphicsQuality.High,
                ranking: [],
            };
        }

        return value;
    },

    update<Return>(callback: (data: LocalStorageData) => void): void {
        const result = LocalStorage.get();
        callback(result);

        try {
            if (localStorage) {
                localStorage.setItem(localStorageKey, JSON.stringify(result));
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to store data to local storage', error);
            }
        }
    },
};
