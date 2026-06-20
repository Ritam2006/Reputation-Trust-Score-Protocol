export async function getXLMBalance(publicKey: string): Promise<string> {
  if (!publicKey) return '0';
  try {
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
    if (!res.ok) {
      if (res.status === 404) {
        // Account not funded yet
        return '0';
      }
      return '0';
    }
    const data = await res.json();
    const nativeBalance = data.balances?.find((b: any) => b.asset_type === 'native');
    return nativeBalance ? nativeBalance.balance : '0';
  } catch (e) {
    console.error("Error fetching XLM balance:", e);
    return '0';
  }
}

export function formatAddress(addr: string): string {
  if (!addr) return '';
  if (addr.length <= 10) return addr;
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
}
