// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.0;

contract Governance {
    struct ProposalData {
        uint256 postId;
        uint256 proposalId;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bytes32 description;
        bool    executed;
        bool    isOpen;
    }
    struct Proposal {
        ProposalData data;
        mapping(address => bool) voted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;
    mapping(uint => uint) public postIdToProposalId;

    event VoteCreated(uint256 indexed proposalId, bytes32 description);
    event Vote(uint256 indexed proposalId, address indexed voter, bool vote);

    function createVote(uint postId, bytes32 description, uint256 duration) public {
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        proposal.data.description = description;
        proposal.data.deadline = block.timestamp + duration;
        proposal.data.postId = postId;
        postIdToProposalId[postId] = proposalId;
        emit VoteCreated(proposalId, description);
    }

    function getProposals(uint start, uint length) public view returns (ProposalData[] memory) {
        require(start < nextProposalId, "Start out");
        if(start + length > nextProposalId) {
            length = nextProposalId - start;
        }
        ProposalData[] memory proposals_ = new ProposalData[](length);
        for (uint i = 0; i < length; i++) {
            Proposal storage proposal = proposals[start + i];
            proposals_[i] = proposal.data;
        }
        return proposals_;
    }

    function getProposalForPostId(uint256 postId) public view returns (uint256) {
        return postIdToProposalId[postId]; // will return 0 if not found
    }

    function isOpen(uint256 proposalId) public view returns (bool) {
        return block.timestamp < proposals[proposalId].data.deadline;
    }

    function voteOn(uint256 proposalId, bool vote) public {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.voted[msg.sender], "Already voted");
        require(block.timestamp < proposal.data.deadline, "Voting period is over");
        
        proposal.voted[msg.sender] = true;
        if (vote) {
            proposal.data.forVotes++;
        } else {
            proposal.data.againstVotes++;
        }
        emit Vote(proposalId, msg.sender, vote);
    }

    function execute(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.data.deadline, "Voting period is not over");
        require(!proposal.data.executed, "Already executed");
        require(proposal.data.forVotes > proposal.data.againstVotes, "Proposal was rejected");

        proposal.data.executed = true;
        // Execute proposal
    }

    function getOutcome(uint256 proposalId) public view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.data.forVotes > proposal.data.againstVotes;
    }
}
