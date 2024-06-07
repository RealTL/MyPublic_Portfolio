// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract DAO2 {
    address owner;
    Token public token;
    uint256 public quorum;
    uint256 public proposalCount; 

    struct Proposal {
        uint256 id;
        string name; 
        uint256 amount; 
        address payable recipient;
        uint256 votes;
        bool finalized;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) votes;

    event Propose(uint256 id, uint256 amount, address recipient, address creator);
    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    modifier onlyInvestor() {
        require(token.balanceOf(msg.sender) > 0, "Must be a token holder.");
        _;
    }

    function createProposal(string memory _name, 
    			    uint256 _amount, 
    			    address payable _recipient
			    ) external onlyInvestor {
        require(token.balanceOf(address(this)) >= _amount, "Not enough tokens in DAO"); 

        proposalCount++;
        proposals[proposalCount] = Proposal(proposalCount, 
					    _name, 
					    _amount, 
					    _recipient, 
					    0, 
					    false);

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    // Vote on a proposal
    function vote(uint256 _id) external onlyInvestor {
        require(votes[msg.sender][_id] == false, "Voter has already voted");
        // Get the proposal from mapping by id
        Proposal storage proposal = proposals[_id];
        // Update votes
        proposal.votes += token.balanceOf(msg.sender);
        votes[msg.sender][_id] = true;

        emit Vote(_id, msg.sender);
    }

    // Finalize a proposal & transfer funds
    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Get the Proposal from mapping by id
        Proposal storage proposal = proposals[_id];
        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "Proposal already finalized");
        // Check that the proposal has enough votes
        require(proposal.votes >= quorum, "Must reach quorum to finalize proposal");
        // Check that the contract has enough of the ERC20 tokens
        require(token.balanceOf(address(this)) >= proposal.amount, "Not enough tokens in DAO");
        
        // Mark the proposal as finalized
        proposal.finalized = true;

        // Transfer the funds
        require(token.transfer(proposal.recipient, proposal.amount), "Token transfer failed");

        emit Finalize(_id);
    }
}