const Eclipseum = artifacts.require("Eclipseum");
const DAI = artifacts.require("DAI");

module.exports = (deployer) => {
  deployer.deploy(DAI).then(function() {
    const daiAddress = DAI.address;
    const weiToDeploy = web3.utils.toWei("0.3", "ether");
    return deployer.deploy(Eclipseum, daiAddress, { value: weiToDeploy });
  });
};
