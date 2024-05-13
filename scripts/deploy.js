const hre = require("hardhat");
let token;

async function main(){
    const NAME = 'Dapp University';
    const SYMBOL = 'DAPP';
    const MAX_SUPPLY = '1000000';
    const PRICE = hre.ethers.utils.parseUnits('0.025', 'ether');

    // Token deployment code goes here
    const Token = await hre.ethers.getContractFactory('Token');
    let token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY);  
    await token.deployed();
    console.log("\x1b[32m", `\n Token deployed to: ${token.address}`);
    
    // Crowdsale deployment code goes here
    const Crowdsale = await hre.ethers.getContractFactory('Crowdsale');
    const crowdsale = await Crowdsale.deploy(token.address, PRICE, hre.ethers.utils.parseUnits(MAX_SUPPLY, 'ether'));
    await crowdsale.deployed();
    console.log("\x1b[32m",`Crowdsale deployed to: ${crowdsale.address}\n`);

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