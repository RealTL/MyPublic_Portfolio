// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json');

const tokens = (n) => {
    return hre.ethers.utils.parseUnits(n.toString(), 'ether');
  }
const ether = tokens

async function main(){
    console.log("\x1b[38;5;99m",`\n Fetching accounts & network...`);
    const accounts = await ethers.getSigners();
    const funder = accounts[0];
    const investor1 = accounts[1];
    const investor2 = accounts[2];
    const investor3 = accounts[3];
    const recipient = accounts[4];
    
    let transaction
    const { chainId } = await ethers.provider.getNetwork();
    console.log("\x1b[35m", "CID: ", chainId);

    console.log("\x1b[38;5;99m", `Fetching tokens and transferring to accounts...`);
    const token = await ethers.getContractAt('Token', config[chainId].token.address);
    console.log("\x1b[38;5;117m", `Tokens contract obtained from address:     `, "\x1b[32m", `${token.address}`, "...");
    console.log("\x1b[38;5;117m", `Transferring tokens to investor1 @ address:`, "\x1b[32m", `${investor1.address}...`);
    // Send tokens to test investors = each one gets 20%
    transaction = await token.transfer(investor1.address, tokens(200000));
    await transaction.wait();
    console.log("\x1b[38;5;117m", `Transferring tokens to investor2 @ address:`, "\x1b[32m", `${investor2.address} ...`);
    transaction = await token.transfer(investor2.address, tokens(200000));
    await transaction.wait();
    console.log("\x1b[38;5;117m", `Transferring tokens to investor3 @ address:`, "\x1b[32m", `${investor3.address} ...`);
    transaction = await token.transfer(investor3.address, tokens(200000));
    await transaction.wait();
    console.log("\x1b[38;5;99m", `Fetching DAO contract...`);
    const dao = await ethers.getContractAt('DAO', config[chainId].dao.address);
    console.log("\x1b[38;5;117m", `DAO contract obtained from address:        `, "\x1b[32m", `${dao.address} ...\n`);
    // Funder sends tokens to the DAO treasury...
    transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) });
    await transaction.wait();
    console.log("\x1b[38;5;99m", `Sent funds to DAO treasury...`);

    for (var i = 0; i < 3; i++) {
        // Create Proposal
        transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, ether(100), recipient.address);
        await transaction.wait();
  
        // Vote 1
        transaction = await dao.connect(investor1).vote(i + 1);
        await transaction.wait();
  
        // Vote 2
        transaction = await dao.connect(investor2).vote(i + 1);
        await transaction.wait();
  
        // Vote 3
        transaction = await dao.connect(investor3).vote(i + 1);
        await transaction.wait();
  
        // Finalize
        transaction = await dao.connect(investor1).finalizeProposal(i + 1);
        await transaction.wait();
  
        console.log("\x1b[32m", `Created & Finalized Proposal ${i + 1}`);
    }
    
    
        console.log("\x1b[38;5;99m", `Creating one more proposal...\n`);
        transaction = await dao.connect(investor1).createProposal(`Proposal 4`, ether(100), recipient.address);
        await transaction.wait();       
        
        transaction = await dao.connect(investor2).vote(4);
        await transaction.wait();
        transaction = await dao.connect(investor3).vote(4);
        await transaction.wait();
        
        console.log(`\x1b[38;5;208m Finished !!!\n`);

}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})