/**
 * ERC20 Token ABI and utilities for CASPER SYSTEM 24
 * Contains comprehensive ERC20 interface and helper functions
 */

// Comprehensive ERC20 ABI
window.CASPER_ERC20_ABI = [
  // Standard ERC20 functions
  {
    constant: true,
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  }
];

// Common token addresses (mainnet)
window.CASPER_TOKEN_ADDRESSES = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86a33E6441E43d4c9d5C2Ee4AC8b6ff4Af6CA',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
};

// ERC20 Token utility class
class ERC20Token {
  constructor(web3, contractAddress) {
    if (!web3) {
      throw new Error('Web3 instance is required');
    }

    if (
      !contractAddress ||
      !validators.isValidEthereumAddress(contractAddress)
    ) {
      throw new Error('Valid contract address is required');
    }

    this.web3 = web3;
    this.contractAddress = contractAddress;
    this.contract = new web3.eth.Contract(
      window.CASPER_ERC20_ABI,
      contractAddress
    );
  }

  // Get token balance for an address
  async getBalance(address) {
    try {
      if (!validators.isValidEthereumAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      const balance = await this.contract.methods.balanceOf(address).call();
      const decimals = await this.getDecimals();

      return {
        raw: balance,
        formatted: this.web3.utils.fromWei(balance, this._getWeiUnit(decimals)),
        decimals
      };
    } catch (error) {
      reportError(error, {
        method: 'getBalance',
        address,
        contract: this.contractAddress
      });
      throw error;
    }
  }

  // Get token decimals
  async getDecimals() {
    try {
      return await this.contract.methods.decimals().call();
    } catch (error) {
      reportError(error, {
        method: 'getDecimals',
        contract: this.contractAddress
      });
      return 18; // Default to 18 decimals
    }
  }

  // Get token symbol
  async getSymbol() {
    try {
      return await this.contract.methods.symbol().call();
    } catch (error) {
      reportError(error, {
        method: 'getSymbol',
        contract: this.contractAddress
      });
      return 'UNKNOWN';
    }
  }

  // Get token name
  async getName() {
    try {
      return await this.contract.methods.name().call();
    } catch (error) {
      reportError(error, { method: 'getName', contract: this.contractAddress });
      return 'Unknown Token';
    }
  }

  // Transfer tokens
  async transfer(to, amount, from) {
    try {
      if (!validators.isValidEthereumAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      if (!validators.isValidEthereumAddress(from)) {
        throw new Error('Invalid sender address');
      }

      if (!validators.isValidAmount(amount)) {
        throw new Error('Invalid amount');
      }

      const decimals = await this.getDecimals();
      const weiAmount = this.web3.utils.toWei(
        String(amount),
        this._getWeiUnit(decimals)
      );

      return await this.contract.methods.transfer(to, weiAmount).send({ from });
    } catch (error) {
      reportError(error, {
        method: 'transfer',
        to,
        amount,
        from,
        contract: this.contractAddress
      });
      throw error;
    }
  }

  // Approve token spending
  async approve(spender, amount, from) {
    try {
      if (!validators.isValidEthereumAddress(spender)) {
        throw new Error('Invalid spender address');
      }

      if (!validators.isValidEthereumAddress(from)) {
        throw new Error('Invalid owner address');
      }

      if (!validators.isValidAmount(amount)) {
        throw new Error('Invalid amount');
      }

      const decimals = await this.getDecimals();
      const weiAmount = this.web3.utils.toWei(
        String(amount),
        this._getWeiUnit(decimals)
      );

      return await this.contract.methods
        .approve(spender, weiAmount)
        .send({ from });
    } catch (error) {
      reportError(error, {
        method: 'approve',
        spender,
        amount,
        from,
        contract: this.contractAddress
      });
      throw error;
    }
  }

  // Get allowance
  async getAllowance(owner, spender) {
    try {
      if (!validators.isValidEthereumAddress(owner)) {
        throw new Error('Invalid owner address');
      }

      if (!validators.isValidEthereumAddress(spender)) {
        throw new Error('Invalid spender address');
      }

      const allowance = await this.contract.methods
        .allowance(owner, spender)
        .call();
      const decimals = await this.getDecimals();

      return {
        raw: allowance,
        formatted: this.web3.utils.fromWei(
          allowance,
          this._getWeiUnit(decimals)
        ),
        decimals
      };
    } catch (error) {
      reportError(error, {
        method: 'getAllowance',
        owner,
        spender,
        contract: this.contractAddress
      });
      throw error;
    }
  }

  // Helper method to get appropriate wei unit based on decimals
  _getWeiUnit(decimals) {
    switch (decimals) {
      case 6:
        return 'mwei';
      case 9:
        return 'gwei';
      case 18:
        return 'ether';
      default:
        return 'ether';
    }
  }

  // Get token info
  async getTokenInfo() {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.getName(),
        this.getSymbol(),
        this.getDecimals(),
        this.contract.methods.totalSupply().call()
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply: {
          raw: totalSupply,
          formatted: this.web3.utils.fromWei(
            totalSupply,
            this._getWeiUnit(decimals)
          )
        },
        contractAddress: this.contractAddress
      };
    } catch (error) {
      reportError(error, {
        method: 'getTokenInfo',
        contract: this.contractAddress
      });
      throw error;
    }
  }
}

// Expose ERC20Token class globally
window.ERC20Token = ERC20Token;
