const { networkConfig } = require("../helper-hardhat-config");
const { network, ethers } = require("hardhat");
require("dotenv").config();
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  log(`deploying to network with ${chainId}`);
  let linkaddress;
  let wrapperaddress;
  if (chainId == 1337 || chainId == 31337) {
    console.log("Deploying mocks");
    const linkaddressmock = await deployments.get("LinkToken");
    const wrappperaddressmock = await deployments.get("VRFV2Wrapper");
    linkaddress = linkaddressmock.address;
    wrapperaddress = wrappperaddressmock.address;
  } else {
    linkaddress = networkConfig[chainId]["linkaddress"];
    wrapperaddress = networkConfig[chainId]["wrapperaddress"];
  }
  const entrancefee = ethers.parseEther("0.05");
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: [entrancefee, linkaddress, wrapperaddress],
    log: true,
  });
  log("-----------------------------------------");

  if (!(chainId == 1337) && process.env.ETHERSCAN_TOKEN) {
    await verify(raffle.address, [entrancefee, linkaddress, wrapperaddress]);
  }
  log(`Verified contract at ${raffle.address}`);

  /*if (chainId == 1337) {
    const linkaddressmock = await ethers.getContract("LinkToken", deployer);
    const linkamount = ethers.parseEther("2000");

    const tx1 = await linkaddressmock.transfer(raffle.address, linkamount);
    await tx1.wait(1);

    const raffleinteract = await ethers.getContract("Raffle", deployer);

    const balance2 = await linkaddressmock.balanceOf(raffle.address);
    console.log(balance2);
    const tx = await raffleinteract.enterlottery({
      value: ethers.parseEther("0.05"),
    });
    const tx2 = await raffleinteract.performUpkeep("0x");
    const txreceipt = await tx2.wait();
    console.log(txreceipt);
    const eventLogs = txreceipt.logs;
    console.log(eventLogs);
    let requestId; // Variable to store the requestId

    // Iterate over the logs to find the 'RequestSent' event
    for (let log of eventLogs) {
      if (log.fragment && log.fragment.name === "RequestSent") {
        requestId = log.args[0]; // Store the requestId
        break; // Stop the loop once the requestId is found
      }
    }
    const vrfcoordinatorv2mock = await ethers.getContract(
      "VRFCoordinatorV2Mock",
      deployer
    );

    const tx3 = await vrfcoordinatorv2mock.fulfillRandomWords(
      requestId,
      wrapperaddress
    );
    const tx3receipt = await tx3.wait();
    const tx3receiptlogs = await tx3receipt.logs;
    const lotterystatus = await raffleinteract.getlotterystate();
    const lotterywinner = await raffleinteract.getwinner();
    console.log(lotterystatus, lotterywinner);
  } */
};

module.exports.tags = ["all", "raffle"];
