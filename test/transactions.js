const truffleAssert = require("truffle-assertions");
const BN = require("bn.js");
const { assert } = require("chai");

const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

const validDeadline = new BN("10000000000000");
const elapsedDeadline = new BN("0");
const decimalFactor = new BN(Math.pow(10, 18).toString());
const gasPrice = new BN("20000000000");

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

contract("Eclipseum - Transaction Function Tests", (accounts) => {
  it("launch succeeds", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToSend = new BN("100").mul(decimalFactor);

    await daiInstance.transfer(eclipseumInstance.address, daiToSend, {
      from: accounts[0],
    });

    await eclipseumInstance.launch({ from: accounts[0] });

    const launched = await eclipseumInstance.launched.call({
      from: accounts[0],
    });

    assert.equal(launched, true, "Did not launch");
  });

  it("buyEcl reverts when called with 0 ETH to spend", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("0");
    const minEclToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.buyEcl(minEclToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Value of ETH sent must be greater than zero."
    );
  });

  it("sellEcl reverts when called with 0 ECL to sell", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("0");
    const minEthToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.sellEcl(eclToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "Value of ECL sold must be greater than zero."
    );
  });

  it("softSellEcl reverts when called with 0 ECL to sell", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("0");
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
      "Value of ECL sold must be greater than zero."
    );
  });

  it("buyDai reverts when called with 0 ETH to spend", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("0");
    const minDaiToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.buyDai(minDaiToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Value of ETH sent must be greater than zero."
    );
  });

  it("sellDai reverts when called with 0 DAI to sell", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    await truffleAssert.reverts(
      eclipseumInstance.sellDai(0, 0, 1000000000000, {
        from: accounts[0],
      }),
      "Value of DAI sold must be greater than zero."
    );
  });

  it("buyEcl reverts when called with elapsed deadline", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);
    const minEclToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.buyEcl(minEclToReceive, elapsedDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Transaction deadline has elapsed."
    );
  });

  it("sellEcl reverts when called with elapsed deadline", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("1").mul(decimalFactor);
    const minEthToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.sellEcl(eclToSell, minEthToReceive, elapsedDeadline, {
        from: accounts[0],
      }),
      "Transaction deadline has elapsed."
    );
  });

  it("softSellEcl reverts when called with elapsed deadline", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("1").mul(decimalFactor);
    const minEthToReceive = new BN("0");
    const minDaiToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.softSellEcl(
        eclToSell,
        minEthToReceive,
        minDaiToReceive,
        elapsedDeadline,
        {
          from: accounts[0],
        }
      ),
      "Transaction deadline has elapsed."
    );
  });

  it("buyDai reverts when called with elapsed deadline", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);
    const minDaiToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.buyDai(minDaiToReceive, elapsedDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Transaction deadline has elapsed."
    );
  });

  it("sellDai reverts when called with elapsed deadline", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const daiToSell = new BN("1").mul(decimalFactor);
    const minEthToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.sellDai(daiToSell, minEthToReceive, elapsedDeadline, {
        from: accounts[0],
      }),
      "Transaction deadline has elapsed."
    );
  });

  it("buyEcl fails when user attempts to spend more ETH than their current balance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const userEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const ethToSpend = userEthBalance.add(new BN("1"));
    const minEclToReceive = new BN("0");

    await truffleAssert.fails(
      eclipseumInstance.buyEcl(minEclToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      })
    );
  });

  it("sellEcl reverts when user attempts to sell more ECL than their current balance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const userEclBalance = await eclipseumInstance.balanceOf.call(accounts[0]);

    const eclToSell = userEclBalance.add(new BN("1"));
    const minEthToReceive = new BN("0");

    await truffleAssert.reverts(
      eclipseumInstance.sellEcl(eclToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "ECL sold must be less than or equal to ECL balance."
    );
  });

  it("softSellEcl reverts when user attempts to sell more ECL than their current balance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const userEclBalance = await eclipseumInstance.balanceOf.call(accounts[0]);

    const eclToSell = userEclBalance.add(new BN("1"));
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
      "ECL sold must be less than or equal to ECL balance."
    );
  });

  it("buyDai fails when user attempts to spend more ETH than their current balance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const userEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const ethToSpend = userEthBalance.add(new BN("1"));
    const minDaiToReceive = new BN("0");

    await truffleAssert.fails(
      eclipseumInstance.buyDai(minDaiToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      })
    );
  });

  it("sellDai reverts when user attempts to sell more DAI than their current balance", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const userDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const daiToSell = userDaiBalance.add(new BN("1"));
    const daiToApprove = daiToSell;

    const minEthToReceive = new BN("0");

    await daiInstance.approve(eclipseumInstance.address, daiToApprove, {
      from: accounts[0],
    });

    await truffleAssert.reverts(
      eclipseumInstance.sellDai(daiToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "DAI sold must be less than or equal to DAI balance."
    );
  });

  it("buyEcl transfers correct amounts ECL to user and ETH from user", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      {
        from: accounts[0],
      }
    );

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      {
        from: accounts[0],
      }
    );

    const ethToSpend = new BN("10").mul(decimalFactor);

    const receipt = await eclipseumInstance.buyEcl(0, 1000000000000, {
      from: accounts[0],
      value: ethToSpend,
    });

    const gasUsed = new BN(receipt.receipt.gasUsed);
    const ethUsedForGas = gasUsed.mul(gasPrice);

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const finalUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const actualEclReceived = finalUserEclBalance.sub(initialUserEclBalance);

    const actualEthSpent = initialUserEthBalance.sub(finalUserEthBalance);

    const expectedEclReceived = new BN(
      applyTransactionFee(
        calcBOut(
          initialEthBalanceOfEclPool,
          initialEclBalanceOfEclPool,
          ethToSpend
        )
      )
    );

    const expectedEthSpent = ethToSpend.add(ethUsedForGas);

    assert.equal(
      actualEclReceived.toString(),
      expectedEclReceived.toString(),
      "User did not receive correct amount of ECL"
    );

    assert.equal(
      actualEthSpent.toString(),
      expectedEthSpent.toString(),
      "Users ETH balance not decreased correctly"
    );
  });

  it("sellEcl transfers correct amount of ETH to user and ECL from user", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      {
        from: accounts[0],
      }
    );

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      {
        from: accounts[0],
      }
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

    const finalUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const actualEthReceived = finalUserEthBalance
      .sub(initialUserEthBalance)
      .add(ethUsedForGas);

    const actualEclSold = initialUserEclBalance.sub(finalUserEclBalance);

    const expectedEthReceived = new BN(
      applyTransactionFee(
        calcBOut(
          initialEclBalanceOfEclPool,
          initialEthBalanceOfEclPool,
          eclToSell
        )
      )
    );

    const expectedEclSold = eclToSell;

    assert.equal(
      actualEthReceived.toString(),
      expectedEthReceived.toString(),
      "User did not receive correct amount of ETH"
    );

    assert.equal(
      actualEclSold.toString(),
      expectedEclSold.toString(),
      "Users ECL balance not decreased correctly"
    );
  });

  it("softSellEcl transfers correct amount of ECL from user and correct amount of ETH and DAI to user.", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialUserEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const initialUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const ethBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool({
      from: accounts[0],
    });

    const daiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool({
      from: accounts[0],
    });
    const ethBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool({
      from: accounts[0],
    });

    const eclCirculatingSupply = await eclipseumInstance.circulatingSupply({
      from: accounts[0],
    });

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

    const finalUserEclBalance = await eclipseumInstance.balanceOf(accounts[0]);

    const finalUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const actualEthReceived = finalUserEthBalance
      .add(ethUsedForGas)
      .sub(initialUserEthBalance);

    const actualDaiReceived = finalUserDaiBalance.sub(initialUserDaiBalance);

    const actualEclSold = initialUserEclBalance.sub(finalUserEclBalance);

    const expectedEthReceivedFromEclPool = applyTransactionFee(
      eclToSell.mul(ethBalanceOfEclPool).div(eclCirculatingSupply)
    );

    const expectedEthReceivedFromDaiPool = applyTransactionFee(
      eclToSell.mul(ethBalanceOfDaiPool).div(eclCirculatingSupply)
    );

    const expectedEthReceived = expectedEthReceivedFromDaiPool.add(
      expectedEthReceivedFromEclPool
    );

    const expectedDaiReceived = applyTransactionFee(
      eclToSell.mul(daiBalanceOfDaiPool).div(eclCirculatingSupply)
    );

    const expectedEclSold = eclToSell;

    assert.equal(
      actualEthReceived.toString(),
      expectedEthReceived.toString(),
      "Incorrect amount of ETH received"
    );

    assert.equal(
      actualDaiReceived.toString(),
      expectedDaiReceived.toString(),
      "Incorrect amount of DAI received"
    );

    assert.equal(
      actualEclSold.toString(),
      expectedEclSold.toString(),
      "Incorrect amount of ECL sold"
    );
  });

  it("buyDai transfers correct amount of DAI to user and ETH from user", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool(
      { from: accounts[0] }
    );

    const initialDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool(
      { from: accounts[0] }
    );

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

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const expectedDaiReceived = applyTransactionFee(
      calcBOut(
        initialEthBalanceOfDaiPool,
        initialDaiBalanceOfDaiPool,
        ethToSpend
      )
    );

    const expectedEthSpent = ethToSpend.add(ethUsedForGas);

    const actualDaiReceived = finalUserDaiBalance.sub(initialUserDaiBalance);

    const actualEthSpent = initialUserEthBalance.sub(finalUserEthBalance);

    assert.equal(
      actualDaiReceived.toString(),
      expectedDaiReceived.toString(),
      "Incorrect amount DAI received"
    );

    assert.equal(
      actualEthSpent.toString(),
      expectedEthSpent.toString(),
      "Incorrect amount of ETH spent"
    );
  });

  it("sellDai transfers correct amount of ETH to user and DAI from user", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool(
      { from: accounts[0] }
    );

    const initialDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool(
      { from: accounts[0] }
    );

    const daiToSell = initialUserDaiBalance.div(new BN("10"));

    const receipt1 = await daiInstance.approve(
      eclipseumInstance.address,
      daiToSell,
      { from: accounts[0] }
    );

    const gasUsed1 = new BN(receipt1.receipt.gasUsed);
    const ethUsedForGas1 = gasUsed1.mul(gasPrice);

    const minEthToReceive = new BN("0");

    const receipt2 = await eclipseumInstance.sellDai(
      daiToSell,
      minEthToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const gasUsed2 = new BN(receipt2.receipt.gasUsed);
    let ethUsedForGas2 = gasUsed2.mul(gasPrice);

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const finalUserDaiBalance = await daiInstance.balanceOf(accounts[0]);

    const expectedEthReceived = applyTransactionFee(
      calcBOut(
        initialDaiBalanceOfDaiPool,
        initialEthBalanceOfDaiPool,
        daiToSell
      )
    );

    const expectedDaiSold = daiToSell;

    const actualEthReceived = finalUserEthBalance
      .add(ethUsedForGas1)
      .add(ethUsedForGas2)
      .sub(initialUserEthBalance);

    const actualDaiSold = initialUserDaiBalance.sub(finalUserDaiBalance);

    assert.equal(
      actualEthReceived.toString(),
      expectedEthReceived.toString(),
      "Incorrect amount of ETH received"
    );

    assert.equal(
      actualDaiSold.toString(),
      expectedDaiSold.toString(),
      "Incorrect amount of DAI sold"
    );
  });

  it("buyEcl correctly increments ethVolumeOfEclPool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const ethToSpend = initialUserEthBalance.div(new BN("10"));

    const initialEthVolumeOfEclPool = await eclipseumInstance.ethVolumeOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const minEclToReceive = new BN("0");

    await eclipseumInstance.buyEcl(minEclToReceive, validDeadline, {
      from: accounts[0],
      value: ethToSpend,
    });

    const finalEthVolumeOfEclPool = await eclipseumInstance.ethVolumeOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const actualEthVolumeOfEclPoolIncremented = finalEthVolumeOfEclPool.sub(
      initialEthVolumeOfEclPool
    );

    const expectedEthVolumeOfEclPoolIncremented = ethToSpend;

    assert.equal(
      actualEthVolumeOfEclPoolIncremented.toString(),
      expectedEthVolumeOfEclPoolIncremented.toString(),
      "ETH volume incorrectly incremented"
    );
  });

  it("sellEcl correctly increments ethVolumeOfEclPool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialUserEclBalance = await eclipseumInstance.balanceOf(
      accounts[0]
    );

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      { from: accounts[0] }
    );

    const initialEthVolumeOfEclPool = await eclipseumInstance.ethVolumeOfEclPool.call(
      {
        from: accounts[0],
      }
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

    const ethReceivedByUser = finalUserEthBalance
      .sub(initialUserEthBalance)
      .add(ethUsedForGas);

    const finalEthVolumeOfEclPool = await eclipseumInstance.ethVolumeOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const actualEthVolumeOfEclPoolIncremented = finalEthVolumeOfEclPool.sub(
      initialEthVolumeOfEclPool
    );

    const expectedEthVolumeOfEclPoolIncremented = ethReceivedByUser;

    assert.equal(
      actualEthVolumeOfEclPoolIncremented.toString(),
      expectedEthVolumeOfEclPoolIncremented.toString(),
      "ETH volume incorrectly incremented"
    );
  });

  it("softSellEcl correctly increments ethVolumeOfEclPool and ethVolumeOfDaiPool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEthVolumeOfEclPool = await eclipseumInstance.ethVolumeOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEthVolumeOfDaiPool = await eclipseumInstance.ethVolumeOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEclCirculatingSupply = await eclipseumInstance.circulatingSupply.call(
      {
        from: accounts[0],
      }
    );

    const eclToSell = new BN("10").mul(decimalFactor);
    const minEthToReceive = new BN("0");
    const minDaiToReceive = new BN("0");

    await eclipseumInstance.softSellEcl(
      eclToSell,
      minEthToReceive,
      minDaiToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const finalEthVolumeOfEclPool = await eclipseumInstance.ethVolumeOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const finalEthVolumeOfDaiPool = await eclipseumInstance.ethVolumeOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const expectedEthReceivedFromEclPool = applyTransactionFee(
      eclToSell.mul(initialEthBalanceOfEclPool).div(initialEclCirculatingSupply)
    );

    const expectedEthReceivedFromDaiPool = applyTransactionFee(
      eclToSell.mul(initialEthBalanceOfDaiPool).div(initialEclCirculatingSupply)
    );

    const actualEthVolumeOfEclPoolIncremented = finalEthVolumeOfEclPool.sub(
      initialEthVolumeOfEclPool
    );

    const actualEthVolumeOfDaiPoolIncremented = finalEthVolumeOfDaiPool.sub(
      initialEthVolumeOfDaiPool
    );

    const expectedEthVolumeOfEclPoolIncremented = expectedEthReceivedFromEclPool;

    const expectedEthVolumeOfDaiPoolIncremented = expectedEthReceivedFromDaiPool;

    assert.equal(
      actualEthVolumeOfEclPoolIncremented.toString(),
      expectedEthVolumeOfEclPoolIncremented.toString(),
      "ethVolumeOfEclPool incorrectly incremented"
    );

    assert.equal(
      actualEthVolumeOfDaiPoolIncremented.toString(),
      expectedEthVolumeOfDaiPoolIncremented.toString(),
      "ethVolumeOfDaiPool incorrectly incremented"
    );
  });

  it("buyDai correctly increments ethVolumeOfDaiPool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialEthVolumeOfDaiPool = await eclipseumInstance.ethVolumeOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const ethToSpend = new BN("1").mul(decimalFactor);
    const minDaiToReceive = new BN("0");

    await eclipseumInstance.buyDai(minDaiToReceive, validDeadline, {
      from: accounts[0],
      value: ethToSpend,
    });

    const finalEthVolumeOfDaiPool = await eclipseumInstance.ethVolumeOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const actualEthVolumeOfDaiPoolIncremented = finalEthVolumeOfDaiPool.sub(
      initialEthVolumeOfDaiPool
    );

    const expectedEthVolumeOfDaiPoolIncremented = ethToSpend;

    assert.equal(
      actualEthVolumeOfDaiPoolIncremented.toString(),
      expectedEthVolumeOfDaiPoolIncremented.toString(),
      "ethVolumeOfDaiPool incorrectly incremented"
    );
  });

  it("sellDai correctly increments ethVolumeOfDaiPool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const initialUserEthBalance = new BN(
      await web3.eth.getBalance(accounts[0])
    );

    const initialEthVolumeOfDaiPool = await eclipseumInstance.ethVolumeOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const daiToSell = new BN("10").mul(decimalFactor);

    const receipt1 = await daiInstance.approve(
      eclipseumInstance.address,
      daiToSell,
      {
        from: accounts[0],
      }
    );

    const gasUsed1 = new BN(receipt1.receipt.gasUsed);
    const ethUsedForGas1 = gasUsed1.mul(gasPrice);

    const minEthToReceive = new BN("0");

    const receipt2 = await eclipseumInstance.sellDai(
      daiToSell,
      minEthToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const gasUsed2 = new BN(receipt2.receipt.gasUsed);
    const ethUsedForGas2 = gasUsed2.mul(gasPrice);

    const ethUsedForGas = ethUsedForGas1.add(ethUsedForGas2);

    const finalUserEthBalance = new BN(await web3.eth.getBalance(accounts[0]));

    const ethReceivedByUser = finalUserEthBalance
      .sub(initialUserEthBalance)
      .add(ethUsedForGas);

    const finalEthVolumeOfDaiPool = await eclipseumInstance.ethVolumeOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const actualEthVolumeOfDaiPoolIncremented = finalEthVolumeOfDaiPool.sub(
      initialEthVolumeOfDaiPool
    );

    const expectedEthVolumeOfDaiPoolIncremented = ethReceivedByUser;

    assert.equal(
      actualEthVolumeOfDaiPoolIncremented.toString(),
      expectedEthVolumeOfDaiPoolIncremented.toString(),
      "ethVolumeOfDaiPool incorrectly incremented"
    );
  });

  it("buyEcl reverts when minEclToReceive is not satisfied", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      { from: accounts[0] }
    );

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      { from: accounts[0] }
    );

    const expectedEclToReceive = applyTransactionFee(
      calcBOut(
        initialEthBalanceOfEclPool,
        initialEclBalanceOfEclPool,
        ethToSpend
      )
    );

    const minEclToReceive = expectedEclToReceive.add(new BN("1"));

    await truffleAssert.reverts(
      eclipseumInstance.buyEcl(minEclToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Unable to send the minimum quantity of ECL to receive."
    );
  });

  it("sellEcl reverts when minEthToReceive is not satisfied", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      { from: accounts[0] }
    );

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      { from: accounts[0] }
    );

    const expectedEthToReceive = applyTransactionFee(
      calcBOut(
        initialEclBalanceOfEclPool,
        initialEthBalanceOfEclPool,
        eclToSell
      )
    );

    const minEthToReceive = expectedEthToReceive.add(new BN("1"));

    await truffleAssert.reverts(
      eclipseumInstance.sellEcl(eclToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "Unable to send the minimum quantity of ETH to receive."
    );
  });

  it("softSellEcl reverts when minEthToReceive is not satisfied", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEclCirculatingSupply = await eclipseumInstance.circulatingSupply.call(
      {
        from: accounts[0],
      }
    );

    const expectedEthReceivedFromEclPool = applyTransactionFee(
      eclToSell.mul(initialEthBalanceOfEclPool).div(initialEclCirculatingSupply)
    );

    const expectedEthReceivedFromDaiPool = applyTransactionFee(
      eclToSell.mul(initialEthBalanceOfDaiPool).div(initialEclCirculatingSupply)
    );

    const expectedEthReceived = expectedEthReceivedFromEclPool.add(
      expectedEthReceivedFromDaiPool
    );

    const minEthToReceive = expectedEthReceived.add(new BN("1"));
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
      "Unable to send the minimum quantity of ETH to receive."
    );
  });

  it("softSellEcl reverts when minDaiToReceive is not satisfied", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);

    const initialDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEclCirculatingSupply = await eclipseumInstance.circulatingSupply.call(
      {
        from: accounts[0],
      }
    );

    const expectedDaiReceivedFromDaiPool = applyTransactionFee(
      eclToSell.mul(initialDaiBalanceOfDaiPool).div(initialEclCirculatingSupply)
    );

    const minDaiToReceive = expectedDaiReceivedFromDaiPool.add(new BN("1"));
    const minEthToReceive = new BN("0");

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
      "Unable to send the minimum quantity of DAI to receive."
    );
  });

  it("buyDai reverts when minEthToReceive is not satisfied", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const initialDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const expectedDaiToReceive = applyTransactionFee(
      calcBOut(
        initialEthBalanceOfDaiPool,
        initialDaiBalanceOfDaiPool,
        ethToSpend
      )
    );

    const minDaiToReceive = expectedDaiToReceive.add(new BN("1"));

    await truffleAssert.reverts(
      eclipseumInstance.buyDai(minDaiToReceive, validDeadline, {
        from: accounts[0],
        value: ethToSpend,
      }),
      "Unable to send the minimum quantity of DAI to receive."
    );
  });

  it("sellDai reverts when minEthToReceive is not satisfied", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToSell = new BN("10").mul(decimalFactor);

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const initialDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool.call(
      {
        from: accounts[0],
      }
    );

    const expectedEthToReceive = applyTransactionFee(
      calcBOut(
        initialDaiBalanceOfDaiPool,
        initialEthBalanceOfDaiPool,
        daiToSell
      )
    );

    await daiInstance.approve(eclipseumInstance.address, daiToSell, {
      from: accounts[0],
    });

    const minEthToReceive = expectedEthToReceive.add(new BN("1"));

    await truffleAssert.reverts(
      eclipseumInstance.sellDai(daiToSell, minEthToReceive, validDeadline, {
        from: accounts[0],
      }),
      "Unable to send the minimum quantity of ETH to receive."
    );
  });

  it("buyDai transfers correct amount of ETH to ECL pool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      { from: accounts[0] }
    );

    const minEthToReceive = new BN("0");

    await eclipseumInstance.buyDai(minEthToReceive, validDeadline, {
      from: accounts[0],
      value: ethToSpend,
    });

    const finalEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      { from: accounts[0] }
    );

    const actualEthTransferredToEclPool = finalEthBalanceOfEclPool.sub(
      initialEthBalanceOfEclPool
    );

    const expectedEthTransferredToEclPool = ethToSpend
      .mul(new BN("15"))
      .div(new BN("10000"));

    assert.equal(
      actualEthTransferredToEclPool.toString(),
      expectedEthTransferredToEclPool.toString(),
      "Incorrect amount of ETH transferred to ECL pool"
    );
  });

  it("sellDai transfers correct amount of ETH to ECL pool", async () => {
    const eclipseumInstance = await Eclipseum.deployed();
    const daiInstance = await DAI.deployed();

    const daiToSell = new BN("10").mul(decimalFactor);

    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      { from: accounts[0] }
    );

    const initialEthBalanceOfDaiPool = await eclipseumInstance.ethBalanceOfDaiPool(
      { from: accounts[0] }
    );

    const initialDaiBalanceOfDaiPool = await eclipseumInstance.daiBalanceOfDaiPool(
      { from: accounts[0] }
    );

    await daiInstance.approve(eclipseumInstance.address, daiToSell, {
      from: accounts[0],
    });

    const minEthToReceive = new BN("0");

    await eclipseumInstance.sellDai(daiToSell, minEthToReceive, validDeadline, {
      from: accounts[0],
    });

    const finalEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      { from: accounts[0] }
    );

    const ethToReceiveBeforeFee = calcBOut(
      initialDaiBalanceOfDaiPool,
      initialEthBalanceOfDaiPool,
      daiToSell
    );

    const ethToReceiveAfterFee = applyTransactionFee(ethToReceiveBeforeFee);

    const expectedEthTransferredToEclPool = ethToReceiveBeforeFee
      .sub(ethToReceiveAfterFee)
      .div(new BN("2"));

    const actualEthTransferredToEclPool = finalEthBalanceOfEclPool.sub(
      initialEthBalanceOfEclPool
    );

    assert.equal(
      actualEthTransferredToEclPool.toString(),
      expectedEthTransferredToEclPool.toString(),
      "Incorrect amount of ETH transferred to ECL pool"
    );
  });

  it("buyEcl mints correct amount of ECL", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const ethToSpend = new BN("1").mul(decimalFactor);

    const initialEclTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const initialUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool(
      {
        from: accounts[0],
      }
    );
    const initialEthBalanceOfEclPool = await eclipseumInstance.ethBalanceOfEclPool(
      {
        from: accounts[0],
      }
    );

    const minEclToReceive = new BN("0");

    await eclipseumInstance.buyEcl(minEclToReceive, validDeadline, {
      from: accounts[0],
      value: ethToSpend,
    });

    const finalUserEclBalance = await eclipseumInstance.balanceOf.call(
      accounts[0]
    );

    const finalEclTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const eclReceivedByUser = finalUserEclBalance.sub(initialUserEclBalance);

    const expectedEclMinted = eclReceivedByUser
      .mul(new BN("7"))
      .div(new BN("6"))
      .add(new BN("1"));

    const actualEclMinted = finalEclTotalSupply.sub(initialEclTotalSupply);

    assert.equal(
      actualEclMinted.toString(),
      expectedEclMinted.toString(),
      "buyEcl did not mint the correct amount of ECL."
    );
  });

  it("sellEcl burns the correct amount of ECL", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);

    const initialEclTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const minEthToReceive = new BN("0");

    await eclipseumInstance.sellEcl(eclToSell, minEthToReceive, validDeadline, {
      from: accounts[0],
    });

    const finalEclTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const actualEclBurned = initialEclTotalSupply.sub(finalEclTotalSupply);

    const expectedEclBurned = eclToSell.mul(new BN("7")).div(new BN("6"));

    assert.equal(
      actualEclBurned.toString(),
      expectedEclBurned.toString(),
      "sellEcl did not burn the correct amount of ECL."
    );
  });

  it("softSellEcl burns the correct amount of ECL", async () => {
    const eclipseumInstance = await Eclipseum.deployed();

    const eclToSell = new BN("10").mul(decimalFactor);

    const initialEclTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const initialEclBalanceOfEclPool = await eclipseumInstance.eclBalanceOfEclPool.call(
      {
        from: accounts[0],
      }
    );

    const initialEclCirculatingSupply = await eclipseumInstance.circulatingSupply.call(
      { from: accounts[0] }
    );

    const minEthToReceive = new BN("0");
    const minDaiToReceive = new BN("0");

    await eclipseumInstance.softSellEcl(
      eclToSell,
      minEthToReceive,
      minDaiToReceive,
      validDeadline,
      {
        from: accounts[0],
      }
    );

    const finalEclTotalSupply = await eclipseumInstance.totalSupply.call({
      from: accounts[0],
    });

    const actualEclBurned = initialEclTotalSupply.sub(finalEclTotalSupply);

    const expectedEclBurned = applyTransactionFee(
      eclToSell.mul(initialEclBalanceOfEclPool).div(initialEclCirculatingSupply)
    ).add(eclToSell);

    assert.equal(
      actualEclBurned.toString(),
      expectedEclBurned.toString(),
      "softSellEcl did not burn the correct amount of ECL."
    );
  });
});
