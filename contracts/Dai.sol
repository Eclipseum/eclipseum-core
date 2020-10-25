/// This contract provides generic ERC-20 functionality for testing purposes,
/// and is not the actual DAI contract code.

pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract DAI is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("DAI", "DAI", 18) {
        _mint(msg.sender, 1000000 * (10**18));
    }
}
