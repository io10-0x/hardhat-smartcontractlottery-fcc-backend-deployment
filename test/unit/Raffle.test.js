const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { interfaces } = require("mocha");
require("@nomicfoundation/hardhat-chai-matchers");

!(network.config.chainId == 1337)
  ? describe.skip
  : describe("Raffle project unit tests", function () {
      let deployer;
      let Raffle;
      let mockv3aggregator;
      let vrfcoordinatorv2mock;
      let vrfv2wrapper;
      let linktoken;
      let interval;
      const sendval = ethers.parseEther("0.1");
      beforeEach(async function () {
        await deployments.fixture(["all"]);
        //deployer = (await getNamedAccounts()).deployer;
        const signers = await ethers.getSigners();
        deployer = signers[0];

        Raffle = await ethers.getContract("Raffle", deployer);
        mockv3aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
        vrfcoordinatorv2mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        linktoken = await ethers.getContract("LinkToken", deployer);
        vrfv2wrapper = await ethers.getContract("VRFV2Wrapper", deployer);
        console.log("Raffle deployed at:", await Raffle.getAddress());
        console.log(
          "MockV3Aggregator deployed at:",
          await mockv3aggregator.getAddress()
        );
        console.log(network.config.chainId);
        console.log(
          "VRFCoordinatorV2Mock deployed at:",
          await vrfcoordinatorv2mock.getAddress()
        );
        console.log(
          "VRFV2Wrapper deployed at:",
          await vrfv2wrapper.getAddress()
        );
        console.log(
          "LinkToken deployed at:",
          await vrfcoordinatorv2mock.getAddress()
        );
        const linkamount = ethers.parseEther("8000");

        const tx1 = await linktoken.transfer(
          await Raffle.getAddress(),
          linkamount
        );
        await tx1.wait(1);

        interval = await Raffle.getinterval();
      });

      describe("Constructor Test", function () {
        it("Test that the lottery is open and entrance fee is 0.05 eth ", async function () {
          const givenentrancefee = await Raffle.getentrancefee();
          const entrancefee = ethers.parseEther("0.05");
          const lotterystate = await Raffle.getlotterystate();
          const expectedlotterystate = 0;
          assert.equal(givenentrancefee, entrancefee);
          assert.equal(lotterystate, expectedlotterystate);
        });
      });

      describe("Enter Lottery", function () {
        it("Test that user cannot enter lottery with less than 0.05 eth ", async function () {
          await expect(
            Raffle.enterlottery({ value: ethers.parseEther("0.01") })
          ).to.be.revertedWithCustomError(Raffle, "Raffle__NotEnoughETH");
        });

        it("Test that user cannot enter lottery without it being open", async function () {
          const entertx = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await entertx.wait();
          const blockBefore = await ethers.provider.getBlock("latest");
          console.log(
            "Block timestamp before increase:",
            blockBefore.timestamp
          );

          await network.provider.send("hardhat_mine", [
            5,
            Number(interval) + 1,
          ]);
          const blockAfter = await ethers.provider.getBlock("latest");
          console.log("Block timestamp after increase:", blockAfter.timestamp);
          await Raffle.performUpkeep("0x"); //changes lottery state to calculating winner
          await expect(
            Raffle.enterlottery({ value: ethers.parseEther("0.05") })
          ).to.be.revertedWithCustomError(Raffle, "Raffle__LotteryNotOpen");
        });

        it("Test that event is being emitted", async function () {
          await expect(
            Raffle.enterlottery({ value: ethers.parseEther("0.05") })
          ).to.emit(Raffle, "Lotteryenter");
        });

        it("Test that players array is updated properly", async function () {
          const enterlottery = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await enterlottery.wait();
          const player = await Raffle.getplayer(0);
          assert.equal(player, deployer.address);
        });
      });

      describe("checkUpkeep", function () {
        it("Test that checkupKeep returns false when there are no players in raffle", async function () {
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x");
          console.log(upkeepNeeded);
          assert.equal(upkeepNeeded, false);
        });

        it("Test that checkupKeep returns false when raffle is not open", async function () {
          const entertx = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await entertx.wait();
          const blockBefore = await ethers.provider.getBlock("latest");
          console.log(
            "Block timestamp before increase:",
            blockBefore.timestamp
          );

          await network.provider.send("hardhat_mine", [
            5,
            Number(interval) + 1,
          ]);
          const blockAfter = await ethers.provider.getBlock("latest");
          console.log("Block timestamp after increase:", blockAfter.timestamp);
          await Raffle.performUpkeep("0x"); //changes lottery state to calculating winner
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x");
          console.log(upkeepNeeded);
          assert.equal(upkeepNeeded, false);
        });

        it("Test that upkeepNeeded returns false if enough time hasnt passed", async function () {
          const entertx = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await entertx.wait();
          const blockBefore = await ethers.provider.getBlock("latest");
          console.log(
            "Block timestamp before increase:",
            blockBefore.timestamp
          );

          await network.provider.send("hardhat_mine", [
            1,
            Number(interval) - 1,
          ]);
          const blockAfter = await ethers.provider.getBlock("latest");
          console.log("Block timestamp after increase:", blockAfter.timestamp);
          const { upkeepNeeded } = await Raffle.checkUpkeep("0x");
          console.log(upkeepNeeded);
          assert.equal(upkeepNeeded, false);
        });
      });

      describe("performUpkeep", function () {
        it("Test that performUpkeep can be called if all conditions of upkeepNeeded are met", async function () {
          const entertx = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await entertx.wait();
          const blockBefore = await ethers.provider.getBlock("latest");
          console.log(
            "Block timestamp before increase:",
            blockBefore.timestamp
          );

          await network.provider.send("hardhat_mine", [
            5,
            Number(interval) + 1,
          ]);
          const blockAfter = await ethers.provider.getBlock("latest");
          console.log("Block timestamp after increase:", blockAfter.timestamp);
          const tx1 = await Raffle.performUpkeep("0x");
          const tx1receipt = await tx1.wait(1);
          assert(tx1receipt);
        });

        it("Test that lottery state is successfully updated and requestrandomness function returns requestid", async function () {
          const entertx = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await entertx.wait();
          const blockBefore = await ethers.provider.getBlock("latest");
          console.log(
            "Block timestamp before increase:",
            blockBefore.timestamp
          );

          await network.provider.send("hardhat_mine", [
            2,
            Number(interval) + 1,
          ]);
          const blockAfter = await ethers.provider.getBlock("latest");
          console.log("Block timestamp after increase:", blockAfter.timestamp);
          const tx1 = await Raffle.performUpkeep("0x");
          const tx1receipt = await tx1.wait(1);
          const eventLogs = tx1receipt.logs;
          console.log(eventLogs);
          let requestId; // Variable to store the requestId

          // Iterate over the logs to find the 'RequestSent' event
          for (let log of eventLogs) {
            if (log.fragment && log.fragment.name === "RequestSent") {
              requestId = log.args[0]; // Store the requestId
              break; // Stop the loop once the requestId is found
            }
          }
          assert.equal(await Raffle.getlotterystate(), 1);
          assert(requestId > 0);
        });
      });

      describe("fulfillrandomwords", function () {
        beforeEach(async function () {
          const entertx = await Raffle.enterlottery({
            value: ethers.parseEther("0.05"),
          });
          await entertx.wait();
          await network.provider.send("hardhat_mine", [
            2,
            Number(interval) + 1,
          ]);
        });

        it("check that if performUpkeep isnt called to get requestid, fulfillrandomWords will revert no matter what number the requestid is", async function () {
          await expect(
            vrfcoordinatorv2mock.fulfillRandomWords(
              0,
              await vrfv2wrapper.getAddress()
            )
          ).to.be.reverted;
          await expect(
            vrfcoordinatorv2mock.fulfillRandomWords(
              1,
              await vrfv2wrapper.getAddress()
            )
          ).to.be.reverted;
        });

        it("check that when fulfillrandomwords is called, winner is correctly chosen and paid out, players array is emptied, lottery state is open, events are emitted correctly and timestamp is updated correctly", async function () {
          const numberofplayers = 4;
          const signers = await ethers.getSigners();
          for (let i = 1; i <= numberofplayers; i++) {
            const connectedraffle = await Raffle.connect(signers[i]);
            await connectedraffle.enterlottery({
              value: ethers.parseEther("0.05"),
            });
          }
          const startingblocktimestamp = await Raffle.getlatestblocktimestamp();
          const winnerstartingbalance = await ethers.provider.getBalance(
            signers[1].address
          );
          console.log(winnerstartingbalance);
          await new Promise(async (resolve, reject) => {
            Raffle.once("WinnerPicked", async function () {
              //put assert statements here
              try {
                const winner = await Raffle.getwinner();
                const account1 = signers[1];
                const account2 = signers[2];
                const account3 = signers[3];
                const account4 = signers[4];
                const lotterystate = await Raffle.getlotterystate();
                const blocktimestamp = await Raffle.getlatestblocktimestamp();
                const winnerendingbalance =
                  await ethers.provider.getBalance(account1);

                console.log(winnerendingbalance - winnerstartingbalance);
                const rafflebalance = await ethers.provider.getBalance(
                  await Raffle.getAddress()
                );
                console.log(rafflebalance);
                assert.equal(lotterystate, 0);
                assert(blocktimestamp > startingblocktimestamp);
                assert.equal(winner, account1.address);
                assert.equal(rafflebalance, 0);
                assert(winnerendingbalance > winnerstartingbalance);
                console.log(await winner);
                console.log(account1.address);
                console.log(account2.address);
                console.log(account3.address);
                console.log(account4.address);
                console.log(deployer.address);
              } catch (e) {
                reject(e);
              }
              resolve();
            });

            const tx2 = await Raffle.performUpkeep("0x");
            const txreceipt = await tx2.wait();
            const eventLogs = txreceipt.logs;
            //console.log(eventLogs);
            await vrfcoordinatorv2mock.fulfillRandomWords(
              1,
              await vrfv2wrapper.getAddress()
            );
          });
        });
      });
    });
