import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BattleBot", function () {
  async function deployBattleBotFixture() {
    // Get signers
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    const BattleBot = await ethers.getContractFactory("BattleBot");
    const battleBot = await BattleBot.deploy();

    return { battleBot, owner, addr1, addr2 };
  }

  const MOCK_TOKEN_URI = "ipfs://QmTest";
  const NEW_TOKEN_URI = "ipfs://QmTestNew";

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { battleBot } = await loadFixture(deployBattleBotFixture);

      expect(await battleBot.name()).to.equal("BattleBot");
      expect(await battleBot.symbol()).to.equal("BBOT");
    });

    it("Should set the right owner", async function () {
      const { battleBot, owner } = await loadFixture(deployBattleBotFixture);

      expect(await battleBot.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token and emit event", async function () {
      const { battleBot, addr1 } = await loadFixture(deployBattleBotFixture);

      await expect(battleBot.connect(addr1).mintBot(MOCK_TOKEN_URI))
        .to.emit(battleBot, "BattleBotMinted")
        .withArgs(addr1.address, 0, MOCK_TOKEN_URI);

      expect(await battleBot.ownerOf(0)).to.equal(addr1.address);
      expect(await battleBot.tokenURI(0)).to.equal(MOCK_TOKEN_URI);
    });

    it("Should increment token IDs correctly", async function () {
      const { battleBot, addr1 } = await loadFixture(deployBattleBotFixture);

      await battleBot.connect(addr1).mintBot(MOCK_TOKEN_URI);
      await battleBot.connect(addr1).mintBot(MOCK_TOKEN_URI);

      expect(await battleBot.getTotalSupply()).to.equal(2);
    });

    it("Should not allow minting when paused", async function () {
      const { battleBot, owner, addr1 } = await loadFixture(
        deployBattleBotFixture
      );

      await battleBot.connect(owner).pause();

      await expect(
        battleBot.connect(addr1).mintBot(MOCK_TOKEN_URI)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Token URI Updates", function () {
    it("Should allow owner to update token URI", async function () {
      const { battleBot, addr1 } = await loadFixture(deployBattleBotFixture);

      await battleBot.connect(addr1).mintBot(MOCK_TOKEN_URI);

      await expect(battleBot.connect(addr1).updateTokenURI(0, NEW_TOKEN_URI))
        .to.emit(battleBot, "BattleBotURIUpdated")
        .withArgs(0, NEW_TOKEN_URI);

      expect(await battleBot.tokenURI(0)).to.equal(NEW_TOKEN_URI);
    });

    it("Should not allow non-owner to update token URI", async function () {
      const { battleBot, addr1, addr2 } = await loadFixture(
        deployBattleBotFixture
      );

      await battleBot.connect(addr1).mintBot(MOCK_TOKEN_URI);

      await expect(
        battleBot.connect(addr2).updateTokenURI(0, NEW_TOKEN_URI)
      ).to.be.revertedWith("Caller is not owner nor approved");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { battleBot, owner } = await loadFixture(deployBattleBotFixture);

      await battleBot.connect(owner).pause();
      expect(await battleBot.paused()).to.be.true;

      await battleBot.connect(owner).unpause();
      expect(await battleBot.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      const { battleBot, addr1 } = await loadFixture(deployBattleBotFixture);

      await expect(battleBot.connect(addr1).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
