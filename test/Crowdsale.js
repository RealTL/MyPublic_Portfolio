const { expect } = require('chai');
const { ethers } = require('hardhat');

const termcolors = {
    reset: "\x1b[0m", red: "\x1b[31m", ltred: "\x1b[38;5;168m", green: "\x1b[32m", ltgreen: "\x1b[38;5;121m", 
    ltrgreen: "\x1b[38;5;114m", purple: "\x1b[35m", dpurple: "\x1b[38;5;99m", 
    ddpurple: "\x1b[38;5;63m", liteblue: "\x1b[38;5;117m", 
    yellow: "\x1b[33m", teal: "\x1b[36m", dteal: "\x1b[38;5;30m", 
    blink: "\x1b[5m", orange: "\x1b[38;5;208m"
  };


const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
}

const ether = tokens;

describe('Crowdsale', () => {
    let crowdsale, token;
    let accounts, deployer, user1;

    beforeEach(async () => {
        // Load Contracts
        const Crowdsale = await ethers.getContractFactory('Crowdsale');
        const Token = await ethers.getContractFactory('Token');
        // Deploy token contract
        token = await Token.deploy('Dapp University', 'DAPP', '1000000');  
        // define accounts for the parties involved in this test transaction
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user1 = accounts[1];
        // Deploy crowdsale contract
        crowdsale = await Crowdsale.deploy(token.address, ether(1), '1000000');
        // Transfer tokens into the crowdsale contract
        let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000));
        await transaction.wait();
    });

    describe('Deployment', () => {
        it('Checking crowdsale contract is funded', async () => {
            let bal = await token.balanceOf(crowdsale.address);

            console.log(termcolors.liteblue, "     Crowdsale Token Contract Balance (before transfer): " + 
                        ethers.utils.formatUnits(bal.toString(), 'ether'));
            expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000));
        });
               
        it('Checking price', async () => {
            expect(await crowdsale.price()).to.equal(ether(1));
        });

        it('Checking token address', async () => {
            expect(await crowdsale.token()).to.equal(token.address);
        });

        it('Checking contract name', async () => {
            expect(await crowdsale.name()).to.equal("Crowdsale");
        });
    });

    describe('Buying Tokens', () => {
        let transaction, result;
        let amount = tokens(10);
        let ubal;
        let cbal;
        let ebal;

        describe('Success', () => {
            beforeEach(async () => {
                transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(10) });
                result = await transaction.wait();
                ubal = await token.balanceOf(user1.address);
                cbal = await token.balanceOf(crowdsale.address);
            })

            it('Checking token transfers', async () => {
                expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999990));
                expect(await token.balanceOf(user1.address)).to.equal(amount); 
                console.log(termcolors.liteblue, "       User1 Token Contract Balance (after transfer): " + 
                ethers.utils.formatUnits(ubal.toString(), 'ether'));
                console.log(termcolors.liteblue, "       Crowdsale Token Contract Balance (after transfer): " + 
                ethers.utils.formatUnits(cbal.toString(), 'ether'));
            });

            it('Checking contracts ETH balance', async () => {
                ebal = await ethers.provider.getBalance(crowdsale.address);
                console.log(termcolors.liteblue, "       Crowdsale ETH Balance (after transfer): " + 
                            ethers.utils.formatUnits(ebal.toString(), 'ether'));
                expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount);
            });

            it('Checking for quantity of Tokens sold', async () => {
                expect(await crowdsale.tokensSold()).to.equal(amount);
            }); 

            it('Checking for Buy event', async () => {
                await expect(transaction).to.emit(crowdsale, 'Buy').withArgs(amount, user1.address);
            }); 
        });

        describe('Failure', () => {
            it('Checking rejection of insufficient ETH payment', async () => {
                let ebal = await ethers.provider.getBalance(crowdsale.address);
                console.log(termcolors.liteblue, "       Crowdsale ETH Balance: " + 
                            ethers.utils.formatUnits(ebal.toString(), 'ether'));
                await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0 })).to.be.revertedWith("Invalid ETH or Token amount.");
            });
        });
    });

    describe('Sending ETH', () => {
        let transaction, result;
        let amount = ether(10);

        describe('Success', () => {
            beforeEach(async () => {
                transaction = await user1.sendTransaction({ to: crowdsale.address, value: amount });
                result = await transaction.wait();
            });

            it('updates contracts ether balance', async () => {
                expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount);
            });

            it('updates user token balance', async () => {
                expect(await token.balanceOf(user1.address)).to.equal(amount);
            });
        });


    });


    describe('Updating Price', () => {
        let transaction, result;
        let price = ether(2);
        let currentPrice;

        describe('Success', () => {
            beforeEach(async () => {
                transaction = await crowdsale.connect(deployer).setPrice(ether(2));
                result = await transaction.wait();
            });

            it('updates the price', async () => {
                expect(await crowdsale.price()).to.equal(ether(2));
                currentPrice = await crowdsale.connect(user1).getPrice()
                console.log(termcolors.liteblue, "       Current token price is: " + 
                ethers.utils.formatUnits(currentPrice.toString(), 'ether'));
            });
        });

        describe('Failure', () => {
            it('prevents non-owner from updating price', async () => {
                await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted;
            });     
        });

    });



    describe('Finalizing Sale', () => {
        let transaction, result;
        let amount = tokens(10);
        let value = ether(10);
        let dbal;

        describe('Success', () => {
            beforeEach(async () => {
                transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value });
                result = await transaction.wait();
                transaction = await crowdsale.connect(deployer).finalize();
                result = await transaction.wait();
                dbal = await token.balanceOf(deployer.address);
            });

            it('transfers remaining tokens to owner', async () => {
                expect(await token.balanceOf(crowdsale.address)).to.equal(0);
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990));
                console.log(termcolors.liteblue , "       Deployer Token Contract Balance (after transfer): " + 
                ethers.utils.formatUnits(dbal.toString(), 'ether'));
            });

            it('transfers remaining ETH to owner', async () => {
                expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0);
            });

            it('emits Finalize event', async () => {
                await expect(transaction).to.emit(crowdsale, "Finalize").withArgs(amount, value);
            });
        });
        
        describe('Failure', () => {
            it('prevents non-owner from finalizing the crowdsale', async () => {
                await expect(crowdsale.connect(user1).finalize()).to.be.reverted;
            });            
        });

    });
});