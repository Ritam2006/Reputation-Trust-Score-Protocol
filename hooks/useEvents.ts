import { create } from 'zustand';
import { parseRpcEvent, ParsedReputationEvent } from '@/lib/events-parser';

interface EventsState {
  events: ParsedReputationEvent[];
  isFetching: boolean;
  error: string | null;
  lastLedgerSequence: number;
  fetchEvents: (contractId: string) => Promise<void>;
  clearEvents: () => void;
}

export const useEvents = create<EventsState>((set, get) => ({
  events: [],
  isFetching: false,
  error: null,
  lastLedgerSequence: 0,

  fetchEvents: async (contractId: string) => {
    if (!contractId) return;
    set({ isFetching: true });
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
      
      // 1. Fetch the latest ledger sequence
      const ledgerRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getLatestLedger',
          params: {}
        })
      });
      
      if (!ledgerRes.ok) throw new Error("Failed to get latest ledger sequence.");
      const ledgerData = await ledgerRes.json();
      const latestLedger = ledgerData.result?.sequence;
      if (!latestLedger) throw new Error("Invalid response for getLatestLedger");

      // Determine starting ledger sequence: either the last sequence processed or latest - 3000 (approx. 4 hours of history)
      const startLedger = get().lastLedgerSequence > 0 
        ? Math.min(get().lastLedgerSequence, latestLedger) 
        : Math.max(1, latestLedger - 3000);

      // 2. Fetch contract events
      const eventsRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'getEvents',
          params: {
            startLedger,
            filters: [
              {
                type: 'contract',
                contractIds: [contractId]
              }
            ],
            limit: 100
          }
        })
      });

      if (!eventsRes.ok) throw new Error("Failed to fetch events from Soroban RPC.");
      const eventsData = await eventsRes.json();
      
      const rawEvents = eventsData.result?.events || [];
      const parsedEvents = rawEvents
        .map((e: any) => parseRpcEvent(e))
        .filter((e: any): e is ParsedReputationEvent => e !== null);

      set((state) => {
        // Filter out duplicate events by id
        const existingIds = new Set(state.events.map((e: ParsedReputationEvent) => e.id));
        const newUniqueEvents = parsedEvents.filter((e: ParsedReputationEvent) => !existingIds.has(e.id));
        const allEvents = [...newUniqueEvents, ...state.events];
        
        // Sort events by timestamp descending
        allEvents.sort((a, b) => b.timestamp - a.timestamp);

        return {
          events: allEvents,
          lastLedgerSequence: latestLedger,
          isFetching: false,
          error: null
        };
      });
    } catch (e: any) {
      console.error("Error fetching events:", e);
      set({ error: e.message || 'Unknown error fetching events', isFetching: false });
    }
  },

  clearEvents: () => set({ events: [], lastLedgerSequence: 0, error: null }),
}));
