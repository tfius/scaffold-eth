// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.0;

contract DecentralizedGovernance {
    struct Proposal {
        string description;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) voted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;

    event ProposalCreated(uint256 indexed proposalId, string description);
    event Vote(uint256 indexed proposalId, address indexed voter, bool vote);

    function createProposal(string memory description, uint256 duration) public {
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        proposal.description = description;
        proposal.deadline = block.timestamp + duration;
        emit ProposalCreated(proposalId, description);
    }

    function voteOnProposal(uint256 proposalId, bool vote) public {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.deadline, "Voting period is over");
        require(!proposal.voted[msg.sender], "Already voted");

        proposal.voted[msg.sender] = true;
        if (vote) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }
        emit Vote(proposalId, msg.sender, vote);
    }

    // Additional functions to execute proposal outcomes, etc.
}
