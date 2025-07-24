export async function getWalletAddress() {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } else {
      alert('请先安装 Monad钱包');
      throw new Error('No wallet');
    }
  }

export async function getBlockNumber() {
    const rpc = "https://testnet-rpc.monad.xyz"; // 替换为你的 RPC
    const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
        })
    });
    const data = await res.json();
    return parseInt(data.result, 16);
}