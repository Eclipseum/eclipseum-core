pragma solidity 0.6.6;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract DAI is ERC20 {
    constructor() public ERC20("DAI", "DAI") {
        _mint(msg.sender, 1000000 * (10**uint256(decimals())));
    }
}
