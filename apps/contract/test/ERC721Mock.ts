import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC721Mock", function () {
  let erc721Mock: any;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  const TEST_NAME = "MockNFT";
  const TEST_SYMBOL = "MNFT";
  const TEST_URI = "ipfs://QmTest";

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    erc721Mock = await ERC721Mock.deploy(TEST_NAME, TEST_SYMBOL);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await erc721Mock.name()).to.equal(TEST_NAME);
      expect(await erc721Mock.symbol()).to.equal(TEST_SYMBOL);
    });

    it("Should start with total supply of 0", async function () {
      expect(await erc721Mock.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token without URI", async function () {
      await expect(erc721Mock.mint(addr1.address, ""))
        .to.emit(erc721Mock, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 0);

      expect(await erc721Mock.ownerOf(0)).to.equal(addr1.address);
      expect(await erc721Mock.totalSupply()).to.equal(1);
    });

    it("Should mint a new token with URI", async function () {
      await erc721Mock.mint(addr1.address, TEST_URI);
      
      expect(await erc721Mock.ownerOf(0)).to.equal(addr1.address);
      expect(await erc721Mock.tokenURI(0)).to.equal(TEST_URI);
    });

    it("Should increment token IDs correctly", async function () {
      await erc721Mock.mint(addr1.address, TEST_URI);
      await erc721Mock.mint(addr1.address, TEST_URI + "2");

      expect(await erc721Mock.totalSupply()).to.equal(2);
      expect(await erc721Mock.tokenURI(0)).to.equal(TEST_URI);
      expect(await erc721Mock.tokenURI(1)).to.equal(TEST_URI + "2");
    });
  });
}); 