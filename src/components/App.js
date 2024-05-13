import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { ethers } from 'ethers';

// Custom Components:
import Navigation from './Navigation';
import Buy from './Buy';
import Info from './Info';
import Loading from './Loading';
import Progress from './Progress';

// ABIs
import TOKEN_ABI from '../abis/Token.json';
import CROWDSALE_ABI from '../abis/Crowdsale.json';

// Configs
import config from '../config.json';

function App() {
    const [provider, setProvider] = useState(null);
    const [crowdsale, setCrowdsale] = useState(null);

    const [account, setAccount] = useState(null);
    const [acctBalance, setAccountBalance] = useState(0);

    const [price, setPrice] = useState(0);
    const [maxTokens, setMaxTokens] = useState(0);
    const [tokensSold, setTokensSold] = useState(0);

    const [isLoading, setIsLoading] = useState(true);



    const loadBlockchainData = async () => {
        // Initiate provider (used to connect to blockchain / smart contracts)
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // Fetch Chain ID
        const { chainId } = await provider.getNetwork();

        // Initiate contracts
        const token = new ethers.Contract(config[chainId].token.address, TOKEN_ABI, provider);
        const crowdsale = new ethers.Contract(config[chainId].crowdsale.address, CROWDSALE_ABI, provider);
        setCrowdsale(crowdsale);

        // Fetch accounts
        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        const account = ethers.utils.getAddress(accounts[0]);
        setAccount(account);

        // Fetch account balance
        const acctBalance = ethers.utils.formatUnits(await token.balanceOf(account), 18);
        setAccountBalance(acctBalance);

        // Fetch price
        const price = ethers.utils.formatUnits(await crowdsale.price(), 18);
        setPrice(price);

        // Fetch max tokens
        const maxTokens = ethers.utils.formatUnits(await crowdsale.maxTokens(), 18);
        setMaxTokens(maxTokens);

        // Fetch tokens sold
        const tokensSold = ethers.utils.formatUnits(await crowdsale.tokensSold(), 18);
        setTokensSold(tokensSold);

        setIsLoading(false);
    }
    useEffect(() => {
        if(isLoading) {
            loadBlockchainData();
        }
    }, [isLoading]);

    return(
        <Container>
            <Navigation />
            <h1 className='my-4 text-center'>Introduction DApp Token!</h1>

            { isLoading ? // if isLoading is true show Loading... otherwise show Price
                (<Loading />) : 
                (
                    <>
                        <p className='text-center'><strong>Current Price:</strong> {price} ETH</p>
                        <Buy provider={provider} price={price} crowdsale={crowdsale} setIsLoading={setIsLoading} />
                        <Progress maxTokens={maxTokens} tokensSold={tokensSold} />
                    </>
                    
                )
            }
            
            <hr />
            {account && ( // if account has a value the render it on the webpage
                <Info account={account} acctBalance={acctBalance} />
                
            )}
        </Container>
    )
}

export default App;