// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {FightScore} from "../src/FightScore.sol";

contract FightScoreScript is Script {
    FightScore public score;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        score = new FightScore();

        vm.stopBroadcast();
    }
}
