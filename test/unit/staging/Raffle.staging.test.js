const { deployments, ethers } = require("hardhat");
const { networkConfig } = require("../../../helper-hardhat-config");
const { linkabi, raffleabi } = require("../../../constants");
const { assert, expect } = require("chai");

network.config.chainId == 1337
  ? describe.skip
  : describe("Raffle Project Staging", function () {
      let deployer;
      let raffleinteract;
      let signer;
      const sendval = ethers.parseEther("0.1");
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        signer = await ethers.provider.getSigner(deployer);
        raffleinteract = new ethers.Contract(
          "0x4B8F4F083Da0FACE4f886C69F6cf64247D1BC670",
          raffleabi,
          signer
        );
        console.log("Raffle deployed at:", await raffleinteract.getAddress());
        const chainId = network.config.chainId;
        const linktokenaddress = networkConfig[chainId]["linkaddress"];
        const linktokeninteract = new ethers.Contract(
          linktokenaddress,
          linkabi,
          signer
        );
        const linkamount = ethers.parseEther("0.5");
        const tx1 = await linktokeninteract.transfer(
          await raffleinteract.getAddress(),
          linkamount
        );
        await tx1.wait(1);
      });

      describe("fulfillrandomwwords", async function () {
        it("fulfillrandomwords end to end testing", async function () {
          const startingblocktimestamp =
            await raffleinteract.getlatestblocktimestamp();
          console.log(startingblocktimestamp);
          await new Promise(async (resolve, reject) => {
            raffleinteract.once("WinnerPicked", async function () {
              try {
                const winner = await raffleinteract.getwinner();
                const lotterystate = await raffleinteract.getlotterystate();
                const blocktimestamp =
                  await raffleinteract.getlatestblocktimestamp();
                const winnerendingbalance =
                  await ethers.provider.getBalance(deployer);

                console.log(winnerendingbalance - winnerstartingbalance);
                const raffleinteractbalance = await ethers.provider.getBalance(
                  await raffleinteract.getAddress()
                );
                assert.equal(lotterystate, 0);
                assert(blocktimestamp > startingblocktimestamp);
                assert.equal(winner, await signer.getAddress());
                assert.equal(raffleinteractbalance, 0);
                assert(winnerendingbalance > winnerstartingbalance);
                console.log(await winner);
              } catch (e) {
                reject(e);
              }
              resolve();
            });

            const tx1 = await raffleinteract.enterlottery({
              value: ethers.parseEther("0.05"),
            });
            await tx1.wait();
            const winnerstartingbalance =
              await ethers.provider.getBalance(deployer);
          });
        });
      });
    });
