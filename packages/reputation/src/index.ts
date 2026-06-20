import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBICHSYLR3EX47TD6ILAZKLVJKZMGVB234CABE2QAN33ECSKG3BFM6HK",
  }
} as const


export interface Rating {
  comment: string;
  score: u32;
  timestamp: u64;
  weight: u64;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Profile", values: readonly [string]} | {tag: "Rating", values: readonly [string, string]};


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
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a rate_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  rate_user: ({rater, ratee, score, comment}: {rater: string, ratee: string, score: u32, comment: string}, options?: MethodOptions) => Promise<AssembledTransaction<UserProfile>>

  /**
   * Construct and simulate a get_rating transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_rating: ({rater, ratee}: {rater: string, ratee: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Rating>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_profile: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<UserProfile>>>

  /**
   * Construct and simulate a verify_user transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  verify_user: ({user, verified}: {user: string, verified: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<UserProfile>>

  /**
   * Construct and simulate a get_reputation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_reputation: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a upsert_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upsert_profile: ({user, name, category, metadata_uri}: {user: string, name: string, category: string, metadata_uri: string}, options?: MethodOptions) => Promise<AssembledTransaction<UserProfile>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABlJhdGluZwAAAAAABAAAAAAAAAAHY29tbWVudAAAAAAQAAAAAAAAAAVzY29yZQAAAAAAAAQAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAYAAAAAAAAABndlaWdodAAAAAAABg==",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAAJcmF0ZV91c2VyAAAAAAAABAAAAAAAAAAFcmF0ZXIAAAAAAAATAAAAAAAAAAVyYXRlZQAAAAAAABMAAAAAAAAABXNjb3JlAAAAAAAABAAAAAAAAAAHY29tbWVudAAAAAAQAAAAAQAAB9AAAAALVXNlclByb2ZpbGUA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAHUHJvZmlsZQAAAAABAAAAEwAAAAEAAAAAAAAABlJhdGluZwAAAAAAAgAAABMAAAAT",
        "AAAAAAAAAAAAAAAKZ2V0X3JhdGluZwAAAAAAAgAAAAAAAAAFcmF0ZXIAAAAAAAATAAAAAAAAAAVyYXRlZQAAAAAAABMAAAABAAAD6AAAB9AAAAAGUmF0aW5nAAA=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X3Byb2ZpbGUAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6AAAB9AAAAALVXNlclByb2ZpbGUA",
        "AAAAAAAAAAAAAAALdmVyaWZ5X3VzZXIAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAACHZlcmlmaWVkAAAAAQAAAAEAAAfQAAAAC1VzZXJQcm9maWxlAA==",
        "AAAAAQAAAAAAAAAAAAAAC1VzZXJQcm9maWxlAAAAAAgAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAALaXNfdmVyaWZpZWQAAAAAAQAAAAAAAAAMbWV0YWRhdGFfdXJpAAAAEAAAAAAAAAAEbmFtZQAAABAAAAAAAAAADXJhdGluZ3NfY291bnQAAAAAAAAEAAAAAAAAABByZXB1dGF0aW9uX3Njb3JlAAAABAAAAAAAAAAMdG90YWxfd2VpZ2h0AAAABgAAAAAAAAAMd2VpZ2h0ZWRfc3VtAAAABg==",
        "AAAAAAAAAAAAAAAOZ2V0X3JlcHV0YXRpb24AAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAOdXBzZXJ0X3Byb2ZpbGUAAAAAAAQAAAAAAAAABHVzZXIAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAIY2F0ZWdvcnkAAAAQAAAAAAAAAAxtZXRhZGF0YV91cmkAAAAQAAAAAQAAB9AAAAALVXNlclByb2ZpbGUA" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_admin: this.txFromJSON<Option<string>>,
        rate_user: this.txFromJSON<UserProfile>,
        get_rating: this.txFromJSON<Option<Rating>>,
        initialize: this.txFromJSON<null>,
        get_profile: this.txFromJSON<Option<UserProfile>>,
        verify_user: this.txFromJSON<UserProfile>,
        get_reputation: this.txFromJSON<u32>,
        upsert_profile: this.txFromJSON<UserProfile>
  }
}