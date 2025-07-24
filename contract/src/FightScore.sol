// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract FightScore {
    mapping(address => uint256) public score;
    mapping(uint256 => bool) public claimed;


    function claim(uint256 roomid) public {
        require(claimed[roomid] == false, "Reward already claimed");
        require(roomid + 7200 >= block.number, "roomid expired");
        claimed[roomid] = true;
        score[msg.sender] += 1;
    }
}
