const BN = require("bn.js");

// Constant product market maker equation
// aSold is the quantity of token sold by the user
// bBought is the quantity of token b the user would receive before transaction fees applied
// aBalance is the balance of token a before the transaction is initiated
// bBalance is the balance of token b before the transaction is initiated
function calcBOut(aBalance, bBalance, aSold) {
  let denominator = aBalance.add(aSold);
  let fraction = aBalance.mul(bBalance).div(denominator);
  let bBought = bBalance.sub(fraction).sub(new BN("1"));
  return bBought;
}

// Apply the 0.3% transaction fee
function applyTransactionFee(amountBeforeFee) {
  const amountAfterFee = amountBeforeFee.mul(new BN("997")).div(new BN("1000"));
  return amountAfterFee;
}

// Calculate the amount of ETH to transfer from the ECL pool to the DAI pool
// Used by the buyEcl function
function calcEthTransferForBuyEcl(
  ethBalanceOfEclPool,
  ethBalanceOfDaiPool,
  ethSent
) {
  let ethTransferToDaiPool = new BN();

  if (
    ethBalanceOfEclPool.gte(ethSent.div(new BN("2")).add(ethBalanceOfDaiPool))
  ) {
    ethTransferToDaiPool = ethSent.mul(new BN("3")).div(new BN("4"));
  } else if (ethBalanceOfEclPool.add(ethSent).lte(ethBalanceOfDaiPool)) {
    ethTransferToDaiPool = new BN("0");
  } else {
    ethTransferToDaiPool = ethBalanceOfEclPool
      .add(ethSent)
      .sub(ethBalanceOfDaiPool)
      .div(new BN("2"));
  }

  return ethTransferToDaiPool;
}
module.exports = { calcBOut, applyTransactionFee, calcEthTransferForBuyEcl };
