// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const font = {
  reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", ltgreen: "\x1b[38;5;121m", 
  liteblue: "\x1b[38;5;117m", teal: "\x1b[36m", orange: "\x1b[38;5;208m"
};

const hre = require("hardhat");
const config = require('../src/config.json');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
}

const ether = tokens

async function main() {
  console.log(font.liteblue, `\n Fetching accounts & network...`);

  const accounts = await ethers.getSigners()
  const funder = accounts[0]
  const investor1 = accounts[1]
  const investor2 = accounts[2]
  const investor3 = accounts[3]
  const recipient = accounts[4]

  let transaction

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork()

  console.log(font.liteblue, `Fetching token and transferring to accounts...`);

  // Fetch deployed token
  const token = await ethers.getContractAt('Token', config[chainId].token.address)
  console.log(font.ltgreen, `Token fetched:`, font.green , `${token.address}`);

  // Send tokens to investors - each one gets 20%
  transaction = await token.transfer(investor1.address, tokens(200000))
  await transaction.wait()

  transaction = await token.transfer(investor2.address, tokens(200000))
  await transaction.wait()

  transaction = await token.transfer(investor3.address, tokens(200000))
  await transaction.wait()

  console.log(font.liteblue, `Fetching dao...`);

  // Fetch deployed dao
  const dao = await ethers.getContractAt('DAO', config[chainId].dao.address)
  console.log(font.ltgreen, `DAO fetched:`, font.green,` ${dao.address}`);

  // Funder sends Ether to DAO treasury
  console.log(font.liteblue, `Sending funds from Funder to DAO contract...`);
  transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) }) // 1,000 Ether
  await transaction.wait()
  console.log(font.ltgreen, `Sent funds to dao treasury: `, font.green,` ${await ethers.provider.getBalance(dao.address)}`);

  for (var i = 0; i < 3; i++) {
      // Create Proposal
      transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, ether(100), recipient.address)
      await transaction.wait()

      // Vote 1
      transaction = await dao.connect(investor1).vote(i + 1)
      await transaction.wait()

      // Vote 2
      transaction = await dao.connect(investor2).vote(i + 1)
      await transaction.wait()

      // Vote 3
      transaction = await dao.connect(investor3).vote(i + 1)
      await transaction.wait()

      // Finalize
      transaction = await dao.connect(investor1).finalizeProposal(i + 1)
      await transaction.wait()

      console.log(font.liteblue, `Created & Finalized Proposal ${i + 1}`);
  }

    console.log(font.ltgreen, `\n Creating one more proposal...\n`);

    // Create one more proposal
    transaction = await dao.connect(investor1).createProposal(`Proposal 4`, ether(100), recipient.address)
    await transaction.wait()

    // Vote 1
    transaction = await dao.connect(investor2).vote(4)
    await transaction.wait()

    // Vote 2
    transaction = await dao.connect(investor3).vote(4)
    await transaction.wait()

    console.log(font.green, `Finished!\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
