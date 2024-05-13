//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
    string public name = "Crowdsale";
    Token public token;
    uint256 public price;
    uint256 public tokensSold;
    uint256 public maxTokens;
    address public owner;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 tokensSold, uint256 ethRaised);

    constructor(Token _token, uint256 _price, uint256 _maxTokens){
        owner = msg.sender;
        token = _token;
        price = _price;
        maxTokens = _maxTokens;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner.");
        _;
    }

    function buyTokens(uint256 _amount) public payable {
        require(msg.value == (_amount / 1e18 * price), "Invalid ETH or Token amount.");
        require(token.balanceOf(address(this)) >= _amount, "Cannot purchase more than is available!");
        require(token.transfer(msg.sender, _amount));
        tokensSold = tokensSold + _amount;
        emit Buy(_amount, msg.sender);
    }

    receive() external payable {
        // allows users to send ETH to this contract and sends the user
        // the purchased tokens.
        uint256 amount = msg.value / price;
        buyTokens(amount * 1e18);
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    function getPrice() public view returns (uint256) {
        return price;
    }

    function finalize() public onlyOwner {
        // Send remaining tokens back to crowdsale owner
        require(token.transfer(owner, token.balanceOf(address(this))));
        // Send ETH to crowdsale owner
        uint256 value = address(this).balance;
        (bool sent, ) = owner.call{ value: value }("");
        require(sent);
        emit Finalize(tokensSold, value);
    }
}