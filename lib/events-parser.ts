import { xdr, scValToNative } from '@stellar/stellar-sdk';

export interface ParsedReputationEvent {
  id: string;
  type: 'PROFILE_UPDATED' | 'RATING_SUBMITTED' | 'USER_VERIFIED' | 'UNKNOWN';
  timestamp: number;
  ledger: number;
  contractId: string;
  data: any;
}

export function parseRpcEvent(rawEvent: any): ParsedReputationEvent | null {
  try {
    const { id, ledger, ledgerClosedAt, contractId, topic, value } = rawEvent;
    
    if (!topic || topic.length === 0) return null;

    // Parse the first topic (the event symbol)
    const eventTypeScVal = xdr.ScVal.fromXDR(topic[0], 'base64');
    const eventType = scValToNative(eventTypeScVal).toString();

    const timestamp = ledgerClosedAt ? new Date(ledgerClosedAt).getTime() : Date.now();

    // Check value field
    if (!value) return null;

    if (eventType === 'prof_upd') {
      const userScVal = xdr.ScVal.fromXDR(topic[1], 'base64');
      const user = scValToNative(userScVal).toString();

      // Value is vector/tuple: (name, category, metadata_uri)
      const valScVal = xdr.ScVal.fromXDR(value, 'base64');
      const valNative = scValToNative(valScVal) as any[];

      return {
        id,
        type: 'PROFILE_UPDATED',
        timestamp,
        ledger,
        contractId,
        data: {
          user,
          name: valNative[0]?.toString() || '',
          category: valNative[1]?.toString() || '',
          metadataUri: valNative[2]?.toString() || '',
        }
      };
    } else if (eventType === 'rate_sub') {
      const raterScVal = xdr.ScVal.fromXDR(topic[1], 'base64');
      const rater = scValToNative(raterScVal).toString();

      const rateeScVal = xdr.ScVal.fromXDR(topic[2], 'base64');
      const ratee = scValToNative(rateeScVal).toString();

      // Value is vector: (score, weight, comment, timestamp)
      const valScVal = xdr.ScVal.fromXDR(value, 'base64');
      const valNative = scValToNative(valScVal) as any[];

      // Timestamp from contract is u64 (BigInt)
      const eventTimestamp = valNative[3] ? Number(valNative[3]) * 1000 : timestamp;

      return {
        id,
        type: 'RATING_SUBMITTED',
        timestamp: eventTimestamp,
        ledger,
        contractId,
        data: {
          rater,
          ratee,
          score: Number(valNative[0] || 0),
          weight: Number(valNative[1] || 0),
          comment: valNative[2]?.toString() || '',
        }
      };
    } else if (eventType === 'user_ver') {
      const userScVal = xdr.ScVal.fromXDR(topic[1], 'base64');
      const user = scValToNative(userScVal).toString();

      const valScVal = xdr.ScVal.fromXDR(value, 'base64');
      const verified = scValToNative(valScVal); // boolean

      return {
        id,
        type: 'USER_VERIFIED',
        timestamp,
        ledger,
        contractId,
        data: {
          user,
          verified: !!verified
        }
      };
    }

    return {
      id,
      type: 'UNKNOWN',
      timestamp,
      ledger,
      contractId,
      data: {}
    };
  } catch (e) {
    console.error("Failed to parse event:", e, rawEvent);
    return null;
  }
}
