import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAABlJhdGluZwAAAAAABAAAAAAAAAAHY29tbWVudAAAAAAQAAAAAAAAAAVzY29yZQAAAAAAAAQAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAYAAAAAAAAABndlaWdodAAAAAAABg==",
            "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
            "AAAAAAAAAAAAAAAJcmF0ZV91c2VyAAAAAAAABAAAAAAAAAAFcmF0ZXIAAAAAAAATAAAAAAAAAAVyYXRlZQAAAAAAABMAAAAAAAAABXNjb3JlAAAAAAAABAAAAAAAAAAHY29tbWVudAAAAAAQAAAAAQAAB9AAAAALVXNlclByb2ZpbGUA",
            "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAHUHJvZmlsZQAAAAABAAAAEwAAAAEAAAAAAAAABlJhdGluZwAAAAAAAgAAABMAAAAT",
            "AAAAAAAAAAAAAAAKZ2V0X3JhdGluZwAAAAAAAgAAAAAAAAAFcmF0ZXIAAAAAAAATAAAAAAAAAAVyYXRlZQAAAAAAABMAAAABAAAD6AAAB9AAAAAGUmF0aW5nAAA=",
            "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
            "AAAAAAAAAAAAAAALZ2V0X3Byb2ZpbGUAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAD6AAAB9AAAAALVXNlclByb2ZpbGUA",
            "AAAAAAAAAAAAAAALdmVyaWZ5X3VzZXIAAAAAAgAAAAAAAAAEdXNlcgAAABMAAAAAAAAACHZlcmlmaWVkAAAAAQAAAAEAAAfQAAAAC1VzZXJQcm9maWxlAA==",
            "AAAAAQAAAAAAAAAAAAAAC1VzZXJQcm9maWxlAAAAAAgAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAALaXNfdmVyaWZpZWQAAAAAAQAAAAAAAAAMbWV0YWRhdGFfdXJpAAAAEAAAAAAAAAAEbmFtZQAAABAAAAAAAAAADXJhdGluZ3NfY291bnQAAAAAAAAEAAAAAAAAABByZXB1dGF0aW9uX3Njb3JlAAAABAAAAAAAAAAMdG90YWxfd2VpZ2h0AAAABgAAAAAAAAAMd2VpZ2h0ZWRfc3VtAAAABg==",
            "AAAAAAAAAAAAAAAOZ2V0X3JlcHV0YXRpb24AAAAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAQ=",
            "AAAAAAAAAAAAAAAOdXBzZXJ0X3Byb2ZpbGUAAAAAAAQAAAAAAAAABHVzZXIAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAIY2F0ZWdvcnkAAAAQAAAAAAAAAAxtZXRhZGF0YV91cmkAAAAQAAAAAQAAB9AAAAALVXNlclByb2ZpbGUA"]), options);
        this.options = options;
    }
    fromJSON = {
        get_admin: (this.txFromJSON),
        rate_user: (this.txFromJSON),
        get_rating: (this.txFromJSON),
        initialize: (this.txFromJSON),
        get_profile: (this.txFromJSON),
        verify_user: (this.txFromJSON),
        get_reputation: (this.txFromJSON),
        upsert_profile: (this.txFromJSON)
    };
}
