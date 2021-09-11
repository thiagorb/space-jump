import { context, PersistentVector, u128 } from "near-sdk-as";

@nearBindgen
export class RankingEntry {
    player: string;

    constructor(public uuid: u128, public score: u32) {
        this.player = context.sender;
    }
}

export const ranking = new PersistentVector<RankingEntry>("ranking");
