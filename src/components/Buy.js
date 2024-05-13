import { useState } from "react";
import { Form } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { Row } from "react-bootstrap";
import { Col } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import { ethers } from 'ethers';


const Buy = ({ provider, price, crowdsale, setIsLoading }) => {
    const [amount, setAmount] = useState('0');
    const [isWaiting, setIsWaiting] = useState(false);

    const buyHandler = async (e) => {
        e.preventDefault();
        setIsWaiting(true);

        try {

            const signer = await provider.getSigner();

            // We need to caculate the required ETH to buy the tokens...
            const value = ethers.utils.parseUnits((amount * price).toString(), 'ether');
            const formattedAmount = ethers.utils.parseUnits(amount.toString(), 'ether');

            const transaction = await crowdsale.connect(signer).buyTokens(formattedAmount, { value: value });
            await transaction.wait();

        } catch {
            window.alert('User rejected or transaction reverted.');
        }

        setIsLoading(true);
    }

    return(
        <Form onSubmit={buyHandler} style={{ maxWidth: '800px', margin: '50px auto' }}>
            <Form.Group as={Row}>
                <Col>
                    <Form.Control type="number" placeholder="Enter amount" onChange={(e) => setAmount(e.target.value)} />
                </Col>
                <Col className="text-center">
                    {isWaiting ? (<Spinner animation="border" />):
                    (
                        <Button variant="primary" type="submit" style={{ width: '100%' }}>Buy Tokens</Button>
                    )}
                </Col>
            </Form.Group>
        </Form>
    )
}

export default Buy;