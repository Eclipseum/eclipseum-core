pragma solidity =0.5.17;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../node_modules/openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "../node_modules/openzeppelin-solidity/contracts/utils/Address.sol";

/// @title The Eclipseum ERC20 Smart Contract
contract Eclipseum is ERC20, ERC20Detailed, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address payable;

    struct SoftSellEclAmountsToReceive {
        uint256 ethFromEclPool;
        uint256 ethFromDaiPool;
        uint256 daiFromDaiPool;
    }

    IERC20 public daiInterface;
    bool public launched;
    uint256 public ethBalanceOfEclPool;
    uint256 public ethVolumeOfEclPool;
    uint256 public ethVolumeOfDaiPool;

    event LogBuyEcl(address userAddress, uint256 ethSpent, uint256 eclReceived);
    event LogSellEcl(address userAddress, uint256 eclSold, uint256 ethReceived);
    event LogSoftSellEcl(
        address userAddress,
        uint256 eclSold,
        uint256 ethReceived,
        uint256 daiReceived
    );
    event LogBuyDai(address userAddress, uint256 ethSpent, uint256 daiReceived);
    event LogSellDai(address userAddress, uint256 daiSold, uint256 ethReceived);

    modifier requireLaunched() {
        require(launched, "Contract must be launched to invoke this function.");
        _;
    }

    /// @notice Must be called with at least 0.02 ETH.
    /// @notice Mints 100,000 ECL into the contract account
    constructor(address _daiAddress)
        public
        payable
        ERC20Detailed("Eclipseum", "ECL", 18)
    {
        require(
            msg.value >= 0.02 ether,
            "Must call constructor with at least 0.02 Ether."
        );
        _mint(address(this), 1e5 * (10**18));
        daiInterface = IERC20(_daiAddress);
    }

    /// @notice This function is called once after deployment to launch the contract.
    /// @notice Once launched, the transaction functions may be invoked.
    /// @notice Some amount of DAI must be transferred to the contract before launch.
    function launch() external {
        require(!launched, "Contract has already been launched.");

        require(
            daiInterface.balanceOf(address(this)) > 0,
            "DAI pool balance must be greater than zero to launch contract."
        );

        ethBalanceOfEclPool = 0.01 ether;

        launched = true;

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPool()) ==
                address(this).balance
        );
    }

    /// @notice Allows a user to buy ECL with ETH from the ECL liquidity pool.
    /// @param minEclToReceive The minimum amount of ECL the user is willing to receive.
    /// @param deadline Epoch time deadline that the transaction must complete before, otherwise reverts.
    function buyEcl(uint256 minEclToReceive, uint256 deadline)
        external
        payable
        nonReentrant
        requireLaunched
    {
        require(
            deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(msg.value > 0, "Value of ETH sent must be greater than zero.");

        uint256 ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPool().sub(msg.value);
        uint256 eclBalanceOfEclPoolLocal = eclBalanceOfEclPool();
        uint256 eclToReceive = applyTransactionFee(
            calcBOut(ethBalanceOfEclPool, eclBalanceOfEclPoolLocal, msg.value)
        );
        uint256 eclToMint = eclToReceive.mul(7).div(6).add(1);
        uint256 ethTransferToDaiPool = calcEthTransferForBuyEcl(
            ethBalanceOfEclPool,
            ethBalanceOfDaiPoolLocal,
            msg.value
        );

        require(
            eclToReceive >= minEclToReceive,
            "Unable to send the minimum quantity of ECL to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.add(msg.value).sub(
            ethTransferToDaiPool
        );
        ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPoolLocal.add(
            ethTransferToDaiPool
        );
        eclBalanceOfEclPoolLocal = eclBalanceOfEclPoolLocal
            .sub(eclToReceive)
            .add(eclToMint);
        ethVolumeOfEclPool += msg.value;

        emit LogBuyEcl(msg.sender, msg.value, eclToReceive);

        _transfer(address(this), msg.sender, eclToReceive);
        _mint(address(this), eclToMint);

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPoolLocal) ==
                address(this).balance
        );
        assert(eclBalanceOfEclPoolLocal == eclBalanceOfEclPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to sell ECL for ETH to the ECL liquidity pool.
    /// @param eclSold The amount of ECL the user is selling.
    /// @param minEthToReceive The minimum amount of ETH the user is willing to receive.
    /// @param deadline Epoch time deadline that the transaction must complete before.
    function sellEcl(
        uint256 eclSold,
        uint256 minEthToReceive,
        uint256 deadline
    ) external nonReentrant requireLaunched {
        require(
            deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(eclSold > 0, "Value of ECL sold must be greater than zero.");
        require(
            eclSold <= balanceOf(address(msg.sender)),
            "ECL sold must be less than or equal to ECL balance."
        );

        uint256 ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPool();
        uint256 eclBalanceOfEclPoolLocal = eclBalanceOfEclPool();
        uint256 eclToBurn = eclSold.mul(7).div(6);
        uint256 ethToReceive = applyTransactionFee(
            calcBOut(eclBalanceOfEclPoolLocal, ethBalanceOfEclPool, eclSold)
        );

        require(
            ethToReceive >= minEthToReceive,
            "Unable to send the minimum quantity of ETH to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.sub(ethToReceive);
        eclBalanceOfEclPoolLocal = eclBalanceOfEclPoolLocal.add(eclSold).sub(
            eclToBurn
        );
        ethVolumeOfEclPool += ethToReceive;

        emit LogSellEcl(msg.sender, eclSold, ethToReceive);

        _transfer(address(msg.sender), address(this), eclSold);
        _burn(address(this), eclToBurn);
        msg.sender.sendValue(ethToReceive);

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPoolLocal) ==
                address(this).balance
        );
        assert(eclBalanceOfEclPoolLocal == eclBalanceOfEclPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to sell ECL for ETH and DAI to the ECL liquidity pool.
    /// @param eclSold The amount of ECL the user is selling.
    /// @param minEthToReceive The minimum amount of ETH the user is willing to receive.
    /// @param minDaiToReceive The minimum amount of DAI the user is willing to receive.
    /// @param deadline Epoch time deadline that the transaction must complete before.
    function softSellEcl(
        uint256 eclSold,
        uint256 minEthToReceive,
        uint256 minDaiToReceive,
        uint256 deadline
    ) external nonReentrant requireLaunched {
        require(
            deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(eclSold > 0, "Value of ECL sold must be greater than zero.");
        require(
            eclSold <= balanceOf(address(msg.sender)),
            "ECL sold must be less than or equal to ECL balance."
        );

        uint256 ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPool();
        uint256 circulatingSupplyLocal = circulatingSupply();
        uint256 eclBalanceOfEclPoolLocal = eclBalanceOfEclPool();
        uint256 daiBalanceOfDaiPoolLocal = daiBalanceOfDaiPool();
        uint256 eclToBurn = applyTransactionFee(
            eclSold.mul(eclBalanceOfEclPoolLocal).div(circulatingSupplyLocal)
        )
            .add(eclSold);
        SoftSellEclAmountsToReceive memory amountsToReceive;
        amountsToReceive.ethFromEclPool = applyTransactionFee(
            eclSold.mul(ethBalanceOfEclPool).div(circulatingSupplyLocal)
        );
        amountsToReceive.ethFromDaiPool = applyTransactionFee(
            eclSold.mul(ethBalanceOfDaiPoolLocal).div(circulatingSupplyLocal)
        );
        amountsToReceive.daiFromDaiPool = applyTransactionFee(
            eclSold.mul(daiBalanceOfDaiPoolLocal).div(circulatingSupplyLocal)
        );

        require(
            amountsToReceive.ethFromEclPool.add(
                amountsToReceive.ethFromDaiPool
            ) >= minEthToReceive,
            "Unable to send the minimum quantity of ETH to receive."
        );
        require(
            amountsToReceive.daiFromDaiPool >= minDaiToReceive,
            "Unable to send the minimum quantity of DAI to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.sub(
            amountsToReceive.ethFromEclPool
        );
        ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPoolLocal.sub(
            amountsToReceive.ethFromDaiPool
        );
        daiBalanceOfDaiPoolLocal = daiBalanceOfDaiPoolLocal.sub(
            amountsToReceive.daiFromDaiPool
        );
        eclBalanceOfEclPoolLocal = eclBalanceOfEclPoolLocal.add(eclSold).sub(
            eclToBurn
        );
        ethVolumeOfEclPool += amountsToReceive.ethFromEclPool;
        ethVolumeOfDaiPool += amountsToReceive.ethFromDaiPool;

        emit LogSoftSellEcl(
            msg.sender,
            eclSold,
            amountsToReceive.ethFromEclPool.add(
                amountsToReceive.ethFromDaiPool
            ),
            amountsToReceive.daiFromDaiPool
        );

        _transfer(address(msg.sender), address(this), eclSold);
        _burn(address(this), eclToBurn);
        assert(
            daiInterface.transfer(msg.sender, amountsToReceive.daiFromDaiPool)
        );
        msg.sender.sendValue(
            amountsToReceive.ethFromEclPool.add(amountsToReceive.ethFromDaiPool)
        );

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPoolLocal) ==
                address(this).balance
        );
        assert(eclBalanceOfEclPoolLocal == eclBalanceOfEclPool());
        assert(daiBalanceOfDaiPoolLocal == daiBalanceOfDaiPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to buy DAI with ETH from the DAI liquidity pool.
    /// @param minDaiToReceive The minimum amount of DAI the user is willing to receive.
    /// @param deadline Epoch time deadline that the transaction must complete before.
    function buyDai(uint256 minDaiToReceive, uint256 deadline)
        external
        payable
        nonReentrant
        requireLaunched
    {
        require(
            deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(msg.value > 0, "Value of ETH sent must be greater than zero.");

        uint256 ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPool().sub(msg.value);
        uint256 daiBalanceOfDaiPoolLocal = daiBalanceOfDaiPool();
        uint256 daiToReceive = applyTransactionFee(
            calcBOut(
                ethBalanceOfDaiPoolLocal,
                daiBalanceOfDaiPoolLocal,
                msg.value
            )
        );
        uint256 ethTransferToEclPool = msg.value.mul(15).div(10000);

        require(
            daiToReceive >= minDaiToReceive,
            "Unable to send the minimum quantity of DAI to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.add(ethTransferToEclPool);
        ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPoolLocal.add(msg.value).sub(
            ethTransferToEclPool
        );
        daiBalanceOfDaiPoolLocal = daiBalanceOfDaiPoolLocal.sub(daiToReceive);
        ethVolumeOfDaiPool += msg.value;

        emit LogBuyDai(msg.sender, msg.value, daiToReceive);

        assert(daiInterface.transfer(address(msg.sender), daiToReceive));

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPoolLocal) ==
                address(this).balance
        );
        assert(daiBalanceOfDaiPoolLocal == daiBalanceOfDaiPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to sell DAI for ETH to the DAI liquidity pool.
    /// @param daiSold The amount of DAI the user is selling.
    /// @param minEthToReceive The minimum amount of ETH the user is willing to receive.
    /// @param deadline Epoch time deadline that the transaction must complete before.
    function sellDai(
        uint256 daiSold,
        uint256 minEthToReceive,
        uint256 deadline
    ) external nonReentrant requireLaunched {
        require(
            deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(daiSold > 0, "Value of DAI sold must be greater than zero.");
        require(
            daiSold <= daiInterface.balanceOf(address(msg.sender)),
            "DAI sold must be less than or equal to DAI balance."
        );
        require(
            daiSold <=
                daiInterface.allowance(address(msg.sender), address(this)),
            "DAI sold exceeds allowance."
        );

        uint256 ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPool();
        uint256 daiBalanceOfDaiPoolLocal = daiBalanceOfDaiPool();
        uint256 ethToReceiveBeforeFee = calcBOut(
            daiBalanceOfDaiPoolLocal,
            ethBalanceOfDaiPoolLocal,
            daiSold
        );
        uint256 ethToReceive = applyTransactionFee(ethToReceiveBeforeFee);
        uint256 ethTransferToEclPool = ethToReceiveBeforeFee
            .sub(ethToReceive)
            .div(2);

        require(
            ethToReceive >= minEthToReceive,
            "Unable to send the minimum quantity of ETH to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.add(ethTransferToEclPool);
        ethBalanceOfDaiPoolLocal = ethBalanceOfDaiPoolLocal
            .sub(ethToReceive)
            .sub(ethTransferToEclPool);
        daiBalanceOfDaiPoolLocal = daiBalanceOfDaiPoolLocal.add(daiSold);
        ethVolumeOfDaiPool += ethToReceive;

        emit LogSellDai(msg.sender, daiSold, ethToReceive);

        assert(
            daiInterface.transferFrom(
                address(msg.sender),
                address(this),
                daiSold
            )
        );
        msg.sender.sendValue(ethToReceive);

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPoolLocal) ==
                address(this).balance
        );
        assert(daiBalanceOfDaiPoolLocal == daiBalanceOfDaiPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Calculates amount of asset B for user to receive using constant product market maker algorithm.
    /// @dev A value of one is subtracted in the _bToReceive calculation to prevent rounding
    /// @dev errors from removing more of the asset from the liquidity pool than intended.
    /// @param aBalance The balance of asset A in the liquidity pool.
    /// @param bBalance The balance of asset B in the liquidity pool.
    /// @param aSent The quantity of asset A sent by the user to the liquidity pool.
    /// @return bToReceive The quantity of asset B the user would receive before transaction fee is applied.
    function calcBOut(
        uint256 aBalance,
        uint256 bBalance,
        uint256 aSent
    ) public pure returns (uint256) {
        uint256 denominator = aBalance.add(aSent);
        uint256 fraction = aBalance.mul(bBalance).div(denominator);
        uint256 bToReceive = bBalance.sub(fraction).sub(1);

        assert(bToReceive < bBalance);

        return bToReceive;
    }

    /// @notice Calculates the amount of ETH to transfer from the ECL pool to the DAI pool for the buyEcl function.
    /// @param ethBalanceOfEclPoolLocal The balance of ETH in the ECL liquidity pool.
    /// @param ethBalanceOfDaiPoolLocal The balance of ETH in the DAI liquidity pool.
    /// @param ethSent The quantity of ETH sent by the user in the buyEcl function.
    /// @return ethTransferToDaiPool The quantity of ETH to transfer from the ECL pool to the DAI pool.
    function calcEthTransferForBuyEcl(
        uint256 ethBalanceOfEclPoolLocal,
        uint256 ethBalanceOfDaiPoolLocal,
        uint256 ethSent
    ) public pure returns (uint256) {
        uint256 ethTransferToDaiPool;

        if (
            ethBalanceOfEclPoolLocal >=
            ethSent.div(2).add(ethBalanceOfDaiPoolLocal)
        ) {
            ethTransferToDaiPool = ethSent.mul(3).div(4);
        } else if (
            ethBalanceOfEclPoolLocal.add(ethSent) <= ethBalanceOfDaiPoolLocal
        ) {
            ethTransferToDaiPool = 0;
        } else {
            ethTransferToDaiPool = ethBalanceOfEclPoolLocal
                .add(ethSent)
                .sub(ethBalanceOfDaiPoolLocal)
                .div(2);
        }

        assert(ethTransferToDaiPool <= ethSent.mul(3).div(4));

        return ethTransferToDaiPool;
    }

    /// @notice Calculates the amount for the user to receive with a 0.3% transaction fee applied.
    /// @param amountBeforeFee The amount the user will receive before transaction fee is applied.
    /// @return amountAfterFee The amount the user will receive with transaction fee applied.
    function applyTransactionFee(uint256 amountBeforeFee)
        public
        pure
        returns (uint256)
    {
        uint256 amountAfterFee = amountBeforeFee.mul(997).div(1000);
        return amountAfterFee;
    }

    /// @notice Returns the ECL balance of the ECL pool.
    function eclBalanceOfEclPool()
        public
        view
        requireLaunched
        returns (uint256)
    {
        return balanceOf(address(this));
    }

    /// @notice Returns the ETH balance of the DAI pool.
    function ethBalanceOfDaiPool()
        public
        view
        requireLaunched
        returns (uint256)
    {
        return address(this).balance.sub(ethBalanceOfEclPool);
    }

    /// @notice Returns the DAI balance of the DAI pool.
    function daiBalanceOfDaiPool()
        public
        view
        requireLaunched
        returns (uint256)
    {
        return daiInterface.balanceOf(address(this));
    }

    /// @notice Returns the circulating supply of ECL.
    function circulatingSupply() public view requireLaunched returns (uint256) {
        return totalSupply().sub(eclBalanceOfEclPool());
    }
}
