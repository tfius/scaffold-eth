const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("My Dapp", function () {
  let myContract;

  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });
  describe("TaskBroker", function () {
    let TaskBroker;
    let taskBroker;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async () => {
      TaskBroker = await ethers.getContractFactory("TaskBroker");
      [owner, addr1, addr2, _] = await ethers.getSigners();
      taskBroker = await TaskBroker.deploy();
      await taskBroker.deployed();
    });

    it("Should add a task correctly", async function () {
      await taskBroker
        .connect(addr1)
        .brokerAddService("0x1234", ethers.utils.parseEther("1"));
      await taskBroker.connect(addr2).addTask(addr1.address, 0, "0x5678", {
        value: ethers.utils.parseEther("2"),
      });

      const task = await taskBroker.getTask(0);
      expect(task.owner).to.equal(addr2.address);
      expect(task.broker).to.equal(addr1.address);
      expect(task.serviceId).to.equal(0);
    });

    it("Should allow a broker to take a task", async function () {
      await taskBroker
        .connect(addr1)
        .brokerAddService("0x1234", ethers.utils.parseEther("1"));
      await taskBroker.connect(addr2).addTask(addr1.address, 0, "0x5678", {
        value: ethers.utils.parseEther("2"),
      });
      await taskBroker.connect(addr1).takePendingTask(0);

      const task = await taskBroker.getTask(0);
      expect(task.status).to.equal(1); // TaskStatus.Taken
    });

    it("Should allow a broker to complete a task", async function () {
      await taskBroker
        .connect(addr1)
        .brokerAddService("0x1234", ethers.utils.parseEther("1"));
      await taskBroker.connect(addr2).addTask(addr1.address, 0, "0x5678", {
        value: ethers.utils.parseEther("2"),
      });
      await taskBroker.connect(addr1).takePendingTask(0);
      await taskBroker.connect(addr1).completeTask(0, "0x9abc");

      const task = await taskBroker.getTask(0);
      expect(task.status).to.equal(2); // TaskStatus.Completed
      expect(task.result).to.equal("0x9abc");
    });

    // ... continue writing more tests ...
  });

  describe("YourContract", function () {
    it("Should deploy YourContract", async function () {
      const YourContract = await ethers.getContractFactory("YourContract");

      myContract = await YourContract.deploy();
    });

    describe("setPurpose()", function () {
      it("Should be able to set a new purpose", async function () {
        const newPurpose = "Test Purpose";

        await myContract.setPurpose(newPurpose);
        expect(await myContract.purpose()).to.equal(newPurpose);
      });

      // Uncomment the event and emit lines in YourContract.sol to make this test pass

      /* it("Should emit a SetPurpose event ", async function () {
        const [owner] = await ethers.getSigners();

        const newPurpose = "Another Test Purpose";

        expect(await myContract.setPurpose(newPurpose)).to.
          emit(myContract, "SetPurpose").
            withArgs(owner.address, newPurpose);
      }); */
    });
  });
});
