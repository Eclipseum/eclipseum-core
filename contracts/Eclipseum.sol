pragma solidity 0.6.6;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

/// @title The Eclipseum ERC20 Smart Contract
contract Eclipseum is ERC20, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address payable;

    struct SoftSellEclAmountsToReceive {
        uint256 ethFromEclPool;
        uint256 ethFromDaiPool;
        uint256 daiFromDaiPool;
    }

    IERC20 public immutable daiInterface;
    bool public launched;
    uint256 public ethBalanceOfEclPool;
    uint256 public ethVolumeOfEclPool;
    uint256 public ethVolumeOfDaiPool;

    event LogBuyEcl(address userAddress, uint256 eclReceived);
    event LogSellEcl(address userAddress, uint256 ethReceived);
    event LogSoftSellEcl(
        address userAddress,
        uint256 ethReceived,
        uint256 daiReceived
    );
    event LogBuyDai(address userAddress, uint256 daiReceived);
    event LogSellDai(address userAddress, uint256 ethReceived);

    event Informational(string message, uint256 value);

    modifier requireLaunched() {
        require(launched, "Contract must be launched to invoke this function.");
        _;
    }

    /// @notice The constructor must be called with at least 0.2 ETH.
    constructor(address _daiAddress) public payable ERC20("Eclipseum", "ECL") {
        require(
            msg.value >= 0.2 ether,
            "Must call constructor with at least 0.2 Ether."
        );
        _mint(address(this), 100000 * (10**uint256(decimals())));
        daiInterface = IERC20(_daiAddress);
    }

    /// @notice This function is called once to launch the contract.
    function launch() external {
        require(!launched, "Contract has already been launched.");

        require(
            daiInterface.balanceOf(address(this)) > 0,
            "DAI pool balance must be greater than zero to launch contract."
        );

        ethBalanceOfEclPool = 0.1 ether;

        launched = true;

        assert(
            ethBalanceOfEclPool.add(ethBalanceOfDaiPool()) ==
                address(this).balance
        );
    }

    /// @notice Allows a user to buy ECL with ETH from the ECL liquidity pool.
    /// @param _minEclToReceive The minimum amount of ECL the user is willing to receive.
    /// @param _deadline Epoch time deadline that the transaction must complete before.
    function buyEcl(uint256 _minEclToReceive, uint256 _deadline)
        external
        payable
        nonReentrant
        requireLaunched
    {
        require(
            _deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(msg.value > 0, "Value of ETH sent must be greater than zero.");

        uint256 _ethBalanceOfDaiPool = ethBalanceOfDaiPool().sub(msg.value);
        uint256 _eclBalanceOfEclPool = eclBalanceOfEclPool();
        uint256 _eclToReceive = applyTransactionFee(
            calcBOut(ethBalanceOfEclPool, _eclBalanceOfEclPool, msg.value)
        );
        uint256 _eclToMint = _eclToReceive.mul(7).div(6).add(1);
        uint256 _ethTransferToDaiPool = calcEthTransferForBuyEcl(
            ethBalanceOfEclPool,
            _ethBalanceOfDaiPool,
            msg.value
        );

        require(
            _eclToReceive >= _minEclToReceive,
            "Unable to send the minimum quantity of ECL to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.add(msg.value).sub(
            _ethTransferToDaiPool
        );
        _ethBalanceOfDaiPool = _ethBalanceOfDaiPool.add(_ethTransferToDaiPool);
        _eclBalanceOfEclPool = _eclBalanceOfEclPool.sub(_eclToReceive).add(
            _eclToMint
        );
        ethVolumeOfEclPool += msg.value;

        emit LogBuyEcl(msg.sender, _eclToReceive);

        _transfer(address(this), msg.sender, _eclToReceive);
        _mint(address(this), _eclToMint);

        assert(
            ethBalanceOfEclPool.add(_ethBalanceOfDaiPool) ==
                address(this).balance
        );
        assert(_eclBalanceOfEclPool == eclBalanceOfEclPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to sell ECL for ETH to the ECL liquidity pool.
    /// @param _eclSold The amount of ECL the user is selling.
    /// @param _minEthToReceive The minimum amount of ETH the user is willing to receive.
    /// @param _deadline Epoch time deadline that the transaction must complete before.
    function sellEcl(
        uint256 _eclSold,
        uint256 _minEthToReceive,
        uint256 _deadline
    ) external nonReentrant requireLaunched {
        require(
            _deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(_eclSold > 0, "Value of ECL sold must be greater than zero.");
        require(
            _eclSold <= balanceOf(address(msg.sender)),
            "ECL sold must be less than or equal to ECL balance."
        );

        uint256 _ethBalanceOfDaiPool = ethBalanceOfDaiPool();
        uint256 _eclBalanceOfEclPool = eclBalanceOfEclPool();
        uint256 _eclToBurn = _eclSold.mul(7).div(6);
        uint256 _ethToReceive = applyTransactionFee(
            calcBOut(_eclBalanceOfEclPool, ethBalanceOfEclPool, _eclSold)
        );

        require(
            _ethToReceive >= _minEthToReceive,
            "Unable to send the minimum quantity of ETH to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.sub(_ethToReceive);
        _eclBalanceOfEclPool = _eclBalanceOfEclPool.add(_eclSold).sub(
            _eclToBurn
        );
        ethVolumeOfEclPool += _ethToReceive;

        emit LogSellEcl(msg.sender, _ethToReceive);

        _transfer(address(msg.sender), address(this), _eclSold);
        _burn(address(this), _eclToBurn);
        msg.sender.sendValue(_ethToReceive);

        assert(
            ethBalanceOfEclPool.add(_ethBalanceOfDaiPool) ==
                address(this).balance
        );
        assert(_eclBalanceOfEclPool == eclBalanceOfEclPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to sell ECL for ETH and DAI to the ECL liquidity pool.
    /// @param _eclSold The amount of ECL the user is selling.
    /// @param _minEthToReceive The minimum amount of ETH the user is willing to receive.
    /// @param _minDaiToReceive The minimum amount of DAI the user is willing to receive.
    /// @param _deadline Epoch time deadline that the transaction must complete before.
    function softSellEcl(
        uint256 _eclSold,
        uint256 _minEthToReceive,
        uint256 _minDaiToReceive,
        uint256 _deadline
    ) external nonReentrant requireLaunched {
        require(
            _deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(_eclSold > 0, "Value of ECL sold must be greater than zero.");
        require(
            _eclSold <= balanceOf(address(msg.sender)),
            "ECL sold must be less than or equal to ECL balance."
        );

        uint256 _ethBalanceOfDaiPool = ethBalanceOfDaiPool();
        uint256 _circulatingSupply = circulatingSupply();
        uint256 _eclBalanceOfEclPool = eclBalanceOfEclPool();
        uint256 _daiBalanceOfDaiPool = daiBalanceOfDaiPool();
        uint256 _eclToBurn = applyTransactionFee(
            _eclSold.mul(_eclBalanceOfEclPool).div(_circulatingSupply)
        )
            .add(_eclSold);
        SoftSellEclAmountsToReceive memory _amountsToReceive;
        _amountsToReceive.ethFromEclPool = applyTransactionFee(
            _eclSold.mul(ethBalanceOfEclPool).div(_circulatingSupply)
        );
        _amountsToReceive.ethFromDaiPool = applyTransactionFee(
            _eclSold.mul(_ethBalanceOfDaiPool).div(_circulatingSupply)
        );
        _amountsToReceive.daiFromDaiPool = applyTransactionFee(
            _eclSold.mul(_daiBalanceOfDaiPool).div(_circulatingSupply)
        );

        require(
            _amountsToReceive.ethFromEclPool.add(
                _amountsToReceive.ethFromDaiPool
            ) >= _minEthToReceive,
            "Unable to send the minimum quantity of ETH to receive."
        );
        require(
            _amountsToReceive.daiFromDaiPool >= _minDaiToReceive,
            "Unable to send the minimum quantity of DAI to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.sub(
            _amountsToReceive.ethFromEclPool
        );
        _ethBalanceOfDaiPool = _ethBalanceOfDaiPool.sub(
            _amountsToReceive.ethFromDaiPool
        );
        _daiBalanceOfDaiPool = _daiBalanceOfDaiPool.sub(
            _amountsToReceive.daiFromDaiPool
        );
        _eclBalanceOfEclPool = _eclBalanceOfEclPool.add(_eclSold).sub(
            _eclToBurn
        );
        ethVolumeOfEclPool += _amountsToReceive.ethFromEclPool;
        ethVolumeOfDaiPool += _amountsToReceive.ethFromDaiPool;

        emit LogSoftSellEcl(
            msg.sender,
            _amountsToReceive.ethFromEclPool.add(
                _amountsToReceive.ethFromDaiPool
            ),
            _amountsToReceive.daiFromDaiPool
        );

        _transfer(address(msg.sender), address(this), _eclSold);
        _burn(address(this), _eclToBurn);
        assert(
            daiInterface.transfer(msg.sender, _amountsToReceive.daiFromDaiPool)
        );
        msg.sender.sendValue(
            _amountsToReceive.ethFromEclPool.add(
                _amountsToReceive.ethFromDaiPool
            )
        );

        assert(
            ethBalanceOfEclPool.add(_ethBalanceOfDaiPool) ==
                address(this).balance
        );
        assert(_eclBalanceOfEclPool == eclBalanceOfEclPool());
        assert(_daiBalanceOfDaiPool == daiBalanceOfDaiPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to buy DAI with ETH from the DAI liquidity pool.
    /// @param _minDaiToReceive The minimum amount of DAI the user is willing to receive.
    /// @param _deadline Epoch time deadline that the transaction must complete before.
    function buyDai(uint256 _minDaiToReceive, uint256 _deadline)
        external
        payable
        nonReentrant
        requireLaunched
    {
        require(
            _deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(msg.value > 0, "Value of ETH sent must be greater than zero.");

        uint256 _ethBalanceOfDaiPool = ethBalanceOfDaiPool().sub(msg.value);
        uint256 _daiBalanceOfDaiPool = daiBalanceOfDaiPool();
        uint256 _daiToReceive = applyTransactionFee(
            calcBOut(_ethBalanceOfDaiPool, _daiBalanceOfDaiPool, msg.value)
        );
        uint256 _ethTransferToEclPool = msg.value.mul(15).div(10000);

        require(
            _daiToReceive >= _minDaiToReceive,
            "Unable to send the minimum quantity of DAI to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.add(_ethTransferToEclPool);
        _ethBalanceOfDaiPool = _ethBalanceOfDaiPool.add(msg.value).sub(
            _ethTransferToEclPool
        );
        _daiBalanceOfDaiPool = _daiBalanceOfDaiPool.sub(_daiToReceive);
        ethVolumeOfDaiPool += msg.value;

        emit LogBuyDai(msg.sender, _daiToReceive);

        assert(daiInterface.transfer(address(msg.sender), _daiToReceive));

        assert(
            ethBalanceOfEclPool.add(_ethBalanceOfDaiPool) ==
                address(this).balance
        );
        assert(_daiBalanceOfDaiPool == daiBalanceOfDaiPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Allows a user to sell DAI for ETH to the DAI liquidity pool.
    /// @param _daiSold The amount of DAI the user is selling.
    /// @param _minEthToReceive The minimum amount of ETH the user is willing to receive.
    /// @param _deadline Epoch time deadline that the transaction must complete before.
    function sellDai(
        uint256 _daiSold,
        uint256 _minEthToReceive,
        uint256 _deadline
    ) external nonReentrant requireLaunched {
        require(
            _deadline >= block.timestamp,
            "Transaction deadline has elapsed."
        );
        require(_daiSold > 0, "Value of DAI sold must be greater than zero.");
        require(
            _daiSold <= daiInterface.balanceOf(address(msg.sender)),
            "DAI sold must be less than or equal to DAI balance."
        );
        require(
            _daiSold <=
                daiInterface.allowance(address(msg.sender), address(this)),
            "DAI sold exceeds allowance."
        );

        uint256 _ethBalanceOfDaiPool = ethBalanceOfDaiPool();
        uint256 _daiBalanceOfDaiPool = daiBalanceOfDaiPool();
        uint256 _ethToReceiveBeforeFee = calcBOut(
            _daiBalanceOfDaiPool,
            _ethBalanceOfDaiPool,
            _daiSold
        );
        uint256 _ethToReceive = applyTransactionFee(_ethToReceiveBeforeFee);
        uint256 _ethTransferToEclPool = _ethToReceiveBeforeFee
            .sub(_ethToReceive)
            .div(2);

        require(
            _ethToReceive >= _minEthToReceive,
            "Unable to send the minimum quantity of ETH to receive."
        );

        ethBalanceOfEclPool = ethBalanceOfEclPool.add(_ethTransferToEclPool);
        _ethBalanceOfDaiPool = _ethBalanceOfDaiPool.sub(_ethToReceive).sub(
            _ethTransferToEclPool
        );
        _daiBalanceOfDaiPool = _daiBalanceOfDaiPool.add(_daiSold);
        ethVolumeOfDaiPool += _ethToReceive;

        emit LogSellDai(msg.sender, _ethToReceive);

        assert(
            daiInterface.transferFrom(
                address(msg.sender),
                address(this),
                _daiSold
            )
        );
        msg.sender.sendValue(_ethToReceive);

        assert(
            ethBalanceOfEclPool.add(_ethBalanceOfDaiPool) ==
                address(this).balance
        );
        assert(_daiBalanceOfDaiPool == daiBalanceOfDaiPool());
        assert(ethBalanceOfEclPool > 0);
        assert(ethBalanceOfDaiPool() > 0);
        assert(eclBalanceOfEclPool() > 0);
        assert(daiBalanceOfDaiPool() > 0);
    }

    /// @notice Calculates amount of asset B for user to receive using constant product market maker algorithm.
    /// @dev A value of one is subtracted in the _bToReceive calculation to prevent rounding
    /// @dev errors from removing more of the asset from the liquidity pool than intended.
    /// @param _aBalance The balance of asset A in the liquidity pool.
    /// @param _bBalance The balance of asset B in the liquidity pool.
    /// @param _aSent The quantity of asset A sent to the liquidity pool.
    /// @return _bToReceive The quantity of asset B the user would receive before transaction fee is applied.
    function calcBOut(
        uint256 _aBalance,
        uint256 _bBalance,
        uint256 _aSent
    ) public pure returns (uint256) {
        uint256 _denominator = _aBalance.add(_aSent);
        uint256 _fraction = _aBalance.mul(_bBalance).div(_denominator);
        uint256 _bToReceive = _bBalance.sub(_fraction).sub(1);

        assert(_bToReceive < _bBalance);

        return _bToReceive;
    }

    /// @notice Calculates the amount of ETH to transfer from the ECL pool to the DAI pool for the buyEcl function.
    /// @param _ethBalanceOfEclPool The balance of ETH in the ECL liquidity pool.
    /// @param _ethBalanceOfDaiPool The balance of ETH in the DAI liquidity pool.
    /// @param _ethSent The quantity of ETH sent by the user in the buyEcl function.
    /// @return _ethTransferToDaiPool The quantity of ETH to transfer from the ECL pool to the DAI pool.
    function calcEthTransferForBuyEcl(
        uint256 _ethBalanceOfEclPool,
        uint256 _ethBalanceOfDaiPool,
        uint256 _ethSent
    ) public pure returns (uint256) {
        uint256 _ethTransferToDaiPool;

        if (_ethBalanceOfEclPool >= _ethSent.div(2).add(_ethBalanceOfDaiPool)) {
            _ethTransferToDaiPool = _ethSent.mul(3).div(4);
        } else if (_ethBalanceOfEclPool.add(_ethSent) <= _ethBalanceOfDaiPool) {
            _ethTransferToDaiPool = 0;
        } else {
            _ethTransferToDaiPool = _ethBalanceOfEclPool
                .add(_ethSent)
                .sub(_ethBalanceOfDaiPool)
                .div(2);
        }

        assert(_ethTransferToDaiPool <= _ethSent.mul(3).div(4));

        return _ethTransferToDaiPool;
    }

    /// @notice Calculates the amount for the user to receive with a 0.3% transaction fee applied.
    /// @param _amountBeforeFee The amount the user will receive before transaction fee is applied.
    /// @return _amountAfterFee The amount the user will receive with transaction fee applied.
    function applyTransactionFee(uint256 _amountBeforeFee)
        public
        pure
        returns (uint256)
    {
        uint256 _amountAfterFee = _amountBeforeFee.mul(997).div(1000);
        return _amountAfterFee;
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
