import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json';

// Config: Import your network config here
import config from '../config.json';

function App() {
  const [account, setAccount] = useState(null)
  // const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Instantiate contracts
    const dao = new ethers.Contract(config[31337].dao.address, DAO_ABI, provider);

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)
    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Welcome to our DAO!</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
    
          {/* Do something here */}

        </>
      )}
    </Container>
  )
}

export default App;
