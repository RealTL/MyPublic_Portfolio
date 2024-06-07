const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
}

describe('DAO2', () => {
  let token, dao, accounts, deployer, funder, investor1, recipient,
    investor2, investor3, investor4, investor5, user, transaction;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    funder = accounts[1];
    investor1 = accounts[2];
    investor2 = accounts[3];
    investor3 = accounts[4];
    investor4 = accounts[5];
    investor5 = accounts[6];
    recipient = accounts[7];
    user = accounts[8];

    // Deploy Token
    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy('Dapp University', 'DAPP', '1000000');
    await token.deployed();

    // Send tokens to investors - each one gets 20%
    transaction = await token.transfer(investor1.address, tokens(200000));
    await transaction.wait();
    console.log('Investor1 balance:', (await token.balanceOf(investor1.address)).toString());

    transaction = await token.transfer(investor2.address, tokens(200000));
    await transaction.wait();
    console.log('Investor2 balance:', (await token.balanceOf(investor2.address)).toString());

    transaction = await token.transfer(investor3.address, tokens(200000));
    await transaction.wait();
    console.log('Investor3 balance:', (await token.balanceOf(investor3.address)).toString());

    transaction = await token.transfer(investor4.address, tokens(200000));
    await transaction.wait();
    console.log('Investor4 balance:', (await token.balanceOf(investor4.address)).toString());

    transaction = await token.transfer(investor5.address, tokens(200000));
    await transaction.wait();
    console.log('Investor5 balance:', (await token.balanceOf(investor5.address)).toString());

    // Check the remaining balance of the deployer
    console.log('Remaining Deployer balance:', (await token.balanceOf(deployer.address)).toString());

    // Deploy DAO
    // Set Quorum to > 50% of token total supply
    const DAO = await ethers.getContractFactory('DAO2');
    dao = await DAO.deploy(token.address, tokens(500001));
    await dao.deployed();

    // Transfer tokens to DAO
    transaction = await token.transfer(dao.address, tokens(1000));
    await transaction.wait();
    console.log('DAO balance:', (await token.balanceOf(dao.address)).toString());
  });

  describe('Deployment', () => {
    it('returns token address', async () => {
      expect(await dao.token()).to.equal(token.address);
    });

    it('returns quorum', async () => {
      expect(await dao.quorum()).to.equal(tokens(500001));
    });

    it('has initial token balance', async () => {
      expect(await token.balanceOf(dao.address)).to.equal(tokens(1000));
    });
  });

  describe('Proposal creation', () => {
    let transaction, result;

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Proposal 1', tokens(100), recipient.address);
        result = await transaction.wait();
      });

      it('updates proposal count', async () => {
        expect(await dao.proposalCount()).to.equal(1);
      });

      it('updates proposal mapping', async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.id).to.equal(1);
        expect(proposal.amount).to.equal(tokens(100));
        expect(proposal.recipient).to.equal(recipient.address);
      });

      it('emits a propose event', async () => {
        await expect(transaction).to.emit(dao, 'Propose')
          .withArgs(1, tokens(100), recipient.address, investor1.address);
      });
    });

    describe('Failure', () => {
      it('rejects invalid amount - not enough funds in contract to process', async () => {
        await expect(dao.connect(investor1).createProposal('Proposal 1', tokens(10000), recipient.address)).to.be.revertedWith("Not enough tokens in DAO");
      });

      it('rejects a non-investor', async () => {
        await expect(dao.connect(user).createProposal('Proposal 1', tokens(100), recipient.address)).to.be.revertedWith("Must be a token holder.");
      });
    });
  });

  describe('Voting', () => {
    let transaction, result;
    beforeEach(async () => {
      transaction = await dao.connect(investor1).createProposal('Proposal 1', tokens(100), recipient.address);
      result = await transaction.wait();
    });

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).vote(1);
        result = await transaction.wait();
      });

      it('updates vote count', async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.votes).to.equal(tokens(200000));
      });

      it('emits a vote event', async () => {
        await expect(transaction).to.emit(dao, 'Vote')
          .withArgs(1, investor1.address);
      });
    });

    describe('Failure', () => {
      it('rejects a non-investor', async () => {
        await expect(dao.connect(user).vote(1)).to.be.revertedWith("Must be a token holder.");
      });

      it('rejects double voting', async () => {
        transaction = await dao.connect(investor1).vote(1);
        await transaction.wait();
        await expect(dao.connect(investor1).vote(1)).to.be.revertedWith("voter has already voted");
      });
    });
  });

  describe('Governance', () => {
    let transaction, result;
    describe('Success', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Proposal 1', tokens(100), recipient.address);
        result = await transaction.wait();
        await dao.connect(investor1).vote(1);
        await dao.connect(investor2).vote(1);
        await dao.connect(investor3).vote(1);
        await dao.connect(investor4).vote(1);
        await dao.connect(investor5).vote(1);

        transaction = await dao.connect(investor1).finalizeProposal(1);
        result = await transaction.wait();
      });

      it('transfers funds to recipient', async () => {
        expect(await token.balanceOf(recipient.address)).to.equal(tokens(100));
      });

      it('updates the proposal - finalized the proposal to "true".', async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.finalized).to.be.equal(true);
      });

      it('emits a Finalize event', async () => {
        await expect(transaction).to.emit(dao, 'Finalize')
          .withArgs(1);
      });
    });

    describe('Failure', () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Proposal 1', tokens(100), recipient.address);
        result = await transaction.wait();
        await dao.connect(investor1).vote(1);
        await dao.connect(investor2).vote(1);
      });

      it('rejects finalization from non-investor', async () => {
        await expect(dao.connect(user).finalizeProposal(1)).to.be.revertedWith("Must be a token holder.");
      });

      it('rejects finalization if not enough votes have been cast. i.e., quorum vote count is unmet.', async () => {
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.revertedWith("must reach quorum to finalize proposal");
      });

      it('rejects proposal if already finalized.', async () => {
        await dao.connect(investor3).vote(1);
        transaction = await dao.connect(investor1).finalizeProposal(1);
        result = await transaction.wait();

        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.revertedWith("proposal already finalized.");
      });
    });
  });
});