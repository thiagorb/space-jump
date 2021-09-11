import { LocalStorage } from "./LocalStorage";
import { near } from "./Near";

export interface RankingEntry {
    uuid: string;
    player: string;
    score: number;
}

let nearRanking: Array<RankingEntry> = [];

const prepareRanking = (localRanking: Array<RankingEntry>) => {
    const deduplication = new Map<string, RankingEntry>();
    for (const entry of nearRanking.concat(localRanking)) {
        deduplication.set(entry.uuid, entry);
    }

    return [...deduplication.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
};

const uuid4 = () => {
    let uuid = BigInt(0);
    for (let i = 0; i < 16; i++) {
        uuid <<= BigInt(8);
        uuid |= BigInt(Math.random() * 256 | 0);
    }

    return `0x${uuid.toString(16)}`;
}

export const ranking = {
    update: async () => {
        try {
            nearRanking = (await near.getRanking()) || [];
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(error);
            }
        }
    },

    getEntries: () => prepareRanking(LocalStorage.get().ranking),

    addEntry: (score: number) => {
        const uuid = uuid4();
        const newEntry: RankingEntry = { uuid, player: near.getAccountId() || 'guest', score };

        LocalStorage.update(storage => {
            storage.ranking = prepareRanking([...storage.ranking, newEntry]);
        });

        if (near.isSignedIn()) {
            try {
                near.addRankingEntry(uuid, score);
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }
            }
        }
    }
};
