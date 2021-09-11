import { context, PersistentVector } from "near-sdk-as";

@nearBindgen
export class RankingEntry {
    player: string;

    constructor(public score: u32) {
       this.player = context.sender;
    }

    public static empty(): RankingEntry
    {
        const entry = new RankingEntry(0);
        entry.player = '<empty>';
        return entry;
    }
}

export const ranking = new PersistentVector<RankingEntry>("ranking");
