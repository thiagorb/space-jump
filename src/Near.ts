import { localStorageKey } from "./LocalStorage";
import { RankingEntry } from "./Ranking";

declare const nearApi: any;

const contractName = 'space-jump.testnet';

let walletConnection: null | {
    isSignedIn(): boolean;
    account(): object;
    getAccountId(): string;
    requestSignIn(contractName?: string, title?: string): void;
    signOut(): void;
};
let contract: null | {
    get_ranking(): Promise<Array<RankingEntry>>;
    add_ranking_entry({ uuid: BigInt, score: number }): Promise<void>;
};

const init = (async () => {
    const nearConnection = await nearApi.connect({
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
        networkId: 'testnet',
        keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(localStorage, localStorageKey),
    });

    walletConnection = new nearApi.WalletConnection(nearConnection, localStorageKey);
    if (!walletConnection.isSignedIn()) {
        return;
    }

    if (process.env.NODE_ENV !== 'production') {
        (<any>window).contract = contract = await new nearApi.Contract(
            walletConnection.account(),
            contractName,
            {
                viewMethods: ['get_ranking'],
                changeMethods: ['add_ranking_entry', 'reset_ranking'],
                sender: walletConnection.getAccountId(),
            }
        );
    } else {
        contract = await new nearApi.Contract(
            walletConnection.account(),
            contractName,
            {
                viewMethods: ['get_ranking'],
                changeMethods: ['add_ranking_entry'],
                sender: walletConnection.getAccountId(),
            }
        );
    }
})();

export const near = {
    getAccountId: () => walletConnection?.getAccountId(),

    isSignedIn: () => walletConnection?.isSignedIn(),

    blockingIsSignedIn: async () => {
        await init;
        return walletConnection?.isSignedIn();
    },

    getRanking: async () => (await contract?.get_ranking())?.map(entry => ({
        ...entry,
        uuid: `0x${BigInt(entry.uuid).toString(16)}`,
    })),

    addRankingEntry: (uuid: string, score: number) => {
        contract?.add_ranking_entry({ uuid: uuid.toString(), score })
    },

    requestSignIn: async () => {
        await init;
        walletConnection.requestSignIn(contractName, 'SPACE JUMP');
    },

    signOut: async () => {
        await init;
        walletConnection.signOut();
    }
};
