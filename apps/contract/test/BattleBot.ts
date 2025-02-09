import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("BattleBot", function () {
  let battleBot: any;
  let owner: any;
  let addr1: any;

  // Example of expected metadata format stored on IPFS
  const EXAMPLE_METADATA = {
    version: 1,
    name: "Battle Bot #1",
    battlePrompt:
      "A strategic combat AI that specializes in calculated strikes",
    image: "ipfs://QmTest/image.png",
    attributes: {
      attack: 75,
      defense: 60,
      speed: 85,
      mainWeapon: 1,
    },
  };

  const TEST_URI = "ipfs://QmTest";

  beforeEach(async function () {
    const signers = await hre.ethers.getSigners();
    owner = signers[0];
    addr1 = signers[1];

    const BattleBot = await ethers.getContractFactory("BattleBot");
    battleBot = await BattleBot.deploy();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await battleBot.name()).to.equal("BattleBot");
      expect(await battleBot.symbol()).to.equal("BBOT");
    });

    it("Should start with total supply of 0", async function () {
      expect(await battleBot.getTotalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token and emit event", async function () {
      await expect(battleBot.mintBot(TEST_URI))
        .to.emit(battleBot, "BattleBotMinted")
        .withArgs(owner.address, 0, TEST_URI);

      expect(await battleBot.ownerOf(0)).to.equal(owner.address);
      expect(await battleBot.getTotalSupply()).to.equal(1);
    });

    it("Should store the token URI correctly", async function () {
      await battleBot.mintBot(TEST_URI);
      expect(await battleBot.tokenURI(0)).to.equal(TEST_URI);
    });

    it("Should allow different addresses to mint", async function () {
      await battleBot.connect(addr1).mintBot(TEST_URI);
      expect(await battleBot.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should increment token IDs correctly", async function () {
      await battleBot.mintBot(TEST_URI);
      await battleBot.mintBot(TEST_URI + "2");

      expect(await battleBot.getTotalSupply()).to.equal(2);
      expect(await battleBot.tokenURI(0)).to.equal(TEST_URI);
      expect(await battleBot.tokenURI(1)).to.equal(TEST_URI + "2");
    });
  });
});
