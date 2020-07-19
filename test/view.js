const truffleAssert = require("truffle-assertions");
const BN = require("bn.js");
const { assert } = require("chai");

const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

const decimalFactor = new BN(Math.pow(10, 18).toString());
const gasPrice = new BN("20000000000");

contract("Eclipseum - View Function Tests", async (accounts) => {
  it("ethBalanceOfDaiPool returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToSend = new BN("100").mul(decimalFactor);

    await daiInstance.transfer(eclipseumInstance.address, daiToSend, {
      from: accounts[0],
    });

    await eclipseumInstance.launch({ from: accounts[0] });

    const ethBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool({
      from: accounts[0],
    });

    const ethBalanceTotal = new BN(
      await web3.eth.getBalance(eclipseumInstance.address)
    );

    const expectedEthBalanceOfDaiPool = ethBalanceTotal.sub(
      ethBalanceOfEclPool
    );

    const actualEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool(
      { from: accounts[0] }
    );

    assert.equal(
      actualEthBalanceOfDaiPool.toString(),
      expectedEthBalanceOfDaiPool.toString(),
      "Incorrect ethBalanceOfDaiPool"
    );
  });

  it("eclBalanceOfEclPool returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      {
        from: accounts[0],
      }
    );

    const expectedEclBalanceOfEclPool = await eclipseumInstance.balanceOf.call(
      eclipseumInstance.address
    );

    assert.equal(
      actualEclBalanceOfEclPool.toString(),
      expectedEclBalanceOfEclPool.toString(),
      "Incorrect eclBalanceOfEclPool"
    );
  });

  it("daiBalanceOfDaiPool returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const actualDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool(
      {
        from: accounts[0],
      }
    );

    const expectedDaiBalanceOfDaiPool = await daiInstance.balanceOf.call(
      eclipseumInstance.address
    );

    assert.equal(
      actualDaiBalanceOfDaiPool.toString(),
      expectedDaiBalanceOfDaiPool.toString(),
      "Incorrect daiBalanceOfDaiPool"
    );
  });
});
