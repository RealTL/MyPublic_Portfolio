// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main(){
    const NAME = 'Dapp University';
    const SYMBOL = 'DAPP';
    const MAX_SUPPLY = '1000000';
    const PRICE = hre.ethers.utils.parseUnits('0.025', 'ether');

    // Token deployment code goes here
    const Token = await hre.ethers.getContractFactory('Token');
    const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY);  
    await token.deployed();
    console.log("\x1b[32m", `\n Token deployed to: ${token.address}`);
    
    // Crowdsale deployment code goes here
    const Crowdsale = await hre.ethers.getContractFactory('Crowdsale');
    const crowdsale = await Crowdsale.deploy(token.address, PRICE, hre.ethers.utils.parseUnits(MAX_SUPPLY, 'ether'));
    await crowdsale.deployed();
    console.log("\x1b[32m",`Crowdsale deployed to: ${crowdsale.address}\n`);

    // Deploy DAO contract
    const DAO = await hre.ethers.getContractFactory('DAO');
    const dao = await DAO.deploy(token.address, '500000000000000000000001');
    await dao.deployed();
    console.log("\x1b[32m", `DAO deployed to: ${token.address}\n`);

    // Send tokens to crowdsale contract address
    const transaction = await token.transfer(crowdsale.address, hre.ethers.utils.parseUnits(MAX_SUPPLY, 'ether'));
    await transaction.wait();
    console.log("\x1b[38;5;117m",`Deployments successful! Tokens have been transferred to the Crowdsale contract.`);  
    console.log("\x1b[38;5;117m",`Crowdsale Contract Balance is: ${ hre.ethers.utils.formatUnits(await token.balanceOf(crowdsale.address), 'ether')}`);



}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});