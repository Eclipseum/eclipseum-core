const BN = require("bn.js");
const { assert } = require("chai");
const helper = require("../helpers/helper.js");

const Eclipseum = artifacts.require("Eclipseum");

const decimalFactor = new BN(Math.pow(10, 18).toString());

function calcBOut(aBalance, bBalance, aSold) {
  let denominator = aBalance.add(aSold);
  let fraction = aBalance.mul(bBalance).div(denominator);
  let bBought = bBalance.sub(fraction).sub(new BN("1")); // Testing bn.js
  return bBought;
}

contract("Eclipseum - Pure Function Tests", (accounts) => {
  it("calcBOut calculates correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const aBalance = new BN("100").mul(decimalFactor);
    const bBalance = new BN("110").mul(decimalFactor);
    const aSold = new BN("12").mul(decimalFactor);

    const actualBOut = await eclipseumInstance.calcBOut(
      aBalance,
      bBalance,
      aSold,
      {
        from: accounts[0],
      }
    );

    const expectedBOut = calcBOut(aBalance, bBalance, aSold);

    assert.equal(
      actualBOut.toString(),
      expectedBOut.toString(),
      "calcBOut Function does not calculate correct value."
    );
  });

  it("calcBOut rounding favors the pool, not the user", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const aBalance = new BN("100").mul(decimalFactor);
    const bBalance = new BN("1");
    const aSold = new BN("1000").mul(decimalFactor);

    const actualBOut = await eclipseumInstance.calcBOut(
      aBalance,
      bBalance,
      aSold,
      {
        from: accounts[0],
      }
    );

    const expectedBOut = new BN("0");

    assert.equal(
      actualBOut.toString(),
      expectedBOut.toString(),
      "calcBOut Function does not calculate correct value."
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 1", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("93").mul(decimalFactor);
    const ethSold = new BN("10").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 2", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("94").mul(decimalFactor);
    const ethSold = new BN("10").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 3", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("100").mul(decimalFactor);
    const ethSold = new BN("10").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 4", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("109").mul(decimalFactor);
    const ethSold = new BN("10").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 5", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("110").mul(decimalFactor);
    const ethSold = new BN("10").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 6", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("111").mul(decimalFactor);
    const ethSold = new BN("10").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 7", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("100").mul(decimalFactor);
    const ethSold = new BN("0").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });

  it("calcEthTransferForBuyEcl calculates correct transfer 8", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const ethBalanceOfEclPool = new BN("100").mul(decimalFactor);
    const ethBalanceOfDaiPool = new BN("100").mul(decimalFactor);
    const ethSold = new BN("1000").mul(decimalFactor);

    const actualEthTransfer = await eclipseumInstance.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold,
      {
        from: accounts[0],
      }
    );

    const expectedEthTransfer = helper.calcEthTransferForBuyEcl(
      ethBalanceOfEclPool,
      ethBalanceOfDaiPool,
      ethSold
    );

    assert.equal(
      actualEthTransfer.toString(),
      expectedEthTransfer.toString(),
      "Did not transfer correct amount"
    );
  });
});
