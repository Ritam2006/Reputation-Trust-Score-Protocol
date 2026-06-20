import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CBICHSYLR3EX47TD6ILAZKLVJKZMGVB234CABE2QAN33ECSKG3BFM6HK";
    };
};
export interface Rating {
    comment: string;
    score: u32;
    timestamp: u64;
    weight: u64;
}
export type DataKey = {
    tag: "Admin";
    values: void;
} | {
    tag: "Profile";
    values: readonly [string];
} | {
    tag: "Rating";
    values: readonly [string, string];
};
export interface UserProfile {
    category: string;
    is_verified: boolean;
    metadata_uri: string;
    name: string;
    ratings_count: u32;
    reputation_score: u32;
    total_weight: u64;
    weighted_sum: u64;
}
export interface Client {
    /**
     * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
    /**
     * Construct and simulate a rate_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    rate_user: ({ rater, ratee, score, comment }: {
        rater: string;
        ratee: string;
        score: u32;
        comment: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<UserProfile>>;
    /**
     * Construct and simulate a get_rating transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_rating: ({ rater, ratee }: {
        rater: string;
        ratee: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<Rating>>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    initialize: ({ admin }: {
        admin: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_profile: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<UserProfile>>>;
    /**
     * Construct and simulate a verify_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    verify_user: ({ user, verified }: {
        user: string;
        verified: boolean;
    }, options?: MethodOptions) => Promise<AssembledTransaction<UserProfile>>;
    /**
     * Construct and simulate a get_reputation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_reputation: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a upsert_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    upsert_profile: ({ user, name, category, metadata_uri }: {
        user: string;
        name: string;
        category: string;
        metadata_uri: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<UserProfile>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        get_admin: (json: string) => AssembledTransaction<Option<string>>;
        rate_user: (json: string) => AssembledTransaction<UserProfile>;
        get_rating: (json: string) => AssembledTransaction<Option<Rating>>;
        initialize: (json: string) => AssembledTransaction<null>;
        get_profile: (json: string) => AssembledTransaction<Option<UserProfile>>;
        verify_user: (json: string) => AssembledTransaction<UserProfile>;
        get_reputation: (json: string) => AssembledTransaction<number>;
        upsert_profile: (json: string) => AssembledTransaction<UserProfile>;
    };
}
