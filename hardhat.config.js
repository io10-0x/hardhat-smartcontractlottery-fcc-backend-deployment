/** @type import('hardhat/config').HardhatUserConfig */
//require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-ethers");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("dotenv").config();

const SEPOLIAURL = process.env.SEPOLIA_RPC_URL;
const PKEY = process.env.PRIVATE_KEY;
const ETHERSCANKEY = process.env.ETHERSCAN_TOKEN;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { compilers: [{ version: "0.8.7" }, { version: "0.8.6" }] },
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEPOLIAURL,
      accounts: [PKEY],
      chainId: 11155111,
    },
    hardhat: {
      chainId: 1337,
      blockConfirmations: 1,
    },
    localhost: {
      url: " http://127.0.0.1:8545/",
      chainId: 1337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      11155111: 0,
      1337: 0,
      31337: 0,
    },
  },
  etherscan: {
    apiKey: ETHERSCANKEY,
  },
  gasReporter: {
    enabled: false,
    //outputFile: "./gasreport.txt",
  },
  sourcify: {
    enabled: false,
  },
  mocha: {
    timeout: 700000,
  },
};
