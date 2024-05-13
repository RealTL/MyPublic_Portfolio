// import { ProgressBar } from "react-bootstrap";
import ProgressBar from 'react-bootstrap/ProgressBar';

const Progress = ({ maxTokens, tokensSold }) => {
    const amountSoldThusFar = (tokensSold / maxTokens) * 100;
    return(
        <div className='my-3'>
            <ProgressBar striped animated now={amountSoldThusFar} label={`${amountSoldThusFar}%`} />
            <p className='text-center my-3'>{tokensSold} / {maxTokens} Tokens Sold</p>
        </div>
    )
}
export default Progress;