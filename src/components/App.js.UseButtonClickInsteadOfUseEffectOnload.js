import { useState } from 'react'
import { Container, Alert, Button } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

// ABIs: Import your contract ABIs here
import DAO_ABI from '../abis/DAO.json'

// Config: Import your network config here
import config from '../config.json';

function App() {
  const [account, setAccount] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadBlockchainData = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      // Initiate provider
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      // Instantiate contracts
      const dao = new ethers.Contract(config[31337].dao.address, DAO_ABI, provider);

      // Fetch accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const account = ethers.utils.getAddress(accounts[0])
      setAccount(account)
      setIsLoading(false)
    } catch (error) {
      console.error("Error connecting to wallet:", error)
      setErrorMessage("Please connect your wallet to proceed.")
      setIsLoading(false)
    }
  }

  return (
    <Container>
      <Navigation account={account} />
      <h1 className='my-4 text-center'>Welcome to our DAO!</h1>
      {!account && (
        <Alert variant="warning" className="text-center">
          Please connect your wallet to proceed.
        </Alert>
      )}
      {account ? (
        <>
          {/* Do something here */}
        </>
      ) : (
        <div className="text-center">
          <Button onClick={loadBlockchainData} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Connect Wallet'}
          </Button>
          {errorMessage && (
            <Alert variant="danger" className="mt-3">
              {errorMessage}
            </Alert>
          )}
        </div>
      )}
    </Container>
  )
}

export default App;