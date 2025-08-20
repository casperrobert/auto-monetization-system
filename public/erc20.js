// public/js/erc20.js
async function getERC20Balance(contractAddress, walletAddress) {
  if (!window.ethereum) {
    alert("MetaMask nicht gefunden!");
    return;
  }
  const abi = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ];
  const web3 = new Web3(window.ethereum);
  const token = new web3.eth.Contract(abi, contractAddress);
  const balance = await token.methods.balanceOf(walletAddress).call();
  return balance;
}
<script src="js/erc20.js"></script>

