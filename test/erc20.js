const truffleAssert = require("truffle-assertions");
const BN = require("bn.js");
const { assert } = require("chai");

const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

const decimalFactor = new BN(Math.pow(10, 18).toString());
const validDeadline = new BN(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes in the future

contract("Eclipseum - ERC20 Tests", (accounts) => {
  it("name returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualName = await eclipseumInstance.name.call({
      from: accounts[0],
    });

    const expectedName = "Eclipseum";

    assert.equal(actualName, expectedName, "Name incorrect");
  });

  it("symbol returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualSymbol = await eclipseumInstance.symbol.call({
      from: accounts[0],
    });

    const expectedSymbol = "ECL";

    assert.equal(actualSymbol, expectedSymbol, "Symbol incorrect");
  });

  it("decimals returns correct value", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualDecimals = await eclipseumInstance.decimals.call({
      from: accounts[0],
    });

    const expectedDecimals = "18";

    assert.equal(actualDecimals, expectedDecimals, "Decimals incorrect");
  });

  it("totalSupply returns correct value", async () => {
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

  it("balanceOf returns user balances of zero", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualUserZeroEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );
    const actualUserOneEclBalance = await eclipseumInstance.balanceOf(
      accounts[1]
    );

    const expectedUserZeroEclBalance = new BN("0");
    const expectedUserOneEclBalance = new BN("0");

    assert.equal(
      actualUserZeroEclBalance.toString(),
      expectedUserZeroEclBalance.toString(),
      "User zero incorrect balance"
    );
    assert.equal(
      actualUserOneEclBalance.toString(),
      expectedUserOneEclBalance.toString(),
      "User one incorrect balance"
    );
  });

  it("transfer successfully transfers ECL between user accounts", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToTransfer = new BN("10").mul(decimalFactor);

    await daiInstance.transfer(eclipseumInstance.address, daiToTransfer, {
      from: accounts[0],
    });

    await eclipseumInstance.launch({ from: accounts[0] });

    const ethToSpend = new BN("10").mul(decimalFactor);

    const minEclToReceive = new BN("0");

    //Buy ECL so user has ECL to transfer for test
    await eclipseumInstance.buyEcl(minEclToReceive, validDeadline, {
      from: accounts[0],
      value: ethToSpend,
    });

    const initialUserZeroEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const initialUserOneEclBalance = await eclipseumInstance.balanceOf(
      accounts[1]
    );

    const eclToTransfer = new BN("10").mul(decimalFactor);

    await eclipseumInstance.transfer(accounts[1], eclToTransfer, {
      from: accounts[0],
    });

    const actualFinalUserZeroEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const actualFinalUserOneEclBalance = await eclipseumInstance.balanceOf(
      accounts[1]
    );

    const expectedFinalUserZeroEclBalance = initialUserZeroEclBalance.sub(
      eclToTransfer
    );
    const expectedFinalUserOneEclBalance = initialUserOneEclBalance.add(
      eclToTransfer
    );

    assert.equal(
      actualFinalUserZeroEclBalance.toString(),
      expectedFinalUserZeroEclBalance.toString(),
      "User zero incorrect balance"
    );
    assert.equal(
      actualFinalUserOneEclBalance.toString(),
      expectedFinalUserOneEclBalance.toString(),
      "User one incorrect balance"
    );
  });

  it("transfer reverts when user attempts to transfer more than their current balance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserZeroEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const eclToTransfer = initialUserZeroEclBalance.add(new BN("1"));

    await truffleAssert.reverts(
      eclipseumInstance.transfer(accounts[1], eclToTransfer, {
        from: accounts[0],
      })
    );
  });

  it("transferFrom reverts when transfer amount is greater than allowance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToTransfer = new BN("10").mul(decimalFactor);

    await truffleAssert.reverts(
      eclipseumInstance.transferFrom(accounts[0], accounts[1], eclToTransfer, {
        from: accounts[1],
      })
    );
  });

  it("allowance returns zero before approval", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const actualAllowance = await eclipseumInstance.allowance(
      accounts[0],
      accounts[1],
      {
        from: accounts[0],
      }
    );

    const expectedAllowance = new BN("0");

    assert.equal(
      actualAllowance.toString(),
      expectedAllowance.toString(),
      "Allowance should be zero"
    );
  });

  it("approve successfully updates allowance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToApprove = new BN("10").mul(decimalFactor);

    await eclipseumInstance.approve(accounts[1], eclToApprove, {
      from: accounts[0],
    });

    const actualAllowance = await eclipseumInstance.allowance(
      accounts[0],
      accounts[1],
      {
        from: accounts[0],
      }
    );

    const expectedAllowance = eclToApprove;

    assert.equal(
      actualAllowance.toString(),
      expectedAllowance.toString(),
      "Allowance not updated correctly"
    );
  });

  it("decreaseAllowance successfully updates allowance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const decreaseAllowanceAmount = new BN("5").mul(decimalFactor);

    const initialAllowance = await eclipseumInstance.allowance(
      accounts[0],
      accounts[1],
      {
        from: accounts[0],
      }
    );

    await eclipseumInstance.decreaseAllowance(
      accounts[1],
      decreaseAllowanceAmount,
      {
        from: accounts[0],
      }
    );

    const actualFinalAllowance = await eclipseumInstance.allowance(
      accounts[0],
      accounts[1],
      {
        from: accounts[0],
      }
    );

    const expectedFinalAllowance = initialAllowance.sub(
      decreaseAllowanceAmount
    );

    assert.equal(
      actualFinalAllowance.toString(),
      expectedFinalAllowance.toString(),
      "Allowance not updated correctly"
    );
  });

  it("increaseAllowance successfully updates allowance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const increaseAllowanceAmount = new BN("10").mul(decimalFactor);

    const initialAllowance = await eclipseumInstance.allowance(
      accounts[0],
      accounts[1],
      {
        from: accounts[0],
      }
    );

    await eclipseumInstance.increaseAllowance(
      accounts[1],
      increaseAllowanceAmount,
      {
        from: accounts[0],
      }
    );

    const actualFinalAllowance = await eclipseumInstance.allowance(
      accounts[0],
      accounts[1],
      {
        from: accounts[0],
      }
    );

    const expectedFinalAllowance = initialAllowance.add(
      increaseAllowanceAmount
    );

    assert.equal(
      actualFinalAllowance.toString(),
      expectedFinalAllowance.toString(),
      "Allowance not updated correctly"
    );
  });

  it("transferFrom succeeds when amount is less than or equal to allowance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserZeroEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const initialUserOneEclBalance = await eclipseumInstance.balanceOf(
      accounts[1]
    );

    const eclToTransfer = new BN("10").mul(decimalFactor);

    await eclipseumInstance.approve(accounts[1], eclToTransfer, {
      from: accounts[0],
    });

    await eclipseumInstance.transferFrom(
      accounts[0],
      accounts[1],
      eclToTransfer,
      {
        from: accounts[1],
      }
    );

    const actualFinalUserZeroEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const actualFinalUserOneEclBalance = await eclipseumInstance.balanceOf(
      accounts[1]
    );

    const expectedFinalUserZeroEclBalance = initialUserZeroEclBalance.sub(
      eclToTransfer
    );
    const expectedFinalUserOneEclBalance = initialUserOneEclBalance.add(
      eclToTransfer
    );

    assert.equal(
      actualFinalUserZeroEclBalance.toString(),
      expectedFinalUserZeroEclBalance.toString(),
      "User zero incorrect balance"
    );
    assert.equal(
      actualFinalUserOneEclBalance.toString(),
      expectedFinalUserOneEclBalance.toString(),
      "User one incorrect balance"
    );
  });
});
