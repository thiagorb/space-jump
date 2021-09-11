import { LocalStorage } from "./LocalStorage";
import { near } from "./Near";

export interface RankingEntry {
    player: string;
    score: number;
}

let nearRanking: Array<RankingEntry> = [];
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

    getEntries: () => nearRanking.concat(LocalStorage.get().ranking)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(e => ({ ...e, player: e.player.replace(/\.testnet$/, '') })),

    addEntry: (score: number) => {
        if (near.isSignedIn()) {
            try {
                near.addRankingEntry(score);
                return;
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(error);
                }
            }
        }

        LocalStorage.update(storage => {
            storage.ranking.push({ player: near.getAccountId() || 'guest', score });
        });
    }
};
