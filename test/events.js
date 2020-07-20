const truffleAssert = require("truffle-assertions");
const BN = require("bn.js");
const { assert } = require("chai");

const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

const validDeadline = new BN(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes in the future
const decimalFactor = new BN(Math.pow(10, 18).toString());
const gasPrice = new BN("20000000000");

contract("Eclipseum - Event Tests", (accounts) => {
  it("buyEcl emits event with correct values", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToSend = new BN("10").mul(decimalFactor);

    await daiInstance.transfer(eclipseumInstance.address, daiToSend, {
      from: accounts[0],
    });

    await eclipseumInstance.launch({ from: accounts[0] });

    const initialUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const ethToSpend = new BN("1").mul(decimalFactor);
    const minEclToReceive = new BN("0");

    const receipt = await eclipseumInstance.buyEcl(
      minEclToReceive,
      validDeadline,
      {
        from: accounts[0],
        value: ethToSpend,
      }
    );

    const finalUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const actualEventName = receipt.logs[0].event;
    const actualEventArg0 = receipt.logs[0].args[0];
    const actualEventArg1 = receipt.logs[0].args[1];

    const expectedEventName = "LogBuyEcl";
    const expectedEventArg0 = accounts[0];
    const expectedEventArg1 = finalUserEclBalance.sub(initialUserEclBalance);

    assert.equal(
      actualEventName.toString(),
      expectedEventName.toString(),
      "Incorrect event name"
    );
    assert.equal(
      actualEventArg0.toString(),
      expectedEventArg0.toString(),
      "Incorrect Arg0"
    );
    assert.equal(
      actualEventArg1.toString(),
      expectedEventArg1.toString(),
      "Incorrect Arg1"
    );
  });

  it("sellEcl emits event with correct values", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const eclToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");

    const receipt = await eclipseumInstance.sellEcl(
      eclToSell,
      minEthToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const gasUsed = new BN(receipt.receipt.gasUsed);
    const ethUsedForGas = gasUsed.mul(gasPrice);

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const actualEventName = receipt.logs[0].event;
    const actualEventArg0 = receipt.logs[0].args[0];
    const actualEventArg1 = receipt.logs[0].args[1];

    const expectedEventName = "LogSellEcl";
    const expectedEventArg0 = accounts[0];
    const expectedEventArg1 = finalUserEthBalance
      .sub(initialUserEthBalance)
      .add(ethUsedForGas);

    assert.equal(
      actualEventName.toString(),
      expectedEventName.toString(),
      "Incorrect event name"
    );
    assert.equal(
      actualEventArg0.toString(),
      expectedEventArg0.toString(),
      "Incorrect Arg0"
    );
    assert.equal(
      actualEventArg1.toString(),
      expectedEventArg1.toString(),
      "Incorrect Arg1"
    );
  });

  it("softSellEcl emits event with correct values", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const eclToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");
    const minDaiToReceive = new BN("0");

    const receipt = await eclipseumInstance.softSellEcl(
      eclToSell,
      minEthToReceive,
      minDaiToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const gasUsed = new BN(receipt.receipt.gasUsed);
    const ethUsedForGas = gasUsed.mul(gasPrice);

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const finalUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const actualEventName = receipt.logs[0].event;
    const actualEventArg0 = receipt.logs[0].args[0];
    const actualEventArg1 = receipt.logs[0].args[1];
    const actualEventArg2 = receipt.logs[0].args[2];

    const expectedEventName = "LogSoftSellEcl";
    const expectedEventArg0 = accounts[0];
    const expectedEventArg1 = finalUserEthBalance
      .sub(initialUserEthBalance)
      .add(ethUsedForGas);
    const expectedEventArg2 = finalUserDaiBalance.sub(initialUserDaiBalance);

    assert.equal(
      actualEventName.toString(),
      expectedEventName.toString(),
      "Incorrect event name"
    );
    assert.equal(
      actualEventArg0.toString(),
      expectedEventArg0.toString(),
      "Incorrect Arg0"
    );
    assert.equal(
      actualEventArg1.toString(),
      expectedEventArg1.toString(),
      "Incorrect Arg1"
    );
    assert.equal(
      actualEventArg2.toString(),
      expectedEventArg2.toString(),
      "Incorrect Arg2"
    );
  });

  it("buyDai emits event with correct values", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const ethToSpend = new BN("1").mul(decimalFactor);
    const minDaiToReceive = new BN("0");

    const receipt = await eclipseumInstance.buyDai(
      minDaiToReceive,
      validDeadline,
      {
        from: accounts[0],
        value: ethToSpend,
      }
    );

    const gasUsed = new BN(receipt.receipt.gasUsed);
    const ethUsedForGas = gasUsed.mul(gasPrice);

    const finalUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const actualEventName = receipt.logs[0].event;
    const actualEventArg0 = receipt.logs[0].args[0];
    const actualEventArg1 = receipt.logs[0].args[1];

    const expectedEventName = "LogBuyDai";
    const expectedEventArg0 = accounts[0];
    const expectedEventArg1 = finalUserDaiBalance.sub(initialUserDaiBalance);

    assert.equal(
      actualEventName.toString(),
      expectedEventName.toString(),
      "Incorrect event name"
    );
    assert.equal(
      actualEventArg0.toString(),
      expectedEventArg0.toString(),
      "Incorrect Arg0"
    );
    assert.equal(
      actualEventArg1.toString(),
      expectedEventArg1.toString(),
      "Incorrect Arg1"
    );
  });

  it("sellDai emits event with correct values", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const daiToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");

    const receipt1 = await daiInstance.approve(
      eclipseumInstance.address,
      daiToSell,
      {
        from: accounts[0],
      }
    );

    const receipt2 = await eclipseumInstance.sellDai(
      daiToSell,
      minEthToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const gasUsed1 = new BN(receipt1.receipt.gasUsed);
    const ethUsedForGas1 = gasUsed1.mul(gasPrice);

    const gasUsed2 = new BN(receipt2.receipt.gasUsed);
    const ethUsedForGas2 = gasUsed2.mul(gasPrice);

    const ethUsedForGas = ethUsedForGas1.add(ethUsedForGas2);

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const actualEventName = receipt2.logs[0].event;
    const actualEventArg0 = receipt2.logs[0].args[0];
    const actualEventArg1 = receipt2.logs[0].args[1];

    const expectedEventName = "LogSellDai";
    const expectedEventArg0 = accounts[0];
    const expectedEventArg1 = finalUserEthBalance
      .sub(initialUserEthBalance)
      .add(ethUsedForGas);

    assert.equal(
      actualEventName.toString(),
      expectedEventName.toString(),
      "Incorrect event name"
    );
    assert.equal(
      actualEventArg0.toString(),
      expectedEventArg0.toString(),
      "Incorrect Arg0"
    );
    assert.equal(
      actualEventArg1.toString(),
      expectedEventArg1.toString(),
      "Incorrect Arg1"
    );
  });
});
