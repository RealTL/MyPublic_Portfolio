const Info = ({ account, acctBalance }) => {
    return(
        <div className="my-3">
            <p><strong>Account:</strong>  {account} </p>
            <p><strong>Tokens Owned:</strong>  {acctBalance} </p>
        </div>
    )
}

export default Info;