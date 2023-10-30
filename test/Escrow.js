const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};
//1 ->token id assumed for testing
describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;
  // run before each test suite
  beforeEach(async () => {
    // Setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy Real Estate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // Minting using seller .connect() -> to create a new instance of contract connected to wallet
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transaction.wait();

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      lender.address,
      inspector.address,
      seller.address,
      realEstate.address
    );

    // Approve property(get owner consent)
    transaction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transaction.wait();
    //list property
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftaddr();
      expect(result).to.be.equal(realEstate.address);
    });

    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });
  describe("Listing", () => {
    it("is Listed?", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });
    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });

    it("Returns purchase price", async () => {
      const result = await escrow.pp(1);
      expect(result).to.be.equal(tokens(10));
    });

    it("Returns escrow amount", async () => {
      const result = await escrow.ea(1);
      expect(result).to.be.equal(tokens(5));
    });
    it("changes ownership", async () => {
      // ownerOf(tokenid)=> gives who is the owner of token  id
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
  });
  describe("Deposits", () => {
    it("updates contract funds", async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) }); //msg.value() is tokens(5)
      await transaction.wait();
      const result = await escrow.getBalance(); //to get funds holded by escrow
      expect(result).to.be.equal(tokens(5));
    });
  });
  describe("Inspection", () => {
    it("updates inspection status", async () => {
      const transaction = await escrow.connect(inspector).inspect(1, true); //msg.value() is tokens(5)
      await transaction.wait();
      const result = await escrow.inspectionStatus(1); //to get funds holded by escrow
      expect(result).to.be.equal(true);
    });
  });
  describe("Approval", () => {
    it("updates approval status", async () => {
      let transaction = await escrow.connect(buyer).apporveSale(1);
      await transaction.wait();
      transaction = await escrow.connect(seller).apporveSale(1);
      await transaction.wait();
      transaction = await escrow.connect(lender).apporveSale(1);
      await transaction.wait();
      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });
  describe("Sale", async () => {
    beforeEach(async () => {
      // as parllell describe starts from 0 thus have to send buyers funds again
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) }); //msg.value() is tokens(5)
      await transaction.wait();
      transaction = await escrow.connect(inspector).inspect(1, true);
      await transaction.wait();
      transaction = await escrow.connect(buyer).apporveSale(1);
      await transaction.wait();
      transaction = await escrow.connect(seller).apporveSale(1);
      await transaction.wait();
      transaction = await escrow.connect(lender).apporveSale(1);
      await transaction.wait();
      await lender.sendTransaction({ to: escrow.address, value: tokens(5) }); //send funds from lender to escrow

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });
    it("escrow 0", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
    it("buyer owner?", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
    });
  });
});
