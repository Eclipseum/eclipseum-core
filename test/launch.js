const truffleAssert = require("truffle-assertions");
const BN = require("bn.js");
const { assert } = require("chai");

const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

const validDeadline = new BN(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes in the future
const decimalFactor = new BN(Math.pow(10, 18).toString());

contract("Eclipseum - Launch Tests", (accounts) => {
  it("Correct Supply Minted", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const actualTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const expectedTotalSupply = new BN("100000").mul(decimalFactor);

    assert.equal(
      expectedTotalSupply.toString(),
      actualTotalSupply.toString(),
      "Total Supply incorrect"
    );
  });

  it("buyEcl reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const minEthToReceive = new BN("0");
    const ethToSpend = new BN("1").mul(decimalFactor);

    await truffleAssert.reverts(
      eclipseumInstance.buyEcl(minEthToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("sellEcl reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.sellEcl(eclToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("softSellEcl reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");
    const minDaiToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.softSellEcl(
        eclToSell,
        minEthToReceive,
        minDaiToReceive,
        validDeadline,
        {
          from: accounts[0],
        }
      ),
      "Contract must be launched to invoke this function."
    );
  });

  it("buyDai reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);
    const minDaiToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.buyDai(ethToSpend, validDeadline, {
        from: accounts[0],
        value: minDaiToReceive,
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("sellDai reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const daiToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.sellDai(daiToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("eclBalanceOfEclPool reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    await truffleAssert.reverts(
      eclipseumInstance.eclBalanceOfEclPool.call({
        from: accounts[0],
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("ethBalanceOfDaiPool reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    await truffleAssert.reverts(
      eclipseumInstance.ethBalanceOfDaiPool.call({
        from: accounts[0],
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("daiBalanceOfDaiPool reverts when called before launch", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    await truffleAssert.reverts(
      eclipseumInstance.daiBalanceOfDaiPool.call({
        from: accounts[0],
      }),
      "Contract must be launched to invoke this function."
    );
  });

  it("launched variable is false before launch.", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const launched = await eclipseumInstance.launched.call({
      from: accounts[0],
    });

    assert.equal(
      launched,
      false,
      "launched variable is true but should be false."
    );
  });

  it("launch function reverts when called while contract has DAI balance of zero", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    await truffleAssert.reverts(
      eclipseumInstance.launch({
        from: accounts[0],
      }),
      "DAI pool balance must be greater than zero to launch contract."
    );
  });

  it("launch function succeeds when called while contract has nonzero DAI balance.", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToSend = new BN("10").mul(decimalFactor);

    await daiInstance.transfer(eclipseumInstance.address, daiToSend, {
      from: accounts[0],
    });

    await eclipseumInstance.launch({ from: accounts[0] });

    const launched = await eclipseumInstance.launched.call({
      from: accounts[0],
    });

    assert.equal(launched, true, "Failed to launch");
  });

  it("ethBalanceOfEclPool returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool.call(
      { from: accounts[0] }
    );

    const expectedEthBalanceOfEclPool = new BN("1")
      .mul(decimalFactor)
      .div(new BN("10"));

    assert.equal(
      actualEthBalanceOfEclPool.toString(),
      expectedEthBalanceOfEclPool.toString(),
      "Incorrect ethBalanceOfEclPool"
    );
  });

  it("ethBalanceOfDaiPool returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool.call(
      { from: accounts[0] }
    );

    const expectedEthBalanceOfDaiPool = new BN("2")
      .mul(decimalFactor)
      .div(new BN("10"));

    assert.equal(
      actualEthBalanceOfDaiPool.toString(),
      expectedEthBalanceOfDaiPool.toString(),
      "Incorrect ethBalanceOfDaiPool"
    );
  });
});
