const { network, ethers } = require("hardhat");

const DECIMALS = 8;
const _initialanswer = 200000000000;
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const _BASEFEE = ethers.parseEther("0.25");
  const _GASPRICELINK = 100000;

  if (chainId == 1337 || chainId == 31337) {
    log("DEPLOYING MOCKS");
    const LinkToken = await deploy("LinkToken", {
      contract: "contracts/test/LinkToken.sol:LinkToken",
      from: deployer,
      log: true,
    });
    const LinkTokenAddress = await LinkToken.address;
    log(LinkTokenAddress);

    const VRFCoordinatorV2Mock = await deploy("VRFCoordinatorV2Mock", {
      contract: "VRFCoordinatorV2Mock",
      from: deployer,
      args: [_BASEFEE, _GASPRICELINK],
      log: true,
    });
    log("vrf deployed");
    const VRFCoordinatorV2MockAddress = await VRFCoordinatorV2Mock.address;
    log(VRFCoordinatorV2MockAddress);

    const MockV3Aggregator = await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      args: [DECIMALS, _initialanswer],
      log: true,
    });
    const MockV3AggregatorAddress = await MockV3Aggregator.address;
    log(MockV3AggregatorAddress);

    const VRFV2Wrapper = await deploy("VRFV2Wrapper", {
      contract: "VRFV2Wrapper",
      from: deployer,
      args: [
        LinkTokenAddress,
        MockV3AggregatorAddress,
        VRFCoordinatorV2MockAddress,
      ],
      log: true,
    });
    const vrfv2wrapperaddress = await VRFV2Wrapper.address;
    log(vrfv2wrapperaddress);

    const wrapperinteract = await ethers.getContract("VRFV2Wrapper", deployer);
    await wrapperinteract.setConfig(
      60000,
      52000,
      10,
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
      10
    );
    log(`config function works`);

    const linkamount = ethers.parseEther("10");
    const coordinatorinteract = await ethers.getContract(
      "VRFCoordinatorV2Mock",
      deployer
    );

    await coordinatorinteract.fundSubscription(1, linkamount);
  }
};

module.exports.tags = ["all", "mocks"];
