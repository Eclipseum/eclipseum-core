pragma solidity =0.5.17;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract DAI is ERC20, ERC20Detailed {
    constructor() public ERC20Detailed("DAI", "DAI", 18) {
        _mint(msg.sender, 1000000 * (10**18));
    }
}
