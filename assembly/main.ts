import { u128 } from 'near-sdk-core';
import { RankingEntry, ranking } from './model';

const RANKING_SIZE = 10;

export function add_ranking_entry(uuid: u128, score: u32): void {
    const newEntry = new RankingEntry(uuid, score);
    if (ranking.length < RANKING_SIZE) {
        ranking.pushBack(newEntry);
        return;
    }

    let minIndex = 0;
    for (let i = 1; i < ranking.length; i++) {
        if (ranking[i].score < ranking[minIndex].score) {
            minIndex = i;
        }
    }

    if (ranking[minIndex].score >= score) {
        return;
    }

    ranking.replace(minIndex, newEntry);
}

export function reset_ranking(): void {
    while (ranking.length > 0) {
        ranking.popBack();
    }
}

export function get_ranking(): RankingEntry[] {
    const result = new Array<RankingEntry>(ranking.length);
    for(let i = 0; i < ranking.length; i++) {
        result[i] = ranking[i];
    }

    return result;
}
