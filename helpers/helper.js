const BN = require("bn.js");

function calcBOut(aBalance, bBalance, aSold) {
  let denominator = aBalance.add(aSold);
  let fraction = aBalance.mul(bBalance).div(denominator);
  let bBought = bBalance.sub(fraction).sub(new BN("1"));
  return bBought;
}

function applyTransactionFee(amountBeforeFee) {
  const amountAfterFee = amountBeforeFee.mul(new BN("997")).div(new BN("1000"));
  return amountAfterFee;
}

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
